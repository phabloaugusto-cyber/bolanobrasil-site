import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnaliseTimeBySlug } from "../../../lib/analises-times";

export default function AnaliseTimeDetalhePage({ params }) {
  const analise = getAnaliseTimeBySlug(params.slug);

  if (!analise) {
    notFound();
  }

  return (
    <main style={styles.container}>
      <div style={styles.topNav}>
        <Link href="/" style={styles.topLink}>
          ← Início
        </Link>

        <Link href={`/time/${params.slug}`} style={styles.topLinkSecondary}>
          Voltar para o time
        </Link>
      </div>

      <article style={styles.article}>
        <div style={styles.metaRow}>
          <span style={styles.badge}>Análise de clube</span>
          <span style={styles.date}>{analise.date}</span>
        </div>

        <h1 style={styles.title}>{analise.title}</h1>
        <p style={styles.excerpt}>{analise.excerpt}</p>

        <div style={styles.authorRow}>
          <span style={styles.author}>{analise.author}</span>
        </div>

        <div style={styles.content}>
          {analise.content.map((paragraph, index) => (
            <p key={index} style={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}

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
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: "0.04em",
  },
  date: {
    color: "#94a3b8",
    fontSize: 13,
  },
  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
  },
  excerpt: {
    margin: "14px 0 0 0",
    color: "#cbd5e1",
    fontSize: 18,
    lineHeight: 1.6,
  },
  authorRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  author: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 600,
  },
  content: {
    marginTop: 24,
  },
  paragraph: {
    margin: "0 0 18px 0",
    color: "#f1f5f9",
    fontSize: 18,
    lineHeight: 1.85,
  },
};
