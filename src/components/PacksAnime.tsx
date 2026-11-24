"use client";

import Link from "next/link";
import { useRef } from "react";
import Decode from "./Decode";
import { JETON } from "@/lib/jetons";
import { gsap, useGSAP } from "@/lib/gsap";
import s from "./PacksAnime.module.css";

export const PACKS = [
  { id: "bleach", nom: "Bleach", img: "/visuels/packs/bleach.webp" },
  { id: "black-clover", nom: "Black Clover", img: "/visuels/packs/black-clover.webp" },
  { id: "multi", nom: "Toutes les séries", img: "/visuels/packs/multi.webp" },
  { id: "fire-force", nom: "Fire Force", img: "/visuels/packs/fire-force.webp" },
  { id: "hells-paradise", nom: "Hell's Paradise", img: "/visuels/packs/hells-paradise.webp" },
  { id: "marriagetoxin", nom: "Marriagetoxin", img: "/visuels/packs/marriagetoxin.webp" },
];

// Les boosters : empilés au centre, ils s'ouvrent en éventail au défilement (écran fixé).
// Sur téléphone, une rangée qu'on fait glisser au doigt.
export default function PacksAnime() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 761px) and (prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(ref);
      const paquets = q(`.${s.paquet}`);
      const n = paquets.length, mil = (n - 1) / 2;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      tl.fromTo(paquets,
        { xPercent: (i: number) => (i - mil) * 6, yPercent: 38, rotate: (i: number) => (i - mil) * 3, scale: 0.86 },
        {
          xPercent: (i: number) => (i - mil) * 108, yPercent: (i: number) => Math.abs(i - mil) ** 2 * 3,
          rotate: (i: number) => (i - mil) * 5, scale: 1, ease: "power2.inOut", duration: 1,
        }, 0)
        .fromTo(q(`.${s.legende}`), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.3 }, 0.7)
        .fromTo(q(`.${s.cta}`), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.75);
    });
    return () => mm.revert();
  }, { scope: ref });

  return (
    <section ref={ref} className={s.section} aria-labelledby="packs-titre">
      <div className={s.scene}>
        <video className={s.video} src="/booster/bg/defaut_1.mp4" poster="/booster/bg/defaut_1.jpg" autoPlay muted loop playsInline preload="none" aria-hidden="true" />
        <div className={s.voile} />
        <header className={s.tete}>
          <p className={s.pile}><Decode quand="vue" texte="HOLO" /><Decode quand="vue" texte="BOOSTERS" delai={0.1} /><Decode quand="vue" texte="ÉDITION 2027" delai={0.2} /></p>
          <h2 id="packs-titre" className={s.titre}><em>Ouvre ton</em> <strong>booster</strong></h2>
        </header>
        <ul className={s.rangee}>
          {PACKS.map((p) => (
            <li key={p.id} className={s.paquet}>
              <Link href="/booster" className={s.lien} aria-label={`Booster ${p.nom}`}>
                <img src={p.img} alt="" width={692} height={1200} loading="lazy" decoding="async" />
              </Link>
              <span className={s.legende}>{p.nom}</span>
            </li>
          ))}
        </ul>
        <div className={s.cta}>
          <p>Un booster offert chaque jour. Les suivants s&apos;ouvrent avec des {JETON.plusieurs}, gagnés en missions.</p>
          <div className={s.actions}>
            <Link href="/booster" className={s.principal}>Ouvrir mon booster du jour</Link>
            <Link href="/missions" className={s.second}>Gagner des {JETON.plusieurs}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
