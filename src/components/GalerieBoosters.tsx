"use client";

import Link from "next/link";
import { useRef } from "react";
import { CATEGORIES, type Famille } from "@/data/edition";
import { gsap, ScrollTrigger, reduit, useGSAP } from "@/lib/gsap";
import s from "./GalerieBoosters.module.css";

const TEINTE: Record<Famille, number> = { series: 205, personnages: 300, musique: 350, technique: 115, "grand-prix": 75 };
const FAMILLE: Record<Famille, string> = { series: "Série", personnages: "Personnage", musique: "Musique", technique: "Technique", "grand-prix": "Grand prix" };

// Acte 3 : les 25 boosters défilent latéralement pendant que la page descend.
export default function GalerieBoosters() {
  const zone = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const jauge = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (reduit() || !zone.current || !rail.current) return;
    const distance = () => rail.current!.scrollWidth - innerWidth;
    // Le rail avance 1,8 fois plus vite que le défilement : la scène reste courte
    const regle = () => { zone.current!.style.height = `${distance() / 1.8 + innerHeight}px`; };
    regle();
    gsap.to(rail.current, {
      x: () => -distance(), ease: "none",
      scrollTrigger: {
        trigger: zone.current, start: "top top", end: "bottom bottom", scrub: 0.5, invalidateOnRefresh: true,
        onRefreshInit: regle,
        onUpdate: (st) => { if (jauge.current) jauge.current.style.transform = `scaleX(${st.progress})`; },
      },
    });
    ScrollTrigger.refresh();
  }, { scope: zone });

  return (
    <div ref={zone} className={s.zone}>
      <section className={s.collant} aria-labelledby="galerie-titre">
        <div ref={rail} className={s.rail}>
          <div className={s.intro}>
            <h2 id="galerie-titre" className={s.titre}>25 boosters</h2>
            <p className={s.texte}>Chaque catégorie est un booster. Ouvre-le pour découvrir ses nominés, garde ta carte préférée, ou passe s&apos;il ne te parle pas.</p>
          </div>
          {CATEGORIES.map((c, i) => (
            <Link key={c.id} href={`/categories/${c.id}`} className={s.booster} style={{ "--teinte": TEINTE[c.famille] } as React.CSSProperties}>
              <span className={s.feuille} aria-hidden="true" />
              <span className={s.haut}>
                <span className={s.marque}>Zenkai</span>
                <span className={s.num}>{String(i + 1).padStart(2, "0")}</span>
              </span>
              <span className={s.etiquette}>
                <span className={s.famille}>{FAMILLE[c.famille]}</span>
                <span className={s.nom}>{c.titre}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className={s.jauge} aria-hidden="true"><span ref={jauge} /></div>
      </section>
    </div>
  );
}
