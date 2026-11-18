"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Refraction from "@/components/webgl/Refraction";
import { EDITION } from "@/data/edition";
import { ANIME_DE_L_ANNEE } from "@/data/palmares2026";
import { gsap, reduit, useGSAP } from "@/lib/gsap";
import { DECALAGE, DUREE, EASE } from "@/lib/motion";
import s from "./Tenant.module.css";

// Le tenant du titre : le grand prix 2026 derrière un verre cannelé qui se dissipe quand on arrive.
export default function Tenant() {
  const ref = useRef<HTMLElement>(null);
  const [net, setNet] = useState(0);
  const { winner, presenter } = ANIME_DE_L_ANNEE;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: number | undefined;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) t = window.setTimeout(() => setNet(1), 500);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => { obs.disconnect(); window.clearTimeout(t); };
  }, []);

  useGSAP(() => {
    if (reduit()) return;
    const q = gsap.utils.selector(ref);
    gsap.from(q(`.${s.panneau}`), {
      yPercent: 8, scale: 0.96, autoAlpha: 0, duration: DUREE.longue, ease: EASE,
      scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
    });
    gsap.from(q(`.${s.texte} > *`), {
      yPercent: 30, autoAlpha: 0, duration: DUREE.normale, ease: EASE, stagger: DECALAGE,
      scrollTrigger: { trigger: ref.current, start: "top 55%", once: true },
    });
  }, { scope: ref });

  return (
    <section ref={ref} className={s.section} aria-labelledby="tenant-titre">
      <div className={s.panneau}>
        <div className={s.image}>
          <Refraction src={winner.img!} net={net} className={s.canvas} />
          <span className={s.sceau}>Grand prix 2026</span>
        </div>
        <div className={s.texte}>
          <p className={s.etiquette}>Tenant du titre · Édition Gold</p>
          <h2 id="tenant-titre" className={`affiche ${s.nom}`}>{winner.name}</h2>
          <p className={s.sous}>{winner.sub}, élu animé de l&apos;année par la communauté.</p>
          <p className={s.credit}>{winner.credit} · enveloppe ouverte par {presenter.name} en direct</p>
          <p className={s.question}>Qui lui succède en mai&nbsp;?</p>
          <div className={s.actions}>
            <Link href="/palmares" className={s.bouton}>Revoir le palmarès 2026</Link>
            <a href={EDITION.resultats2026} className={s.lien} target="_blank" rel="noopener">Les résultats sur le site 2026</a>
          </div>
        </div>
      </div>
    </section>
  );
}
