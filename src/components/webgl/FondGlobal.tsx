"use client";

import { useEffect, useRef } from "react";
import { useShader } from "./useShader";

// Le fond de tout le site : un tissu holographique nacré. Ses plis captent la lumière ;
// l'angle de vue suit la souris et le défilement, donc chaque écran a sa propre couleur.
const FRAGMENT = `
uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse; uniform float uDefile;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * n(p); p = p * 2.07 + 13.1; a *= 0.5; } return v; }
vec3 spectre(float t){ return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + t)); }

// Hauteur du tissu : de grands plis diagonaux, tordus par un bruit lent
float plis(vec2 p, float t){
  vec2 w = vec2(fbm(p * 0.7 + vec2(t, 0.0)), fbm(p * 0.7 + vec2(4.3, -t)));
  p += (w - 0.5) * 1.6;
  return sin(p.x * 2.1 + p.y * 1.2 + t * 2.2) * 0.55
       + sin(p.y * 3.4 - p.x * 1.1 - t * 1.6) * 0.3
       + fbm(p * 2.2) * 0.45;
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float t = uTime * 0.045;
  vec2 q = p + vec2(0.0, uDefile * 0.32);

  float e = 0.012;
  float c = plis(q, t);
  float dx = plis(q + vec2(e, 0.0), t) - c;
  float dy = plis(q + vec2(0.0, e), t) - c;
  vec3 nrm = normalize(vec3(-dx / e, -dy / e, 3.2));

  vec3 vue = normalize(vec3(m * 0.5 - p * 0.25, 1.0));
  float angle = dot(nrm, vue);

  // Film mince : la teinte dépend de l'angle entre le pli et l'œil
  vec3 irise = spectre(angle * 2.4 + c * 0.35 + uDefile * 0.18 + t * 0.8 + 0.55);
  vec3 perle = vec3(0.955, 0.958, 0.972);
  float pente = clamp(1.0 - angle, 0.0, 1.0);
  float couvre = smoothstep(0.02, 0.32, pente) * 0.55 + 0.24;
  vec3 col = mix(perle, mix(perle, irise, 0.52), couvre);

  // Reflet satiné le long des crêtes
  vec3 lum = normalize(vec3(-0.4 + m.x * 0.4, 0.6 + m.y * 0.3, 1.0));
  float spec = pow(max(dot(reflect(-lum, nrm), vue), 0.0), 26.0);
  col += vec3(1.0) * spec * 0.28;
  // Ombre douce dans le creux des plis
  col *= 0.94 + 0.06 * smoothstep(-0.8, 0.8, c);

  col += (h(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function FondGlobal() {
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
    echelle: 0.5,
    uniformes: () => {
      const s = souris.current, c = cible.current;
      s[0] += (c[0] - s[0]) * 0.035;
      s[1] += (c[1] - s[1]) * 0.035;
      // Le défilement est lissé : la couleur glisse, elle ne saute pas
      defile.current += (window.scrollY / window.innerHeight - defile.current) * 0.06;
      return { uMouse: [s[0], s[1]], uDefile: defile.current };
    },
  });

  return <canvas ref={ref} className="fond-global" aria-hidden="true" />;
}
