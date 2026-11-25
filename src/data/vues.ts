// Cartes qui ont plusieurs façons d'être regardées (ex. Ekonte Spectre : trois planches ou image complète).
// La première vue est celle par défaut ; le passage de l'une à l'autre se fait par un balayage de lumière.
export type Vue = { label: string; src: string };

export const vuesCartes: Record<string, Vue[]> = {
  "ICHIGO-EKONTE-SPECTRE": [
    { label: "3 planches", src: "/booster/vues/ICHIGO-EKONTE-SPECTRE/planches.webp" },
    { label: "Image complète", src: "/booster/vues/ICHIGO-EKONTE-SPECTRE/complete.webp" },
  ],
};
