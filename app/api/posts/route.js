export const dynamic = "force-dynamic";

import { listPublishedPosts, normalizePost } from "@/lib/posts-db";
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

function normalizeClubValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getPostDate(item) {
  return new Date(
    item?.published_at ||
      item?.publishedAt ||
      item?.created_at ||
      item?.createdAt ||
      0
  ).getTime();
}

function sortLatestFirst(items) {
  return [...items].sort((a, b) => getPostDate(b) - getPostDate(a));
}

function latestPerClub(items) {
  const seen = new Set();
  const out = [];

  for (const item of sortLatestFirst(items)) {
    const key = normalizeClubValue(item?.club);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

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

    const supabase = getSupabaseClient();

    if (club === "null") {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .is("club", null);

      if (type) query = query.eq("type", type);
      if (showOnHome !== null) query = query.eq("show_on_home", showOnHome);
      if (featured !== null) query = query.eq("featured", featured);
      if (round !== null) query = query.eq("round", round);

      query = query.order("published_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }

      const posts = sortLatestFirst((data || []).map(normalizePost)).filter(
        (item) => !isCopa(item)
      );

      return new Response(JSON.stringify(posts), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }

    if (club === "has") {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .not("club", "is", null);

      if (type) query = query.eq("type", type);
      if (showOnHome !== null) query = query.eq("show_on_home", showOnHome);
      if (featured !== null) query = query.eq("featured", featured);
      if (round !== null) query = query.eq("round", round);

      query = query.order("published_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }

      let posts = (data || [])
        .map(normalizePost)
        .filter((item) => !isCopa(item));

      posts = latestPerClub(posts);

      if (limit) posts = posts.slice(0, limit);

      return new Response(JSON.stringify(posts), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }

    if (club) {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .not("club", "is", null);

      if (type) query = query.eq("type", type);
      if (showOnHome !== null) query = query.eq("show_on_home", showOnHome);
      if (featured !== null) query = query.eq("featured", featured);
      if (round !== null) query = query.eq("round", round);

      query = query.order("published_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }

      const wanted = normalizeClubValue(club);

      let posts = (data || [])
        .map(normalizePost)
        .filter((item) => !isCopa(item))
        .filter((item) => normalizeClubValue(item.club) === wanted);

      posts = sortLatestFirst(posts);

      if (limit) posts = posts.slice(0, limit);

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
      club: null,
      showOnHome,
      featured,
      round,
      limit,
    });

    const filtrados = sortLatestFirst(posts || []).filter((item) => !isCopa(item));

    return new Response(JSON.stringify(filtrados), {
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
