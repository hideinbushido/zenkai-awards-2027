import type { ReactNode } from "react";
import TitreAnime from "@/components/TitreAnime";
import FondShader from "@/components/webgl/FondShader";
import s from "./EnTetePage.module.css";

// En-tête commun des pages intérieures : grand titre qui se lève, chapô, fond nacré vivant.
export default function EnTetePage({ titre, chapo, aside }: { titre: string; chapo: ReactNode; aside?: ReactNode }) {
  return (
    <header className={s.tete}>
      <FondShader className={s.fond} clair intensite={0.75} />
      <TitreAnime as="h1" className={`affiche ${s.titre}`}>{titre}</TitreAnime>
      <div className={s.bas}>
        <p className={s.chapo}>{chapo}</p>
        {aside && <div className={s.aside}>{aside}</div>}
      </div>
    </header>
  );
}
