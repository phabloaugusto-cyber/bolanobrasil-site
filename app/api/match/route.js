export const runtime = "nodejs";

function getToken() {
  const token = process.env.API_KEY || process.env.FOOTBALL_DATA_API_KEY;
  if (!token) {
    throw new Error("API_KEY/FOOTBALL_DATA_API_KEY não configurada no .env");
  }
  return token.trim();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return json({ ok: false, error: "Parâmetro id é obrigatório" }, 400);
    }

    const token = getToken();
    const base = (process.env.API_BASE || "https://api.football-data.org/v4").replace(/\/+$/, "");
    const url = `${base}/matches/${encodeURIComponent(id)}`;

    const r = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
        Accept: "application/json",
        "X-Unfold-Goals": "true",
        "X-Unfold-Bookings": "true",
        "X-Unfold-Subs": "true",
      },
      cache: "no-store",
    });

    const text = await r.text();

    if (!r.ok) {
      return json(
        {
          ok: false,
          id,
          upstreamStatus: r.status,
          upstreamUrl: url,
          upstreamBody: text.slice(0, 1000),
        },
        502
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return json(
        {
          ok: false,
          id,
          upstreamStatus: r.status,
          upstreamUrl: url,
          error: "Upstream não retornou JSON válido",
          upstreamBody: text.slice(0, 1000),
        },
        502
      );
    }

    return json({
      ok: true,
      match: data?.match || data,
    });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
