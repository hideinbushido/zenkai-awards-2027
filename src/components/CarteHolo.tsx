"use client";

import Image from "next/image";
import { useRef, type CSSProperties, type PointerEvent } from "react";
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
};

// Carte à collectionner holographique : inclinaison 3D, film irisé et reflet qui suivent le pointeur.
export default function CarteHolo({ img, nom, detail, numero, rang, taille = "moyenne", priorite, style, className, sansBandeau }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cadre = useRef<number | null>(null);

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
    const el = ref.current;
    if (!el) return;
    delete el.dataset.actif;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className={`${s.scene} ${className ?? ""}`} style={style}>
      <div ref={ref} className={`${s.carte} ${s[taille]}`} onPointerMove={bouge} onPointerLeave={sort}>
        <div className={s.art}>
          <Image src={img} alt={nom} fill sizes={taille === "grande" ? "(max-width: 900px) 60vw, 340px" : "(max-width: 900px) 45vw, 240px"} priority={priorite} />
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
