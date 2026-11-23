"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { variantesAnimees } from "@/data/variantes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCompte } from "@/lib/compte";
import { jetons } from "@/lib/jetons";
import s from "./page.module.css";

type Carte = { id: string; anime: string; rarete: string; nom: string; special: string | null };

const LABEL: Record<string, string> = { eclat: "Éclat", prisme: "Prisme", spectre: "Spectre", mirage: "Mirage", zenkai: "Zenkai" };

const img = (id: string) => `/booster/img/cards/${id}/full.webp`;

export default function Collection() {
  const router = useRouter();
  const { pret, session, profil, etat } = useCompte();
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [miennes, setMiennes] = useState<Record<string, number>>({});
  const [charge, setCharge] = useState(false);
  const [anime, setAnime] = useState("tous");
  const [filtre, setFiltre] = useState<"toutes" | "possedees" | "manquantes">("possedees");
  const [vue, setVue] = useState<Carte | null>(null);
  const [ordre,setOrdre] = useState<Record<string,string>>({});
  const [message,setMessage] = useState("");
  const recorded = session?.user.user_metadata?.vitrine;
  const cover: string[] = Array.isArray(recorded) ? recorded.filter((id:unknown)=>typeof id==="string").slice(0,3) : [];
  async function toggleCover(id:string){
    const next=cover.includes(id)?cover.filter(x=>x!==id):[...cover,id];
    if(next.length>3){setMessage("Retire une carte de ta couverture pour libérer une place.");return;}
    const {error}=await supabase().auth.updateUser({data:{vitrine:next}});
    setMessage(error?"La couverture n’a pas pu être enregistrée.":"Couverture enregistrée.");
  }
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!session) return;
    const sb = supabase();
    Promise.all([
      sb.from("cartes").select("id, anime, rarete, nom, special").eq("actif", true),
      sb.from("collection").select("*"),
    ]).then(([c, m]) => {
      setOrdre(Object.fromEntries((m.data??[]).map(row=>[row.carte_id,String(row.obtenue_le??row.obtenu_le??row.created_at??"")])));
      setCartes((c.data as Carte[]) ?? []);
      setMiennes(Object.fromEntries(((m.data as { carte_id: string; quantite: number }[]) ?? []).map(r => [r.carte_id, r.quantite])));
      setCharge(true);
    });
  }, [session]);

  useEffect(() => { if (vue) dlg.current?.showModal(); else dlg.current?.close(); }, [vue]);

  const animes = useMemo(() => [...new Set(cartes.map(c => c.anime))].sort(), [cartes]);
  const visibles = useMemo(() => cartes
    .filter(c => anime === "tous" || c.anime === anime)
    .filter(c => filtre === "toutes" || (filtre === "possedees") === !!miennes[c.id])
    .sort((a, b) => (ordre[b.id]??"").localeCompare(ordre[a.id]??"") || a.id.localeCompare(b.id)),
  [cartes, anime, filtre, miennes, ordre]);
  const total = (l: Carte[]) => [l.filter(c => miennes[c.id]).length, l.length] as const;

  if (pret && !session) {
    return (
      <section className={s.page}>
        <div className={s.vide}>
          <h1 className={`affiche ${s.titre}`}>Mes cartes</h1>
          <p>Connecte-toi pour retrouver tes cartes et ouvrir ton booster offert du jour.</p>
          <Link href="/connexion" className="bouton">Se connecter</Link>
        </div>
      </section>
    );
  }

  const [eu] = total(cartes);
  return (
    <section className={s.page} aria-labelledby="col-titre">
      <header className={s.tete}>
        <div>
          <h1 id="col-titre" className={`affiche ${s.titre}`}>Mes cartes</h1>
          <p className={s.chapo}>{profil?.pseudo ? `${profil.pseudo} · ` : ""}{charge ? `${eu} cartes différentes` : "Chargement…"}{etat ? ` · ${jetons(etat.jetons)}` : ""}</p>
        </div>
        <div className={s.actions}><Link href="/amis" className="bouton-clair">Mes amis</Link>
          <Link href="/booster" className="bouton">{etat?.gratuit_dispo ? "Ouvrir mon booster offert" : "Booster"}</Link>
          <Link href="/missions" className="bouton-clair">Missions</Link>
          <button type="button" className="bouton-clair" onClick={async () => { await supabase().auth.signOut(); router.push("/"); }}>Se déconnecter</button>
        </div>
      </header>

      <section className={s.vitrine}><h2>Ma couverture</h2><div>{cover.filter(id=>miennes[id]).map(id=><button key={id} onClick={()=>setVue(cartes.find(c=>c.id===id)??null)}><img src={img(id)} alt={cartes.find(c=>c.id===id)?.nom??id}/></button>)}</div>
      {cover.length===0 && <p>Ouvre une carte de ta collection pour l’exposer ici.</p>}
      {cover.length>0 && <Link href={"/vitrine?cartes="+encodeURIComponent(cover.join(","))}>Voir ma vitrine partageable ↗</Link>}</section>
      <div className={s.barre} role="toolbar" aria-label="Filtres">
        <div className={s.onglets}>
          {["tous", ...animes].map(a => {
            
            return <button key={a} type="button" aria-pressed={anime === a} onClick={() => setAnime(a)}>{a === "tous" ? "Tous" : a}</button>;
          })}
        </div>
        <div className={s.onglets}>
          {(["toutes", "possedees", "manquantes"] as const).map(f => (
            <button key={f} type="button" aria-pressed={filtre === f} onClick={() => setFiltre(f)}>
              {f === "toutes" ? "Toutes" : f === "possedees" ? "Obtenues" : "Manquantes"}
            </button>))}
        </div>
      </div>

      {charge && eu === 0 && (
        <p className={s.astuce}>Ta collection est vide pour l&apos;instant. <Link href="/booster">Ouvre ton booster offert</Link> pour tes premières cartes.</p>
      )}

      <div className={s.groupe}>
            <ul className={s.grille}>
              {visibles.map(c => {
                const q = miennes[c.id];
                return (
                  <li key={c.id}>
                    {q ? (
                      <button type="button" className={s.carte} onClick={() => setVue(c)} aria-label={`${c.nom}, ${LABEL[c.rarete]}${q > 1 ? `, ${q} exemplaires` : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img(c.id)} alt="" loading="lazy" />
                        {q > 1 && <span className={s.qte}>×{q}</span>}
                      </button>
                    ) : (
                      <div className={`${s.carte} ${s.manque}`} aria-label={`Carte manquante, ${LABEL[c.rarete]}`}>
                        <span>?</span><small>{c.anime}</small>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

      <dialog ref={dlg} className={s.vue} onClose={() => setVue(null)} onClick={e => { if (e.target === dlg.current) setVue(null); }}>
        {vue && (<>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {variantesAnimees.has(vue.id) ? <video controls loop playsInline muted preload="none" poster={img(vue.id)} src={"/booster/variantes/"+vue.id+".mp4"} style={{maxHeight:"58svh",maxWidth:"100%"}}/> : <img src={img(vue.id)} alt={`${vue.nom}, ${LABEL[vue.rarete]}`} />}
          <p><strong>{vue.nom}</strong> · {vue.anime} · {LABEL[vue.rarete]}{miennes[vue.id] > 1 ? ` · ×${miennes[vue.id]}` : ""}</p>
          <button className="bouton" onClick={()=>toggleCover(vue.id)}>{cover.includes(vue.id)?"Retirer de la couverture":"Exposer sur ma couverture"}</button><p role="status">{message}</p>
          <button type="button" className="bouton-clair" onClick={() => setVue(null)}>Fermer</button>
        </>)}
      </dialog>
    </section>
  );
}
