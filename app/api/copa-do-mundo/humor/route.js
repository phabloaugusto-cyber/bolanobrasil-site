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

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("type", "humor")
      .eq("status", "published")
      .order("home_order", { ascending: true, nullsFirst: false })
      .order("published_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const filtradas = (Array.isArray(data) ? data : []).filter(isCopa);
    const item = filtradas[0] || null;

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Erro ao buscar humor da Copa." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
}
