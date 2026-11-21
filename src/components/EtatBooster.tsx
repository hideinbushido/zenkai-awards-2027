"use client";

import { nominesDe } from "@/data/boosters";
import { useCollection } from "@/lib/collection";
import s from "./EtatBooster.module.css";

// Pastille sous un booster : la carte déjà gardée, s'il y en a une
export default function EtatBooster({ categorie }: { categorie: string }) {
  const id = useCollection()[categorie];
  const carte = id ? nominesDe(categorie)?.find((n) => n.id === id) : null;
  if (!carte) return <span className={s.etat}>À ouvrir</span>;
  return <span className={`${s.etat} ${s.garde}`}>Gardée : {carte.nom}</span>;
}
