import Link from "next/link";
import { CATEGORIES, type Famille } from "@/data/edition";
import s from "./MurBoosters.module.css";

const TEINTE: Record<Famille, number> = { series: 205, personnages: 300, musique: 350, technique: 115, "grand-prix": 60 };

// Deux rangées de boosters qui défilent en continu, en sens opposés.
export default function MurBoosters() {
  const rangs = [CATEGORIES.slice(0, 13), CATEGORIES.slice(13)];
  return (
    <div className={s.mur}>
      {rangs.map((rang, r) => (
        <div key={r} className={s.rail} data-sens={r % 2 ? "inverse" : undefined}>
          {[0, 1].map((copie) => (
            <ul key={copie} className={s.liste} aria-hidden={copie === 1 || undefined}>
              {rang.map((c) => {
                const n = CATEGORIES.indexOf(c) + 1;
                return (
                  <li key={c.id}>
                    <Link href={`/categories/${c.id}`} className={s.booster} style={{ "--teinte": TEINTE[c.famille] } as React.CSSProperties} tabIndex={copie ? -1 : undefined}>
                      <span className={s.marque}>ZENKAI</span>
                      <span className={s.bandeau}>
                        <span className={s.nom}>{c.court}</span>
                        <span className={s.num}>{String(n).padStart(2, "0")} / 25</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      ))}
    </div>
  );
}
