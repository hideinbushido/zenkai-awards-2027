"use client";

import { useEffect, useRef } from "react";

type Uniformes = Record<string, number | [number, number] | [number, number, number]>;

type Options = {
  fragment: string;
  // Appelée à chaque image : renvoie les uniformes à jour (temps fourni en secondes)
  uniformes?: (t: number) => Uniformes;
  image?: string; // texture optionnelle (uTexture)
  video?: string; // ou une vidéo muette en boucle, envoyée à chaque image dans uTexture
  echelle?: number; // résolution relative (perf)
};

const VERTEX = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

// Petit moteur WebGL : un quad plein cadre, un fragment shader, pause hors écran.
export function useShader<T extends HTMLCanvasElement>({ fragment, uniformes, image, video, echelle = 1 }: Options) {
  const ref = useRef<T>(null);
  const appel = useRef(uniformes);
  useEffect(() => { appel.current = uniformes; });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, "precision highp float; varying vec2 vUv;\n" + fragment));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    let actif = true;
    let texPrete = !image && !video;
    let film: HTMLVideoElement | null = null;
    let texFilm: WebGLTexture | null = null;
    if (image) {
      const tex = gl.createTexture();
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!actif) return;
        gl.useProgram(prog);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform2f(gl.getUniformLocation(prog, "uImage"), img.width, img.height);
        texPrete = true;
      };
      img.src = image;
    }
    if (video) {
      film = document.createElement("video");
      film.muted = true; film.loop = true; film.playsInline = true; film.preload = "auto"; film.crossOrigin = "anonymous";
      film.src = video;
      texFilm = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texFilm);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      film.addEventListener("loadeddata", () => {
        if (!actif || !film) return;
        gl.useProgram(prog);
        gl.uniform2f(gl.getUniformLocation(prog, "uImage"), film.videoWidth, film.videoHeight);
        texPrete = true;
      });
      film.play().catch(() => {});
    }

    const taille = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.75) * echelle;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(gl.getUniformLocation(prog, "uResolution"), w, h);
    };

    let visible = true;
    const obs = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" });
    obs.observe(canvas);

    const fige = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const debut = performance.now();
    let raf = 0;
    const image0 = () => {
      raf = requestAnimationFrame(image0);
      if (film) {
        // La vidéo ne tourne que quand le fond est visible
        if (!visible) { if (!film.paused) film.pause(); return; }
        if (film.paused && !fige) film.play().catch(() => {});
      }
      if (!visible || !texPrete) return;
      if (film && texFilm && film.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, texFilm);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, film);
      }
      taille();
      const t = fige ? 4 : (performance.now() - debut) / 1000;
      gl.uniform1f(gl.getUniformLocation(prog, "uTime"), t);
      const u = appel.current?.(t) ?? {};
      for (const [k, v] of Object.entries(u)) {
        const l = gl.getUniformLocation(prog, k);
        if (typeof v === "number") gl.uniform1f(l, v);
        else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
        else gl.uniform3f(l, v[0], v[1], v[2]);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(image0);

    return () => { actif = false; cancelAnimationFrame(raf); obs.disconnect(); if (film) { film.pause(); film.removeAttribute("src"); film.load(); } };
  }, [fragment, image, video, echelle]);

  return ref;
}
