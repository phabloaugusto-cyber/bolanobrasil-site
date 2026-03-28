import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  return (
    <main style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <nav style={{ marginBottom: 12 }}>
        <Link href="/blog">← Voltar pro Blog</Link>
      </nav>

      <header style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 34, margin: 0 }}>{post.title}</h1>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          {post.date} • {post.category}
          {post.tags?.length ? ` • ${post.tags.join(", ")}` : ""}
        </div>
        {post.description ? (
          <p style={{ marginTop: 10, opacity: 0.9 }}>{post.description}</p>
        ) : null}
      </header>

      <AdSlot slot="top" />

      <article
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 14,
          lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      <AdSlot slot="bottom" />
    </main>
  );
}
