// Coleta e normaliza manchetes de feeds RSS de futebol brasileiro.
// CommonJS — consumido pelo worker.js. Sem dependências externas (parser leve).
//
// Exporta coletarNoticiasRSS({ limit, maxIdadeHoras }) -> [{ title, summary,
// link, source, club, published }]  (filtrado para assuntos da Série A).

// Feeds curados de futebol (evita o feed geral do ge, que mistura sub-17,
// outros esportes e futebol europeu — gerava ruído demais no filtro).
const FEEDS = [
  { url: "https://www.gazetaesportiva.com/feed/", source: "Gazeta Esportiva" },
  { url: "https://trivela.com.br/feed/", source: "Trivela" },
];

// Clube canônico -> palavras-chave (em minúsculas, sem acento).
const CLUBES = {
  Palmeiras: ["palmeiras", "verdao"],
  Flamengo: ["flamengo", "mengao"],
  Fluminense: ["fluminense", "tricolor carioca"],
  "Athletico-PR": ["athletico", "atletico paranaense", "furacao", "athletico-pr"],
  Bragantino: ["bragantino", "massa bruta"],
  Coritiba: ["coritiba", "coxa"],
  "São Paulo": ["sao paulo", "spfc", "tricolor paulista"],
  Bahia: ["bahia"],
  Cruzeiro: ["cruzeiro", "raposa"],
  Botafogo: ["botafogo", "glorioso"],
  Vitória: ["vitoria", "leao baiano"],
  Internacional: ["internacional", "colorado", "inter de porto alegre"],
  Grêmio: ["gremio", "tricolor gaucho", "imortal"],
  "Atlético-MG": ["atletico-mg", "atletico mineiro", "atletico-mineiro", "atletico mg"],
  Corinthians: ["corinthians", "timao"],
  Vasco: ["vasco", "gigante da colina", "cruzmaltino"],
  Santos: ["santos fc", "santos "],
  Mirassol: ["mirassol"],
  Remo: ["clube do remo"],
  Chapecoense: ["chapecoense", "chape"],
};

function semAcento(s = "") {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function decodeEntidades(s = "") {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ") // remove tags HTML
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairTag(bloco, tag) {
  const m = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decodeEntidades(m[1]) : "";
}

// Detecta o clube; se mais de um clube for citado (ex.: jogo entre dois), retorna
// null (ambíguo) — o item continua relevante, mas sem rótulo fixo de clube.
function detectarClube(texto) {
  const t = semAcento(texto);
  const achados = [];
  for (const [clube, kws] of Object.entries(CLUBES)) {
    if (kws.some((k) => t.includes(k))) achados.push(clube);
  }
  if (achados.length === 1) return achados[0];
  return null; // 0 = irrelevante (filtrado fora), >1 = ambíguo
}

function temClubeSerieA(texto) {
  const t = semAcento(texto);
  return Object.values(CLUBES).some((kws) => kws.some((k) => t.includes(k)));
}

async function lerFeed({ url, source }) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BolaNoBrasil/1.0 (worker)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[rss] ${source} HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const blocos = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    return blocos.map((b) => ({
      title: extrairTag(b, "title"),
      link: extrairTag(b, "link"),
      summary: extrairTag(b, "description"),
      pubDate: extrairTag(b, "pubDate"),
      source,
    }));
  } catch (e) {
    console.warn(`[rss] falha em ${source}: ${e.message}`);
    return [];
  }
}

async function coletarNoticiasRSS({ limit = 40, maxIdadeHoras = 48 } = {}) {
  const listas = await Promise.all(FEEDS.map(lerFeed));
  const brutos = listas.flat();

  const agora = Date.now();
  const vistos = new Set();
  const out = [];

  for (const item of brutos) {
    if (!item.title || !item.link) continue;

    const texto = `${item.title} ${item.summary}`;
    if (!temClubeSerieA(texto)) continue; // só assuntos da Série A

    const chave = semAcento(item.title).replace(/[^a-z0-9]+/g, " ").trim();
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    // Filtro de recência (quando há data válida).
    let ts = item.pubDate ? Date.parse(item.pubDate) : NaN;
    if (!Number.isNaN(ts) && agora - ts > maxIdadeHoras * 3600 * 1000) continue;

    out.push({
      title: item.title,
      summary: item.summary,
      link: item.link,
      source: item.source,
      club: detectarClube(texto),
      published: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
    });
  }

  // Mais recentes primeiro (itens sem data vão para o fim).
  out.sort((a, b) => (Date.parse(b.published || 0) || 0) - (Date.parse(a.published || 0) || 0));

  return out.slice(0, limit);
}

module.exports = { coletarNoticiasRSS, FEEDS };
