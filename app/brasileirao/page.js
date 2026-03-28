"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  // ====== state ======
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [standings, setStandings] = useState(null); // football-data standings response
  const [matches, setMatches] = useState([]);       // football-data matches response
  const [posts, setPosts] = useState([]);           // blog posts (optional)

  // ====== config ======
  const COMPETITION = "BSA";
  const SEASON = "2026";

  // ====== fetch helpers ======
  async function safeJson(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
    return r.json();
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [st, mt] = await Promise.all([
          safeJson(`/api/standings?competition=${COMPETITION}&season=${SEASON}`),
          safeJson(`/api/matches?competition=${COMPETITION}&season=${SEASON}`),
        ]);

        // posts (opcional) — se não existir /api/posts, não quebra
        let ps = [];
        try {
          ps = await safeJson(`/api/posts?limit=6`);
        } catch (_) {
          ps = [];
        }

        if (!alive) return;
        setStandings(st || null);
        setMatches(mt?.matches || []);
        setPosts(Array.isArray(ps) ? ps : (ps?.posts || []));
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Erro ao carregar dados");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => (alive = false);
  }, []);

  // ====== derived ======
  const tableRows = useMemo(() => {
    const t = standings?.standings?.find((s) => s.type === "TOTAL");
    const arr = t?.table || [];
    return arr;
  }, [standings]);

  const topTable = useMemo(() => tableRows.slice(0, 10), [tableRows]);

  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKeyLocal(now), [now]);

  const matchesToday = useMemo(() => {
    return matches.filter((m) => toDateKeyLocal(new Date(m.utcDate)) === todayKey);
  }, [matches, todayKey]);

  const liveMatches = useMemo(() => {
    const liveStatuses = new Set(["IN_PLAY", "PAUSED", "SUSPENDED"]);
    return matches.filter((m) => liveStatuses.has(m.status));
  }, [matches]);

  const upcomingMatches = useMemo(() => {
    // próximos 12 por data (não encerrados)
    const filtered = matches
      .filter((m) => m.status !== "FINISHED")
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    return filtered.slice(0, 12);
  }, [matches]);

  // placeholders (até criarmos endpoint)
  const topScorers = useMemo(() => [], []);
  const topAssists = useMemo(() => [], []);

  // ====== UI ======
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>BolaNoBrasil</h1>
        <p style={S.sub}>
          Tabela resumida, jogos (hoje / ao vivo) e destaques do Brasileirão.
        </p>
      </div>

      {/* CTA principal */}
      <div style={S.ctaRow}>
        <Link href="/brasileirao" style={S.ctaPrimary}>
          Abrir Brasileirão 2026 (tabela + rodadas)
        </Link>
        <Link href="/blog" style={S.ctaSecondary}>
          Ir para o Blog
        </Link>
      </div>

      {loading ? (
        <div style={S.card}>
          <div style={{ opacity: 0.85 }}>Carregando…</div>
        </div>
      ) : err ? (
        <div style={S.card}>
          <div style={{ color: "#ffb4b4" }}>Erro: {err}</div>
          <div style={{ opacity: 0.8, marginTop: 8 }}>
            Dica: verifique se a API está OK e se os containers estão rodando.
          </div>
        </div>
      ) : (
        <>
          {/* ====== Tabela resumida ====== */}
          <section style={S.card}>
            <div style={S.sectionHead}>
              <h2 style={S.h2}>Tabela (resumida)</h2>
              <Link href="/brasileirao" style={S.linkBtn}>
                Ver tabela completa
              </Link>
            </div>

            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.thNum}>#</th>
                    <th style={S.thTeam}>Time</th>
                    <th style={S.thMini}>P</th>
                    <th style={S.thMini}>J</th>
                    <th style={S.thMini}>V</th>
                    <th style={S.thMini}>SG</th>
                  </tr>
                </thead>
                <tbody>
                  {topTable.map((r) => (
                    <tr key={r.team?.id || r.position}>
                      <td style={S.tdNum}>{r.position}</td>
                      <td style={S.tdTeam}>
                        <img
                          src={r.team?.crest}
                          alt=""
                          style={S.crest}
                          loading="lazy"
                        />
                        <span style={S.teamName}>{r.team?.shortName || r.team?.name}</span>
                      </td>
                      <td style={S.tdMini}><b>{r.points}</b></td>
                      <td style={S.tdMini}>{r.playedGames}</td>
                      <td style={S.tdMini}>{r.won}</td>
                      <td style={S.tdMini}>{r.goalDifference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ====== Jogos hoje ====== */}
          <section style={S.card}>
            <div style={S.sectionHead}>
              <h2 style={S.h2}>Jogos de hoje</h2>
              <Link href="/brasileirao" style={S.linkBtn}>
                Ver tudo por rodada
              </Link>
            </div>

            {matchesToday.length === 0 ? (
              <div style={{ opacity: 0.85 }}>Sem jogos hoje.</div>
            ) : (
              <div style={S.list}>
                {matchesToday.map((m) => (
                  <MatchRow key={m.id} m={m} />
                ))}
              </div>
            )}
          </section>

          {/* ====== Ao vivo ====== */}
          <section style={S.card}>
            <div style={S.sectionHead}>
              <h2 style={S.h2}>Ao vivo</h2>
              <span style={S.badgeLive}>LIVE</span>
            </div>

            {liveMatches.length === 0 ? (
              <div style={{ opacity: 0.85 }}>Nenhum jogo ao vivo agora.</div>
            ) : (
              <div style={S.list}>
                {liveMatches.map((m) => (
                  <MatchRow key={m.id} m={m} highlightLive />
                ))}
              </div>
            )}
          </section>

          {/* ====== Próximos jogos / calendário ====== */}
          <section style={S.card}>
            <div style={S.sectionHead}>
              <h2 style={S.h2}>Próximos jogos</h2>
              <Link href="/brasileirao" style={S.linkBtn}>
                Abrir calendário completo
              </Link>
            </div>

            <div style={S.list}>
              {upcomingMatches.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </div>
          </section>

          {/* ====== Artilheiros ====== */}
          <section style={S.card}>
            <div style={S.sectionHead}>
              <h2 style={S.h2}>Artilheiros</h2>
              <span style={S.miniNote}>top 5</span>
            </div>

            {topScorers.length === 0 ? (
              <div style={{ opacity: 0.85 }}>
                Em breve (vamos criar a API de artilheiros).
              </div>
            ) : (
              <div style={S.smallList}>
                {topScorers.slice(0, 5).map((p) => (
                  <div key={p.id} style={S.smallRow}>
                    <span style={{ opacity: 0.9 }}>{p.name}</span>
                    <b>{p.goals}</b>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ====== Assistências ====== */}
          <section style={S.card}>
            <div style={S.sectionHead}>
              <h2 style={S.h2}>Assistências</h2>
              <span style={S.miniNote}>top 5</span>
            </div>

            {topAssists.length === 0 ? (
              <div style={{ opacity: 0.85 }}>
                Em breve (vamos criar a API de assistências).
              </div>
            ) : (
              <div style={S.smallList}>
                {topAssists.slice(0, 5).map((p) => (
                  <div key={p.id} style={S.smallRow}>
                    <span style={{ opacity: 0.9 }}>{p.name}</span>
                    <b>{p.assists}</b>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ====== Últimas notícias ====== */}
          <section style={S.card}>
            <div style={S.sectionHead}>
              <h2 style={S.h2}>Últimas notícias</h2>
              <Link href="/blog" style={S.linkBtn}>
                Ver blog
              </Link>
            </div>

            {posts.length === 0 ? (
              <div style={{ opacity: 0.85 }}>
                Sem notícias ainda (ou API do blog não criada). Você pode postar no blog e isso
                aparece aqui.
              </div>
            ) : (
              <div style={S.newsList}>
                {posts.slice(0, 6).map((p, idx) => (
                  <Link
                    key={p.slug || idx}
                    href={p.slug ? `/blog/${p.slug}` : "/blog"}
                    style={S.newsItem}
                  >
                    <div style={S.newsTitle}>{p.title || "Notícia"}</div>
                    <div style={S.newsMeta}>
                      {p.date ? fmtDateBR(p.date) : "Agora"} • Clique para ler
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <div style={S.footer}>
        <div style={{ opacity: 0.75 }}>
          © {new Date().getFullYear()} BolaNoBrasil • dados: football-data
        </div>
      </div>
    </div>
  );
}

/* ===================== components ===================== */
function MatchRow({ m, highlightLive }) {
  const ht = m?.homeTeam?.shortName || m?.homeTeam?.name || "Casa";
  const at = m?.awayTeam?.shortName || m?.awayTeam?.name || "Fora";
  const hs = m?.score?.fullTime?.home ?? m?.score?.halfTime?.home ?? null;
  const as = m?.score?.fullTime?.away ?? m?.score?.halfTime?.away ?? null;

  const homeLogo = m?.homeTeam?.crest;
  const awayLogo = m?.awayTeam?.crest;

  const when = fmtDateTimeBR(m.utcDate);
  const status = m.status;

  const box = {
    ...S.matchRow,
    borderColor: highlightLive ? "rgba(66, 190, 101, 0.45)" : S.matchRow.borderColor,
    boxShadow: highlightLive ? "0 0 0 1px rgba(66, 190, 101, 0.15) inset" : S.matchRow.boxShadow,
  };

  return (
    <div style={box}>
      <div style={S.matchTop}>
        <div style={S.matchWhen}>{when}</div>
        <div style={S.matchStatus}>{status}</div>
      </div>

      {/* placar estilo “nome + número à direita” */}
      <div style={S.matchTeams}>
        <div style={S.teamLine}>
          {homeLogo ? <img src={homeLogo} alt="" style={S.crestSm} /> : null}
          <span style={S.teamLabel}>{ht}</span>
          <span style={S.scoreNum}>{hs ?? "-"}</span>
        </div>
        <div style={S.teamLine}>
          {awayLogo ? <img src={awayLogo} alt="" style={S.crestSm} /> : null}
          <span style={S.teamLabel}>{at}</span>
          <span style={S.scoreNum}>{as ?? "-"}</span>
        </div>
      </div>
    </div>
  );
}

/* ===================== helpers ===================== */
function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateKeyLocal(d) {
  // yyyy-mm-dd local
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function fmtDateTimeBR(iso) {
  try {
    const d = new Date(iso);
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch {
    return "";
  }
}

function fmtDateBR(iso) {
  try {
    const d = new Date(iso);
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return "";
  }
}

/* ===================== styles ===================== */
const S = {
  page: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "18px 14px 32px",
  },
  header: { marginBottom: 12 },
  h1: { fontSize: 30, margin: "8px 0 4px" },
  sub: { margin: 0, opacity: 0.8, lineHeight: 1.35 },

  ctaRow: { display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0 16px" },
  ctaPrimary: {
    display: "inline-block",
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(0, 140, 255, 0.18)",
    border: "1px solid rgba(0, 140, 255, 0.35)",
    color: "#e8f4ff",
    textDecoration: "none",
    fontWeight: 800,
  },
  ctaSecondary: {
    display: "inline-block",
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#e6edf3",
    textDecoration: "none",
    fontWeight: 700,
  },

  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  h2: { margin: 0, fontSize: 18 },
  linkBtn: {
    display: "inline-block",
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#e6edf3",
    textDecoration: "none",
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 520 },
  thNum: { textAlign: "left", padding: "10px 10px", opacity: 0.7, fontSize: 12 },
  thTeam: { textAlign: "left", padding: "10px 10px", opacity: 0.7, fontSize: 12 },
  thMini: { textAlign: "right", padding: "10px 10px", opacity: 0.7, fontSize: 12 },

  tdNum: { padding: "10px 10px", borderTop: "1px solid rgba(255,255,255,0.06)", opacity: 0.9, width: 34 },
  tdTeam: { padding: "10px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" },
  tdMini: { padding: "10px 10px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "right", fontVariantNumeric: "tabular-nums" },

  crest: { width: 18, height: 18, borderRadius: 6, marginRight: 8, verticalAlign: "middle" },
  teamName: { verticalAlign: "middle" },

  list: { display: "flex", flexDirection: "column", gap: 10 },
  matchRow: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "rgba(0,0,0,0.18)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset",
  },
  matchTop: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 },
  matchWhen: { opacity: 0.75, fontSize: 12 },
  matchStatus: {
    opacity: 0.85,
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
  },

  matchTeams: { display: "flex", flexDirection: "column", gap: 8 },
  teamLine: { display: "grid", gridTemplateColumns: "20px 1fr 28px", alignItems: "center", gap: 10 },
  crestSm: { width: 18, height: 18, borderRadius: 6 },
  teamLabel: { opacity: 0.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  scoreNum: { textAlign: "right", fontWeight: 900, fontVariantNumeric: "tabular-nums" },

  badgeLive: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(66, 190, 101, 0.16)",
    border: "1px solid rgba(66, 190, 101, 0.35)",
  },

  miniNote: { opacity: 0.75, fontSize: 12 },

  smallList: { display: "flex", flexDirection: "column", gap: 8 },
  smallRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.14)",
  },

  newsList: { display: "flex", flexDirection: "column", gap: 10 },
  newsItem: {
    display: "block",
    textDecoration: "none",
    color: "#e6edf3",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.14)",
  },
  newsTitle: { fontWeight: 900, marginBottom: 6 },
  newsMeta: { opacity: 0.75, fontSize: 12 },

  footer: { marginTop: 18, textAlign: "center" },
};
