"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCompte } from "@/lib/compte";
import { jetons } from "@/lib/jetons";
import s from "./page.module.css";

type Carte = { id: string; anime: string; rarete: string; nom: string; special: string | null };
const RARETES = ["zenkai", "mirage", "spectre", "prisme", "eclat"] as const;
const LABEL: Record<string, string> = { eclat: "Éclat", prisme: "Prisme", spectre: "Spectre", mirage: "Mirage", zenkai: "Zenkai" };
const RANG: Record<string, number> = { zenkai: 0, mirage: 1, spectre: 2, prisme: 3, eclat: 4 };
const img = (id: string) => `/booster/img/cards/${id}/full.webp`;

export default function Collection() {
  const router = useRouter();
  const { pret, session, profil, etat } = useCompte();
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [miennes, setMiennes] = useState<Record<string, number>>({});
  const [charge, setCharge] = useState(false);
  const [anime, setAnime] = useState("tous");
  const [filtre, setFiltre] = useState<"toutes" | "possedees" | "manquantes">("toutes");
  const [vue, setVue] = useState<Carte | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!session) return;
    const sb = supabase();
    Promise.all([
      sb.from("cartes").select("id, anime, rarete, nom, special").eq("actif", true),
      sb.from("collection").select("carte_id, quantite"),
    ]).then(([c, m]) => {
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
    .sort((a, b) => a.anime.localeCompare(b.anime) || RANG[a.rarete] - RANG[b.rarete] || a.id.localeCompare(b.id)),
  [cartes, anime, filtre, miennes]);
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

  const [eu, sur] = total(cartes);
  return (
    <section className={s.page} aria-labelledby="col-titre">
      <header className={s.tete}>
        <div>
          <h1 id="col-titre" className={`affiche ${s.titre}`}>Mes cartes</h1>
          <p className={s.chapo}>{profil?.pseudo ? `${profil.pseudo} · ` : ""}{charge ? `${eu} cartes sur ${sur}` : "Chargement…"}{etat ? ` · ${jetons(etat.jetons)}` : ""}</p>
        </div>
        <div className={s.actions}>
          <Link href="/booster" className="bouton">{etat?.gratuit_dispo ? "Ouvrir mon booster offert" : "Booster"}</Link>
          <Link href="/missions" className="bouton-clair">Missions</Link>
          <button type="button" className="bouton-clair" onClick={async () => { await supabase().auth.signOut(); router.push("/"); }}>Se déconnecter</button>
        </div>
      </header>

      <div className={s.barre} role="toolbar" aria-label="Filtres">
        <div className={s.onglets}>
          {["tous", ...animes].map(a => {
            const [x, y] = total(a === "tous" ? cartes : cartes.filter(c => c.anime === a));
            return <button key={a} type="button" aria-pressed={anime === a} onClick={() => setAnime(a)}>{a === "tous" ? "Tous" : a} <span>{x}/{y}</span></button>;
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

      {RARETES.map(r => {
        const l = visibles.filter(c => c.rarete === r);
        if (!l.length) return null;
        const [x, y] = total(l);
        return (
          <div key={r} className={s.groupe}>
            <h2 className={`${s.rarete} ${s["r_" + r]}`}>{LABEL[r]} <span>{x}/{y}</span></h2>
            <ul className={s.grille}>
              {l.map(c => {
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
        );
      })}

      <dialog ref={dlg} className={s.vue} onClose={() => setVue(null)} onClick={e => { if (e.target === dlg.current) setVue(null); }}>
        {vue && (<>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(vue.id)} alt={`${vue.nom}, ${LABEL[vue.rarete]}`} />
          <p><strong>{vue.nom}</strong> · {vue.anime} · {LABEL[vue.rarete]}{miennes[vue.id] > 1 ? ` · ×${miennes[vue.id]}` : ""}</p>
          <Link href="/missions" className="bouton-clair">Missions</Link>
          <button type="button" className="bouton-clair" onClick={() => setVue(null)}>Fermer</button>
        </>)}
      </dialog>
    </section>
  );
}
