import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE = process.env.API_BASE || "https://api.football-data.org/v4";
const API_TOKEN =
  process.env.FOOTBALL_DATA_API_KEY ||
  process.env.API_KEY ||
  "";

const SELECOES_PT = {
  "Mexico": "México",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  "United States": "Estados Unidos",
  "Switzerland": "Suíça",
  "Morocco": "Marrocos",
  "Canada": "Canadá",
  "Qatar": "Catar",
  "Brazil": "Brasil",
  "Scotland": "Escócia",
  "Haiti": "Haiti",
  "Paraguay": "Paraguai",
  "Australia": "Austrália",
  "Japan": "Japão",
  "Germany": "Alemanha",
  "Spain": "Espanha",
  "France": "França",
  "England": "Inglaterra",
  "Italy": "Itália",
  "Netherlands": "Holanda",
  "Belgium": "Bélgica",
  "Croatia": "Croácia",
  "Portugal": "Portugal",
  "Argentina": "Argentina",
  "Uruguay": "Uruguai",
  "Colombia": "Colômbia",
  "Ecuador": "Equador",
  "Saudi Arabia": "Arábia Saudita",
  "Iran": "Irã",
  "Serbia": "Sérvia",
  "Poland": "Polônia",
  "Denmark": "Dinamarca",
  "Senegal": "Senegal",
  "Cameroon": "Camarões",
  "Ghana": "Gana",
  "Tunisia": "Tunísia",
  "Algeria": "Argélia",
  "Egypt": "Egito",
  "Nigeria": "Nigéria",
  "Costa Rica": "Costa Rica",
  "Panama": "Panamá",
  "Jamaica": "Jamaica",
  "New Zealand": "Nova Zelândia",
  "South Korea Republic": "Coreia do Sul",
  "Ivory Coast": "Costa do Marfim",
  "Cape Verde Islands": "Cabo Verde",
  "Norway": "Noruega",
  "Uzbekistan": "Uzbequistão",
};

function traduzirSelecaoNome(nome) {
  if (!nome) return null;
  return SELECOES_PT[nome] || nome;
}

function normalizarTime(team = {}, fallback = "Time") {
  return {
    id: team?.id ?? null,
    name: traduzirSelecaoNome(team?.name || team?.shortName || fallback) || fallback,
    shortName: traduzirSelecaoNome(team?.shortName || team?.name || fallback) || fallback,
    tla: team?.tla || null,
    crest: team?.crest || team?.crestUrl || null,
  };
}

export async function GET() {
  try {
    if (!API_TOKEN) {
      return NextResponse.json(
        { error: "Token da API de futebol não configurado." },
        { status: 500 }
      );
    }

    const response = await fetch(`${API_BASE}/competitions/WC/matches`, {
      headers: {
        "X-Auth-Token": API_TOKEN,
      },
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Erro ao buscar jogos da Copa.",
          status: response.status,
          body: text?.slice(0, 500) || null,
        },
        { status: response.status }
      );
    }

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      return NextResponse.json(
        {
          error: "Resposta inválida da API de jogos da Copa.",
          body: text?.slice(0, 500) || null,
        },
        { status: 500 }
      );
    }

    const matches = Array.isArray(data?.matches) ? data.matches : [];

    const jogos = matches.map((match) => ({
      id: match?.id ?? null,
      utcDate: match?.utcDate || null,
      status: match?.status || null,
      stage: match?.stage || null,
      group: match?.group || null,
      matchday: match?.matchday ?? null,
      homeTeam: normalizarTime(match?.homeTeam, "Mandante"),
      awayTeam: normalizarTime(match?.awayTeam, "Visitante"),
      score: {
        winner: match?.score?.winner || null,
        duration: match?.score?.duration || null,
        fullTime: {
          home: match?.score?.fullTime?.home ?? null,
          away: match?.score?.fullTime?.away ?? null,
        },
        halfTime: {
          home: match?.score?.halfTime?.home ?? null,
          away: match?.score?.halfTime?.away ?? null,
        },
      },
    }));

    const agora = Date.now();

    const proximos = jogos
      .filter((j) => {
        if (!j.utcDate) return false;
        return new Date(j.utcDate).getTime() >= agora && j.status !== "FINISHED";
      })
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 12);

    const aoVivo = jogos.filter((j) =>
      ["LIVE", "IN_PLAY", "PAUSED"].includes(j.status)
    );

    return NextResponse.json(
      {
        competition: {
          id: data?.competition?.id ?? null,
          code: data?.competition?.code || null,
          name: data?.competition?.name || "FIFA World Cup",
        },
        totalMatches: jogos.length,
        liveMatches: aoVivo,
        upcomingMatches: proximos,
        matches: jogos,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro interno ao montar jogos da Copa.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
