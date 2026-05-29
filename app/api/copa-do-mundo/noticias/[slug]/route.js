export const dynamic = "force-dynamic";

import { getSupabaseClient } from "@/lib/supabase";

function isCopa(item) {
  const values = [
    item?.category,
    item?.competition,
    item?.tag,
  ]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());

  return values.includes("copa-do-mundo");
}

export async function GET(_req, { params }) {
  try {
    const slug = params?.slug;

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug não informado." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("type", "noticia")
      .eq("status", "published")
      .eq("slug", slug)
      .limit(1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const item = Array.isArray(data) ? data[0] : null;

    if (!item || !isCopa(item)) {
      return new Response(JSON.stringify({ error: "Notícia da Copa não encontrada." }), {
        status: 404,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Erro ao buscar notícia da Copa." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
}
