"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import s from "./CarteHolo.module.css";

type Props = {
  img: string;
  nom: string;
  detail?: string;
  numero: string; // ex. « 025 / 025 »
  rang?: string; // libellé de rareté
  taille?: "grande" | "moyenne" | "petite";
  priorite?: boolean;
  style?: CSSProperties;
  className?: string;
  sansBandeau?: boolean;
  // Opening : au survol à la souris, la carte joue le refrain (image et son) par-dessus l'illustration.
  extrait?: { src: string; debut: number };
};

const DUREE_REFRAIN = 14; // secondes jouées avant de reboucler sur le début du refrain
export const STOP_EXTRAITS = "zenkai:stop-extraits";

// Fondu de volume à l'image près (évite le clic d'un départ ou d'un arrêt sec).
function fondu(v: HTMLVideoElement, cible: number, ms: number, fin?: () => void) {
  const depart = v.volume, t0 = performance.now();
  const pas = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    v.volume = depart + (cible - depart) * k;
    if (k < 1 && v.dataset.fondu === String(t0)) requestAnimationFrame(pas);
    else if (k >= 1) fin?.();
  };
  v.dataset.fondu = String(t0);
  requestAnimationFrame(pas);
}

// Carte à collectionner holographique : inclinaison 3D, film irisé et reflet qui suivent le pointeur.
export default function CarteHolo({ img, nom, detail, numero, rang, taille = "moyenne", priorite, style, className, sansBandeau, extrait }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cadre = useRef<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const veut = useRef(false);

  const coupe = () => {
    veut.current = false;
    const v = video.current;
    if (ref.current) delete ref.current.dataset.lecture;
    if (!v || v.paused) return;
    fondu(v, 0, 260, () => { if (!veut.current) v.pause(); });
  };

  const joue = (e: PointerEvent<HTMLDivElement>) => {
    const v = video.current;
    if (!extrait || !v || e.pointerType !== "mouse") return;
    veut.current = true;
    const lance = () => {
      if (!veut.current) return;
      if (v.currentTime < extrait.debut - 0.5 || v.currentTime > extrait.debut + DUREE_REFRAIN) v.currentTime = extrait.debut;
      v.volume = 0;
      v.play().then(() => {
        if (!veut.current) { v.pause(); return; }
        ref.current?.setAttribute("data-lecture", "");
        fondu(v, 0.85, 500);
      }).catch(() => {});
    };
    if (!v.getAttribute("src")) { v.preload = "auto"; v.src = extrait.src; v.load(); }
    if (v.readyState >= 1) lance(); else v.addEventListener("loadedmetadata", lance, { once: true });
  };

  // Reboucle sur le refrain ; s'arrête si la page demande le silence (ouverture d'un opening en grand).
  const debut = extrait?.debut;
  useEffect(() => {
    const v = video.current;
    if (debut === undefined || !v) return;
    const boucle = () => { if (v.currentTime > debut + DUREE_REFRAIN) v.currentTime = debut; };
    const silence = () => {
      veut.current = false;
      if (ref.current) delete ref.current.dataset.lecture;
      v.pause();
    };
    v.addEventListener("timeupdate", boucle);
    window.addEventListener(STOP_EXTRAITS, silence);
    return () => { v.removeEventListener("timeupdate", boucle); window.removeEventListener(STOP_EXTRAITS, silence); v.pause(); };
  }, [debut]);

  const bouge = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    if (cadre.current) cancelAnimationFrame(cadre.current);
    cadre.current = requestAnimationFrame(() => {
      el.style.setProperty("--px", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--py", `${(y * 100).toFixed(1)}%`);
      el.style.setProperty("--ry", `${((x - 0.5) * 22).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${((0.5 - y) * 18).toFixed(2)}deg`);
      el.style.setProperty("--eclat", `${Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 1.6 + 0.35).toFixed(2)}`);
      el.dataset.actif = "";
    });
  };

  const sort = () => {
    coupe();
    const el = ref.current;
    if (!el) return;
    delete el.dataset.actif;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className={`${s.scene} ${className ?? ""}`} style={style}>
      <div ref={ref} className={`${s.carte} ${s[taille]}`} onPointerEnter={joue} onPointerMove={bouge} onPointerLeave={sort}>
        <div className={s.art}>
          <Image src={img} alt={nom} fill sizes={taille === "grande" ? "(max-width: 900px) 60vw, 340px" : "(max-width: 900px) 45vw, 240px"} priority={priorite} />
          {extrait && <video ref={video} className={s.extrait} preload="none" playsInline aria-hidden="true" tabIndex={-1} />}
        </div>
        <div className={s.film} aria-hidden="true" />
        <div className={s.reflet} aria-hidden="true" />
        {!sansBandeau && <div className={s.bandeau}>
          <span className={s.nom}>{nom}</span>
          {detail && <span className={s.detail}>{detail}</span>}
          <span className={s.numero}>
            {rang && <span className={s.rang}>{rang}</span>}
            {numero}
          </span>
        </div>}
      </div>
    </div>
  );
}
