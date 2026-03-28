export const dynamic = "force-dynamic";

import { listPublishedPosts } from "@/lib/posts-db";

const SITE_URL = "https://bolanobrasil.com.br";

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function normalizeNoticias(items = []) {
  return items.map((item) => ({
    editoria: "noticias-do-dia",
    slug: item.slug,
    title: item.title || item.titulo || "",
    excerpt: item.excerpt || item.resumo || "",
    xText:
      item.x_text ||
      item.xText ||
      item.excerpt ||
      item.resumo ||
      item.title ||
      item.titulo ||
      "",
    publishedAt: item.published_at || item.publishedAt || item.created_at || null,
    timestamp: toTimestamp(
      item.published_at || item.publishedAt || item.created_at || null
    ),
    url: `${SITE_URL}/noticias-do-dia/${item.slug}`,
  }));
}

function normalizeAnalises(items = []) {
  return items.map((item) => ({
    editoria: "analises",
    slug: item.slug,
    title: item.title || item.titulo || "",
    excerpt: item.excerpt || item.resumo || "",
    xText:
      item.x_text ||
      item.xText ||
      item.excerpt ||
      item.resumo ||
      item.title ||
      item.titulo ||
      "",
    publishedAt: item.published_at || item.publishedAt || item.created_at || null,
    timestamp: toTimestamp(
      item.published_at || item.publishedAt || item.created_at || null
    ),
    url: `${SITE_URL}/analises/${item.slug}`,
  }));
}

function normalizeHumor(items = []) {
  return items.map((item) => ({
    editoria: "humor-na-rodada",
    slug: item.slug,
    title: item.title || item.titulo || "",
    excerpt: item.excerpt || item.resumo || "",
    xText:
      item.x_text ||
      item.xText ||
      item.excerpt ||
      item.resumo ||
      item.title ||
      item.titulo ||
      "",
    publishedAt: item.published_at || item.publishedAt || item.created_at || null,
    timestamp: toTimestamp(
      item.published_at || item.publishedAt || item.created_at || null
    ),
    url: `${SITE_URL}/humor-na-rodada/${item.slug}`,
  }));
}

export async function GET() {
  try {
    const [noticiasDb, analisesDb, humorDb] = await Promise.all([
      listPublishedPosts({ type: "noticia", limit: 20 }),
      listPublishedPosts({ type: "analise", limit: 20 }),
      listPublishedPosts({ type: "humor", limit: 20 }),
    ]);

    const noticias = normalizeNoticias(noticiasDb).sort(
      (a, b) => b.timestamp - a.timestamp
    );
    const analises = normalizeAnalises(analisesDb).sort(
      (a, b) => b.timestamp - a.timestamp
    );
    const humores = normalizeHumor(humorDb).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    const latest = noticias[0] || analises[0] || humores[0] || null;

    if (!latest) {
      return new Response(
        JSON.stringify({ error: "Nenhum conteúdo encontrado." }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const textoBase = String(latest.xText || latest.title || "").trim();
    const postText = textoBase ? `${textoBase}\n${latest.url}` : latest.url;

    const payload = {
      editoria: latest.editoria,
      slug: latest.slug,
      title: latest.title,
      excerpt: latest.excerpt,
      xText: latest.xText,
      url: latest.url,
      postText,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error?.message || "Erro ao buscar conteúdo social.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
