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

function formatarData(valor) {
  if (!valor) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(valor));
  } catch {
    return "";
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("type", "analise")
      .eq("status", "published")
      .eq("show_on_home", true)
      .order("published_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }

    const filtrados = (Array.isArray(data) ? data : []).filter((item) => !isCopa(item));
    const item = filtrados[0] || null;

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
      slug: item.slug || "",
      title: item.title || "",
      excerpt: item.excerpt || "",
      author: "Redação BolaNoBrasil",
      category: "Análise",
      date: formatarData(item.published_at || item.created_at || null),
      published_at: item.published_at || item.created_at || null,
      image_url: item.image_url || null,
      imagem: item.image_url || null,
      home_order: item.home_order ?? null,
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
