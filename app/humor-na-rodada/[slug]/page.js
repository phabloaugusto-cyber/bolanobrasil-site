"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #061226 0%, #0b1b34 100%)",
    color: "#f5f7fb",
    padding: "20px 16px 100px",
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  backLink: {
    color: "#8fc7ff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: "rgba(216,155,87,0.18)",
    color: "#f4d2ad",
    marginBottom: 12,
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
  meta: {
    color: "#aeb9d1",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 22,
  },
  contentWrap: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 22,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
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
      hour: "2-digit",
      minute: "2-digit",
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

export default function HumorSlugPage() {
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
        if (data && !data.error && data.type === "humor") {
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
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.top}>
          <Link href="/humor-na-rodada" style={styles.backLink}>
            ← Voltar para Humor na Rodada
          </Link>

          <Link href="/" style={styles.backLink}>
            Home
          </Link>
        </div>

        {loading ? (
          <p style={styles.loading}>Carregando texto...</p>
        ) : !post ? (
          <p style={styles.loading}>Texto não encontrado.</p>
        ) : (
          <>
            <span style={styles.badge}>Humor na Rodada</span>
            <h1 style={styles.title}>{post.title || post.titulo}</h1>
            <p style={styles.excerpt}>{post.excerpt || post.resumo}</p>
            <div style={styles.meta}>
              Publicado em {formatDate(post.publishedAt || post.published_at)}
            </div>

            <article style={styles.contentWrap}>
              {splitParagraphs(post.content || post.conteudo).map((paragraph, index) => (
                <p key={index} style={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </article>
          </>
        )}
      </div>
    </main>
  );
}
