import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import EnTetePage from "@/components/EnTetePage";
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
              <a className="bouton" href="https://animeawards-alpha.vercel.app/fr">Voir le site 2026</a>
              <Link className="bouton-clair" href="/palmares">Palmarès</Link>
            </div>
          </li>
          <li className={`${s.set} ${s.holo}`}>
            <p className={s.annee}>2027</p>
            <p className={`affiche ${s.nom}`}>Set Holo</p>
            <p className={s.texte}>La deuxième édition, en cours. Animés diffusés en 2026, votes au printemps, live en mai.</p>
            <Image src="/visuels/booster-grand-prix.webp" alt="" width={210} height={360} className={s.paquet} />
            <div className={s.actions}>
              <Link className="bouton" href="/categories">Les catégories</Link>
            </div>
          </li>
        </ul>
      </section>
    </>
  );
}
