"use client";

import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger, reduit } from "@/lib/gsap";

// Défilement fluide (Lenis), synchronisé avec ScrollTrigger.
export default function Defilement({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (reduit()) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    const tic = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tic);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tic);
      lenis.destroy();
    };
  }, []);
  return <>{children}</>;
}
