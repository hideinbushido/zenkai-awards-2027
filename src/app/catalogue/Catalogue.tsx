"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { variantesAnimees } from "@/data/variantes";
import s from "./catalogue.module.css";
type Card={id:string;name:string;anime:string;rarity:string;special:string|null};
const tiers:Record<string,string>={eclat:"Éclat",prisme:"Prisme",spectre:"Spectre",mirage:"Mirage",zenkai:"Zenkai"};
const image=(id:string)=>"/booster/img/cards/"+id+"/full.webp";
const normal=(x:string)=>x.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export default function Catalogue({cards}:{cards:Card[]}){
 const [query,search]=useState(""),[series,filterSeries]=useState(""),[tier,filterTier]=useState("");
 const [selected,select]=useState<Card|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const visible=cards.filter(c=>(!series||c.anime===series)&&(!tier||c.rarity===tier)&&normal(c.name+" "+c.id+" "+(c.special??"")).includes(normal(query)));
 useEffect(()=>{if(selected)dialog.current?.showModal();else dialog.current?.close()},[selected]);
 return <main className={s.page}><header><p>Collection · Édition Holo</p><h1>Le catalogue</h1><p>{cards.length} cartes à découvrir</p><Link href="/booster" className="bouton">Ouvrir un booster</Link> <Link href="/cartes" className="bouton-clair">Ma collection</Link></header>
 <section className={s.filters} aria-label="Rechercher des cartes"><label>Personnage ou variante<input type="search" value={query} onChange={e=>search(e.target.value)} placeholder="Ex. Mei Kinosaki"/></label><label>Série<select value={series} onChange={e=>filterSeries(e.target.value)}><option value="">Toutes les séries</option>{[...new Set(cards.map(c=>c.anime))].map(x=><option key={x}>{x}</option>)}</select></label><label>Rareté<select value={tier} onChange={e=>filterTier(e.target.value)}><option value="">Toutes les raretés</option>{Object.entries(tiers).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></section>
 <p role="status">{visible.length} résultat{visible.length>1?"s":""}</p><div className={s.grid}>{visible.map(c=><button key={c.id} onClick={()=>select(c)}><img src={image(c.id)} alt="" loading="lazy" width="252" height="352"/><strong>{c.name}</strong><small>{tiers[c.rarity]}{c.special?" · "+c.special:""}</small></button>)}</div>
 <dialog className={s.detail} ref={dialog} onClose={()=>select(null)} onClick={e=>{if(e.target===dialog.current)select(null)}}>{selected&&<article><button autoFocus onClick={()=>select(null)}>Fermer</button>{variantesAnimees.has(selected.id)?<video playsInline loop muted controls preload="none" poster={image(selected.id)} src={"/booster/variantes/"+selected.id+".mp4"}/>:<img src={image(selected.id)} alt={selected.name}/>}<h2>{selected.name}</h2><p>{selected.anime} · {tiers[selected.rarity]} · {selected.id}</p></article>}</dialog></main>
}
