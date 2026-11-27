// Cartes nominées « Meilleur opening » (rendus 4K ramenés à 1200 px, vignette 300 px, animation 900 px).
// Fichiers dans public/nominations/opening/. Les openings sans carte retombent sur leur visuel.
const AVEC_CARTE = new Set([
  "ignis", "jjk-aizo", "witch-hat", "sbr-spin", "hells-paradise", "one-piece", "bleach-ibull", "nippon-sangoku",
  "daemons", "cote", "wistoria", "black-clover", "dbs-beerus", "tokyo-revengers", "marriage-toxin",
]);

export function carteNomine(id: string, repli: string) {
  if (!AVEC_CARTE.has(id)) return { carte: repli, vignette: repli, anim: null as string | null, vraie: false };
  const b = `/nominations/opening/${id}`;
  return { carte: `${b}.webp`, vignette: `${b}-v.webp`, anim: `${b}.mp4`, vraie: true };
}
