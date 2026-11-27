"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { variantesAnimees } from "@/data/variantes";
import { vuesCartes } from "@/data/vues";
import s from "./coffre.module.css";

export type Carte = { id: string; anime: string; rarete: string; nom: string; special: string | null };

export const RARETES = ["zenkai", "mirage", "spectre", "prisme", "eclat"] as const;
export const LABEL: Record<string, string> = { eclat: "Éclat", prisme: "Prisme", spectre: "Spectre", mirage: "Mirage", zenkai: "Zenkai" };
const RANG: Record<string, number> = { zenkai: 0, mirage: 1, spectre: 2, prisme: 3, eclat: 4 };
const imgDe = (c: Carte) => vuesCartes[c.id]?.[0]?.src ?? `/booster/img/cards/${c.id}/full.webp`;
const JOUR = 86_400_000;

type Tri = "recentes" | "rarete" | "anime" | "nom";
type Possession = "toutes" | "possedees" | "manquantes";

type Props = {
  cartes: Carte[];
  miennes: Record<string, number>;
  ordre: Record<string, string>;
  pseudo?: string;
  sousTitre?: string;
  actions?: ReactNode;
  couverture: string[];
  onCouverture: (id: string) => void;
  onPremiere: (id: string) => void;
  message?: string;
  etat?: ReactNode;
};

// Inclinaison 3D + reflet qui suivent le pointeur (variables CSS, aucun rendu React).
function incliner(e: PointerEvent<HTMLElement>, force = 1) {
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--rx", `${(0.5 - y) * 16 * force}deg`);
  el.style.setProperty("--ry", `${(x - 0.5) * 20 * force}deg`);
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
  el.dataset.survol = "";
}
function relacher(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
  delete el.dataset.survol;
}

export default function Coffre({ cartes, miennes, ordre, pseudo, sousTitre, actions, couverture, onCouverture, onPremiere, message, etat }: Props) {
  const [anime, setAnime] = useState("tous");
  const [rarete, setRarete] = useState<string | null>(null);
  const [possession, setPossession] = useState<Possession>("possedees");
  const [tri, setTri] = useState<Tri>("recentes");
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<string | null>(null);   // carte animée sous le pointeur : on lance sa vidéo

  const animes = useMemo(() => [...new Set(cartes.map(c => c.anime))].sort(), [cartes]);
  const possedees = useMemo(() => cartes.filter(c => miennes[c.id]), [cartes, miennes]);
  const parRarete = useMemo(() => Object.fromEntries(RARETES.map(r => [r, [
    possedees.filter(c => c.rarete === r).length, cartes.filter(c => c.rarete === r).length]])), [cartes, possedees]);
  const [maintenant, setMaintenant] = useState(0);
  useEffect(() => { const f = requestAnimationFrame(() => setMaintenant(Date.now())); return () => cancelAnimationFrame(f); }, []);

  const visibles = useMemo(() => {
    const l = cartes
      .filter(c => anime === "tous" || c.anime === anime)
      .filter(c => !rarete || c.rarete === rarete)
      .filter(c => possession === "toutes" || (possession === "possedees") === !!miennes[c.id]);
    const parNom = (a: Carte, b: Carte) => a.nom.localeCompare(b.nom, "fr");
    return l.sort((a, b) =>
      tri === "rarete" ? RANG[a.rarete] - RANG[b.rarete] || parNom(a, b)
      : tri === "anime" ? a.anime.localeCompare(b.anime) || RANG[a.rarete] - RANG[b.rarete]
      : tri === "nom" ? parNom(a, b)
      : (ordre[b.id] ?? "").localeCompare(ordre[a.id] ?? "") || RANG[a.rarete] - RANG[b.rarete]);
  }, [cartes, anime, rarete, possession, tri, miennes, ordre]);

  const ouvrables = useMemo(() => visibles.filter(c => miennes[c.id]), [visibles, miennes]);
  const vue = ouverte ? cartes.find(c => c.id === ouverte) ?? null : null;
  const pas = useCallback((d: number) => {
    if (!ouverte) return;
    const i = ouvrables.findIndex(c => c.id === ouverte);
    const suivante = ouvrables[(i + d + ouvrables.length) % ouvrables.length];
    if (suivante) setOuverte(suivante.id);
  }, [ouverte, ouvrables]);

  const total = cartes.length, eu = possedees.length;
  const pourcent = total ? Math.round((eu / total) * 100) : 0;
  const vitrine = couverture.filter(id => miennes[id]).map(id => cartes.find(c => c.id === id)).filter((c): c is Carte => !!c);

  return (
    <div className={s.coffre}>
      <header className={s.tete}>
        <p className={s.sur}><span>Coffre</span>{pseudo && <span>{pseudo}</span>}{sousTitre && <span>{sousTitre}</span>}</p>
        <h1 className={s.titre}><em>Ma</em> <strong>collection</strong></h1>
        <div className={s.bilan}>
          <div className={s.compte}>
            <b>{eu}</b><span>/ {total} cartes</span>
            <div className={s.jauge} role="meter" aria-valuenow={pourcent} aria-valuemin={0} aria-valuemax={100} aria-label="Collection complétée"><i style={{ width: `${pourcent}%` }} /></div>
          </div>
          <ul className={s.raretes} aria-label="Filtrer par rareté">
            {RARETES.map(r => {
              const [a, t] = parRarete[r] as number[];
              return <li key={r}><button type="button" data-r={r} aria-pressed={rarete === r} onClick={() => setRarete(rarete === r ? null : r)}>
                <span>{LABEL[r]}</span><b>{a}<small>/{t}</small></b></button></li>;
            })}
          </ul>
        </div>
        {actions && <nav className={s.actions} aria-label="Raccourcis">{actions}</nav>}
      </header>

      {vitrine.length > 0 && (
        <section className={s.vitrine} aria-labelledby="vitrine-titre">
          <h2 id="vitrine-titre" className={s.h2}><em>Ma</em> vitrine</h2>
          <ul>{vitrine.map(c => (
            <li key={c.id}><button type="button" className={s.carte} data-r={c.rarete} onClick={() => setOuverte(c.id)}
              onPointerMove={e => incliner(e, 1.2)} onPointerLeave={relacher} aria-label={`${c.nom}, ${LABEL[c.rarete]}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgDe(c)} alt="" /><i className={s.reflet} />
            </button></li>))}
          </ul>
        </section>
      )}

      <div className={s.barre} role="toolbar" aria-label="Filtres">
        <div className={s.defile}>
          {["tous", ...animes].map(a => (
            <button key={a} type="button" aria-pressed={anime === a} onClick={() => setAnime(a)}>{a === "tous" ? "Tous les animés" : a}</button>))}
        </div>
        <div className={s.reglages}>
          <div className={s.segment}>
            {(["possedees", "manquantes", "toutes"] as const).map(p => (
              <button key={p} type="button" aria-pressed={possession === p} onClick={() => setPossession(p)}>
                {p === "toutes" ? "Toutes" : p === "possedees" ? "Obtenues" : "Manquantes"}</button>))}
          </div>
          <label className={s.tri}><span>Trier</span>
            <select value={tri} onChange={e => setTri(e.target.value as Tri)}>
              <option value="recentes">Plus récentes</option><option value="rarete">Rareté</option>
              <option value="anime">Animé</option><option value="nom">Nom</option>
            </select>
          </label>
        </div>
      </div>

      {etat}
      <p className={s.nb} aria-live="polite">{visibles.length} carte{visibles.length > 1 ? "s" : ""}{rarete ? ` · ${LABEL[rarete]}` : ""}{anime !== "tous" ? ` · ${anime}` : ""}</p>

      <ul className={s.grille}>
        {visibles.map(c => {
          const q = miennes[c.id];
          const date = ordre[c.id] ? Date.parse(ordre[c.id]) : NaN;
          const neuve = q && maintenant > 0 && maintenant - date < JOUR;
          return (
            <li key={c.id}>
              {q ? (
                <button type="button" className={s.carte} data-r={c.rarete} onClick={() => setOuverte(c.id)}
                  onPointerMove={incliner} onPointerEnter={() => variantesAnimees.has(c.id) && setSurvolee(c.id)}
                  onPointerLeave={e => { relacher(e); setSurvolee(v => (v === c.id ? null : v)); }}
                  aria-label={`${c.nom}, ${LABEL[c.rarete]}${q > 1 ? `, ${q} exemplaires` : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgDe(c)} alt="" loading="lazy" />
                  {survolee === c.id && <video className={s.clip} src={`/booster/variantes/${c.id}.mp4`} autoPlay loop muted playsInline aria-hidden="true" />}
                  <i className={s.reflet} /><i className={s.holo} aria-hidden="true" />
                  {neuve && <span className={s.neuve}>Nouvelle</span>}
                  {q > 1 && <span className={s.qte}>×{q}</span>}
                </button>
              ) : (
                <div className={`${s.carte} ${s.manque}`} data-r={c.rarete} aria-label={`Carte manquante, ${c.anime}, ${LABEL[c.rarete]}`}>
                  <span>?</span><small>{c.anime}</small><em>{LABEL[c.rarete]}</em>
                </div>
              )}
              {q ? <p className={s.legende}><b>{c.nom}</b><span data-r={c.rarete}>{LABEL[c.rarete]}{c.special ? ` · ${c.special}` : ""}</span></p> : null}
            </li>
          );
        })}
      </ul>

      {vue && <Fiche carte={vue} quantite={miennes[vue.id] ?? 0} obtenue={ordre[vue.id]} enCouverture={couverture.includes(vue.id)}
        premiere={couverture.indexOf(vue.id) === 0} rang={ouvrables.findIndex(c => c.id === vue.id) + 1} sur={ouvrables.length}
        onFermer={() => setOuverte(null)} onPas={pas} onCouverture={() => onCouverture(vue.id)} onPremiere={() => onPremiere(vue.id)} message={message} />}
    </div>
  );
}

type FicheProps = {
  carte: Carte; quantite: number; obtenue?: string; enCouverture: boolean; premiere: boolean; rang: number; sur: number;
  onFermer: () => void; onPas: (d: number) => void; onCouverture: () => void; onPremiere: () => void; message?: string;
};

// Fiche plein écran : la carte en grand, inclinable, ses infos à côté, et ses vues alternatives s'il y en a.
function Fiche({ carte, quantite, obtenue, enCouverture, premiere, rang, sur, onFermer, onPas, onCouverture, onPremiere, message }: FicheProps) {
  const dlg = useRef<HTMLDialogElement>(null);
  const vues = vuesCartes[carte.id];
  const [choix, setChoix] = useState({ id: carte.id, i: 0 });
  const iv = choix.id === carte.id ? choix.i : 0;
  const [balaye, setBalaye] = useState(0);
  const anime = variantesAnimees.has(carte.id);

  useEffect(() => { dlg.current?.showModal(); }, []);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") onPas(-1); if (e.key === "ArrowRight") onPas(1); };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onPas]);

  const changerVue = (i: number) => { if (i === iv) return; setBalaye(b => b + 1); setChoix({ id: carte.id, i }); };
  const date = obtenue ? new Date(obtenue) : null;

  return (
    <dialog ref={dlg} className={s.fiche} data-r={carte.rarete} onClose={onFermer}
      onClick={e => { if (e.target === e.currentTarget) onFermer(); }} aria-labelledby="fiche-nom">
      <div className={s.halo} aria-hidden="true" />
      <div className={s.scene}>
        <button type="button" className={s.fleche} onClick={() => onPas(-1)} aria-label="Carte précédente">←</button>
        <div className={s.grande} data-r={carte.rarete} onPointerMove={e => incliner(e, 1.4)} onPointerLeave={relacher}
          style={{ "--rx": "0deg", "--ry": "0deg" } as CSSProperties}>
          {anime && !vues ? (
            <video key={carte.id} autoPlay loop playsInline muted poster={`/booster/img/cards/${carte.id}/full.webp`} src={`/booster/variantes/${carte.id}.mp4`} />
          ) : vues ? (
            vues.map((v, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={v.src} src={v.src} alt={i === iv ? `${carte.nom}, ${v.label}` : ""} data-active={i === iv} />
            ))
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={carte.id} src={imgDe(carte)} alt={`${carte.nom}, ${LABEL[carte.rarete]}`} data-active />
          )}
          {balaye > 0 && <i key={balaye} className={s.balayage} aria-hidden="true" />}
          <i className={s.reflet} /><i className={s.holo} aria-hidden="true" />
        </div>
        <button type="button" className={s.fleche} onClick={() => onPas(1)} aria-label="Carte suivante">→</button>
      </div>

      <aside className={s.infos}>
        <p className={s.rangR} data-r={carte.rarete}>{LABEL[carte.rarete]}{carte.special ? <span> · Spéciale {carte.special}</span> : null}</p>
        <h2 id="fiche-nom" className={s.nomFiche}>{carte.nom}</h2>
        <p className={s.animeFiche}>{carte.anime}</p>
        {vues && (
          <div className={s.segment} role="group" aria-label="Affichage de la carte">
            {vues.map((v, i) => <button key={v.label} type="button" aria-pressed={i === iv} onClick={() => changerVue(i)}>{v.label}</button>)}
          </div>
        )}
        <dl className={s.details}>
          <div><dt>Exemplaires</dt><dd>{quantite}</dd></div>
          {date && !isNaN(date.getTime()) && <div><dt>Obtenue le</dt><dd>{date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</dd></div>}
          <div><dt>Référence</dt><dd>{carte.id}</dd></div>
        </dl>
        <div className={s.boutons}>
          <button type="button" className={s.principal} onClick={onCouverture}>{enCouverture ? "Retirer de ma vitrine" : "Exposer dans ma vitrine"}</button>
          {enCouverture && !premiere && <button type="button" className={s.secondaire} onClick={onPremiere}>Mettre en premier</button>}
        </div>
        <p role="status" className={s.message}>{message}</p>
        <p className={s.position}>{rang > 0 ? `${rang} / ${sur}` : ""} · ← → pour parcourir</p>
      </aside>
      <button type="button" className={s.fermer} onClick={onFermer} aria-label="Fermer">✕</button>
    </dialog>
  );
}
