/* ZENKAI 2027 — ouverture de booster, VERSION 3D (Three.js).
   Même gabarit de cartes, mêmes effets de rareté (shader partagé avec la 2D), mêmes sons.
   Booster modélisé dans Blender (booster.glb : déchirure + ouverture en morph). */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { makeTear, preloadAmmo } from "./tear.js";

const $ = s => document.querySelector(s);
const A = window.ZKA;
const IMG = "img/";
const gsap = window.gsap;

/* ================= cartes (même gabarit que la 2D) */
const RANK = { eclat: 0, prisme: 1, spectre: 2, mirage: 3, zenkai: 4 };
// chance qu'une carte du booster soit de cette rareté, en % (indépendant du nombre de cartes de chaque rareté)
const WEIGHT = { eclat: 61, prisme: 20, spectre: 10, mirage: 5, zenkai: 4 };
const LABEL = { eclat: "ÉCLAT", prisme: "PRISME", spectre: "SPECTRE", mirage: "MIRAGE", zenkai: "ZENKAI" };
const TINT = { eclat: [0.75, 0.72, 0.62], prisme: [0.85, 0.5, 0.9], spectre: [0.25, 0.45, 0.95], mirage: [0.7, 0.6, 1.0], zenkai: [1.0, 0.68, 0.25] };
const POOL = window.ZK_CARDS.cards.map(c => Object.assign({}, c, {
  ill: c.base + "ill.webp", over: c.base + "over.webp", masks: c.base + "masks.png", full: c.base + "full.webp",
  asm: c.rarity === "zenkai" ? [["ill", c.base + "ill.webp"], ["voile", c.base + "voile.webp"], ["lueur", IMG + "frames/zenkai_lueur.webp"],
    ["bande", IMG + "frames/zenkai_bande.webp"], ["flammes", IMG + "frames/zenkai_flammes.webp"], ["couronne", IMG + "frames/zenkai_couronne.webp"],
    ["eclats", IMG + "frames/zenkai_eclats.webp"], ["infos", c.base + "infos.webp"]] : null,
}));
function drawBooster() {
  const left = POOL.slice(), out = [], n = Math.min(window.ZK_CARDS.booster || 10, left.length);
  while (out.length < n) {
    // 1) on tire la rareté selon WEIGHT (seulement parmi celles qui ont encore des cartes), 2) une carte au hasard de cette rareté
    const dispo = Object.keys(WEIGHT).filter(k => left.some(c => c.rarity === k));
    const tot = dispo.reduce((s, k) => s + WEIGHT[k], 0);
    let r = Math.random() * tot, k = 0;
    while ((r -= WEIGHT[dispo[k]]) > 0 && k < dispo.length - 1) k++;
    const idx = left.map((c, j) => c.rarity === dispo[k] ? j : -1).filter(j => j >= 0);
    out.push(left.splice(idx[Math.floor(Math.random() * idx.length)], 1)[0]);
  }
  return out.map(c => [c, Math.random()]).sort((a, b) => (RANK[a[0].rarity] - RANK[b[0].rarity]) || (a[1] - b[1])).map(x => x[0]);
}
let DECK = drawBooster();
window.ZK_BG.prepare(DECK);
window.__zkDeck = ids => { DECK = ids.map(id => POOL.find(c => c.id === id)).filter(Boolean); window.ZK_BG.prepare(DECK); };
window.__zkTL = () => tl;
window.__zkTop = () => { const v = new THREE.Vector3(0.6, 0.97, 0).applyMatrix4(booster.matrixWorld).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };

/* ================= moteur */
const canvas = $("#three");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 120);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.45, 0.6, 0.9);
composer.addPass(bloom);
// objectif : brume de chaleur, exposition, aberration chromatique, vignette, grain (rendu « caméra »)
const lens = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uHaze: { value: 0 }, uExp: { value: 1 }, uCA: { value: 0.0025 }, uGrain: { value: 0.035 }, uVig: { value: 0.55 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uT,uHaze,uExp,uCA,uGrain,uVig;uniform vec2 uRes;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){vec2 uv=vUv;vec2 c=uv-.5;
 float m=exp(-dot(c*vec2(1.,1.5),c*vec2(1.,1.5))*5.);
 vec2 h=vec2(vnoise(uv*vec2(10.,16.)+vec2(0.,-uT*1.4))-.5,vnoise(uv*vec2(12.,8.)+vec2(3.,-uT*1.9))-.5);
 uv+=h*.014*uHaze*m;
 float ca=uCA*(1.+uHaze*2.);
 vec3 col=vec3(texture2D(tDiffuse,uv+c*ca).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-c*ca).b);
 col*=uExp;
 col*=1.-uVig*dot(c,c)*1.3;
 col+=(hash(vUv*uRes+fract(uT*7.)*91.)-.5)*uGrain;
 gl_FragColor=vec4(col,1.);}`,
});
composer.addPass(lens);
composer.addPass(new OutputPass());
const TL = new THREE.TextureLoader();
const texF = url => { const t = TL.load(url); t.flipY = false; t.anisotropy = 4; return t; };      // origine en haut (shaders de carte, glTF)
const texN = url => { const t = TL.load(url); t.anisotropy = 4; return t; };
const loadF = url => new Promise((res, rej) => TL.load(url, t => { t.flipY = false; t.anisotropy = 4; res(t); }, undefined, rej));

const GLSL_COMMON = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 rainbow(float t){return .5+.5*cos(6.28318*(fract(t)+vec3(0.,.33,.67)));}
`;

/* ================= ciel et sol de l'espace d'invocation */
const U = { uT: { value: 0 } };
// reflets d'environnement : le fond vidéo de la salle se reflète dans le foil des cartes
const ENV = { uEnv: { value: null }, uEnvOn: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: { uT: U.uT, uTint: { value: new THREE.Color(0.24, 0.12, 0.43) }, uDim: { value: 0 }, uMir: { value: 0 }, uSpe: { value: 0 }, uZen: { value: 0 }, uPri: { value: 0 } },
  vertexShader: `varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `${GLSL_COMMON}
uniform float uT,uDim,uMir,uSpe,uZen,uPri;uniform vec3 uTint;varying vec3 vP;
void main(){
 float h=vP.y;
 vec3 col=mix(vec3(.012,.008,.025),uTint*.32,exp(-abs(h-.08)*4.));
 col+=uTint*.06*vnoise(vP.xz*3.+uT*.03);
 float a=atan(vP.x,-vP.z);
 col+=vec3(1.,.66,.3)*uZen*.22*exp(-abs(h-.05)*5.)*(.8+.2*vnoise(vec2(a*3.,uT*.05)));
 float wv=sin(vP.x*8.+uT*1.2+sin(vP.z*5.+uT))*.5+.5;
 col+=vec3(.8,.7,1.)*pow(wv,6.)*uMir*.25*exp(-abs(h-.15)*5.);
 col+=vec3(.3,.8,1.)*smoothstep(.55,.85,vnoise(vP.xz*4.+vec2(0.,uT*.2)))*uSpe*.2;
 col+=rainbow(a*.3+h+uT*.02)*uPri*.05*exp(-abs(h-.1)*3.);
 gl_FragColor=vec4(col*(1.-uDim*.75),1.);
}`,
}));
const arena = new THREE.Group();
scene.add(sky);
scene.add(arena);
const embTex = texN(IMG + "embleme.png");
const floorMat = new THREE.ShaderMaterial({
  uniforms: { uT: U.uT, uEmb: { value: embTex }, uTint: sky.material.uniforms.uTint, uGlow: { value: 0.6 }, uDim: sky.material.uniforms.uDim, uMir: sky.material.uniforms.uMir },
  vertexShader: `varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `${GLSL_COMMON}
uniform sampler2D uEmb;uniform float uT,uGlow,uDim,uMir;uniform vec3 uTint;varying vec2 vP;
void main(){
 float r=length(vP);
 vec3 col=vec3(.018,.014,.03)+uTint*.18*exp(-r*.9);
 vec2 q=vP+vec2(sin(r*7.-uT*3.),cos(r*6.-uT*2.6))*.03*uMir;
 
 float e=texture2D(uEmb,q/4.4+.5).a;
 col+=uTint*e*uGlow*.7;
 for(int i=0;i<3;i++){float rr=2.25+float(i)*.55;col+=uTint*.22*smoothstep(.01,0.,abs(r-rr));}
 col*=1.-smoothstep(4.,8.,r);
 gl_FragColor=vec4(col*(1.-uDim*.6),1.);
}`,
});
const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 96), floorMat);
floor.rotation.x = -Math.PI / 2;
arena.add(floor);
// colonnes de lumière
const shaftMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTint: sky.material.uniforms.uTint, uA: { value: 0.35 }, uT: U.uT },
  vertexShader: `varying vec2 vUv;varying float vF;void main(){vUv=uv;vec3 n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vF=abs(dot(n,normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `uniform vec3 uTint;uniform float uA,uT;varying vec2 vUv;varying float vF;
void main(){float a=(1.-vUv.y)*pow(vF,2.)*uA*(.7+.3*sin(uT*.7+vUv.x*6.28));gl_FragColor=vec4(uTint*a+vec3(a*.15),1.);}`,
});
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.7, 9, 24, 1, true), shaftMat);
  const an = i / 6 * Math.PI * 2 + 0.3;
  m.position.set(Math.cos(an) * 4.2, 4.5, Math.sin(an) * 4.2 - 1.5);
  arena.add(m);
}
// poussière
function makeDust(n, rad, hgt, size) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(n * 3), s = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.random() * 7, r = Math.sqrt(Math.random()) * rad; p.set([Math.cos(a) * r, Math.random() * hgt, Math.sin(a) * r], i * 3); s[i] = Math.random(); }
  g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("aS", new THREE.BufferAttribute(s, 1));
  return new THREE.Points(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: U.uT, uTint: sky.material.uniforms.uTint, uH: { value: hgt }, uSz: { value: size }, uA: { value: 1 } },
    vertexShader: `attribute float aS;uniform float uT,uH,uSz;varying float vA;
void main(){vec3 p=position;p.y=mod(p.y+uT*(.08+aS*.15),uH);p.x+=sin(uT*.3+aS*20.)*.15;
vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uSz*(.5+aS)*(300./-mv.z);vA=(.4+.6*sin(uT*2.+aS*30.))*smoothstep(0.,1.,p.y)*(1.-smoothstep(uH-1.5,uH,p.y));gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform vec3 uTint;uniform float uA;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA*uA;gl_FragColor=vec4((uTint+.4)*a,1.);}`,
  }));
}
const dust = makeDust(700, 6, 7, 0.06);
dust.position.z = -1;
arena.add(dust);

/* ================= booster (glTF Blender) */
const booster = new THREE.Group();
scene.add(booster);
const LIGHT = new THREE.Vector3(0.4, 0.6, 1).normalize();
const holoVS = `#include <common>
#include <morphtarget_pars_vertex>
varying vec2 vUv;varying vec3 vN;varying vec3 vV;
void main(){vUv=uv;
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
vN=normalize(normalMatrix*objectNormal);vec4 mv=modelViewMatrix*vec4(transformed,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
function holoMat(ink, gold) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true,
    uniforms: { uInk: { value: texF(ink) }, uGold: { value: texF(gold) }, uL: { value: LIGHT }, uT: U.uT, uOp: { value: 1 }, uB: { value: 1 } },
    vertexShader: holoVS,
    fragmentShader: `${GLSL_COMMON}
uniform sampler2D uInk,uGold;uniform vec3 uL;uniform float uT,uOp,uB;varying vec2 vUv;varying vec3 vN;varying vec3 vV;
void main(){
 vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(vV);vec3 L=normalize(uL);
 vec3 R=reflect(-V,N);float fres=1.-max(dot(N,V),0.);
 float diff=max(dot(N,L),0.);float spec=pow(max(dot(R,L),0.),36.);
 float env=.35+.65*smoothstep(-.3,.8,R.y);
 float hue=dot(R,vec3(.45,.6,.25))*1.1+vUv.y*.7+vnoise(vUv*9.)*.25+uT*.015;
 vec3 foil=rainbow(hue)*.5+.62;
 vec3 metal=foil*(.45+.65*diff)*env+vec3(spec)*1.4+rainbow(hue+.35)*fres*.45;
 if(!gl_FrontFacing)metal=foil*.4;
 vec4 ink=texture2D(uInk,vUv);
 vec3 col=mix(metal,ink.rgb*(.75+.4*diff+.2*env)+metal*.25,ink.a*.85);
 float g=texture2D(uGold,vUv).r;
 vec3 gold=vec3(1.,.76,.33)*(.35+.85*diff*env)+vec3(1.,.92,.65)*spec*1.8+vec3(.5,.32,.08)*fres+rainbow(hue)*.08;
 col=mix(col,gold,g);
 gl_FragColor=vec4(col*uB,uOp);
}`,
  });
}
const rimMat = new THREE.ShaderMaterial({
  transparent: true, uniforms: { uL: { value: LIGHT }, uOp: { value: 1 } }, vertexShader: holoVS,
  fragmentShader: `uniform vec3 uL;uniform float uOp;varying vec3 vN;varying vec3 vV;varying vec2 vUv;
void main(){vec3 N=normalize(vN);float d=max(dot(N,normalize(uL)),0.);gl_FragColor=vec4(vec3(.55,.55,.62)*(.35+.65*d),uOp);}`,
});
const PF = holoMat(IMG + "booster_front.webp", IMG + "booster_front_gold.webp");
const PB = holoMat(IMG + "booster_back.webp", IMG + "booster_back_gold.webp");
const stripMats = [PF.clone(), PB.clone(), rimMat.clone()];
stripMats[0].uniforms.uInk = PF.uniforms.uInk; stripMats[0].uniforms.uGold = PF.uniforms.uGold; stripMats[0].uniforms.uT = U.uT;
stripMats[1].uniforms.uInk = PB.uniforms.uInk; stripMats[1].uniforms.uGold = PB.uniforms.uGold; stripMats[1].uniforms.uT = U.uT;
let body = null, strip = null, bodyMeshes = [], ready = false;
const glbBytes = Uint8Array.from(atob(window.BOOSTER_GLB), c => c.charCodeAt(0)).buffer;
new GLTFLoader().parse(glbBytes, "", gltf => {
  const root = gltf.scene;
  root.traverse(o => {
    if (!o.isMesh) return;
    const isStrip = (o.parent && o.parent.name.includes("Languette")) || o.name.includes("Languette");
    const nm = o.material.name;
    if (isStrip) o.material = nm === "face_avant" ? stripMats[0] : nm === "face_arriere" ? stripMats[1] : stripMats[2];
    else { o.material = nm === "face_avant" ? PF : nm === "face_arriere" ? PB : rimMat; bodyMeshes.push(o); }
    o.frustumCulled = false;
  });
  root.traverse(o => { if (o.name === "Booster_Languette") strip = o; if (o.name === "Booster_Corps") body = o; });
  booster.add(root);
  ready = true;
}, err => console.error("booster", err));
// lumière qui s'échappe
const glowTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,250,235,1)"); g.addColorStop(0.35, "rgba(255,210,240,.55)"); g.addColorStop(1, "rgba(255,180,240,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
})();
const addMat = (map, color = 0xffffff) => new THREE.MeshBasicMaterial({ map, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
const mouthGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.7), addMat(glowTex));
mouthGlow.position.set(0, 1.0, 0.05);
booster.add(mouthGlow);
const rayTex = (() => {
  const c = document.createElement("canvas"); c.width = 16; c.height = 256; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, "rgba(255,250,235,1)"); g.addColorStop(0.4, "rgba(255,200,240,.5)"); g.addColorStop(1, "rgba(160,200,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 16, 256);
  const h = x.createLinearGradient(0, 0, 16, 0); h.addColorStop(0, "rgba(0,0,0,1)"); h.addColorStop(0.5, "rgba(0,0,0,0)"); h.addColorStop(1, "rgba(0,0,0,1)");
  x.globalCompositeOperation = "destination-out"; x.fillStyle = h; x.fillRect(0, 0, 16, 256);
  return new THREE.CanvasTexture(c);
})();
const rays = new THREE.Group();
for (let i = 0; i < 14; i++) {
  const g = new THREE.PlaneGeometry(0.09 + Math.random() * 0.12, 4.5); g.translate(0, 2.25, 0);
  const m = new THREE.Mesh(g, addMat(rayTex));
  const x = (i / 13 - 0.5) * 1.2;
  m.position.set(x, 1.0, 0.02 + Math.random() * 0.04); m.rotation.z = -x * 0.5 + (Math.random() - 0.5) * 0.25;
  m.userData.o = 0.35 + Math.random() * 0.5;
  rays.add(m);
}
booster.add(rays);

/* ================= particules d'éclat (réutilisables) */
const bursts = [];
function burst(pos, color, n = 120, speed = 1.6, life = 1.6, up = 0.3) {
  const g = new THREE.BufferGeometry(), v = new Float32Array(n * 3), s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 7, b = Math.acos(Math.random() * 2 - 1), sp = speed * (0.3 + Math.random());
    v.set([Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp * 0.7 + up, Math.sin(b) * Math.sin(a) * sp * 0.6], i * 3); s[i] = Math.random();
  }
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("aV", new THREE.BufferAttribute(v, 3)); g.setAttribute("aS", new THREE.BufferAttribute(s, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uK: { value: 0 }, uC: { value: new THREE.Color(...color) }, uLife: { value: life } },
    vertexShader: `attribute vec3 aV;attribute float aS;uniform float uK,uLife;varying float vA;
void main(){float t=uK*uLife;vec3 p=aV*(1.-exp(-t*2.2))/2.2+vec3(0.,-.25*t*t,0.);vec4 mv=modelViewMatrix*vec4(p,1.);
gl_PointSize=(2.+aS*5.)*(1.-uK*.6)*(300./-mv.z)*.02*40.;vA=(1.-uK)*(.5+.5*aS);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform vec3 uC;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(uC*smoothstep(.5,0.,d)*vA*1.6,1.);}`,
  });
  const p = new THREE.Points(g, m); p.position.copy(pos); p.frustumCulled = false;
  scene.add(p); bursts.push({ p, t0: performance.now(), life: life * 1000 });
}
function ring3d(pos, color, r0, r1, dur, tilt = 1.2, w = 0.008) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, w, 8, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(...color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.copy(pos); m.rotation.x = tilt; m.scale.setScalar(r0); scene.add(m);
  gsap.to(m.scale, { x: r1, y: r1, z: r1, duration: dur, ease: "power3.out" });
  gsap.to(m.material, { opacity: 0, duration: dur, ease: "power2.in", onComplete: () => { scene.remove(m); m.geometry.dispose(); } });
}

/* ================= la carte 3D */
const CHW = 2.2, CWW = CHW * 900 / 1256, DTH = 0.012;
const cardRoot = new THREE.Group(), tiltG = new THREE.Group(), flipG = new THREE.Group();
cardRoot.add(tiltG); tiltG.add(flipG); arena.add(cardRoot);
cardRoot.position.set(0, 1.5, 0);
const dosTex = texN(IMG + "dos.webp");
const cardVS = `varying vec2 vUv;varying vec3 vN;varying vec3 vV;
void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
const BACK_FS = `${GLSL_COMMON}
uniform sampler2D uMap,uEnv;uniform float uEnvOn;uniform vec3 uL,uGlowCol,uRimCol;uniform float uT,uGlow,uHue,uB,uOp,uHaze,uRim,uBurn,uAsp;varying vec2 vUv;varying vec3 vN;varying vec3 vV;
vec3 hueRot(vec3 c,float a){const vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}
float field(vec2 uv){vec2 q=(uv-.5)*vec2(uAsp,1.);vec2 e=vec2(uAsp,1.)*.5-abs(q);float d=min(e.x,e.y);
 return d+(vnoise(uv*vec2(4.,5.5))-.5)*.17+(vnoise(uv*vec2(13.,15.))-.5)*.05;}
void main(){
 vec2 uv=vUv;
 vec2 hz=vec2(vnoise(uv*vec2(7.,11.)+vec2(0.,-uT*1.6))-.5,vnoise(uv*vec2(9.,6.)+vec2(4.,-uT*2.1))-.5)*.03*uHaze;
 vec4 c=texture2D(uMap,uv+hz);
 if(uHaze>.01){c.r=texture2D(uMap,uv+hz*1.6+vec2(.004*uHaze,0.)).r;c.b=texture2D(uMap,uv+hz*.5-vec2(.004*uHaze,0.)).b;}
 if(c.a<.01)discard;
 vec3 N=normalize(vN),V=normalize(vV),L=normalize(uL);vec3 R=reflect(-V,N);
 float spec=pow(max(dot(R,L),0.),28.);float fres=1.-max(dot(N,V),0.);
 vec3 col=hueRot(c.rgb,uHue)*uB*.9;
 float hol=dot(R.xy,vec2(.7,.5))*2.2+vUv.y*1.4+uT*.05;
 col+=rainbow(hol)*(.1+.45*fres+.3*spec)*.5+vec3(spec)*.55;
 if(uEnvOn>0.){vec2 eu=clamp(vec2(.5)+R.xy*.45,0.,1.);col+=texture2D(uEnv,eu).rgb*(.1+.5*fres+.35*spec)*uEnvOn;}
 // lumière qui traverse le carton (contre-jour)
 float r=length((vUv-vec2(.5,.545))*vec2(.72,1.));float lum=dot(c.rgb,vec3(.3,.5,.2));
 col+=uGlowCol*uGlow*lum*(exp(-r*2.6)*1.5+.18);
 // liseré lumineux sur le bord (la lumière déborde de la tranche)
 vec2 q=(vUv-.5)*vec2(uAsp,1.);vec2 e=vec2(uAsp,1.)*.5-abs(q);float ed=min(e.x,e.y);
 col+=uRimCol*uRim*smoothstep(.02,0.,ed);
 float a=c.a*uOp;
 if(uBurn>0.){
  float k=field(vUv)-mix(-.13,.5,uBurn);
  if(k<0.){ // zone consumée : flammes noires à reflets holo qui lèchent depuis le front
   float fl=vnoise(vec2(vUv.x*13.,vUv.y*5.-uT*2.4))*.7+vnoise(vec2(vUv.x*29.,vUv.y*11.-uT*3.6))*.3;
   float f=smoothstep(.02+.075*fl*fl,0.,-k);
   if(f<.03)discard;
   float rim=smoothstep(.15,.55,f)*(1.-smoothstep(.55,.95,f));
   vec3 hc=rainbow(vUv.y*1.3+vUv.x*.8+uT*.22+fl*.6)*vec3(.75,.8,1.)+vec3(.15,.05,.3);
   vec3 fc=vec3(.012,.008,.02)+hc*rim*1.1;
   float fa=f*.92;gl_FragColor=vec4(fc*fa,fa);return;
  }
  col=mix(col,vec3(.025,.018,.03),smoothstep(.055,.004,k)*.95);           // carton noirci
  float em=smoothstep(.013,0.,k);
  col+=mix(vec3(.55,.3,1.),rainbow(vUv.x*2.3+vUv.y*1.7+uT*.35),.55)*em*1.8; // braise holo
 }
 gl_FragColor=vec4(col*a,a);}`;
const backMat = new THREE.ShaderMaterial({
  transparent: true, premultipliedAlpha: true,
  uniforms: { uMap: { value: dosTex }, uL: { value: LIGHT }, uT: U.uT, uGlow: { value: 0 }, uGlowCol: { value: new THREE.Color(1, 0.75, 0.35) }, uHue: { value: 0 }, uB: { value: 1 }, uOp: { value: 1 },
    uHaze: { value: 0 }, uRim: { value: 0 }, uRimCol: { value: new THREE.Color(1, 0.8, 0.5) }, uBurn: { value: 0 }, uAsp: { value: CWW / CHW }, uEnv: ENV.uEnv, uEnvOn: ENV.uEnvOn },
  vertexShader: cardVS,
  fragmentShader: BACK_FS,
});
const planeG = new THREE.PlaneGeometry(CWW, CHW);
const backMesh = new THREE.Mesh(planeG, backMat);
backMesh.position.z = DTH;
flipG.add(backMesh);
const frontMat = new THREE.ShaderMaterial({
  transparent: true, premultipliedAlpha: true,
  uniforms: {
    uIll: { value: null }, uOver: { value: null }, uMask: { value: null }, uT: { value: 0 }, uLoop: { value: 4 }, uMode: { value: 1 },
    uFx: { value: 0 }, uDepth: { value: 0 }, uZoom: { value: 1 }, uGhost: { value: 0 }, uAsp: { value: 900 / 1256 }, uFlash: { value: 0 },
    uTilt: { value: new THREE.Vector2() }, uPts: { value: new Float32Array(256) }, uPtCol: { value: new Float32Array(192) }, uEnv: ENV.uEnv, uEnvOn: ENV.uEnvOn,
  },
  vertexShader: `varying vec2 vUv;void main(){vUv=vec2(uv.x,1.-uv.y);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: window.CARD_FS.replace("precision highp float;", "uniform sampler2D uEnv;uniform float uEnvOn;")
    .replace("gl_FragColor=vec4(col*a,a);", "if(uEnvOn>0.){vec2 eu=clamp(vec2(.5)+(uv-.5)*.5+uTilt*.7,0.,1.);col+=texture2D(uEnv,eu).rgb*(mk.r*.32+.04)*uEnvOn;}gl_FragColor=vec4(col*a*.9,a);"),
});
const frontMesh = new THREE.Mesh(planeG, frontMat);
frontMesh.rotation.y = Math.PI; frontMesh.position.z = -DTH;
flipG.add(frontMesh);
// tranche
const shp = new THREE.Shape(); const rr = 0.11, hw = CWW / 2 - 0.004, hh = CHW / 2 - 0.004;
shp.moveTo(-hw + rr, -hh); shp.lineTo(hw - rr, -hh); shp.quadraticCurveTo(hw, -hh, hw, -hh + rr); shp.lineTo(hw, hh - rr); shp.quadraticCurveTo(hw, hh, hw - rr, hh);
shp.lineTo(-hw + rr, hh); shp.quadraticCurveTo(-hw, hh, -hw, hh - rr); shp.lineTo(-hw, -hh + rr); shp.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
const edgeG = new THREE.ExtrudeGeometry(shp, { depth: DTH * 2 - 0.004, bevelEnabled: false, curveSegments: 6 });
edgeG.translate(0, 0, -DTH + 0.002);
const edgeMat = new THREE.MeshBasicMaterial({ color: 0x17131f, transparent: true });
flipG.add(new THREE.Mesh(edgeG, edgeMat));
// points (éclats, braises…) calculés comme en 2D
const fxState = { fx: 0, depth: 0, zoom: 1, ghost: 0, flash: 0, tiltX: 0, tiltY: 0 };
const ptHost = { pts: frontMat.uniforms.uPts.value, pcol: frontMat.uniforms.uPtCol.value, state: fxState, card: null, mode: 1 };
let curCard = null;
async function loadCard(c) {
  const [i, o, m] = await Promise.all([loadF(c.ill), loadF(c.over), loadF(c.masks)]);
  const u = frontMat.uniforms;
  [u.uIll.value, u.uOver.value, u.uMask.value].forEach(t => t && t.dispose());
  u.uIll.value = i; u.uOver.value = o; u.uMask.value = m;
  ptHost.card = c; ptHost.mode = { zenkai: 0, mirage: 1, spectre: 2, prisme: 3, eclat: 4 }[c.rarity] ?? 1;
  u.uMode.value = ptHost.mode; u.uLoop.value = c.rarity === "zenkai" ? 3 : 4;
  curCard = c;
}
// assemblage ZENKAI : calques sur plusieurs plans
const asmG = new THREE.Group(); asmG.rotation.y = Math.PI; asmG.position.z = -DTH - 0.004; flipG.add(asmG);
// fantômes MIRAGE
const ghostG = new THREE.Group(); cardRoot.add(ghostG);
const ghostCols = [[1, 0.6, 0.9], [0.6, 0.8, 1], [0.8, 0.7, 1], [0.6, 1, 0.9]];
const ghosts = ghostCols.map(c => {
  const m = new THREE.Mesh(planeG, new THREE.MeshBasicMaterial({ map: dosTex, color: new THREE.Color(...c), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  ghostG.add(m); return m;
});
// éventail spectral (PRISME)
const fan = new THREE.Group(); fan.position.set(0, 1.5, -0.3); arena.add(fan);
for (let i = 0; i < 24; i++) {
  const g = new THREE.PlaneGeometry(0.16, 4); g.translate(0, 2, 0);
  const col = new THREE.Color().setHSL(i / 24, 1, 0.6);
  const m = new THREE.Mesh(g, addMat(rayTex, col)); m.rotation.z = i / 24 * Math.PI * 2; fan.add(m);
}
// traînées d'énergie (ZENKAI)
const streaks = [];
for (let i = 0; i < 16; i++) {
  const g = new THREE.PlaneGeometry(2.5, 0.025); const m = new THREE.Mesh(g, addMat(rayTex, new THREE.Color(1, 0.8, 0.45)));
  m.rotation.z = Math.PI / 2; m.visible = false; arena.add(m); streaks.push(m);
}
// calque de combustion SPECTRE : copie du dos, posée côté face (la face apparaît à travers ce qui brûle)
const burnG = new THREE.PlaneGeometry(CWW, CHW, 48, 64);
const burnMat = new THREE.ShaderMaterial({
  transparent: true, premultipliedAlpha: true, depthWrite: false,
  uniforms: { uMap: { value: dosTex }, uL: { value: LIGHT }, uT: U.uT, uGlow: { value: 0 }, uGlowCol: { value: new THREE.Color(1, 0.75, 0.35) }, uHue: { value: 0 }, uB: { value: 1 }, uOp: { value: 1 },
    uHaze: { value: 0 }, uRim: { value: 0 }, uRimCol: { value: new THREE.Color(1, 0.8, 0.5) }, uBurn: { value: 0 }, uAsp: { value: CWW / CHW }, uEnv: ENV.uEnv, uEnvOn: ENV.uEnvOn },
  // le carton se gondole un peu juste devant le front de flamme
  vertexShader: `${GLSL_COMMON}uniform float uBurn,uAsp;varying vec2 vUv;varying vec3 vN;varying vec3 vV;
float field(vec2 uv){vec2 q=(uv-.5)*vec2(uAsp,1.);vec2 e=vec2(uAsp,1.)*.5-abs(q);float d=min(e.x,e.y);
 return d+(vnoise(uv*vec2(4.,5.5))-.5)*.17+(vnoise(uv*vec2(13.,15.))-.5)*.05;}
void main(){vUv=uv;vec3 p=position;
 if(uBurn>0.){float k=field(uv)-mix(-.13,.5,uBurn);p.z+=smoothstep(.09,0.,k)*step(0.,k)*.07;}
 vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(p,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: BACK_FS,
});
const burnMesh = new THREE.Mesh(burnG, burnMat);
burnMesh.rotation.y = Math.PI; burnMesh.position.z = -DTH - 0.003; burnMesh.renderOrder = 5; burnMesh.visible = false;
flipG.add(burnMesh);

// contre-jour : une source derrière la carte, diffusée dans l'air (la carte la masque, la lumière déborde)
const backLight = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uT: U.uT, uI: { value: 0 }, uC: { value: new THREE.Color(1, 0.75, 0.4) }, uDisp: { value: 0 } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `${GLSL_COMMON}uniform float uT,uI,uDisp;uniform vec3 uC;varying vec2 vUv;
void main(){vec2 p=(vUv-.5)*10.;float r=length(p*vec2(1.,.82));vec2 d=p/max(r,1e-3);
 float n=vnoise(d*3.2+vec2(uT*.04,0.))*.6+vnoise(d*8.5+vec2(0.,uT*.07)+5.)*.4;
 float core=exp(-r*1.5)*1.1+exp(-r*.6)*.3;
 float beams=pow(n,3.2)*exp(-r*.35)*1.6;
 float I=(core+beams)*uI*smoothstep(5.,2.6,r);
 vec3 col=mix(uC,rainbow(atan(d.y,d.x)*.159+r*.08)*1.1,uDisp)*I;
 gl_FragColor=vec4(col,1.);}`,
}));
backLight.position.set(0, 1.5, -1.0); arena.add(backLight);

// caustique PRISME : la lumière dispersée par la carte retombe en spectre sur le sol
const caustic = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uT: U.uT, uI: { value: 0 }, uAng: { value: 0 } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `${GLSL_COMMON}uniform float uT,uI,uAng;varying vec2 vUv;
vec3 spect(float x){return clamp(vec3(1.6-abs(4.*x-3.2),1.6-abs(4.*x-2.),1.6-abs(4.*x-.8)),0.,1.);}
void main(){vec2 p=(vUv-vec2(.5,.08))*7.;float r=length(p);float a=atan(p.x,p.y)-uAng;
 float w=.11+.02*r;float x=a/w*.5+.5;
 float band=smoothstep(0.,.12,x)*smoothstep(1.,.88,x);
 float I=band*exp(-r*.45)*smoothstep(.3,1.2,r)*uI*(.85+.15*vnoise(vec2(r*3.-uT*.4,a*9.)));
 gl_FragColor=vec4(spect(clamp(x,0.,1.))*I,1.);}`,
}));
caustic.rotation.x = -Math.PI / 2; caustic.position.set(0, 0.012, -0.2); arena.add(caustic);

// particules physiques (cendres, braises) dans le repère de la carte
function particles(n, add) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute("aS", new THREE.BufferAttribute(new Float32Array(n), 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uT: U.uT },
    vertexShader: `attribute float aA,aS;varying float vA,vS;void main(){vA=aA;vS=aS;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aS*(260./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: add
      ? `${GLSL_COMMON}uniform float uT;varying float vA,vS;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d)*vA;gl_FragColor=vec4((rainbow(vS*9.+uT*.5)*.6+vec3(.45,.35,.8))*a,a);}`
      : `varying float vA,vS;void main(){vec2 q=gl_PointCoord-.5;q.x*=1.6+vS*3.;float d=length(q);float a=smoothstep(.5,.3,d)*vA;gl_FragColor=vec4(vec3(.03,.025,.035),a*.85);}`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 8;
  p.userData = { n, list: [] }; cardRoot.add(p); return p;
}
const ash = particles(220, false), sparks = particles(160, true);
function emit(sys, x, y, z, vx, vy, life, size) { const L = sys.userData.list; if (L.length < sys.userData.n) L.push({ x, y, z, vx, vy, vz: (Math.random() - 0.5) * 0.15, t: 0, life, size, ph: Math.random() * 6 }); }
function stepParticles(sys, dt, now) {
  const L = sys.userData.list, P = sys.geometry.attributes.position.array, AA = sys.geometry.attributes.aA.array, SS = sys.geometry.attributes.aS.array;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i]; q.t += dt; if (q.t > q.life) { L.splice(i, 1); continue; }
    q.vy += 0.35 * dt; q.vx *= 1 - 0.8 * dt; q.vy *= 1 - 0.6 * dt;               // la chaleur fait monter, l'air freine
    q.vx += Math.sin(now * 1.7 + q.ph + q.y * 3) * 0.6 * dt;                         // turbulence
    q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
  }
  for (let i = 0; i < sys.userData.n; i++) {
    const q = L[i];
    if (q) { P[i * 3] = q.x; P[i * 3 + 1] = q.y; P[i * 3 + 2] = q.z; const k = q.t / q.life; AA[i] = Math.min(1, k * 8) * (1 - k); SS[i] = q.size; }
    else AA[i] = 0;
  }
  sys.geometry.attributes.position.needsUpdate = sys.geometry.attributes.aA.needsUpdate = sys.geometry.attributes.aS.needsUpdate = true;
}
// point au hasard sur le front de flamme (rectangle rentré de la profondeur brûlée)
function burnFront(b) {
  const d = Math.max(0, THREE.MathUtils.lerp(-0.13, 0.5, b)) * CHW, hw = Math.max(0.02, CWW / 2 - d), hh = Math.max(0.02, CHW / 2 - d);
  const per = 2 * (hw + hh), u = Math.random() * per * 2;
  let x, y;
  if (u < 2 * hw) { x = -hw + u; y = hh; } else if (u < 2 * hw + 2 * hh) { x = hw; y = hh - (u - 2 * hw); }
  else if (u < 4 * hw + 2 * hh) { x = hw - (u - 2 * hw - 2 * hh); y = -hh; } else { x = -hw; y = -hh + (u - 4 * hw - 2 * hh); }
  return [x + (Math.random() - 0.5) * 0.06, y + (Math.random() - 0.5) * 0.06];
}
const spring = (z = 0.8, w = 9) => { const s = Math.sqrt(1 - z * z), wd = w * s, k = z / s; return t => t >= 1 ? 1 : 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + k * Math.sin(wd * t)); };

/* ================= caméra, taille, inclinaison */
const CAM = { x: 0, y: 0, z: 6.4, tx: 0, ty: 0, tz: 0, fov: 35, shake: 0, hand: 0.016 };
function fitDist(h, w) {
  const t = Math.tan(THREE.MathUtils.degToRad(CAM.fov / 2));
  return Math.max(h / (2 * t), w / (2 * t * camera.aspect));
}
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); lens.uniforms.uRes.value.set(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();
const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", e => { tilt.tx = (e.clientX / innerWidth - 0.5) * 2; tilt.ty = (e.clientY / innerHeight - 0.5) * 2; });
addEventListener("pointerleave", () => { tilt.tx = tilt.ty = 0; });
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function hit(e, objs) { ndc.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects(objs, true).length > 0; }

/* ================= interface partagée avec la 2D */
const hint = $("#hint"), flash = $("#flash"), wave = $("#wave"), site = $("#site"), skipB = $("#skip");
let state = "booster", idx = 0, tl = null, finish = null, fast = false;
const say = (txt, d = 0.4) => gsap.to(hint, { opacity: txt ? 1 : 0, duration: d, onStart: () => { if (txt) hint.textContent = txt; } });
say("Glisse sur le haut du booster pour le déchirer", 1);
function setSkip(on) { skipB.style.display = on ? "block" : "none"; }
skipB.onclick = e => { e.stopPropagation(); if (tl && finish) { tl.progress(1, true); tl.kill(); const f = finish; finish = null; f(); } };
$("#fast").onclick = e => { e.stopPropagation(); fast = !fast; e.currentTarget.setAttribute("aria-pressed", fast); gsap.globalTimeline.timeScale(fast ? 2 : 1); };
$("#snd").onclick = e => { e.stopPropagation(); A.init(); const m = !A.muted; A.mute(m); e.currentTarget.setAttribute("aria-pressed", !m); };
function run(timeline, done) { tl = timeline; finish = done; setSkip(true); timeline.eventCallback("onComplete", () => { if (finish) { const f = finish; finish = null; f(); } }); }
const SKY = sky.material.uniforms;
const setTint = (rar, d = 1) => { const c = TINT[rar] || [0.24, 0.12, 0.43]; gsap.to(SKY.uTint.value, { r: c[0] * 0.75, g: c[1] * 0.75, b: c[2] * 0.75, duration: d }); };
const CARDPOS = new THREE.Vector3(0, 1.5, 0);
/* ================= fond vidéo de la salle (banque Canva) : annonce la meilleure carte du booster */
const bgTex = new THREE.VideoTexture(window.ZK_BG.el);
bgTex.minFilter = bgTex.magFilter = THREE.LinearFilter; bgTex.generateMipmaps = false;
const bgMat = new THREE.ShaderMaterial({
  depthWrite: false, depthTest: false,
  uniforms: { uTex: { value: bgTex }, uAsp: { value: 1 }, uVA: { value: 16 / 9 }, uOff: { value: new THREE.Vector2() }, uScale: { value: 1.05 }, uDim: SKY.uDim, uOp: { value: 0 }, uB: { value: 0.66 } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.9999,1.);}`,
  fragmentShader: `uniform sampler2D uTex;uniform float uAsp,uVA,uScale,uDim,uOp,uB;uniform vec2 uOff;varying vec2 vUv;
void main(){vec2 s=uAsp>uVA?vec2(1.,uVA/uAsp):vec2(uAsp/uVA,1.);
 vec2 uv=(vUv-.5)*s/uScale+.5+uOff;
 vec3 c=vec3(0.);float r=.0035;
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)c+=texture2D(uTex,uv+vec2(float(i),float(j))*r).rgb;
 c/=9.;
 vec2 q=vUv-.5;c*=1.-dot(q,q)*.9;
 c*=uB*(1.-uDim*.85);
 gl_FragColor=vec4(c*uOp,1.);}`,
});
ENV.uEnv.value = bgTex;
const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
bgQuad.frustumCulled = false; bgQuad.renderOrder = -10; bgQuad.visible = false; scene.add(bgQuad);
queueMicrotask(() => showManga());

// écran du booster : le mur manga ZENKAI en toile de fond, sombre et flou
const mangaTex = new THREE.TextureLoader().load(IMG + "mur_manga.webp");
mangaTex.minFilter = THREE.LinearFilter;
function showManga() {
  bgQuad.visible = true; sky.visible = false; ENV.uEnvOn.value = 0;
  Object.assign(bgMat.uniforms, {}); bgMat.uniforms.uTex.value = mangaTex; bgMat.uniforms.uVA.value = 1.5; bgMat.uniforms.uB.value = 0.3; bgMat.uniforms.uOp.value = 1;
}
function showBg(on) {
  bgMat.uniforms.uTex.value = bgTex; bgMat.uniforms.uB.value = 0.66;
  bgQuad.visible = on; sky.visible = !on; floor.visible = !on; ENV.uEnvOn.value = on ? 1 : 0;
  arena.children.forEach(o => { if (o.material === shaftMat) o.visible = !on; });
  if (on) { window.ZK_BG.play(); if (window.ZK_BG.reduce) bgMat.uniforms.uTex.value = texN(window.ZK_BG.el.poster); }
}


/* ================= boucle */
let last = performance.now(), mode = "booster";
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  U.uT.value = now / 1000;
  tilt.x += (tilt.tx - tilt.x) * 0.06; tilt.y += (tilt.ty - tilt.y) * 0.06;
  LIGHT.set(0.35 + tilt.x * 0.9, 0.55 - tilt.y * 0.7, 1).normalize();
  if (mode === "booster") {
    booster.rotation.y = tilt.x * 0.45 + Math.sin(now / 2400) * 0.06; booster.rotation.x = tilt.y * 0.25;
    if (state === "booster") booster.position.y += (-0.45 + Math.sin(now / 1100) * 0.05 - booster.position.y) * 0.1;
  } else {
    tiltG.rotation.y = tilt.x * 0.32; tiltG.rotation.x = tilt.y * 0.22;
    // inclinaison réelle de la face avant -> reflets du shader
    const ry = ((flipG.rotation.y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    fxState.tiltX = THREE.MathUtils.clamp(-(tiltG.rotation.y + (ry - Math.PI)) * 1.1, -0.5, 0.5);
    fxState.tiltY = THREE.MathUtils.clamp(tiltG.rotation.x * 1.6, -0.5, 0.5);
  }
  // caméra « à l'épaule » : dérive lente + tremblement amorti (pas de bruit aléatoire image par image)
  const t = now / 1000, hd = CAM.hand, sh = CAM.shake;
  const hx = hd * (Math.sin(t * 0.61) * 0.6 + Math.sin(t * 1.37 + 1.3) * 0.3 + Math.sin(t * 2.9 + 0.7) * 0.1) + sh * (Math.sin(t * 23) * 0.5 + Math.sin(t * 37 + 1) * 0.5);
  const hy = hd * (Math.sin(t * 0.53 + 2.1) * 0.6 + Math.sin(t * 1.21 + 0.4) * 0.3 + Math.sin(t * 3.1 + 2) * 0.1) + sh * (Math.sin(t * 29 + 2) * 0.5 + Math.sin(t * 41) * 0.5);
  camera.position.set(CAM.x + hx, CAM.y + hy, CAM.z);
  camera.lookAt(CAM.tx + hx * 0.35, CAM.ty + hy * 0.35, CAM.tz);
  camera.rotateZ(hd * Math.sin(t * 0.47) * 0.22);
  lens.uniforms.uT.value = t;
  stepParticles(ash, dt, t); stepParticles(sparks, dt, t);
  caustic.material.uniforms.uAng.value = -tiltG.rotation.y * 1.4 + Math.sin(t * 0.3) * 0.06;
  if (bgQuad.visible) {
    const bu = bgMat.uniforms; bu.uAsp.value = camera.aspect;
    const vw = window.ZK_BG.el.videoWidth, vh = window.ZK_BG.el.videoHeight; if (vw && mode === "arena") bu.uVA.value = vw / vh;
    bu.uOff.value.set(-tilt.x * 0.008 - (CAM.x + hx) * 0.01, tilt.y * 0.006 + hy * 0.01);
    bu.uScale.value = mode === "arena" ? 1.05 + Math.max(0, camHome().z - CAM.z) * 0.035 : 1.06;
  }
  if (camera.fov !== CAM.fov) { camera.fov = CAM.fov; camera.updateProjectionMatrix(); }
  // carte
  if (ptHost.card) {
    window.CardGL.prototype.points.call(ptHost, now / 1000);
    const u = frontMat.uniforms;
    u.uT.value = now / 1000; u.uFx.value = fxState.fx; u.uDepth.value = fxState.depth; u.uZoom.value = fxState.zoom;
    u.uGhost.value = fxState.ghost; u.uFlash.value = fxState.flash; u.uTilt.value.set(fxState.tiltX, fxState.tiltY);
  }
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i], k = (now - b.t0) / b.life;
    if (k >= 1) { scene.remove(b.p); b.p.geometry.dispose(); bursts.splice(i, 1); } else b.p.material.uniforms.uK.value = k;
  }
  if (burnMesh.visible && burnMat.uniforms.uBurn.value > 0) emitBurn(dt);
  if (tear && !tear.st.done) tear.step(dt);
  streaks.forEach(s => { if (s.visible) { s.position.x += s.userData.v * dt; if (s.position.x > 8) s.visible = false; } });
  fan.rotation.z -= dt * 0.25;
  composer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
CAM.z = 6.0; CAM.y = -0.15; CAM.ty = -0.15;
booster.position.y = -0.45;
arena.visible = false; sky.material.uniforms.uDim.value = 0.5;

/* ================= étapes 1-3 : booster 3D */
canvas.addEventListener("pointerdown", e => {
  pdx = e.clientX;
  if ((state === "booster" || state === "tearing") && ready && !TG && hit(e, [booster])) beginTear(e);
});
let pdx = null;
canvas.addEventListener("click", e => {
  if (false) return;
  else if (state === "ready" && hit(e, [cardRoot])) reveal();
  else if (state === "revealed") next();
});
canvas.addEventListener("pointerup", e => { if (TG) endTear(e); });
canvas.addEventListener("pointercancel", e => { if (TG) endTear(e); });
canvas.addEventListener("pointerup", e => { if (pdx !== null && state === "revealed" && Math.abs(e.clientX - pdx) > 60) next(); pdx = null; });
canvas.addEventListener("pointermove", e => { if (TG) { moveTear(e); return; } if (state === "booster" && ready && hit(e, [booster])) preloadAmmo(); if (state === "booster" && ready) canvas.style.cursor = hit(e, [booster]) ? "pointer" : "default"; else if (state === "ready") canvas.style.cursor = hit(e, [cardRoot]) ? "pointer" : "default"; });

/* ---- déchirure physique : on glisse sur le haut du booster, la languette se déchire vraiment */
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
let tear = null, tearP = null, TG = null;        // TG = geste en cours
function stripWidthPx() {
  if (!tear) return innerWidth * 0.4;
  const a = new THREE.Vector3(tear.corner.x, tear.corner.y, tear.zc).applyMatrix4(booster.matrixWorld).project(camera);
  const b = new THREE.Vector3(tear.corner.x - tear.W, tear.corner.y, tear.zc).applyMatrix4(booster.matrixWorld).project(camera);
  return Math.max(80, Math.abs(a.x - b.x) * innerWidth / 2);
}
function beginTear(e) {
  if (REDUCE) { openBooster(); return; }
  if (state === "booster") {
    state = "tearing"; A.init(); A.ambient(true, 4); say(""); A.crinkle(4, 0.25);
    gsap.to(booster.position, { y: -0.25, duration: 0.45, ease: "power2.out" });
    if (!tearP) tearP = makeTear(THREE, { booster, strip, frontMat: stripMats[0], backMat: stripMats[1], mats: stripMats })
      .then(t => { tear = t; return t; })
      .catch(err => { console.warn("physique indisponible", err); tear = null; state = "booster"; TG = null; openBooster(); });
  }
  TG = { sx: e.clientX, sy: e.clientY, t0: performance.now(), base: tear ? tear.st.p : 0, moved: 0, ripped: false };
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
}
function moveTear(e) {
  if (!tear || tear.st.released) return;
  const dx = TG.sx - e.clientX, dy = TG.sy - e.clientY;
  TG.moved = Math.max(TG.moved, Math.hypot(dx, dy));
  const wpx = stripWidthPx(), k = tear.W / wpx;
  const p = TG.base + (Math.abs(dx) + Math.max(0, dy) * 0.5) / (wpx * 0.85);
  const n = tear.setHand(p, -dx * k, dy * k);
  if (n > 0) { if (!TG.ripped) { TG.ripped = true; A.tear(); } else A.crinkle(1, 0.02); }
  if (tear.st.p >= 1) finishTear();
}
function endTear() {
  const g = TG; TG = null;
  if (!g || state !== "tearing") return;
  const tap = g.moved < 10;
  const go = () => {
    if (!tear || tear.st.released) return;
    if (tap || tear.st.p > 0.55) autoTear();
    else say("Continue à tirer sur le haut du booster");
  };
  if (tear) go(); else if (tearP) tearP.then(go);
}
function autoTear() {
  if (!tear || tear.st.released) return;
  if (tear.st.p < 0.05) A.tear();
  const o = { p: tear.st.p };
  gsap.to(o, { p: 1, duration: 0.25 + 0.6 * (1 - o.p), ease: "power2.in", onUpdate: () => tear.setHand(o.p), onComplete: finishTear });
}
function finishTear() {
  if (!tear || tear.st.released) return;
  tear.release(); TG = null; say("");
  openRest();
}
function setOpen(v) { bodyMeshes.forEach(m => { if (m.morphTargetInfluences) m.morphTargetInfluences[0] = v; }); }
function openBooster() {
  state = "opening"; A.init(); A.ambient(true, 4); say("");
  const O = { open: 0, glow: 0, b: 1 };
  const apply = () => { setOpen(O.open); mouthGlow.material.opacity = O.glow; rays.children.forEach(r => r.material.opacity = O.glow * r.userData.o); PF.uniforms.uB.value = PB.uniforms.uB.value = O.b; };
  const T = gsap.timeline({ onUpdate: apply });
  T.call(() => A.crinkle(5, 0.3))
    .to(booster.position, { y: -0.2, duration: 0.4, ease: "power2.out" }, 0)
    .to(booster.scale, { x: 1.03, y: 0.97, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.3)
    .call(() => A.crinkle(8, 0.35), null, 0.35)
    .to(strip.rotation, { z: -0.12, duration: 0.15, ease: "power1.out" }, 0.8)
    .call(() => A.tear(), null, 0.82)
    .to(strip.rotation, { z: -0.9, duration: 0.7, ease: "power2.in" }, 0.95)
    .to(strip.position, { x: "+=1.6", y: "+=1.1", z: "+=0.6", duration: 0.75, ease: "power2.in" }, 0.95)
    .to(stripMats.map(m => m.uniforms.uOp), { value: 0, duration: 0.3 }, 1.4)
    .to(O, { open: 1, duration: 0.6, ease: "back.out(2)" }, 0.95)
    .call(() => { A.lightBurst(); burst(new THREE.Vector3(0, 1.1, 0.1), [1, 0.9, 0.95], 160, 1.4, 1.8, 1.2); }, null, 1.05)
    .to(O, { glow: 0.55, b: 1.15, duration: 0.5, ease: "power2.out" }, 1.05)
    .to(bloom, { strength: 0.7, duration: 0.8 }, 1.1)
    .to(site, { opacity: 0, duration: 0.9 }, 1.3)
    // la caméra plonge dans la lumière
    .to(CAM, { y: 0.55, ty: 0.6, z: 2.4, duration: 1.2, ease: "power2.in" }, 1.5)
    .call(() => A.whoosh(1.0), null, 1.7)
    .fromTo(wave, { opacity: 0, backgroundPosition: "0% 100%" }, { opacity: 1, backgroundPosition: "100% 0%", duration: 1.1, ease: "power1.inOut" }, 1.8)
    .to(flash, { opacity: 1, duration: 0.35, ease: "power2.in" }, 2.35)
    .call(() => enterArena(), null, 2.72)
    .to(wave, { opacity: 0, duration: 0.4 }, 2.75)
    .to(flash, { opacity: 0, duration: 0.9 }, 2.75)
    .to(bloom, { strength: 0.45, duration: 1.0 }, 2.8);
  run(T, () => { gsap.set([flash, wave, site], { opacity: 0 }); if (mode !== "arena") enterArena(); bloom.strength = 0.45; arrive(); });
}
function openRest() {
  state = "opening";
  const O = { open: 0, glow: 0, b: 1 };
  const apply = () => { setOpen(O.open); mouthGlow.material.opacity = O.glow; rays.children.forEach(r => r.material.opacity = O.glow * r.userData.o); PF.uniforms.uB.value = PB.uniforms.uB.value = O.b; };
  const T = gsap.timeline({ onUpdate: apply });
  T.to(O, { open: 1, duration: 0.6, ease: "back.out(2)" }, 0.05)
    .call(() => { A.lightBurst(); burst(new THREE.Vector3(0, 1.1, 0.1), [1, 0.9, 0.95], 160, 1.4, 1.8, 1.2); }, null, 0.15)
    .to(O, { glow: 0.55, b: 1.15, duration: 0.5, ease: "power2.out" }, 0.15)
    .to(bloom, { strength: 0.7, duration: 0.8 }, 0.2)
    .to(site, { opacity: 0, duration: 0.9 }, 0.4)
    .to(CAM, { y: 0.55, ty: 0.6, z: 2.4, duration: 1.2, ease: "power2.in" }, 0.75)
    .call(() => A.whoosh(1.0), null, 0.95)
    .fromTo(wave, { opacity: 0, backgroundPosition: "0% 100%" }, { opacity: 1, backgroundPosition: "100% 0%", duration: 1.1, ease: "power1.inOut" }, 1.05)
    .to(flash, { opacity: 1, duration: 0.35, ease: "power2.in" }, 1.6)
    .call(() => enterArena(), null, 1.97)
    .to(wave, { opacity: 0, duration: 0.4 }, 2.0)
    .to(flash, { opacity: 0, duration: 0.9 }, 2.0)
    .to(bloom, { strength: 0.45, duration: 1.0 }, 2.05);
  run(T, () => { gsap.set([flash, wave, site], { opacity: 0 }); if (mode !== "arena") enterArena(); bloom.strength = 0.45; arrive(); });
}
function enterArena() {
  mode = "arena"; booster.visible = false; arena.visible = true; SKY.uDim.value = 0;
  showBg(true); gsap.fromTo(bgMat.uniforms.uOp, { value: 0 }, { value: 1, duration: 1.4, ease: "power2.out" });
  CAM.fov = 35; const d = fitDist(CHW / 0.78, CWW / 0.86);
  CAM.x = 0; CAM.y = 1.75; CAM.z = d; CAM.tx = 0; CAM.ty = 1.5; CAM.tz = 0; camera.fov = 35; camera.updateProjectionMatrix();
}

/* ================= étape 4 : arrivée d'une carte */
const BL = backLight.material.uniforms, BM = backMat.uniforms, BU = burnMat.uniforms, LU = lens.uniforms;
const room = { dim: 0, glow: 0.6, shaft: 0.35, dust: 1 };
function applyRoom() { SKY.uDim.value = room.dim; floorMat.uniforms.uGlow.value = room.glow; shaftMat.uniforms.uA.value = room.shaft; dust.material.uniforms.uA.value = room.dust; }
function resetCard() {
  Object.assign(fxState, { fx: 0, depth: 0, zoom: 1, ghost: 0, flash: 0 });
  flipG.rotation.set(0, 0, 0); cardRoot.rotation.set(0, 0, 0); cardRoot.position.set(0, 1.5, 0); cardRoot.scale.setScalar(1);
  BM.uGlow.value = 0; BM.uHue.value = 0; BM.uB.value = 1; BM.uOp.value = 1; BM.uHaze.value = 0; BM.uRim.value = 0;
  BU.uBurn.value = 0; burnMesh.visible = false; backMesh.visible = true; frontMesh.visible = true; edgeMat.color.set(0x17131f);
  BL.uI.value = 0; BL.uDisp.value = 0; caustic.material.uniforms.uI.value = 0;
  LU.uHaze.value = 0; LU.uExp.value = 1; frontMat.uniforms.uFx.value = 0;
  ash.userData.list.length = 0; sparks.userData.list.length = 0;
  asmG.clear(); ghosts.forEach(g => { g.material.opacity = 0; g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); }); fan.children.forEach(m => m.material.opacity = 0);
}
async function arrive() {
  state = "arrive"; setSkip(false);
  const c = DECK[idx];
  await loadCard(c);
  resetCard();
  setTint(null, 0.8);
  A.slide();
  // la carte sort du paquet par le bas : décélération, puis elle se pose avec son poids
  gsap.fromTo(cardRoot.position, { y: -0.7, z: 0.5 }, { y: 1.5, z: 0, duration: 1.05, ease: "expo.out" });
  gsap.fromTo(cardRoot.rotation, { x: -0.95, y: 0.12, z: -0.06 }, { x: 0, y: 0, z: 0, duration: 1.25, ease: spring(0.82, 9) });
  setTimeout(() => { if (state === "arrive") { state = "ready"; say("Touche la carte"); } }, 900);
}

/* ================= étape 5 : révélations
   Règle : rien de « dessiné » par-dessus la scène. La rareté se lit à la lumière (contre-jour, salle qui s'éteint,
   poussière éclairée), à la matière (brume de chaleur, combustion, dispersion) et au rythme. Mouvements à ressorts amortis. */
function reveal() {
  state = "revealing"; say("");
  const c = DECK[idx];
  ({ zenkai: revealZenkai, mirage: revealMirage, spectre: revealSpectre, prisme: revealPrisme, eclat: revealEclat }[c.rarity] || revealEclat)();
}
function revealed() {
  state = "revealed"; setSkip(false);
  Object.assign(fxState, { fx: 1, depth: 0, zoom: 1, ghost: 0, flash: 0 });
  flipG.rotation.set(0, Math.PI, 0); cardRoot.rotation.set(0, 0, 0); cardRoot.position.set(0, 1.5, 0);
  frontMesh.visible = true; burnMesh.visible = false; BU.uBurn.value = 0; BM.uHaze.value = 0;
  asmG.clear(); ghosts.forEach(g => g.material.opacity = 0); fan.children.forEach(m => m.material.opacity = 0); cardRoot.scale.setScalar(1);
  LU.uHaze.value = 0; LU.uExp.value = 1; CAM.shake = 0; bloom.strength = 0.45;
  gsap.to(CAM, Object.assign(camHome(), { fov: 35, x: 0, hand: 0.016, duration: 1.2, ease: "power2.out", overwrite: "auto" }));
  A.ambient(true, 3);
  setTimeout(() => { if (state === "revealed") say(idx < DECK.length - 1 ? "Touche ou glisse pour la carte suivante" : "Touche pour voir tes cartes"); }, 1600);
}
const camHome = () => ({ x: 0, y: 1.75, z: fitDist(CHW / 0.78, CWW / 0.86), ty: 1.5 });
// retournement physique : petite anticipation, la carte se soulève vers nous, pivote, dépasse à peine et se pose
function flipCard(T, at, dur = 0.8, o = {}) {
  const lift = o.lift ?? 0.22, z = o.z ?? 0.8, w = o.w ?? 9;
  if (o.anti !== false) T.to(flipG.rotation, { y: -0.07, duration: 0.16, ease: "power2.out" }, at - 0.16);
  T.call(() => A.flick(o.heavy), null, at)
    .to(flipG.rotation, { y: Math.PI, duration: dur, ease: spring(z, w) }, at)
    .to(flipG.rotation, { x: -0.11, duration: dur * 0.35, ease: "sine.out" }, at)
    .to(flipG.rotation, { x: 0, duration: dur * 0.75, ease: spring(0.7, 8) }, at + dur * 0.35)
    .to(cardRoot.position, { z: lift, duration: dur * 0.4, ease: "power2.out" }, at)
    .to(cardRoot.position, { z: 0, duration: dur * 0.85, ease: spring(0.85, 8) }, at + dur * 0.4)
    .to(cardRoot.rotation, { z: 0.035, duration: dur * 0.4, ease: "sine.out" }, at)
    .to(cardRoot.rotation, { z: 0, duration: dur * 0.75, ease: spring(0.7, 8) }, at + dur * 0.4);
  return T;
}

function revealEclat() {
  const T = gsap.timeline();
  T.to(cardRoot.position, { y: 1.68, duration: 0.35, ease: "power2.out" }, 0)
    .to(backMat.uniforms.uB, { value: 1.4, duration: 0.3, yoyo: true, repeat: 1 }, 0.05)
    .call(() => A.eclatFlip(), null, 0.35)
    .to(flipG.rotation, { y: Math.PI, duration: 0.6, ease: "power3.inOut" }, 0.35)
    .to(cardRoot.position, { y: 1.5, duration: 0.5, ease: "back.out(1.6)" }, 0.9)
    .call(() => { burst(CARDPOS, [1, 0.85, 0.55], 70, 1.0, 1.4); ring3d(CARDPOS, [1, 0.9, 0.7], 0.9, 1.8, 1.2); }, null, 0.9)
    .to(fxState, { fx: 1, duration: 0.9 }, 0.9)
    .to({}, { duration: 0.1 }, 1.8);
  setTint("eclat", 1);
  run(T, revealed);
}
function revealPrisme() {
  const T = gsap.timeline();
  setTint("prisme", 0.8);
  T.call(() => A.prismeStart())
    .to(SKY.uPri, { value: 1, duration: 0.8 }, 0)
    .to(backMat.uniforms.uHue, { value: 6.28, duration: 1.3, ease: "none" }, 0)
    .to(backMat.uniforms.uB, { value: 1.3, duration: 0.4 }, 0)
    .to(cardRoot.rotation, { z: 0.08, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.1)
    .to(fan.children.map(m => m.material), { opacity: 0.55, duration: 0.5, stagger: 0.01 }, 0.4)
    .fromTo(fan.scale, { x: 0.3, y: 0.3 }, { x: 1.2, y: 1.2, duration: 1.2, ease: "power2.out" }, 0.4)
    .call(() => A.prismeFlip(), null, 1.1)
    .to(flipG.rotation, { y: Math.PI, duration: 0.65, ease: "power3.inOut" }, 1.1)
    .to(fan.children.map(m => m.material), { opacity: 0, duration: 0.6 }, 1.5)
    .to(backMat.uniforms.uB, { value: 1, duration: 0.3 }, 1.4)
    .call(() => { burst(CARDPOS, [1, 0.85, 1], 110, 1.3, 1.5); ring3d(CARDPOS, [1, 0.7, 0.95], 0.9, 2.1, 1.3); ring3d(CARDPOS, [0.6, 0.85, 1], 0.9, 1.7, 1.1, 1.0); }, null, 1.5)
    .fromTo(fxState, { zoom: 1.08 }, { fx: 1, zoom: 1, duration: 1.1 }, 1.6)
    .to(SKY.uPri, { value: 0.35, duration: 1.2 }, 1.8)
    .to({}, { duration: 0.1 }, 2.6);
  run(T, revealed);
}
let burnAcc = 0;
function emitBurn(dt) {
  const b = BU.uBurn.value; if (b <= 0 || b >= 0.995) return;
  burnAcc += dt * (40 + 140 * b);
  while (burnAcc > 1) {
    burnAcc--;
    const [x, y] = burnFront(b);
    if (Math.random() < 0.55) emit(ash, x, y, DTH + 0.02, (Math.random() - 0.5) * 0.25, 0.1 + Math.random() * 0.25, 1.4 + Math.random() * 1.4, 0.035 + Math.random() * 0.05);
    else emit(sparks, x, y, DTH + 0.02, (Math.random() - 0.5) * 0.35, 0.2 + Math.random() * 0.45, 0.5 + Math.random() * 0.9, 0.012 + Math.random() * 0.018);
  }
}
function revealSpectre() {
  const T = gsap.timeline();
  setTint("spectre", 1.2);
  T.call(() => A.spectreStart())
    // la salle se refroidit et s'assombrit
    .to(room, { dim: 0.55, glow: 0.2, shaft: 0.12, duration: 1.0, onUpdate: applyRoom }, 0)
    .to(CAM, { z: camHome().z * 0.94, duration: 3.2, ease: "sine.inOut" }, 0)
    // bascule invisible : la face est déjà là, sous une copie du dos qui va brûler
    .call(() => { flipG.rotation.y = Math.PI; burnMesh.visible = true; BU.uBurn.value = 0.0001; }, null, 0.35)
    .call(() => A.fire(2.6), null, 0.4)
    .to(BU.uBurn, { value: 0.07, duration: 0.5, ease: "sine.in" }, 0.4)        // les bords couvent
    .to(BU.uBurn, { value: 1, duration: 1.9, ease: "power1.in" }, 0.9)         // le feu prend et dévore vers le centre
    .to(cardRoot.rotation, { z: 0.02, x: 0.03, duration: 1.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.6)
    .to(LU.uHaze, { value: 0.35, duration: 1.2 }, 0.8)
    .to(fxState, { ghost: 0.3, duration: 0.9, ease: "power1.in" }, 1.9)       // les flammes se posent sur le cadre
    .to(fxState, { fx: 1, duration: 0.9 }, 2.2)
    .call(() => { burnMesh.visible = false; A.whoomph(); }, null, 2.82)
    .to(LU.uHaze, { value: 0, duration: 1.0 }, 2.7)
    .to(fxState, { ghost: 0, duration: 1.4, ease: "power2.out" }, 2.85)
    .to(room, { dim: 0.15, glow: 0.45, shaft: 0.3, duration: 1.4, onUpdate: applyRoom }, 2.8)
    .to(SKY.uSpe, { value: 0.4, duration: 1.4 }, 2.8)
    .to({}, { duration: 0.1 }, 3.9);
  run(T, () => { gsap.killTweensOf(room); Object.assign(room, { dim: 0.15, glow: 0.45, shaft: 0.3 }); applyRoom(); revealed(); });
}
function revealMirage() {
  // ancienne + nouvelle : les doubles colorés s'écartent dans un air qui tremble, se referment, la carte se retourne à travers la brume
  const T = gsap.timeline();
  setTint("mirage", 1.2);
  const offs = [[-1.0, 0.05, -0.5, -0.15], [1.0, -0.04, -0.4, 0.15], [-0.55, -0.08, -0.9, -0.06], [0.55, 0.08, -0.8, 0.07]];
  T.call(() => { A.mirageStart(); A.heat(); })
    .to(room, { dim: 0.3, glow: 0.35, duration: 1.2, onUpdate: applyRoom }, 0)
    .to(SKY.uMir, { value: 1, duration: 1.3 }, 0)
    .to(BM.uOp, { value: 0.7, duration: 0.5 }, 0.1)
    .to(BM.uHaze, { value: 1, duration: 1.4, ease: "sine.in" }, 0.1)
    .to(LU.uHaze, { value: 0.9, duration: 1.4, ease: "sine.in" }, 0.1)
    .to(BL.uC.value, { r: 0.8, g: 0.72, b: 1, duration: 0.01 }, 0)
    .to(BL.uI, { value: 0.18, duration: 1.4 }, 0.2);
  ghosts.forEach((g, i) => {
    const o = offs[i];
    T.fromTo(g.position, { x: 0, y: 0, z: 0 }, { x: o[0], y: o[1], z: o[2], duration: 0.9, ease: "power2.out" }, 0.15 + i * 0.06)
      .fromTo(g.rotation, { y: 0 }, { y: o[3] * 3, duration: 0.9, ease: "power2.out" }, 0.15 + i * 0.06)
      .to(g.material, { opacity: 0.5, duration: 0.6 }, 0.15 + i * 0.06)
      .to(g.position, { x: o[0] * 1.1, y: o[1] + 0.05, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.05)
      .to(g.position, { x: 0, y: 0, z: 0, duration: 0.55, ease: "power3.in" }, 1.55)
      .to(g.rotation, { y: 0, duration: 0.55, ease: "power3.in" }, 1.55)
      .to(g.material, { opacity: 0, duration: 0.25 }, 2.1);
  });
  T.to(CAM, { x: 0.25, duration: 1.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.2)
    .to(BM.uOp, { value: 1, duration: 0.3 }, 1.6);
  flipCard(T, 1.75, 1.0, { z: 0.72, w: 8, lift: 0.18 });
  T.set(fxState, { ghost: 1, depth: 1, zoom: 1.12 }, 1.95)
    .to(BM.uHaze, { value: 0, duration: 0.5 }, 1.9)
    .call(() => A.mirageMerge(), null, 2.05)
    .to(bloom, { strength: 1.0, duration: 0.08 }, 2.1).to(bloom, { strength: 0.45, duration: 0.8 }, 2.18)
    .call(() => { burst(CARDPOS, [0.9, 0.85, 1], 100, 1.2, 1.6); ring3d(CARDPOS, [0.85, 0.8, 1], 0.9, 2.0, 1.4); ring3d(CARDPOS, [1, 0.75, 0.95], 0.9, 1.6, 1.2, 0.9); }, null, 2.15)
    // la brume se dissipe : l'image fait la mise au point
    .to(LU.uHaze, { value: 0, duration: 1.6, ease: "power2.out" }, 2.0)
    .to(fxState, { ghost: 0, duration: 1.4, ease: "power2.out" }, 2.2)
    .to(fxState, { depth: 0, zoom: 1, duration: 2.0, ease: "expo.out" }, 2.2)
    .to(fxState, { fx: 1, duration: 1.4 }, 2.6)
    .to(BL.uI, { value: 0, duration: 1.4 }, 2.4)
    .to(room, { dim: 0.08, glow: 0.5, duration: 1.4, onUpdate: applyRoom }, 2.6)
    .to(SKY.uMir, { value: 0.35, duration: 1.6 }, 2.8)
    .to({}, { duration: 0.2 }, 4.4);
  run(T, () => { gsap.killTweensOf(room); Object.assign(room, { dim: 0.08, glow: 0.5 }); applyRoom(); revealed(); });
}
function revealZenkai() {
  // ancienne + nouvelle : rotation, arrêt net dans le noir, contre-jour qui monte, anneaux et énergie, zoom, assemblage, la salle se rallume
  const c = DECK[idx];
  const T = gsap.timeline();
  const home = camHome();
  BL.uC.value.setRGB(1, 0.72, 0.38); BL.uDisp.value = 0;
  asmG.clear();
  const L = {};
  c.asm.forEach(([k, src], i) => {
    const t = texN(src);
    const m = new THREE.Mesh(planeG, new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false }));
    m.position.z = i * 0.0015; m.renderOrder = 10 + i; asmG.add(m); L[k] = m;
  });
  T.call(() => A.spin(1.5))
    .to(flipG.rotation, { y: Math.PI * 4, duration: 1.6, ease: "power2.in" }, 0)
    .to(cardRoot.position, { y: 1.65, duration: 1.6, ease: "power2.in" }, 0)
    // arrêt net : musique et lumières coupées
    .call(() => { A.stopHit(); A.cut(); A.dark(); }, null, 1.6)
    .to(room, { dim: 1, glow: 0.03, shaft: 0, dust: 0, duration: 0.15, onUpdate: applyRoom }, 1.6)
    .to(SKY.uTint.value, { r: 0.05, g: 0.04, b: 0.06, duration: 0.3 }, 1.6)
    .to(BM.uB, { value: 0.5, duration: 0.3 }, 1.6)
    // une lumière s'allume derrière la carte, le dos s'illumine, la poussière apparaît dans les faisceaux
    .call(() => A.rumble(2.5), null, 2.0)
    .to(BL.uI, { value: 0.7, duration: 1.8, ease: "sine.in" }, 2.0)
    .to(BM.uGlow, { value: 1.4, duration: 1.8, ease: "power1.in" }, 2.0)
    .to(BM.uRim, { value: 0.5, duration: 1.6 }, 2.1)
    .to(edgeMat.color, { r: 0.9, g: 0.66, b: 0.35, duration: 1.6 }, 2.1)
    .to(room, { dust: 0.9, glow: 0.8, duration: 1.8, onUpdate: applyRoom }, 2.2)
    .call(() => setTint("zenkai", 1.6), null, 2.2)
    .to(SKY.uZen, { value: 1, duration: 1.8 }, 2.2)
    .to(CAM, { z: home.z * 0.9, y: 1.68, ty: 1.62, duration: 2.0, ease: "sine.inOut" }, 1.9)
    .to(CAM, { shake: 0.004, duration: 0.8 }, 3.0)
    // anneaux + énergie dorée
    .call(() => { for (let i = 0; i < 4; i++) setTimeout(() => ring3d(new THREE.Vector3(0, 1.65, 0), [1, 0.8, 0.4], 1.0, 2.2 + i * 0.4, 1.5, 1.3 + i * 0.12, 0.012), i * 160); }, null, 3.0)
    .call(() => { streaks.forEach((s, i) => setTimeout(() => { s.visible = true; s.position.set(-7, 0.3 + Math.random() * 3.4, -2 + Math.random() * 3); s.userData.v = 9 + Math.random() * 6; s.material.opacity = 0.9; }, i * 70)); }, null, 3.2)
    .to(BL.uI, { value: 1.2, duration: 0.8, ease: "power2.in" }, 3.2)
    .to(bloom, { strength: 0.75, duration: 0.8 }, 3.2)
    // la caméra fonce
    .to(CAM, { z: home.z * 0.62, y: 1.65, ty: 1.65, fov: 30, duration: 0.32, ease: "expo.in" }, 4.0)
    .to(CAM, { shake: 0.03, duration: 0.05 }, 4.0).to(CAM, { shake: 0, duration: 0.5 }, 4.05)
    .to(LU.uExp, { value: 1.5, duration: 0.25, ease: "power2.in" }, 4.05)
    .to(flash, { opacity: 0.9, duration: 0.06 }, 4.3)
    .call(() => { A.impact(); frontMesh.visible = false; BM.uGlow.value = 0; BM.uRim.value = 0; }, null, 4.3)
    .set(flipG.rotation, { y: Math.PI * 5 }, 4.34)
    .to(flash, { opacity: 0, duration: 0.8 }, 4.36)
    .to(LU.uExp, { value: 1, duration: 1.0, ease: "power2.out" }, 4.36)
    .to(bloom, { strength: 0.5, duration: 0.8 }, 4.36)
    .to(CAM, { z: home.z * 0.8, fov: 35, duration: 0.9, ease: "expo.out" }, 4.36)
    // assemblage en profondeur : l'illustration arrive du fond, le cadre se referme depuis l'avant
    .fromTo(L.ill.position, { z: -1.4 }, { z: 0, duration: 1.2, ease: "expo.out" }, 4.34).to(L.ill.material, { opacity: 1, duration: 0.4 }, 4.34)
    .fromTo(L.ill.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 1.2, ease: "expo.out" }, 4.34)
    .to([L.voile.material, L.lueur.material], { opacity: 1, duration: 0.5 }, 4.7)
    .fromTo(L.bande.position, { z: 0.9 }, { z: 0.003, duration: 0.6, ease: "back.out(1.3)" }, 4.85).to(L.bande.material, { opacity: 1, duration: 0.3 }, 4.85)
    .call(() => A.whoosh(0.5, false), null, 4.85)
    .fromTo(L.flammes.position, { z: 1.5 }, { z: 0.0045, duration: 0.65, ease: "power3.out" }, 5.1).to(L.flammes.material, { opacity: 1, duration: 0.3 }, 5.1)
    .fromTo(L.flammes.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.65, ease: "power3.out" }, 5.1)
    .fromTo(L.couronne.position, { y: 0.8, z: 0.6 }, { y: 0, z: 0.006, duration: 0.6, ease: "back.out(2)" }, 5.35).to(L.couronne.material, { opacity: 1, duration: 0.3 }, 5.35)
    .fromTo(L.couronne.rotation, { z: -0.5 }, { z: 0, duration: 0.6, ease: "back.out(2)" }, 5.35)
    .to([L.eclats.material, L.infos.material], { opacity: 1, duration: 0.5, stagger: 0.12 }, 5.6)
    .fromTo(L.infos.position, { z: 0.4 }, { z: 0.0105, duration: 0.5 }, 5.72)
    // dernière impulsion
    .call(() => { A.zenkaiChord(); burst(new THREE.Vector3(0, 1.65, 0), [1, 0.82, 0.45], 220, 2.0, 1.8, 0.6); ring3d(new THREE.Vector3(0, 1.65, 0), [1, 0.9, 0.6], 1.0, 3.2, 1.4, 1.57, 0.02); frontMesh.visible = true; fxState.fx = 1; }, null, 6.2)
    .to(bloom, { strength: 1.2, duration: 0.07 }, 6.2).to(bloom, { strength: 0.45, duration: 1.2 }, 6.27)
    .to(asmG.children.map(m => m.material), { opacity: 0, duration: 0.35 }, 6.3)
    .to(cardRoot.position, { y: 1.5, duration: 1.2, ease: "expo.out" }, 6.25)
    .to(CAM, { z: home.z, y: home.y, ty: home.ty, duration: 1.4, ease: "expo.out" }, 6.25)
    // la salle se rallume en chaud, un halo reste derrière la carte
    .to(room, { dim: 0.1, glow: 0.9, shaft: 0.3, dust: 1, duration: 2.0, onUpdate: applyRoom }, 6.3)
    .to(BM.uB, { value: 1, duration: 0.5 }, 6.3)
    .to(edgeMat.color, { r: 0.09, g: 0.075, b: 0.12, duration: 1.0 }, 6.3)
    .to(BL.uI, { value: 0.2, duration: 2.0 }, 6.4)
    .to(SKY.uZen, { value: 0.8, duration: 2 }, 6.4)
    .to({}, { duration: 0.6 }, 7.6);
  run(T, () => {
    gsap.killTweensOf([room, BL.uI, BM.uGlow, BM.uRim, BM.uB, edgeMat.color, LU.uExp]);
    Object.assign(room, { dim: 0.1, glow: 0.9, shaft: 0.3, dust: 1 }); applyRoom(); setTint("zenkai", 0.3);
    BL.uI.value = 0.2; BM.uGlow.value = BM.uRim.value = 0; BM.uB.value = 1; edgeMat.color.set(0x17131f); LU.uExp.value = 1;
    gsap.set(flash, { opacity: 0 }); Object.assign(CAM, { fov: 35, shake: 0 }); revealed();
  });
}

/* ================= étape 6 : carte suivante */
function next() {
  if (state !== "revealed") return;
  state = "leaving"; say(""); A.slide(true);
  gsap.to([SKY.uMir, SKY.uSpe, SKY.uZen, SKY.uPri], { value: 0, duration: 0.8 });
  gsap.to(room, { dim: 0, glow: 0.6, shaft: 0.35, dust: 1, duration: 0.8, onUpdate: applyRoom });
  gsap.to([BL.uI, caustic.material.uniforms.uI], { value: 0, duration: 0.6 });
  // on la pose sur la pile, à gauche, comme une vraie carte
  gsap.to(cardRoot.position, { x: -3.0, y: 0.9, z: 0.4, duration: 0.62, ease: "power3.in" });
  gsap.to(cardRoot.rotation, { z: 0.32, y: -0.45, x: -0.3, duration: 0.62, ease: "power3.in", onComplete: () => {
    cardRoot.position.x = 0; idx++;
    if (idx < DECK.length) arrive(); else recap();
  } });
}

/* ================= étape 7 : récapitulatif (commun avec la 2D) */
function recap() {
  state = "recap"; A.close();
  const grid = $("#grid");
  grid.innerHTML = DECK.map((c, i) => `<button data-i="${i}" aria-label="Voir la carte ${c.name}"><img src="${c.full}" alt=""><span class="r-${c.rarity}">${LABEL[c.rarity]}</span></button>`).join("");
  const rc = $("#recap"); rc.style.display = "block";
  gsap.fromTo(rc, { opacity: 0 }, { opacity: 1, duration: 0.9 });
  gsap.from("#grid button", { y: 40, opacity: 0, stagger: 0.08, duration: 0.6, ease: "back.out(1.4)", delay: 0.3 });
  grid.querySelectorAll("button").forEach(b => b.onclick = () => openViewer(DECK[+b.dataset.i]));
}
const viewer = $("#viewer"); let vgl = null;
async function openViewer(c) {
  viewer.style.display = "grid";
  if (!vgl) { try { vgl = new window.CardGL($("#vgl")); } catch (e) { return; } }
  await vgl.load(c); vgl.state.fx = 1; vgl.resize(); A.flipChime();
  gsap.fromTo("#viewer .vcard", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.4)" });
  const loopV = now => { if (viewer.style.display !== "grid") return; vgl.state.tiltX = tilt.x * 0.5; vgl.state.tiltY = tilt.y * 0.5; vgl.draw(now); requestAnimationFrame(loopV); };
  requestAnimationFrame(loopV);
}
$("#vclose").onclick = () => { viewer.style.display = "none"; };
viewer.addEventListener("click", e => { if (e.target === viewer) viewer.style.display = "none"; });
$("#again").onclick = () => {
  idx = 0; DECK = drawBooster(); $("#recap").style.display = "none";
  mode = "booster"; state = "booster"; arena.visible = false; booster.visible = true; SKY.uDim.value = 0.5;
  setOpen(0); mouthGlow.material.opacity = 0; rays.children.forEach(r => r.material.opacity = 0);
  stripMats.forEach(m => m.uniforms.uOp.value = 1); strip.rotation.set(0, 0, 0); strip.position.set(0.75, 1.0189, 0);
  showBg(false); showManga(); window.ZK_BG.el.pause(); window.ZK_BG.prepare(DECK);
  if (tear) { tear.reset(); } tear = null; tearP = null; TG = null; strip.visible = true;
  PF.uniforms.uB.value = PB.uniforms.uB.value = 1; booster.position.set(0, -0.45, 0); booster.scale.setScalar(1);
  Object.assign(CAM, { x: 0, y: -0.15, z: 6.0, tx: 0, ty: -0.15, tz: 0, fov: 35 });
  gsap.to(site, { opacity: 1, duration: 0.8 }); A.ambient(true, 2); say("Glisse sur le haut du booster pour le déchirer", 1);
};
