"use client";

import { useRef } from "react";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import s from "./Manifeste.module.css";

const PHRASE = "Pas de jury. Pas d'algorithme. Vingt-cinq catégories, une voix par fan, et un seul live pour tout révéler.";
const FORTS = new Set(["jury.", "d'algorithme.", "voix", "live"]);

// Acte 2 : une phrase qui s'allume mot à mot sous le pouce, en glissant par-dessus le nom.
export default function Manifeste() {
  const zone = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reduit()) return;
    const mots = gsap.utils.toArray<HTMLElement>(`.${s.mot}`, zone.current);
    gsap.fromTo(mots, { opacity: 0.13 }, {
      opacity: 1, ease: "none", stagger: 0.5,
      scrollTrigger: { trigger: zone.current, start: "top 35%", end: "bottom 85%", scrub: 0.3 },
    });
  }, { scope: zone });

  return (
    <div ref={zone} className={s.zone}>
      <section className={s.panneau} aria-label="Le principe">
        <p className={s.phrase}>
          {PHRASE.split(" ").map((m, i) => (
            <span key={i} className={`${s.mot} ${FORTS.has(m) ? s.fort : ""}`}>{m} </span>
          ))}
        </p>
        <p className={s.signature}>Zenkai Anime Awards, deuxième édition</p>
      </section>
    </div>
  );
}
