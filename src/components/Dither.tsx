"use client";

import { useEffect, useRef } from "react";

// Dither génératif : un plasma irisé tramé par une matrice de Bayer, en basse résolution.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const PALETTE: [number, number, number][] = [
  [12, 13, 18],
  [42, 46, 62],
  [120, 96, 200],
  [96, 200, 222],
];

export default function Dither({ className, cellule = 5 }: { className?: string; cellule?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fige = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    const obs = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    obs.observe(canvas);

    let raf = 0, dernier = 0;
    const debut = performance.now();
    const dessine = (now: number) => {
      raf = requestAnimationFrame(dessine);
      if (!visible || now - dernier < 50) return; // ~20 images/s suffisent pour du dither
      dernier = now;
      const w = Math.max(1, Math.floor(canvas.clientWidth / cellule));
      const h = Math.max(1, Math.floor(canvas.clientHeight / cellule));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const t = fige ? 3 : (now - debut) / 1000;
      const img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = x / w, v = y / h;
          let p = Math.sin(u * 7 + t * 0.6) + Math.sin(v * 5 - t * 0.4) + Math.sin((u + v) * 6 + t * 0.3)
            + Math.sin(Math.hypot(u - 0.7, v - 0.4) * 14 - t * 0.9);
          p = (p + 4) / 8; // 0..1
          const seuil = BAYER[(y % 4) * 4 + (x % 4)];
          const niveau = Math.min(3, Math.floor(p * 3.6 + seuil - 0.5));
          const c = PALETTE[Math.max(0, niveau)];
          const i = (y * w + x) * 4;
          img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    raf = requestAnimationFrame(dessine);
    return () => { cancelAnimationFrame(raf); obs.disconnect(); };
  }, [cellule]);

  return <canvas ref={ref} className={className} style={{ imageRendering: "pixelated" }} aria-hidden="true" />;
}
