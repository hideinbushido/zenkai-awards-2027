"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CARTES_ESSAI, imgCarte, RARETE, type CarteEssai } from "../cartes";
import Fiche from "../Fiche";
import s from "./ruban.module.css";

// Essai 1 · d'après le « Twist Band » d'Agenciex : un anneau de cartes courbées, penché et vrillé comme un ruban.
// On le fait tourner au glisser ; au survol, une pastille suit le curseur avec le nom ; au clic, la carte s'ouvre.
const N = 18;
const RAYON = 4.2;
const RATIO = 838 / 600;
const TEX_W = 600, TEX_H = 838;

function dessiner(img: HTMLImageElement | null) {
  const c = document.createElement("canvas");
  c.width = TEX_W; c.height = TEX_H;
  const ctx = c.getContext("2d")!;
  const r = 30;
  ctx.beginPath(); ctx.roundRect(0, 0, TEX_W, TEX_H, r); ctx.clip();
  ctx.fillStyle = "#e6e4ee"; ctx.fillRect(0, 0, TEX_W, TEX_H);
  if (img) ctx.drawImage(img, 0, 0, TEX_W, TEX_H);
  return c;
}

export default function Ruban() {
  const monture = useRef<HTMLDivElement>(null);
  const pastille = useRef<HTMLDivElement>(null);
  const [survol, setSurvol] = useState<CarteEssai | null>(null);
  const [ouverte, setOuverte] = useState<CarteEssai | null>(null);
  const ouverteRef = useRef(false);
  useEffect(() => { ouverteRef.current = !!ouverte; }, [ouverte]);

  useEffect(() => {
    const el = monture.current;
    if (!el) return;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const anneau = new THREE.Group();
    scene.add(anneau);
    anneau.position.y = 0.55;

    const cartes = CARTES_ESSAI.slice(0, N);
    const pas = (Math.PI * 2) / N;
    const arc = pas * 0.95;
    const hauteur = arc * RAYON * RATIO;
    const SEG = 20;
    const jetables: { dispose(): void }[] = [];
    const meshes: THREE.Mesh[] = [];
    const bases: { mesh: THREE.Mesh; base: number; uv0: Float32Array }[] = [];

    cartes.forEach((c, i) => {
      const geo = new THREE.PlaneGeometry(1, 1, SEG, 1);
      const tex = new THREE.CanvasTexture(dessiner(null));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const img = new Image();
      img.onload = () => { tex.image = dessiner(img); tex.needsUpdate = true; };
      img.src = imgCarte(c.id);
      const face = new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, transparent: true, alphaTest: 0.5 });
      const mesh = new THREE.Mesh(geo, face);
      mesh.userData.i = i;
      mesh.frustumCulled = false;
      // dos : mêmes sommets, UV inversées pour que l'image se lise depuis l'intérieur
      const geoDos = new THREE.BufferGeometry();
      geoDos.setAttribute("position", geo.attributes.position);
      const uv = (geo.attributes.uv as THREE.BufferAttribute).clone();
      for (let j = 0; j < uv.count; j++) uv.setX(j, 1 - uv.getX(j));
      geoDos.setAttribute("uv", uv);
      geoDos.setIndex(geo.index);
      const dos = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, alphaTest: 0.5, color: 0xb9b6c8 });
      const meshDos = new THREE.Mesh(geoDos, dos);
      meshDos.userData.i = i;
      meshDos.frustumCulled = false;
      anneau.add(mesh, meshDos);
      meshes.push(mesh, meshDos);
      jetables.push(geo, geoDos, tex, face, dos);
      const p = geo.attributes.position as THREE.BufferAttribute;
      const uv0 = new Float32Array(p.count * 2);
      for (let j = 0; j < p.count; j++) { uv0[j * 2] = p.getX(j) + 0.5; uv0[j * 2 + 1] = p.getY(j); }
      bases.push({ mesh, base: i * pas, uv0 });
    });

    // courbe chaque carte sur l'anneau, avec la vrille du ruban et une légère vague
    const vrille = (34 * Math.PI) / 180;
    const disposer = (rot: number) => {
      for (const { mesh, base, uv0 } of bases) {
        const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
        for (let j = 0; j < pos.count; j++) {
          const u = uv0[j * 2], v = uv0[j * 2 + 1];
          const phi = base + rot + (u - 0.5) * arc;
          const sx = Math.sin(phi), cz = Math.cos(phi);
          const a = vrille * sx * sx;
          const vague = RAYON * 0.09 * Math.sin(2 * phi + 0.6);
          const h = v * hauteur;
          pos.setXYZ(j, RAYON * sx + h * Math.sin(a) * sx, vague + h * Math.cos(a), RAYON * cz + h * Math.sin(a) * cz);
        }
        pos.needsUpdate = true;
      }
    };

    const redim = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const dist = RAYON * 3;
      const demiL = RAYON / 0.6;
      const demiH = Math.max(demiL / camera.aspect, RAYON * 1.15);
      camera.fov = (2 * Math.atan(demiH / dist) * 180) / Math.PI;
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    redim();
    const ro = new ResizeObserver(redim);
    ro.observe(el);

    const inclinaison = (20 * Math.PI) / 180;
    let rot = 0, vit = -0.0036, repos = -0.0036;
    let glisse = false, dernierX = 0, dernierY = 0, inclin = 0, dx = 0;
    let survole = -1;
    const ray = new THREE.Raycaster();
    const souris = new THREE.Vector2(9, 9);

    const bas = (e: PointerEvent) => {
      glisse = true; dx = 0; dernierX = e.clientX; dernierY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const bouge = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      souris.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (pastille.current) pastille.current.style.translate = `${e.clientX - r.left + 18}px ${e.clientY - r.top + 18}px`;
      if (!glisse) return;
      const ddx = e.clientX - dernierX;
      dx += Math.abs(ddx);
      vit = ddx * 0.0042;
      rot += vit;
      inclin = Math.max(-0.25, Math.min(0.25, inclin + (e.clientY - dernierY) * 0.002));
      dernierX = e.clientX; dernierY = e.clientY;
      if (Math.abs(vit) > 0.001) repos = Math.sign(vit) * Math.abs(repos);
    };
    const haut = () => {
      if (glisse && dx < 6 && survole >= 0) setOuverte(cartes[survole]);
      glisse = false;
    };
    const sort = () => { souris.set(9, 9); };
    el.addEventListener("pointerdown", bas);
    el.addEventListener("pointermove", bouge);
    el.addEventListener("pointerup", haut);
    el.addEventListener("pointerleave", sort);

    let raf = 0;
    const tic = () => {
      raf = requestAnimationFrame(tic);
      if (!glisse) {
        // sur une carte : le ruban ralentit jusqu'à presque s'arrêter
        const cible = survole >= 0 ? repos * 0.08 : reduit ? 0 : repos;
        vit += (cible - vit) * 0.04;
        rot += vit;
        inclin *= 0.94;
      }
      anneau.rotation.x = inclinaison + inclin;
      anneau.rotation.z = -0.06;
      disposer(rot);
      ray.setFromCamera(souris, camera);
      const hit = ouverteRef.current ? undefined : ray.intersectObjects(meshes, false)[0];
      const i = hit ? (hit.object.userData.i as number) : -1;
      if (i !== survole) {
        survole = i;
        setSurvol(i >= 0 ? cartes[i] : null);
        el.style.cursor = i >= 0 ? "pointer" : "grab";
      }
      renderer.render(scene, camera);
    };
    tic();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", bas);
      el.removeEventListener("pointermove", bouge);
      el.removeEventListener("pointerup", haut);
      el.removeEventListener("pointerleave", sort);
      jetables.forEach(j => j.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <section className={s.scene}>
      <div className={s.points} aria-hidden />
      <div ref={monture} className={s.monture} />
      <div ref={pastille} className={s.pastille} data-visible={survol ? "" : undefined} aria-hidden>
        {survol && <><b>{survol.nom}</b><span>{RARETE[survol.rarete]}</span></>}
      </div>
      <header className={s.titre}>
        <p>Collection · {CARTES_ESSAI.length} cartes holo</p>
        <h1>Le ruban <em>Zenkai</em></h1>
      </header>
      <p className={s.indice}>Glisse pour faire tourner · clique une carte</p>
      {ouverte && <Fiche carte={ouverte} onFermer={() => setOuverte(null)} />}
    </section>
  );
}
