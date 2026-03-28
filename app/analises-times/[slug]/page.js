"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const styles = {
  container: {
    maxWidth: 920,
    margin: "0 auto",
    padding: "20px 20px 160px 20px",
    color: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },
  topNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  topLink: {
    color: "#93c5fd",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
  },
  topLinkSecondary: {
    color: "#cbd5e1",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  },
  article: {
    background: "#0d1726",
    borderRadius: 20,
    padding: 22,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.22)",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
  },
  date: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 600,
  },
  title: {
    margin: "0 0 10px",
    fontSize: 34,
    lineHeight: 1.12,
  },
  excerpt: {
    margin: "0 0 14px",
    color: "#d7deed",
    fontSize: 18,
    lineHeight: 1.55,
  },
  author: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 22,
  },
  paragraph: {
    margin: "0 0 18px",
    lineHeight: 1.75,
    fontSize: 18,
    color: "#f2f5fb",
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
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function splitParagraphs(content) {
  if (Array.isArray(content)) {
    return content.map((item) => String(item).trim()).filter(Boolean);
  }
  if (!content) return [];
  return String(content)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AnaliseTimeDetalhePage() {
  const params = useParams();
  const slug = params?.slug;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let ativo = true;

    fetch(`/api/posts/${slug}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!ativo) return;
        if (data && !data.error) {
          setPost(data);
        } else {
          setPost(null);
        }
      })
      .catch(() => {
        if (!ativo) return;
        setPost(null);
      })
      .finally(() => {
        if (!ativo) return;
        setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [slug]);

  return (
    <div style={styles.container}>
      <div style={styles.topNav}>
        <Link href="/" style={styles.topLink}>
          ← Início
        </Link>
        <Link href="/analises-times" style={styles.topLinkSecondary}>
          Voltar para análises de times
        </Link>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <p>Carregando análise...</p>
        </div>
      ) : !post ? (
        <div style={styles.loading}>
          <p>Análise não encontrada.</p>
        </div>
      ) : (
        <article style={styles.article}>
          <div style={styles.metaRow}>
            <span style={styles.badge}>
              {post.club || "Análise de clube"}
            </span>
            <span style={styles.date}>
              {formatDate(post.published_at || post.publishedAt)}
            </span>
          </div>
          <h1 style={styles.title}>{post.title || post.titulo}</h1>
          <p style={styles.excerpt}>{post.excerpt || post.resumo}</p>
          <p style={styles.author}>Redação BolaNoBrasil</p>

          {splitParagraphs(post.content || post.conteudo).map(
            (paragraph, index) => (
              <p key={index} style={styles.paragraph}>
                {paragraph}
              </p>
            )
          )}
        </article>
      )}
    </div>
  );
}
