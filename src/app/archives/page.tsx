import type { Metadata } from "next";
import Link from "next/link";
import Booster2D from "@/components/Booster2D";
import EnTetePage from "@/components/EnTetePage";
import { EDITION } from "@/data/edition";
import s from "./page.module.css";

export const metadata: Metadata = { title: "Archives · Zenkai Anime Awards" };

export default function Archives() {
  return (
    <>
      <EnTetePage titre="Archives" chapo="Chaque édition est un set. Le premier est terminé, le deuxième est en cours." />
      <section className={s.section} aria-label="Éditions">
        <ul className={s.sets}>
          <li className={`${s.set} ${s.or}`}>
            <p className={s.annee}>2026</p>
            <p className={`affiche ${s.nom}`}>Set Gold</p>
            <p className={s.texte}>La première édition, thème or prestige. Animé de l&apos;année : My Hero Academia, saison finale.</p>
            <div className={s.actions}>
              <a className="bouton" href={EDITION.resultats2026} target="_blank" rel="noopener">Les résultats sur le site 2026</a>
              <Link className="bouton-clair" href="/palmares">Palmarès</Link>
            </div>
          </li>
          <li className={`${s.set} ${s.holo}`}>
            <p className={s.annee}>2027</p>
            <p className={`affiche ${s.nom}`}>Set Holo</p>
            <p className={s.texte}>La deuxième édition, en cours. Animés diffusés en 2026, votes au printemps, live en mai.</p>
            <span className={s.paquet}><Booster2D famille="grand-prix" titre="Set Holo" sousTitre="2027" /></span>
            <div className={s.actions}>
              <Link className="bouton" href="/voter">Édition 2027</Link><Link className="bouton-clair" href="/categories">Les catégories</Link>
            </div>
          </li>
        </ul>
      </section>
    </>
  );
}
