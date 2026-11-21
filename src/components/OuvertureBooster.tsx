"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Booster2D from "@/components/Booster2D";
import CarteHolo, { STOP_EXTRAITS } from "@/components/CarteHolo";
import type { Categorie, Nomine } from "@/data/edition";
import { garderCarte, useCollection } from "@/lib/collection";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import { EASE } from "@/lib/motion";
import s from "./OuvertureBooster.module.css";

type Props = {
  categorie: Categorie;
  numero: number;
  nomines: Nomine[] | null;
  suivante: { id: string; titre: string } | null;
};

// Le moment fort : on déchire le booster, les nominés se posent en ligne, on garde sa carte.
// Pour les openings, toucher une carte ouvre l'opening en grand ; la survoler joue son refrain.
export default function OuvertureBooster({ categorie, numero, nomines, suivante }: Props) {
  const scene = useRef<HTMLDivElement>(null);
  const fenetre = useRef<HTMLDialogElement>(null);
  const collection = useCollection();
  const garde = collection[categorie.id] ?? null;
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<string | null>(null);
  const [enGrand, setEnGrand] = useState<Nomine | null>(null);
  const avecVideo = !!nomines?.some((x) => x.video);
  const num = `${String(numero).padStart(2, "0")} / 25`;
  const n = nomines?.length ?? 0;

  const { contextSafe } = useGSAP({ scope: scene });

  const ouvrir = () => {
    if (!nomines || ouvert) return;
    setChoix(garde);
    if (reduit()) { setOuvert(true); return; }
    contextSafe(() => {
      const q = gsap.utils.selector(scene);
      gsap.timeline({ defaults: { ease: EASE }, onComplete: () => setOuvert(true) })
        .to(q(`.${s.paquet}`), { x: 5, duration: 0.06, repeat: 5, yoyo: true, ease: "none" })
        .to(q(`.${s.bande}`), { y: -160, x: 120, rotate: 22, autoAlpha: 0, duration: 0.7 }, ">")
        .to(q(`.${s.corps}`), { y: 80, autoAlpha: 0, duration: 0.6 }, "<0.15");
    })();
  };

  // Les cartes arrivent une à une, à plat, dans la rangée
  useGSAP(() => {
    if (!ouvert || reduit()) return;
    gsap.from(gsap.utils.selector(scene)(`.${s.carte}`), { y: 70, autoAlpha: 0, duration: 0.9, ease: EASE, stagger: Math.min(0.07, 0.6 / Math.max(n, 1)) });
  }, { scope: scene, dependencies: [ouvert] });

  const garder = () => { if (choix) garderCarte(categorie.id, choix); };
  const nomDe = (id: string | null) => nomines?.find((x) => x.id === id)?.nom;

  // Opening : l'opening complet s'ouvre en grand
  const voir = (nm: Nomine) => {
    window.dispatchEvent(new Event(STOP_EXTRAITS));
    setEnGrand(nm);
  };
  useEffect(() => {
    const d = fenetre.current;
    if (enGrand && d && !d.open) d.showModal();
  }, [enGrand]);
  const fermer = () => fenetre.current?.close();

  return (
    <div ref={scene} className={s.scene} data-ouvert={ouvert || undefined}>
      {!ouvert && (
        <div className={s.scelle}>
          {/* Le booster scellé : la soudure du haut se détache du corps */}
          <div className={s.paquet}>
            <div className={s.corps}><Booster2D famille={categorie.famille} titre={categorie.court} sousTitre={num} /></div>
            <div className={s.bande} aria-hidden="true"><Booster2D famille={categorie.famille} titre={categorie.court} sousTitre={num} /></div>
          </div>
        </div>
      )}

      {ouvert && nomines && (
        <ul
          className={s.rangee} data-nombreux={n > 6 || undefined}
          role={avecVideo ? "list" : "radiogroup"} aria-label={`Nominés : ${categorie.titre}`}
        >
          {nomines.map((nm) => (
            <li key={nm.id} className={s.carte}>
              {nm.video ? (
                <button
                  type="button" aria-haspopup="dialog" aria-label={`${nm.nom}, ${nm.detail ?? ""} : voir l'opening`}
                  className={s.choisir} data-choisie={choix === nm.id || undefined} data-garde={garde === nm.id || undefined}
                  onClick={() => voir(nm)}
                >
                  <CarteHolo img={nm.img} nom={nm.nom} detail={nm.detail} numero={num} taille="fluide"
                    extrait={nm.refrain !== undefined ? { src: nm.video, debut: nm.refrain } : undefined} />
                </button>
              ) : (
                <button
                  type="button" role="radio" aria-checked={choix === nm.id}
                  className={s.choisir} data-choisie={choix === nm.id || undefined} data-garde={garde === nm.id || undefined}
                  onClick={() => setChoix(nm.id)}
                >
                  <CarteHolo img={nm.img} nom={nm.nom} detail={nm.detail} numero={num} taille="fluide" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* L'opening en grand */}
      <dialog ref={fenetre} className={s.fenetre} aria-labelledby="opening-titre" onClose={() => setEnGrand(null)}
        onClick={(e) => { if (e.target === e.currentTarget) fermer(); }}>
        {enGrand?.video && (
          <div className={s.fenetreCorps}>
            <video key={enGrand.id} className={s.fenetreVideo} src={enGrand.video} poster={enGrand.img}
              controls playsInline autoPlay={!reduit()} />
            <div className={s.fenetreInfos}>
              <div>
                <h2 id="opening-titre" className={s.fenetreTitre}>{enGrand.nom}</h2>
                {enGrand.detail && <p className={s.fenetreDetail}>{enGrand.detail}</p>}
              </div>
              <div className={s.fenetreActions}>
                <button type="button" className="bouton-clair" onClick={fermer}>Fermer</button>
                <button type="button" className="bouton" onClick={() => { setChoix(enGrand.id); fermer(); }}
                  disabled={choix === enGrand.id}>
                  {choix === enGrand.id ? "Carte choisie" : "Choisir cette carte"}
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>

      <div className={`panneau-encre ${s.barre}`}>
        {!nomines ? (
          <>
            <p className={s.etat}>Booster scellé. Les nominés seront dévoilés en février 2027.</p>
            <button type="button" className="bouton" disabled>Ouvrir en février</button>
          </>
        ) : !ouvert ? (
          <>
            <p className={s.etat}>
              {garde ? <>Dans ta collection : <strong>{nomDe(garde)}</strong>. Rouvre le booster pour changer de carte.</>
                : <>{n} cartes dans ce booster. Ouvre-le et garde ta préférée.</>}
            </p>
            <button type="button" className="bouton" onClick={ouvrir}>Ouvrir le booster</button>
          </>
        ) : (
          <>
            <p className={s.etat} aria-live="polite">
              {garde && garde === choix ? <>Carte gardée : <strong>{nomDe(garde)}</strong>. Elle est dans ta collection.</>
                : choix ? <>Ta carte : <strong>{nomDe(choix)}</strong>.</>
                : avecVideo ? "Touche une carte pour voir l'opening en entier. À la souris, la survoler joue son refrain."
                : "Touche la carte que tu veux garder."}
            </p>
            <button type="button" className="bouton" onClick={garder} disabled={!choix || garde === choix}>
              {garde && garde === choix ? "Gardée" : "Garder cette carte"}
            </button>
          </>
        )}
        <div className={s.liens}>
          {suivante && (
            <Link href={`/categories/${suivante.id}`} className={s.passer}>
              {garde ? "Booster suivant" : "Je ne connais pas, je passe"} : {suivante.titre}
            </Link>
          )}
          <Link href="/collection" className={s.passer}>Voir ma collection</Link>
        </div>
      </div>
    </div>
  );
}
