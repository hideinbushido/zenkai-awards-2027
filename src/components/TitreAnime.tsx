"use client";

import { useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, SplitText, reduit, useGSAP } from "@/lib/gsap";

// Titre qui se lève lettre par lettre, façon ressort, à son entrée à l'écran.
export default function TitreAnime({ as: Balise = "h2", className, children, id }: { as?: ElementType; className?: string; children: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (!ref.current || reduit()) return;
    const split = new SplitText(ref.current, { type: "lines,chars", linesClass: "ligne-masque" });
    gsap.set(split.lines, { overflow: "hidden" });
    gsap.from(split.chars, {
      yPercent: 120, rotate: 8, opacity: 0,
      duration: 1.1, ease: "back.out(1.4)", stagger: { each: 0.022 },
      scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
    });
    return () => { split.revert(); ScrollTrigger.refresh(); };
  }, { scope: ref });
  return <Balise ref={ref} id={id} className={className}>{children}</Balise>;
}
