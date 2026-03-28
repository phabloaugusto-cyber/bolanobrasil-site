export const dynamic = "force-dynamic";

import { listPublishedPosts } from "@/lib/posts-db";

export async function GET() {
  try {
    const data = await listPublishedPosts({
      type: "humor",
      showOnHome: true,
      limit: 1,
    });

    const item = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Erro ao buscar humor." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
