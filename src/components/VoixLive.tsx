"use client";

import { useRef } from "react";
import CarteHolo from "@/components/CarteHolo";
import { EDITION, PRESENTATEURS_LIVE } from "@/data/edition";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import { DECALAGE, DUREE, EASE } from "@/lib/motion";
import s from "./VoixLive.module.css";

// Les trois présentateurs du live, en cartes rares posées en éventail.
export default function VoixLive({ titreNiveau = 2 }: { titreNiveau?: 2 | 3 }) {
  const ref = useRef<HTMLElement>(null);
  const Titre = `h${titreNiveau}` as const;

  useGSAP(() => {
    if (reduit()) return;
    const q = gsap.utils.selector(ref);
    gsap.from(q(`.${s.carte}`), {
      y: 140, rotate: 0, autoAlpha: 0, duration: DUREE.longue, ease: EASE, stagger: 0.1,
      scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
    });
    gsap.from(q(`.${s.tete} > *`), {
      yPercent: 30, autoAlpha: 0, duration: DUREE.normale, ease: EASE, stagger: DECALAGE * 2,
      scrollTrigger: { trigger: ref.current, start: "top 75%", once: true },
    });
  }, { scope: ref });

  return (
    <section ref={ref} className={s.section} aria-labelledby="voix-live-titre">
      <div className={s.tete} data-entree>
        <Titre id="voix-live-titre" className={`affiche ${s.titre}`}>Les voix du live</Titre>
        <p className={s.texte}>
          Pape, Mr. Hunter et Braizanime animent la cérémonie, en direct sur le TikTok de @ricokouame. Rendez-vous en {EDITION.live.toLowerCase()}.
        </p>
      </div>
      <ul className={s.cartes}>
        {PRESENTATEURS_LIVE.map((p, i) => (
          <li key={p.nom} className={s.carte} style={{ "--i": i - 1 } as React.CSSProperties}>
            <a href={p.lien} target="_blank" rel="noopener" className={s.lien} aria-label={`${p.nom}, ${p.handle} sur TikTok`}>
              <CarteHolo img={p.photo} nom={p.nom} detail={p.handle} numero={`0${i + 1} / 03`} taille="grande" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
