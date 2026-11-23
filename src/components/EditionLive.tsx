"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCompte } from "@/lib/compte";
import { useCollection } from "@/lib/collection";
import { CATEGORIES } from "@/data/edition";
import { NOMINES_2027 } from "@/data/nomines2027";
import s from "./EditionLive.module.css";

type Phase = "preparation"|"vote"|"live"|"archives";
type Resultat = {categorie:string;nomine:string;voix:number};
export default function EditionLive({ compact=false }: {compact?:boolean}) {
  const [phase,setPhase]=useState<Phase>("preparation");
  const [resultats,setResultats]=useState<Resultat[]>([]);
  const [recu,setRecu]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const {session}=useCompte();
  const choix=useCollection();
  useEffect(()=>{
    let actif=true;
    const sb=supabase();
    async function charger(){
      const {data}=await sb.from("zenkai_editions").select("phase").eq("annee",2027).maybeSingle();
      if(!actif||!data)return;
      setPhase(data.phase);
      if(data.phase==="archives"&&!compact){
        const r=await sb.rpc("zenkai_resultats",{edition:2027});
        if(actif && !r.error)setResultats(r.data??[]);
      }
    }
    charger();const timer=setInterval(charger,60000);
    return ()=>{actif=false;clearInterval(timer)};
  },[compact]);
  useEffect(()=>{
    let active=true;
    if(session)supabase().from("zenkai_bulletins").select("soumis").eq("annee",2027).eq("membre",session.user.id).maybeSingle().then(({data})=>{if(active)setRecu(data?.soumis??"")});
    return ()=>{active=false};
  },[session]);
  async function voter(){
    setBusy(true);
    try{
      const {data,error}=await supabase().rpc("zenkai_voter",{edition:2027,bulletin:choix});
      if(error){setMessage(error.message);return}
      setRecu(String(data));setMessage("");
    }finally{setBusy(false)}
  }
  const titre={preparation:"Prépare ton bulletin",vote:"Les votes sont ouverts",live:"La cérémonie en direct",archives:"Palmarès 2027"}[phase];
  return <section className={s.panel}><p>Zenkai Anime Awards · Édition 2027</p><h2>{titre}</h2>
    {compact?<Link className="bouton" href="/voter">{phase==="archives"?"Voir les résultats":"Accéder à l’édition"}</Link>:<>
    {phase==="preparation"&&<p>Votes prévus en mars–avril 2027. Tu peux déjà préparer tes choix sur cet appareil.</p>}
    {(phase==="preparation"||phase==="vote")&&<><Link className="bouton-clair" href="/collection">Revoir mon bulletin · {Object.keys(choix).length} / {CATEGORIES.length}</Link>
    {session&&recu?<p role="status">Bulletin enregistré le {new Date(recu).toLocaleString("fr-FR")}.</p>:phase==="vote"&&(session?<><p>La validation est définitive. Les catégories passées restent vides.</p><button className="bouton" disabled={busy||!Object.keys(choix).length} onClick={voter}>Valider définitivement mon bulletin</button></>:<Link className="bouton" href="/connexion?retour=voter">Me connecter pour voter</Link>)}</>}
    {phase==="live"&&<a className="bouton" href="https://www.tiktok.com/@ricokouame/live">Suivre le live</a>}
    {phase==="archives"&&CATEGORIES.map(c=>{
      const classement=resultats.filter(r=>r.categorie===c.id);
      if(!classement.length)return null;
      const scores=[...new Set(classement.map(r=>r.voix))].slice(0,3);
      return <article key={c.id}><h3>{c.titre}</h3>{classement.filter(r=>scores.includes(r.voix)).map(r=><p key={r.nomine}>{scores.indexOf(r.voix)+1}. {NOMINES_2027[c.id]?.find(n=>n.id===r.nomine)?.nom??r.nomine} · {r.voix} voix</p>)}</article>
    })}
    {message&&<p role="alert">{message}</p>}</>}</section>
}
