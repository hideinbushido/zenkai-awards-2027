"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";
import { ScrollTrigger, reduit, useGSAP } from "@/lib/gsap";
import s from "./SceneBooster.module.css";

const Booster3D = dynamic(() => import("./Booster3D"), { ssr: false });

const TEXTES = [
  { de: 0.02, a: 0.22, texte: "Chaque catégorie est un booster." },
  { de: 0.24, a: 0.5, texte: "Tu le déchires." },
  { de: 0.6, a: 1.01, texte: "Ses nominés sont les cartes. Tu gardes ta préférée." },
];

// Scène signature : le booster « Animé de l'année » se déchire au fil du défilement.
export default function SceneBooster({ images, categorie }: { images: string[]; categorie: string }) {
  const section = useRef<HTMLElement>(null);
  const progres = useRef(0);
  const textes = useRef<(HTMLParagraphElement | null)[]>([]);
  const cta = useRef<HTMLDivElement>(null);
  const jauge = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const applique = (p: number) => {
      progres.current = p;
      textes.current.forEach((el, i) => {
        if (!el) return;
        const { de, a } = TEXTES[i];
        const entree = Math.min(1, Math.max(0, (p - de) / 0.06));
        const sortie = Math.min(1, Math.max(0, (a - p) / 0.06));
        const v = Math.min(entree, sortie);
        el.style.opacity = String(v);
        el.style.transform = `translateY(${(1 - v) * 24}px)`;
      });
      if (cta.current) {
        const v = Math.min(1, Math.max(0, (p - 0.86) / 0.08));
        cta.current.style.opacity = String(v);
        cta.current.style.pointerEvents = v > 0.5 ? "auto" : "none";
      }
      if (jauge.current) jauge.current.style.transform = `scaleX(${p})`;
    };
    if (reduit()) { applique(1); return; }
    applique(0);
    ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (st) => applique(st.progress),
    });
  }, { scope: section });

  return (
    <section ref={section} className={s.section} aria-label="Comment fonctionne un booster">
      <div className={s.collant}>
        <div className={s.lueur} aria-hidden="true" />
        <Booster3D progres={progres} images={images} categorie={categorie} />
        <div className={s.textes}>
          {TEXTES.map((t, i) => (
            <p key={t.texte} ref={(el) => { textes.current[i] = el; }} className={s.texte}>{t.texte}</p>
          ))}
        </div>
        <div ref={cta} className={s.cta}>
          <Link href="/categories" className={s.bouton}>Voir les 25 boosters</Link>
          <p className={s.note}>Nominés de l&apos;édition 2026, en exemple.</p>
        </div>
        <div className={s.jauge} aria-hidden="true"><span ref={jauge} /></div>
      </div>
    </section>
  );
}
