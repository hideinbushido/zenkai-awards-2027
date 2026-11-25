"use client";
import { useEffect, useRef, useState } from "react";
import Ruban from "./Ruban";
import Decode from "./Decode";
import Link from "next/link";
import { NOMINES_2027 } from "@/data/nomines2027";
import { garderCarte, useCollection } from "@/lib/collection";
import { CATEGORIES } from "@/data/edition";
import s from "./OpeningStage.module.css";

const art: Record<string,string> = {
  "bleach-ibull":"BLEACH", "black-clover":"BLACKCLOVER", ignis:"FIREforce",
  "hells-paradise":"HELLSParadise", "marriage-toxin":"MARRIAGETOXIC"
};
const featured = NOMINES_2027.opening.filter(n => art[n.id]);

export default function OpeningStage({ category }: { category?: string }) {
  const gallery = !!category;
  const group = CATEGORIES.find(c => c.id === category);
  const following = CATEGORIES[CATEGORIES.findIndex(c => c.id === category)+1];
  const entries = category ? NOMINES_2027[category] : featured;
  const [index,setIndex] = useState(0);
  const [grid,setGrid] = useState(false);
  const [muted,setMuted] = useState(true);
  const [playing,setPlaying] = useState(false);
  const [petit,setPetit] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const touch = useRef<number | null>(null);
  const bulletin = useCollection();
  const current = entries[index];
  const file = (!category || category==="opening") ? art[current.id] : undefined;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPlaying(!matchMedia("(prefers-reduced-motion: reduce)").matches);
      setPetit(innerWidth < 900);
      if (!gallery) {
        let previous = "";
        try { previous = sessionStorage.getItem("zenkai-vedette") || ""; } catch {}
        const pool = entries.filter(n => n.id !== previous);
        const selected = pool[Math.floor(Math.random()*pool.length)];
        setIndex(entries.indexOf(selected));
        try { sessionStorage.setItem("zenkai-vedette",selected.id); } catch {}
      }
    });
    return () => cancelAnimationFrame(frame);
  },[entries,gallery]);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let active = true;
    if (playing && !grid) el.play().catch(() => { if(active) setPlaying(false); });
    else el.pause();
    return () => { active = false; };
  },[current.id,playing,grid]);
  function advance(step:number) {
    setIndex(i => (i+step+entries.length)%entries.length);
  }
  return <section onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();advance(e.key==="ArrowLeft"?-1:1)}}} className={s.stage} data-gallery={gallery} data-plein-ecran={gallery?undefined:""} aria-label={gallery?group?.titre:"ZENKAI Anime Awards 2027"}>
    <video ref={video} className={s.movie} src={petit && art[current.id] && current.video ? current.video.replace("/openings/","/openings/720/") : current.video} poster={current.img} muted={muted} playsInline preload="metadata" onEnded={()=>advance(1)} />
    <div className={s.layout}>
      <div className={s.copy}>
        {gallery ? <><Link href="/categories">← Catégories</Link><h1>{group?.titre}</h1></> : <>
          <div className={s.brand}><img src="/visuels/logo-zenkai-or.png" alt="" /><Decode as="h1" texte="ZENKAI" duree={1.2} delai={0.15} /></div>
          <p className={s.edition}><Decode texte="Anime Awards" duree={1} delai={0.45} /> <i><Decode texte="2027" duree={0.7} delai={0.9} /></i></p></>}
        <div className={s.actions}>{gallery ? <>
          <button onClick={()=>garderCarte(category!,current.id)}>{bulletin[category!]===current.id?"Dans mon bulletin":"Ajouter à mon bulletin"}</button>
          <Link href="/collection">Mon bulletin</Link>{following && <Link href={"/categories/"+following.id}>Catégorie suivante →</Link>}</> : <>
          <Link href="/categories/opening">Découvrir les nominés</Link><Link href="/booster">Ouvrir un booster</Link></>}</div>
      </div>
      {gallery ? <Ruban entries={entries} index={index} onSelect={setIndex} images={entries.map(n=>category==="opening"&&art[n.id]?"/nominations/"+art[n.id]+"-opening.webp":n.img)}/> : <div className={s.deck}>
      <figure className={s.card} data-foil={!!file} key={current.id} onPointerDown={e=>{touch.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{
        if(touch.current===null || matchMedia("(prefers-reduced-motion: reduce)").matches)return;
        const drag=Math.max(-75,Math.min(75,e.clientX-touch.current));
        e.currentTarget.style.transform=`perspective(900px) translateX(${drag*.48}px) rotateY(${drag*.16}deg) rotateZ(${drag*.028}deg)`;
      }} onPointerCancel={e=>{touch.current=null;e.currentTarget.style.transform=""}} onPointerUp={e=>{
        const delta=touch.current===null?0:e.clientX-touch.current;touch.current=null;e.currentTarget.style.transform="";if(Math.abs(delta)>40)advance(delta<0?1:-1);
      }}>
        <img draggable={false} src={file?"/nominations/"+file+"-opening.webp":current.img} alt={file?"Carte Zenkai · "+current.nom:current.nom} />
      </figure></div>}
    </div>
    <footer className={s.controls}><div aria-live="polite"><strong>{current.nom}</strong><br/>{current.detail}</div>
      <button aria-label="Opening précédent" onClick={()=>advance(-1)}>←</button><span>{index+1} / {entries.length}</span><button aria-label="Opening suivant" onClick={()=>advance(1)}>→</button>
      {current.video && <><button onClick={()=>setMuted(!muted)}>{muted?"Activer le son":"Couper le son"}</button>
      <button onClick={()=>setPlaying(!playing)}>{playing?"Pause":"Lecture"}</button></>}
      {gallery && <button aria-expanded={grid} onClick={()=>setGrid(!grid)}>{grid?"Fermer la liste":"Tous les nominés"}</button>}
    </footer>
    {grid && <div className={s.index}>{entries.map((n,i)=><button key={n.id} aria-pressed={index===i} onClick={()=>{setIndex(i);setGrid(false)}}><img src={category==="opening" && art[n.id]?"/nominations/"+art[n.id]+"-opening.webp":n.img} alt="" loading="lazy"/><span>{n.nom}</span></button>)}</div>}
  </section>;
}
