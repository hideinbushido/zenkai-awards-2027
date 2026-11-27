"use client";
import { useEffect, useRef, useState } from "react";
import { CARTES_ESSAI, imgCarte, RARETE, videoCarte, type CarteEssai } from "../cartes";
import Fiche from "../Fiche";
import s from "./tunnel.module.css";

// Essai 2 · d'après Folioir : on est au centre d'un cylindre, les cartes tapissent la paroi.
// La carte en face est la carte active : son nom s'affiche en très grand, son animation se lance.
// Molette, glisser ou flèches ; clic sur la carte en face pour l'ouvrir.
const K = 12; // emplacements visibles sur la paroi
const PAS = 360 / K;
const N = CARTES_ESSAI.length;
const mod = (a: number, n: number) => ((a % n) + n) % n;

export default function Tunnel() {
  const scene = useRef<HTMLElement>(null);
  const scenette = useRef<HTMLDivElement>(null);
  const panneaux = useRef<(HTMLButtonElement | null)[]>([]);
  const [actif, setActif] = useState(0);
  const [ouverte, setOuverte] = useState<CarteEssai | null>(null);
  const aller = useRef<(d: number) => void>(() => {});

  useEffect(() => {
    const el = scene.current, st = scenette.current;
    if (!el || !st) return;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = 0, cible = 0, actifCourant = -1, attente = 0;
    let W = 0, R = 0;
    const assignes: number[] = Array(K).fill(-999);

    const mesurer = () => {
      const h = Math.min(innerHeight * 0.54, innerWidth * 0.8);
      W = h / (838 / 600);
      R = (W * 1.08) / (2 * Math.tan((PAS * Math.PI) / 360));
      const P = R * 0.95;
      el.style.perspective = `${P}px`;
      st.style.setProperty("--w", `${W}px`);
      st.style.transform = `translateZ(${P - R * 0.22}px)`;
    };
    mesurer();
    addEventListener("resize", mesurer);

    const caler = () => { clearTimeout(attente); attente = window.setTimeout(() => { cible = Math.round(cible); }, 140); };
    aller.current = (d: number) => { cible = Math.round(cible) + d; };

    const molette = (e: WheelEvent) => {
      e.preventDefault();
      cible += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.0035;
      caler();
    };
    let glisse = false, x0 = 0, depl = 0;
    const bas = (e: PointerEvent) => { glisse = true; x0 = e.clientX; depl = 0; };
    const bouge = (e: PointerEvent) => {
      if (!glisse) return;
      const d = e.clientX - x0; x0 = e.clientX; depl += Math.abs(d);
      cible -= d / (W * 1.1);
    };
    const haut = () => { if (glisse) { glisse = false; cible = Math.round(cible); } };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") aller.current(1);
      if (e.key === "ArrowLeft") aller.current(-1);
    };
    el.addEventListener("wheel", molette, { passive: false });
    el.addEventListener("pointerdown", bas);
    addEventListener("pointermove", bouge);
    addEventListener("pointerup", haut);
    addEventListener("keydown", touche);
    (el as HTMLElement & { _depl?: () => number })._depl = () => depl;

    let raf = 0;
    const tic = () => {
      raf = requestAnimationFrame(tic);
      p += (cible - p) * (reduit ? 1 : 0.085);
      for (let j = 0; j < K; j++) {
        const b = panneaux.current[j];
        if (!b) continue;
        const a = j + K * Math.ceil((p - K / 2 - j) / K);
        const ang = (a - p) * PAS;
        const carte = mod(a, N);
        if (assignes[j] !== carte) {
          assignes[j] = carte;
          b.dataset.carte = String(carte);
          (b.firstElementChild as HTMLImageElement).src = imgCarte(CARTES_ESSAI[carte].id);
        }
        b.style.transform = `rotateY(${ang}deg) translateZ(${-R}px)`;
        b.style.visibility = Math.abs(ang) > 112 ? "hidden" : "visible";
        // les cartes de côté s'assombrissent, celle d'en face reste pleine
        b.style.filter = `brightness(${1 - Math.min(0.55, Math.abs(ang) / 160)})`;
      }
      const ac = mod(Math.round(p), N);
      if (ac !== actifCourant) { actifCourant = ac; setActif(ac); }
    };
    tic();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(attente);
      removeEventListener("resize", mesurer);
      el.removeEventListener("wheel", molette);
      el.removeEventListener("pointerdown", bas);
      removeEventListener("pointermove", bouge);
      removeEventListener("pointerup", haut);
      removeEventListener("keydown", touche);
    };
  }, []);

  // l'animation de rareté se glisse dans la carte d'en face, quand elle existe
  useEffect(() => {
    const c = CARTES_ESSAI[actif];
    if (!c.video) return;
    const t = window.setTimeout(() => {
      const b = panneaux.current.find(x => x?.dataset.carte === String(actif));
      if (!b) return;
      const v = document.createElement("video");
      v.className = s.video; v.src = videoCarte(c.id); v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute("aria-hidden", "true");
      v.addEventListener("playing", () => v.classList.add(s.joue), { once: true });
      b.appendChild(v);
      v.play().catch(() => {});
      cleanup = () => v.remove();
    }, 350);
    let cleanup = () => {};
    return () => { clearTimeout(t); cleanup(); };
  }, [actif]);

  const carte = CARTES_ESSAI[actif];
  const clic = (e: React.MouseEvent<HTMLButtonElement>) => {
    const depl = (scene.current as HTMLElement & { _depl?: () => number })?._depl?.() ?? 0;
    if (depl > 6) return;
    const i = Number(e.currentTarget.dataset.carte);
    if (i === actif) setOuverte(CARTES_ESSAI[i]);
    else {
      const d = mod(i - actif, N);
      aller.current(d > N / 2 ? d - N : d);
    }
  };

  return (
    <section ref={scene} className={s.scene} data-lenis-prevent aria-roledescription="carrousel">
      <div ref={scenette} className={s.scenette}>
        {Array.from({ length: K }, (_, j) => (
          <button key={j} ref={b => { panneaux.current[j] = b; }} className={s.panneau} onClick={clic} aria-label="Carte">
            <img alt="" draggable={false} />
          </button>
        ))}
      </div>
      <div className={s.voile} aria-hidden />

      <div className={s.compteur}>
        <span className={s.logo}>Zenkai</span>
        <span className={s.pilule}>{carte.anime} · {String(actif + 1).padStart(2, "0")} / {N}</span>
      </div>


      <div className={s.legende} key={carte.id}>
        <p>{RARETE[carte.rarete]} · {carte.anime}</p>
        <h1>{carte.nom.split(" ").map((m, i) => <span key={i} style={{ animationDelay: `${i * 60}ms` }}>{m}</span>)}</h1>
        <button onClick={() => setOuverte(carte)}>Voir la carte</button>
      </div>
      <p className={s.indice}>Molette, glisser ou ← →</p>
      {ouverte && <Fiche carte={ouverte} onFermer={() => setOuverte(null)} />}
    </section>
  );
}
