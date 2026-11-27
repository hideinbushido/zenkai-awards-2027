// Galerie des nominés d'une catégorie : deux mises en scène réparties entre les catégories.
// Verticale (d'après Slider Verticalix) ou Monographie (d'après Monograph Gallery).
import GalerieMonographie from "./GalerieMonographie";
import GalerieVerticale from "./GalerieVerticale";

const VERTICALE = new Set([
  "opening", "action", "comedie", "drama", "isekai", "suite", "deception",
  "protagoniste", "feminin", "secondaire", "attachant", "chanson", "chara",
]);
// toutes les autres : Monographie (annee, slice, romance, seinen, nouveaute, film, antagoniste,
// masculin, sensei, ending, animation, combat)

export const miseEnScene = (categorie: string) => (VERTICALE.has(categorie) ? "verticale" : "monographie");

export default function GalerieNomines({ categorie }: { categorie: string }) {
  return miseEnScene(categorie) === "verticale"
    ? <GalerieVerticale key={categorie} categorie={categorie} />
    : <GalerieMonographie key={categorie} categorie={categorie} />;
}
