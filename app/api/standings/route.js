export const runtime = "nodejs";

import { readStandings } from "@/lib/football-cache";

function getToken() {
  const token = process.env.API_KEY || process.env.FOOTBALL_DATA_API_KEY;
  if (!token) throw new Error("API_KEY não configurada no .env");
  return token.trim();
}

function json(data, status = 200, cache = "public, max-age=60") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": cache },
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const competition = searchParams.get("competition") || "BSA";
    const season = searchParams.get("season") || "2026";

    // 1) Supabase (dados persistidos pelo worker) — evita gastar quota da API.
    try {
      const cached = await readStandings(competition, season);
      if (cached) {
        return json({ standings: cached.standings, source: "cache", updatedAt: cached.updatedAt });
      }
    } catch (e) {
      console.error("[standings] cache indisponível:", e?.message || e);
    }

    // 2) Fallback: football-data.org ao vivo.
    const token = getToken();
    const base = (process.env.API_BASE || "https://api.football-data.org/v4").replace(/\/+$/, "");
    const url = `${base}/competitions/${competition}/standings?season=${encodeURIComponent(season)}`;

    const r = await fetch(url, {
      headers: { "X-Auth-Token": token, Accept: "application/json" },
      next: { revalidate: 300 },
    });

    const text = await r.text();
    if (!r.ok) {
      return json({ error: `HTTP ${r.status}`, detail: text.slice(0, 500) }, 502, "no-store");
    }

    return new Response(text, {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
    });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500, "no-store");
  }
}
