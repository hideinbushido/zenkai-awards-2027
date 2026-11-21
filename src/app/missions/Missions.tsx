"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { compteChange, useCompte, type Mission } from "@/lib/compte";
import { JETON, jetons } from "@/lib/jetons";
import s from "./page.module.css";

export default function Missions() {
  const { pret, session, etat, missions } = useCompte();
  const [enCours, setEnCours] = useState("");
  const [gain, setGain] = useState("");

  async function reclamer(m: Mission) {
    setEnCours(m.code); setGain("");
    const { data, error } = await supabase().rpc("reclamer_mission", { p_code: m.code });
    setEnCours("");
    if (!error) setGain(`+${jetons((data as { gagne: number }).gagne)} pour « ${m.titre} »`);
    compteChange();
  }

  if (pret && !session) {
    return (
      <section className={s.page}>
        <div className={s.vide}>
          <h1 className={`affiche ${s.titre}`}>Missions</h1>
          <p>Connecte-toi pour réussir des missions et gagner des {JETON.plusieurs} : chaque {JETON.un} ouvre un booster de plus.</p>
          <Link href="/connexion" className="bouton">Se connecter</Link>
        </div>
      </section>
    );
  }

  const liste = (type: Mission["type"]) => missions.filter(m => m.type === type);
  const ligne = (m: Mission) => {
    const fini = m.progres >= m.objectif;
    return (
      <li key={m.code} className={`${s.mission} ${m.reclamee ? s.faite : ""}`}>
        <div className={s.infos}>
          <p className={s.nom}>{m.titre}</p>
          <p className={s.desc}>{m.description}</p>
          {m.objectif > 1 && !m.reclamee && (
            <div className={s.jauge} role="progressbar" aria-valuemin={0} aria-valuemax={m.objectif} aria-valuenow={m.progres} aria-label={`${m.progres} sur ${m.objectif}`}>
              <span style={{ width: `${(100 * m.progres) / m.objectif}%` }} /><small>{m.progres}/{m.objectif}</small>
            </div>
          )}
        </div>
        <span className={s.prix}><span className={s.piece} aria-hidden />+{m.recompense}</span>
        {m.reclamee ? <span className={s.ok}>Reçu</span>
          : fini ? <button type="button" className="bouton" onClick={() => reclamer(m)} disabled={enCours === m.code}>{enCours === m.code ? "…" : "Réclamer"}</button>
          : <span className={s.attente}>En cours</span>}
      </li>
    );
  };

  return (
    <section className={s.page} aria-labelledby="mis-titre">
      <header className={s.tete}>
        <h1 id="mis-titre" className={`affiche ${s.titre}`}>Missions</h1>
        <p className={s.chapo}>Réussis des missions pour gagner des {JETON.plusieurs}. Un {JETON.un} = un booster de plus.
          {etat ? ` Tu as ${jetons(etat.jetons)}.` : ""}</p>
        {gain && <p className={s.gain} role="status">{gain}</p>}
      </header>
      <div className={s.bloc}>
        <h2 className={s.sous}>Chaque jour <small>se renouvellent à minuit</small></h2>
        <ul className={s.liste}>{liste("quotidienne").map(ligne)}</ul>
      </div>
      <div className={s.bloc}>
        <h2 className={s.sous}>Succès</h2>
        <ul className={s.liste}>{liste("succes").map(ligne)}</ul>
      </div>
    </section>
  );
}
