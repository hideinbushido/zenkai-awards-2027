import Image from "next/image";
import { PRESENTATEURS_2026 } from "@/data/edition";
import s from "./Voix.module.css";

const PORTRAITS = [
  { nom: "Hermione", photo: "/visuels/pres-hermione.webp" },
  { nom: "Tempest", photo: "/visuels/pres-tempest.webp" },
  { nom: "Y-Gaëtan", photo: "/visuels/pres-gaetan.webp" },
  { nom: "Alex Kagami", photo: "/visuels/pres-kagami.webp" },
  { nom: "Tsunade Desty", photo: "/visuels/pres-tsunade.webp" },
  { nom: "Shadow", photo: "/visuels/pres-shadow.webp" },
];

// Acte 6 : les voix qui ont ouvert les enveloppes en 2026, en défilé continu.
export default function Voix() {
  return (
    <section className={s.voix} aria-labelledby="voix-titre">
      <div className={s.tete}>
        <h2 id="voix-titre" className={s.titre}>Les voix du live</h2>
        <p className={s.texte}>En 2026, vingt-quatre créateurs ont ouvert les enveloppes en direct. Les présentateurs 2027 arrivent bientôt.</p>
      </div>
      <div className={s.rail} aria-hidden="true">
        {[0, 1].map((k) => (
          <ul key={k} className={s.liste}>
            {PORTRAITS.map((p) => (
              <li key={p.nom} className={s.portrait}>
                <Image src={p.photo} alt="" width={240} height={240} />
                <span>{p.nom}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <p className={s.noms}>{PRESENTATEURS_2026.join(" · ")}</p>
    </section>
  );
}
