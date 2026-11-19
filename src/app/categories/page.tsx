import type { Metadata } from "next";
import Link from "next/link";
import EnTetePage from "@/components/EnTetePage";
import TitreAnime from "@/components/TitreAnime";
import Booster2D from "@/components/Booster2D";
import { FAMILLES } from "@/data/boosters";
import { CATEGORIES } from "@/data/edition";
import s from "./page.module.css";

export const metadata: Metadata = { title: "Catégories · Zenkai Anime Awards 2027" };

export default function Categories() {
  return (
    <>
      <EnTetePage
        titre="25 boosters"
        chapo="Chaque catégorie est un booster, ses nominés sont les cartes. Ouvre ceux que tu connais, passe les autres. L'animé de l'année se garde pour la fin."
      />

      {FAMILLES.map((f) => {
        const cats = CATEGORIES.filter((c) => c.famille === f.id);
        return (
          <section key={f.id} id={f.id} className={s.famille} data-famille={f.id} aria-labelledby={`f-${f.id}`}>
            <div className={s.colonne}>
              <div className={s.colle}>
                <TitreAnime id={`f-${f.id}`} className={`affiche ${s.titre}`}>{f.nom}</TitreAnime>
                <p className={s.texte}>{f.texte}</p>
                <p className={s.compte}>{cats.length} booster{cats.length > 1 ? "s" : ""}</p>
              </div>
            </div>
            <ul className={s.grille}>
              {cats.map((c) => {
                const n = CATEGORIES.indexOf(c) + 1;
                return (
                  <li key={c.id}>
                    <Link href={`/categories/${c.id}`} className={s.booster}>
                      <span className={s.paquet}>
                        <Booster2D famille={f.id} titre={c.court} sousTitre={`${String(n).padStart(2, "0")} / 25`} />
                        <span className={s.cache}>{c.titre}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
