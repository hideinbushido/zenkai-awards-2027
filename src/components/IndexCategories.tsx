"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { decoder } from "./Decode";
import { CATEGORIES } from "@/data/edition";
import { NOMINES_2027 } from "@/data/nomines2027";
import { FAMILLES } from "@/data/boosters";
import s from "./IndexCategories.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

// Les 25 catégories en index typographique plein écran : le nom au centre de l'écran s'allume
// et se décode, le fond prend les couleurs de ses nominés.
export default function IndexCategories() {
  const ref = useRef<HTMLElement>(null);
  const noms = useRef<(HTMLAnchorElement | null)[]>([]);
  const [actif, setActif] = useState(0);
  const [proche, setProche] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setProche(true); obs.disconnect(); } }, { rootMargin: "100% 0px" });
    obs.observe(el);
    let raf = 0;
    const mesure = () => {
      raf = 0;
      const milieu = innerHeight * 0.5;
      let best = 0, d = Infinity;
      noms.current.forEach((n, i) => {
        if (!n) return;
        const r = n.getBoundingClientRect();
        const di = Math.abs(r.top + r.height / 2 - milieu);
        if (di < d) { d = di; best = i; }
      });
      setActif(best);
    };
    const surScroll = () => { if (!raf) raf = requestAnimationFrame(mesure); };
    addEventListener("scroll", surScroll, { passive: true });
    mesure();
    return () => { removeEventListener("scroll", surScroll); cancelAnimationFrame(raf); obs.disconnect(); };
  }, []);

  // Le nom actif se décode à chaque fois qu'il s'allume
  useEffect(() => {
    const n = noms.current[actif]?.querySelector<HTMLElement>("[data-nom]");
    if (!n) return;
    return decoder(n, CATEGORIES[actif].court.toUpperCase(), 0.55);
  }, [actif]);

  const cat = CATEGORIES[actif];
  const nomines = NOMINES_2027[cat.id] ?? [];
  const famille = FAMILLES.find((f) => f.id === cat.famille);

  return (
    <section ref={ref} className={s.section} aria-labelledby="index-titre">
      <div className={s.fond} aria-hidden="true">
        {proche && CATEGORIES.map((c, i) => {
          const img = NOMINES_2027[c.id]?.[0]?.img;
          return img ? <img key={c.id} src={img} alt="" className={s.image} data-actif={i === actif} decoding="async" /> : null;
        })}
        <div className={s.voile} />
      </div>

      <header className={s.tete}>
        <p className={s.sur}><span>Édition</span><span>2027</span><span>Les nominations</span></p>
        <h2 id="index-titre" className={s.titre}>
          <em>Vingt-cinq</em>
          <strong>catégories</strong>
        </h2>
      </header>

      <div className={s.corps}>
        <ol className={s.liste}>
          {CATEGORIES.map((c, i) => (
            <li key={c.id}>
              <Link
                ref={(n) => { noms.current[i] = n; }}
                href={`/categories/${c.id}`}
                className={s.nom}
                data-actif={i === actif}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") setActif(i); }}
                aria-label={`${c.titre} : ${NOMINES_2027[c.id]?.length ?? 0} nominés`}
              >
                <sup>{pad(i + 1)}</sup><span data-nom>{c.court.toUpperCase()}</span>
              </Link>
            </li>
          ))}
        </ol>

        <aside className={s.panneau} aria-live="polite">
          <p className={s.pile}>
            <span>{famille?.nom ?? ""}</span>
            <span>{pad(actif + 1)} / {CATEGORIES.length}</span>
            <span>{nomines.length} nominés</span>
          </p>
          <p className={s.long}>{cat.titre}</p>
          <ul className={s.vignettes}>
            {nomines.slice(0, 4).map((n) => <li key={n.id}><img src={n.img} alt="" loading="lazy" /><span>{n.nom}</span></li>)}
          </ul>
          <Link href={`/categories/${cat.id}`} className={s.voir}>Voir les nominés</Link>
        </aside>
      </div>
    </section>
  );
}
