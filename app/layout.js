import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: {
    default: "BolaNoBrasil",
    template: "%s | BolaNoBrasil",
  },
  description:
    "Tabela do Brasileirão, jogos de hoje, partidas por rodada e artilharia do Campeonato Brasileiro.",
  metadataBase: new URL("https://bolanobrasil.com.br"),
  icons: {
    icon: "/favicon-bolanobrasil.png",
  },
  other: {
    "google-adsense-account": "ca-pub-6428482687850030",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={layoutStyles.body}>
        <Script
          id="adsense-script"
          async
          strategy="beforeInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6428482687850030"
          crossOrigin="anonymous"
        />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QH6ZWYN9PN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QH6ZWYN9PN');
          `}
        </Script>

        <main style={layoutStyles.main}>{children}</main>

        <footer style={footerStyles.footer}>
          <div style={footerStyles.container}>
            <div style={footerStyles.brand}>BolaNoBrasil</div>

            <p style={footerStyles.text}>
              Acompanhe a tabela do Brasileirão, jogos de hoje, partidas por
              rodada e a artilharia atualizada do Campeonato Brasileiro.
            </p>

            <nav style={footerStyles.nav}>
              <a href="/tabela" style={footerStyles.link}>
                Tabela
              </a>
              <a href="/jogos" style={footerStyles.link}>
                Jogos
              </a>
              <a href="/artilheiros" style={footerStyles.link}>
                Artilheiros
              </a>
              <a href="/sobre" style={footerStyles.link}>
                Sobre
              </a>
              <a href="/contato" style={footerStyles.link}>
                Contato
              </a>
              <a href="/humor-na-rodada" style={footerStyles.link}>
              Humor na Rodada
              </a>
              <a href="/noticias-do-dia" style={footerStyles.link}>
              Notícias do Dia
              </a>
              <a href="/privacidade" style={footerStyles.link}>
                Privacidade
              </a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}

const layoutStyles = {
  body: {
    margin: 0,
    background:
      "linear-gradient(180deg, #071120 0%, #081426 35%, #04102a 100%)",
    minHeight: "100vh",
    color: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },
  main: {
    minHeight: "calc(100vh - 220px)",
  },
};

const footerStyles = {
  footer: {
    marginTop: 40,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(4,10,20,0.55)",
  },
  container: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "34px 20px 120px",
    textAlign: "center",
  },
  brand: {
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#f8fafc",
  },
  text: {
    margin: "18px auto 0",
    maxWidth: 760,
    color: "#cbd5e1",
    fontSize: 18,
    lineHeight: 1.7,
  },
  nav: {
    marginTop: 26,
    display: "flex",
    justifyContent: "center",
    gap: 28,
    flexWrap: "wrap",
  },
  link: {
    color: "#b8d4ff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 16,
  },
};
