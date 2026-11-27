"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCompte } from "@/lib/compte";
import { jetons } from "@/lib/jetons";
import s from "./page.module.css";
import Coffre, { type Carte } from "./Coffre";

export default function Collection() {
  const router = useRouter();
  const { pret, session, profil, etat } = useCompte();
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [miennes, setMiennes] = useState<Record<string, number>>({});
  const [charge, setCharge] = useState(false);
  const [erreurInventaire, setErreurInventaire] = useState(false);
  const [essai, reessayer] = useState(0);
  const [ordre,setOrdre] = useState<Record<string,string>>({});
  const [message,setMessage] = useState("");
  const recorded = session?.user.user_metadata?.vitrine;
  const cover: string[] = Array.isArray(recorded) ? recorded.filter((id:unknown)=>typeof id==="string").slice(0,3) : [];
  async function toggleCover(id:string){
    const next=cover.includes(id)?cover.filter(x=>x!==id):[...cover,id];
    if(next.length>3){setMessage("Ta vitrine est pleine (3 cartes) : retires-en une d’abord.");return;}
    const {error}=await supabase().auth.updateUser({data:{vitrine:next}});
    setMessage(error?"La vitrine n’a pas pu être enregistrée.":"Vitrine enregistrée.");
  }

  useEffect(() => {
    if (!session) return;
    let active = true;
    const sb = supabase();
    Promise.all([
      sb.from("cartes").select("id, anime, rarete, nom, special, actif"),
      sb.from("collection").select("*"),
      sb.from("zenkai_ouvertures").select("obtenu,resultat").order("obtenu",{ascending:false}).limit(1000),
    ]).then(([c, m, journal]) => {
      if (!active) return;
      setErreurInventaire(Boolean(c.error || m.error));
      if (c.error || m.error) return;
      const dates:Record<string,string>=Object.fromEntries((m.data??[]).map(row=>[row.carte_id,String(row.obtenue_le??row.obtenu_le??row.created_at??"")]));
      for(const opening of [...(journal.data??[])].reverse()){
        for(const id of opening.resultat.cartes) {
          if (!dates[id] || opening.obtenu < dates[id]) dates[id] = opening.obtenu;
        }
      }
      setOrdre(dates);
      const owned=new Set((m.data??[]).map(row=>row.carte_id));
      setCartes((c.data??[]).filter(row=>row.actif||owned.has(row.id)));
      setMiennes(Object.fromEntries(((m.data as { carte_id: string; quantite: number }[]) ?? []).map(r => [r.carte_id, r.quantite])));
      setCharge(true);
    });
    return () => { active = false; };
  }, [session, essai]);

  if (pret && !session) {
    return (
      <section className={s.page}>
        <div className={s.vide}>
          <h1 className={`affiche ${s.titre}`}>Ma collection</h1>
          <p>Connecte-toi pour retrouver tes cartes et ouvrir ton booster offert du jour.</p>
          <Link href="/connexion" className="bouton">Se connecter</Link> <Link href="/booster" className="bouton-clair">Ouvrir un booster</Link>
        </div>
      </section>
    );
  }

  async function premiere(id: string) {
    const next = [id, ...cover.filter(x => x !== id)];
    const { error } = await supabase().auth.updateUser({ data: { vitrine: next } });
    setMessage(error ? "Modification indisponible." : "Carte placée en première position.");
  }

  return (
    <Coffre cartes={cartes} miennes={miennes} ordre={ordre} pseudo={profil?.pseudo}
      sousTitre={etat ? jetons(etat.jetons) : undefined}
      couverture={cover} onCouverture={toggleCover} onPremiere={premiere} message={message}
      actions={<>
        <Link href="/booster">{etat?.gratuit_dispo ? "Ouvrir mon booster offert" : "Booster"}</Link>
        <Link href="/missions">Missions</Link>
        <Link href="/amis">Mes amis</Link>
        <button type="button" onClick={async () => { await supabase().auth.signOut(); router.push("/"); }}>Se déconnecter</button>
      </>}
      etat={<>
        {!charge && !erreurInventaire && <p className={s.chargement}>Chargement de ta collection…</p>}
        {erreurInventaire && <p role="alert" className={s.chargement}>Impossible de charger tes cartes. <button className="bouton-clair" onClick={() => reessayer(essai + 1)}>Réessayer</button></p>}
        {!erreurInventaire && charge && Object.keys(miennes).length === 0 && (
          <p className={s.chargement}>Ta collection est vide pour l&apos;instant. <Link href="/booster">Ouvre ton booster offert</Link> pour tes premières cartes.</p>)}
      </>}
    />
  );
}
