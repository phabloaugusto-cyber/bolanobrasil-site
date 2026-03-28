"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAnaliseTimeBySlug } from "../../../lib/analises-times";

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
    return "--/--/---- --:--";
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

export default function TimePage({ params }) {
  const { slug } = params;

  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [matchesRes, standingsRes] = await Promise.all([
          fetch("/api/matches?competition=BSA&season=2026", { cache: "no-store" }),
          fetch("/api/standings?competition=BSA&season=2026", { cache: "no-store" }),
        ]);

        const matchesData = await matchesRes.json();
        const standingsData = await standingsRes.json();

        setMatches(matchesData?.matches || []);

        const total =
          standingsData?.standings?.find((s) => s.type === "TOTAL") ||
          standingsData?.standings?.[0];

        setStandings(total?.table || []);
      } catch (e) {
        console.log("erro página do clube");
        setMatches([]);
        setStandings([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const teamStanding = useMemo(() => {
    return standings.find((t) => getTeamSlug(t?.team) === slug) || null;
  }, [standings, slug]);

  const clubeNome = teamStanding?.team?.name || slug.replace(/-/g, " ");
const clubeEscudo =
  slug === "athletico-pr" || slug === "athletico"
    ? "/escudos/athletico-pr.png"
    : teamStanding?.team?.crest || "";
  const analiseDoTime = getAnaliseTimeBySlug(slug);

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
}, [teamMatches]);

  const proximoJogo = useMemo(() => {
    const proximos = teamMatches
      .filter((m) => m?.utcDate && new Date(m.utcDate) > agora)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    return proximos[0] || null;
  }, [teamMatches]);

const ultimosJogos = useMemo(() => {
  return teamMatches
    .filter(
      (m) =>
        m?.utcDate &&
        new Date(m.utcDate) <= agora &&
        m?.status === "FINISHED"
    )
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 3);
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
                  <span style={styles.analysisDate}>{analiseDoTime.date}</span>
                </div>

                <h3 style={styles.analysisTitle}>{analiseDoTime.title}</h3>
                <p style={styles.analysisExcerpt}>{analiseDoTime.excerpt}</p>

                <div style={styles.analysisFooter}>
                  <span style={styles.analysisAuthor}>{analiseDoTime.author}</span>

                  <Link
                    href={`/analises-times/${slug}`}
                    style={styles.analysisButton}
                  >
                    Ler análise completa
                  </Link>
                </div>
              </section>
            )}

            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Próximo jogo</h2>

              {!proximoJogo ? (
                <div style={styles.emptyBox}>Nenhum próximo jogo encontrado no momento.</div>
              ) : (
                <div style={styles.matchHighlight}>
                  <div style={styles.matchMeta}>
                    <span>{traduzirStatus(proximoJogo.status)}</span>
                    <span>{formatarDataHoraBrasil(proximoJogo.utcDate)}</span>
                  </div>

                  <div style={styles.matchLine}>
                    <span style={styles.teamName}>{getTeamName(proximoJogo.homeTeam)}</span>
                    <span style={styles.versus}>x</span>
                    <span style={styles.teamName}>{getTeamName(proximoJogo.awayTeam)}</span>
                  </div>
                </div>
              )}
            </section>

            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Últimos 3 jogos</h2>

              {!ultimosJogos.length ? (
                <div style={styles.emptyBox}>Nenhum jogo encontrado para este clube.</div>
              ) : (
                <div style={styles.list}>
                  {ultimosJogos.map((match) => (
                    <div key={match.id} style={styles.matchCard}>
                      <div style={styles.matchMeta}>
                        <span>{traduzirStatus(match.status)}</span>
                        <span>{formatarDataBrasil(match.utcDate)}</span>
                      </div>

                      <div style={styles.scoreLine}>
                        <span style={styles.teamLabel}>{getTeamName(match.homeTeam)}</span>
                        <span style={styles.scoreNum}>
                          {match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? "-"}
                        </span>
                      </div>

                      <div style={styles.scoreLine}>
                        <span style={styles.teamLabel}>{getTeamName(match.awayTeam)}</span>
                        <span style={styles.scoreNum}>
                          {match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? "-"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {teamStanding && (
              <section style={styles.card}>
                <h2 style={styles.cardTitle}>Campanha no Brasileirão</h2>

                <div style={styles.campaignGrid}>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Vitórias</span>
                    <strong style={styles.statValue}>{teamStanding.won}</strong>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Empates</span>
                    <strong style={styles.statValue}>{teamStanding.draw}</strong>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Derrotas</span>
                    <strong style={styles.statValue}>{teamStanding.lost}</strong>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Gols Pró</span>
                    <strong style={styles.statValue}>{teamStanding.goalsFor}</strong>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Gols Contra</span>
                    <strong style={styles.statValue}>{teamStanding.goalsAgainst}</strong>
                  </div>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>Saldo</span>
                    <strong style={styles.statValue}>{teamStanding.goalDifference}</strong>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#050816",
    color: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },
  wrap: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "20px 16px 140px",
  },
  backLink: {
    display: "inline-block",
    marginBottom: 18,
    textDecoration: "none",
    color: "#7dd3fc",
    fontWeight: 700,
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
    padding: 18,
    background: "linear-gradient(180deg, #101d31 0%, #0d1726 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
  },
  heroCrest: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },
  heroCrestPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: "rgba(255,255,255,0.08)",
  },
  heroText: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 900,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#b8c2cc",
    fontSize: 14,
  },
  card: {
    background: "#0d1726",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
  },
  cardTitle: {
    margin: "0 0 14px",
    fontSize: 20,
  },
  cardTitleNoMargin: {
    margin: 0,
    fontSize: 20,
  },
  summaryText: {
    margin: 0,
    lineHeight: 1.8,
    color: "#d8dee6",
    fontSize: 15,
  },
  analysisHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  analysisDate: {
    color: "#9fb0c3",
    fontSize: 13,
    fontWeight: 600,
  },
  analysisTitle: {
    margin: "0 0 10px 0",
    fontSize: 22,
    lineHeight: 1.3,
    letterSpacing: "-0.02em",
  },
  analysisExcerpt: {
    margin: "0 0 16px 0",
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 1.7,
  },
  analysisFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  analysisAuthor: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 600,
  },
  analysisButton: {
    textDecoration: "none",
    background: "#16304f",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 700,
    fontSize: 14,
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  campaignGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  statBox: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
  },
  statLabel: {
    display: "block",
    fontSize: 12,
    color: "#9fb0c3",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    color: "#fff",
  },
  matchHighlight: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
  },
  matchMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
    fontSize: 13,
    color: "#b8c2cc",
  },
  matchLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  versus: {
    fontWeight: 900,
    fontSize: 22,
    color: "#fff",
  },
  teamName: {
    fontWeight: 800,
    fontSize: 17,
    flex: 1,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  matchCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 14,
  },
  scoreLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "6px 0",
  },
  teamLabel: {
    fontSize: 15,
    fontWeight: 600,
  },
  scoreNum: {
    fontWeight: 900,
    fontSize: 18,
  },
  emptyBox: {
    border: "1px dashed rgba(255,255,255,0.14)",
    borderRadius: 14,
    padding: 16,
    textAlign: "center",
    color: "#b8c2cc",
  },
};
