"use client";

import { useEffect } from "react";

// Cache la navigation quand on descend, la ramène dès qu'on remonte.
export default function NavAuto() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (!nav) return;
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
    return () => removeEventListener("scroll", surScroll);
  }, []);
  return null;
}
