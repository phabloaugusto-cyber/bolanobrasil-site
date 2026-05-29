"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatarData(data) {
  if (!data) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(data));
  } catch {
    return "";
  }
}

export default function HumorCopaInternaPage({ params }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadItem() {
    try {
      const res = await fetch(`/api/copa-do-mundo/humor/${params.slug}?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      setItem(data && !data.error ? data : null);
    } catch (e) {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!mounted) return;
      await loadItem();
    }
    run();
    const onFocus = () => {
      if (document.visibilityState === "visible") run();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [params.slug]);

  if (loading) return <main style={{ minHeight: "100vh", background: "#071024", color: "#f5f7fa", padding: 16 }}>Carregando texto...</main>;

  if (!item) {
    return (
      <main style={{ minHeight: "100vh", background: "#071024", color: "#f5f7fa", padding: 16 }}>
        <Link href="/copa-do-mundo/humor" style={{ color: "#f5f7fa" }}>Voltar ao humor da Copa</Link>
        <p>Texto não encontrado.</p>
      </main>
    );
  }

  const titulo = item.title || item.titulo || "";
  const conteudo = item.content || item.conteudo || "";
  const imagem = item.image_url || item.imagem || null;
  const data = item.published_at || item.created_at || null;

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top, rgba(19,44,99,0.28) 0%, #071024 34%, #03060d 100%)", color: "#f5f7fa" }}>
      <section style={{ width: "100%", maxWidth: 860, margin: "0 auto", padding: "18px 16px 48px" }}>
        <Link href="/copa-do-mundo/humor" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 42, padding: "0 14px", borderRadius: 14, textDecoration: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#f5f7fa", fontWeight: 800, marginBottom: 16 }}>
          Voltar ao humor da Copa
        </Link>

        <article style={{ borderRadius: 22, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {imagem ? <div style={{ width: "100%", aspectRatio: "16 / 9", backgroundImage: `url(${imagem})`, backgroundSize: "cover", backgroundPosition: "center" }} /> : null}
          <div style={{ padding: 18 }}>
            <div style={{ display: "inline-flex", alignItems: "center", minHeight: 30, padding: "6px 12px", borderRadius: 999, background: "rgba(76,110,245,0.14)", color: "#dbe4ff", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              Humor da Copa
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.02, fontWeight: 900, letterSpacing: "-0.04em" }}>
              {titulo}
            </h1>
            {data ? <div style={{ marginTop: 10, color: "rgba(245,247,250,0.66)", fontSize: 14, fontWeight: 700 }}>{formatarData(data)}</div> : null}
            <div style={{ marginTop: 18, color: "rgba(245,247,250,0.86)", lineHeight: 1.8, fontSize: 18, whiteSpace: "pre-wrap" }}>
              {conteudo}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
