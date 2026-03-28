export const dynamic = "force-dynamic";

import { listPublishedPosts } from "@/lib/posts-db";

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
      showOnHomeParam === null
        ? null
        : showOnHomeParam === "true";

    const featured =
      featuredParam === null
        ? null
        : featuredParam === "true";

    const round =
      roundParam === null || roundParam === ""
        ? null
        : Number(roundParam);

    const limit =
      limitParam === null || limitParam === ""
        ? null
        : Number(limitParam);

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
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
