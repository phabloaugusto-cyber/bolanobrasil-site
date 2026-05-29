import { listPublishedPosts } from "@/lib/posts-db";

const baseUrl = "https://bolanobrasil.com.br";

// Revalida o sitemap periodicamente para captar conteúdo novo
// (também é forçado via /api/revalidate quando o worker publica).
export const revalidate = 3600;

function isCopa(post) {
  return [post?.category, post?.competition, post?.tag]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase())
    .includes("copa-do-mundo");
}

// Mapeia um post para a sua rota pública conforme type + se é Copa do Mundo.
function postPath(post) {
  const copa = isCopa(post);
  switch (post.type) {
    case "analise":
      return copa ? `/copa-do-mundo/analises/${post.slug}` : `/analises/${post.slug}`;
    case "noticia":
      return copa ? `/copa-do-mundo/noticias/${post.slug}` : `/noticias-do-dia/${post.slug}`;
    case "humor":
      return copa ? `/copa-do-mundo/humor/${post.slug}` : `/humor-na-rodada/${post.slug}`;
    default:
      return null;
  }
}

export default async function sitemap() {
  const now = new Date();

  const staticUrls = [
    { url: `${baseUrl}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/tabela`, changeFrequency: "hourly", priority: 0.95 },
    { url: `${baseUrl}/jogos`, changeFrequency: "hourly", priority: 0.95 },
    { url: `${baseUrl}/artilheiros`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/analises`, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/noticias-do-dia`, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/humor-na-rodada`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/copa-do-mundo`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/sobre`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contato`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacidade`, changeFrequency: "monthly", priority: 0.5 },
  ].map((u) => ({ ...u, lastModified: now }));

  let dynamicUrls = [];
  try {
    const posts = await listPublishedPosts();
    dynamicUrls = posts
      .map((post) => {
        const path = postPath(post);
        if (!path || !post.slug) return null;
        return {
          url: `${baseUrl}${path}`,
          lastModified: new Date(post.updated_at || post.published_at || now),
          changeFrequency: "weekly",
          priority: 0.7,
        };
      })
      .filter(Boolean);
  } catch (err) {
    // Se o Supabase estiver indisponível no build/runtime, ainda servimos as URLs estáticas.
    console.error("[sitemap] erro ao listar posts:", err?.message || err);
  }

  return [...staticUrls, ...dynamicUrls];
}
