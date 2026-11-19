import type { Metadata } from "next";
import Image from "next/image";
import TitreAnime from "@/components/TitreAnime";
import { ANIME_DE_L_ANNEE, PALMARES_2026 } from "@/data/palmares2026";
import GrandPrix from "./GrandPrix";
import s from "./page.module.css";

export const metadata: Metadata = { title: "Palmarès · Zenkai Anime Awards" };

export default function Palmares() {
  const gp = ANIME_DE_L_ANNEE.winner;
  return (
    <>
      <section className={s.nuit} aria-labelledby="palm-titre">
        <TitreAnime as="h1" id="palm-titre" className={`affiche ${s.titre}`}>Palmarès 2026</TitreAnime>
        <p className={s.chapo}>
          Vingt-cinq résultats, annoncés en direct pendant le live de la première édition par des créateurs invités. Le palmarès 2027 sera révélé ici après le live de mai.
        </p>
        <GrandPrix img={gp.img} nom={gp.name} sous={gp.sub} credit={gp.credit} />
      </section>

      <section className={s.liste} aria-labelledby="env-titre">
        <TitreAnime id="env-titre" className={`affiche ${s.h2}`}>Les 24 autres résultats</TitreAnime>
        <ol className={s.grille}>
          {PALMARES_2026.map((c, i) => (
            <li key={c.id} className={s.enveloppe}>
              <div className={s.affiche}>
                <Image src={c.winner.img} alt="" fill sizes="(max-width: 760px) 40vw, 200px" />
              </div>
              <div className={s.infos}>
                <p className={s.ordre}>Enveloppe {i + 1}</p>
                <h3 className={s.cat}>{c.titleFr}</h3>
                <p className={s.gagnant}>{c.winner.name}</p>
                {c.winner.sub && <p className={s.sous}>{c.winner.sub}</p>}
                {(c.second || c.third) && (
                  <ol className={s.podium}>
                    {c.second && <li><span>2</span>{c.second.name}</li>}
                    {c.third && <li><span>3</span>{c.third.name}</li>}
                  </ol>
                )}
                <p className={s.par}>
                  {c.presenter.photo && <Image src={c.presenter.photo} alt="" width={28} height={28} className={s.photo} />}
                  Annoncé par {c.presenter.name}{c.presenter.handle ? <span> {c.presenter.handle}</span> : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
