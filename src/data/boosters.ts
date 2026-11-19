import { CATEGORIES, type Famille } from "./edition";
import { NOMINES_2027 } from "./nomines2027";

export const FAMILLES: { id: Famille; nom: string; texte: string }[] = [
  { id: "series", nom: "Séries", texte: "Les meilleures séries de 2026, genre par genre." },
  { id: "personnages", nom: "Personnages", texte: "Ceux qu'on a suivis, détestés, adorés." },
  { id: "musique", nom: "Musique", texte: "Openings, endings et chansons qui ont tourné en boucle." },
  { id: "technique", nom: "Technique", texte: "L'animation, le dessin, les combats." },
  { id: "grand-prix", nom: "Grand prix", texte: "Le dernier booster de la carte, le dernier prix du live." },
];

export const imageBooster = (f: Famille) => `/visuels/booster-${f}.webp`;

// Proposition de nominés 2027 (à valider avant l'ouverture des votes).
export const nominesDe = (id: string) => NOMINES_2027[id] ?? null;

export const categorie = (id: string) => CATEGORIES.find((c) => c.id === id);
export const voisines = (id: string) => {
  const i = CATEGORIES.findIndex((c) => c.id === id);
  return { avant: CATEGORIES[i - 1] ?? null, apres: CATEGORIES[i + 1] ?? null, numero: i + 1 };
};
