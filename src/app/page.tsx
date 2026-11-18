import Image from "next/image";
import CarteHolo from "@/components/CarteHolo";
import Rappel from "@/components/Rappel";
import { CATEGORIES, EDITION, NOMINES_ANNEE, PALMARES_2026, type Famille } from "@/data/edition";
import s from "./page.module.css";

const EVENTAIL = [NOMINES_ANNEE[1], NOMINES_ANNEE[3], NOMINES_ANNEE[0], NOMINES_ANNEE[2], NOMINES_ANNEE[4]];

const FAMILLES: { id: Famille; nom: string; rarete: string }[] = [
  { id: "series", nom: "Séries", rarete: "Commune" },
  { id: "personnages", nom: "Personnages", rarete: "Rare" },
  { id: "musique", nom: "Musique", rarete: "Holo" },
  { id: "technique", nom: "Technique", rarete: "Holo inversée" },
  { id: "grand-prix", nom: "Grand prix", rarete: "Secrète" },
];

const ETAPES = [
  { titre: "Tu choisis", texte: "Un favori par catégorie, parmi les animés diffusés en 2026. Celles que tu ne connais pas, tu les passes." },
  { titre: "Tu confirmes", texte: "Un lien arrive par email : un clic, et ton vote compte. Une voix par adresse." },
  { titre: "Tu découvres en live", texte: "En mai, chaque prix est révélé en direct sur TikTok, ouvert par un créateur de la communauté." },
];

function Symbole({ famille }: { famille: Famille }) {
  // Symboles de rareté dessinés, un par famille
  const forme: Record<Famille, React.ReactNode> = {
    series: <circle cx="8" cy="8" r="5" />,
    personnages: <path d="M8 2 L14 8 L8 14 L2 8 Z" />,
    musique: <path d="M8 1.5 L9.8 6 L14.5 6.2 L10.8 9.2 L12 14 L8 11.3 L4 14 L5.2 9.2 L1.5 6.2 L6.2 6 Z" />,
    technique: <path d="M8 2 L14 13 L2 13 Z" />,
    "grand-prix": <path d="M8 1 L10 6 L15 8 L10 10 L8 15 L6 10 L1 8 L6 6 Z" />,
  };
  return <svg className={s.symbole} data-famille={famille} viewBox="0 0 16 16" aria-hidden="true">{forme[famille]}</svg>;
}

export default function Accueil() {
  return (
    <main>
      <header className={s.nav}>
        <a href="#" className={s.marque}>
          <Image src="/visuels/logo-zenkai-noir.png" alt="" width={36} height={36} className={s.embleme} />
          <span>Zenkai</span>
        </a>
        <nav aria-label="Navigation principale">
          <ul className={s.liens}>
            <li><a href="#set">Catégories</a></li>
            <li><a href="#grand-prix">Nominés</a></li>
            <li><a href="#edition-1">Palmarès 2026</a></li>
            <li><a href="#rappel">FAQ</a></li>
          </ul>
        </nav>
        <a href="#rappel" className={s.navVoter}>Voter</a>
      </header>

      {/* ───── Premier écran ───── */}
      <section className={s.hero} aria-labelledby="titre">
        <div className={s.heroTexte}>
          <p className={s.edition}>Édition 2 · {EDITION.annee}</p>
          {/* avoid-ai-design-ignore: C2 — le chrome est la matière du thème Holo Chrome : le titre est du métal, pas un dégradé décoratif */}
          {/* avoid-ai-design-ignore: SD5 — logotype ZENKAI + sous-titre, pas un mot accentué dans une phrase */}
          <h1 id="titre" className={s.titre}>
            <span className={s.zenkai}>Zenkai</span>
            <span className={s.sous}>Anime Awards {EDITION.annee}</span>
          </h1>
          <p className={s.accroche}>
            Les récompenses anime votées par la communauté. Vingt-cinq catégories, une voix par fan, des résultats révélés en live.
          </p>
          <div className={s.actions}>
            <a href="#rappel" className={s.boutonChrome}>Voter</a>
            <a href="#set" className={s.boutonFantome}>Voir les 25 catégories</a>
          </div>
          <dl className={s.dates}>
            <div><dt>Votes</dt><dd>{EDITION.votes}</dd></div>
            <div><dt>Live</dt><dd>{EDITION.live}, TikTok</dd></div>
          </dl>
        </div>

        <div className={s.eventail} aria-label="Nominés de l'édition 2026 en exemple">
          {EVENTAIL.map((n, i) => (
            <CarteHolo
              key={n.id}
              img={n.img}
              nom={n.nom}
              numero={`025 / 025`}
              rang={i === 2 ? "Secrète" : undefined}
              taille={i === 2 ? "grande" : "moyenne"}
              priorite
              className={s.carteEventail}
              style={{ "--i": i - 2 } as React.CSSProperties}
            />
          ))}
        </div>
      </section>

      {/* ───── Le principe ───── */}
      <section className={s.principe} aria-labelledby="principe-titre">
        <h2 id="principe-titre" className={s.h2}>Comment ça marche</h2>
        <ol className={s.etapes}>
          {ETAPES.map((e) => (
            <li key={e.titre} className={s.etape}>
              <h3 className={s.etapeTitre}>{e.titre}</h3>
              <p className={s.etapeTexte}>{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───── Grand prix ───── */}
      <section id="grand-prix" className={s.grandPrix} aria-labelledby="gp-titre">
        <div className={s.gpTete}>
          <h2 id="gp-titre" className={s.h2}>Animé de l&apos;année</h2>
          <p className={s.chapo}>
            La carte secrète du set : le dernier vote, le dernier prix du live. Ci-dessous, les nominés de 2026 en exemple, en attendant ceux de 2027.
          </p>
        </div>
        <div className={s.rangee}>
          {NOMINES_ANNEE.map((n) => (
            <CarteHolo key={n.id} img={n.img} nom={n.nom} numero="025 / 025" rang="Secrète" taille="moyenne" />
          ))}
        </div>
      </section>

      {/* ───── Le set : les 25 catégories ───── */}
      <section id="set" className={s.set} aria-labelledby="set-titre">
        <div className={s.setTete}>
          <h2 id="set-titre" className={s.h2}>Le set 2027</h2>
          <p className={s.chapo}>Vingt-cinq cartes à voter. Comme dans un vrai set, chaque famille a sa rareté.</p>
          <ul className={s.legende}>
            {FAMILLES.map((f) => (
              <li key={f.id}><Symbole famille={f.id} /> {f.nom} <span>· {f.rarete}</span></li>
            ))}
          </ul>
        </div>
        <ol className={s.checklist}>
          {CATEGORIES.map((c, i) => (
            <li key={c.id} className={s.case} data-famille={c.famille}>
              <span className={s.num}>{String(i + 1).padStart(3, "0")}</span>
              <Symbole famille={c.famille} />
              <span className={s.catNom}>{c.titre}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ───── Édition 1 ───── */}
      <section id="edition-1" className={s.edition1} aria-labelledby="ed1-titre">
        <h2 id="ed1-titre" className={s.h2}>Édition 1, 2026</h2>
        <p className={s.chapo}>Trois des vingt-cinq gagnants de la première édition, révélés en live.</p>
        <ul className={s.gagnants}>
          {PALMARES_2026.map((p) => (
            <li key={p.categorie} className={s.gagnant}>
              <CarteHolo img={p.img} nom={p.gagnant} numero="2026" rang="Gagnant" taille="petite" />
              <div>
                <p className={s.gCat}>{p.categorie}</p>
                <p className={s.gNom}>{p.gagnant}</p>
                <p className={s.gPar}>Enveloppe ouverte par {p.presentateur} <span>{p.handle}</span></p>
              </div>
            </li>
          ))}
        </ul>
        <a className={s.lien} href="https://animeawards-alpha.vercel.app/fr/resultats">Tout le palmarès 2026</a>
      </section>

      {/* ───── Rappel et live ───── */}
      <section id="rappel" className={s.rappel} aria-labelledby="rappel-titre">
        <div>
          <h2 id="rappel-titre" className={s.h2}>Les votes ouvrent en mars</h2>
          <p className={s.chapo}>
            Laisse ton email et on te prévient le jour de l&apos;ouverture. Le live des résultats suit en mai, sur le TikTok de @ricokouame.
          </p>
        </div>
        <div className={s.rappelForm}>
          <Rappel />
          <a className={s.lien} href={EDITION.tiktok}>Suivre @ricokouame sur TikTok</a>
        </div>
      </section>

      <footer className={s.pied}>
        <p className={s.piedMarque}>Zenkai Anime Awards · Édition 2</p>
        <dl className={s.infos}>
          <div><dt>Animés éligibles</dt><dd>diffusés de janvier à décembre 2026</dd></div>
          <div><dt>Votes</dt><dd>{EDITION.votes}, catégories passables</dd></div>
          <div><dt>Une voix</dt><dd>par adresse email, confirmée par lien</dd></div>
          <div><dt>Live</dt><dd>{EDITION.live} sur TikTok</dd></div>
        </dl>
        <p className={s.proto}>Prototype du thème Holo Chrome. Visuels de l&apos;édition 2026, provisoires.</p>
      </footer>
    </main>
  );
}
