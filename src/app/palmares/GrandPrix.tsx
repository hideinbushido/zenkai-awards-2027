"use client";

import { useEffect, useRef, useState } from "react";
import Refraction from "@/components/webgl/Refraction";
import s from "./page.module.css";

// Le grand prix 2026 derrière le verre cannelé, qui se dissipe quand on arrive dessus.
export default function GrandPrix({ img, nom, sous, credit }: { img: string; nom: string; sous?: string; credit?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [net, setNet] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: number | undefined;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) t = window.setTimeout(() => setNet(1), 700);
    }, { threshold: 0.45 });
    obs.observe(el);
    return () => { obs.disconnect(); window.clearTimeout(t); };
  }, []);
  return (
    <div ref={ref} className={s.gp}>
      <div className={s.gpImage}><Refraction src={img} net={net} className={s.gpCanvas} /></div>
      <div className={s.gpTexte}>
        <p className={s.gpCat}>Animé de l&apos;année 2026</p>
        <p className={`affiche ${s.gpNom}`}>{nom}</p>
        {sous && <p className={s.gpSous}>{sous}</p>}
        {credit && <p className={s.gpCredit}>{credit}</p>}
        <p className={s.gpPar}>Enveloppe ouverte par Rico, @ricokouame</p>
      </div>
    </div>
  );
}
