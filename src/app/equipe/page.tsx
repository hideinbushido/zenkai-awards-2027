import type { Metadata } from "next";
import Image from "next/image";
import EnTetePage from "@/components/EnTetePage";
import TitreAnime from "@/components/TitreAnime";
import { EDITION } from "@/data/edition";
import { ANIME_DE_L_ANNEE, PALMARES_2026 } from "@/data/palmares2026";
import s from "./page.module.css";

export const metadata: Metadata = { title: "Équipe · Zenkai Anime Awards" };

type Voix = { nom: string; handle?: string; photo?: string; categories: string[] };

// Les présentateurs 2026, regroupés (certains ont ouvert plusieurs enveloppes).
function voix(): Voix[] {
  const parNom = new Map<string, Voix>();
  for (const c of [...PALMARES_2026, ANIME_DE_L_ANNEE]) {
    const p = c.presenter;
    const v = parNom.get(p.name) ?? { nom: p.name, handle: p.handle, photo: p.photo, categories: [] };
    v.categories.push(c.titleFr);
    v.photo ??= p.photo;
    parNom.set(p.name, v);
  }
  return [...parNom.values()].filter((v) => v.nom !== "Rico");
}

export default function Equipe() {
  const liste = voix();
  return (
    <>
      <EnTetePage
        titre="Les voix"
        chapo="Une cérémonie communautaire, portée par des créateurs de la communauté. Voici l'organisateur et celles et ceux qui ont ouvert les enveloppes en 2026. Les présentateurs 2027 seront annoncés avant le live."
      />

      <section className={s.rico} aria-labelledby="rico-titre">
        <div className={s.ricoCarte} aria-hidden="true">
          <Image src="/visuels/logo-zenkai-noir.png" alt="" width={220} height={220} className={s.ricoEmbleme} />
        </div>
        <div className={s.ricoTexte}>
          <p className={s.role}>Organisation et live</p>
          <h2 id="rico-titre" className={`affiche ${s.ricoNom}`}>Rico</h2>
          <p className={s.ricoBio}>
            Fondateur de Zenkai. Il organise la cérémonie, présente le live et a ouvert en 2026 les enveloppes du meilleur ending et de l&apos;animé de l&apos;année.
          </p>
          <a href={EDITION.tiktok} className="bouton">@ricokouame sur TikTok</a>
        </div>
      </section>

      <section className={s.liste} aria-labelledby="voix-titre">
        <TitreAnime id="voix-titre" className={`affiche ${s.h2}`}>Les présentateurs 2026</TitreAnime>
        <ul className={s.grille}>
          {liste.map((v) => (
            <li key={v.nom} className={s.portrait}>
              <div className={s.photo}>
                {v.photo ? <Image src={v.photo} alt="" fill sizes="(max-width: 760px) 45vw, 240px" /> : <span className={s.initiale}>{v.nom[0]}</span>}
              </div>
              <p className={s.nom}>{v.nom}</p>
              {v.handle && <p className={s.handle}>{v.handle}</p>}
              <p className={s.cats}>{v.categories.join(", ")}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
