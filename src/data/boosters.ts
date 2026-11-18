import { CATEGORIES, NOMINES_ANNEE, NOMINES_PROTAGONISTE, type Famille, type Nomine } from "./edition";

export const FAMILLES: { id: Famille; nom: string; texte: string }[] = [
  { id: "series", nom: "Séries", texte: "Les meilleures séries de 2026, genre par genre." },
  { id: "personnages", nom: "Personnages", texte: "Ceux qu'on a suivis, détestés, adorés." },
  { id: "musique", nom: "Musique", texte: "Openings, endings et chansons qui ont tourné en boucle." },
  { id: "technique", nom: "Technique", texte: "L'animation, le dessin, les combats." },
  { id: "grand-prix", nom: "Grand prix", texte: "Le dernier booster de la carte, le dernier prix du live." },
];

export const imageBooster = (f: Famille) => `/visuels/booster-${f}.webp`;

// Nominés connus pour l'instant : ceux de 2026 servent d'exemple sur deux catégories.
const NOMINES: Partial<Record<string, Nomine[]>> = {
  annee: NOMINES_ANNEE,
  protagoniste: NOMINES_PROTAGONISTE,
};
export const nominesDe = (id: string) => NOMINES[id] ?? null;

export const categorie = (id: string) => CATEGORIES.find((c) => c.id === id);
export const voisines = (id: string) => {
  const i = CATEGORIES.findIndex((c) => c.id === id);
  return { avant: CATEGORIES[i - 1] ?? null, apres: CATEGORIES[i + 1] ?? null, numero: i + 1 };
};
