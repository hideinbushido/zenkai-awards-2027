"use client";

import { useRef } from "react";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import { EASE } from "@/lib/motion";
import s from "./Manifeste.module.css";

const PHRASE = "Pas de jury. Pas d'algorithme. Vingt-cinq boosters, une carte par fan, et un seul live pour tout révéler.";

// Le principe, en une phrase : les mots se lèvent une fois, à l'arrivée sur la section.
export default function Manifeste() {
  const zone = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (reduit()) return;
    gsap.from(gsap.utils.toArray<HTMLElement>(`.${s.mot}`, zone.current), {
      yPercent: 60, autoAlpha: 0, duration: 1.1, ease: EASE, stagger: 0.035,
      scrollTrigger: { trigger: zone.current, start: "top 75%", once: true },
    });
  }, { scope: zone });

  return (
    <section ref={zone} className={s.panneau} aria-label="Le principe">
      <p className={s.phrase}>
        {PHRASE.split(" ").map((m, i) => <span key={i} className={s.mot}>{m} </span>)}
      </p>
    </section>
  );
}
