"use client";

import { useEffect, useRef } from "react";
import { useShader } from "./useShader";

// Fond irisé vivant : nappes de film holographique sur graphite, qui suivent doucement la souris.
const FRAGMENT = `
uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse; uniform float uIntensite;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * n(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
vec3 spectre(float t){ return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + t)); }
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  vec2 m = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float t = uTime * 0.05;
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 3.1));
  vec2 r = vec2(fbm(p * 1.9 + q * 1.7 + vec2(1.7, 9.2) + t * 1.4), fbm(p * 1.9 + q * 1.7 + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.6 + r * 1.5);
  float d = length(p - m * 0.6);
  vec3 irise = spectre(f * 2.6 + r.x * 1.4 + d * 0.5 + t * 1.6);
  float nappe = smoothstep(0.38, 0.95, f + 0.22 * (1.0 - d));
  vec3 col = vec3(0.045, 0.05, 0.066);
  col = mix(col, irise * 0.5 + 0.06, nappe * 0.6 * uIntensite);
  col += vec3(0.86, 0.89, 0.96) * pow(smoothstep(0.58, 0.97, f), 3.0) * 0.32 * uIntensite;
  vec2 uv = gl_FragCoord.xy / uResolution;
  col *= 1.0 - 0.6 * dot(uv - 0.5, uv - 0.5) * 2.0;
  col += (h(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function FondShader({ intensite = 1, className }: { intensite?: number; className?: string }) {
  const souris = useRef<[number, number]>([0.5, 0.5]);
  const cible = useRef<[number, number]>([0.5, 0.5]);

  useEffect(() => {
    const bouge = (e: PointerEvent) => { cible.current = [e.clientX / innerWidth, 1 - e.clientY / innerHeight]; };
    window.addEventListener("pointermove", bouge, { passive: true });
    return () => window.removeEventListener("pointermove", bouge);
  }, []);

  const ref = useShader<HTMLCanvasElement>({
    fragment: FRAGMENT,
    echelle: 0.42,
    uniformes: () => {
      const s = souris.current, c = cible.current;
      s[0] += (c[0] - s[0]) * 0.04;
      s[1] += (c[1] - s[1]) * 0.04;
      return { uMouse: [s[0], s[1]], uIntensite: intensite };
    },
  });

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
