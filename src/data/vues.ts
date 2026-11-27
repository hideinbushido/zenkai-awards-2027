// Cartes qui ont plusieurs façons d'être regardées (ex. Ekonte Spectre : trois planches ou image complète).
// La première vue est celle par défaut ; le passage de l'une à l'autre se fait par un balayage de lumière.
export type Vue = { label: string; src: string };

export const vuesCartes: Record<string, Vue[]> = {
  "DBSBEERUS-066": [
    { label: "3 planches", src: "/booster/vues/DBSBEERUS-066/planches.webp" },
    { label: "Image complète", src: "/booster/vues/DBSBEERUS-066/complete.webp" }
  ],
  "DemonSlayer-053": [
    { label: "3 planches", src: "/booster/vues/DemonSlayer-053/planches.webp" },
    { label: "Image complète", src: "/booster/vues/DemonSlayer-053/complete.webp" }
  ],
  "DemonSlayer-066": [
    { label: "3 planches", src: "/booster/vues/DemonSlayer-066/planches.webp" },
    { label: "Image complète", src: "/booster/vues/DemonSlayer-066/complete.webp" }
  ],
  "ICHIGO-EKONTE-SPECTRE": [
    { label: "3 planches", src: "/booster/vues/ICHIGO-EKONTE-SPECTRE/planches.webp" },
    { label: "Image complète", src: "/booster/vues/ICHIGO-EKONTE-SPECTRE/complete.webp" }
  ],
  "MHA-006": [
    { label: "3 planches", src: "/booster/vues/MHA-006/planches.webp" },
    { label: "Image complète", src: "/booster/vues/MHA-006/complete.webp" }
  ],
};
