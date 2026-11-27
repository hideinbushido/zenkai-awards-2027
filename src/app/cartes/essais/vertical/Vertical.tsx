"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import s from "./vertical.module.css";

// Essai 5 · d'après Slider Verticalix : un slider vertical plein écran.
// À gauche, le nom en très grand ; à droite, la pile de cartes : celle du milieu nette et animée,
// la précédente et la suivante floues au-dessus et en dessous. Le fond prend la couleur de la carte.
// Cartes en HD (rendus 4K ramenés à 1200 px) et animations Zenkai en 900 px.
type Slide = { id: string; nom: string; anime: string; fond: string; encre: string };
const SLIDES: Slide[] = [
  { id: "01", nom: "Ichigo Kurosaki", anime: "Bleach", fond: "#5b0f1c", encre: "#f6efe6" },
  { id: "02", nom: "Satoru Gojo", anime: "Jujutsu Kaisen", fond: "#3a1f94", encre: "#efeaff" },
  { id: "03", nom: "Tanjiro Kamado", anime: "Demon Slayer", fond: "#8f2b12", encre: "#fff1e6" },
  { id: "04", nom: "Son Gohan", anime: "Dragon Ball Super", fond: "#b9d8ef", encre: "#0f2236" },
  { id: "05", nom: "Asta & Yuno", anime: "Black Clover", fond: "#1c5a45", encre: "#ecf7ef" },
  { id: "06", nom: "Gabimaru", anime: "Hell’s Paradise", fond: "#e0397f", encre: "#1d0612" },
  { id: "07", nom: "Gyro & Johnny", anime: "JoJo : Steel Ball Run", fond: "#0f5a52", encre: "#eafaf6" },
  { id: "08", nom: "Benimaru Shinmon", anime: "Fire Force", fond: "#ebe5d8", encre: "#16130f" },
];
const N = SLIDES.length;
const src = (id: string, ext: string) => `/essais/verticalix/${id}.${ext}`;

export default function Vertical() {
  const [{ i, avant, dir }, setEtat] = useState({ i: 0, avant: -1, dir: 1 });
  const [video, setVideo] = useState<string | null>(null);
  const verrou = useRef(0);
  const aller = useCallback((d: number) => {
    const t = performance.now();
    if (t - verrou.current < 750) return; // une carte par geste
    verrou.current = t;
    setVideo(null);
    setEtat(e => ({ i: (e.i + d + N) % N, avant: e.i, dir: d }));
  }, []);

  useEffect(() => {
    const el = document.documentElement;
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
    el.style.overflow = "hidden";
    return () => {
      removeEventListener("wheel", molette); removeEventListener("keydown", touche);
      removeEventListener("touchstart", debut); removeEventListener("touchend", fin);
      el.style.overflow = "";
    };
  }, [aller]);

  // précharge les images voisines pour que la transition ne montre jamais une carte vide
  useEffect(() => {
    [1, -1, 2].forEach(d => { const im = new Image(); im.src = src(SLIDES[(i + d + N) % N].id, "webp"); });
  }, [i]);

  const incliner = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget, r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -10}deg`);
    el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
  };
  const relacher = (e: PointerEvent<HTMLElement>) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); };

  const actuel = SLIDES[i];
  return (
    <section className={s.scene} style={{ "--fond": actuel.fond, "--encre": actuel.encre, "--dir": dir } as CSSProperties} data-lenis-prevent aria-roledescription="carrousel">
      <div className={s.gauche}>
        <div className={s.titres} aria-live="polite">
          {SLIDES.map((sl, k) => {
            const pos = k === i ? "actif" : k === avant ? "sort" : "cache";
            return (
              <h1 key={sl.id} className={s.titre} data-pos={pos} aria-hidden={k !== i}>
                {[...sl.nom].map((c, j) => <span key={j} style={{ "--j": j } as CSSProperties}>{c === " " ? " " : c}</span>)}
              </h1>
            );
          })}
        </div>
        <p className={s.sous} key={actuel.id}>{actuel.anime} · Zenkai</p>
        <div className={s.commandes}>
          <button onClick={() => aller(1)} aria-label="Carte suivante">↓</button>
          <button onClick={() => aller(-1)} aria-label="Carte précédente">↑</button>
          <span><b>{i + 1}</b> / {N}</span>
        </div>
      </div>

      <div className={s.pile}>
        {SLIDES.map((sl, k) => {
          const d = ((k - i + N + N / 2) % N) - N / 2; // -4..3 : position relative à la carte active
          const pos = d === 0 ? "actif" : d === -1 ? "avant" : d === 1 ? "apres" : d < 0 ? "loin-haut" : "loin-bas";
          return (
            <figure key={sl.id} className={s.carte} data-pos={pos}
              onClick={() => d !== 0 && Math.abs(d) === 1 && aller(d)}
              onPointerMove={d === 0 ? incliner : undefined} onPointerLeave={d === 0 ? relacher : undefined}>
              <img src={src(sl.id, "webp")} alt={d === 0 ? `${sl.nom}, carte Zenkai` : ""} draggable={false}
                loading={Math.abs(d) <= 1 ? "eager" : "lazy"} decoding="async" />
              {d === 0 && (
                <video key={sl.id} src={src(sl.id, "mp4")} autoPlay muted loop playsInline aria-hidden
                  className={video === sl.id ? s.joue : undefined} onPlaying={() => setVideo(sl.id)} />
              )}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
