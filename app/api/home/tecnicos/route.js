export const dynamic = "force-dynamic";

import { listPublishedPosts } from "@/lib/posts-db";

function normalizeTecnico(item) {
  return {
    id: item.id,
    title: item.title || "",
    titulo: item.title || "",
    slug: item.slug || "",
    type: item.type || "tecnico",
    club: item.club || "",
    coach_out: item.coach_out || "",
    coach_in: item.coach_in || "",
    change_date:
      item.change_date ||
      item.published_at ||
      item.publishedAt ||
      null,
    published_at: item.published_at || item.publishedAt || null,
    publishedAt: item.published_at || item.publishedAt || null,
    show_on_home: !!item.show_on_home,
    home_order: item.home_order ?? null,
    status: item.status || "",
  };
}

export async function GET() {
  try {
    const itens = await listPublishedPosts({ type: "tecnico", limit: 20 });

    const filtrados = (Array.isArray(itens) ? itens : [])
      .filter((item) => item.status === "published" && item.show_on_home === true)
      .sort((a, b) => {
        const aOrder = a.home_order ?? 999999;
        const bOrder = b.home_order ?? 999999;
        if (aOrder !== bOrder) return aOrder - bOrder;

        const aDate = new Date(
          a.change_date || a.published_at || a.publishedAt || 0
        ).getTime();
        const bDate = new Date(
          b.change_date || b.published_at || b.publishedAt || 0
        ).getTime();

        return bDate - aDate;
      });

    const ultimo = filtrados[0] || null;

    if (!ultimo) {
      return new Response(
        JSON.stringify({ error: "Nenhuma mudança de técnico encontrada." }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    return new Response(JSON.stringify(normalizeTecnico(ultimo)), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Erro ao buscar técnicos." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
