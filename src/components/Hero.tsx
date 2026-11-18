"use client";

import Link from "next/link";
import { useRef } from "react";
import CarteHolo from "@/components/CarteHolo";
import { EDITION, NOMINES_ANNEE } from "@/data/edition";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import { DUREE, EASE } from "@/lib/motion";
import s from "./Hero.module.css";

const LETTRES = "ZENKAI".split("");

function Nom({ classe }: { classe: string }) {
  return (
    <div className={`${s.nom} ${classe}`}>
      {LETTRES.map((l, i) => (
        <span key={i} className={s.masque}>
          {/* avoid-ai-design-ignore: C6 — chaque lettre est en métal chromé irisé, matière du thème Holo */}
          <span className={s.lettre} data-i={i}>{l}</span>
        </span>
      ))}
    </div>
  );
}

// Premier écran : le nom géant, une carte plantée dedans, un fond irisé vivant.
// Il reste collé pendant que le manifeste glisse par-dessus.
export default function Hero() {
  const zone = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reduit()) return;
    const q = gsap.utils.selector(zone);
    const lettres = q(`.${s.lettre}`);

    // Entrée : lettres masquées qui montent une à une, puis la carte, puis le reste
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.from(lettres, { yPercent: 108, duration: DUREE.longue, stagger: { each: 0.06, from: "center" } }, 0.15)
      .from(q(`.${s.carte}`), { y: 160, scale: 0.86, rotate: -6, autoAlpha: 0, duration: DUREE.longue }, 0.45)
      .from(q(`.${s.pile} span`), { yPercent: 105, duration: DUREE.normale, stagger: 0.07 }, 0.75)
      .from(q(`.${s.bas} > *`), { y: 18, opacity: 0, duration: DUREE.normale, stagger: 0.07 }, 0.95)
      .from(q(`.${s.coin}`), { opacity: 0, duration: DUREE.normale }, 1.05);

    // Parallaxe au pointeur : le nom recule, la carte avance (écriture directe, pas d'état)
    const nomX = gsap.quickTo(q(`.${s.couchesNom}`), "x", { duration: 1.4, ease: "power3" });
    const carteX = gsap.quickTo(q(`.${s.carte}`), "x", { duration: 1.1, ease: "power3" });
    const carteY = gsap.quickTo(q(`.${s.carte}`), "y", { duration: 1.1, ease: "power3" });
    const bouge = (e: PointerEvent) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      nomX(x * -16); carteX(x * 30); carteY(y * 16);
    };
    window.addEventListener("pointermove", bouge, { passive: true });

    // Sortie au scroll : les lettres s'écartent, la carte monte, le reste s'efface
    const sortie = gsap.timeline({
      scrollTrigger: { trigger: zone.current, start: "top top", end: "bottom bottom", scrub: 0.4 },
      defaults: { ease: "none" },
    });
    lettres.forEach((el) => {
      const i = Number((el as HTMLElement).dataset.i) - 2.5;
      sortie.to(el, { xPercent: i * 26, yPercent: -10 - Math.abs(i) * 6 }, 0);
    });
    sortie.to(q(`.${s.carte}`), { yPercent: -22, rotate: -5, scale: 1.06 }, 0)
      .to(q(`.${s.pile}, .${s.coin}, .${s.bas}`), { opacity: 0 }, 0)
      .to(q(`.${s.scene}`), { opacity: 0 }, 0.25);

    return () => window.removeEventListener("pointermove", bouge);
  }, { scope: zone });

  const vedette = NOMINES_ANNEE[1];

  return (
    <div ref={zone} className={s.zone}>
      <section className={s.hero} aria-labelledby="hero-titre">

        <p className={s.pile}>
          <span>25 catégories</span>
          <span>1 voix par fan</span>
          <span>Live en mai</span>
        </p>
        <p className={s.coin}>
          Les récompenses anime votées par la communauté. Deuxième édition, pour les animés diffusés en 2026.
        </p>

        <h1 id="hero-titre" className={s.cache}>Zenkai Anime Awards {EDITION.annee}</h1>

        <div className={s.scene} aria-hidden="true">
          <div className={s.couchesNom}><Nom classe={s.derriere} /></div>
          <div className={s.carte}>
            <CarteHolo img={vedette.img} nom={vedette.nom} numero="025 / 025" taille="grande" priorite sansBandeau />
          </div>
        </div>

        <div className={s.bas}>
          <p className={s.sousTitre}>Anime Awards {EDITION.annee}</p>
          <Link href="/categories" className="bouton">Ouvrir les boosters</Link>
          <p className={s.dates}>Votes {EDITION.votes}<br />Live {EDITION.live}</p>
        </div>

      </section>
    </div>
  );
}
