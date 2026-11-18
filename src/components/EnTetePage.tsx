import type { ReactNode } from "react";
import TitreAnime from "@/components/TitreAnime";
import s from "./EnTetePage.module.css";

// En-tête commun des pages intérieures : grand titre qui se lève, chapô, posé sur le tissu holographique du site.
export default function EnTetePage({ titre, chapo, aside }: { titre: string; chapo: ReactNode; aside?: ReactNode }) {
  return (
    <header className={s.tete}>
      <TitreAnime as="h1" className={`affiche ${s.titre}`}>{titre}</TitreAnime>
      <div className={s.bas}>
        <p className={s.chapo}>{chapo}</p>
        {aside && <div className={s.aside}>{aside}</div>}
      </div>
    </header>
  );
}
