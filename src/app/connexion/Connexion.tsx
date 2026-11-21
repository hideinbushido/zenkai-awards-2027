"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCompte } from "@/lib/compte";
import s from "./page.module.css";

type Fournisseur = "discord" | "google";

export default function Connexion() {
  const router = useRouter();
  const { session } = useCompte();
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<"" | "envoi" | "envoye" | "erreur">("");
  const [message, setMessage] = useState("");

  // déjà connecté : direction ses cartes
  useEffect(() => { if (session) router.replace("/cartes"); }, [session, router]);

  const retour = () => `${window.location.origin}/booster`;

  async function oauth(f: Fournisseur) {
    setMessage("");
    const { error } = await supabase().auth.signInWithOAuth({ provider: f, options: { redirectTo: retour() } });
    if (error) { setEtat("erreur"); setMessage("Cette connexion n'est pas encore disponible. Utilise ton e-mail en attendant."); }
  }

  async function parEmail(e: React.FormEvent) {
    e.preventDefault();
    setEtat("envoi"); setMessage("");
    const { error } = await supabase().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: retour() } });
    if (error) {
      setEtat("erreur");
      setMessage(error.status === 429 ? "Trop de demandes d'un coup. Réessaie dans quelques minutes." : "L'envoi n'a pas marché. Vérifie l'adresse et réessaie.");
    } else setEtat("envoye");
  }

  return (
    <section className={s.page} aria-labelledby="connexion-titre">
      <div className={s.carte}>
        <h1 id="connexion-titre" className={`affiche ${s.titre}`}>Ton compte Zenkai</h1>
        <p className={s.chapo}>Un booster offert chaque jour, ta collection de cartes gardée d&apos;une visite à l&apos;autre.</p>

        <div className={s.boutons}>
          <button type="button" className={`${s.oauth} ${s.discord}`} onClick={() => oauth("discord")}>
            <svg viewBox="0 0 24 24" aria-hidden width="20" height="20"><path fill="currentColor" d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18.2 18.2 0 0 0-5.6 0L8.6 3a19.5 19.5 0 0 0-4.9 1.5C.6 9 0 13.6.3 18.1A19.7 19.7 0 0 0 6.3 21l1.3-2a12.8 12.8 0 0 1-2-1l.5-.4a14 14 0 0 0 11.8 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.6 19.6 0 0 0 6-3c.4-5.2-.7-9.8-3.4-13.7ZM8.7 15.4c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4Zm6.6 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4Z"/></svg>
            Continuer avec Discord
          </button>
          <button type="button" className={`${s.oauth} ${s.google}`} onClick={() => oauth("google")}>
            <svg viewBox="0 0 24 24" aria-hidden width="20" height="20"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z"/></svg>
            Continuer avec Google
          </button>
        </div>

        <div className={s.ou}><span>ou par e-mail</span></div>

        {etat === "envoye" ? (
          <p className={s.ok} role="status">C&apos;est envoyé. Ouvre l&apos;e-mail reçu à <strong>{email}</strong> et clique sur le lien pour te connecter.</p>
        ) : (
          <form className={s.form} onSubmit={parEmail}>
            <label htmlFor="email" className={s.label}>Ton adresse e-mail</label>
            <input id="email" type="email" required autoComplete="email" inputMode="email" placeholder="toi@exemple.com"
              value={email} onChange={e => setEmail(e.target.value)} className={s.champ} />
            <button type="submit" className="bouton" disabled={etat === "envoi"}>
              {etat === "envoi" ? "Envoi…" : "Recevoir mon lien de connexion"}
            </button>
          </form>
        )}
        {message && <p className={s.erreur} role="alert">{message}</p>}
      </div>
    </section>
  );
}
