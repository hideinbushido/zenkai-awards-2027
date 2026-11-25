"use client";

// Galerie des nominés d'une catégorie : mur courbe en WebGL (référence Aren Vale),
// textes à la manière d'AUGE (décodage, mot géant qui ondule), opening du nominé en fond.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { decoder } from "./Decode";
import { garderCarte, useCollection } from "@/lib/collection";
import { CATEGORIES } from "@/data/edition";
import { NOMINES_2027 } from "@/data/nomines2027";
import s from "./GalerieCourbe.module.css";

type Nomine = { id: string; nom: string; detail?: string; img: string; video?: string };
const pad = (n: number) => String(n).padStart(2, "0");
const CW = 1, CH = 1.4;
const VIDE: Nomine[] = [];

export default function GalerieCourbe({ categorie }: { categorie: string }) {
  const racine = useRef<HTMLElement>(null);
  const cat = CATEGORIES.find((c) => c.id === categorie)!;
  const idx = CATEGORIES.findIndex((c) => c.id === categorie);
  const suivante = CATEGORIES[(idx + 1) % CATEGORIES.length];
  const liste = (NOMINES_2027[categorie] ?? VIDE) as Nomine[];
  const bulletin = useCollection();
  const [ouvertId, setOuvertId] = useState<string | null>(null);
  const [son, setSon] = useState(false);
  const api = useRef<{ fermer: () => void; son: () => boolean } | null>(null);

  useEffect(() => {
    const el = racine.current!;
    const $ = <T extends HTMLElement = HTMLElement>(q: string) => el.querySelector<T>(q)!;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = liste.length;
    const opening = liste.some((n) => n.video);
    let detruit = false;
    const nettoyage: (() => void)[] = [];
    const ecoute = <K extends keyof WindowEventMap>(cible: Window | HTMLElement, t: K, f: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
      cible.addEventListener(t, f as EventListener, o);
      nettoyage.push(() => cible.removeEventListener(t, f as EventListener, o));
    };

    // ---------- rendu ----------
    const canvas = $<HTMLCanvasElement>("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const scene2 = new THREE.Scene(), cam2 = new THREE.OrthographicCamera(0, 1, 0, -1, -1, 1);

    const VS = `
      uniform float uCurve, uShift, uBend, uWave; varying vec2 vUv;
      void main() {
        vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0);
        float x = wp.x - uShift;
        wp.z += uBend * uCurve * x * x;
        wp.z += uBend * uWave * sin(uv.y * 3.14159) * 0.18;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`;
    const FS = `
      uniform sampler2D map; uniform float uOpacity, uDim, uLight, uPret; varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * vec2(1.0, 1.4); float r = 0.03;
        vec2 q = abs(p) - (vec2(0.5, 0.7) - r);
        float a = 1.0 - smoothstep(-0.0015, 0.0015, length(max(q, 0.0)) - r);
        vec3 col = mix(vec3(0.08, 0.07, 0.1), texture2D(map, vUv).rgb, uPret);
        float sh = smoothstep(0.35, 0.0, abs(vUv.x + vUv.y * 0.5 - uLight)) * 0.10;
        gl_FragColor = vec4(col * (1.0 - uDim) + sh, a * uOpacity);
      }`;
    // Avec 6 nominés, on répète la série pour que le mur reste plein
    const rep = Math.max(1, Math.ceil(12 / N)), M = N * rep;
    const geo = new THREE.PlaneGeometry(CW, CH, 32, 8);
    const textures: THREE.Texture[] = [];
    const cartes = Array.from({ length: M }, (_, k) => {
      const tex = new THREE.Texture(); textures.push(tex);
      const mat = new THREE.ShaderMaterial({
        vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
        uniforms: { map: { value: tex }, uCurve: { value: 0 }, uShift: { value: 0 }, uBend: { value: 1 }, uWave: { value: 0 },
          uOpacity: { value: 1 }, uDim: { value: 0 }, uLight: { value: -1 }, uPret: { value: 0 } },
      });
      const m = new THREE.Mesh(geo, mat); m.userData.k = k; m.userData.i = k % N; scene.add(m); return m;
    });
    // Images : on dessine chaque affiche en 720 × 1008, recadrée
    let charge = 0;
    liste.forEach((n, i) => {
      const img = new Image(); img.decoding = "async"; img.src = n.img;
      img.onload = () => {
        if (detruit) return;
        const c = document.createElement("canvas"); c.width = 720; c.height = 1008;
        const g = c.getContext("2d")!; const r = Math.max(720 / img.width, 1008 / img.height);
        const w = img.width * r, h = img.height * r; g.drawImage(img, (720 - w) / 2, (1008 - h) / 2, w, h);
        for (let k = i; k < M; k += N) {
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          t.minFilter = THREE.LinearMipmapLinearFilter; textures.push(t);
          const u = cartes[k].material.uniforms; u.map.value = t;
          gsap.to(u.uPret, { value: 1, duration: 0.6, ease: "power2.out" });
        }
        charge++; const cpt = el.querySelector("[data-compteur]"); if (cpt) cpt.textContent = String(Math.round(100 * charge / N)).padStart(3, "0");
      };
    });

    // ---------- le mot géant ----------
    const police = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "sans-serif";
    const fDisplay = police("--f-display"), fSerif = police("--f-serif");
    const geant = { cv: document.createElement("canvas"), texte: "", lettres: [] as { c: string; it: boolean }[], largeur: 1, jeton: 0 };
    geant.cv.width = 2400; geant.cv.height = 520;
    const gTex = new THREE.CanvasTexture(geant.cv); gTex.colorSpace = THREE.NoColorSpace; textures.push(gTex);
    const gMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { map: { value: gTex }, uAmp: { value: 0 }, uT: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `
        uniform sampler2D map; uniform float uAmp, uT; varying vec2 vUv;
        void main(){
          vec2 uv = vUv;
          uv.x += sin(uv.y * 9.0 + uT * 2.2) * uAmp * 0.016;
          uv.y += sin(uv.x * 7.0 - uT * 1.7) * uAmp * 0.07;
          float a = texture2D(map, uv).a;
          gl_FragColor = vec4(vec3(0.965, 0.95, 0.92) * a, a);
        }`,
    });
    const gMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), gMat); scene2.add(gMesh);
    const dessinerGeant = () => {
      const g = geant.cv.getContext("2d")!, H0 = geant.cv.height;
      g.clearRect(0, 0, geant.cv.width, H0); g.fillStyle = "#fff";
      let x = 0; const base = H0 * 0.84;
      for (const L of geant.lettres) {
        g.font = L.it ? `italic 400 ${H0 * 0.98}px ${fSerif}` : `900 ${H0 * 0.92}px ${fDisplay}`;
        g.fillText(L.c, x, base); x += g.measureText(L.c).width - (L.it ? 0 : H0 * 0.02);
        if (x > geant.cv.width - 40) break;
      }
      geant.largeur = Math.max(1, Math.min(x, geant.cv.width)); gTex.needsUpdate = true;
    };
    const placerGeant = () => {
      const maxW = (mobile ? 0.92 : 0.6) * W, maxH = (mobile ? 0.09 : 0.17) * H;
      const r = geant.cv.height / geant.largeur;
      const w = Math.min(maxW, maxH / r), e = w / geant.largeur;
      const pw = geant.cv.width * e, ph = geant.cv.height * e;
      gMesh.scale.set(pw, ph, 1);
      const marge = mobile ? 18 : Math.max(24, W * 0.03);
      gMesh.position.set(marge + pw / 2, -(H - (mobile ? 128 : 96) - ph / 2), 0);
    };
    const hasard = () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[(Math.random() * 36) | 0];
    const ecrireGeant = (texte: string) => {
      geant.texte = texte.toUpperCase(); const cible = [...geant.texte];
      const jeton = ++geant.jeton;
      if (reduit) { geant.lettres = cible.map((c) => ({ c, it: false })); dessinerGeant(); placerGeant(); return; }
      const t0 = performance.now(), total = 700;
      const fin = cible.map((_, k) => (k / Math.max(1, cible.length - 1)) * total * 0.7 + Math.random() * total * 0.3);
      const pas = () => {
        if (geant.jeton !== jeton || detruit) return;
        const t = performance.now() - t0; let fini = true;
        geant.lettres = cible.map((c, k) => (c === " " || t >= fin[k] ? { c, it: false } : (fini = false, { c: hasard(), it: Math.random() < 0.5 })));
        dessinerGeant(); placerGeant();
        if (!fini) setTimeout(pas, 45);
      };
      pas();
    };

    // ---------- mise en page ----------
    let W = 1, H = 1, mobile = false;
    const R = { curve: 0.075, shift: -1.1, step: 1.13 };
    const taille = () => {
      W = el.clientWidth; H = el.clientHeight; mobile = W < 760;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.position.set(0, mobile ? -0.55 : -0.3, mobile ? 6.6 : 6.2);
      R.curve = mobile ? 0.07 : 0.075; R.shift = mobile ? 0 : -1.1; camera.updateProjectionMatrix();
      cam2.right = W; cam2.bottom = -H; cam2.updateProjectionMatrix();
      if (geant.texte) placerGeant();
    };
    ecoute(window, "resize", taille); taille();

    // ---------- défilement ----------
    let cible = 0, pos = 0, vit = 0, intro = 1, dernierGeste = 0;
    let ouvert: null | { k: number; p: THREE.Vector3; sc: number } = null;
    let glisse: null | { x: number; y: number; depart: number; dist: number; hist: [number, number][] } = null;
    const etat = { estompe: 0 };
    const enroule = (v: number, n: number) => v - n * Math.round(v / n);
    const unite = () => W / (mobile ? 2.2 : 5.4);
    ecoute(el, "wheel", (e) => {
      if (ouvert || intro > 0) return; e.preventDefault();
      const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode ? 30 : 1);
      cible += d * 0.002; dernierGeste = performance.now();
    }, { passive: false });
    ecoute(canvas, "pointerdown", (e) => {
      if (ouvert || intro > 0) return;
      glisse = { x: e.clientX, y: e.clientY, depart: cible, dist: 0, hist: [[0, performance.now()]] };
      canvas.setPointerCapture(e.pointerId);
    });
    ecoute(canvas, "pointermove", (e) => {
      if (!glisse) { survol(e); return; }
      const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y;
      const d = mobile ? (Math.abs(dx) > Math.abs(dy) ? dx : dy * 0.8) : dx + dy * 0.6;
      glisse.dist = Math.max(glisse.dist, Math.hypot(dx, dy));
      cible = glisse.depart - d / unite();
      glisse.hist.push([d, performance.now()]); if (glisse.hist.length > 6) glisse.hist.shift();
    });
    ecoute(canvas, "pointerup", (e) => {
      if (!glisse) return; const g = glisse; glisse = null;
      if (g.dist < 8) { clic(e); return; }
      const a = g.hist[0], b = g.hist[g.hist.length - 1];
      cible -= ((b[0] - a[0]) / Math.max(16, b[1] - a[1]) * 260) / unite();
      cible = Math.round(cible); dernierGeste = performance.now();
    });
    ecoute(window, "keydown", (e) => {
      if (e.key === "Escape" && ouvert) fermer();
      if (ouvert || intro > 0) return;
      if (e.key === "ArrowRight") cible = Math.round(cible) + 1;
      if (e.key === "ArrowLeft") cible = Math.round(cible) - 1;
      if (e.key === "Enter") ouvrir(((Math.round(pos) % M) + M) % M);
    });

    // ---------- placement ----------
    let pile = 0;
    const placer = () => {
      cartes.forEach((c, k) => {
        if (ouvert && ouvert.k === k) return;
        const u = c.material.uniforms;
        const x = enroule(k - pos, M) * R.step;
        c.position.set(x * (1 - intro), 0, 0);
        u.uCurve.value = R.curve; u.uShift.value = R.shift;
        u.uWave.value = Math.min(Math.abs(vit) * 2.4, 0.9);
        u.uLight.value = ((x * 0.25 + pos * 0.15) % 2.4) - 0.6;
        const enPile = intro > 0.001;
        c.renderOrder = enPile ? (k === pile ? 50 : k) : 0;
        u.uOpacity.value = (enPile ? (k === pile ? 1 : intro < 0.98 ? 1 : 0) : 1) * (1 - etat.estompe);
        u.uDim.value = enPile ? 0 : Math.min(Math.abs(x) * 0.05, 0.25);
      });
    };

    // ---------- fond : opening du nominé au centre, sinon son image floutée ----------
    const fonds = [$(`[data-fond="a"]`), $(`[data-fond="b"]`)];
    const videos = [$<HTMLVideoElement>(`[data-video="a"]`), $<HTMLVideoElement>(`[data-video="b"]`)];
    let fondActif = 0, fondI = -1, minuteur = 0, vActive = 0;
    const petit = innerWidth < 900;
    const source = (v: string) => (petit ? v.replace("/openings/", "/openings/720/") : v);
    const ambiance = (i: number) => {
      if (i === fondI) return; fondI = i; const n = liste[i];
      const sv = fonds[1 - fondActif]; sv.style.backgroundImage = `url(${n.img})`;
      sv.dataset.visible = "1"; delete fonds[fondActif].dataset.visible; fondActif = 1 - fondActif;
      delete videos[vActive].dataset.visible; clearTimeout(minuteur);
      if (n.video && !reduit) minuteur = window.setTimeout(() => {
        // preload="none" empêchait le chargement : on charge et on lance nous-mêmes, puis on montre la vidéo quand elle joue
        const v = videos[1 - vActive], ancienne = videos[vActive], attendu = n.id;
        v.muted = true; v.preload = "auto"; v.src = source(n.video!); v.load();
        v.onplaying = () => {
          v.onplaying = null;
          if (liste[fondI]?.id !== attendu) { v.pause(); return; }
          v.dataset.visible = "1"; delete ancienne.dataset.visible; ancienne.pause(); vActive = videos.indexOf(v);
        };
        v.play().catch(() => {});
      }, 380);
      const [a, b] = (n.detail ?? "").split(" · ");
      decoder($("[data-e-titre]"), n.nom.toUpperCase(), 0.6);
      decoder($("[data-e-sous]"), (b ?? a ?? "").toUpperCase(), 0.7);
      decoder($("[data-e-num]"), `${pad(i + 1)} / ${pad(N)}`, 0.5);
      ecrireGeant(n.nom);
    };
    nettoyage.push(() => clearTimeout(minuteur));

    // ---------- étiquette accrochée sous la carte du centre ----------
    const tmp = new THREE.Vector3();
    const coins = (c: THREE.Mesh) => {
      const u = (c.material as THREE.ShaderMaterial).uniforms, pts: [number, number][] = [];
      for (const [px, py] of [[-0.5, -0.7], [0.5, -0.7], [0.5, 0.7], [-0.5, 0.7]]) {
        tmp.set(px, py, 0).applyMatrix4(c.matrixWorld);
        const x = tmp.x - u.uShift.value; tmp.z += u.uBend.value * u.uCurve.value * x * x;
        tmp.project(camera); pts.push([(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H]);
      }
      return pts;
    };
    const etiquette = $("[data-etiquette]");
    const accrocher = () => {
      if (ouvert || intro > 0) return;
      const c = cartes[((Math.round(pos) % M) + M) % M]; c.updateMatrixWorld();
      const p = coins(c);
      etiquette.style.transform = `translate3d(${p[0][0].toFixed(1)}px, ${(p[0][1] + 12).toFixed(1)}px, 0)`;
    };

    // ---------- survol / clic ----------
    const dedans = (p: [number, number], poly: [number, number][]) => {
      let ok = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) ok = !ok;
      }
      return ok;
    };
    const carteSous = (e: PointerEvent) => {
      const tri = cartes.filter((c) => c.material.uniforms.uOpacity.value > 0.3)
        .sort((a, b) => Math.abs(enroule(a.userData.k - pos, M)) - Math.abs(enroule(b.userData.k - pos, M)));
      for (const c of tri) if (dedans([e.clientX - el.getBoundingClientRect().left, e.clientY - el.getBoundingClientRect().top], coins(c))) return c;
      return null;
    };
    let survolee: THREE.Mesh | null = null;
    const survol = (e: PointerEvent) => {
      if (ouvert || intro > 0) return;
      const c = carteSous(e); canvas.style.cursor = c ? "pointer" : "grab";
      if (c !== survolee) {
        if (survolee) gsap.to(survolee.scale, { x: 1, y: 1, duration: 0.5, ease: "power3.out" });
        if (c) gsap.to(c.scale, { x: 1.04, y: 1.04, duration: 0.5, ease: "power3.out" });
        survolee = c;
      }
    };
    const clic = (e: PointerEvent) => {
      const c = carteSous(e); if (!c) return;
      const d = enroule(c.userData.k - pos, M);
      if (Math.abs(d) > 0.5) { cible = Math.round(pos + d); return; }
      ouvrir(c.userData.k);
    };

    // ---------- fiche ----------
    const ouvrir = (k: number) => {
      if (ouvert) return;
      cible = pos = Math.round(pos); const i = k % N; ambiance(i);
      const c = cartes[k]; ouvert = { k, p: c.position.clone(), sc: c.scale.x };
      const hVis = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), wVis = hVis * camera.aspect;
      const sc = mobile ? (hVis * 0.34) / CH : (hVis * 0.6) / CH;
      const dest = mobile ? new THREE.Vector3(0, camera.position.y + hVis * 0.2, 0) : new THREE.Vector3(-wVis * 0.15, camera.position.y + hVis * 0.04, 0);
      c.renderOrder = 200; const u = c.material.uniforms, dur = reduit ? 0 : 1.05;
      gsap.timeline({ defaults: { ease: "expo.inOut", duration: dur } })
        .to(c.position, { x: dest.x, y: dest.y, z: dest.z }, 0).to(c.scale, { x: sc, y: sc }, 0)
        .to(u.uBend, { value: 0 }, 0).to(u.uDim, { value: 0 }, 0)
        .to(u.uLight, { value: 2.2, duration: reduit ? 0 : 1.4, ease: "power2.inOut" }, 0.2);
      gsap.to(etat, { estompe: 1, duration: reduit ? 0 : 0.5, ease: "power2.out" });
      setOuvertId(liste[i].id);
      requestAnimationFrame(() => {
        el.querySelectorAll<HTMLElement>("[data-decode]").forEach((x, j) => decoder(x, x.dataset.decode ?? "", 0.8, (reduit ? 0 : 0.45) + j * 0.05));
        gsap.fromTo(el.querySelectorAll("[data-monte]"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: reduit ? 0 : 0.8, ease: "expo.out", stagger: 0.06, delay: reduit ? 0 : 0.5 });
      });
    };
    const fermer = () => {
      if (!ouvert) return;
      const { k, p, sc } = ouvert, c = cartes[k], u = c.material.uniforms;
      videos[vActive].muted = true; setSon(false);
      gsap.to(el.querySelectorAll("[data-monte],[data-decode]"), { opacity: 0, duration: reduit ? 0 : 0.25, ease: "power2.in" });
      gsap.timeline({ defaults: { ease: "expo.inOut", duration: reduit ? 0 : 0.95 }, onComplete: () => { ouvert = null; setOuvertId(null); } })
        .to(c.position, { x: p.x, y: p.y, z: p.z }, 0.1).to(c.scale, { x: sc, y: sc }, 0.1).to(u.uBend, { value: 1 }, 0.1);
      gsap.to(etat, { estompe: 0, duration: reduit ? 0 : 0.7, delay: reduit ? 0 : 0.35, ease: "power2.out" });
    };
    api.current = {
      fermer,
      son: () => { const v = videos[vActive]; v.muted = !v.muted; if (!v.muted) v.play().catch(() => {}); return !v.muted; },
    };

    // ---------- intro ----------
    const finIntro = () => {
      el.dataset.pret = "1"; fondI = -1; ambiance(0);
      decoder($("[data-marque]"), "ZENKAI ANIME AWARDS 2027©", 0.9);
    };
    (async () => {
      decoder($("[data-i-sous]"), cat.titre, 1.1, 0.15);
      if (reduit) { intro = 0; finIntro(); return; }
      for (let k = 0; k < 12 && !detruit; k++) { pile = (pile + 1) % M; await new Promise((r) => setTimeout(r, 70 + k * 6)); }
      if (detruit) return;
      gsap.to(el.querySelector("[data-chargement]"), { autoAlpha: 0, duration: 0.5, ease: "power2.out" });
      const o = { v: 1 };
      gsap.to(o, { v: 0, duration: 1.6, ease: "expo.inOut", onUpdate: () => { intro = o.v; }, onComplete: () => { intro = 0; finIntro(); } });
    })();

    // ---------- boucle ----------
    let prec = performance.now(), raf = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - prec) / 1000, 0.05); prec = now;
      // Aimant : une fois le geste fini, la carte la plus proche se cale au centre
      if (!glisse && !ouvert && now - dernierGeste > 140) cible = Math.round(cible);
      const avant = pos;
      pos += (cible - pos) * (1 - Math.exp(-dt * (glisse ? 14 : 6.5)));
      vit += ((pos - avant) / Math.max(dt, 1e-3) * 0.12 - vit) * (1 - Math.exp(-dt * 10));
      placer();
      if (intro === 0 && !ouvert) ambiance(((Math.round(pos) % M) + M) % M % N);
      accrocher();
      gMat.uniforms.uT.value = now / 1000;
      gMat.uniforms.uAmp.value += (Math.min(Math.abs(vit) * 3, 1.2) - gMat.uniforms.uAmp.value) * (1 - Math.exp(-dt * 6));
      renderer.clear(); renderer.render(scene, camera);
      if (geant.texte && !ouvert) renderer.render(scene2, cam2);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // Pause quand l'onglet est caché
    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else { prec = performance.now(); raf = requestAnimationFrame(frame); } };
    document.addEventListener("visibilitychange", vis);
    nettoyage.push(() => document.removeEventListener("visibilitychange", vis));
    void opening;

    return () => {
      detruit = true; cancelAnimationFrame(raf); nettoyage.forEach((f) => f());
      gsap.killTweensOf(etat);
      textures.forEach((t) => t.dispose()); geo.dispose(); cartes.forEach((c) => c.material.dispose()); gMat.dispose(); gMesh.geometry.dispose();
      renderer.dispose(); videos.forEach((v) => { v.pause(); v.removeAttribute("src"); v.load(); });
    };
  }, [categorie, liste, cat.titre]);

  const n = liste.find((x) => x.id === ouvertId);
  const [artiste, oeuvre] = (n?.detail ?? "").split(" · ");
  const estOpening = !!n?.video;
  const choisi = n ? bulletin[categorie] === n.id : false;

  return (
    <section ref={racine} className={s.galerie} data-plein-ecran="" data-lenis-prevent="" data-ouvert={ouvertId ? "1" : undefined} aria-label={`${cat.titre} : les nominés`}>
      <div className={s.fond} data-fond="a" aria-hidden="true" />
      <div className={s.fond} data-fond="b" aria-hidden="true" />
      <video className={s.video} data-video="a" muted playsInline loop preload="none" aria-hidden="true" />
      <video className={s.video} data-video="b" muted playsInline loop preload="none" aria-hidden="true" />
      <div className={s.voile} aria-hidden="true" />
      <canvas className={s.scene} aria-hidden="true" />

      <div className={s.hud}>
        <Link href="/categories" className={s.retour}>← Catégories</Link>
        <p className={s.cat}><span>{cat.court}</span> <em>{pad(idx + 1)} / {CATEGORIES.length}</em></p>
        <Link href={`/categories/${suivante.id}`} className={s.suivante}>{suivante.court} →</Link>
        <p className={s.marque} data-marque>ZENKAI ANIME AWARDS 2027©</p>
        <p className={s.aide}>Glisse ou fais défiler · touche une carte</p>
      </div>

      <div className={s.etiquette} data-etiquette aria-live="polite">
        <span data-e-titre />
        <span data-e-sous />
        <span data-e-num />
      </div>

      {n && (
        <div className={s.fiche} onClick={(e) => { if (e.target === e.currentTarget) api.current?.fermer(); }}>
          <div className={s.ficheTexte}>
            <p className={s.rang} data-decode={`${cat.titre.toUpperCase()} — ${pad(liste.indexOf(n) + 1)} / ${pad(liste.length)}`} />
            <h2 className={s.ficheTitre} data-decode={n.nom.toUpperCase()}>{n.nom.toUpperCase()}</h2>
            <dl className={s.lignes}>
              <dt data-decode="DESCRIPTION" /><dd data-monte>
                {estOpening
                  ? `${n.nom}, l'opening de ${oeuvre}, interprété par ${artiste}. Nominé au ${cat.titre} des Zenkai Anime Awards 2027.`
                  : `${n.nom}${n.detail ? ` (${n.detail})` : ""} fait partie des ${liste.length} nominés de la catégorie ${cat.titre}.`}
              </dd>
              {estOpening && <><dt data-decode="ARTISTE" /><dd data-decode={artiste} /></>}
              <dt data-decode={estOpening ? "ANIMÉ" : "ŒUVRE"} /><dd data-decode={estOpening ? oeuvre : (n.detail ?? "—")} />
              <dt data-decode="CATÉGORIE" /><dd data-decode={cat.titre} />
            </dl>
            <div className={s.boutons} data-monte>
              <button type="button" className={s.principal} onClick={() => garderCarte(categorie, n.id)}>{choisi ? "Dans ton bulletin ✓" : "Mettre dans mon bulletin"}</button>
              {estOpening && <button type="button" onClick={() => setSon(api.current?.son() ?? false)}>{son ? "Couper le son" : "Activer le son"}</button>}
              <button type="button" onClick={() => api.current?.fermer()}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      <div className={s.chargement} data-chargement aria-hidden="true">
        <span className={s.point} />
        <p className={s.zenkai}>ZENKAI</p>
        <p className={s.iSous} data-i-sous>{cat.titre}</p>
        <p className={s.compteur} data-compteur>000</p>
      </div>
    </section>
  );
}
