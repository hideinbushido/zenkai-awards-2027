"use client";
import { useMemo, useState } from "react";
import Coffre, { type Carte } from "../Coffre";

export default function Apercu({ cartes }: { cartes: Carte[] }) {
  const miennes = useMemo(() => Object.fromEntries(cartes.filter((_, i) => i % 5 !== 3).map((c, i) => [c.id, 1 + (i % 7 === 0 ? 2 : 0)])), [cartes]);
  const ordre = useMemo(() => Object.fromEntries(cartes.map((c, i) => [c.id, new Date(Date.UTC(2026, 10, 25, 10) - i * 3_600_000 * 7).toISOString()])), [cartes]);
  const [vitrine, setVitrine] = useState<string[]>(["ICHIGO-EKONTE-SPECTRE", cartes[8]?.id, cartes[20]?.id].filter(Boolean));
  return <Coffre cartes={cartes} miennes={miennes} ordre={ordre} pseudo="Aperçu" sousTitre="120 jetons" couverture={vitrine}
    onCouverture={id => setVitrine(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id].slice(0, 3))}
    onPremiere={id => setVitrine(v => [id, ...v.filter(x => x !== id)])}
    actions={<><a href="#">Ouvrir mon booster offert</a><a href="#">Missions</a><a href="#">Mes amis</a></>} />;
}
