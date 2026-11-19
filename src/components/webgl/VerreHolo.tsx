"use client";

import { useEffect, useRef } from "react";
import { useShader } from "./useShader";

// Un montage vidéo vu à travers un verre cannelé holographique :
// chaque cannelure tord l'image et sépare ses couleurs, un film irisé glisse dessus,
// puis un voile (nacre ou nuit) garde le texte lisible.
const FRAGMENT = `
uniform sampler2D uTexture; uniform vec2 uResolution; uniform vec2 uImage;
uniform float uTime; uniform vec2 uMouse; uniform float uDefile;
uniform vec3 uVoile; uniform float uForceVoile; uniform float uCannelures;
vec3 spectre(float t){ return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + t)); }
vec2 couvre(vec2 uv){ float rc = uResolution.x / uResolution.y, ri = uImage.x / uImage.y;
  vec2 s = rc > ri ? vec2(1.0, ri / rc) : vec2(rc / ri, 1.0); return (uv - 0.5) * s + 0.5; }
void main(){
  vec2 uv = vUv;
  // Cannelures verticales, qui glissent un peu avec la souris
  float n = uCannelures * uResolution.x / max(uResolution.y, 1.0);
  float x = uv.x * n + (uMouse.x - 0.5) * 0.8;
  float fx = fract(x) - 0.5;
  float lentille = fx * fx * fx * 4.0 + fx * 0.5;
  vec2 o = vec2(lentille * 0.06, 0.0);
  vec2 b = couvre(uv);
  // Dispersion : rouge, vert et bleu ne passent pas au même endroit
  vec3 col;
  col.r = texture2D(uTexture, b + o * 1.5).r;
  col.g = texture2D(uTexture, b + o).g;
  col.b = texture2D(uTexture, b + o * 0.5).b;
  // Flou léger dans l'épaisseur du verre
  col = col * 0.6 + texture2D(uTexture, b + o + vec2(0.0, 0.006)).rgb * 0.2 + texture2D(uTexture, b + o - vec2(0.0, 0.006)).rgb * 0.2;

  // Film holographique : la teinte change d'une cannelure à l'autre et avec le défilement
  float phase = floor(x) * 0.045 + uv.y * 0.35 + uDefile * 0.12 + uTime * 0.02 + uMouse.y * 0.2;
  vec3 irise = spectre(phase + fx * 0.25);
  col = mix(col, col * (0.55 + irise * 0.9), 0.55);

  // Arête lumineuse et ombre de chaque cannelure
  float arete = pow(1.0 - abs(fx) * 2.0, 10.0);
  float ombre = smoothstep(0.3, 0.5, abs(fx));
  col = col * (1.0 - ombre * 0.18) + arete * 0.12;

  // Voile pour la lisibilité, teinté par le film
  vec3 voile = mix(uVoile, uVoile * (0.92 + irise * 0.16), 0.8);
  col = mix(col, voile, uForceVoile);
  gl_FragColor = vec4(col, 1.0);
}`;

type Props = {
  video: string;
  voile?: "nacre" | "nuit";
  force?: number; // 0 : vidéo brute, 1 : voile plein
  cannelures?: number; // nombre de cannelures sur la hauteur
  suitDefilement?: boolean;
  className?: string;
};

export default function VerreHolo({ video, voile = "nacre", force = 0.62, cannelures = 14, suitDefilement = false, className }: Props) {
  const souris = useRef<[number, number]>([0.5, 0.5]);
  const cible = useRef<[number, number]>([0.5, 0.5]);
  const defile = useRef(0);

  useEffect(() => {
    const bouge = (e: PointerEvent) => { cible.current = [e.clientX / innerWidth, 1 - e.clientY / innerHeight]; };
    window.addEventListener("pointermove", bouge, { passive: true });
    return () => window.removeEventListener("pointermove", bouge);
  }, []);

  const ref = useShader<HTMLCanvasElement>({
    fragment: FRAGMENT,
    video,
    echelle: 0.75,
    uniformes: () => {
      const s = souris.current, c = cible.current;
      s[0] += (c[0] - s[0]) * 0.04;
      s[1] += (c[1] - s[1]) * 0.04;
      if (suitDefilement) defile.current += (window.scrollY / window.innerHeight - defile.current) * 0.06;
      return {
        uMouse: [s[0], s[1]],
        uDefile: defile.current,
        uVoile: voile === "nacre" ? [0.955, 0.958, 0.972] : [0.05, 0.052, 0.07],
        uForceVoile: force,
        uCannelures: cannelures,
      };
    },
  });

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
