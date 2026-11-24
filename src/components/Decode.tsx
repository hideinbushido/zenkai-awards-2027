"use client";

import { useEffect, useRef, type ElementType, type HTMLAttributes } from "react";

// Texte qui se décode à la manière d'AUGE : lettres au hasard qui alternent
// grotesque grasse (.gr) et italique serif (.it), puis la bonne lettre, de gauche à droite.
// Le serveur écrit le texte final : sans JavaScript (ou mouvement réduit), rien ne bouge.

const GLYPHES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const hasard = () => GLYPHES[(Math.random() * GLYPHES.length) | 0];

export function decoder(el: HTMLElement, texte: string, duree = 0.9, delai = 0) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = texte; return () => {}; }
  const lettres = [...texte];
  el.setAttribute("aria-label", texte);
  el.innerHTML = "";
  const spans = lettres.map((c) => {
    const s = document.createElement("span");
    s.setAttribute("aria-hidden", "true");
    s.textContent = c === " " ? " " : "";
    el.appendChild(s);
    return s;
  });
  const total = duree * 1000;
  const fin = lettres.map((_, k) => (k / Math.max(1, lettres.length - 1)) * total * 0.7 + Math.random() * total * 0.3);
  const t0 = performance.now() + delai * 1000;
  let raf = 0, dernier = 0;
  const pas = (now: number) => {
    const t = now - t0;
    let fini = true;
    if (now - dernier > 40) {           // 25 changements par seconde : lisible, pas épileptique
      dernier = now;
      spans.forEach((s, k) => {
        const c = lettres[k];
        if (c === " ") return;
        if (t >= fin[k]) { if (s.dataset.ok !== "1") { s.textContent = c; s.className = ""; s.dataset.ok = "1"; } }
        else { fini = false; if (t > 0) { s.textContent = hasard(); s.className = Math.random() < 0.5 ? "dc-it" : "dc-gr"; } else s.textContent = " "; }
      });
    } else fini = spans.every((s, k) => lettres[k] === " " || s.dataset.ok === "1");
    if (!fini) raf = requestAnimationFrame(pas);
    else { el.textContent = texte; el.removeAttribute("aria-label"); }
  };
  raf = requestAnimationFrame(pas);
  return () => { cancelAnimationFrame(raf); el.textContent = texte; el.removeAttribute("aria-label"); };
}

type Props = HTMLAttributes<HTMLElement> & {
  texte: string;
  as?: ElementType;
  duree?: number;
  delai?: number;
  // "monte" : au montage ; "vue" : quand l'élément entre dans l'écran
  quand?: "monte" | "vue";
};

export default function Decode({ texte, as: Tag = "span", duree = 0.9, delai = 0, quand = "monte", ...reste }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let stop = () => {};
    if (quand === "monte") { stop = decoder(el, texte, duree, delai); return () => stop(); }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { stop = decoder(el, texte, duree, delai); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => { obs.disconnect(); stop(); };
  }, [texte, duree, delai, quand]);
  return <Tag ref={ref} {...reste}>{texte}</Tag>;
}
