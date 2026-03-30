export const dynamic = "force-dynamic";

import { listPublishedPosts } from "@/lib/posts-db";

export async function GET() {
  try {
    const posts = await listPublishedPosts({
      type: "analise",
      showOnHome: true,
      featured: true,
      limit: 20,
    });

    const ordered = (posts || []).sort((a, b) => {
      const orderA =
        typeof a.home_order === "number"
          ? a.home_order
          : typeof a.homeOrder === "number"
          ? a.homeOrder
          : 9999;

      const orderB =
        typeof b.home_order === "number"
          ? b.home_order
          : typeof b.homeOrder === "number"
          ? b.homeOrder
          : 9999;

      if (orderA !== orderB) return orderA - orderB;

      const timeA = new Date(a.published_at || a.publishedAt || 0).getTime();
      const timeB = new Date(b.published_at || b.publishedAt || 0).getTime();

      return timeB - timeA;
    });

    const item = ordered[0] || null;

    if (!item) {
      return new Response("null", {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }

    const payload = {
      id: item.id,
      slug: item.slug,
      title: item.title || item.titulo || "",
      excerpt: item.excerpt || item.resumo || "",
      author: "Redação BolaNoBrasil",
      category: "Análise",
      date: new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(item.published_at || item.publishedAt || item.created_at)),
      published_at: item.published_at || item.publishedAt || item.created_at || null,
      image_url: item.image_url || item.imagem || null,
      imagem: item.image_url || item.imagem || null,
      home_order: item.home_order ?? item.homeOrder ?? null,
      featured: Boolean(item.featured),
      show_on_home: Boolean(item.show_on_home),
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
      JSON.stringify({ error: error?.message || "Erro ao buscar análise da home." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
