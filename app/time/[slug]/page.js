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
    case "POSTPONED":
      return "Adiado";
    case "FINISHED":
      return "Encerrado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status || "—";
  }
}

function normalizarTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
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
    return "—";
  }
}

function formatarDataBrasil(dateString) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return "--/--/----";
  }
}

function getTeamSlug(team) {
  return normalizarTexto(team?.shortName || team?.name || "");
}

function getTeamName(team) {
  return team?.shortName || team?.name || "Time";
}

function getResultadoDoTime(match, slug) {
  const homeSlug = getTeamSlug(match?.homeTeam);
  const awaySlug = getTeamSlug(match?.awayTeam);

  const homeGoals = match?.score?.fullTime?.home;
  const awayGoals = match?.score?.fullTime?.away;

  if (
    homeGoals === null ||
    homeGoals === undefined ||
    awayGoals === null ||
    awayGoals === undefined
  ) {
    return null;
  }

  const isHome = homeSlug === slug;
  const golsPro = isHome ? homeGoals : awayGoals;
  const golsContra = isHome ? awayGoals : homeGoals;

  if (golsPro > golsContra) return "vitória";
  if (golsPro < golsContra) return "derrota";
  return "empate";
}

function montarResumoAutomatico({ clubeNome, teamStanding, ultimoJogo, proximoJogo, slug }) {
  if (!teamStanding) {
    return `O ${clubeNome} está sendo acompanhado no BolaNoBrasil. Em breve, mais detalhes automáticos sobre posição, momento da equipe e próximos compromissos.`;
  }

  const posicao = teamStanding?.position;
  const pontos = teamStanding?.points;
  const vitorias = teamStanding?.won;
  const empates = teamStanding?.draw;
  const derrotas = teamStanding?.lost;
  const saldo = teamStanding?.goalDifference;

  let fraseResultado = `No momento, o ${clubeNome} ocupa a ${posicao}ª posição do Brasileirão, com ${pontos} ponto${pontos === 1 ? "" : "s"}.`;

  if (ultimoJogo) {
    const resultado = getResultadoDoTime(ultimoJogo, slug);
    const adversario =
      getTeamSlug(ultimoJogo?.homeTeam) === slug
        ? getTeamName(ultimoJogo?.awayTeam)
        : getTeamName(ultimoJogo?.homeTeam);

    const homeGoals = ultimoJogo?.score?.fullTime?.home ?? "-";
    const awayGoals = ultimoJogo?.score?.fullTime?.away ?? "-";

    if (resultado) {
      fraseResultado += ` No último jogo, a equipe teve ${resultado} contra o ${adversario} por ${homeGoals} x ${awayGoals}.`;
    }
  }

  let fraseCampanha = ` A campanha atual soma ${vitorias} vitória${vitorias === 1 ? "" : "s"}, ${empates} empate${empates === 1 ? "" : "s"} e ${derrotas} derrota${derrotas === 1 ? "" : "s"}, com saldo de ${saldo}.`;

  let fraseProximo = "";
  if (proximoJogo) {
    const adversario =
      getTeamSlug(proximoJogo?.homeTeam) === slug
        ? getTeamName(proximoJogo?.awayTeam)
        : getTeamName(proximoJogo?.homeTeam);

    fraseProximo = ` O próximo compromisso será contra o ${adversario}, em ${formatarDataHoraBrasil(
      proximoJogo?.utcDate
    )}.`;
  }

  return `${fraseResultado}${fraseCampanha}${fraseProximo}`;
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(19,44,99,0.24) 0%, #071024 36%, #03060d 100%)",
    color: "#f5f7fb",
  },
  wrap: {
    maxWidth: 920,
    margin: "0 auto",
    padding: "20px 20px 160px 20px",
    color: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },
  backLink: {
    color: "#93c5fd",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
    display: "inline-flex",
    marginBottom: 16,
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 22,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
    marginBottom: 18,
  },
  heroCrest: {
    width: 64,
    height: 64,
    objectFit: "contain",
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    padding: 8,
  },
  heroCrestPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
  },
  heroText: { minWidth: 0 },
  title: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 900,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#d7deed",
    fontSize: 16,
  },
  card: {
    background: "#0d1726",
    borderRadius: 20,
    padding: 22,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    marginBottom: 18,
  },
  cardTitle: {
    margin: "0 0 14px",
    fontSize: 24,
    lineHeight: 1.08,
    fontWeight: 900,
  },
  cardTitleNoMargin: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.08,
    fontWeight: 900,
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  statBox: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
  },
  statLabel: {
    display: "block",
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 6,
    fontWeight: 700,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 900,
  },
  summaryText: {
    margin: 0,
    color: "#d7deed",
    fontSize: 16,
    lineHeight: 1.65,
  },
  analysisHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  analysisDate: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 700,
  },
  analysisTitle: {
    margin: "0 0 10px",
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 900,
  },
  analysisExcerpt: {
    margin: "0 0 14px",
    color: "#d7deed",
    fontSize: 17,
    lineHeight: 1.6,
  },
  analysisFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  analysisAuthor: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 700,
  },
  analysisButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 14,
    textDecoration: "none",
    background: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.22)",
    fontWeight: 800,
    fontSize: 14,
  },
  emptyBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 18,
    color: "#d7deed",
  },
};

export default function TimePage({ params }) {
  const { slug } = params;

  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [analisesDoTime, setAnalisesDoTime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [matchesRes, standingsRes, analisesRes] = await Promise.all([
          fetch("/api/matches?competition=BSA&season=2026", { cache: "no-store" }),
          fetch("/api/standings?competition=BSA&season=2026", { cache: "no-store" }),
          fetch(`/api/posts?type=analise&club=${slug}`, { cache: "no-store" }),
        ]);

        const matchesData = await matchesRes.json();
        const standingsData = await standingsRes.json();
        const analisesData = await analisesRes.json();

        setMatches(matchesData?.matches || []);

        const total =
          standingsData?.standings?.find((s) => s.type === "TOTAL") ||
          standingsData?.standings?.[0];

        setStandings(total?.table || []);
        setAnalisesDoTime(Array.isArray(analisesData) ? analisesData : []);
      } catch (e) {
        console.log("erro página do clube");
        setMatches([]);
        setStandings([]);
        setAnalisesDoTime([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  const teamStanding = useMemo(() => {
    return standings.find((t) => getTeamSlug(t?.team) === slug) || null;
  }, [standings, slug]);

  const clubeNome = teamStanding?.team?.name || slug.replace(/-/g, " ");
  const clubeEscudo =
    slug === "athletico-pr" || slug === "athletico"
      ? "/escudos/athletico-pr.png"
      : teamStanding?.team?.crest || "";

  const analiseDoTime = analisesDoTime[0] || null;

  const teamMatches = useMemo(() => {
    return matches
      .filter((m) => getTeamSlug(m?.homeTeam) === slug || getTeamSlug(m?.awayTeam) === slug)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  }, [matches, slug]);

  const agora = new Date();

  const ultimoJogo = useMemo(() => {
    const anterioresFinalizados = teamMatches
      .filter(
        (m) =>
          m?.utcDate &&
          new Date(m.utcDate) <= agora &&
          m?.status === "FINISHED"
      )
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));

    return anterioresFinalizados[0] || null;
  }, [teamMatches, agora]);

  const proximoJogo = useMemo(() => {
    const proximos = teamMatches
      .filter((m) => m?.utcDate && new Date(m.utcDate) > agora)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    return proximos[0] || null;
  }, [teamMatches, agora]);

  const resumoAutomatico = useMemo(() => {
    return montarResumoAutomatico({
      clubeNome,
      teamStanding,
      ultimoJogo,
      proximoJogo,
      slug,
    });
  }, [clubeNome, teamStanding, ultimoJogo, proximoJogo, slug]);

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <Link href="/" style={styles.backLink}>
          ← Voltar Home
        </Link>

        <section style={styles.hero}>
          {clubeEscudo ? (
            <img src={clubeEscudo} alt={clubeNome} style={styles.heroCrest} />
          ) : (
            <div style={styles.heroCrestPlaceholder} />
          )}

          <div style={styles.heroText}>
            <h1 style={styles.title}>{clubeNome}</h1>
            <p style={styles.subtitle}>Portal do clube no BolaNoBrasil</p>
          </div>
        </section>

        {loading ? (
          <div style={styles.card}>Carregando informações do clube...</div>
        ) : (
          <>
            {teamStanding && (
              <section style={styles.card}>
                <h2 style={styles.cardTitle}>Situação na tabela</h2>

                <div style={styles.tableGrid}>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Posição</span>
                    <strong style={styles.statValue}>{teamStanding.position}º</strong>
                  </div>

                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Pontos</span>
                    <strong style={styles.statValue}>{teamStanding.points}</strong>
                  </div>

                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Jogos</span>
                    <strong style={styles.statValue}>{teamStanding.playedGames}</strong>
                  </div>

                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Saldo</span>
                    <strong style={styles.statValue}>{teamStanding.goalDifference}</strong>
                  </div>
                </div>
              </section>
            )}

            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Resumo automático da fase do time</h2>
              <p style={styles.summaryText}>{resumoAutomatico}</p>
            </section>

            {analiseDoTime && (
              <section style={styles.card}>
                <div style={styles.analysisHeader}>
                  <h2 style={styles.cardTitleNoMargin}>Análise do momento</h2>
                  <span style={styles.analysisDate}>
                    {formatarDataBrasil(
                      analiseDoTime.published_at ||
                        analiseDoTime.publishedAt ||
                        analiseDoTime.created_at
                    )}
                  </span>
                </div>

                <h3 style={styles.analysisTitle}>
                  {analiseDoTime.title || analiseDoTime.titulo}
                </h3>

                <p style={styles.analysisExcerpt}>
                  {analiseDoTime.excerpt || analiseDoTime.resumo}
                </p>

                <div style={styles.analysisFooter}>
                  <span style={styles.analysisAuthor}>
                    {analiseDoTime.author || "Redação BolaNoBrasil"}
                  </span>

                  <Link
                    href={`/analises-times/${analiseDoTime.slug}`}
                    style={styles.analysisButton}
                  >
                    Ler análise completa
                  </Link>
                </div>
              </section>
            )}

            {!analiseDoTime && (
              <div style={styles.emptyBox}>
                Nenhuma análise do momento encontrada para este clube.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
