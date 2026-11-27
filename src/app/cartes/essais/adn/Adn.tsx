"use client";
import { useEffect, useRef, useState } from "react";
import { CARTES_ESSAI, imgCarte, RARETE, type CarteEssai } from "../cartes";
import Fiche from "../Fiche";
import s from "./adn.module.css";

// Essai 4 · d'après DNA Carousel : deux brins de cartes enroulés en double hélice, avec profondeur,
// flou et échelle. Molette, glisser ou flèches, avec inertie, aimantation et boucle infinie.
// Quand ça va vite, un léger dédoublement rouge et cyan.
const B = 8; // barreaux visibles de chaque côté du centre
const M = (B * 2 + 1) * 2;
const N = CARTES_ESSAI.length;
const TOUR = 0.48; // rotation de l'hélice par barreau (radians)
const mod = (a: number, n: number) => ((a % n) + n) % n;

export default function Adn() {
  const scene = useRef<HTMLElement>(null);
  const cartesEl = useRef<(HTMLButtonElement | null)[]>([]);
  const barreaux = useRef<(HTMLDivElement | null)[]>([]);
  const [actif, setActif] = useState(0);
  const [ouverte, setOuverte] = useState<CarteEssai | null>(null);
  const aller = useRef<(d: number) => void>(() => {});
  const deplRef = useRef(0);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = 0, cible = 0, vit = 0, attente = 0, actifCourant = -1;
    let ecart = 0, R = 0, W = 0;
    const assignes: number[] = Array(M).fill(-1);
    const mesurer = () => {
      W = Math.max(84, Math.min(150, innerWidth * 0.085));
      ecart = W * 0.82;
      R = Math.min(innerHeight * 0.2, 200);
      el.style.setProperty("--w", `${W}px`);
      el.style.setProperty("--r", `${R}px`);
    };
    mesurer();
    addEventListener("resize", mesurer);
    const caler = () => { clearTimeout(attente); attente = window.setTimeout(() => { cible = Math.round(cible); }, 160); };
    aller.current = d => { cible = Math.round(cible) + d; };
    const molette = (e: WheelEvent) => { e.preventDefault(); cible += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.006; caler(); };
    let glisse = false, x0 = 0, vGlisse = 0;
    const bas = (e: PointerEvent) => { glisse = true; x0 = e.clientX; deplRef.current = 0; vGlisse = 0; };
    const bouge = (e: PointerEvent) => {
      if (!glisse) return;
      const d = e.clientX - x0; x0 = e.clientX; deplRef.current += Math.abs(d);
      vGlisse = -d / ecart; cible += vGlisse;
    };
    // inertie : on prolonge le geste puis on s'aimante sur le barreau le plus proche
    const haut = () => { if (!glisse) return; glisse = false; cible = Math.round(cible + vGlisse * 8); };
    const touche = (e: KeyboardEvent) => { if (e.key === "ArrowRight") aller.current(1); if (e.key === "ArrowLeft") aller.current(-1); };
    el.addEventListener("wheel", molette, { passive: false });
    el.addEventListener("pointerdown", bas);
    addEventListener("pointermove", bouge);
    addEventListener("pointerup", haut);
    addEventListener("keydown", touche);

    let raf = 0;
    const tic = () => {
      raf = requestAnimationFrame(tic);
      const avant = p;
      p += (cible - p) * (reduit ? 1 : 0.075);
      vit += ((p - avant) - vit) * 0.3;
      const rgb = reduit ? 0 : Math.min(6, Math.abs(vit) * 60);
      el.style.setProperty("--rgb", `${rgb}px`);
      const L = B * 2 + 1;
      for (let r = 0; r < L; r++) {
        const a = r + L * Math.ceil((p - B - r) / L);
        const x = (a - p) * ecart;
        const th = a * TOUR - p * 0.15;
        const bar = barreaux.current[r];
        if (bar) {
          bar.style.transform = `translateX(${x}px) rotateX(${th}rad)`;
          bar.style.opacity = String(Math.max(0, 1 - Math.abs(a - p) / (B + 0.5)) * 0.5);
        }
        for (let brin = 0; brin < 2; brin++) {
          const k = r * 2 + brin;
          const b = cartesEl.current[k];
          if (!b) continue;
          const t = th + brin * Math.PI;
          const y = Math.cos(t) * R, z = Math.sin(t) * R;
          const carte = mod(a * 2 + brin, N);
          if (assignes[k] !== carte) {
            assignes[k] = carte;
            b.dataset.carte = String(carte);
            (b.firstElementChild as HTMLImageElement).src = imgCarte(CARTES_ESSAI[carte].id);
          }
          const prof = (z + R) / (2 * R); // 0 au fond, 1 devant
          const bord = Math.max(0, 1 - Math.abs(a - p) / (B + 0.5));
          b.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${-(a - p) * 4}deg)`;
          b.style.filter = `blur(${(1 - prof) * 3.5}px) brightness(${0.45 + prof * 0.55})`;
          b.style.opacity = String(Math.min(1, bord * 1.6));
          b.style.zIndex = String(Math.round(prof * 100));
          if (Math.abs(a - p) < 0.5 && prof > 0.5) b.dataset.actif = ""; else delete b.dataset.actif;
        }
      }
      // carte active : celle de devant, au plus près du centre
      const a0 = Math.round(p);
      const t0 = a0 * TOUR - p * 0.15;
      const ac = mod(a0 * 2 + (Math.sin(t0) >= 0 ? 0 : 1), N);
      if (ac !== actifCourant) { actifCourant = ac; setActif(ac); }
    };
    tic();
    return () => {
      cancelAnimationFrame(raf); clearTimeout(attente);
      removeEventListener("resize", mesurer);
      el.removeEventListener("wheel", molette); el.removeEventListener("pointerdown", bas);
      removeEventListener("pointermove", bouge); removeEventListener("pointerup", haut); removeEventListener("keydown", touche);
    };
  }, []);

  const carte = CARTES_ESSAI[actif];
  const clic = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (deplRef.current > 6) return;
    setOuverte(CARTES_ESSAI[Number(e.currentTarget.dataset.carte)]);
  };

  return (
    <section ref={scene} className={s.scene} data-lenis-prevent>
      <div className={s.helice}>
        {Array.from({ length: B * 2 + 1 }, (_, r) => <div key={"b" + r} ref={d => { barreaux.current[r] = d; }} className={s.barreau} />)}
        {Array.from({ length: M }, (_, k) => (
          <button key={k} ref={b => { cartesEl.current[k] = b; }} className={s.carte} onClick={clic} aria-label="Carte">
            <img alt="" draggable={false} />
          </button>
        ))}
      </div>
      <header className={s.tete}>
        <p>Double hélice · {N} cartes</p>
        <h1>ADN <em>Zenkai</em></h1>
      </header>
      <div className={s.actif} key={carte.id}>
        <span>{RARETE[carte.rarete]}</span>
        <strong>{carte.nom}</strong>
        <small>{carte.anime}</small>
      </div>
      <p className={s.indice}>Molette, glisser ou ← →</p>
      {ouverte && <Fiche carte={ouverte} onFermer={() => setOuverte(null)} />}
    </section>
  );
}
