import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import EnTetePage from "@/components/EnTetePage";
import TitreAnime from "@/components/TitreAnime";
import { FAMILLES, imageBooster } from "@/data/boosters";
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
                        <Image src={imageBooster(f.id)} alt="" width={420} height={720} sizes="(max-width: 760px) 44vw, 220px" />
                        <span className={s.sticker}>
                          <span className={s.num}>{String(n).padStart(2, "0")} / 25</span>
                          <span className={s.nom}>{c.titre}</span>
                        </span>
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
