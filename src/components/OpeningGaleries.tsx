"use client";

// Page « Meilleur opening » : deux mises en scène à comparer, Monographie et Vertical.
import { useState } from "react";
import OpeningMonographie from "./OpeningMonographie";
import OpeningVertical from "./OpeningVertical";
import s from "./OpeningGaleries.module.css";

type Vue = "monographie" | "vertical";

export default function OpeningGaleries() {
  const [vue, setVue] = useState<Vue>("monographie");
  const bascule = (
    <span className={s.bascule} role="group" aria-label="Mise en scène">
      <button type="button" aria-pressed={vue === "monographie"} onClick={() => setVue("monographie")}>Monographie</button>
      <button type="button" aria-pressed={vue === "vertical"} onClick={() => setVue("vertical")}>Vertical</button>
    </span>
  );
  return vue === "monographie" ? <OpeningMonographie bascule={bascule} /> : <OpeningVertical bascule={bascule} />;
}
