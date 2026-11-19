"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Booster2D from "@/components/Booster2D";
import CarteHolo from "@/components/CarteHolo";
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
        <ul className={s.eventail} role="radiogroup" aria-label={`Nominés : ${categorie.titre}`}>
          {nomines.map((nm, i) => {
            const k = i - (n - 1) / 2;
            return (
              <li key={nm.id} className={s.carteNomine} style={{ "--k": k } as React.CSSProperties}>
                <div className={s.envol} data-rot={k * 5}>
                <button
                  type="button" role="radio" aria-checked={choix === nm.id}
                  className={s.choisir} data-garde={garde === nm.id || undefined}
                  onClick={() => setChoix(nm.id)} disabled={!ouvert}
                >
                  <CarteHolo img={nm.img} nom={nm.nom} detail={nm.detail} numero={`${String(numero).padStart(2, "0")} / 25`} taille="moyenne" />
                </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

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
