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
  if (!nome) return "Time";
  return SELECOES_PT[nome] || nome;
}

function getClubCrest(team = {}) {
  return (
    team.crest ||
    team.crestUrl ||
    null
  );
}

export async function GET() {
  try {
    if (!API_TOKEN) {
      return NextResponse.json(
        { error: "Token da API de futebol não configurado." },
        { status: 500 }
      );
    }

    const response = await fetch(`${API_BASE}/competitions/WC/standings`, {
      headers: {
        "X-Auth-Token": API_TOKEN,
      },
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Erro ao buscar tabela da Copa.",
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
          error: "Resposta inválida da API da Copa.",
          body: text?.slice(0, 500) || null,
        },
        { status: 500 }
      );
    }

    const standings = Array.isArray(data?.standings) ? data.standings : [];

    const groups = standings.map((item) => ({
      stage: item?.stage || null,
      type: item?.type || null,
      group: item?.group || null,
      table: Array.isArray(item?.table)
        ? item.table.map((row) => ({
            position: row?.position ?? null,
            team: {
              id: row?.team?.id ?? null,
              name: traduzirSelecaoNome(row?.team?.name || row?.team?.shortName || "Time"),
              shortName: traduzirSelecaoNome(row?.team?.shortName || row?.team?.name || "Time"),
              tla: row?.team?.tla || null,
              crest: getClubCrest(row?.team),
            },
            playedGames: row?.playedGames ?? 0,
            won: row?.won ?? 0,
            draw: row?.draw ?? 0,
            lost: row?.lost ?? 0,
            points: row?.points ?? 0,
            goalsFor: row?.goalsFor ?? 0,
            goalsAgainst: row?.goalsAgainst ?? 0,
            goalDifference: row?.goalDifference ?? 0,
            form: row?.form || null,
          }))
        : [],
    }));

    return NextResponse.json(
      {
        competition: {
          id: data?.competition?.id ?? null,
          code: data?.competition?.code || null,
          name: data?.competition?.name || "FIFA World Cup",
          type: data?.competition?.type || null,
          emblem: data?.competition?.emblem || null,
        },
        season: {
          id: data?.season?.id ?? null,
          startDate: data?.season?.startDate || null,
          endDate: data?.season?.endDate || null,
          currentMatchday: data?.season?.currentMatchday ?? null,
        },
        standings: groups,
        totalGroups: groups.length,
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
        error: "Erro interno ao montar tabela da Copa.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
