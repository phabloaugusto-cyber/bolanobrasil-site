"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function traduzirStatus(status) {
  switch ((status || "").toUpperCase()) {
    case "TIMED":
    case "SCHEDULED":
      return "Agendado";
    case "LIVE":
      return "Ao vivo";
    case "IN_PLAY":
      return "Em andamento";
    case "PAUSED":
    case "HT":
      return "Intervalo";
    case "1H":
      return "1º tempo";
    case "2H":
      return "2º tempo";
    case "ET":
      return "Prorrogação";
    case "BREAK":
      return "Pausa";
    case "PEN":
      return "Pênaltis";
    case "POSTPONED":
      return "Adiado";
    case "FINISHED":
    case "FT":
      return "Encerrado";
    case "CANCELED":
      return "Cancelado";
    case "SUSPENDED":
      return "Suspenso";
    case "AWARDED":
      return "Vitória administrativa";
    default:
      return status || "—";
  }
}

function traduzirFaseAoVivo(status, minute) {
  const s = (status || "").toUpperCase();
  const minuto = typeof minute === "number" && minute > 0 ? `${minute}'` : null;

  switch (s) {
    case "LIVE":
      return minuto ? `Ao vivo • ${minuto}` : "Ao vivo";
    case "IN_PLAY":
      return minuto ? `Em andamento • ${minuto}` : "Em andamento";
    case "PAUSED":
    case "HT":
      return "Intervalo";
    case "1H":
      return minuto ? `1º tempo • ${minuto}` : "1º tempo";
    case "2H":
      return minuto ? `2º tempo • ${minuto}` : "2º tempo";
    case "ET":
      return "Prorrogação";
    case "BREAK":
      return "Pausa";
    case "PEN":
      return "Pênaltis";
    default:
      return traduzirStatus(status);
  }
}

function getStatusTone(status) {
  const s = (status || "").toUpperCase();

  if (s === "LIVE" || s === "IN_PLAY" || s === "1H" || s === "2H") {
    return {
      badge: "rgba(255,80,80,0.16)",
      border: "1px solid rgba(255,80,80,0.30)",
      chipColor: "#ffb0b0",
      cardBorder: "1px solid rgba(255,80,80,0.18)",
    };
  }

  if (s === "PAUSED" || s === "HT") {
    return {
      badge: "rgba(255,190,60,0.14)",
      border: "1px solid rgba(255,190,60,0.28)",
      chipColor: "#ffd98a",
      cardBorder: "1px solid rgba(255,190,60,0.16)",
    };
  }

  return {
    badge: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.24)",
    chipColor: "#b8d8ff",
    cardBorder: "1px solid rgba(255,255,255,0.08)",
  };
}

function scoreNumber(value) {
  return typeof value === "number" ? value : "-";
}

function getNarrativa(match) {
  const status = (match?.status || "").toUpperCase();
  const home = match?.homeTeam?.shortName || match?.homeTeam?.name || "Mandante";
  const away = match?.awayTeam?.shortName || match?.awayTeam?.name || "Visitante";

  const homeGoals =
    match?.score?.fullTime?.home ??
    match?.score?.halfTime?.home ??
    match?.score?.regularTime?.home;

  const awayGoals =
    match?.score?.fullTime?.away ??
    match?.score?.halfTime?.away ??
    match?.score?.regularTime?.away;

  if (typeof homeGoals === "number" && typeof awayGoals === "number") {
    if (homeGoals > awayGoals) return `${home} vai vencendo.`;
    if (awayGoals > homeGoals) return `${away} vai vencendo.`;
    return "Partida empatada no momento.";
  }

  if (status === "PAUSED" || status === "HT") return "Jogo parado no intervalo.";
  if (status === "1H") return "Primeiro tempo em andamento.";
  if (status === "2H") return "Segundo tempo em andamento.";
  if (status === "LIVE" || status === "IN_PLAY") return "Partida em andamento.";

  return "Acompanhe os jogos ao vivo do Brasileirão.";
}

export default function AoVivoPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const res = await fetch("/api/matches?competition=BSA&season=2026", {
          cache: "no-store",
        });

        const data = await res.json();
        const list = data?.matches || [];

        const live = list.filter((m) => {
          const s = (m?.status || "").toUpperCase();
          return (
            s === "LIVE" ||
            s === "IN_PLAY" ||
            s === "PAUSED" ||
            s === "HT" ||
            s === "1H" ||
            s === "2H" ||
            s === "ET" ||
            s === "PEN"
          );
        });

        setMatches(live);
      } catch (e) {
        console.log("erro ao vivo");
      } finally {
        setLoading(false);
      }
    }

    load();

    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const orderedMatches = useMemo(() => {
    return [...matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  }, [matches]);

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <p style={styles.kicker}>BolaNoBrasil</p>
          <h1 style={styles.title}>Jogos ao vivo</h1>
        </div>

        <Link href="/" style={styles.linkBtn}>
          ← Voltar Home
        </Link>
      </div>

      {loading ? (
        <div style={styles.card}>Carregando...</div>
      ) : orderedMatches.length === 0 ? (
        <div style={styles.card}>Nenhum jogo ao vivo agora.</div>
      ) : (
        <div style={styles.list}>
          {orderedMatches.map((m) => {
            const tone = getStatusTone(m.status);
            const homeGoals =
              m.score?.fullTime?.home ??
              m.score?.halfTime?.home ??
              m.score?.regularTime?.home;

            const awayGoals =
              m.score?.fullTime?.away ??
              m.score?.halfTime?.away ??
              m.score?.regularTime?.away;

            return (
              <Link key={m.id} href={`/jogo/${m.id}`} style={{ ...styles.matchCard, border: tone.cardBorder }}>
                <div style={styles.matchMeta}>
                  <span
                    style={{
                      ...styles.liveBadge,
                      background: tone.badge,
                      border: tone.border,
                      color: tone.chipColor,
                    }}
                  >
                    {traduzirFaseAoVivo(m.status, m.minute)}
                  </span>

                  <span style={styles.statusText}>{getNarrativa(m)}</span>
                </div>

                <div style={styles.scoreBoard}>
                  <div style={styles.teamCol}>
                    <span style={styles.teamName}>
                      {m.homeTeam?.shortName || m.homeTeam?.name}
                    </span>
                  </div>

                  <div style={styles.scoreCenter}>
                    <strong style={styles.scoreMain}>{scoreNumber(homeGoals)}</strong>
                    <span style={styles.scoreDivider}>x</span>
                    <strong style={styles.scoreMain}>{scoreNumber(awayGoals)}</strong>
                  </div>

                  <div style={styles.teamColRight}>
                    <span style={styles.teamNameRight}>
                      {m.awayTeam?.shortName || m.awayTeam?.name}
                    </span>
                  </div>
                </div>

                <div style={styles.footerRow}>
                  <span style={styles.competitionText}>Brasileirão Série A</span>
                  <span style={styles.openLink}>Abrir jogo →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "16px 16px 140px",
    color: "#f5f7fb",
    background: "#050816",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  kicker: {
    margin: "0 0 6px 0",
    color: "#ffb4b4",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    fontSize: 30,
    fontWeight: 900,
    margin: 0,
    letterSpacing: "-0.03em",
  },

  linkBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    background: "#0d1726",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#e6edf3",
    textDecoration: "none",
    fontWeight: 800,
  },

  card: {
    background: "#0d1726",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 16,
    color: "#b8c2cc",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  matchCard: {
    display: "block",
    textDecoration: "none",
    background: "linear-gradient(180deg, #101d31 0%, #0d1726 100%)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
  },

  matchMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
    flexWrap: "wrap",
  },

  liveBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.04em",
  },

  statusText: {
    color: "#b8c2cc",
    fontSize: 13,
    fontWeight: 600,
  },

  scoreBoard: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 12,
  },

  teamCol: {
    minWidth: 0,
  },

  teamColRight: {
    minWidth: 0,
    textAlign: "right",
  },

  teamName: {
    display: "block",
    fontSize: 18,
    fontWeight: 800,
    color: "#f5f7fb",
    lineHeight: 1.2,
    wordBreak: "break-word",
  },

  teamNameRight: {
    display: "block",
    fontSize: 18,
    fontWeight: 800,
    color: "#f5f7fb",
    lineHeight: 1.2,
    wordBreak: "break-word",
  },

  scoreCenter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "10px 14px",
  },

  scoreMain: {
    fontSize: 28,
    fontWeight: 900,
    color: "#ffffff",
    minWidth: 18,
    textAlign: "center",
  },

  scoreDivider: {
    fontSize: 18,
    fontWeight: 800,
    color: "#94a3b8",
  },

  footerRow: {
    marginTop: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  competitionText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 600,
  },

  openLink: {
    color: "#93c5fd",
    fontSize: 13,
    fontWeight: 800,
  },
};
