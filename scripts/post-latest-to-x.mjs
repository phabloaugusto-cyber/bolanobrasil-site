import fs from "fs/promises";
import path from "path";
import process from "process";
import { TwitterApi } from "twitter-api-v2";

const SITE_URL = process.env.SITE_URL || "https://bolanobrasil.com.br";
const FEED_URL = `${SITE_URL}/api/social/latest`;

const STATE_PATH = path.join(process.cwd(), "storage", "social-last-posted.json");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Faltando variável de ambiente: ${name}`);
  }
  return value;
}

async function readState() {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { lastSlug: null, lastUrl: null, lastPostedAt: null };
  }
}

async function writeState(state) {
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

async function fetchLatest() {
  const res = await fetch(FEED_URL, {
    headers: {
      "User-Agent": "BolaNoBrasil-X-Autopost/1.0",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ao ler ${FEED_URL}: ${res.status} ${text}`);
  }

  return res.json();
}

async function main() {
  const appKey = requiredEnv("X_API_KEY");
  const appSecret = requiredEnv("X_API_SECRET");
  const accessToken = requiredEnv("X_ACCESS_TOKEN");
  const accessSecret = requiredEnv("X_ACCESS_SECRET");

  const state = await readState();
  const latest = await fetchLatest();

  if (!latest?.slug || !latest?.postText) {
    throw new Error("JSON da API social incompleto.");
  }

  if (state.lastSlug === latest.slug) {
    console.log(`Sem novidade. Último slug já postado: ${latest.slug}`);
    return;
  }

  const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });

  const text = String(latest.postText).trim();

  if (text.length > 280) {
    throw new Error(
      `postText passou de 280 caracteres (${text.length}). Ajuste o xText do conteúdo.`
    );
  }

  const result = await client.v2.tweet(text);

  await writeState({
    lastSlug: latest.slug,
    lastUrl: latest.url || null,
    lastPostedAt: new Date().toISOString(),
    tweetId: result?.data?.id || null,
  });

  console.log(`Postado com sucesso no X. Slug: ${latest.slug}`);
}

main().catch((err) => {
  console.error("Falha no autopost:", err.message);
  process.exit(1);
});
