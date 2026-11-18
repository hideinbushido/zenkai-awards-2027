"use client";

import Link from "next/link";
import { useRef } from "react";
import CarteHolo from "@/components/CarteHolo";
import FondShader from "@/components/webgl/FondShader";
import { EDITION, NOMINES_ANNEE } from "@/data/edition";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import s from "./Hero.module.css";

// Premier écran : le nom géant, une carte holo plantée dedans, un fond irisé vivant.
export default function Hero() {
  const racine = useRef<HTMLElement>(null);

  useGSAP(() => {
    const q = gsap.utils.selector(racine);
    const fige = reduit();

    if (fige) return;

    // Parallaxe : le nom recule, la carte avance
    const nomX = gsap.quickTo(q(`.${s.nom}`), "x", { duration: 1.2, ease: "power3" });
    const carteX = gsap.quickTo(q(`.${s.carte}`), "x", { duration: 1, ease: "power3" });
    const carteY = gsap.quickTo(q(`.${s.carte}`), "y", { duration: 1, ease: "power3" });
    const bouge = (e: PointerEvent) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      nomX(x * -18); carteX(x * 34); carteY(y * 18);
    };
    window.addEventListener("pointermove", bouge, { passive: true });

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(q(`.${s.revele}`), { clipPath: "inset(100% 0 0 0)", y: 80, duration: 1.6 }, 0.1)
      .from(q(`.${s.carte}`), { yPercent: 40, rotate: -10, opacity: 0, duration: 1.6 }, 0.35)
      .from(q(`.${s.pile} li`), { yPercent: 100, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.6)
      .from(q(`.${s.bas} > *`), { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.8)
      .from(q(`.${s.coin}`), { opacity: 0, duration: 1.2 }, 0.9);

    return () => window.removeEventListener("pointermove", bouge);
  }, { scope: racine });

  const vedette = NOMINES_ANNEE[0];

  return (
    <section ref={racine} className={s.hero} aria-labelledby="hero-titre">
      <FondShader className={s.fond} />

      <ul className={s.pile} aria-label="L'édition en bref">
        <li>25 boosters</li>
        <li>1 voix par fan</li>
        <li>Live en mai</li>
      </ul>
      <p className={s.coin}>
        Les récompenses anime votées par la communauté. Chaque catégorie est un booster, ses nominés sont les cartes.
      </p>

      <h1 id="hero-titre" className={s.cache}>Zenkai Anime Awards {EDITION.annee}</h1>

      <div className={s.scene} aria-hidden="true">
        {/* avoid-ai-design-ignore: C6 — lettres en métal chromé, matière du thème Holo */}
        <div className={`${s.nom} ${s.derriere}`}><span className={s.revele}><span className={s.lettres}>ZENKAI</span></span></div>
        <div className={s.carte}>
          <CarteHolo img={vedette.img} nom={vedette.nom} numero="025 / 025" rang="Secrète" taille="grande" priorite sansBandeau />
        </div>
        <div className={`${s.nom} ${s.devant}`}><span className={s.revele}><span className={s.lettres}>ZENKAI</span></span></div>
      </div>

      <div className={s.bas}>
        <p className={s.sousTitre}>Anime Awards {EDITION.annee} · Édition 2</p>
        <div className={s.actions}>
          <Link href="#rappel" className={s.boutonChrome}>Voter</Link>
          <Link href="/categories" className={s.boutonFantome}>Voir les boosters</Link>
        </div>
        <p className={s.dates}>Votes {EDITION.votes} · Live {EDITION.live}</p>
      </div>
    </section>
  );
}
