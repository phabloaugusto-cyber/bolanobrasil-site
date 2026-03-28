import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <h3>BolaNoBrasil</h3>
          <p>
            Tabela do Brasileirão, jogos de hoje, partidas ao vivo e ranking de
            artilheiros do futebol brasileiro.
          </p>
        </div>

        <nav className={styles.nav}>
          <Link href="/sobre">Sobre</Link>
          <Link href="/contato">Contato</Link>
          <Link href="/privacidade">Privacidade</Link>
        </nav>
      </div>

      <div className={styles.bottom}>
        <p>© {year} BolaNoBrasil. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
