"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AnalisesCopaPage() {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadItem() {
    try {
      const res = await fetch(`/api/copa-do-mundo/analises?t=${Date.now()}`, {
        cache: "no-store",
      });
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

    const interval = setInterval(run, 60000);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, []);

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
          maxWidth: 980,
          margin: "0 auto",
          padding: "18px 16px 48px",
        }}
      >
        <Link
          href="/copa-do-mundo"
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
            marginBottom: 16,
          }}
        >
          Voltar à Copa
        </Link>

        <section
          style={{
            borderRadius: 24,
            padding: 20,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
            marginBottom: 16,
          }}
        >
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
              marginBottom: 12,
            }}
          >
            Análises da Copa
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
            Leituras da Copa do Mundo
          </h1>
        </section>

        {loading ? (
          <div
            style={{
              borderRadius: 18,
              padding: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,247,250,0.72)",
            }}
          >
            Carregando análises...
          </div>
        ) : !item ? (
          <div
            style={{
              borderRadius: 18,
              padding: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,247,250,0.72)",
            }}
          >
            Nenhuma análise da Copa publicada no momento.
          </div>
        ) : (
          <article
            style={{
              borderRadius: 20,
              overflow: "hidden",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {(item.image_url || item.imagem) ? (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  backgroundImage: `url(${item.image_url || item.imagem})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : null}

            <div style={{ padding: 16 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  color: "#f5f7fa",
                }}
              >
                {item.title || item.titulo || ""}
              </h2>

              {(item.excerpt || item.resumo) ? (
                <p
                  style={{
                    marginTop: 12,
                    marginBottom: 0,
                    color: "rgba(245,247,250,0.76)",
                    lineHeight: 1.7,
                    fontSize: 16,
                  }}
                >
                  {item.excerpt || item.resumo}
                </p>
              ) : null}

              {item.slug ? (
                <Link
                  href={`/copa-do-mundo/analises/${item.slug}`}
                  style={{
                    marginTop: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 42,
                    padding: "0 14px",
                    borderRadius: 12,
                    textDecoration: "none",
                    background: "rgba(76,110,245,0.20)",
                    border: "1px solid rgba(76,110,245,0.30)",
                    color: "#f5f7fa",
                    fontWeight: 800,
                  }}
                >
                  Ler análise
                </Link>
              ) : null}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
