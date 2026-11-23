"use client";

import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, reduit } from "@/lib/gsap";

// Défilement fluide (Lenis), synchronisé avec ScrollTrigger.
export default function Defilement({ children }: { children: ReactNode }) {
  const pathname=usePathname();
  const instance=useRef<Lenis|null>(null);
  useLayoutEffect(()=>{
    if(!pathname.startsWith("/categories/"))return;
    const reset=()=>{instance.current?.scrollTo(0,{immediate:true,force:true});window.scrollTo({top:0,behavior:"instant"})};
    reset();const frame=requestAnimationFrame(reset);return()=>cancelAnimationFrame(frame);
  },[pathname]);
  useEffect(() => {
    if (reduit()) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    instance.current=lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tic = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tic);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tic);
      instance.current=null;lenis.destroy();
    };
  }, []);
  return <>{children}</>;
}
