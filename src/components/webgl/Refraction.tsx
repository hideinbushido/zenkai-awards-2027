"use client";

import { useEffect, useRef } from "react";
import { useShader } from "./useShader";

// Une image vue à travers un verre cannelé, avec dispersion des couleurs. uNet = 1 : verre dissipé.
const FRAGMENT = `
uniform sampler2D uTexture; uniform vec2 uResolution; uniform vec2 uImage; uniform float uNet; uniform float uTime;
vec2 couvre(vec2 uv){ float rc = uResolution.x / uResolution.y, ri = uImage.x / uImage.y;
  vec2 s = rc > ri ? vec2(1.0, ri / rc) : vec2(rc / ri, 1.0); return (uv - 0.5) * s + 0.5; }
void main(){
  vec2 uv = vUv;
  float cannelures = 22.0;
  float fx = fract(uv.x * cannelures);
  float force = (1.0 - uNet) * 0.09;
  float courbe = (fx - 0.5);
  vec2 o = vec2(courbe * force, 0.0);
  vec2 base = couvre(uv);
  float r = texture2D(uTexture, base + o * 1.25).r;
  float g = texture2D(uTexture, base + o).g;
  float b = texture2D(uTexture, base + o * 0.75).b;
  vec3 col = vec3(r, g, b);
  float reflet = pow(1.0 - abs(courbe) * 2.0, 6.0) * 0.18 * (1.0 - uNet);
  float ombre = smoothstep(0.35, 0.5, abs(courbe)) * 0.22 * (1.0 - uNet);
  col = col * (1.0 - ombre) + reflet;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function Refraction({ src, net = 0, className }: { src: string; net?: number; className?: string }) {
  const valeur = useRef(net);
  const affiche = useRef(net);
  useEffect(() => { valeur.current = net; }, [net]);
  const ref = useShader<HTMLCanvasElement>({
    fragment: FRAGMENT,
    image: src,
    uniformes: () => {
      affiche.current += (valeur.current - affiche.current) * 0.08;
      return { uNet: affiche.current };
    },
  });
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
