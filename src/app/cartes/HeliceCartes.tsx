"use client";
// « Ma collection » sur ordinateur : la double hélice de l'essai ADN, aplatie pour circuler facilement.
// Deux rangées de cartes face à l'écran qui ondulent doucement l'une autour de l'autre (peu de profondeur,
// pas de flou) ; molette, glisser ou flèches avec élan ; survol = la carte se soulève et lance son animation ;
// clic = la fiche s'ouvre. Seules ~40 cartes existent dans la page à la fois, même avec 700 cartes.
import { useEffect, useRef, useState } from "react";
import { variantesAnimees } from "@/data/variantes";
import { LABEL, type Carte } from "./Coffre";
import s from "./helice.module.css";

const B = 10; // colonnes visibles de chaque côté du centre
const L = B * 2 + 1;
const mod = (a: number, n: number) => ((a % n) + n) % n;

type Props = { cartes: Carte[]; miennes: Record<string, number>; onOuvrir: (id: string) => void };

export default function HeliceCartes({ cartes, miennes, onOuvrir }: Props) {
  const scene = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLButtonElement | null)[]>([]);
  const etat = useRef({ p: 0, cible: 0 });
  const [centre, setCentre] = useState(0);
  const [survol, setSurvol] = useState<string | null>(null);
  const depl = useRef(0);
  const N = cartes.length;
  const colonnes = Math.ceil(N / 2);

  // revient au début quand les filtres changent la liste
  useEffect(() => { etat.current.p = etat.current.cible = -1; }, [cartes]); // -1 : recalé sur le début au prochain calcul

  useEffect(() => {
    const el = scene.current;
    if (!el || N === 0) return;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const e = etat.current;
    let W = 0, Hc = 0, ecart = 0, vGlisse = 0, attente = 0, centreCourant = -1, raf = 0, mini = 0, maxi = 0;
    const mesurer = () => {
      // deux rangées de cartes entières dans la hauteur, plus la petite ondulation
      W = Math.max(130, Math.min(230, (el.clientHeight - 80) / 3.05));
      Hc = W * (838 / 600);
      ecart = W * 1.1;
      el.style.setProperty("--w", `${W}px`);
      // la première colonne commence au bord gauche, la dernière finit au bord droit
      const demi = Math.max(0, (el.clientWidth / 2) / ecart - 0.75);
      mini = Math.min(demi, (colonnes - 1) / 2);
      maxi = Math.max(colonnes - 1 - demi, mini);
      if (e.cible < mini) e.p = e.cible = mini;
    };
    mesurer();
    const ro = new ResizeObserver(mesurer); ro.observe(el);
    const borne = (v: number) => Math.max(mini, Math.min(maxi, v));
    const caler = () => { clearTimeout(attente); attente = window.setTimeout(() => { e.cible = borne(Math.round(e.cible)); }, 180); };
    const molette = (ev: WheelEvent) => {
      const d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY;
      // en haut ou en bas de la liste, la molette verticale rend la main à la page
      if ((d < 0 && e.cible <= mini + 0.01) || (d > 0 && e.cible >= maxi - 0.01)) return;
      ev.preventDefault(); e.cible = borne(e.cible + d * 0.006); caler();
    };
    let glisse = false, x0 = 0;
    const bas = (ev: PointerEvent) => { glisse = true; x0 = ev.clientX; depl.current = 0; vGlisse = 0; };
    const bouge = (ev: PointerEvent) => {
      if (!glisse) return;
      const d = ev.clientX - x0; x0 = ev.clientX; depl.current += Math.abs(d);
      vGlisse = -d / ecart; e.cible = borne(e.cible + vGlisse);
    };
    const haut = () => { if (!glisse) return; glisse = false; e.cible = borne(Math.round(e.cible + vGlisse * 6)); };
    const touche = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.closest("input, select, textarea, dialog")) return;
      if (ev.key === "ArrowRight") e.cible = borne(Math.round(e.cible) + 1);
      if (ev.key === "ArrowLeft") e.cible = borne(Math.round(e.cible) - 1);
    };
    el.addEventListener("wheel", molette, { passive: false });
    el.addEventListener("pointerdown", bas);
    addEventListener("pointermove", bouge);
    addEventListener("pointerup", haut);
    addEventListener("keydown", touche);

    const tic = () => {
      raf = requestAnimationFrame(tic);
      if (e.cible < mini) e.p = e.cible = mini;
      e.p += (e.cible - e.p) * (reduit ? 1 : 0.09);
      for (let r = 0; r < L; r++) {
        const a = r + L * Math.ceil((Math.round(e.p) - B - r) / L); // même calcul que le rendu React
        const x = (a - e.p) * ecart;
        const th = a * 0.42 - e.p * 0.12;
        for (let brin = 0; brin < 2; brin++) {
          const b = els.current[r * 2 + brin];
          if (!b) continue;
          const i = a * 2 + brin;
          if (a < 0 || a >= colonnes || i >= N) { b.style.visibility = "hidden"; continue; }
          b.style.visibility = "visible";
          const t = th + brin * Math.PI;
          // hélice aplatie : l'écart vertical reste grand, la profondeur faible, aucune rotation des cartes
          const y = (brin === 0 ? -1 : 1) * Hc * 0.55 + Math.cos(t) * Hc * 0.05;
          const z = Math.sin(t) * W * 0.2;
          const prof = (Math.sin(t) + 1) / 2;
          const bord = Math.max(0, 1 - Math.abs(a - e.p) / (B + 0.5));
          b.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
          b.style.opacity = String(Math.min(1, bord * 2.2));
          b.style.setProperty("--lum", String(0.82 + prof * 0.18));
          b.style.zIndex = String(10 + Math.round(prof * 10));
        }
      }
      const c = Math.round(e.p);
      if (c !== centreCourant) { centreCourant = c; setCentre(c); }
    };
    tic();
    return () => {
      cancelAnimationFrame(raf); clearTimeout(attente); ro.disconnect();
      el.removeEventListener("wheel", molette); el.removeEventListener("pointerdown", bas);
      removeEventListener("pointermove", bouge); removeEventListener("pointerup", haut); removeEventListener("keydown", touche);
    };
  }, [N, colonnes]);

  // les emplacements changent de carte au fil du défilement : on rend selon la colonne affichée
  const slots = Array.from({ length: L * 2 }, (_, k) => {
    const r = Math.floor(k / 2), brin = k % 2;
    const a = r + L * Math.ceil((centre - B - r) / L);
    return a * 2 + brin;
  });

  if (N === 0) return null;
  return (
    <div ref={scene} className={s.scene} data-lenis-prevent="" aria-roledescription="carrousel" aria-label="Ma collection en double hélice">
      <div className={s.helice}>
        {slots.map((i, k) => {
          const c = cartes[mod(i, N)];
          const visible = i >= 0 && i < N;
          const q = visible ? miennes[c.id] : 0;
          const anime = q && variantesAnimees.has(c.id);
          return (
            <button key={k} ref={b => { els.current[k] = b; }} type="button" className={s.carte} data-r={c.rarete}
              data-manque={!q || undefined} tabIndex={visible ? 0 : -1}
              aria-label={q ? `${c.nom}, ${LABEL[c.rarete]}${q > 1 ? `, ${q} exemplaires` : ""}` : `Carte manquante, ${c.anime}`}
              onPointerEnter={() => q && setSurvol(c.id)} onPointerLeave={() => setSurvol(x => (x === c.id ? null : x))}
              onClick={() => { if (depl.current < 6 && q) onOuvrir(c.id); }}>
              {q ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/booster/img/cards/${c.id}/full.webp`} alt="" draggable={false} loading="lazy" decoding="async" />
                  {anime && survol === c.id && <video src={`/booster/variantes/${c.id}.mp4`} autoPlay muted loop playsInline aria-hidden />}
                  {q > 1 && <span className={s.qte}>×{q}</span>}
                </>
              ) : (
                <span className={s.manque}><b>?</b><small>{c.anime}</small><em>{LABEL[c.rarete]}</em></span>
              )}
            </button>
          );
        })}
      </div>
      <p className={s.position}>{Math.min(N, centre * 2 + 1)} – {Math.min(N, centre * 2 + 2)} / {N}</p>
      <p className={s.aide}>Molette, glisser ou ← → · clique une carte pour l’ouvrir</p>
    </div>
  );
}
