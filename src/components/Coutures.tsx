"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, reduit, useGSAP } from "@/lib/gsap";

// Coutures de l'accueil : les sections se fondent les unes dans les autres au lieu de se couper.
// - l'opening reste épinglé pendant que l'index monte par-dessus, et s'assombrit en partant ;
// - chaque grand titre entre en se dévoilant, lié au défilement.
export default function Coutures() {
  const repere = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const racine = repere.current?.closest("[data-accueil]");
    if (!racine || reduit()) return;
    const sections = [...racine.children].filter((e): e is HTMLElement => e.tagName === "SECTION");
    const [heros] = sections;

    if (heros) {
      ScrollTrigger.create({ trigger: heros, start: "top top", end: "bottom top", pin: true, pinSpacing: false });
      const sortie = gsap.timeline({ scrollTrigger: { trigger: heros, start: "top top", end: "bottom top", scrub: 0.6 } });
      const video = heros.querySelector("video");
      if (video) sortie.to(video, { scale: 1.14, filter: "brightness(0.28) saturate(0.8)", ease: "none" }, 0);
      sortie.to(heros.querySelectorAll(":scope > div, :scope > footer"), { yPercent: -35, opacity: 0, ease: "none" }, 0);
    }

    // Les scènes collantes naissent du noir : leur bord haut est fondu tant qu'elles montent.
    racine.querySelectorAll<HTMLElement>("[data-fondu]").forEach((el) => {
      gsap.fromTo(el, { "--fondu": 1 }, { "--fondu": 0, ease: "none",
        scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "top top", scrub: true } });
    });

    racine.querySelectorAll<HTMLElement>("[data-entree]").forEach((el) => {
      gsap.fromTo(el,
        { y: 90, opacity: 0, clipPath: "inset(100% 0% 0% 0%)" },
        { y: 0, opacity: 1, clipPath: "inset(0% 0% 0% 0%)", ease: "none",
          scrollTrigger: { trigger: el, start: "top 92%", end: "top 55%", scrub: 0.5 } });
    });
  });

  return <span ref={repere} hidden />;
}
