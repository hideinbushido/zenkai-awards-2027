import Hero from "@/components/Hero";
import Dither from "@/components/Dither";
import Edition1 from "@/components/Edition1";
import MurBoosters from "@/components/MurBoosters";
import Rappel from "@/components/Rappel";
import TitreAnime from "@/components/TitreAnime";
import SceneBooster from "@/components/booster/SceneBooster";
import FondShader from "@/components/webgl/FondShader";
import { EDITION, NOMINES_ANNEE } from "@/data/edition";
import s from "./page.module.css";

const ETAPES = [
  { titre: "Ouvre", texte: "Chaque catégorie est un booster. Tu l'ouvres, ses nominés apparaissent : des animés diffusés en 2026." },
  { titre: "Garde", texte: "Tu gardes ta carte préférée. Tu ne connais pas la catégorie ? Tu passes au booster suivant." },
  { titre: "Confirme", texte: "Un lien arrive par email. Un clic, et ton classeur compte. Une voix par adresse." },
  { titre: "Révèle", texte: "En mai, en live sur TikTok, chaque prix est révélé par un créateur de la communauté." },
];

export default function Accueil() {
  return (
    <main>
      <Hero />

      <SceneBooster images={NOMINES_ANNEE.slice(0, 5).map((n) => n.img)} categorie="Animé de l'année" />

      {/* Le principe, sur fond de dither */}
      <section className={s.principe} aria-labelledby="principe-titre">
        <Dither className={s.dither} />
        <div className={s.principeVoile} aria-hidden="true" />
        <TitreAnime id="principe-titre" className={s.h2}>Quatre gestes</TitreAnime>
        <ol className={s.etapes}>
          {ETAPES.map((e) => (
            <li key={e.titre} className={s.etape}>
              <h3 className={s.etapeTitre}>{e.titre}</h3>
              <p className={s.etapeTexte}>{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Le mur des 25 boosters */}
      <section className={s.mur} aria-labelledby="mur-titre">
        <div className={s.murTete}>
          <TitreAnime id="mur-titre" className={s.h2}>25 boosters</TitreAnime>
          <p className={s.chapo}>Séries, personnages, musique, technique, et le booster secret de l&apos;animé de l&apos;année. Survole, ouvre, garde.</p>
        </div>
        <MurBoosters />
      </section>

      {/* Édition 1 */}
      <section className={s.edition} aria-labelledby="ed-titre">
        <div className={s.murTete}>
          <TitreAnime id="ed-titre" className={s.h2}>Édition 1</TitreAnime>
          <p className={s.chapo}>2026, les premiers gagnants. Passe la souris sur une vitre pour la voir s&apos;éclaircir.</p>
        </div>
        <Edition1 />
        <a className={s.lien} href="https://animeawards-alpha.vercel.app/fr/resultats">Tout le palmarès 2026</a>
      </section>

      {/* Rappel */}
      <section id="rappel" className={s.rappel} aria-labelledby="rappel-titre">
        <FondShader className={s.rappelFond} intensite={0.7} />
        <div className={s.rappelContenu}>
          <TitreAnime id="rappel-titre" className={s.h2}>Ouverture en mars</TitreAnime>
          <p className={s.chapo}>Laisse ton email, on te prévient le jour où les boosters s&apos;ouvrent. Le live suit en mai, sur le TikTok de @ricokouame.</p>
          <Rappel />
        </div>
      </section>

      <footer className={s.pied}>
        <dl className={s.infos}>
          <div><dt>Animés éligibles</dt><dd>diffusés de janvier à décembre 2026</dd></div>
          <div><dt>Votes</dt><dd>{EDITION.votes}, boosters passables</dd></div>
          <div><dt>Une voix</dt><dd>par adresse email, confirmée par lien</dd></div>
          <div><dt>Live</dt><dd>{EDITION.live} sur TikTok</dd></div>
        </dl>
        <p className={s.proto}>Thème Holo, premier rendu. Visuels de l&apos;édition 2026, provisoires.</p>
        <p className={s.geant} aria-hidden="true">ZENKAI</p>
      </footer>
    </main>
  );
}
