import Link from "next/link";
import s from "./essais.module.css";

// Barre commune aux quatre essais de galerie : passer de l'un à l'autre pour comparer.
export const ESSAIS = [
  { slug: "ruban", titre: "Ruban", ref: "Agenciex · Twist Band" },
  { slug: "tunnel", titre: "Tunnel", ref: "Folioir" },
  { slug: "angle", titre: "Angle", ref: "Angled Gallery" },
  { slug: "adn", titre: "ADN", ref: "DNA Carousel" },
] as const;

export default function Barre({ actif, sombre = false }: { actif: string; sombre?: boolean }) {
  return (
    <nav className={s.barre} data-sombre={sombre || undefined} aria-label="Essais de galerie">
      <Link href="/cartes/essais" className={s.barreTitre}>Essais</Link>
      {ESSAIS.map((e, i) => (
        <Link key={e.slug} href={`/cartes/essais/${e.slug}`} aria-current={actif === e.slug ? "page" : undefined}>
          <small>{String(i + 1).padStart(2, "0")}</small>{e.titre}
        </Link>
      ))}
    </nav>
  );
}
