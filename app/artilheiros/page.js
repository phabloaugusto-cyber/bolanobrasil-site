"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ArtilheirosPage() {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/scorers?competition=BSA&season=2026", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || data?.message || "Erro ao carregar artilheiros");
        }

        setScorers(data?.scorers || []);
      } catch (e) {
        setErr(e?.message || "Erro ao carregar artilheiros");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.title}>Artilheiros do Brasileirão Série A 2026</h1>
          <p style={styles.lead}>
            Confira a lista atualizada dos principais artilheiros do Brasileirão,
            com ranking de goleadores, quantidade de gols e desempenho dos atacantes
            da Série A do Campeonato Brasileiro.
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
          <div style={{ color: "#ffb4b4", fontWeight: 800 }}>{err}</div>
        </div>
      ) : (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Ranking de artilharia</h2>

          <div style={styles.list}>
            {scorers.length === 0 ? (
              <div style={styles.emptyBox}>Nenhum artilheiro encontrado.</div>
            ) : (
              scorers.map((p, i) => (
                <div key={p.player?.id || i} style={styles.row}>
                  <div style={styles.rank}>{i + 1}</div>

                  <div style={styles.main}>
                    <div style={styles.name}>{p.player?.name || "—"}</div>
                    <div style={styles.team}>
                      {p.team?.shortName || p.team?.name || "Sem time"}
                    </div>
                  </div>

                  <div style={styles.goalsWrap}>
                    <div style={styles.goals}>{p.goals ?? 0}</div>
                    <div style={styles.goalsLabel}>gols</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 700,
    margin: "0 auto",
    padding: 16,
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
    maxWidth: 560,
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

  sectionTitle: {
    margin: "0 0 10px",
    fontSize: 18,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  row: {
    display: "grid",
    gridTemplateColumns: "34px 1fr 56px",
    alignItems: "center",
    gap: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: "12px 12px",
    background: "rgba(0,0,0,0.16)",
  },

  rank: {
    fontWeight: 900,
    opacity: 0.85,
    fontSize: 16,
  },

  main: {
    minWidth: 0,
  },

  name: {
    fontWeight: 900,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  team: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },

  goalsWrap: {
    textAlign: "right",
  },

  goals: {
    fontWeight: 900,
    fontSize: 22,
    lineHeight: 1,
  },

  goalsLabel: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
  },

  emptyBox: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: 14,
    textAlign: "center",
    color: "#b8c2cc",
  },
};
