/**
 * Worker BolaNoBrasil - busca jogos na football-data.org e (por enquanto) só valida o fetch.
 * - Node 20+ já tem fetch nativo (não usa node-fetch)
 * - Sempre envia X-Auth-Token com FOOTBALL_DATA_API_KEY
 */

const { Client } = require("pg");

function normBase(url) {
  const u = (url || "").trim() || "https://api.football-data.org/v4";
  // remove barras finais
  return u.replace(/\/+$/, "");
}

const API_BASE = normBase(process.env.FOOTBALL_API_BASE_URL || process.env.FOOTBALL_API_BASE || "https://api.football-data.org/v4");
const API_KEY = (process.env.FOOTBALL_DATA_API_KEY || "").trim();

const INTERVAL_MINUTES = Number(process.env.WORKER_INTERVAL_MINUTES || 30);
const BRASILEIRAO = (process.env.BRASILEIRAO_CODE || "BSA").trim();
const CHAMPIONS = (process.env.CHAMPIONS_CODE || "DESATIVADO").trim();
const DATABASE_URL = process.env.DATABASE_URL || "";

const season = new Date().getFullYear(); // pega automaticamente o ano atual

console.log(`[worker] iniciado. intervalo=${INTERVAL_MINUTES} min`);
console.log(`[worker] usando season=${season}`);
console.log(`[worker] API_BASE=${API_BASE}`);
console.log(`[worker] BRASILEIRAO=${BRASILEIRAO} / CHAMPIONS=${CHAMPIONS}`);
console.log(`[worker] API_KEY presente? ${API_KEY ? "SIM" : "NÃO"}`);

async function fetchText(path) {
  if (!API_KEY) throw new Error("FOOTBALL_DATA_API_KEY vazio/ausente.");

  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Auth-Token": API_KEY,
      "Accept": "application/json",
      // Alguns provedores gostam de um UA
      "User-Agent": "BolaNoBrasil/1.0 (worker)"
    },
    // evita cache “estranho”
    cache: "no-store",
  });

  const txt = await res.text();

  if (!res.ok) {
    // Log bem explícito
    console.error(`[worker] ERRO HTTP ${res.status} em ${url}`);
    console.error(`[worker] RESPOSTA: ${txt.slice(0, 600)}`);
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = txt;
    err.url = url;
    throw err;
  }

  return txt;
}

async function pingPostgres() {
  if (!DATABASE_URL) {
    console.log("[worker] DATABASE_URL vazio — pulando teste do Postgres.");
    return;
  }
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  await client.query("SELECT 1;");
  await client.end();
  console.log("[worker] conectado ao Postgres (SELECT 1 OK).");
}

async function cicloCompeticao(code) {
  console.log(`[worker] buscando ${code} season=${season}`);

  // endpoint oficial:
  // /competitions/{code}/matches?season=YYYY
  const txt = await fetchText(`/competitions/${encodeURIComponent(code)}/matches?season=${encodeURIComponent(season)}`);

  const json = JSON.parse(txt);

  const total = Array.isArray(json.matches) ? json.matches.length : 0;
  console.log(`[worker] ${code}: ${total} jogos encontrados`);

  return json;
}

async function ciclo() {
  try {
    await pingPostgres();

    const bsa = await cicloCompeticao(BRASILEIRAO);

    if (CHAMPIONS && CHAMPIONS !== "DESATIVADO") {
      await cicloCompeticao(CHAMPIONS);
    } else {
      console.log("[worker] Champions desativado.");
    }

    console.log("[worker] ciclo OK");
    return true;
  } catch (e) {
    console.error(`[worker] erro no ciclo: ${e.message}`);
    // Se for 403, é sempre chave/plano/headers/URL — e agora vamos ver a URL + resposta
    return false;
  }
}

// roda agora e depois agenda
(async () => {
  await ciclo();
  const ms = Math.max(1, INTERVAL_MINUTES) * 60 * 1000;
  setInterval(ciclo, ms);
})();
