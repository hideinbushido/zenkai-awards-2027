"use client";
import Link from "next/link";
import { useCompte } from "@/lib/compte";
import { JETON } from "@/lib/jetons";
import s from "./Compte.module.css";

// Coin du compte dans la barre de navigation
export default function Compte() {
  const { pret, session, profil, etat, aReclamer } = useCompte();
  if (!pret) return <span className={s.vide} aria-hidden />;
  if (!session) return <Link href="/connexion" className={s.connexion}>Se connecter</Link>;
  return (
    <div className={s.groupe}>
    {aReclamer > 0 && (
      <Link href="/missions" className={s.missions} aria-label={`${aReclamer} mission${aReclamer > 1 ? "s" : ""} à réclamer`}>
        Missions <span>{aReclamer}</span>
      </Link>
    )}
    <Link href="/cartes" className={s.compte} aria-label={`Mes cartes, ${profil?.pseudo ?? "mon compte"}`}>
      <span className={s.jetons} title={`${etat?.jetons ?? 0} ${JETON.plusieurs}`}>
        <span className={s.piece} aria-hidden />{etat?.jetons ?? 0}
      </span>
      {etat?.gratuit_dispo && <span className={s.gratuit}>1 booster offert</span>}
      <span className={s.pseudo}>{profil?.pseudo ?? "Mon compte"}</span>
    </Link>
    </div>
  );
}
