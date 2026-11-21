import type { Metadata } from "next";
import BoosterCompte from "./BoosterCompte";
import s from "./page.module.css";

export const metadata: Metadata = { title: "Booster HOLO · Zenkai Anime Awards 2027" };

// Le booster HOLO : un offert par jour, les autres avec des jetons. Les cartes vont dans la collection du compte.
export default function Booster() {
  return (
    <section className={s.page} aria-labelledby="booster-titre">
      <header className={s.tete}>
        <h1 id="booster-titre" className={`affiche ${s.titre}`}>Booster HOLO 2027</h1>
        <p className={s.chapo}>Un booster offert chaque jour : dix cartes, cinq raretés, d&apos;Éclat à Zenkai. Tes cartes rejoignent ta collection.</p>
      </header>
      <div className={s.cadre}>
        <BoosterCompte />
      </div>
    </section>
  );
}
