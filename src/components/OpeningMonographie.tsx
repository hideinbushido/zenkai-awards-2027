"use client";

// Meilleur opening : galerie éditoriale d'après « Monograph Gallery ».
// À gauche le titre en très grand (mots qui montent derrière un masque), au centre-droit l'opening en HD
// qui démarre au refrain, en bas un ruban de vignettes qui défile tout seul, se glisse avec élan et se clique.
// Seuls transform, opacity et clip-path bougent : le rendu reste fluide en plein écran.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CATEGORIES } from "@/data/edition";
import { NOMINES_2027 } from "@/data/nomines2027";
import { garderCarte, useCollection } from "@/lib/collection";
import { carteNomine } from "@/data/cartesNomines";
import s from "./OpeningMonographie.module.css";

type Nomine = { id: string; nom: string; detail?: string; img: string; video?: string; refrain?: number };
const LISTE = NOMINES_2027.opening as Nomine[];
const N = LISTE.length;
const pad = (n: number) => String(n).padStart(2, "0");
const CAT = "opening";

export default function OpeningMonographie({ bascule }: { bascule?: React.ReactNode }) {
  const idx = CATEGORIES.findIndex(c => c.id === CAT);
  const suivante = CATEGORIES[(idx + 1) % CATEGORIES.length];
  const bulletin = useCollection();
  const [i, setI] = useState(0);
  const [son, setSon] = useState(false);
  const videos = useRef<(HTMLVideoElement | null)[]>([null, null]);
  const actif = useRef(0);
  const ruban = useRef<HTMLDivElement>(null);
  const piste = useRef<HTMLDivElement>(null);
  const tire = useRef(false);

  // ---------- vidéo : la nouvelle se charge derrière, se cale sur le refrain, puis balaie l'ancienne ----------
  useEffect(() => {
    const n = LISTE[i];
    if (!n.video) return;
    const petit = innerWidth < 900 || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const src = petit ? n.video.replace("/openings/", "/openings/720/") : n.video;
    const prochaine = videos.current[1 - actif.current], ancienne = videos.current[actif.current];
    if (!prochaine || !ancienne) return;
    let annule = false;
    prochaine.muted = !son;
    prochaine.src = src;
    prochaine.dataset.etat = "attente";
    const pret = () => {
      if (annule) return;
      prochaine.currentTime = n.refrain ?? 0;
      prochaine.play().catch(() => { prochaine.muted = true; setSon(false); prochaine.play().catch(() => {}); });
    };
    const joue = () => {
      if (annule) return;
      prochaine.dataset.etat = "entre";
      ancienne.dataset.etat = "dessous";
      window.setTimeout(() => { if (annule) return; ancienne.pause(); ancienne.muted = true; ancienne.dataset.etat = "repos"; prochaine.dataset.etat = "visible"; }, 1000);
      actif.current = 1 - actif.current;
    };
    prochaine.addEventListener("loadedmetadata", pret, { once: true });
    prochaine.addEventListener("playing", joue, { once: true });
    prochaine.load();
    return () => { annule = true; prochaine.removeEventListener("loadedmetadata", pret); prochaine.removeEventListener("playing", joue); };
    // le son n'est pas une dépendance : le basculer ne doit pas recharger la vidéo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const basculerSon = () => {
    const v = videos.current[actif.current];
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) v.play().catch(() => {});
    setSon(!v.muted);
  };

  const aller = useCallback((d: number) => setI(x => (x + d + N) % N), []);

  // ---------- ruban : défilement continu, glisser avec élan, molette horizontale ----------
  useEffect(() => {
    const el = ruban.current, p = piste.current;
    if (!el || !p) return;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0, vit = 0, survol = false, glisse = false, x0 = 0, depl = 0, largeur = p.scrollWidth / 3;
    const mesurer = () => { largeur = p.scrollWidth / 3; };
    const ro = new ResizeObserver(mesurer); ro.observe(p);
    const auto = reduit ? 0 : -0.45;
    const bas = (e: PointerEvent) => { glisse = true; x0 = e.clientX; depl = 0; vit = 0; el.setPointerCapture(e.pointerId); };
    const bouge = (e: PointerEvent) => { if (!glisse) return; const d = e.clientX - x0; x0 = e.clientX; depl += Math.abs(d); x += d; vit = d; tire.current = depl > 6; };
    const haut = () => { glisse = false; window.setTimeout(() => { tire.current = false; }, 0); };
    const molette = (e: WheelEvent) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); vit -= e.deltaX * 0.25; } };
    el.addEventListener("pointerdown", bas); el.addEventListener("pointermove", bouge);
    el.addEventListener("pointerup", haut); el.addEventListener("pointercancel", haut);
    el.addEventListener("wheel", molette, { passive: false });
    const entre = () => { survol = true; }, sort = () => { survol = false; };
    el.addEventListener("pointerenter", entre); el.addEventListener("pointerleave", sort);
    let raf = 0;
    const tic = () => {
      raf = requestAnimationFrame(tic);
      if (!glisse) { x += vit; vit *= 0.94; x += survol ? auto * 0.15 : auto; }
      if (x <= -largeur * 2) x += largeur; else if (x > -largeur * 0.5) x -= largeur;
      p.style.transform = `translate3d(${x}px,0,0)`;
    };
    x = -largeur;
    tic();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      el.removeEventListener("pointerdown", bas); el.removeEventListener("pointermove", bouge);
      el.removeEventListener("pointerup", haut); el.removeEventListener("pointercancel", haut);
      el.removeEventListener("wheel", molette); el.removeEventListener("pointerenter", entre); el.removeEventListener("pointerleave", sort);
    };
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") aller(1); if (e.key === "ArrowLeft") aller(-1); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [aller]);

  const n = LISTE[i];
  const [artiste, oeuvre] = (n.detail ?? "").split(" · ");
  const choisi = bulletin[CAT] === n.id;
  const carte = carteNomine(n.id, n.img);

  return (
    <section className={s.page} data-plein-ecran="" data-lenis-prevent="" aria-label="Meilleur opening : les nominés">
      <header className={s.hud}>
        <Link href="/categories">← Catégories</Link>
        <p><span>Meilleur opening</span> <em>{pad(idx + 1)} / {CATEGORIES.length}</em></p>
        {bascule}
        <Link href={`/categories/${suivante.id}`}>{suivante.court} →</Link>
      </header>

      <div className={s.texte}>
        <p className={s.compteur}><b>{pad(i + 1)}</b>/{pad(N)}</p>
        <h1 className={s.titre} key={n.id} aria-live="polite">
          {n.nom.split(" ").map((m, j) => (
            <span key={j} className={s.masque}><span style={{ "--j": j } as CSSProperties}>{m}</span></span>
          ))}
        </h1>
        <p className={s.legende} key={n.id + "l"}><b>{artiste}</b><span>{oeuvre}</span></p>
        <div className={s.actions}>
          <button type="button" className={s.principal} data-choisi={choisi || undefined} onClick={() => garderCarte(CAT, n.id)}>
            {choisi ? "Dans ton bulletin ✓" : "Voter pour cet opening"}
          </button>
          <button type="button" onClick={basculerSon} aria-pressed={son}>{son ? "Couper le son" : "Activer le son"}</button>
          <span className={s.fleches}>
            <button type="button" onClick={() => aller(-1)} aria-label="Opening précédent">←</button>
            <button type="button" onClick={() => aller(1)} aria-label="Opening suivant">→</button>
          </span>
        </div>
      </div>

      {/* l'opening en fond de tout l'écran */}
      <div className={s.ecran} aria-hidden>
        <video ref={v => { videos.current[0] = v; }} data-etat="visible" muted playsInline loop preload="none" />
        <video ref={v => { videos.current[1] = v; }} data-etat="repos" muted playsInline loop preload="none" />
      </div>
      <div className={s.voile} aria-hidden />

      {/* la carte nominée en grand, à la place de l'image de la Monograph */}
      <figure className={s.carte} key={n.id + "c"}>
        <div className={s.carteCadre}>
          <img src={carte.carte} alt={`Carte nominée : ${n.nom}`} />
          {carte.anim && <video src={carte.anim} autoPlay muted loop playsInline aria-hidden onPlaying={e => e.currentTarget.classList.add(s.joue)} />}
        </div>
        <figcaption>{carte.vraie ? "Carte nominée" : "Visuel"} · {oeuvre}</figcaption>
      </figure>

      <div ref={ruban} className={s.ruban} aria-label="Tous les openings nominés">
        <div ref={piste} className={s.piste}>
          {[0, 1, 2].flatMap(copie => LISTE.map((m, k) => (
            <button key={`${copie}-${m.id}`} type="button" className={s.vignette} data-actif={k === i || undefined}
              aria-hidden={copie !== 1} tabIndex={copie === 1 ? 0 : -1}
              onClick={() => { if (!tire.current) setI(k); }}>
              <span className={s.num}>{pad(k + 1)}</span>
              <img src={carteNomine(m.id, m.img).vignette} alt={copie === 1 ? m.nom : ""} draggable={false} loading="lazy" decoding="async" />
              <span className={s.nomV}>{m.nom}</span>
            </button>
          )))}
        </div>
      </div>
    </section>
  );
}
