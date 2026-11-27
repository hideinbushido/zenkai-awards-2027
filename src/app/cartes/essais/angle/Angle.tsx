"use client";
import { useEffect, useRef, useState } from "react";
import { CARTES_ESSAI, RARETE, videoCarte, type CarteEssai } from "../cartes";
import Fiche from "../Fiche";
import s from "./angle.module.css";

// Essai 3 · d'après Angled Gallery : des panneaux plein écran qui se penchent et se plient en entrant et en sortant.
// Chaque panneau est une carte animée : l'illustration en grand dans le fond, la carte qui joue son animation devant.
const CARTES = CARTES_ESSAI.filter(c => c.video).slice(0, 12);
const ill = (id: string) => `/booster/img/cards/${id}/ill.webp`;

export default function Angle() {
  const panneaux = useRef<(HTMLElement | null)[]>([]);
  const [ouverte, setOuverte] = useState<CarteEssai | null>(null);

  useEffect(() => {
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tic = () => {
      raf = requestAnimationFrame(tic);
      const h = innerHeight;
      for (const p of panneaux.current) {
        if (!p) continue;
        const r = p.getBoundingClientRect();
        if (r.bottom < -h || r.top > 2 * h) continue;
        // t : -1 quand le panneau sort par le haut, 0 au centre, 1 quand il entre par le bas
        const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - h / 2) / h));
        const a = reduit ? 0 : t;
        const c = p.firstElementChild as HTMLElement;
        c.style.transform = `perspective(1400px) rotateX(${a * -22}deg) skewY(${a * -5}deg) scale(${1 - Math.abs(a) * 0.14})`;
        c.style.borderRadius = `${Math.abs(a) * 120}px / ${Math.abs(a) * 60}px`;
        c.style.setProperty("--t", String(a));
        const v = p.querySelector("video");
        if (v) { if (Math.abs(t) < 0.6) { if (v.paused) v.play().catch(() => {}); } else if (!v.paused) v.pause(); }
      }
    };
    tic();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={s.page}>
      <header className={s.entree}>
        <p>Collection Zenkai · {CARTES.length} cartes animées</p>
        <h1>Chaque carte<br /><em>a son instant</em></h1>
        <span>Fais défiler</span>
      </header>
      {CARTES.map((c, i) => (
        <section key={c.id} ref={el => { panneaux.current[i] = el; }} className={s.panneau}>
          <div className={s.cadre} data-rarete={c.rarete}>
            <img className={s.fond} src={ill(c.id)} alt="" loading="lazy" />
            <div className={s.texte}>
              <p>{String(i + 1).padStart(2, "0")} · {c.anime}</p>
              <h2>{c.nom}</h2>
              <span>{RARETE[c.rarete]}</span>
              <button onClick={() => setOuverte(c)}>Voir la carte <i>→</i></button>
            </div>
            <video className={s.carte} src={videoCarte(c.id)} poster={`/booster/img/cards/${c.id}/full.webp`} muted loop playsInline preload="metadata" onClick={() => setOuverte(c)} />
          </div>
        </section>
      ))}
      <footer className={s.sortie}><p>Fin de la sélection</p></footer>
      {ouverte && <Fiche carte={ouverte} onFermer={() => setOuverte(null)} />}
    </div>
  );
}
