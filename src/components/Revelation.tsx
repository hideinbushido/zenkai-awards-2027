"use client";

import { useRef, type ReactNode } from "react";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import s from "./Revelation.module.css";

// Acte 5 : la section s'ouvre comme une fenêtre qui s'agrandit jusqu'au plein cadre.
export default function Revelation({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLElement>(null);
  const cadre = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reduit()) return;
    gsap.fromTo(cadre.current, { clipPath: "inset(14% 10% 14% 10% round 40px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
      scrollTrigger: { trigger: ref.current, start: "top bottom", end: "top 15%", scrub: 0.4 },
    });
  }, { scope: ref });
  return (
    <section ref={ref} className={s.section} aria-label={label}>
      <div ref={cadre} className={s.cadre}>{children}</div>
    </section>
  );
}
