"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DATA_ESTREIA_COPA = "2026-06-11T00:00:00-03:00";

function formatarHoraBrasil(data) {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

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
    case "FINISHED":
      return "Encerrado";
    case "POSTPONED":
      return "Adiado";
    case "SUSPENDED":
      return "Suspenso";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status || "—";
  }
}

function normalizarGrupo(valor) {
  if (!valor) return "";
  return String(valor).trim().toUpperCase().replace(/\s+/g, "_");
}

function labelGrupo(valor) {
  const g = normalizarGrupo(valor);
  if (g.startsWith("GROUP_")) {
    return "Grupo " + g.replace("GROUP_", "");
  }
  return valor || "Grupo";
}

function nomeTime(team, fallback) {
  return team?.name || team?.shortName || fallback;
}

function getCountdownParts(targetDate) {
  const agora = new Date().getTime();
  const alvo = new Date(targetDate).getTime();
  const diff = alvo - agora;

  if (diff <= 0) {
    return { encerrado: true, dias: 0, horas: 0, minutos: 0 };
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);

  return { encerrado: false, dias, horas, minutos };
}

function CountdownHero() {
  const [tempo, setTempo] = useState(() => getCountdownParts(DATA_ESTREIA_COPA));

  useEffect(() => {
    const atualizar = () => setTempo(getCountdownParts(DATA_ESTREIA_COPA));
    atualizar();
    const intervalo = setInterval(atualizar, 60000);
    return () => clearInterval(intervalo);
  }, []);

  if (tempo.encerrado) {
    return (
      <div
        style={{
          marginTop: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 11px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#f5f7fa",
          fontWeight: 800,
          fontSize: 11,
        }}
      >
        A Copa já começou
      </div>
    );
  }

  const Item = ({ valor, label, destaque = false }) => (
    <div
      style={{
        minWidth: destaque ? 88 : 68,
        borderRadius: 14,
        padding: destaque ? "12px 12px" : "10px 10px",
        background: destaque ? "rgba(76,110,245,0.16)" : "rgba(255,255,255,0.06)",
        border: destaque
          ? "1px solid rgba(76,110,245,0.34)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: destaque
          ? "0 0 0 1px rgba(76,110,245,0.10) inset"
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: destaque ? 24 : 18,
          lineHeight: 1,
          fontWeight: 900,
          color: "#f5f7fa",
          letterSpacing: "-0.03em",
        }}
      >
        {valor}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: destaque ? 10 : 9,
          lineHeight: 1.1,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(245,247,250,0.68)",
        }}
      >
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          marginBottom: 6,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(245,247,250,0.68)",
        }}
      >
        Contagem regressiva para a estreia
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "nowrap",
          alignItems: "stretch",
        }}
      >
        <Item valor={tempo.dias} label="Dias" destaque />
        <Item valor={tempo.horas} label="Horas" />
        <Item valor={tempo.minutos} label="Min" />
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section
      style={{
        borderRadius: 20,
        padding: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 14,
          fontSize: 22,
          lineHeight: 1.05,
          fontWeight: 900,
          color: "#f5f7fa",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function EditorialCard({ item, label, hrefBase, actionText }) {
  if (!item) {
    return (
      <div
        style={{
          borderRadius: 18,
          padding: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(245,247,250,0.72)",
        }}
      >
        Nenhum conteúdo publicado no momento.
      </div>
    );
  }

  const titulo = item.title || item.titulo || "";
  const resumo = item.excerpt || item.resumo || "";
  const slug = item.slug || "";
  const imagem = item.image_url || item.imagem || null;
  const data = item.published_at || item.publishedAt || item.created_at || null;

  const dataFmt = data
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(data))
    : "";

  return (
    <article
      style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {imagem ? (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundImage: `url(${imagem})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : null}

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 28,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(76,110,245,0.14)",
              color: "#dbe4ff",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>

          <span
            style={{
              fontSize: 12,
              color: "rgba(245,247,250,0.62)",
              fontWeight: 700,
            }}
          >
            {dataFmt}
          </span>
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: 1.08,
            fontWeight: 900,
            color: "#f5f7fa",
          }}
        >
          {titulo}
        </h3>

        {resumo ? (
          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              color: "rgba(245,247,250,0.76)",
              lineHeight: 1.6,
              fontSize: 16,
            }}
          >
            {resumo}
          </p>
        ) : null}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: "rgba(245,247,250,0.62)",
              fontWeight: 700,
            }}
          >
            Redação BolaNoBrasil
          </span>

          {slug ? (
            <Link
              href={`${hrefBase}/${slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 42,
                padding: "0 14px",
                borderRadius: 14,
                textDecoration: "none",
                background: "rgba(76,110,245,0.20)",
                border: "1px solid rgba(76,110,245,0.30)",
                color: "#f5f7fa",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {actionText}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function GrupoTabela({ grupo }) {
  const linhas = grupo?.table || [];

  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 420,
          borderCollapse: "collapse",
          color: "#f5f7fa",
        }}
      >
        <thead>
          <tr
            style={{
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <th style={thPos}>#</th>
            <th style={thTeam}>Equipe</th>
            <th style={thNum}>Pts</th>
            <th style={thNum}>PJ</th>
            <th style={thNum}>VIT</th>
            <th style={thNum}>E</th>
            <th style={thNum}>DER</th>
            <th style={thNum}>GM</th>
            <th style={thNum}>GS</th>
            <th style={thNum}>SG</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((row, index) => (
            <tr
              key={`${grupo.group}-${row.team?.id}-${row.position}`}
              style={{
                borderBottom:
                  index === linhas.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.08)",
                background:
                  row.position <= 2
                    ? "linear-gradient(90deg, rgba(76,110,245,0.16) 0%, rgba(76,110,245,0.06) 18%, transparent 48%)"
                    : "transparent",
              }}
            >
              <td style={tdPos}>{row.position}</td>
              <td style={tdTeam}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 28,
                      borderRadius: 999,
                      background: row.position <= 2 ? "#4c6ef5" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  >
                    {row.team?.name || row.team?.shortName || "Time"}
                  </div>
                </div>
              </td>
              <td style={tdPts}>{row.points}</td>
              <td style={tdNum}>{row.playedGames}</td>
              <td style={tdNum}>{row.won}</td>
              <td style={tdNum}>{row.draw}</td>
              <td style={tdNum}>{row.lost}</td>
              <td style={tdNum}>{row.goalsFor}</td>
              <td style={tdNum}>{row.goalsAgainst}</td>
              <td
                style={{
                  ...tdNum,
                  color:
                    row.goalDifference > 0
                      ? "#7ee787"
                      : row.goalDifference < 0
                      ? "#ff8a8a"
                      : "rgba(245,247,250,0.82)",
                }}
              >
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JogoCard({ jogo }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 6,
          marginBottom: 6,
          fontSize: 11,
          fontWeight: 800,
          color: "rgba(245,247,250,0.66)",
          textTransform: "uppercase",
        }}
      >
        <span>{jogo.stage || "Copa do Mundo"}</span>
        <span>{traduzirStatus(jogo.status)}</span>
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          lineHeight: 1.35,
          color: "#f5f7fa",
        }}
      >
        {nomeTime(jogo.homeTeam, "Mandante")} x {nomeTime(jogo.awayTeam, "Visitante")}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: "rgba(245,247,250,0.74)",
        }}
      >
        {formatarHoraBrasil(jogo.utcDate)}
      </div>
    </div>
  );
}

const thBase = {
  padding: "12px 6px",
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(245,247,250,0.72)",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const thPos = { ...thBase, width: 34 };
const thTeam = { ...thBase, textAlign: "left", minWidth: 170 };
const thNum = { ...thBase, width: 46 };

const tdPos = {
  padding: "14px 6px",
  textAlign: "center",
  fontSize: 11,
  fontWeight: 800,
  color: "#f5f7fa",
};

const tdTeam = {
  padding: "14px 6px",
  textAlign: "left",
};

const tdNum = {
  padding: "14px 6px",
  textAlign: "center",
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(245,247,250,0.82)",
};

const tdPts = {
  ...tdNum,
  color: "#f5f5f5",
  fontWeight: 900,
  fontSize: 11,
};

export default function CopaDoMundoPage() {
  const [tabela, setTabela] = useState(null);
  const [jogos, setJogos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grupoAtivo, setGrupoAtivo] = useState("");
  const [rodadaAtiva, setRodadaAtiva] = useState(1);

  const [noticiasCopa, setNoticiasCopa] = useState([]);
  const [analiseCopa, setAnaliseCopa] = useState(null);
  const [humorCopa, setHumorCopa] = useState(null);

  async function loadCopaData() {
    const bust = Date.now();

    try {
      const [
        resTabela,
        resJogos,
        resNoticias,
        resAnalises,
        resHumor,
      ] = await Promise.all([
        fetch(`/api/copa-do-mundo/tabela?t=${bust}`, { cache: "no-store" }),
        fetch(`/api/copa-do-mundo/jogos?t=${bust}`, { cache: "no-store" }),
        fetch(`/api/copa-do-mundo/noticias?t=${bust}`, { cache: "no-store" }),
        fetch(`/api/copa-do-mundo/analises?t=${bust}`, { cache: "no-store" }),
        fetch(`/api/copa-do-mundo/humor?t=${bust}`, { cache: "no-store" }),
      ]);

      const [
        dataTabela,
        dataJogos,
        dataNoticias,
        dataAnalises,
        dataHumor,
      ] = await Promise.all([
        resTabela.json().catch(() => null),
        resJogos.json().catch(() => null),
        resNoticias.json().catch(() => []),
        resAnalises.json().catch(() => null),
        resHumor.json().catch(() => null),
      ]);

      setTabela(dataTabela);
      setJogos(dataJogos);
      setNoticiasCopa(Array.isArray(dataNoticias) ? dataNoticias : []);
      setAnaliseCopa(dataAnalises && !dataAnalises.error ? dataAnalises : null);
      setHumorCopa(dataHumor && !dataHumor.error ? dataHumor : null);

      const primeiroGrupo = dataTabela?.standings?.[0]?.group || "";
      const grupoAtualNormalizado = normalizarGrupo(primeiroGrupo);
      setGrupoAtivo((prev) => prev || grupoAtualNormalizado);
    } catch (e) {
      console.log("erro copa refresh");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadIfMounted() {
      if (!mounted) return;
      await loadCopaData();
    }

    loadIfMounted();

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        loadIfMounted();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadIfMounted();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = setInterval(() => {
      loadIfMounted();
    }, 60000);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, []);

  const grupos = tabela?.standings || [];
  const grupoAtual = useMemo(() => {
    return grupos.find((g) => normalizarGrupo(g.group) === grupoAtivo) || grupos[0] || null;
  }, [grupos, grupoAtivo]);

  const jogosTodos = jogos?.matches || [];

  const jogosDoGrupo = useMemo(() => {
    const alvo = normalizarGrupo(grupoAtual?.group);
    return jogosTodos
      .filter((j) => normalizarGrupo(j.group) === alvo)
      .sort((a, b) => {
        const aa = a.matchday ?? 999;
        const bb = b.matchday ?? 999;
        if (aa !== bb) return aa - bb;
        return new Date(a.utcDate) - new Date(b.utcDate);
      });
  }, [jogosTodos, grupoAtual]);

  const rodadasGrupo = useMemo(() => {
    const valores = [...new Set(jogosDoGrupo.map((j) => j.matchday).filter(Boolean))];
    return valores.sort((a, b) => a - b);
  }, [jogosDoGrupo]);

  useEffect(() => {
    if (!rodadasGrupo.length) return;
    if (!rodadasGrupo.includes(rodadaAtiva)) {
      setRodadaAtiva(rodadasGrupo[0]);
    }
  }, [rodadasGrupo, rodadaAtiva]);

  const jogosDaRodada = useMemo(() => {
    if (!rodadasGrupo.length) return jogosDoGrupo;
    return jogosDoGrupo.filter((j) => j.matchday === rodadaAtiva);
  }, [jogosDoGrupo, rodadaAtiva, rodadasGrupo]);

  const noticiaPrincipal = noticiasCopa[0] || null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(19,44,99,0.28) 0%, #071024 34%, #03060d 100%)",
        color: "#f5f7fa",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 12px 34px",
        }}
      >
        <div
          style={{
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 34,
              padding: "0 12px",
              borderRadius: 14,
              textDecoration: "none",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#f5f7fa",
              fontWeight: 800,
            }}
          >
            Voltar ao Brasileirão
          </Link>
        </div>

        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 14,
            padding: "18px 16px",
            marginBottom: 10,
            background:
              "linear-gradient(135deg, rgba(18,44,99,0.98) 0%, rgba(5,8,15,0.98) 78%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 22px 56px rgba(0,0,0,0.34)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              padding: 1.5,
              background:
                "linear-gradient(90deg, rgba(244,196,0,0.95) 0%, rgba(214,168,0,0.95) 42%, rgba(23,138,69,0.95) 100%)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              pointerEvents: "none",
              opacity: 0.92,
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 30,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                color: "#f5f7fa",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Especial Copa
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.7rem, 4.8vw, 2.4rem)",
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              Copa do Mundo 2026
            </h1>

            <CountdownHero />

            <p
              style={{
                margin: "10px 0 0 0",
                color: "rgba(245,247,250,0.76)",
                lineHeight: 1.45,
                fontSize: 11,
              }}
            >
              A cobertura especial do BolaNoBrasil para acompanhar o torneio.
            </p>
          </div>
        </section>

        {loading ? (
          <SectionCard title="Carregando Copa">
            <p style={{ margin: 0, color: "rgba(245,247,250,0.76)" }}>
              Buscando grupos, partidas e editoriais...
            </p>
          </SectionCard>
        ) : (
          <>
            <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
              <SectionCard title="Notícia da Copa">
                <EditorialCard
                  item={noticiaPrincipal}
                  label="Notícia"
                  hrefBase="/copa-do-mundo/noticias"
                  actionText="Ler notícia"
                />
              </SectionCard>

              <SectionCard title="Análise em destaque">
                <EditorialCard
                  item={analiseCopa}
                  label="Análise"
                  hrefBase="/copa-do-mundo/analises"
                  actionText="Ler análise"
                />
              </SectionCard>

              <SectionCard title="Humor da Copa">
                <EditorialCard
                  item={humorCopa}
                  label="Humor"
                  hrefBase="/copa-do-mundo/humor"
                  actionText="Ler texto"
                />
              </SectionCard>
            </div>

            <SectionCard title="Grupos">
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  paddingBottom: 2,
                }}
              >
                {grupos.map((grupo, idx) => {
                  const valor = normalizarGrupo(grupo.group);
                  const ativo = valor === normalizarGrupo(grupoAtual?.group);
                  return (
                    <button
                      key={`${grupo.group || idx}`}
                      onClick={() => setGrupoAtivo(valor)}
                      style={{
                        flex: "0 0 auto",
                        padding: "7px 11px",
                        borderRadius: 999,
                        border: ativo
                          ? "1px solid rgba(255,255,255,0.18)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: ativo
                          ? "rgba(76,110,245,0.22)"
                          : "rgba(255,255,255,0.04)",
                        color: "#f5f7fa",
                        fontWeight: 800,
                        fontSize: 11,
                      }}
                    >
                      {labelGrupo(grupo.group)}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <div style={{ height: 10 }} />

            {grupoAtual && (
              <>
                <SectionCard title={labelGrupo(grupoAtual.group)}>
                  <GrupoTabela grupo={grupoAtual} />
                </SectionCard>

                <div style={{ height: 10 }} />

                <SectionCard title={`Jogos do ${labelGrupo(grupoAtual.group)}`}>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      overflowX: "auto",
                      marginBottom: 10,
                      paddingBottom: 2,
                    }}
                  >
                    {rodadasGrupo.map((rodada) => {
                      const ativo = rodada === rodadaAtiva;
                      return (
                        <button
                          key={rodada}
                          onClick={() => setRodadaAtiva(rodada)}
                          style={{
                            flex: "0 0 auto",
                            padding: "7px 11px",
                            borderRadius: 999,
                            border: ativo
                              ? "1px solid rgba(255,255,255,0.18)"
                              : "1px solid rgba(255,255,255,0.08)",
                            background: ativo
                              ? "rgba(76,110,245,0.22)"
                              : "rgba(255,255,255,0.04)",
                            color: "#f5f7fa",
                            fontWeight: 800,
                            fontSize: 11,
                          }}
                        >
                          Rodada {rodada}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    {jogosDaRodada.length === 0 ? (
                      <p style={{ margin: 0, color: "rgba(245,247,250,0.76)" }}>
                        Nenhum jogo encontrado para este grupo.
                      </p>
                    ) : (
                      jogosDaRodada.map((jogo) => (
                        <JogoCard key={jogo.id} jogo={jogo} />
                      ))
                    )}
                  </div>
                </SectionCard>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
