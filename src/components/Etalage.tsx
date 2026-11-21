"use client";

import Booster2D from "@/components/Booster2D";
import Link from "next/link";
import { useRef } from "react";
import { EDITION } from "@/data/edition";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import { DUREE, EASE } from "@/lib/motion";
import s from "./Etalage.module.css";

export const FAMILLES_BOOSTERS = [
  { id: "series", nom: "Séries", nb: 11 },
  { id: "personnages", nom: "Personnages", nb: 7 },
  { id: "grand-prix", nom: "Grand prix", nb: 1 },
  { id: "musique", nom: "Musique", nb: 3 },
  { id: "technique", nom: "Technique", nb: 3 },
] as const;

// Les cinq familles de boosters, posées en éventail ; elles glissent par-dessus le nom.
export default function Etalage() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (reduit()) return;
    const q = gsap.utils.selector(ref);
    gsap.from(q(`.${s.paquet}`), {
      y: 180, rotate: (i: number) => (i - 2) * 9, autoAlpha: 0, duration: DUREE.longue, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
    });
    gsap.from(q(`.${s.texte} > *`), {
      yPercent: 40, autoAlpha: 0, duration: DUREE.normale, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: ref.current, start: "top 60%", once: true },
    });
    // Parallaxe au pointeur, écrite directement sur chaque paquet
    const paquets = q(`.${s.flotte}`);
    const tos = paquets.map((p, i) => ({
      x: gsap.quickTo(p, "x", { duration: 1.2, ease: "power3" }),
      y: gsap.quickTo(p, "y", { duration: 1.2, ease: "power3" }),
      f: (i - 2) * 0.35 + (i === 2 ? 1.3 : 0.8),
    }));
    const bouge = (e: PointerEvent) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      tos.forEach((t) => { t.x(x * 26 * t.f); t.y(y * 18 * t.f); });
    };
    window.addEventListener("pointermove", bouge, { passive: true });
    return () => window.removeEventListener("pointermove", bouge);
  }, { scope: ref });

  return (
    <section ref={ref} className={s.etalage} aria-labelledby="etalage-titre">
      <div className={s.scene}>
        {FAMILLES_BOOSTERS.map((f, i) => (
          <Link key={f.id} href={`/categories#${f.id}`} className={s.paquet} style={{ "--i": i - 2 } as React.CSSProperties} aria-label={`${f.nom} : ${f.nb} booster${f.nb > 1 ? "s" : ""}`}>
            <span className={s.flotte}>
              <Booster2D famille={f.id} titre={f.nom} sousTitre={`${f.nb} booster${f.nb > 1 ? "s" : ""}`} />
            </span>
          </Link>
        ))}
      </div>
      <div className={s.texte}>
        <h2 id="etalage-titre" className={`affiche ${s.titre}`}>25 boosters à ouvrir</h2>
        <p className={s.chapo}>
          Chaque catégorie est un booster, ses nominés sont les cartes. Ta collection devient ton vote en {EDITION.votes.toLowerCase()}.
        </p>
        <div className={s.actions}>
          <Link href="/categories" className="bouton">Ouvrir les boosters</Link>
          <Link href="/collection" className="bouton-clair">Ma collection</Link>
        </div>
      </div>
      {/* La mécanique en trois temps, sous l'étagère */}
      <ol className={s.temps}>
        <li><strong className="affiche">Ouvre</strong><span>un booster par catégorie</span></li>
        <li><strong className="affiche">Garde</strong><span>une carte, ou passe</span></li>
        <li><strong className="affiche">Révélé</strong><span>en live sur TikTok en mai</span></li>
      </ol>
    </section>
  );
}
