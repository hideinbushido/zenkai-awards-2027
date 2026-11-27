import Link from "next/link";
import { ESSAIS } from "./Barre";
import s from "./essais.module.css";

export const metadata = { title: "Essais de galerie · Zenkai" };

const APERCU: Record<string, string> = {
  ruban: "/booster/img/cards/BLEACH-007/full.webp",
  tunnel: "/booster/img/cards/FIREforce-011/full.webp",
  angle: "/booster/img/cards/HELLSParadise-011/full.webp",
  adn: "/booster/img/cards/BLACKCLOVER-009/full.webp",
  vertical: "/essais/verticalix/02.webp",
};
const DESCRIPTION: Record<string, string> = {
  ruban: "Un anneau de cartes vrillé comme un ruban, qu'on fait tourner à la main.",
  tunnel: "Au centre d'un cylindre : la carte d'en face s'anime, son nom en grand.",
  angle: "Une carte animée par écran, des panneaux qui se plient au défilement.",
  adn: "Deux brins de cartes en double hélice, profondeur et flou.",
  vertical: "Slider vertical plein écran, cartes Zenkai en HD, fond aux couleurs de la carte.",
};

export default function Page() {
  return (
    <main className={s.index}>
      <h1>Essais de galerie</h1>
      <p>Cinq façons de montrer « Mes cartes », chacune inspirée d’une de tes références, avec les vraies cartes et leurs animations. Ouvre-les, compare, et dis-moi laquelle garder (ou quel mélange).</p>
      <div className={s.choix}>
        {ESSAIS.map((e, i) => (
          <Link key={e.slug} href={`/cartes/essais/${e.slug}`}>
            <img src={APERCU[e.slug]} alt="" />
            <small>{String(i + 1).padStart(2, "0")} · {e.ref}</small>
            <strong>{e.titre}</strong>
            <span>{DESCRIPTION[e.slug]}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
