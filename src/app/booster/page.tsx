import type { Metadata } from "next";
import s from "./page.module.css";

export const metadata: Metadata = { title: "Booster HOLO · Zenkai Anime Awards 2027" };

// Le booster HOLO à ouvrir : expérience autonome (WebGL, physique, son) servie depuis public/booster.
export default function Booster() {
  return (
    <section className={s.page} aria-labelledby="booster-titre">
      <header className={s.tete}>
        <h1 id="booster-titre" className={`affiche ${s.titre}`}>Booster HOLO 2027</h1>
        <p className={s.chapo}>Dix cartes, cinq raretés, d&apos;Éclat à Zenkai. Déchire le haut du paquet et révèle tes cartes une à une.</p>
      </header>
      <div className={s.cadre}>
        <iframe
          className={s.scene}
          src="/booster/index.html?embed=1"
          title="Ouverture d'un booster HOLO"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    </section>
  );
}
