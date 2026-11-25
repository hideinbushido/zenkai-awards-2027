import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import Apercu from "./Apercu";
import type { Carte } from "../Coffre";

// Aperçu du coffre sans compte, avec tout le catalogue local : uniquement en développement.
async function catalogue(): Promise<Carte[]> {
  "use cache";
  const dossier = path.join(process.cwd(), "public/booster/img/cards");
  const ids = (await readdir(dossier)).sort();
  const rar: Record<string, string> = { eclat: "eclat", prisme: "prisme", spectre: "spectre", mirage: "mirage", zenkai: "zenkai" };
  const cartes: Carte[] = await Promise.all(ids.map(async id => {
    const j = JSON.parse(await readFile(path.join(dossier, id, "carte.json"), "utf8"));
    return { id, anime: j.anime, rarete: rar[j.rarity] ?? "eclat", nom: j.name, special: null };
  }));
  cartes.push({ id: "ICHIGO-EKONTE-SPECTRE", anime: "Bleach", rarete: "spectre", nom: "Ichigo Kurosaki", special: "Ekonte" });
  return cartes;
}

export default async function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Apercu cartes={await catalogue()} />;
}
