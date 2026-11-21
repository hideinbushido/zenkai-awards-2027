"use client";

import Link from "next/link";
import Booster2D from "@/components/Booster2D";
import CarteHolo from "@/components/CarteHolo";
import { FAMILLES, nominesDe } from "@/data/boosters";
import { CATEGORIES, EDITION } from "@/data/edition";
import { retirerCarte, useCollection } from "@/lib/collection";
import s from "./page.module.css";

// L'écran récap : les 25 emplacements, rangés par famille. Une carte gardée par booster, ou un emplacement vide.
export default function Classeur() {
  const collection = useCollection();
  const n = Object.keys(collection).length;

  return (
    <div className={s.page}>
      <header className={s.tete}>
        <h1 className={`affiche ${s.titre}`}>Ma collection</h1>
        <div className={s.resume}>
          <p className={s.compte}><strong>{n}</strong> carte{n > 1 ? "s" : ""} sur 25</p>
          <p className={s.texte}>
            Une carte par booster. Tu peux passer ceux que tu ne connais pas. Quand les votes ouvriront en {EDITION.votes.toLowerCase()}, ta collection deviendra ton bulletin.
          </p>
          <div className={s.actions}>
            <Link href="/categories" className="bouton">{n ? "Continuer à ouvrir" : "Ouvrir mon premier booster"}</Link>
            <button type="button" className="bouton-clair" disabled aria-disabled="true">Valider en mars</button>
          </div>
        </div>
        <div className={s.jauge} aria-hidden="true"><i style={{ width: `${(n / 25) * 100}%` }} /></div>
      </header>

      {FAMILLES.map((f) => {
        const cats = CATEGORIES.filter((c) => c.famille === f.id);
        return (
          <section key={f.id} className={s.famille} aria-labelledby={`col-${f.id}`}>
            <h2 id={`col-${f.id}`} className={s.nomFamille}>
              {f.nom} <span>{cats.filter((c) => collection[c.id]).length} / {cats.length}</span>
            </h2>
            <ul className={s.rangee}>
              {cats.map((c) => {
                const numero = `${String(CATEGORIES.indexOf(c) + 1).padStart(2, "0")} / 25`;
                const carte = nominesDe(c.id)?.find((x) => x.id === collection[c.id]);
                return (
                  <li key={c.id} className={s.emplacement}>
                    <p className={s.cat}>{c.titre}</p>
                    {carte ? (
                      <>
                        <Link href={`/categories/${c.id}`} className={s.lienCarte} aria-label={`${c.titre} : ${carte.nom}. Changer de carte`}>
                          <CarteHolo img={carte.img} nom={carte.nom} detail={carte.detail} numero={numero} taille="fluide" />
                        </Link>
                        <button type="button" className={s.retirer} onClick={() => retirerCarte(c.id)}>Retirer</button>
                      </>
                    ) : (
                      <Link href={`/categories/${c.id}`} className={s.vide} aria-label={`${c.titre} : emplacement vide, ouvrir le booster`}>
                        <span className={s.mini}><Booster2D famille={c.famille} titre={c.court} sousTitre={numero} /></span>
                        <span className={s.ouvrir}>Ouvrir</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
