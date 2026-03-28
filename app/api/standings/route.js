export const runtime = "nodejs";

function getToken() {
  const token = process.env.API_KEY || process.env.FOOTBALL_DATA_API_KEY;
  if (!token) throw new Error("API_KEY não configurada no .env");
  return token.trim();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const competition = searchParams.get("competition") || "BSA";
    const season = searchParams.get("season") || "2026";

    const token = getToken();
    const base = (process.env.API_BASE || "https://api.football-data.org/v4").replace(/\/+$/, "");
    const url = `${base}/competitions/${competition}/standings?season=${encodeURIComponent(season)}`;

    const r = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
        "Accept": "application/json",
      },
      // cache leve (bom pra não gastar requisição toda hora)
      next: { revalidate: 300 },
    });

    const text = await r.text();
    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: `HTTP ${r.status}`, detail: text.slice(0, 500) }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(text, {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
