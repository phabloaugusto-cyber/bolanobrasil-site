import { NextResponse } from "next/server";

function getEnv(name, fallback = "") {
  const v = process.env[name];
  return (v ?? fallback).toString().trim();
}

function json(data, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function GET(req) {
  try {
    const url = new URL(req.url);

    const competition = (
      url.searchParams.get("competition") ||
      getEnv("DEFAULT_COMPETITION", "BSA")
    ).toUpperCase();

    const season =
      url.searchParams.get("season") || getEnv("DEFAULT_SEASON", "2026");

    const API_BASE = getEnv("API_BASE", "https://api.football-data.org/v4");
    const token = getEnv("API_KEY") || getEnv("FOOTBALL_DATA_API_KEY");

    if (!token) {
      return json({ ok: false, error: "Faltou API_KEY no .env" }, 500);
    }

    const upstreamUrl = `${API_BASE}/competitions/${encodeURIComponent(
      competition
    )}/matches?season=${encodeURIComponent(season)}`;

    const upstream = await fetch(upstreamUrl, {
      headers: {
        "X-Auth-Token": token,
        "X-Unfold-Goals": "true",
        "X-Unfold-Bookings": "true",
        "X-Unfold-Subs": "true",
      },
      cache: "no-store",
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return json(
        {
          ok: false,
          competition,
          season,
          upstreamStatus: upstream.status,
          upstreamUrl,
          upstreamBody: text.slice(0, 2000),
        },
        200
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return json(
        {
          ok: false,
          competition,
          season,
          upstreamStatus: upstream.status,
          upstreamUrl,
          error: "Upstream não retornou JSON válido",
          upstreamBody: text.slice(0, 500),
        },
        200
      );
    }

    const matches = Array.isArray(data?.matches) ? data.matches : [];

    return json({
      ok: true,
      competition,
      season,
      count: matches.length,
      matches,
    });
  } catch (err) {
    return json({ ok: false, error: err?.message || String(err) }, 500);
  }
}
