"use client";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Profil = { id: string; pseudo: string; jetons: number };
export type EtatBooster = { gratuit_dispo: boolean; jetons: number; prochain_gratuit: string };
export type Mission = { code: string; titre: string; description: string; recompense: number; type: "quotidienne" | "succes";
  objectif: number; progres: number; reclamee: boolean };

// Compte du visiteur : session, profil et état du booster du jour. Partagé entre les composants par un évènement.
export function useCompte() {
  const [session, setSession] = useState<Session | null>(null);
  const [pret, setPret] = useState(false);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [etat, setEtat] = useState<EtatBooster | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);

  const charger = useCallback(async (s: Session | null) => {
    if (!s) { setProfil(null); setEtat(null); setMissions([]); return; }
    const sb = supabase();
    const [p, e, m] = await Promise.all([
      sb.from("profils").select("id, pseudo, jetons").eq("id", s.user.id).maybeSingle(),
      sb.rpc("etat_booster"),
      sb.rpc("mes_missions"),
    ]);
    setProfil((p.data as Profil) ?? null);
    setEtat((e.data as EtatBooster) ?? null);
    setMissions((m.data as Mission[]) ?? []);
  }, []);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setPret(true); charger(data.session); });
    const { data: abo } = sb.auth.onAuthStateChange((_ev, s) => { setSession(s); setPret(true); charger(s); });
    const maj = () => sb.auth.getSession().then(({ data }) => charger(data.session));
    window.addEventListener("zk:compte", maj);
    return () => { abo.subscription.unsubscribe(); window.removeEventListener("zk:compte", maj); };
  }, [charger]);

  const aReclamer = missions.filter(x => !x.reclamee && x.progres >= x.objectif).length;
  return { session, pret, profil, etat, missions, aReclamer };
}

// à appeler après une ouverture de booster pour rafraîchir le compteur partout
export const compteChange = () => window.dispatchEvent(new Event("zk:compte"));
