import Link from "next/link";
import { EDITION } from "@/data/edition";
import s from "./Fin.module.css";

// Acte 7 : le rendez-vous, révélé par en dessous quand la page se termine.
export default function Fin() {
  return (
    <footer className={s.fin}>
      <div className={s.haut}>
        <p className={s.rdv}>Rendez-vous en mars</p>
        <div className={s.colonne}>
          <p className={s.texte}>Les boosters s&apos;ouvrent en mars 2027. Le live des résultats suit en {EDITION.live.toLowerCase()}, sur le TikTok de @ricokouame.</p>
          <div className={s.actions}>
            <Link href="/categories" className={s.bouton}>Voir les catégories</Link>
            <a href={EDITION.tiktok} className={s.lien}>TikTok @ricokouame</a>
          </div>
        </div>
      </div>
      <nav className={s.liens} aria-label="Pied de page">
        <Link href="/categories">Catégories</Link>
        <Link href="/palmares">Palmarès</Link>
        <Link href="/equipe">Équipe</Link>
        <Link href="/faq">FAQ et règlement</Link>
        <Link href="/archives">Archives</Link>
      </nav>
      <p className={s.geant} aria-hidden="true">ZENKAI</p>
    </footer>
  );
}
