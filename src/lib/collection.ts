"use client";

import { useSyncExternalStore } from "react";

// La collection du visiteur : une carte gardée par booster (catégorie → nominé).
// Démo stockée sur l'appareil, en attendant le vrai vote par lien d'accès.
const CLE = "zenkai-classeur-2027";
const EVENEMENT = "zenkai-collection";
type Collection = Record<string, string>;
const VIDE: Collection = {};

let cache: { brut: string | null; valeur: Collection } = { brut: null, valeur: VIDE };

function lire(): Collection {
  let brut: string | null = null;
  try { brut = localStorage.getItem(CLE); } catch { return VIDE; }
  if (brut === cache.brut) return cache.valeur;
  let valeur = VIDE;
  try { valeur = brut ? JSON.parse(brut) : VIDE; } catch {}
  cache = { brut, valeur };
  return valeur;
}

function abonne(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel);
  return () => { window.removeEventListener(EVENEMENT, rappel); window.removeEventListener("storage", rappel); };
}

export function useCollection(): Collection {
  return useSyncExternalStore(abonne, lire, () => VIDE);
}

export function garderCarte(categorie: string, nomine: string) {
  try { localStorage.setItem(CLE, JSON.stringify({ ...lire(), [categorie]: nomine })); } catch {}
  window.dispatchEvent(new Event(EVENEMENT));
}

export function retirerCarte(categorie: string) {
  const c = { ...lire() };
  delete c[categorie];
  try { localStorage.setItem(CLE, JSON.stringify(c)); } catch {}
  window.dispatchEvent(new Event(EVENEMENT));
}
