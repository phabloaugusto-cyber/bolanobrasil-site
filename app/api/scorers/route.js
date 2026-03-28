import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const token =
      process.env.FOOTBALL_DATA_API_KEY ||
      process.env.NEXT_PUBLIC_FOOTBALL_KEY;

    if (!token) {
      return NextResponse.json(
        { error: "FOOTBALL_DATA_API_KEY não encontrada" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const competition = searchParams.get("competition") || "BSA";
    const season = searchParams.get("season") || "2026";

    const url = `https://api.football-data.org/v4/competitions/${competition}/scorers?season=${season}`;

    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.message || "Erro ao buscar artilheiros",
          raw: data,
        },
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
