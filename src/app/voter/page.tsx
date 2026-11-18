import type { Metadata } from "next";
import Link from "next/link";
import TitreAnime from "@/components/TitreAnime";
import FondShader from "@/components/webgl/FondShader";
import { EDITION } from "@/data/edition";
import s from "./page.module.css";

export const metadata: Metadata = { title: "Voter · Zenkai Anime Awards 2027" };

const ETAPES = [
  "Tu entres ton prénom et ton email.",
  "Tu reçois un lien d'accès personnel, valable 24 heures.",
  "Tu ouvres les boosters un par un, tu gardes une carte ou tu passes.",
  "Tu valides ton classeur. Une voix par adresse, définitive.",
];

// Page de vote : fermée jusqu'en mars. Le ticket d'accès annonce l'ouverture.
export default function Voter() {
  return (
    <section className={s.page} aria-labelledby="voter-titre">
      <FondShader className={s.fond} clair intensite={0.9} />
      <div className={s.texte}>
        <TitreAnime as="h1" id="voter-titre" className={`affiche ${s.titre}`}>Les boosters ouvrent en mars</TitreAnime>
        <p className={s.chapo}>
          Le vote sera ouvert en {EDITION.votes.toLowerCase()}. En attendant, parcours les catégories et repère les boosters que tu voudras ouvrir.
        </p>
        <ol className={s.etapes}>
          {ETAPES.map((e, i) => <li key={i}><span>{i + 1}</span>{e}</li>)}
        </ol>
        <div className={s.actions}>
          <Link href="/categories" className="bouton">Parcourir les catégories</Link>
          <Link href="/faq" className="bouton-clair">Règlement</Link>
        </div>
      </div>

      {/* Ticket d'accès holo */}
      <div className={s.ticket} aria-label="Ticket d'accès au vote">
        <div className={s.ticketHaut}>
          <p className={s.marque}>Zenkai Anime Awards</p>
          <p className={s.edition}>Édition 2 · 2027</p>
        </div>
        <div className={s.ticketMilieu}>
          <div><p className={s.lab}>Ouverture</p><p className={s.val}>Mars 2027</p></div>
          <div><p className={s.lab}>Fermeture</p><p className={s.val}>Avril 2027</p></div>
          <div><p className={s.lab}>Boosters</p><p className={s.val}>25</p></div>
          <div><p className={s.lab}>Live</p><p className={s.val}>{EDITION.live}</p></div>
        </div>
        <div className={s.ticketBas}>
          <p className={s.statut}>Accès bientôt disponible</p>
          <span className={s.codebarre} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
