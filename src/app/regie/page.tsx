"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useCompte} from "@/lib/compte";
import {supabase} from "@/lib/supabase";
import s from "@/components/EditionLive.module.css";
const phases=["preparation","vote","live","archives"];
const labels=["Préparation","Votes ouverts","Cérémonie","Résultats publiés"];
export default function Regie(){
 const {session,pret}=useCompte();
 const [autorise,setAutorise]=useState(false),[phase,setPhase]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;if(session)Promise.all([supabase().from("zenkai_equipe").select("membre").eq("membre",session.user.id).maybeSingle(),supabase().from("zenkai_editions").select("phase").eq("annee",2027).single()]).then(([a,b])=>{if(active){setAutorise(!!a.data);setPhase(b.data?.phase??"")}});return()=>{active=false}},[session]);
 const i=phases.indexOf(phase);
 async function avancer(){if(!window.confirm("Passer l’édition à l’étape « "+labels[i+1]+" » pour tous les visiteurs ?"))return;setBusy(true);try{const {error}=await supabase().rpc("zenkai_phase",{edition:2027,prochaine:phases[i+1]});if(error)setMessage(error.message);else{setPhase(phases[i+1]);setMessage("Édition mise à jour.")}}finally{setBusy(false)}}
 async function exporter(){const {data,error}=await supabase().rpc("zenkai_resultats",{edition:2027});if(error){setMessage(error.message);return}const lignes=(data??[]).map((r:{categorie:string;nomine:string;voix:number})=>[r.categorie,r.nomine,r.voix].join(","));const url=URL.createObjectURL(new Blob([["categorie,nomine,voix",...lignes].join("\n")],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="zenkai-2027-resultats.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className={s.panel}><h1 className="affiche">Régie 2027</h1>{!pret?"Chargement…":!session?<Link href="/connexion?retour=regie">Se connecter</Link>:!autorise?<p>Accès réservé à l’équipe de l’édition.</p>:<><h2>{labels[i]}</h2>{i>=0&&i<3&&<button className="bouton" disabled={busy} onClick={avancer}>Passer à « {labels[i+1]} »</button>}{i===3&&<button className="bouton" onClick={exporter}>Exporter le palmarès CSV</button>}<p role="status">{message}</p></>}</section>
}
