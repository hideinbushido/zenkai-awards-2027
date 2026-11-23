import { Suspense } from "react";
import Link from "next/link";
export default function Page({searchParams}:PageProps<"/vitrine">){return <Suspense fallback={null}><Vitrine params={searchParams}/></Suspense>}
async function Vitrine({params}:{params:PageProps<"/vitrine">["searchParams"]}){
  const raw=(await params).cartes;
  const ids=typeof raw==="string"?raw.split(",").filter(id=>/^[A-Za-z0-9_-]{1,48}$/.test(id)).slice(0,3):[];
  return <main style={{padding:"8vh 6vw"}}><h1 className="affiche">Vitrine de cartes</h1><div style={{display:"flex",gap:"2vw",marginBlock:"4vh"}}>{ids.map((id,i)=><img key={i} src={"/booster/img/cards/"+id+"/full.webp"} alt={id} style={{width:"28%",maxWidth:320,objectFit:"contain"}}/>)}</div><Link href="/cartes" className="bouton">Ma collection</Link></main>;
}
