"use client";

import Image from "next/image";
import { useRef } from "react";
import { NOMINES_ANNEE, NOMINES_PROTAGONISTE } from "@/data/edition";
import { ScrollTrigger, reduit, useGSAP } from "@/lib/gsap";
import s from "./Anneau.module.css";

const CARTES = [
  ...NOMINES_ANNEE.map((n) => ({ ...n, cat: "Animé de l'année" })),
  ...NOMINES_PROTAGONISTE.map((n) => ({ ...n, cat: "Meilleur protagoniste" })),
];
const N = CARTES.length;
const PAS = 360 / N;

// Acte 4, le pic : les nominés en anneau au-dessus d'un sol miroir.
// On le fait tourner en glissant (avec inertie) et en défilant. La carte de face s'illumine.
export default function Anneau() {
  const zone = useRef<HTMLDivElement>(null);
  const anneau = useRef<HTMLDivElement>(null);
  const nom = useRef<HTMLParagraphElement>(null);
  const cat = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    const el = anneau.current;
    if (!el) return;
    const cartes = Array.from(el.children) as HTMLElement[];
    const fige = reduit();

    let base = 0, vitesse = 0, scrollAngle = 0, glisse = false, dernierX = 0, face = -1;
    let actif = true;

    const st = ScrollTrigger.create({
      trigger: zone.current, start: "top bottom", end: "bottom top",
      onUpdate: (t) => { scrollAngle = -t.progress * 300; },
    });

    const metAJour = () => {
      const angle = base + scrollAngle;
      el.style.transform = `translateZ(calc(var(--rayon) * -1)) rotateY(${angle}deg)`;
      const i = ((Math.round(-angle / PAS) % N) + N) % N;
      if (i !== face) {
        cartes[face]?.removeAttribute("data-face");
        cartes[i]?.setAttribute("data-face", "");
        face = i;
        if (nom.current) nom.current.textContent = CARTES[i].nom;
        if (cat.current) cat.current.textContent = CARTES[i].cat;
      }
    };

    const boucle = () => {
      if (!actif) return;
      if (!glisse) {
        vitesse *= 0.95;
        if (!fige) base += vitesse + 0.03; // lente dérive continue
      }
      metAJour();
      requestAnimationFrame(boucle);
    };
    requestAnimationFrame(boucle);

    const bas = (e: PointerEvent) => { glisse = true; dernierX = e.clientX; vitesse = 0; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
    const bouge = (e: PointerEvent) => {
      if (!glisse) return;
      const dx = e.clientX - dernierX; dernierX = e.clientX;
      base += dx * 0.22; vitesse = dx * 0.22;
    };
    const haut = () => { glisse = false; };
    const scene = zone.current!.querySelector(`.${s.scene}`) as HTMLElement;
    scene.addEventListener("pointerdown", bas);
    scene.addEventListener("pointermove", bouge);
    scene.addEventListener("pointerup", haut);
    scene.addEventListener("pointercancel", haut);

    return () => {
      actif = false; st.kill();
      scene.removeEventListener("pointerdown", bas);
      scene.removeEventListener("pointermove", bouge);
      scene.removeEventListener("pointerup", haut);
      scene.removeEventListener("pointercancel", haut);
    };
  }, { scope: zone });

  return (
    <div ref={zone} className={s.zone}>
      <section className={s.collant} aria-labelledby="anneau-titre">
        <div className={s.tete}>
          <h2 id="anneau-titre" className={s.titre}>Les nominés</h2>
          <p className={s.aide}>Attrape l&apos;anneau et fais-le tourner. Exemples tirés de l&apos;édition 2026.</p>
        </div>

        <div className={s.scene}>
          <div ref={anneau} className={s.anneau} style={{ "--n": N } as React.CSSProperties}>
            {CARTES.map((c, i) => (
              <figure key={`${c.cat}-${c.id}`} className={s.carte} style={{ "--a": `${i * PAS}deg` } as React.CSSProperties}>
                <Image src={c.img} alt={`${c.nom}, ${c.cat}`} fill sizes="240px" draggable={false} />
                <span className={s.foil} aria-hidden="true" />
              </figure>
            ))}
          </div>
          <div className={s.sol} aria-hidden="true" />
        </div>

        <div className={s.legende} aria-live="polite">
          <p ref={cat} className={s.cat}>{CARTES[0].cat}</p>
          <p ref={nom} className={s.nom}>{CARTES[0].nom}</p>
        </div>
      </section>
    </div>
  );
}
