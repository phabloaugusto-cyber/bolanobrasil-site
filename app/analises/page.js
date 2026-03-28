"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #061226 0%, #0b1b34 100%)",
    color: "#f5f7fb",
    padding: "20px 16px 100px",
  },
  container: {
    maxWidth: 980,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    margin: 0,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#b8c2d8",
    fontSize: 15,
  },
  backLink: {
    color: "#8fc7ff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
  },
  list: {
    display: "grid",
    gap: 14,
  },
  card: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 18,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: "rgba(143,199,255,0.14)",
    color: "#d7ecff",
    marginBottom: 10,
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: 24,
    lineHeight: 1.15,
  },
  excerpt: {
    margin: "0 0 12px",
    color: "#d7deed",
    fontSize: 16,
    lineHeight: 1.55,
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  date: {
    color: "#aeb9d1",
    fontSize: 13,
    fontWeight: 700,
  },
  button: {
    display: "inline-block",
    textDecoration: "none",
    background: "linear-gradient(135deg, #4ea3ff, #2f6fcc)",
    color: "#fff",
    fontWeight: 800,
    padding: "10px 16px",
    borderRadius: 12,
    fontSize: 14,
  },
  loading: {
    color: "#d7deed",
    textAlign: "center",
    padding: "40px 0",
  },
};

function formatDate(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function AnalisesPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    fetch("/api/posts?type=analise", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!ativo) return;
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ativo) return;
        setPosts([]);
      })
      .finally(() => {
        if (!ativo) return;
        setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Análises</h1>
            <p style={styles.subtitle}>
              As análises publicadas no BolaNoBrasil.
            </p>
          </div>

          <Link href="/" style={styles.backLink}>
            ← Voltar para a home
          </Link>
        </div>

        {loading ? (
          <p style={styles.loading}>Carregando análises...</p>
        ) : (
          <div style={styles.list}>
            {posts.map((item) => (
              <article key={item.id || item.slug} style={styles.card}>
                <span style={styles.badge}>Análise</span>
                <h2 style={styles.cardTitle}>{item.title || item.titulo}</h2>
                <p style={styles.excerpt}>{item.excerpt || item.resumo}</p>

                <div style={styles.meta}>
                  <span style={styles.date}>
                    {formatDate(item.publishedAt || item.published_at)}
                  </span>

                  <Link
                    href={`/analises/${item.slug}`}
                    style={styles.button}
                  >
                    Ler análise
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
