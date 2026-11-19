"use client";

import { useState } from "react";
import Refraction from "@/components/webgl/Refraction";
import { PALMARES_2026 } from "@/data/edition";
import s from "./Edition1.module.css";

// Les gagnants 2026 derrière un verre cannelé, qui se dissipe au survol ou au focus.
export default function Edition1() {
  const [ouvert, setOuvert] = useState<string | null>(null);
  return (
    <ul className={s.liste}>
      {PALMARES_2026.map((p) => {
        const net = ouvert === p.categorie;
        return (
          <li key={p.categorie}>
            <button
              type="button"
              className={s.vitre}
              onPointerEnter={() => setOuvert(p.categorie)}
              onPointerLeave={() => setOuvert(null)}
              onFocus={() => setOuvert(p.categorie)}
              onBlur={() => setOuvert(null)}
              aria-label={`${p.categorie} 2026 : ${p.gagnant}`}
            >
              <Refraction src={p.img} net={net ? 1 : 0} className={s.canvas} />
            </button>
            <p className={s.cat}>{p.categorie}</p>
            <p className={s.gagnant}>{p.gagnant}</p>
            <p className={s.par}>Annoncé par {p.presentateur} <span>{p.handle}</span></p>
          </li>
        );
      })}
    </ul>
  );
}
