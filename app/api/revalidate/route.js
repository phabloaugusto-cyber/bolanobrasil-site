import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { secret, paths } = body || {};

    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    for (const path of paths || ["/"]) {
      revalidatePath(path);
    }

    return NextResponse.json({ revalidated: true, paths: paths || ["/"] });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Erro ao revalidar." },
      { status: 500 }
    );
  }
}
