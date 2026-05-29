const base = "http://localhost:3000";

async function getJson(path) {
  const r = await fetch(base + path, { cache: "no-store" });
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) }; }
  catch { return { status: r.status, body: t.slice(0, 60) }; }
}

(async () => {
  console.log("=== Listagens /api/posts?type= ===");
  for (const t of ["analise", "noticia", "humor", "tecnico"]) {
    const { status, body } = await getJson(`/api/posts?type=${t}`);
    console.log(`  type=${t.padEnd(8)} HTTP ${status} -> ${Array.isArray(body) ? body.length + " posts" : JSON.stringify(body)}`);
  }

  console.log("=== Posts por clube (páginas /time/[slug]) ===");
  // descobre clubes a partir da listagem geral
  const all = await getJson(`/api/posts`);
  const clubs = [...new Set((all.body || []).map(p => p.club).filter(Boolean))];
  console.log(`  clubes com posts: ${clubs.length} -> ${clubs.slice(0, 8).join(", ")}${clubs.length > 8 ? "..." : ""}`);
  for (const c of clubs.slice(0, 3)) {
    const { status, body } = await getJson(`/api/posts?club=${encodeURIComponent(c)}`);
    console.log(`  club=${c.padEnd(14)} HTTP ${status} -> ${Array.isArray(body) ? body.length + " posts" : JSON.stringify(body)}`);
  }

  console.log("=== Copa do Mundo ===");
  for (const ep of ["analises", "noticias", "humor"]) {
    const { status, body } = await getJson(`/api/copa-do-mundo/${ep}`);
    const n = Array.isArray(body) ? body.length : (body && !body.error ? 1 : 0);
    console.log(`  copa/${ep.padEnd(9)} HTTP ${status} -> ${n} item(ns)`);
  }
})();
