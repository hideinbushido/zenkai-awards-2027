import Image from "next/image";
import Link from "next/link";
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
      <Link href="/voter" className={`bouton ${s.voter}`}>Voter</Link>
    </header>
  );
}
