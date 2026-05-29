/**
 * Publica (ou atualiza) um post de mudança de técnico no projeto atual do .env.
 *
 * Uso:
 *   node backup/publicar-tecnico.js \
 *     --club "São Paulo" \
 *     --out "Roger Machado" \
 *     --in "Dorival Júnior" \
 *     --date 2026-05-15 \
 *     --content "Texto opcional explicando a troca."
 *
 * Idempotente: faz upsert por `slug` (gerado a partir de clube + técnicos).
 * Segue o formato dos posts type=tecnico: card com coach_out/coach_in/change_date.
 */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

function slugify(text = "") {
  return String(text)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

const club = arg("club");
const coachOut = arg("out");
const coachIn = arg("in");
const changeDate = arg("date"); // YYYY-MM-DD
const content = arg("content", "");

if (!club || !coachOut || !coachIn || !changeDate) {
  console.error("Faltam args: --club --out --in --date (e opcional --content)");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const row = {
  title: `${club}: ${coachOut} → ${coachIn}`,
  slug: `${slugify(club)}-${slugify(coachOut)}-${slugify(coachIn)}`,
  excerpt: `${club}: sai ${coachOut}, entra ${coachIn}`,
  content: content || "",
  type: "tecnico",
  category: null,
  club,
  coach_out: coachOut,
  coach_in: coachIn,
  change_date: changeDate,
  status: "published",
  show_on_home: true,
  featured: true,
  home_order: 1,
  image_url: null,
  published_at: new Date().toISOString(),
};

(async () => {
  const { error } = await sb.from("posts").upsert(row, { onConflict: "slug" });
  if (error) { console.error("Erro:", error.message); process.exit(1); }
  console.log(`Publicado: "${row.title}" (slug=${row.slug}, change_date=${row.change_date}).`);
})();
