"use client";

import { useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, SplitText, reduit, useGSAP } from "@/lib/gsap";
import { DECALAGE, DUREE, EASE } from "@/lib/motion";

// Titre qui se lève lettre par lettre derrière un masque, à son entrée à l'écran.
export default function TitreAnime({ as: Balise = "h2", className, children, id }: { as?: ElementType; className?: string; children: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (!ref.current || reduit()) return;
    const split = new SplitText(ref.current, { type: "lines,chars", linesClass: "ligne-masque" });
    gsap.set(split.lines, { overflow: "hidden" });
    gsap.from(split.chars, {
      yPercent: 112,
      duration: DUREE.normale, ease: EASE, stagger: { each: DECALAGE * 0.6 },
      scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
    });
    return () => { split.revert(); ScrollTrigger.refresh(); };
  }, { scope: ref });
  return <Balise ref={ref} id={id} className={className}>{children}</Balise>;
}
