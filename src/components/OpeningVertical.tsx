"use client";

// Meilleur opening, version « Slider Verticalix » : le titre de l'opening en très grand à gauche,
// la pile des cartes nominées à droite (celle du milieu nette et animée, les voisines floues),
// le fond aux couleurs de l'animé, et la musique de l'opening qui part au refrain quand le son est activé.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { CATEGORIES } from "@/data/edition";
import { NOMINES_2027 } from "@/data/nomines2027";
import { carteNomine } from "@/data/cartesNomines";
import { garderCarte, useCollection } from "@/lib/collection";
import s from "./OpeningVertical.module.css";

type Nomine = { id: string; nom: string; detail?: string; img: string; video?: string; refrain?: number };
const LISTE = NOMINES_2027.opening as Nomine[];
const N = LISTE.length;
const CAT = "opening";
const pad = (n: number) => String(n).padStart(2, "0");
// [fond, encre] par opening
const TEINTE: Record<string, [string, string]> = {
  ignis: ["#8f2a10", "#fff1e6"], "jjk-aizo": ["#3a1f94", "#efeaff"], "oshi-no-ko": ["#e2457f", "#1d0612"],
  "witch-hat": ["#1d4f6b", "#eef7fb"], "sbr-spin": ["#0f5a52", "#eafaf6"], "hells-paradise": ["#d93a78", "#1d0612"],
  "one-piece": ["#b8341f", "#fff3e8"], "bleach-ibull": ["#5b0f1c", "#f6efe6"], "nippon-sangoku": ["#e7dcc6", "#1d150c"],
  daemons: ["#24183f", "#efe9ff"], rezero: ["#d6e4f2", "#13213a"], cote: ["#7a1630", "#fff0f3"],
  wistoria: ["#173a6b", "#eaf2ff"], "black-clover": ["#1c5a45", "#ecf7ef"], "dbs-beerus": ["#4a2a8a", "#f3edff"],
  "tokyo-revengers": ["#151517", "#f4f1ec"], "sentenced-hero": ["#3d3d46", "#f2f2f4"], "marriage-toxin": ["#e8b4c8", "#2a0f1c"],
};

export default function OpeningVertical({ bascule }: { bascule?: ReactNode }) {
  const idx = CATEGORIES.findIndex(c => c.id === CAT);
  const suivante = CATEGORIES[(idx + 1) % CATEGORIES.length];
  const bulletin = useCollection();
  const [{ i, avant, dir }, setEtat] = useState({ i: 0, avant: -1, dir: 1 });
  const [anim, setAnim] = useState<string | null>(null);
  const [son, setSon] = useState(false);
  const musique = useRef<HTMLVideoElement>(null);
  const verrou = useRef(0);

  const aller = useCallback((d: number) => {
    const t = performance.now();
    if (t - verrou.current < 750) return; // une carte par geste
    verrou.current = t;
    setAnim(null);
    setEtat(e => ({ i: (e.i + d + N) % N, avant: e.i, dir: d }));
  }, []);
  const choisir = (k: number) => { if (k !== i) { setAnim(null); setEtat(e => ({ i: k, avant: e.i, dir: k > e.i ? 1 : -1 })); } };

  useEffect(() => {
    const molette = (e: WheelEvent) => { e.preventDefault(); if (Math.abs(e.deltaY) > 12) aller(e.deltaY > 0 ? 1 : -1); };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); aller(1); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); aller(-1); }
    };
    let y0: number | null = null;
    const debut = (e: TouchEvent) => { y0 = e.touches[0].clientY; };
    const fin = (e: TouchEvent) => { if (y0 === null) return; const d = y0 - e.changedTouches[0].clientY; if (Math.abs(d) > 40) aller(d > 0 ? 1 : -1); y0 = null; };
    addEventListener("wheel", molette, { passive: false });
    addEventListener("keydown", touche);
    addEventListener("touchstart", debut, { passive: true });
    addEventListener("touchend", fin);
    return () => {
      removeEventListener("wheel", molette); removeEventListener("keydown", touche);
      removeEventListener("touchstart", debut); removeEventListener("touchend", fin);
    };
  }, [aller]);

  // musique : l'opening du nominé (vidéo cachée, 720p suffit pour le son), calée sur le refrain
  useEffect(() => {
    const v = musique.current, n = LISTE[i];
    if (!v || !son || !n.video) { v?.pause(); return; }
    let annule = false;
    v.src = n.video.replace("/openings/", "/openings/720/");
    const go = () => { if (annule) return; v.currentTime = n.refrain ?? 0; v.play().catch(() => setSon(false)); };
    v.addEventListener("loadedmetadata", go, { once: true });
    v.load();
    return () => { annule = true; v.removeEventListener("loadedmetadata", go); v.pause(); };
  }, [i, son]);

  useEffect(() => {
    [1, -1].forEach(d => { const im = new Image(); const m = LISTE[(i + d + N) % N]; im.src = carteNomine(m.id, m.img).carte; });
  }, [i]);

  const incliner = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget, r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -10}deg`);
    el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
  };
  const relacher = (e: PointerEvent<HTMLElement>) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); };

  const n = LISTE[i];
  const [artiste, oeuvre] = (n.detail ?? "").split(" · ");
  const [fond, encre] = TEINTE[n.id] ?? ["#15131a", "#f4f1ec"];
  const choisi = bulletin[CAT] === n.id;

  return (
    <section className={s.scene} style={{ "--fond": fond, "--encre": encre, "--dir": dir } as CSSProperties}
      data-plein-ecran="" data-lenis-prevent="" aria-label="Meilleur opening : les nominés">
      <header className={s.hud}>
        <Link href="/categories">← Catégories</Link>
        <p><span>Meilleur opening</span> <em>{pad(idx + 1)} / {CATEGORIES.length}</em></p>
        {bascule}
        <Link href={`/categories/${suivante.id}`}>{suivante.court} →</Link>
      </header>

      <div className={s.gauche}>
        <p className={s.compteur}><b>{pad(i + 1)}</b> / {pad(N)}</p>
        <div className={s.titres} aria-live="polite">
          {LISTE.map((m, k) => (
            <h1 key={m.id} className={s.titre} data-pos={k === i ? "actif" : k === avant ? "sort" : "cache"} aria-hidden={k !== i}>
              {[...m.nom].map((c, j) => <span key={j} style={{ "--j": j } as CSSProperties}>{c === " " ? " " : c}</span>)}
            </h1>
          ))}
        </div>
        <p className={s.sous} key={n.id}><b>{artiste}</b> · {oeuvre}</p>
        <div className={s.commandes}>
          <button className={s.rond} onClick={() => aller(1)} aria-label="Opening suivant">↓</button>
          <button className={s.rond} onClick={() => aller(-1)} aria-label="Opening précédent">↑</button>
          <button className={s.pilule} data-plein={choisi || undefined} onClick={() => garderCarte(CAT, n.id)}>{choisi ? "Dans ton bulletin ✓" : "Voter"}</button>
          <button className={s.pilule} aria-pressed={son} onClick={() => setSon(x => !x)}>{son ? "♪ Couper la musique" : "♪ Écouter l’opening"}</button>
        </div>
      </div>

      <div className={s.pile}>
        {LISTE.map((m, k) => {
          const d = ((k - i + N + Math.floor(N / 2)) % N) - Math.floor(N / 2);
          const pos = d === 0 ? "actif" : d === -1 ? "avant" : d === 1 ? "apres" : d < 0 ? "loin-haut" : "loin-bas";
          const c = carteNomine(m.id, m.img);
          if (Math.abs(d) > 2) return null;
          return (
            <figure key={m.id} className={s.carte} data-pos={pos} onClick={() => d !== 0 && choisir(k)}
              onPointerMove={d === 0 ? incliner : undefined} onPointerLeave={d === 0 ? relacher : undefined}>
              <img src={c.carte} alt={d === 0 ? `Carte nominée : ${m.nom}` : ""} draggable={false} decoding="async" />
              {d === 0 && c.anim && (
                <video key={m.id} src={c.anim} autoPlay muted loop playsInline aria-hidden
                  className={anim === m.id ? s.joue : undefined} onPlaying={() => setAnim(m.id)} />
              )}
            </figure>
          );
        })}
      </div>
      <video ref={musique} className={s.musique} playsInline preload="none" aria-hidden />
    </section>
  );
}
