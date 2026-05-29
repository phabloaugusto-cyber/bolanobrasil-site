/**
 * Copia as imagens dos posts do storage do projeto ANTIGO para o projeto NOVO
 * e atualiza posts.image_url para apontar para o novo storage.
 *
 * Origem: URLs públicas em backup/old-posts-dump.json (bucket post-images).
 * Destino: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (projeto novo).
 *
 * Idempotente: upload com upsert; update por id. Pode rodar de novo sem problema.
 * Uso: node backup/copy-images.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "post-images";

if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

function parsePath(u) {
  const m = u.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  return m ? { bucket: m[1], objectPath: m[2] } : null;
}

function contentType(p, fallback) {
  const ext = p.split(".").pop().toLowerCase();
  return { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" }[ext] || fallback || "application/octet-stream";
}

(async () => {
  const posts = JSON.parse(
    fs.readFileSync(path.join(__dirname, "old-posts-dump.json"), "utf8")
  );
  const withImg = posts.filter((p) => p.image_url);
  console.log(`Posts com imagem: ${withImg.length}`);

  // 1) Garante o bucket público no projeto novo
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true });
    if (error) { console.error("Erro criando bucket:", error.message); process.exit(1); }
    console.log(`Bucket "${BUCKET}" criado (público).`);
  } else {
    console.log(`Bucket "${BUCKET}" já existe.`);
  }

  let copied = 0, updated = 0;
  for (const p of withImg) {
    const parsed = parsePath(p.image_url);
    if (!parsed) { console.warn(`  URL fora do padrão, pulando: ${p.image_url}`); continue; }

    // 2) Baixa do antigo (URL pública)
    const res = await fetch(p.image_url);
    if (!res.ok) { console.warn(`  download falhou (${res.status}): ${parsed.objectPath}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());

    // 3) Sobe no novo
    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(parsed.objectPath, buf, {
        contentType: contentType(parsed.objectPath, res.headers.get("content-type")),
        upsert: true,
      });
    if (upErr) { console.warn(`  upload falhou: ${parsed.objectPath} -> ${upErr.message}`); continue; }
    copied++;

    // 4) Atualiza image_url do post para o novo storage
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(parsed.objectPath);
    const newUrl = pub.publicUrl;
    const { error: updErr } = await sb.from("posts").update({ image_url: newUrl }).eq("id", p.id);
    if (updErr) { console.warn(`  update post falhou (${p.id}): ${updErr.message}`); continue; }
    updated++;
    console.log(`  ok: ${parsed.objectPath} (${buf.length} bytes) -> image_url atualizado`);
  }

  console.log(`Concluído. Imagens copiadas: ${copied}/${withImg.length} | posts atualizados: ${updated}`);
})();
