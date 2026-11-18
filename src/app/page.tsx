import Anneau from "@/components/Anneau";
import Edition1 from "@/components/Edition1";
import Fin from "@/components/Fin";
import GalerieBoosters from "@/components/GalerieBoosters";
import Hero from "@/components/Hero";
import Manifeste from "@/components/Manifeste";
import Revelation from "@/components/Revelation";
import TitreAnime from "@/components/TitreAnime";
import Voix from "@/components/Voix";
import s from "./page.module.css";

export default function Accueil() {
  return (
    <>
      <main className={s.page}>
        <Hero />
        <Manifeste />
        <GalerieBoosters />
        <Anneau />
        <Revelation label="Édition 1">
          <div className={s.tete}>
            <TitreAnime className={s.h2}>Édition 1</TitreAnime>
            <p className={s.chapo}>2026, les premiers gagnants. Passe sur une vitre pour la voir s&apos;éclaircir.</p>
          </div>
          <Edition1 />
          <a className={s.lien} href="https://animeawards-alpha.vercel.app/fr/resultats">Tout le palmarès 2026</a>
        </Revelation>
        <Voix />
      </main>
      <Fin />
    </>
  );
}
