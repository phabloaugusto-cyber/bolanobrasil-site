/**
 * Worker BolaNoBrasil
 * --------------------
 * Rotina diária que:
 *  1) busca classificação, artilheiros e jogos na football-data.org
 *  2) faz upsert desses dados no Supabase (tabelas football_*)
 *  3) ao detectar uma rodada recém-encerrada, gera um resumo com Claude e
 *     publica como post (type=analise) no Supabase — de forma idempotente
 *  4) dispara revalidação das páginas afetadas no site (/api/revalidate)
 *
 * Node 20+ tem fetch nativo. Roda em loop, verificando a cada tick se já é a
 * hora (UTC) configurada em DAILY_RUN_HOUR para executar o ciclo do dia.
 *
 * Modo manual: `node worker.js --once` executa um único ciclo e encerra.
 */

const { Client } = require("pg");
const { getSupabaseAdminClient } = require("./lib/supabase-admin");
const {
  gerarResumoRodada,
  gerarNoticiaRodada,
  gerarHumorRodada,
  gerarNoticiasDoDia,
  slugify,
} = require("./lib/gerar-resumo-rodada");
const { coletarNoticiasRSS } = require("./lib/noticias-rss");

function normBase(url) {
  const u = (url || "").trim() || "https://api.football-data.org/v4";
  return u.replace(/\/+$/, "");
}

const API_BASE = normBase(
  process.env.FOOTBALL_API_BASE_URL ||
    process.env.API_BASE ||
    "https://api.football-data.org/v4"
);
const API_KEY = (
  process.env.FOOTBALL_DATA_API_KEY ||
  process.env.API_KEY ||
  ""
).trim();

const INTERVAL_MINUTES = Number(process.env.WORKER_INTERVAL_MINUTES || 30);
const DAILY_RUN_HOUR = Number(process.env.DAILY_RUN_HOUR || 11); // hora UTC
const NEWS_RUN_HOUR = Number(process.env.NEWS_RUN_HOUR || 16); // 16 UTC = 13h BRT
const BRASILEIRAO = (process.env.BRASILEIRAO_CODE || "BSA").trim();
const SEASON = Number(process.env.SEASON || new Date().getFullYear());
const DATABASE_URL = process.env.DATABASE_URL || "";
const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || "";

const ONCE = process.argv.includes("--once");
const NOTICIAS_ONCE = process.argv.includes("--noticias-once");

console.log(`[worker] iniciado. once=${ONCE} intervalo=${INTERVAL_MINUTES}min horaUTC=${DAILY_RUN_HOUR}`);
console.log(`[worker] season=${SEASON} comp=${BRASILEIRAO} API_BASE=${API_BASE}`);
console.log(`[worker] API_KEY presente? ${API_KEY ? "SIM" : "NÃO"}`);

// ---------------------------------------------------------------------------
// HTTP helper para a football-data.org
// ---------------------------------------------------------------------------
async function fetchJson(path) {
  if (!API_KEY) throw new Error("FOOTBALL_DATA_API_KEY/API_KEY vazio.");

  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Auth-Token": API_KEY,
      Accept: "application/json",
      "User-Agent": "BolaNoBrasil/1.0 (worker)",
    },
    cache: "no-store",
  });

  const txt = await res.text();
  if (!res.ok) {
    console.error(`[worker] ERRO HTTP ${res.status} em ${url}: ${txt.slice(0, 400)}`);
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return JSON.parse(txt);
}

async function pingPostgres() {
  if (!DATABASE_URL) return;
  try {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    await client.query("SELECT 1;");
    await client.end();
    console.log("[worker] Postgres OK.");
  } catch (e) {
    console.warn(`[worker] Postgres indisponível: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Coleta + upsert no Supabase
// ---------------------------------------------------------------------------
async function coletarClassificacao(supabase) {
  const json = await fetchJson(
    `/competitions/${BRASILEIRAO}/standings?season=${SEASON}`
  );
  const matchday = json?.season?.currentMatchday ?? null;

  const { error } = await supabase.from("football_standings").upsert(
    {
      competition: BRASILEIRAO,
      season: SEASON,
      matchday,
      table_json: json.standings || [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "competition,season" }
  );
  if (error) throw new Error(`upsert standings: ${error.message}`);
  console.log(`[worker] classificação salva (matchday atual=${matchday}).`);
  return { matchday, standings: json.standings || [] };
}

async function coletarArtilheiros(supabase) {
  let json;
  try {
    json = await fetchJson(`/competitions/${BRASILEIRAO}/scorers?season=${SEASON}`);
  } catch (e) {
    console.warn(`[worker] artilheiros indisponíveis (${e.message}) — pulando.`);
    return { scorers: [] };
  }
  const { error } = await supabase.from("football_scorers").upsert(
    {
      competition: BRASILEIRAO,
      season: SEASON,
      scorers_json: json.scorers || [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "competition,season" }
  );
  if (error) throw new Error(`upsert scorers: ${error.message}`);
  console.log(`[worker] artilheiros salvos (${(json.scorers || []).length}).`);
  return { scorers: json.scorers || [] };
}

async function coletarJogos(supabase) {
  const json = await fetchJson(
    `/competitions/${BRASILEIRAO}/matches?season=${SEASON}`
  );
  const matches = Array.isArray(json.matches) ? json.matches : [];

  if (matches.length) {
    const rows = matches.map((m) => ({
      api_id: m.id,
      competition: BRASILEIRAO,
      season: SEASON,
      matchday: m.matchday ?? null,
      utc_date: m.utcDate || null,
      status: m.status || null,
      home_team: m.homeTeam?.name || null,
      away_team: m.awayTeam?.name || null,
      home_crest: m.homeTeam?.crest || null,
      away_crest: m.awayTeam?.crest || null,
      home_score: m.score?.fullTime?.home ?? null,
      away_score: m.score?.fullTime?.away ?? null,
      raw_json: m,
      updated_at: new Date().toISOString(),
    }));

    // upsert em lotes para não estourar payload
    for (let i = 0; i < rows.length; i += 200) {
      const lote = rows.slice(i, i + 200);
      const { error } = await supabase
        .from("football_matches")
        .upsert(lote, { onConflict: "api_id" });
      if (error) throw new Error(`upsert matches: ${error.message}`);
    }
  }
  console.log(`[worker] jogos salvos (${matches.length}).`);
  return { matches };
}

// ---------------------------------------------------------------------------
// Detecção da última rodada totalmente encerrada
// ---------------------------------------------------------------------------
function ultimaRodadaEncerrada(matches) {
  const porRodada = new Map();
  for (const m of matches) {
    if (m.matchday == null) continue;
    if (!porRodada.has(m.matchday)) porRodada.set(m.matchday, []);
    porRodada.get(m.matchday).push(m);
  }
  let maior = null;
  for (const [md, jogos] of porRodada) {
    const todosFinalizados =
      jogos.length > 0 && jogos.every((j) => j.status === "FINISHED");
    if (todosFinalizados && (maior == null || md > maior)) maior = md;
  }
  return maior;
}

// ---------------------------------------------------------------------------
// Estado de automação (idempotência)
// ---------------------------------------------------------------------------
const STATE_KEY = `resumo:${BRASILEIRAO}:${SEASON}`;

async function getUltimaRodadaResumida(supabase) {
  const { data, error } = await supabase
    .from("automation_state")
    .select("value")
    .eq("key", STATE_KEY)
    .maybeSingle();
  if (error) {
    console.warn(`[worker] leitura automation_state: ${error.message}`);
    return null;
  }
  return data?.value?.lastMatchday ?? null;
}

async function setUltimaRodadaResumida(supabase, matchday) {
  const { error } = await supabase.from("automation_state").upsert(
    {
      key: STATE_KEY,
      value: { lastMatchday: matchday },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) console.warn(`[worker] gravação automation_state: ${error.message}`);
}

// Checagem extra de idempotência direto na tabela posts.
async function jaExistePostDaRodada(supabase, matchday) {
  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .eq("type", "analise")
    .eq("round", matchday)
    .is("club", null)
    .limit(1);
  if (error) {
    console.warn(`[worker] checagem posts: ${error.message}`);
    return false;
  }
  return (data || []).length > 0;
}

async function jaExisteNoticiaDaRodada(supabase, matchday) {
  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .eq("type", "noticia")
    .eq("round", matchday)
    .is("club", null)
    .limit(1);
  if (error) {
    console.warn(`[worker] checagem notícia: ${error.message}`);
    return false;
  }
  return (data || []).length > 0;
}

async function jaExisteHumorDaRodada(supabase, matchday) {
  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .eq("type", "humor")
    .eq("round", matchday)
    .is("club", null)
    .limit(1);
  if (error) {
    console.warn(`[worker] checagem humor: ${error.message}`);
    return false;
  }
  return (data || []).length > 0;
}

// ---------------------------------------------------------------------------
// Geração + publicação do resumo
// ---------------------------------------------------------------------------
async function gerarEPublicarResumo(supabase, { matchday, matches, standings, scorers }) {
  const jogosDaRodada = matches.filter((m) => m.matchday === matchday);
  let publicou = false;

  // 1) Análise (cronista, texto longo) — type=analise
  if (await jaExistePostDaRodada(supabase, matchday)) {
    console.log(`[worker] rodada ${matchday} já tem análise — pulando.`);
  } else {
    console.log(`[worker] gerando análise da rodada ${matchday} com Claude...`);
    const resumo = await gerarResumoRodada({
      matchday,
      season: SEASON,
      matches: jogosDaRodada,
      standings,
      scorers,
    });

    const { error } = await supabase.from("posts").insert({
      title: resumo.title,
      slug: resumo.slug,
      excerpt: resumo.excerpt,
      content: resumo.content,
      type: "analise",
      category: "Análise",
      competition: BRASILEIRAO,
      club: null,
      round: matchday,
      status: "published",
      show_on_home: true,
      featured: true,
      published_at: new Date().toISOString(),
    });
    if (error) throw new Error(`insert análise: ${error.message}`);

    console.log(`[worker] análise publicada: "${resumo.title}" (slug=${resumo.slug}).`);
    publicou = true;
  }

  // 2) Notícia (hard news, texto curto) — type=noticia
  if (await jaExisteNoticiaDaRodada(supabase, matchday)) {
    console.log(`[worker] rodada ${matchday} já tem notícia — pulando.`);
  } else {
    console.log(`[worker] gerando notícia da rodada ${matchday} com Claude...`);
    const noticia = await gerarNoticiaRodada({
      matchday,
      season: SEASON,
      matches: jogosDaRodada,
      standings,
      scorers,
    });

    const { error } = await supabase.from("posts").insert({
      title: noticia.title,
      slug: noticia.slug,
      excerpt: noticia.excerpt,
      content: noticia.content,
      type: "noticia",
      category: "Notícias do Dia",
      competition: BRASILEIRAO,
      club: null,
      round: matchday,
      status: "published",
      show_on_home: true,
      featured: false,
      published_at: new Date().toISOString(),
    });
    if (error) throw new Error(`insert notícia: ${error.message}`);

    console.log(`[worker] notícia publicada: "${noticia.title}" (slug=${noticia.slug}).`);
    publicou = true;
  }

  // 3) Humor na Rodada (crônica bem-humorada) — type=humor
  if (await jaExisteHumorDaRodada(supabase, matchday)) {
    console.log(`[worker] rodada ${matchday} já tem humor — pulando.`);
  } else {
    console.log(`[worker] gerando humor da rodada ${matchday} com Claude...`);
    const humor = await gerarHumorRodada({
      matchday,
      season: SEASON,
      matches: jogosDaRodada,
      standings,
      scorers,
    });

    const { error } = await supabase.from("posts").insert({
      title: humor.title,
      slug: humor.slug,
      excerpt: humor.excerpt,
      content: humor.content,
      type: "humor",
      category: "Humor na Rodada",
      competition: BRASILEIRAO,
      club: null,
      round: matchday,
      status: "published",
      show_on_home: true,
      featured: false,
      published_at: new Date().toISOString(),
    });
    if (error) throw new Error(`insert humor: ${error.message}`);

    console.log(`[worker] humor publicado: "${humor.title}" (slug=${humor.slug}).`);
    publicou = true;
  }

  await setUltimaRodadaResumida(supabase, matchday);
  return publicou;
}

// ---------------------------------------------------------------------------
// Revalidação das páginas no site
// ---------------------------------------------------------------------------
async function revalidar(paths) {
  if (!REVALIDATION_SECRET) {
    console.warn("[worker] REVALIDATION_SECRET ausente — pulando revalidate.");
    return;
  }
  try {
    const res = await fetch(`${SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: REVALIDATION_SECRET, paths }),
    });
    const body = await res.text();
    console.log(`[worker] revalidate ${res.status}: ${body.slice(0, 160)}`);
  } catch (e) {
    console.warn(`[worker] revalidate falhou: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Notícias do Dia (curadoria de RSS + reescrita) — idempotente por dia.
// ---------------------------------------------------------------------------
async function noticiasJaFeitasHoje(supabase, diaUTC) {
  const { data, error } = await supabase
    .from("automation_state")
    .select("value")
    .eq("key", `noticias-rss:${diaUTC}`)
    .maybeSingle();
  if (error) {
    console.warn(`[worker] leitura estado notícias: ${error.message}`);
    return false;
  }
  return !!data;
}

async function marcarNoticiasFeitas(supabase, diaUTC, total) {
  const { error } = await supabase.from("automation_state").upsert(
    {
      key: `noticias-rss:${diaUTC}`,
      value: { count: total },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) console.warn(`[worker] gravação estado notícias: ${error.message}`);
}

async function cicloNoticias(supabase) {
  const diaUTC = new Date().toISOString().slice(0, 10);

  if (await noticiasJaFeitasHoje(supabase, diaUTC)) {
    console.log(`[worker] Notícias do Dia (${diaUTC}) já geradas — pulando.`);
    return false;
  }

  console.log("[worker] coletando RSS para as Notícias do Dia...");
  const itens = await coletarNoticiasRSS({ limit: 40 });
  if (!itens.length) {
    console.log("[worker] nenhum candidato de RSS encontrado — pulando.");
    return false;
  }
  console.log(`[worker] ${itens.length} candidatos; gerando 3 notícias com Claude...`);

  const noticias = await gerarNoticiasDoDia(itens, { count: 3 });
  if (!noticias.length) {
    console.log("[worker] IA não retornou notícias — pulando.");
    return false;
  }

  let publicadas = 0;
  for (const nt of noticias) {
    const slug = `${slugify(nt.title)}-${diaUTC}`.slice(0, 120);
    const content = nt.source_url ? `${nt.content}\n\nFonte: ${nt.source_url}` : nt.content;

    const { error } = await supabase.from("posts").upsert(
      {
        title: nt.title,
        slug,
        excerpt: nt.excerpt,
        content,
        type: "noticia",
        category: "Notícias do Dia",
        competition: BRASILEIRAO,
        club: nt.club || null,
        round: null,
        status: "published",
        show_on_home: true,
        featured: false,
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) {
      console.warn(`[worker] insert notícia do dia falhou: ${error.message}`);
      continue;
    }
    publicadas++;
    console.log(`[worker] notícia do dia publicada: "${nt.title}" (slug=${slug}).`);
  }

  await marcarNoticiasFeitas(supabase, diaUTC, publicadas);
  return publicadas > 0;
}

// ---------------------------------------------------------------------------
// Ciclo completo
// ---------------------------------------------------------------------------
async function ciclo() {
  try {
    await pingPostgres();
    const supabase = getSupabaseAdminClient();

    const { standings } = await coletarClassificacao(supabase);
    const { scorers } = await coletarArtilheiros(supabase);
    const { matches } = await coletarJogos(supabase);

    let publicou = false;
    const encerrada = ultimaRodadaEncerrada(matches);
    if (encerrada != null) {
      const jaResumida = await getUltimaRodadaResumida(supabase);
      // >= (e não >) para que a última rodada encerrada seja reavaliada e
      // eventuais conteúdos faltantes (ex.: notícia) sejam gerados; a
      // idempotência por tipo evita publicar duplicado.
      if (jaResumida == null || encerrada >= jaResumida) {
        publicou = await gerarEPublicarResumo(supabase, {
          matchday: encerrada,
          matches,
          standings,
          scorers,
        });
      } else {
        console.log(`[worker] rodada ${encerrada} já resumida (estado=${jaResumida}).`);
      }
    } else {
      console.log("[worker] nenhuma rodada totalmente encerrada ainda.");
    }

    const paths = ["/", "/tabela", "/artilheiros", "/jogos"];
    if (publicou)
      paths.push("/analises", "/noticias-do-dia", "/humor-na-rodada", "/sitemap.xml");
    await revalidar(paths);

    console.log("[worker] ciclo OK");
    return true;
  } catch (e) {
    console.error(`[worker] erro no ciclo: ${e.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Agendamento
// ---------------------------------------------------------------------------
// Executa as Notícias do Dia e revalida as páginas afetadas.
async function rodarNoticias(supabase) {
  try {
    const pub = await cicloNoticias(supabase);
    if (pub) await revalidar(["/", "/noticias-do-dia", "/sitemap.xml"]);
    return pub;
  } catch (e) {
    console.error(`[worker] erro nas Notícias do Dia: ${e.message}`);
    return false;
  }
}

(async () => {
  // Teste manual só das notícias: `node worker.js --noticias-once`
  if (NOTICIAS_ONCE) {
    try {
      const supabase = getSupabaseAdminClient();
      await rodarNoticias(supabase);
      process.exit(0);
    } catch (e) {
      console.error(`[worker] erro: ${e.message}`);
      process.exit(1);
    }
  }

  if (ONCE) {
    const ok = await ciclo();
    process.exit(ok ? 0 : 1);
  }

  let ultimoDiaExecutado = null; // "YYYY-MM-DD" em UTC (ciclo de rodada)
  let ultimoDiaNoticias = null; // "YYYY-MM-DD" em UTC (Notícias do Dia)

  async function tick() {
    const now = new Date();
    const diaUTC = now.toISOString().slice(0, 10);
    const horaUTC = now.getUTCHours();

    if (horaUTC === DAILY_RUN_HOUR && ultimoDiaExecutado !== diaUTC) {
      ultimoDiaExecutado = diaUTC;
      console.log(`[worker] disparando ciclo diário (${diaUTC} ${horaUTC}h UTC)`);
      await ciclo();
    }

    if (horaUTC === NEWS_RUN_HOUR && ultimoDiaNoticias !== diaUTC) {
      ultimoDiaNoticias = diaUTC;
      console.log(`[worker] disparando Notícias do Dia (${diaUTC} ${horaUTC}h UTC)`);
      await rodarNoticias(getSupabaseAdminClient());
    }
  }

  // Roda um ciclo no boot (popula os dados imediatamente) e agenda os ticks.
  await ciclo();
  ultimoDiaExecutado = new Date().toISOString().slice(0, 10);

  // Gera as Notícias do Dia também no boot (idempotente por dia: só gera 1x/dia).
  await rodarNoticias(getSupabaseAdminClient());
  ultimoDiaNoticias = new Date().toISOString().slice(0, 10);

  const ms = Math.max(1, INTERVAL_MINUTES) * 60 * 1000;
  setInterval(tick, ms);
})();
