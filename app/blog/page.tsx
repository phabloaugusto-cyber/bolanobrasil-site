import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog | BolaNoBrasil",
  description: "Notícias curtas e análises semanais do futebol.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 34, margin: 0 }}>Blog</h1>
        <p style={{ marginTop: 8, opacity: 0.85 }}>
          Misturado: notícias curtas + análises semanais.
        </p>
      </header>

      <AdSlot slot="top" />

      {posts.length === 0 ? (
        <p>Nenhum post ainda. (Crie um arquivo .md em content/blog)</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {posts.map((p, idx) => (
            <article
              key={p.slug}
              style={{
                border: "1px solid #333",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                {p.date} • {p.category}
                {p.tags?.length ? ` • ${p.tags.join(", ")}` : ""}
              </div>

              <h2 style={{ margin: "6px 0 6px", fontSize: 20 }}>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>

              {p.description ? (
                <p style={{ margin: 0, opacity: 0.9 }}>{p.description}</p>
              ) : null}

              {idx === 2 ? <AdSlot slot="middle" /> : null}
            </article>
          ))}
        </div>
      )}

      <AdSlot slot="bottom" />
    </main>
  );
}
