"use client";

import { useState, type FormEvent } from "react";
import s from "./Rappel.module.css";

// Inscription au rappel d'ouverture des votes (démo : rien n'est envoyé).
export default function Rappel() {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<"repos" | "erreur" | "ok">("repos");

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEtat("erreur");
      return;
    }
    setEtat("ok");
  };

  if (etat === "ok") {
    return (
      <p className={s.ok} role="status">
        C&apos;est noté pour <strong>{email.trim()}</strong> : tu recevras un email à l&apos;ouverture des votes. (Démo : rien n&apos;a été envoyé.)
      </p>
    );
  }

  return (
    <form className={s.form} onSubmit={envoyer} noValidate>
      <label htmlFor="rappel-email" className={s.label}>Ton email, pour être prévenu à l&apos;ouverture</label>
      <div className={s.ligne}>
        <input
          id="rappel-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="toi@exemple.fr"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (etat === "erreur") setEtat("repos"); }}
          aria-invalid={etat === "erreur"}
          aria-describedby={etat === "erreur" ? "rappel-erreur" : undefined}
          className={s.champ}
        />
        <button type="submit" className={s.bouton}>Me prévenir</button>
      </div>
      {etat === "erreur" && (
        <p id="rappel-erreur" className={s.erreur}>Cette adresse ne semble pas complète. Vérifie qu&apos;elle contient un @ et un domaine.</p>
      )}
    </form>
  );
}
