"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { compteChange, useCompte } from "@/lib/compte";
import { JETON, jetons } from "@/lib/jetons";
import s from "./page.module.css";

function attente(iso?: string) {
  if (!iso) return "";
  const ms = Math.max(0, new Date(iso).getTime() - Date.now());
  const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4);
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

// Le booster du compte : le serveur tire les cartes, puis l'ouverture HOLO les révèle.
export default function BoosterCompte() {
  const { pret, session, etat } = useCompte();
  const [deck, setDeck] = useState<string[] | null>(null);
  const [recap,setRecap] = useState(false);
  const storageKey = session ? "zk-ouverture-"+session.user.id : "";
  useEffect(()=>{
    if(!storageKey)return;
    try{const saved=JSON.parse(sessionStorage.getItem(storageKey)??"null");if(Array.isArray(saved)&&saved.length===10&&saved.every(x=>typeof x==="string"))setDeck(saved);}catch{}
  },[storageKey]);
  const [ouverture, setOuverture] = useState(false);
  const [erreur, setErreur] = useState("");
  const [, tic] = useState(0);

  // « Ouvrir un autre booster » dans la scène : retour à l'écran du compte
  useEffect(() => {
    const ecoute = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "zk:encore") { try{sessionStorage.removeItem(storageKey)}catch{} setRecap(false);setDeck(null); compteChange(); }
    };
    window.addEventListener("message", ecoute);
    const t = setInterval(() => tic(x => x + 1), 30000);
    return () => { window.removeEventListener("message", ecoute); clearInterval(t); };
  }, [storageKey]);

  async function ouvrir() {
    setOuverture(true); setErreur("");
    const requestKey=storageKey+"-demande";
    let requestId=crypto.randomUUID() as string;
    try{requestId=localStorage.getItem(requestKey)||requestId;localStorage.setItem(requestKey,requestId)}catch{}
    let result=await supabase().rpc("zenkai_ouvrir",{demande_id:requestId});
    // Compatibility with deployments where the ledger migration is still pending.
    if(result.error?.code==="PGRST202")result=await supabase().rpc("ouvrir_booster");
    const {data,error}=result;
    setOuverture(false);
    if (error) { setErreur(error.message.includes("aucun jeton") ? "Plus de booster offert aujourd'hui, et pas de jeton." : "L'ouverture n'a pas marché. Réessaie."); compteChange(); return; }
    const cartes=(data as { cartes: string[] }).cartes;
    try{sessionStorage.setItem(storageKey,JSON.stringify(cartes))}catch{}
    try{localStorage.removeItem(requestKey)}catch{}
    setDeck(cartes);
    compteChange();
  }

  if (deck) {
    return (
      <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
        <div><button className="bouton-clair" onClick={()=>setRecap(!recap)}>{recap?"Rejouer la révélation":"Tout révéler"}</button> <Link className="bouton-clair" href="/cartes">Ma collection</Link></div>
        {recap ? <div style={{overflow:"auto",padding:16}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(115px,1fr))",gap:12}}>{deck.map((id,i)=><img key={i} src={"/booster/img/cards/"+id+"/full.webp"} alt={id} style={{width:"100%"}}/>)}</div><button className="bouton" onClick={()=>{try{sessionStorage.removeItem(storageKey)}catch{} setRecap(false);setDeck(null);compteChange()}}>Terminer</button></div> : <iframe className={s.scene} src={`/booster/index.html?embed=1&deck=${encodeURIComponent(deck.join(","))}`}
        title="Ouverture de ton booster HOLO" allow="autoplay; fullscreen" allowFullScreen />}</div>
    );
  }

  let contenu: React.ReactNode;
  if (!pret) contenu = null;
  else if (!session) {
    contenu = (<>
      <p className={s.ecranTitre}>Ton booster du jour t&apos;attend</p>
      <p className={s.ecranTexte}>Connecte-toi pour ouvrir un booster offert chaque jour et garder tes cartes.</p>
      <Link href="/connexion" className="bouton">Se connecter</Link>
    </>);
  } else if (etat?.gratuit_dispo) {
    contenu = (<>
      <p className={s.ecranTitre}>Ton booster offert est prêt</p>
      <p className={s.ecranTexte}>Dix cartes, d&apos;Éclat à Zenkai. Un booster offert par jour.</p>
      <button type="button" className="bouton" onClick={ouvrir} disabled={ouverture}>{ouverture ? "Préparation…" : "Ouvrir mon booster"}</button>
    </>);
  } else if ((etat?.jetons ?? 0) > 0) {
    contenu = (<>
      <p className={s.ecranTitre}>Encore un booster ?</p>
      <p className={s.ecranTexte}>Ton booster offert revient dans {attente(etat?.prochain_gratuit)}. Tu as {jetons(etat!.jetons)}.</p>
      <button type="button" className="bouton" onClick={ouvrir} disabled={ouverture}>{ouverture ? "Préparation…" : `Ouvrir pour 1 ${JETON.un}`}</button>
    </>);
  } else {
    contenu = (<>
      <p className={s.ecranTitre}>À demain pour ton prochain booster</p>
      <p className={s.ecranTexte}>Ton booster offert revient dans {attente(etat?.prochain_gratuit)}. Réussis des missions pour gagner des {JETON.plusieurs} et en ouvrir d&apos;autres.</p>
      <Link href="/missions" className="bouton">Gagner des {JETON.plusieurs}</Link>
    </>);
  }

  return (
    <div className={s.ecran}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/booster/img/booster.webp" alt="" className={s.paquet} />
      <div className={s.ecranTexteBloc}>
        {contenu}
        {erreur && <p className={s.erreur} role="alert">{erreur}</p>}
      </div>
    </div>
  );
}
