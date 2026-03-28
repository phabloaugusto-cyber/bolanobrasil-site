import Link from "next/link";

export default function Assistencias() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px 14px" }}>
      <h1>Assistências</h1>
      <p style={{ opacity: 0.8 }}>
        Página completa de assistências (top 20 + filtros).
      </p>
      <Link href="/" style={{ textDecoration: "none", fontWeight: 900 }}>← Voltar Home</Link>
    </div>
  );
}
