"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {useCompte} from "@/lib/compte";
import s from "@/components/EditionLive.module.css";
type Ami={id:string;pseudo:string;entrant:boolean;accepte:boolean;couverture:string[]};
export default function Amis(){
  const {session,pret}=useCompte();
  const [amis,setAmis]=useState<Ami[]>([]);
  const [code,setCode]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const charger=useCallback(async()=>{
    if(!session)return;
    const {data,error}=await supabase().rpc("zenkai_amis");
    if(error){setMessage("Les amitiés sont temporairement indisponibles.");return}
    setAmis(data??[]);
  },[session]);
  useEffect(()=>{void charger()},[charger]);
  async function agir(action:"inviter"|"accepter"|"retirer",ami?:Ami){
    if(!session||busy)return;
    setBusy(true);setMessage("");
    try{
      const table=supabase().from("zenkai_amities");
      const id=session.user.id;
      const pair={demandeur:ami?.entrant?ami.id:id,destinataire:ami?.entrant?id:ami?.id};
      const result=action==="inviter"?await table.insert({demandeur:id,destinataire:code.trim()}):
        action==="accepter"?await table.update({accepte:true}).match(pair):await table.delete().match(pair);
      if(result.error){setMessage("Action impossible. Vérifie le code et les invitations existantes.");return}
      setCode("");await charger();setMessage(action==="inviter"?"Invitation enregistrée.":"Liste mise à jour.");
    }finally{setBusy(false)}
  }
  return <section className={s.panel}><h1 className="affiche">Mes amis</h1>{!pret?<p>Chargement…</p>:!session?<Link href="/connexion?retour=amis" className="bouton">Me connecter</Link>:<>
    <p>Partage ton code avec un ami pour lui montrer ta couverture.</p><code>{session.user.id}</code>
    <form onSubmit={e=>{e.preventDefault();void agir("inviter")}}><label>Code de ton ami <input value={code} required pattern="[0-9a-fA-F-]{36}" onChange={e=>setCode(e.target.value)}/></label> <button className="bouton" disabled={busy}>Inviter</button></form>
    {amis.map(a=><article key={a.id}><h2>{a.pseudo}</h2>{a.accepte?<div>{(Array.isArray(a.couverture)?a.couverture:[]).filter(id=>typeof id==="string"&&/^[a-z0-9-]+$/i.test(id)).slice(0,3).map(id=><img key={id} alt={id} src={"/booster/img/cards/"+id+"/full.webp"} width="110"/>)}</div>:a.entrant?<button className="bouton" disabled={busy} onClick={()=>agir("accepter",a)}>Accepter</button>:<p>Invitation en attente</p>}
    <button className="bouton-clair" disabled={busy} onClick={()=>agir("retirer",a)}>{a.accepte?"Retirer":a.entrant?"Décliner":"Annuler"}</button></article>)}<p role="status">{message}</p><Link href="/cartes">Ma collection</Link></>}</section>;
}
