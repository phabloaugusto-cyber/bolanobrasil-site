export const dynamic = "force-dynamic";

import { listPublishedPosts } from "@/lib/posts-db";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const club = searchParams.get("club");
    const showOnHomeParam = searchParams.get("show_on_home");
    const featuredParam = searchParams.get("featured");
    const roundParam = searchParams.get("round");
    const limitParam = searchParams.get("limit");

    const showOnHome =
      showOnHomeParam === null ? null : showOnHomeParam === "true";

    const featured =
      featuredParam === null ? null : featuredParam === "true";

    const round =
      roundParam === null || roundParam === "" ? null : Number(roundParam);

    const limit =
      limitParam === null || limitParam === "" ? null : Number(limitParam);

    if (club === "null") {
      const supabase = getSupabaseClient();
      let query = supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .is("club", null);

      if (type) query = query.eq("type", type);
      if (showOnHome !== null) query = query.eq("show_on_home", showOnHome);
      if (featured !== null) query = query.eq("featured", featured);
      if (round !== null) query = query.eq("round", round);

      query = query
        .order("home_order", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }

      const { normalizePost } = await import("@/lib/posts-db");
      const posts = (data || []).map(normalizePost);

      return new Response(JSON.stringify(posts), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }

    if (club === "has") {
      const supabase = getSupabaseClient();
      let query = supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .not("club", "is", null);

      if (type) query = query.eq("type", type);
      if (showOnHome !== null) query = query.eq("show_on_home", showOnHome);
      if (featured !== null) query = query.eq("featured", featured);

      query = query
        .order("club", { ascending: true })
        .order("published_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }

      const { normalizePost } = await import("@/lib/posts-db");
      const posts = (data || []).map(normalizePost);

      return new Response(JSON.stringify(posts), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }

    const posts = await listPublishedPosts({
      type: type || null,
      club: club || null,
      showOnHome,
      featured,
      round,
      limit,
    });

    return new Response(JSON.stringify(posts || []), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Erro ao listar posts." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
}
