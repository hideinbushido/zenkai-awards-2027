import type { Metadata } from "next";
import EnTetePage from "@/components/EnTetePage";
import s from "./page.module.css";

export const metadata: Metadata = { title: "FAQ et règlement · Zenkai Anime Awards 2027" };

const QUESTIONS = [
  { q: "Qui peut voter ?", r: "Tout le monde. L'événement est ouvert à tous les fans d'animé, sans restriction d'âge ni de pays." },
  { q: "Quels animés sont éligibles ?", r: "Les animés diffusés de janvier à décembre 2026 : séries, suites et films. Ce qui est sorti en dehors de cette période n'est pas éligible cette année." },
  { q: "Comment fonctionne le vote ?", r: "Tu entres ton prénom et ton email sur la page de vote. Tu reçois un lien d'accès personnel, valable 24 heures. Tu ouvres les boosters un par un et tu gardes une carte dans chacun, puis tu valides ton classeur." },
  { q: "Je ne connais pas une catégorie, je fais quoi ?", r: "Tu la passes. Nouveauté 2027 : tu n'es plus obligé de voter dans les vingt-cinq catégories. Vote seulement pour ce que tu as vu." },
  { q: "Peut-on voter plusieurs fois ?", r: "Non. Une seule voix par adresse email. Toute tentative de vote multiple est annulée." },
  { q: "Puis-je modifier mon vote ?", r: "Avant de valider ton classeur, oui : tu peux rouvrir un booster et changer de carte. Une fois validé, ton vote est définitif." },
  { q: "Comment les gagnants sont-ils choisis ?", r: "Uniquement par le nombre de votes. Pas de jury, pas d'algorithme. En cas d'égalité parfaite, l'organisation peut trancher ou déclarer des ex-aequo." },
  { q: "Quand sont annoncés les résultats ?", r: "En mai 2027, en direct sur le TikTok de @ricokouame. Chaque enveloppe est ouverte par un créateur de la communauté. Les résultats restent secrets jusqu'au live." },
  { q: "Je n'ai pas reçu mon lien d'accès.", r: "Regarde dans tes spams. Si tu ne le trouves toujours pas, recommence depuis la page de vote avec la même adresse : un nouveau lien t'est envoyé." },
];

export default function Faq() {
  return (
    <>
      <EnTetePage titre="FAQ" chapo="Le règlement de l'édition 2027, en questions simples." />
      <section className={s.section} aria-label="Questions fréquentes">
        <div className={s.liste}>
          {QUESTIONS.map((x) => (
            <details key={x.q} className={s.item} name="faq">
              <summary className={s.question}>
                <span>{x.q}</span>
                <svg className={s.icone} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
              </summary>
              <p className={s.reponse}>{x.r}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
