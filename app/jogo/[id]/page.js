import Link from "next/link";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtBRDateTime(iso) {
  try {
    const d = new Date(iso);
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(
      d.getHours()
    )}:${pad2(d.getMinutes())}`;
  } catch {
    return iso || "-";
  }
}

function safeTeamName(t) {
  return t?.shortName || t?.tla || t?.name || "Time";
}

function safeCrest(t) {
  return t?.crest || t?.crestUrl || null;
}

function getGoals(match) {
  const ft = match?.score?.fullTime || {};
  const ht = match?.score?.halfTime || {};
  const rt = match?.score?.regularTime || {};

  const home =
    typeof ft.home === "number"
      ? ft.home
      : typeof rt.home === "number"
      ? rt.home
      : typeof ht.home === "number"
      ? ht.home
      : null;

  const away =
    typeof ft.away === "number"
      ? ft.away
      : typeof rt.away === "number"
      ? rt.away
      : typeof ht.away === "number"
      ? ht.away
      : null;

  return { home, away };
}

function scoreText(match) {
  const { home, away } = getGoals(match);

  if (typeof home === "number" && typeof away === "number") {
    return `${home} - ${away}`;
  }

  return "Sem placar";
}

function statusLabel(s) {
  const v = String(s || "").toUpperCase();
  if (v === "SCHEDULED") return "AGENDADO";
  if (v === "TIMED") return "AGENDADO";
  if (v === "LIVE") return "AO VIVO";
  if (v === "IN_PLAY") return "EM ANDAMENTO";
  if (v === "PAUSED" || v === "HT") return "INTERVALO";
  if (v === "1H") return "1º TEMPO";
  if (v === "2H") return "2º TEMPO";
  if (v === "ET") return "PRORROGAÇÃO";
  if (v === "PEN") return "PÊNALTIS";
  if (v === "FINISHED" || v === "FT") return "ENCERRADO";
  if (v === "POSTPONED") return "ADIADO";
  if (v === "SUSPENDED") return "SUSPENSO";
  if (v === "CANCELED") return "CANCELADO";
  return v || "-";
}

function buildFinishedSummary(match, homeName, awayName) {
  const { home, away } = getGoals(match);
  const venue = match?.venue || "estádio não informado";
  const matchday = match?.matchday ?? "-";

  if (typeof home !== "number" || typeof away !== "number") {
    return `A partida entre ${homeName} e ${awayName} foi encerrada, mas o placar final não está disponível neste momento.`;
  }

  if (home === away) {
    return `${homeName} e ${awayName} empataram por ${home} a ${away} em jogo válido pela rodada ${matchday}. O confronto terminou sem vencedor no ${venue}.`;
  }

  const winner = home > away ? homeName : awayName;
  const loser = home > away ? awayName : homeName;
  const winnerGoals = Math.max(home, away);
  const loserGoals = Math.min(home, away);
  const diff = Math.abs(home - away);

  if (diff >= 3) {
    return `${winner} venceu ${loser} por ${winnerGoals} a ${loserGoals} com ampla vantagem na rodada ${matchday}. O resultado foi construído no ${venue} e deixa o placar com cara de vitória convincente.`;
  }

  if (diff === 2) {
    return `${winner} venceu ${loser} por ${winnerGoals} a ${loserGoals} em partida encerrada pela rodada ${matchday}. O resultado no ${venue} dá ao vencedor uma vitória com boa margem.`;
  }

  return `${winner} venceu ${loser} por ${winnerGoals} a ${loserGoals} em jogo válido pela rodada ${matchday}. O placar apertado no ${venue} mostra um confronto decidido por margem mínima.`;
}

function buildScheduledSummary(match, homeName, awayName) {
  const venue = match?.venue || "estádio ainda não informado";
  const kickoff = fmtBRDateTime(match?.utcDate);
  const matchday = match?.matchday ?? "-";

  return `${homeName} e ${awayName} se enfrentam pela rodada ${matchday}. O jogo está marcado para ${kickoff}, no ${venue}.`;
}

function buildLiveSummary(match, homeName, awayName) {
  const { home, away } = getGoals(match);
  const status = String(match?.status || "").toUpperCase();

  if (typeof home === "number" && typeof away === "number") {
    if (home > away) {
      return `${homeName} vai vencendo por ${home} a ${away}. A partida segue ${statusLabel(status).toLowerCase()}.`;
    }
    if (away > home) {
      return `${awayName} vai vencendo por ${away} a ${home}. A partida segue ${statusLabel(status).toLowerCase()}.`;
    }
    return `${homeName} e ${awayName} estão empatando por ${home} a ${away}. O jogo segue ${statusLabel(status).toLowerCase()}.`;
  }

  return `A partida entre ${homeName} e ${awayName} está ${statusLabel(status).toLowerCase()}.`;
}

function buildGameSummary(match, homeName, awayName) {
  const status = String(match?.status || "").toUpperCase();

  if (status === "FINISHED" || status === "FT") {
    return buildFinishedSummary(match, homeName, awayName);
  }

  if (status === "SCHEDULED" || status === "TIMED") {
    return buildScheduledSummary(match, homeName, awayName);
  }

  if (
    status === "LIVE" ||
    status === "IN_PLAY" ||
    status === "PAUSED" ||
    status === "HT" ||
    status === "1H" ||
    status === "2H" ||
    status === "ET" ||
    status === "PEN"
  ) {
    return buildLiveSummary(match, homeName, awayName);
  }

  if (status === "POSTPONED") {
    return `O confronto entre ${homeName} e ${awayName} foi adiado.`;
  }

  if (status === "CANCELED") {
    return `O confronto entre ${homeName} e ${awayName} foi cancelado.`;
  }

  if (status === "SUSPENDED") {
    return `O confronto entre ${homeName} e ${awayName} está suspenso.`;
  }

  return `Acompanhe as informações de ${homeName} x ${awayName}.`;
}

function sectionTitleByStatus(match) {
  const status = String(match?.status || "").toUpperCase();

  if (status === "FINISHED" || status === "FT") return "Resumo automático da partida";
  if (status === "SCHEDULED" || status === "TIMED") return "Pré-jogo automático";
  if (
    status === "LIVE" ||
    status === "IN_PLAY" ||
    status === "PAUSED" ||
    status === "HT" ||
    status === "1H" ||
    status === "2H" ||
    status === "ET" ||
    status === "PEN"
  ) {
    return "Panorama do jogo";
  }

  return "Resumo do confronto";
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/+$/, "");
  }

  return "https://bolanobrasil.com.br";
}

export default async function JogoPage({ params, searchParams }) {
  const id = params?.id;
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/match?id=${id}`, {
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) {
    return (
      <div style={styles.page}>
        <Link href="/jogos" style={styles.back}>
          ← Voltar aos jogos
        </Link>

        <div style={styles.card}>
          <h1 style={{ margin: 0 }}>Jogo</h1>
          <p style={{ opacity: 0.85, marginTop: 10 }}>
            Não foi possível carregar os dados deste jogo agora.
          </p>
          <div style={styles.muted}>Tente novamente em alguns minutos.</div>
        </div>
      </div>
    );
  }

  const data = await res.json();
  const m = data?.match || data;

  const home = m?.homeTeam || {};
  const away = m?.awayTeam || {};
  const homeName = safeTeamName(home);
  const awayName = safeTeamName(away);
  const homeCrest = safeCrest(home);
  const awayCrest = safeCrest(away);

  const competition = m?.competition?.name || "Campeonato";
  const season = m?.season?.startDate ? String(m.season.startDate).slice(0, 4) : "";
  const matchday = m?.matchday ?? "-";
  const kickoff = fmtBRDateTime(m?.utcDate);
  const venue = m?.venue || "-";
  const status = statusLabel(m?.status);
  const score = scoreText(m);
  const summaryTitle = sectionTitleByStatus(m);
  const summaryText = buildGameSummary(m, homeName, awayName);

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <Link href="/jogos" style={styles.back}>
          ← Voltar aos jogos
        </Link>
      </div>

      <div style={styles.headerCard}>
        <div style={styles.meta}>
          <div style={styles.comp}>
            {competition}
            {season ? ` • ${season}` : ""}
          </div>
          <div style={styles.submeta}>
            Rodada <strong>{matchday}</strong> • <strong>{kickoff}</strong> • {status}
          </div>
          <div style={styles.submeta}>
            Estádio: <strong>{venue}</strong>
          </div>
        </div>

        <div style={styles.teamsWrap}>
          <div style={styles.teamBlock}>
            {homeCrest ? <img src={homeCrest} alt={homeName} style={styles.crestBig} /> : null}
            <div style={styles.teamName}>{homeName}</div>
          </div>

          <div style={styles.scoreBlock}>
            <div style={styles.scoreMain}>{score}</div>
            <div style={styles.scoreSmall}>ID do jogo: {m?.id}</div>
          </div>

          <div style={styles.teamBlock}>
            {awayCrest ? <img src={awayCrest} alt={awayName} style={styles.crestBig} /> : null}
            <div style={styles.teamName}>{awayName}</div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.h2}>Detalhes</h2>
          <div style={styles.kv}>
            <span style={styles.k}>Status</span>
            <span style={styles.v}>{status}</span>
          </div>
          <div style={styles.kv}>
            <span style={styles.k}>Data/Hora</span>
            <span style={styles.v}>{kickoff}</span>
          </div>
          <div style={styles.kv}>
            <span style={styles.k}>Rodada</span>
            <span style={styles.v}>{matchday}</span>
          </div>
          <div style={styles.kv}>
            <span style={styles.k}>Estádio</span>
            <span style={styles.v}>{venue}</span>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.h2}>{summaryTitle}</h2>
          <p style={styles.summaryText}>{summaryText}</p>
        </div>
      </div>

      <div style={styles.bottomGrid}>
        <div style={styles.card}>
          <h2 style={styles.h2}>Navegação</h2>
          <div style={styles.linkList}>
            <Link href="/jogos" style={styles.inlineLink}>
              Ver todos os jogos
            </Link>
            <Link href="/ao-vivo" style={styles.inlineLink}>
              Ver jogos ao vivo
            </Link>
            <Link href="/tabela" style={styles.inlineLink}>
              Ver tabela do campeonato
            </Link>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.h2}>Anúncio</h2>
          <div style={{ marginTop: 10 }}>
            <div style={styles.adBox}>ESPAÇO PARA ANÚNCIO (IN-ARTICLE)</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={styles.footerNote}>
          Página de jogo com leitura automática para partidas agendadas, ao vivo e encerradas.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "26px 16px 140px",
    color: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  back: {
    display: "inline-block",
    textDecoration: "none",
    color: "rgba(200,220,255,0.95)",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 800,
  },
  headerCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    background: "rgba(0,0,0,0.18)",
    padding: 16,
  },
  meta: {
    marginBottom: 14,
  },
  comp: {
    fontWeight: 900,
    letterSpacing: -0.2,
    fontSize: 16,
    opacity: 0.95,
  },
  submeta: {
    marginTop: 6,
    opacity: 0.8,
    fontSize: 13,
    lineHeight: 1.35,
  },
  teamsWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 240px 1fr",
    gap: 12,
    alignItems: "center",
  },
  teamBlock: {
    display: "grid",
    justifyItems: "center",
    gap: 8,
  },
  crestBig: {
    width: 74,
    height: 74,
    objectFit: "contain",
    filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.35))",
  },
  teamName: {
    fontWeight: 950,
    textAlign: "center",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  scoreBlock: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    textAlign: "center",
  },
  scoreMain: {
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: -0.6,
  },
  scoreSmall: {
    marginTop: 6,
    opacity: 0.75,
    fontSize: 12,
  },
  grid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  bottomGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  card: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    background: "rgba(0,0,0,0.18)",
    padding: 16,
  },
  h2: {
    margin: 0,
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: -0.2,
  },
  kv: {
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  k: {
    opacity: 0.75,
  },
  v: {
    fontWeight: 900,
    textAlign: "right",
  },
  summaryText: {
    margin: "12px 0 0 0",
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 1.7,
  },
  linkList: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  inlineLink: {
    color: "#93c5fd",
    textDecoration: "none",
    fontWeight: 700,
  },
  adBox: {
    border: "1px dashed rgba(255,255,255,0.22)",
    borderRadius: 14,
    padding: "18px 12px",
    textAlign: "center",
    opacity: 0.85,
    background: "rgba(255,255,255,0.03)",
  },
  muted: {
    opacity: 0.8,
  },
  footerNote: {
    opacity: 0.7,
    fontSize: 12,
    textAlign: "center",
  },
};
