"use client";

import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger, reduit } from "@/lib/gsap";

// Défilement fluide (Lenis), synchronisé avec ScrollTrigger.
export default function Defilement({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (reduit()) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
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
