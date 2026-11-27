"use client";
import { useEffect } from "react";
import { imgCarte, RARETE, videoCarte, type CarteEssai } from "./cartes";
import s from "./essais.module.css";

// Carte ouverte en grand, commune aux essais. L'animation de rareté se lance quand elle existe.
export default function Fiche({ carte, onFermer }: { carte: CarteEssai; onFermer: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onFermer(); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onFermer]);
  return (
    <div className={s.fiche} role="dialog" aria-modal="true" aria-label={carte.nom} onClick={onFermer} data-lenis-prevent>
      <div className={s.ficheCorps}>
        {carte.video
          ? <video src={videoCarte(carte.id)} poster={imgCarte(carte.id)} autoPlay loop muted playsInline />
          : <img src={imgCarte(carte.id)} alt={carte.nom} />}
        <div>
          <small>{RARETE[carte.rarete]} · {carte.anime}</small>
          <h2>{carte.nom}</h2>
          <p>Clique n’importe où pour fermer</p>
        </div>
      </div>
    </div>
  );
}
