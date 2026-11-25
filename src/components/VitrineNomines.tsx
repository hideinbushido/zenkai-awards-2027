"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { decoder } from "./Decode";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import s from "./VitrineNomines.module.css";

// Des nominés d'autres catégories, chacun avec sa carte ZENKAI, sur un extrait de son animé.
const VITRINE = [
  { categorie: "Meilleur protagoniste", court: "protagoniste", nom: "Gabimaru", anime: "Hell's Paradise saison 2", carte: "HELLSParadise-013", video: "hells-paradise",
    texte: "Le ninja qui voulait seulement rentrer chez lui. La saison 2 le pousse plus loin que jamais sur l'île de Shinsenkyō." },
  { categorie: "Meilleur antagoniste", court: "antagoniste", nom: "Yhwach", anime: "Bleach TYBW : The Calamity", carte: "BLEACH-055", video: "bleach-ibull",
    texte: "Le père des Quincy voit l'avenir et le réécrit. The Calamity en fait l'ennemi le plus écrasant de la saga." },
  { categorie: "Meilleur personnage masculin", court: "masculin", nom: "Shinra Kusakabe", anime: "Fire Force saison 3", carte: "FIREforce-011", video: "ignis",
    texte: "Le pompier aux pieds de diable court vers la vérité sur l'Adolla Burst, quitte à brûler tout le reste." },
  { categorie: "Meilleur sensei", court: "sensei", nom: "Yami Sukehiro", anime: "Black Clover saison 2", carte: "BLACKCLOVER-009", video: "black-clover",
    texte: "Le capitaine du Taureau Noir apprend à ses recrues à dépasser leurs limites, maintenant, pas plus tard." },
];
const pad = (n: number) => String(n).padStart(2, "0");

export default function VitrineNomines() {
  const ref = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const nom = useRef<HTMLHeadingElement>(null);
  const pile = useRef<HTMLParagraphElement>(null);
  const carte = useRef<HTMLDivElement>(null);
  const [actif, setActif] = useState(0);
  const [visible, setVisible] = useState(false);

  useGSAP(() => {
    const st = ScrollTrigger.create({
      trigger: ref.current, start: "top top", end: "bottom bottom",
      onUpdate: (self) => setActif(Math.min(VITRINE.length - 1, Math.floor(self.progress * VITRINE.length * 0.999))),
      onToggle: (self) => setVisible(self.isActive),
    });
    return () => st.kill();
  }, { scope: ref });

  // Lecture : seule la vidéo du nominé affiché tourne, et seulement quand la section est à l'écran
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === actif && visible) { if (v.preload === "none") v.preload = "auto"; v.play().catch(() => {}); }
      else v.pause();
    });
  }, [actif, visible]);

  useEffect(() => {
    const v = VITRINE[actif];
    const stops: (() => void)[] = [];
    if (nom.current) stops.push(decoder(nom.current, v.nom.toUpperCase(), 0.7));
    pile.current?.querySelectorAll<HTMLElement>("span").forEach((el, k) => stops.push(decoder(el, el.dataset.t ?? "", 0.5, k * 0.06)));
    return () => stops.forEach((f) => f());
  }, [actif]);

  // Inclinaison de la carte au pointeur
  useEffect(() => {
    const c = carte.current;
    if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bouge = (e: PointerEvent) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      c.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      c.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
      c.style.setProperty("--lx", `${((x + 0.5) * 100).toFixed(1)}%`);
    };
    addEventListener("pointermove", bouge, { passive: true });
    return () => removeEventListener("pointermove", bouge);
  }, []);

  const v = VITRINE[actif];
  return (
    <section ref={ref} className={s.section} style={{ height: `${VITRINE.length * 100 + 40}svh` }} aria-labelledby="vitrine-titre">
      <div className={s.scene} data-fondu>
        {VITRINE.map((x, i) => (
          <video key={x.video} ref={(n) => { videos.current[i] = n; }} className={s.video} data-actif={i === actif}
            src={`/videos/vitrine/${x.video}.mp4`} poster={`/videos/vitrine/${x.video}.jpg`} muted loop playsInline preload="none" aria-hidden="true" />
        ))}
        <div className={s.voile} />

        <h2 id="vitrine-titre" className={s.surtitre}><em>Ils sont</em> nominés</h2>

        <div className={s.texte} aria-live="polite">
          <p ref={pile} className={s.pile}>
            <span data-t={v.categorie.toUpperCase()}>{v.categorie.toUpperCase()}</span>
            <span data-t={v.anime.toUpperCase()}>{v.anime.toUpperCase()}</span>
            <span data-t={`${pad(actif + 1)} / ${pad(VITRINE.length)}`}>{pad(actif + 1)} / {pad(VITRINE.length)}</span>
          </p>
          <h3 ref={nom} className={s.nom}>{v.nom.toUpperCase()}</h3>
          <p className={s.signature}>ZENKAI ANIME AWARDS 2027©</p>
          <p className={s.desc}>{v.texte}</p>
          <Link href={`/categories/${v.court}`} className={s.voir}>Voir la catégorie</Link>
        </div>

        <div ref={carte} className={s.carte}>
          {VITRINE.map((x, i) => (
            <img key={x.carte} src={`/booster/img/cards/${x.carte}/full.webp`} alt={i === actif ? `Carte ZENKAI de ${x.nom}` : ""} data-actif={i === actif} data-avant={i < actif} loading="lazy" decoding="async" />
          ))}
          <span className={s.reflet} aria-hidden="true" />
        </div>

        <ol className={s.progres} aria-hidden="true">
          {VITRINE.map((x, i) => <li key={x.carte} data-actif={i === actif} />)}
        </ol>
      </div>
    </section>
  );
}
