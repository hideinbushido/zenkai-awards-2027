import type { Metadata } from "next";
import Link from "next/link";
import Edition1 from "@/components/Edition1";
import EnTetePage from "@/components/EnTetePage";
import Manifeste from "@/components/Manifeste";
import TitreAnime from "@/components/TitreAnime";
import { EDITION } from "@/data/edition";
import s from "./page.module.css";

export const metadata: Metadata = { title: "À propos · Zenkai Anime Awards 2027" };

const ETAPES = [
  { titre: "Ouvre", texte: "Chaque catégorie est un booster. Tu l'ouvres et ses nominés apparaissent, tous diffusés en 2026." },
  { titre: "Garde", texte: "Tu gardes ta carte préférée. Tu ne connais pas la catégorie ? Tu passes au booster suivant." },
  { titre: "Confirme", texte: "Un lien arrive par email : un clic, et ton classeur compte. Une voix par adresse." },
  { titre: "Révèle", texte: "En mai, en live sur TikTok, chaque prix est révélé par un créateur de la communauté." },
];

const CALENDRIER = [
  { quand: "Janvier – février 2027", quoi: "Sélection des nominés parmi les animés diffusés de janvier à décembre 2026." },
  { quand: "Mars – avril 2027", quoi: "Les boosters s'ouvrent : vingt-cinq catégories, une voix par fan." },
  { quand: "Fin avril 2027", quoi: "Les votes confirmés par email sont dépouillés." },
  { quand: "Mai 2027", quoi: "Le live : les résultats annoncés en direct sur TikTok." },
];

export default function APropos() {
  return (
    <>
      <EnTetePage
        titre="Votée par les fans"
        chapo="Les Zenkai Anime Awards sont une cérémonie communautaire annuelle. Les fans choisissent leurs animés, personnages et moments de l'année, et les résultats sont révélés en direct, enveloppe par enveloppe."
        aside={<Link href="/categories" className="bouton">Voir les catégories</Link>}
      />

      <Manifeste />

      <section className={s.section} aria-labelledby="gestes-titre">
        <TitreAnime id="gestes-titre" className={`affiche ${s.h2}`}>Quatre gestes</TitreAnime>
        <ol className={s.etapes}>
          {ETAPES.map((e, i) => (
            <li key={e.titre} className={s.etape}>
              <span className={s.numero} aria-hidden="true">{i + 1}</span>
              <h3 className={`affiche ${s.etapeTitre}`}>{e.titre}</h3>
              <p className={s.etapeTexte}>{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${s.section} ${s.calendrier}`} aria-labelledby="cal-titre">
        <TitreAnime id="cal-titre" className={`affiche ${s.h2}`}>Le calendrier</TitreAnime>
        <ol className={s.frise}>
          {CALENDRIER.map((c) => (
            <li key={c.quand} className={s.jalon}>
              <span className={s.point} aria-hidden="true" />
              <p className={s.quand}>{c.quand}</p>
              <p className={s.quoi}>{c.quoi}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${s.section} ${s.derriere}`} aria-labelledby="qui-titre">
        <div>
          <TitreAnime id="qui-titre" className={`affiche ${s.h2}`}>Qui est derrière</TitreAnime>
        </div>
        <div className={s.qui}>
          <p>
            Zenkai, c&apos;est le collectif de Rico (<a href={EDITION.tiktok}>@ricokouame</a>), qui organise la cérémonie et anime le live.
            En 2026, le live était présenté par Pape, Mr. Hunter et Braizanime, et vingt-quatre créateurs de la communauté étaient invités à annoncer les résultats.
          </p>
          <p>Pas de jury, pas d&apos;algorithme : seuls les votes décident. En cas d&apos;égalité parfaite, l&apos;organisation peut déclarer des ex-aequo.</p>
          <div className={s.liens}>
            <Link href="/equipe" className="bouton-clair">L&apos;équipe et les voix</Link>
            <Link href="/faq" className="bouton-clair">FAQ et règlement</Link>
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.edition}`} aria-labelledby="ed-titre">
        <div className={s.edTete}>
          <TitreAnime id="ed-titre" className={`affiche ${s.h2}`}>La première édition</TitreAnime>
          <p className={s.chapo}>2026, les premiers gagnants. Passe sur une vitre pour la voir s&apos;éclaircir.</p>
        </div>
        <Edition1 />
        <Link className="lien-souligne" href="/palmares">Tout le palmarès 2026</Link>
      </section>
    </>
  );
}
