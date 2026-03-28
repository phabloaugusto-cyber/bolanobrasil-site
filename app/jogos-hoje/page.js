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
    case "POSTPONED":
      return "Adiado";
    case "FINISHED":
      return "Encerrado";
    case "CANCELED":
      return "Cancelado";
    default:
      return status || "—";
  }
}

function formatarHoraBrasil(dateString) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return "--:--";
  }
}

function formatarDataBrasil(dateString) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return "--/--";
  }
}

function getBrazilDateParts(dateString) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateString));

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getTodayBrazil() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getTeamName(team) {
  return team?.shortName || team?.tla || team?.name || "Time";
}

async function getJogos() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/matches?competition=BSA&season=2026`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data?.matches || [];
}

export default async function JogosHojePage() {
  const matches = await getJogos();
  const todayBrazil = getTodayBrazil();

  const jogosHoje = matches
    .filter((match) => getBrazilDateParts(match?.utcDate) === todayBrazil)
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <Link href="/" style={styles.backLink}>
          ← Voltar Home
        </Link>

        <h1 style={styles.title}>Jogos de hoje</h1>

        {jogosHoje.length === 0 ? (
          <div style={styles.emptyCard}>Nenhum jogo hoje.</div>
        ) : (
          <div style={styles.list}>
            {jogosHoje.map((match) => (
              <div key={match.id} style={styles.card}>
                <div style={styles.meta}>
                  <span>{traduzirStatus(match.status)}</span>
                  <span>
                    {formatarDataBrasil(match.utcDate)} • {formatarHoraBrasil(match.utcDate)}
                  </span>
                </div>

                <div style={styles.scoreGrid}>
                  <div style={styles.homeTeam}>{getTeamName(match.homeTeam)}</div>

                  <div style={styles.score}>
                    {(match.score?.fullTime?.home ?? "-")} x {(match.score?.fullTime?.away ?? "-")}
                  </div>

                  <div style={styles.awayTeam}>{getTeamName(match.awayTeam)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    background: "#050816",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  wrap: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "20px 16px 32px",
  },
  backLink: {
    display: "inline-block",
    marginBottom: 18,
    textDecoration: "none",
    color: "#7dd3fc",
    fontWeight: 600,
  },
  title: {
    marginTop: 0,
    marginBottom: 18,
    fontSize: 30,
    fontWeight: 900,
  },
  emptyCard: {
    background: "#11182b",
    borderRadius: 16,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#b8c2cc",
  },
  list: {
    display: "grid",
    gap: 12,
  },
  card: {
    background: "#11182b",
    borderRadius: 16,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
    fontSize: 13,
    opacity: 0.8,
    gap: 10,
    flexWrap: "wrap",
  },
  scoreGrid: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 10,
    alignItems: "center",
  },
  homeTeam: {
    textAlign: "right",
    fontWeight: 700,
  },
  awayTeam: {
    textAlign: "left",
    fontWeight: 700,
  },
  score: {
    fontSize: 22,
    fontWeight: 800,
  },
};
