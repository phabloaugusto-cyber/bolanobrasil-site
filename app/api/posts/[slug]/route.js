export const dynamic = "force-dynamic";

import { getPublishedPostBySlug } from "@/lib/posts-db";

export async function GET(request, { params }) {
  try {
    const slug = params?.slug;

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Slug não informado." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const data = await getPublishedPostBySlug(slug);

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Post não encontrado." }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Erro ao buscar post." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
