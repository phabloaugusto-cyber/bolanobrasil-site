"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function traduzirStatus(status) {
  switch (status) {
    case "TIMED":
    case "SCHEDULED":
      return "Agendado";
    case "LIVE":
      return "Ao vivo";
    case "IN_PLAY":
      return "Em andamento";
    case "PAUSED":
      return "Intervalo";
    case "HT":
      return "Intervalo";
    case "1H":
      return "1º tempo";
    case "2H":
      return "2º tempo";
    case "POSTPONED":
      return "Adiado";
    case "FINISHED":
    case "FT":
      return "Encerrado";
    case "CANCELED":
      return "Cancelado";
    case "SUSPENDED":
      return "Suspenso";
    default:
      return status || "—";
  }
}

function formatarDataHoraBrasil(dateString) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return "--/--/---- --:--";
  }
}

function isJogoClicavel(status) {
  const s = String(status || "").toUpperCase();

  return (
    s === "FINISHED" ||
    s === "FT" ||
    s === "SCHEDULED" ||
    s === "TIMED"
  );
}

function getCardTone(status) {
  const s = String(status || "").toUpperCase();

  if (s === "FINISHED" || s === "FT") {
    return {
      border: "1px solid rgba(94, 234, 212, 0.22)",
      background: "linear-gradient(180deg, rgba(20,40,44,0.45) 0%, rgba(0,0,0,0.16) 100%)",
      pillBg: "rgba(94, 234, 212, 0.10)",
      pillBorder: "1px solid rgba(94, 234, 212, 0.18)",
      pillColor: "#baf7ef",
    };
  }

  if (s === "SCHEDULED" || s === "TIMED") {
    return {
      border: "1px solid rgba(147, 197, 253, 0.22)",
      background: "linear-gradient(180deg, rgba(18,30,52,0.50) 0%, rgba(0,0,0,0.16) 100%)",
      pillBg: "rgba(147, 197, 253, 0.10)",
      pillBorder: "1px solid rgba(147, 197, 253, 0.18)",
      pillColor: "#cfe5ff",
    };
  }

  return {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.16)",
    pillBg: "rgba(255,255,255,0.06)",
    pillBorder: "1px solid rgba(255,255,255,0.12)",
    pillColor: "#e6edf3",
  };
}

function MatchCard({ match }) {
  const clicavel = isJogoClicavel(match.status);
  const tone = getCardTone(match.status);

  const content = (
    <div
      style={{
        ...styles.matchCard,
        border: tone.border,
        background: tone.background,
        ...(clicavel ? styles.matchCardClickable : {}),
      }}
    >
      <div style={styles.matchMeta}>
        <span>{formatarDataHoraBrasil(match.utcDate)}</span>
        <span
          style={{
            ...styles.statusPill,
            background: tone.pillBg,
            border: tone.pillBorder,
            color: tone.pillColor,
          }}
        >
          {traduzirStatus(match.status)}
        </span>
      </div>

      <div style={styles.scoreLine}>
        <img
          src={match.homeTeam?.crest}
          alt={`Escudo do ${match.homeTeam?.shortName || match.homeTeam?.name}`}
          style={styles.crestSm}
        />
        <span style={styles.teamLabel}>
          {match.homeTeam?.shortName || match.homeTeam?.name}
        </span>
        <span style={styles.scoreNum}>
          {match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? "-"}
        </span>
      </div>

      <div style={styles.scoreLine}>
        <img
          src={match.awayTeam?.crest}
          alt={`Escudo do ${match.awayTeam?.shortName || match.awayTeam?.name}`}
          style={styles.crestSm}
        />
        <span style={styles.teamLabel}>
          {match.awayTeam?.shortName || match.awayTeam?.name}
        </span>
        <span style={styles.scoreNum}>
          {match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? "-"}
        </span>
      </div>

      {clicavel ? (
        <div style={styles.cardFooter}>
          <span style={styles.cardHint}>
            {String(match.status || "").toUpperCase() === "FINISHED" ||
            String(match.status || "").toUpperCase() === "FT"
              ? "Ver resumo do jogo"
              : "Ver informações da partida"}
          </span>
          <span style={styles.cardArrow}>→</span>
        </div>
      ) : null}
    </div>
  );

  if (!clicavel) return content;

  return (
    <Link href={`/jogo/${match.id}`} style={styles.cardLink}>
      {content}
    </Link>
  );
}

export default function JogosPage() {
  const [matches, setMatches] = useState([]);
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/matches?competition=BSA&season=2026", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Erro ao carregar jogos");
        }

        const data = await res.json();
        const list = data?.matches || [];
        setMatches(list);

        const rounds = [...new Set(list.map((m) => m.matchday).filter(Boolean))].sort(
          (a, b) => a - b
        );

        const now = new Date();

        const nextScheduledMatch = list
          .filter((m) => m.utcDate && new Date(m.utcDate) > now)
          .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0];

        if (nextScheduledMatch?.matchday) {
          setRound(nextScheduledMatch.matchday);
        } else if (rounds.length) {
          setRound(rounds[0]);
        }
      } catch (e) {
        setErr(e?.message || "Erro ao carregar jogos");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const rounds = useMemo(() => {
    return [...new Set(matches.map((m) => m.matchday).filter(Boolean))].sort((a, b) => a - b);
  }, [matches]);

  const roundMatches = useMemo(() => {
    return matches
      .filter((m) => m.matchday === round)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  }, [matches, round]);

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.title}>Jogos do Brasileirão 2026</h1>
          <p style={styles.lead}>
            Veja os jogos do Brasileirão por rodada, com datas, horários, status das
            partidas e placares atualizados. Jogos encerrados e agendados podem ser
            abertos para ver mais informações.
          </p>
        </div>

        <Link href="/" style={styles.linkBtn}>
          ← Voltar Home
        </Link>
      </div>

      {loading ? (
        <div style={styles.card}>Carregando…</div>
      ) : err ? (
        <div style={styles.card}>
          <div style={{ color: "#ffb4b4" }}>{err}</div>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.roundHeader}>
            <h2 style={styles.sectionTitle}>Partidas por rodada</h2>
          </div>

          <div style={styles.roundStrip}>
            {rounds.map((r) => (
              <button
                key={r}
                onClick={() => setRound(r)}
                style={r === round ? styles.roundBtnActive : styles.roundBtn}
              >
                {r}
              </button>
            ))}
          </div>

          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "rgba(94, 234, 212, 0.7)" }} />
              encerrado clicável
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "rgba(147, 197, 253, 0.7)" }} />
              agendado clicável
            </span>
          </div>

          <div style={styles.list}>
            {roundMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}

            {!roundMatches.length && (
              <div style={styles.emptyBox}>
                Nenhum jogo encontrado para esta rodada no momento.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 900,
    margin: "0 auto",
    padding: 16,
    color: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  title: {
    fontSize: 28,
    fontWeight: 900,
    margin: 0,
  },

  lead: {
    margin: "8px 0 0",
    maxWidth: 680,
    lineHeight: 1.6,
    color: "#b8c2cc",
    fontSize: 14,
  },

  linkBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#e6edf3",
    textDecoration: "none",
    fontWeight: 800,
  },

  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 14,
  },

  roundHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 8,
  },

  sectionTitle: {
    margin: "0 0 10px",
    fontSize: 18,
  },

  roundStrip: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 8,
    marginBottom: 12,
  },

  roundBtn: {
    minWidth: 40,
    height: 36,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e6edf3",
    fontWeight: 900,
  },

  roundBtnActive: {
    minWidth: 40,
    height: 36,
    borderRadius: 999,
    border: "1px solid rgba(0,140,255,0.45)",
    background: "rgba(0,140,255,0.22)",
    color: "#e6edf3",
    fontWeight: 900,
  },

  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 12,
    color: "#b8c2cc",
    fontSize: 12,
  },

  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  cardLink: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },

  matchCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "rgba(0,0,0,0.16)",
  },

  matchCardClickable: {
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },

  matchMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    fontSize: 12,
    opacity: 0.8,
    flexWrap: "wrap",
  },

  statusPill: {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e6edf3",
  },

  scoreLine: {
    display: "grid",
    gridTemplateColumns: "20px 1fr 28px",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },

  crestSm: {
    width: 18,
    height: 18,
    borderRadius: 6,
    objectFit: "contain",
  },

  teamLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  scoreNum: {
    textAlign: "right",
    fontWeight: 900,
  },

  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  cardHint: {
    color: "#b8d4ff",
    fontWeight: 700,
    fontSize: 13,
  },

  cardArrow: {
    color: "#b8d4ff",
    fontWeight: 900,
    fontSize: 16,
  },

  emptyBox: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: 14,
    textAlign: "center",
    color: "#b8c2cc",
  },
};
