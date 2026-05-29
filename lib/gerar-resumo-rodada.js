// Geração automática do resumo de uma rodada do Brasileirão usando Claude.
// CommonJS — consumido pelo worker.js.
//
// Exporta gerarResumoRodada({ matchday, season, matches, standings, scorers })
// que retorna { title, excerpt, content, slug } pronto para virar um post.

const Anthropic = require("@anthropic-ai/sdk");

const MODEL = (process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6").trim();

// Bloco de estilo FIXO — vai no system com cache_control para baratear chamadas repetidas.
const ESTILO_EDITORIAL = `Você é o editor da Redação BolaNoBrasil, um site de futebol brasileiro.
Escreve análises de rodada do Campeonato Brasileiro Série A em português do Brasil,
no tom de cronista esportivo: parágrafos longos e fluidos, linguagem analítica e
equilibrada, sem sensacionalismo e sem inventar fatos. Você NUNCA inventa placares,
nomes ou estatísticas — usa apenas os dados fornecidos. Quando os dados forem
insuficientes para uma afirmação, você se mantém genérico em vez de fabricar.

Estrutura esperada da análise:
- Um parágrafo de abertura que dá o panorama geral da rodada.
- Parágrafos sobre os destaques (líderes, quem cresceu, quem decepcionou), sempre
  ancorados nos jogos e na classificação reais fornecidos.
- Menção aos artilheiros quando relevante.
- Um parágrafo de fechamento com a leitura do momento do campeonato.
Use entre 4 e 6 parágrafos. Cada parágrafo deve ter consistência factual com os dados.

Responda SEMPRE e SOMENTE com um objeto JSON válido (sem markdown, sem cercas de código),
no formato exato:
{
  "title": "string — manchete editorial, sem aspas internas",
  "excerpt": "string — resumo de 1 a 2 frases",
  "content": ["parágrafo 1", "parágrafo 2", "..."]
}`;

// Bloco de estilo FIXO para NOTÍCIA — tom de hard news (notícia factual).
const ESTILO_NOTICIA = `Você é repórter da Redação BolaNoBrasil, um site de futebol brasileiro.
Escreve NOTÍCIAS factuais sobre a rodada do Campeonato Brasileiro Série A em português do Brasil,
no estilo jornalístico de hard news: pirâmide invertida, parágrafos curtos e diretos,
linguagem objetiva e impessoal, sem opinião e sem sensacionalismo. Você NUNCA inventa placares,
nomes ou estatísticas — usa apenas os dados fornecidos. Quando os dados forem insuficientes
para uma afirmação, você se mantém genérico em vez de fabricar.

Estrutura esperada da notícia:
- Um lead (1º parágrafo) com o fato mais importante da rodada (o resultado/destaque principal,
  quem lidera e com quantos pontos), respondendo o quê, quem, quando.
- 2 a 3 parágrafos curtos com os demais resultados e fatos relevantes da rodada
  (outras partidas, mudanças na classificação, artilharia), em ordem de importância.
Use entre 3 e 4 parágrafos curtos no total. Cada parágrafo deve ter consistência factual com os dados.

Responda SEMPRE e SOMENTE com um objeto JSON válido (sem markdown, sem cercas de código),
no formato exato:
{
  "title": "string — manchete factual de notícia, sem aspas internas",
  "excerpt": "string — linha-fina de 1 a 2 frases",
  "content": ["parágrafo 1", "parágrafo 2", "..."]
}`;

// Bloco de estilo FIXO para HUMOR — crônica bem-humorada da rodada.
const ESTILO_HUMOR = `Você é o cronista de humor da Redação BolaNoBrasil, um site de futebol brasileiro.
Escreve a coluna "Humor na Rodada" sobre o Campeonato Brasileiro Série A em português do Brasil:
uma crônica leve, irônica e bem-humorada, no estilo da zoeira saudável da torcida brasileira,
com trocadilhos, exageros cômicos e tiradas espirituosas sobre o que rolou na rodada.

Regras importantes:
- O humor SEMPRE parte dos dados reais fornecidos (resultados, classificação, artilharia).
  Você NUNCA inventa placares, nomes, lances ou estatísticas — exagera no tom, não nos fatos.
- Zoeira do bom: provoca os times de forma divertida, sem xingamentos, sem ofensas pessoais,
  sem preconceito e sem apelar para baixaria. É para arrancar risada, não para humilhar.
- Quando os dados forem insuficientes para uma piada específica, mantém-se genérico.

Estrutura esperada:
- Abertura cômica com o "personagem" da rodada (quem se deu bem, quem se atrapalhou).
- Parágrafos com tiradas sobre os jogos e a tabela, sempre ancorados nos dados reais.
- Fechamento com uma piada ou provocação leve sobre o momento do campeonato.
Use entre 3 e 5 parágrafos.

Responda SEMPRE e SOMENTE com um objeto JSON válido (sem markdown, sem cercas de código),
no formato exato:
{
  "title": "string — manchete bem-humorada, sem aspas internas",
  "excerpt": "string — chamada engraçada de 1 a 2 frases",
  "content": ["parágrafo 1", "parágrafo 2", "..."]
}`;

function slugify(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

// Reduz os payloads da football-data.org ao essencial para o prompt (economia de tokens).
function resumirMatches(matches = []) {
  return matches
    .filter((m) => m && m.score)
    .map((m) => ({
      casa: m.homeTeam?.shortName || m.homeTeam?.name || "?",
      fora: m.awayTeam?.shortName || m.awayTeam?.name || "?",
      placar:
        m.status === "FINISHED" && m.score?.fullTime
          ? `${m.score.fullTime.home ?? "-"}x${m.score.fullTime.away ?? "-"}`
          : m.status,
    }));
}

function resumirStandings(standings = []) {
  // standings é o array de "standings" da API; pega a tabela TOTAL.
  const total =
    standings.find((s) => s.type === "TOTAL") || standings[0] || { table: [] };
  return (total.table || []).map((row) => ({
    pos: row.position,
    time: row.team?.shortName || row.team?.name || "?",
    pts: row.points,
    j: row.playedGames,
    sg: row.goalDifference,
  }));
}

function resumirScorers(scorers = []) {
  return scorers.slice(0, 8).map((s) => ({
    jogador: s.player?.name || "?",
    time: s.team?.shortName || s.team?.name || "?",
    gols: s.goals ?? 0,
  }));
}

// Helper genérico: chama o Claude com um system fixo e a mesma carga de dados,
// e devolve { title, excerpt, content } já validado. O slug fica a cargo de
// cada gerador (análise/notícia), que tem prefixo próprio.
async function gerarConteudoIA({
  sistema,
  instrucao,
  matchday,
  season,
  matches = [],
  standings = [],
  scorers = [],
}) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY ausente.");

  const client = new Anthropic({ apiKey });

  const dados = {
    rodada: matchday,
    temporada: season,
    jogos: resumirMatches(matches),
    classificacao: resumirStandings(standings),
    artilheiros: resumirScorers(scorers),
  };

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: sistema,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `${instrucao}\n\n${JSON.stringify(dados, null, 2)}`,
      },
    ],
  });

  const raw = (resp.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  let parsed;
  try {
    // Tolera eventuais cercas de código que o modelo possa adicionar.
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Resposta da IA não é JSON válido: ${raw.slice(0, 200)}`);
  }

  const paragrafos = Array.isArray(parsed.content)
    ? parsed.content.map((p) => String(p).trim()).filter(Boolean)
    : String(parsed.content || "")
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

  if (!parsed.title || paragrafos.length === 0) {
    throw new Error("Conteúdo da IA incompleto (sem título ou parágrafos).");
  }

  return {
    title: String(parsed.title).trim(),
    excerpt: String(parsed.excerpt || "").trim(),
    // O front-end separa o conteúdo por \n+.
    content: paragrafos.join("\n\n"),
  };
}

async function gerarResumoRodada({
  matchday,
  season,
  matches = [],
  standings = [],
  scorers = [],
}) {
  const { title, excerpt, content } = await gerarConteudoIA({
    sistema: ESTILO_EDITORIAL,
    instrucao: `Escreva a análise da ${matchday}ª rodada do Brasileirão ${season} com base nestes dados (JSON):`,
    matchday,
    season,
    matches,
    standings,
    scorers,
  });

  return {
    title,
    excerpt,
    content,
    slug: `${matchday}a-rodada-brasileirao-${season}-${slugify(title)}`.slice(0, 120),
  };
}

async function gerarNoticiaRodada({
  matchday,
  season,
  matches = [],
  standings = [],
  scorers = [],
}) {
  const { title, excerpt, content } = await gerarConteudoIA({
    sistema: ESTILO_NOTICIA,
    instrucao: `Escreva uma notícia factual sobre a ${matchday}ª rodada do Brasileirão ${season} com base nestes dados (JSON):`,
    matchday,
    season,
    matches,
    standings,
    scorers,
  });

  return {
    title,
    excerpt,
    content,
    slug: `${matchday}a-rodada-brasileirao-${season}-noticia-${slugify(title)}`.slice(
      0,
      120
    ),
  };
}

async function gerarHumorRodada({
  matchday,
  season,
  matches = [],
  standings = [],
  scorers = [],
}) {
  const { title, excerpt, content } = await gerarConteudoIA({
    sistema: ESTILO_HUMOR,
    instrucao: `Escreva a coluna "Humor na Rodada" sobre a ${matchday}ª rodada do Brasileirão ${season} com base nestes dados (JSON):`,
    matchday,
    season,
    matches,
    standings,
    scorers,
  });

  return {
    title,
    excerpt,
    content,
    slug: `${matchday}a-rodada-brasileirao-${season}-humor-${slugify(title)}`.slice(
      0,
      120
    ),
  };
}

// ---------------------------------------------------------------------------
// Notícias do Dia: cura + reescrita a partir de manchetes de RSS.
// ---------------------------------------------------------------------------

// Bloco de estilo FIXO (cacheável) para a curadoria/reescrita de notícias.
const ESTILO_NOTICIAS_DIA = `Você é editor de notícias da Redação BolaNoBrasil, um site de futebol brasileiro.
Recebe uma lista de manchetes e resumos coletados de portais esportivos (com fonte e URL)
e produz a seção "Notícias do Dia" sobre o Campeonato Brasileiro Série A, em português do Brasil.

Sua tarefa tem dois passos:
1) SELEÇÃO: escolha as notícias mais relevantes e atuais do dia entre os itens fornecidos,
   PRIORIZANDO CLUBES DIFERENTES da Série A (diversidade). Evite duas notícias do mesmo clube,
   a menos que não haja alternativa. Prefira fatos esportivos relevantes (jogos, mercado/contratações,
   bastidores, lesões, técnicos) e descarte itens irrelevantes ou que não sejam da Série A.
2) REESCRITA: para cada notícia escolhida, escreva uma versão própria da Redação BolaNoBrasil.

Regras de integridade (OBRIGATÓRIAS):
- Use SOMENTE os fatos presentes no título e no resumo do item escolhido. Você NUNCA inventa
  placares, números, datas, nomes ou declarações que não estejam no material fornecido.
- Quando o resumo for curto, mantenha o texto mais genérico em vez de fabricar detalhes.
- Reescreva com PALAVRAS PRÓPRIAS — não copie frases do original.
- Cite a fonte no corpo do texto (ex.: "Segundo a Gazeta Esportiva, ...").
- Em "source_url", copie EXATAMENTE a URL do item que você escolheu.
- Escreva de 2 a 4 parágrafos curtos por notícia. Tom jornalístico, objetivo, sem sensacionalismo.

Responda SOMENTE com um objeto JSON válido (sem markdown, sem cercas de código), no formato:
{
  "noticias": [
    {
      "title": "manchete própria, sem aspas internas",
      "excerpt": "linha-fina de 1 a 2 frases",
      "content": "texto da notícia com parágrafos separados por uma linha em branco",
      "club": "clube principal da notícia (ou string vazia se geral)",
      "source_url": "a URL exata do item escolhido"
    }
  ]
}`;

const SCHEMA_NOTICIAS = {
  type: "object",
  additionalProperties: false,
  properties: {
    noticias: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          club: { type: "string" },
          source_url: { type: "string" },
        },
        required: ["title", "excerpt", "content", "club", "source_url"],
      },
    },
  },
  required: ["noticias"],
};

async function gerarNoticiasDoDia(itens = [], { count = 3 } = {}) {
  if (!Array.isArray(itens) || itens.length === 0) return [];

  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY ausente.");
  const client = new Anthropic({ apiKey });

  // Candidatos enxutos — só o essencial para a curadoria (economia de tokens).
  const candidatos = itens.map((it, i) => ({
    n: i + 1,
    titulo: it.title,
    resumo: it.summary || "",
    fonte: it.source,
    url: it.link,
    clube: it.club || "",
  }));

  const userText = `Escolha as ${count} notícias mais relevantes do dia (clubes diferentes quando possível) e escreva a versão BolaNoBrasil de cada uma, a partir desta lista de itens coletados (JSON):\n\n${JSON.stringify(
    candidatos,
    null,
    2
  )}`;

  const base = {
    model: MODEL,
    max_tokens: 4000,
    system: [
      { type: "text", text: ESTILO_NOTICIAS_DIA, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userText }],
  };

  let resp;
  try {
    // Saída estruturada confiável (constrange o formato ao schema).
    resp = await client.messages.create({
      ...base,
      output_config: { format: { type: "json_schema", schema: SCHEMA_NOTICIAS } },
    });
  } catch (e) {
    // Fallback: se o ambiente/modelo não aceitar output_config, usa JSON no texto.
    console.warn(`[noticias] output_config indisponível (${e.message}); usando JSON no texto.`);
    resp = await client.messages.create(base);
  }

  const raw = (resp.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  let parsed;
  try {
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Resposta da IA não é JSON válido: ${raw.slice(0, 200)}`);
  }

  const arr = Array.isArray(parsed?.noticias) ? parsed.noticias : [];
  return arr
    .slice(0, count)
    .map((nt) => ({
      title: String(nt.title || "").trim(),
      excerpt: String(nt.excerpt || "").trim(),
      // Front-end separa por \n+. Normaliza parágrafos.
      content: String(nt.content || "")
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .join("\n\n"),
      club: String(nt.club || "").trim() || null,
      source_url: String(nt.source_url || "").trim() || null,
    }))
    .filter((nt) => nt.title && nt.content);
}

module.exports = {
  gerarResumoRodada,
  gerarNoticiaRodada,
  gerarHumorRodada,
  gerarNoticiasDoDia,
  slugify,
};
