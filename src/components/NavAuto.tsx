"use client";

import { useEffect } from "react";

// Cache la navigation quand on descend, la ramène dès qu'on remonte.
export default function NavAuto() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (!nav) return;
    const menu = nav.querySelector("details");
    const fermer = (event: MouseEvent) => {
      const cible = event.target;
      if (menu?.open && cible instanceof Element && (!menu.contains(cible) || cible.closest("a"))) menu.open = false;
    };
    const echapper = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu?.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("click", fermer);
    document.addEventListener("keydown", echapper);
    let dernier = scrollY, attente = false;
    const verifie = () => {
      const y = scrollY;
      if (Math.abs(y - dernier) > 6) {
        nav.toggleAttribute("data-cache", y > dernier && y > 200);
        dernier = y;
      }
      attente = false;
    };
    const surScroll = () => { if (!attente) { attente = true; requestAnimationFrame(verifie); } };
    addEventListener("scroll", surScroll, { passive: true });
    return () => {
      removeEventListener("scroll", surScroll);
      document.removeEventListener("click", fermer);
      document.removeEventListener("keydown", echapper);
    };
  }, []);
  return null;
}
