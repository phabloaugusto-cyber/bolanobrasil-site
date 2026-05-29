/**
 * Migração: posts do projeto Supabase ANTIGO -> projeto NOVO (atual do .env).
 *
 * Fonte: backup/old-posts-dump.json (57 posts, baixados do projeto antigo).
 * Destino: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (projeto novo).
 *
 * Idempotente: faz upsert por `id`, então pode rodar mais de uma vez sem duplicar.
 * PRÉ-REQUISITO: as colunas image_url, x_text, home_order, coach_out, coach_in,
 * change_date precisam existir na tabela posts do projeto novo (ver SQL fornecido).
 *
 * Uso: node backup/migrate-old-to-new.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

// Só migra as colunas que existem no schema original (evita mandar lixo).
const COLS = [
  "id", "title", "slug", "content", "excerpt", "image_url", "status",
  "published_at", "created_at", "updated_at", "type", "club", "round",
  "x_text", "featured", "show_on_home", "home_order", "coach_out",
  "coach_in", "change_date", "category",
];

function pick(row) {
  const out = {};
  for (const c of COLS) if (c in row) out[c] = row[c];
  return out;
}

(async () => {
  const dumpPath = path.join(__dirname, "old-posts-dump.json");
  const posts = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
  console.log(`Lidos ${posts.length} posts do backup.`);

  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
  const rows = posts.map(pick);

  let ok = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const lote = rows.slice(i, i + 50);
    const { error } = await sb.from("posts").upsert(lote, { onConflict: "id" });
    if (error) {
      console.error(`Erro no lote ${i}-${i + lote.length}:`, error.message);
      process.exit(1);
    }
    ok += lote.length;
    console.log(`  upsert ${ok}/${rows.length}`);
  }

  const { count } = await sb
    .from("posts")
    .select("*", { count: "exact", head: true });
  console.log(`Migração concluída. Total de posts no projeto novo agora: ${count}`);
})();
