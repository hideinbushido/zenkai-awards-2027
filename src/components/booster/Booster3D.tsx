"use client";

/* Les uniformes three.js sont mis à jour à chaque image dans useFrame : c'est le fonctionnement normal de R3F,
   que les règles du compilateur React ne prévoient pas. */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { CARTE_FRAGMENT, CARTE_VERTEX, FOIL_FRAGMENT, FOIL_VERTEX } from "./shaders";

const L = 2.0, H = 3.1, H_BANDE = 0.34;
const CW = 1.26, CH = 1.76;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const plage = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const doux = (t: number) => t * t * (3 - 2 * t);

// Étiquette imprimée sur le booster, dessinée dans un canvas.
function useEtiquette(categorie: string) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 640; c.height = 992;
    const ctx = c.getContext("2d")!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const dessine = () => {
      const style = getComputedStyle(document.body);
      const display = style.getPropertyValue("--f-display") || "sans-serif";
      const large = style.getPropertyValue("--f-large") || "sans-serif";
      ctx.clearRect(0, 0, c.width, c.height);
      // Bandeau sombre central
      ctx.fillStyle = "rgba(14,15,22,0.92)";
      ctx.fillRect(0, 560, 640, 250);
      ctx.fillStyle = "rgba(240,242,250,1)";
      ctx.font = `900 150px ${display}`;
      ctx.textAlign = "center";
      ctx.fillText("ZENKAI", 320, 330);
      ctx.font = `400 26px ${large}`;
      ctx.fillText("BOOSTER  ·  2027", 320, 380);
      ctx.font = `800 64px ${display}`;
      ctx.fillText(categorie.toUpperCase(), 320, 680);
      ctx.font = `400 22px ${large}`;
      ctx.fillStyle = "rgba(160,220,235,1)";
      ctx.fillText("CATÉGORIE 25 / 25", 320, 745);
      tex.needsUpdate = true;
    };
    dessine();
    document.fonts?.ready.then(dessine);
    return tex;
  }, [categorie]);
}

function Scene({ progres, images, categorie }: { progres: RefObject<number>; images: string[]; categorie: string }) {
  const groupe = useRef<THREE.Group>(null);
  const paquet = useRef<THREE.Group>(null);
  const bande = useRef<THREE.Mesh>(null);
  const cartes = useRef<(THREE.Mesh | null)[]>([]);
  const souris = useRef({ x: 0, y: 0 });
  const etiquette = useEtiquette(categorie);
  const vide = useMemo(() => new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1), []);
  const textures = useLoader(THREE.TextureLoader, images);

  useEffect(() => {
    textures.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; });
    const bouge = (e: PointerEvent) => { souris.current = { x: e.clientX / innerWidth - 0.5, y: e.clientY / innerHeight - 0.5 }; };
    window.addEventListener("pointermove", bouge, { passive: true });
    return () => window.removeEventListener("pointermove", bouge);
  }, [textures]);

  const matCorps = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: FOIL_VERTEX, fragmentShader: FOIL_FRAGMENT, transparent: true, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uBombe: { value: 1 }, uOpacite: { value: 1 }, uEtiquette: { value: etiquette }, uSertieHaut: { value: 0.0 }, uSertieBas: { value: 0.05 }, uDecal: { value: 0 }, uTeinte: { value: new THREE.Color(1, 1, 1) }, uForce: { value: 0 } },
  }), [etiquette]);
  const matBande = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: FOIL_VERTEX, fragmentShader: FOIL_FRAGMENT, transparent: true, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uBombe: { value: 0.15 }, uOpacite: { value: 1 }, uEtiquette: { value: vide }, uSertieHaut: { value: 0.35 }, uSertieBas: { value: 0.0 }, uDecal: { value: 0 }, uTeinte: { value: new THREE.Color(1, 1, 1) }, uForce: { value: 0 } },
  }), [vide]);
  const matCartes = useMemo(() => textures.map((t) => new THREE.ShaderMaterial({
    vertexShader: CARTE_VERTEX, fragmentShader: CARTE_FRAGMENT, transparent: true, side: THREE.DoubleSide,
    uniforms: { uArt: { value: t }, uImage: { value: new THREE.Vector2((t.image as HTMLImageElement).width, (t.image as HTMLImageElement).height) }, uTime: { value: 0 }, uOpacite: { value: 1 } },
  })), [textures]);

  useFrame(({ clock }) => {
    const p = progres.current ?? 0;
    const t = clock.elapsedTime;
    matCorps.uniforms.uTime.value = t;
    matBande.uniforms.uTime.value = t;
    matCartes.forEach((m) => { m.uniforms.uTime.value = t; });

    // Parallaxe souris
    if (groupe.current) {
      groupe.current.rotation.y += (souris.current.x * 0.35 - groupe.current.rotation.y) * 0.05;
      groupe.current.rotation.x += (souris.current.y * 0.18 - groupe.current.rotation.x) * 0.05;
    }

    // 1. Le booster entre et se présente de face
    const entree = doux(plage(p, 0, 0.16));
    // 2. La bande du haut se déchire et s'envole
    const dechire = doux(plage(p, 0.16, 0.36));
    // 3. Les cartes sortent du booster
    const sortie = plage(p, 0.34, 0.66);
    // 4. Elles se déploient en éventail, le booster descend
    const eventail = doux(plage(p, 0.64, 0.9));

    if (paquet.current) {
      paquet.current.rotation.y = (1 - entree) * 0.7 + Math.sin(t * 0.5) * 0.04 * (1 - eventail);
      paquet.current.position.y = -0.45 - sortie * 0.35 - eventail * 4.0 + (1 - entree) * -0.4;
      paquet.current.scale.setScalar(0.92 + entree * 0.08);
      matCorps.uniforms.uOpacite.value = 1 - plage(p, 0.8, 0.95);
    }
    if (bande.current) {
      bande.current.position.set(dechire * 1.7, H / 2 + H_BANDE / 2 + dechire * 2.2, dechire * 0.6);
      bande.current.rotation.z = -dechire * 0.9;
      bande.current.rotation.x = dechire * 0.6;
      matBande.uniforms.uOpacite.value = 1 - plage(p, 0.3, 0.42);
    }

    const n = cartes.current.length;
    cartes.current.forEach((c, i) => {
      if (!c) return;
      const k = i - (n - 1) / 2;
      const s = doux(clamp(sortie * 1.25 - i * 0.06));
      const x0 = k * 0.05, y0 = -1.0 + s * 2.3;
      const xf = k * 1.12, yf = 0.25 - Math.abs(k) * 0.16, zf = 0.6 - Math.abs(k) * 0.18;
      c.position.set(
        x0 + (xf - x0) * eventail,
        y0 + (yf - y0) * eventail,
        -0.12 - i * 0.012 + (zf + 0.12) * eventail,
      );
      c.rotation.z = -k * 0.13 * eventail;
      c.rotation.y = -k * 0.08 * eventail + Math.sin(t * 0.7 + i) * 0.05 * eventail;
      c.scale.setScalar(0.94 + eventail * 0.12);
    });
  });

  return (
    <group ref={groupe}>
      <group ref={paquet}>
        <mesh material={matCorps}>
          <planeGeometry args={[L, H, 48, 72]} />
        </mesh>
        <mesh ref={bande} material={matBande} position={[0, H / 2 + H_BANDE / 2, 0]}>
          <planeGeometry args={[L, H_BANDE, 48, 8]} />
        </mesh>
      </group>
      {matCartes.map((m, i) => (
        <mesh key={i} ref={(el) => { cartes.current[i] = el; }} material={m} renderOrder={-1}>
          <planeGeometry args={[CW, CH, 1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

export default function Booster3D({ progres, images, categorie }: { progres: RefObject<number>; images: string[]; categorie: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 34 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene progres={progres} images={images} categorie={categorie} />
    </Canvas>
  );
}
