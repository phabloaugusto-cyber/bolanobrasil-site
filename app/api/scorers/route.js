import { NextResponse } from "next/server";
import { readScorers } from "@/lib/football-cache";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const competition = searchParams.get("competition") || "BSA";
    const season = searchParams.get("season") || "2026";

    // 1) Supabase (cache do worker).
    try {
      const cached = await readScorers(competition, season);
      if (cached) {
        return NextResponse.json({ scorers: cached.scorers, source: "cache", updatedAt: cached.updatedAt });
      }
    } catch (e) {
      console.error("[scorers] cache indisponível:", e?.message || e);
    }

    // 2) Fallback: football-data.org ao vivo.
    const token =
      process.env.FOOTBALL_DATA_API_KEY ||
      process.env.API_KEY ||
      process.env.NEXT_PUBLIC_FOOTBALL_KEY;

    if (!token) {
      return NextResponse.json(
        { error: "FOOTBALL_DATA_API_KEY não encontrada" },
        { status: 500 }
      );
    }

    const url = `https://api.football-data.org/v4/competitions/${competition}/scorers?season=${season}`;

    const res = await fetch(url, {
      headers: { "X-Auth-Token": token },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "Erro ao buscar artilheiros", raw: data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Erro interno em /api/scorers" },
      { status: 500 }
    );
  }
}
