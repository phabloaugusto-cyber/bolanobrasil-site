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
    return {
      encerrado: true,
      dias: 0,
      horas: 0,
      minutos: 0,
    };
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);

  return {
    encerrado: false,
    dias,
    horas,
    minutos,
  };
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
          marginTop: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#f5f7fa",
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        A Copa já começou
      </div>
    );
  }

  const Item = ({ valor, label }) => (
    <div
      style={{
        minWidth: 72,
        borderRadius: 16,
        padding: "10px 10px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 20,
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
          fontSize: 10,
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
          marginBottom: 10,
          fontSize: 12,
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
          gap: 8,
          flexWrap: "wrap",
          alignItems: "stretch",
        }}
      >
        <Item valor={tempo.dias} label="Dias" />
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
        borderRadius: 22,
        padding: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 14,
          fontSize: 24,
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

function GrupoTabela({ grupo }) {
  const linhas = grupo?.table || [];

  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: 18,
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
                      fontSize: 15,
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
        borderRadius: 18,
        padding: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
          fontSize: 12,
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
          fontSize: 18,
          fontWeight: 800,
          lineHeight: 1.35,
          color: "#f5f7fa",
        }}
      >
        {nomeTime(jogo.homeTeam, "Mandante")} x {nomeTime(jogo.awayTeam, "Visitante")}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 14,
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
  fontSize: 13,
  fontWeight: 700,
  color: "rgba(245,247,250,0.72)",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const thPos = {
  ...thBase,
  width: 34,
};

const thTeam = {
  ...thBase,
  textAlign: "left",
  minWidth: 170,
};

const thNum = {
  ...thBase,
  width: 46,
};

const tdPos = {
  padding: "14px 6px",
  textAlign: "center",
  fontSize: 16,
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
  fontSize: 15,
  fontWeight: 700,
  color: "rgba(245,247,250,0.82)",
};

const tdPts = {
  ...tdNum,
  color: "#f5f5f5",
  fontWeight: 900,
  fontSize: 18,
};

export default function CopaDoMundoPage() {
  const [tabela, setTabela] = useState(null);
  const [jogos, setJogos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grupoAtivo, setGrupoAtivo] = useState("");
  const [rodadaAtiva, setRodadaAtiva] = useState(1);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [resTabela, resJogos] = await Promise.all([
          fetch(`/api/copa-do-mundo/tabela?t=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/copa-do-mundo/jogos?t=${Date.now()}`, { cache: "no-store" }),
        ]);

        const [dataTabela, dataJogos] = await Promise.all([
          resTabela.json(),
          resJogos.json(),
        ]);

        if (!ativo) return;

        setTabela(dataTabela);
        setJogos(dataJogos);

        const primeiroGrupo = dataTabela?.standings?.[0]?.group || "";
        setGrupoAtivo(normalizarGrupo(primeiroGrupo));
      } catch (e) {
        if (!ativo) return;
        setTabela(null);
        setJogos(null);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
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
          padding: "18px 16px 48px",
        }}
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 42,
              padding: "0 14px",
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
            borderRadius: 28,
            padding: "24px 18px",
            marginBottom: 18,
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
              borderRadius: 28,
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
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Especial Copa
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.8rem, 5vw, 3rem)",
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
                margin: "12px 0 0 0",
                color: "rgba(245,247,250,0.76)",
                lineHeight: 1.6,
                fontSize: 16,
              }}
            >
              A cobertura especial do BolaNoBrasil para acompanhar o torneio.
            </p>
          </div>
        </section>

        {loading ? (
          <SectionCard title="Carregando Copa">
            <p style={{ margin: 0, color: "rgba(245,247,250,0.76)" }}>
              Buscando grupos e partidas...
            </p>
          </SectionCard>
        ) : (
          <>
            <SectionCard title="Grupos">
              <div
                style={{
                  display: "flex",
                  gap: 10,
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
                        padding: "11px 16px",
                        borderRadius: 999,
                        border: ativo
                          ? "1px solid rgba(255,255,255,0.18)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: ativo
                          ? "rgba(76,110,245,0.22)"
                          : "rgba(255,255,255,0.04)",
                        color: "#f5f7fa",
                        fontWeight: 800,
                        fontSize: 15,
                      }}
                    >
                      {labelGrupo(grupo.group)}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <div style={{ height: 16 }} />

            {grupoAtual && (
              <>
                <SectionCard title={labelGrupo(grupoAtual.group)}>
                  <GrupoTabela grupo={grupoAtual} />
                </SectionCard>

                <div style={{ height: 16 }} />

                <SectionCard title={`Jogos do ${labelGrupo(grupoAtual.group)}`}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      overflowX: "auto",
                      marginBottom: 14,
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
                            padding: "10px 14px",
                            borderRadius: 999,
                            border: ativo
                              ? "1px solid rgba(255,255,255,0.18)"
                              : "1px solid rgba(255,255,255,0.08)",
                            background: ativo
                              ? "rgba(76,110,245,0.22)"
                              : "rgba(255,255,255,0.04)",
                            color: "#f5f7fa",
                            fontWeight: 800,
                            fontSize: 14,
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
