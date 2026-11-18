// Grammaire de mouvement unique du site : une courbe, trois durées. Rien d'autre.
export const EASE = "expo.out";
export const EASE_DOUX = "power3.out";
export const DUREE = { courte: 0.6, normale: 1.1, longue: 1.6 } as const;
export const DECALAGE = 0.045; // entre deux lettres / mots
