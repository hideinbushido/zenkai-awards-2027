import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import GalerieCourbe from "@/components/GalerieCourbe";
import OuvertureBooster from "@/components/OuvertureBooster";
import { FAMILLES, categorie, nominesDe, voisines } from "@/data/boosters";
import { CATEGORIES } from "@/data/edition";
import s from "./page.module.css";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = categorie(id);
  return { title: c ? `${c.titre} · Zenkai Anime Awards 2027` : "Catégorie" };
}

// La page n'attend pas params elle-même : le contenu le lit sous une frontière Suspense.
export default function PageCategorie({ params }: PageProps<"/categories/[id]">) {
  return (
    <Suspense fallback={<section className={s.page} aria-busy="true" />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: { params: PageProps<"/categories/[id]">["params"] }) {
  const { id } = await params;
  const c = categorie(id);
  if (!c) notFound();
  if (nominesDe(id)?.length) return <GalerieCourbe key={id} categorie={id} />;
  const { avant, apres, numero } = voisines(id);
  const famille = FAMILLES.find((f) => f.id === c.famille)!;

  return (
    <section className={s.page} data-famille={c.famille} aria-labelledby="cat-titre">
      {/* Couleur liquide propre à la famille */}
      <div className={s.liquide} aria-hidden="true"><i /><i /><i /></div>

      <header className={s.tete}>
        <Link href={`/categories#${c.famille}`} className={s.retour}>{famille.nom}</Link>
        <h1 id="cat-titre" className={`affiche ${s.titre}`}>{c.titre}</h1>
        <nav className={s.voisins} aria-label="Boosters voisins">
          {avant ? <Link href={`/categories/${avant.id}`}>Précédent</Link> : <span />}
          <span className={s.compteur}>{String(numero).padStart(2, "0")} / 25</span>
          {apres ? <Link href={`/categories/${apres.id}`}>Suivant</Link> : <span />}
        </nav>
      </header>

      <OuvertureBooster
        categorie={c}
        numero={numero}
        nomines={nominesDe(id)}
        suivante={apres ? { id: apres.id, titre: apres.titre } : null}
      />
    </section>
  );
}
