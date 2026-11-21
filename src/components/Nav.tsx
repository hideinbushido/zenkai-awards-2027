import Image from "next/image";
import Link from "next/link";
import CompteurCollection from "./CompteurCollection";
import NavAuto from "./NavAuto";
import s from "./Nav.module.css";

export default function Nav() {
  return (
    <header className={s.nav} data-nav>
      <NavAuto />
      <Link href="/" className={s.marque} aria-label="Zenkai Anime Awards, accueil">
        <Image src="/visuels/logo-zenkai-noir.png" alt="" width={30} height={30} className={s.embleme} />
        <span>Zenkai</span>
      </Link>
      <nav aria-label="Navigation principale" className={s.pilule}>
        <Link href="/categories">Catégories</Link>
        <Link href="/booster">Booster</Link>
        <Link href="/palmares">Palmarès</Link>
        <Link href="/equipe">Équipe</Link>
        <Link href="/a-propos">À propos</Link>
        <Link href="/faq">FAQ</Link>
      </nav>
      <div className={s.droite}>
        <Link href="/collection" className={`bouton-clair ${s.collection}`}>
          <span className={s.libelle}>Ma collection</span> <CompteurCollection className={s.compte} />
        </Link>
        {/* Menu téléphone */}
        <details className={s.menu}>
          <summary className={`bouton ${s.ouvrir}`}>Menu</summary>
          <nav aria-label="Navigation mobile" className={`panneau-encre ${s.liste}`}>
            <Link href="/categories">Catégories</Link>
            <Link href="/booster">Booster</Link>
            <Link href="/collection">Ma collection</Link>
            <Link href="/palmares">Palmarès 2026</Link>
            <Link href="/equipe">Équipe</Link>
            <Link href="/a-propos">À propos</Link>
            <Link href="/faq">FAQ</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
