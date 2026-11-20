"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Booster2D from "@/components/Booster2D";
import CarteHolo, { STOP_EXTRAITS } from "@/components/CarteHolo";
import type { Categorie, Nomine } from "@/data/edition";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import { EASE } from "@/lib/motion";
import s from "./OuvertureBooster.module.css";

type Props = {
  categorie: Categorie;
  numero: number;
  nomines: Nomine[] | null;
  suivante: { id: string; titre: string } | null;
};

const CLE = "zenkai-classeur-2027";
const lireClasseur = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(CLE) ?? "{}"); } catch { return {}; }
};

// Le moment fort : on déchire le booster, les nominés jaillissent en éventail, on garde sa carte.
export default function OuvertureBooster({ categorie, numero, nomines, suivante }: Props) {
  const scene = useRef<HTMLDivElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<string | null>(null);
  const [garde, setGarde] = useState<string | null>(null);
  const [enGrand, setEnGrand] = useState<Nomine | null>(null);
  const fenetre = useRef<HTMLDialogElement>(null);
  const avecVideo = !!nomines?.some((x) => x.video);

  useEffect(() => {
    // Lecture de la carte déjà gardée pour ce booster (démo, stockée sur l'appareil)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGarde(lireClasseur()[categorie.id] ?? null);
  }, [categorie.id]);

  const { contextSafe } = useGSAP({ scope: scene });

  const ouvrir = () => {
    if (!nomines || ouvert) return;
    setOuvert(true);
    if (reduit()) return;
    contextSafe(() => {
    const q = gsap.utils.selector(scene);
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.to(q(`.${s.paquet}`), { x: 5, duration: 0.06, repeat: 5, yoyo: true, ease: "none" })
      .to(q(`.${s.bande}`), { y: -180, x: 140, rotate: 24, autoAlpha: 0, duration: 0.9 }, ">")
      .to(q(`.${s.corps}`), { y: "35%", autoAlpha: 0, duration: 1.1 }, "<0.25")
      .fromTo(q(`.${s.envol}`),
        { y: 260, scale: 0.6, rotation: (_: number, el: Element) => -Number((el as HTMLElement).dataset.rot), autoAlpha: 0 },
        { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 1.2, stagger: 0.08 },
        "<0.1");
    })();
  };

  const garder = () => {
    if (!choix) return;
    const c = { ...lireClasseur(), [categorie.id]: choix };
    try { localStorage.setItem(CLE, JSON.stringify(c)); } catch {}
    setGarde(choix);
  };

  // Opening : clic sur une carte = l'opening complet s'ouvre en grand.
  const voir = (nm: Nomine) => {
    window.dispatchEvent(new Event(STOP_EXTRAITS));
    setEnGrand(nm);
  };
  useEffect(() => {
    const d = fenetre.current;
    if (enGrand && d && !d.open) d.showModal();
  }, [enGrand]);
  const fermer = () => fenetre.current?.close();

  const nomGarde = nomines?.find((n) => n.id === garde)?.nom;
  const n = nomines?.length ?? 0;

  return (
    <div ref={scene} className={s.scene} data-ouvert={ouvert || undefined}>
      {/* Le booster scellé : corps + bande du haut, découpés dans la même image */}
      <div className={s.paquet} aria-hidden={ouvert || undefined}>
        <div className={s.corps}>
          <Booster2D famille={categorie.famille} titre={categorie.court} sousTitre={`${String(numero).padStart(2, "0")} / 25`} />
        </div>
        <div className={s.bande}>
          <Booster2D famille={categorie.famille} titre={categorie.court} sousTitre={`${String(numero).padStart(2, "0")} / 25`} />
        </div>
      </div>

      {/* Les cartes nominées */}
      {nomines && (
        <ul
          className={s.eventail}
          role={avecVideo ? "list" : "radiogroup"}
          aria-label={`Nominés : ${categorie.titre}`}
          data-nombreux={n > 7 || undefined}
          style={{ "--n": n } as React.CSSProperties}
        >
          {nomines.map((nm, i) => {
            const k = i - (n - 1) / 2;
            return (
              <li key={nm.id} className={s.carteNomine} style={{ "--k": k } as React.CSSProperties}>
                <div className={s.envol} data-rot={k * 5}>
                {nm.video ? (
                  <button
                    type="button" aria-haspopup="dialog" aria-label={`${nm.nom}, ${nm.detail ?? ""} : voir l'opening`}
                    className={s.choisir} data-choisie={choix === nm.id || undefined} data-garde={garde === nm.id || undefined}
                    onClick={() => voir(nm)} disabled={!ouvert}
                  >
                    <CarteHolo img={nm.img} nom={nm.nom} detail={nm.detail} numero={`${String(numero).padStart(2, "0")} / 25`} taille="moyenne"
                      extrait={nm.refrain !== undefined ? { src: nm.video, debut: nm.refrain } : undefined} />
                  </button>
                ) : (
                <button
                  type="button" role="radio" aria-checked={choix === nm.id}
                  className={s.choisir} data-garde={garde === nm.id || undefined}
                  onClick={() => setChoix(nm.id)} disabled={!ouvert}
                >
                  <CarteHolo img={nm.img} nom={nm.nom} detail={nm.detail} numero={`${String(numero).padStart(2, "0")} / 25`} taille="moyenne" />
                </button>
                )}
                </div>
              </li>
            );
          })}
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

      <div className={s.barre}>
        {!nomines ? (
          <>
            <p className={s.etat}>Booster scellé. Les nominés seront dévoilés en février 2027.</p>
            <button type="button" className="bouton" disabled>Ouvrir en février</button>
          </>
        ) : !ouvert ? (
          <>
            <p className={s.etat}>{garde ? <>Tu as déjà gardé <strong>{nomGarde}</strong>. Rouvre pour changer.</> : `${n} nominés dans ce booster. Exemples tirés de l'édition 2026.`}</p>
            <button type="button" className="bouton" onClick={ouvrir}>Ouvrir le booster</button>
          </>
        ) : (
          <>
            <p className={s.etat} aria-live="polite">
              {garde && garde === choix ? <>Carte gardée : <strong>{nomGarde}</strong>. Elle rejoint ton classeur (démo, enregistrée sur cet appareil).</>
                : choix ? <>Tu as choisi <strong>{nomines.find((x) => x.id === choix)?.nom}</strong>.</>
                : avecVideo ? "Touche une carte pour voir l'opening en entier. À la souris, la survoler joue son refrain."
                : "Choisis la carte que tu veux garder."}
            </p>
            <button type="button" className="bouton" onClick={garder} disabled={!choix || garde === choix}>Garder cette carte</button>
          </>
        )}
        {suivante && (
          <Link href={`/categories/${suivante.id}`} className={s.passer}>
            {ouvert && garde ? "Booster suivant" : "Je ne connais pas, je passe"} : {suivante.titre}
          </Link>
        )}
      </div>
    </div>
  );
}
