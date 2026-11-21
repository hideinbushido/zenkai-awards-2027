{
/* ZENKAI 2027 — ouverture de booster, version 2D. Phases : ouverture → invocation → carte révélée → récap. */
const $ = s => document.querySelector(s);
const A = window.ZKA;
const IMG = "img/";
// les cartes viennent du gabarit (cards.js) : chaque carte = image + infos + rareté
const RANK = { eclat: 0, prisme: 1, spectre: 2, mirage: 3, zenkai: 4 };
// chance qu'une carte du booster soit de cette rareté, en % (indépendant du nombre de cartes de chaque rareté)
const WEIGHT = { eclat: 61, prisme: 20, spectre: 10, mirage: 5, zenkai: 4 };
const LABEL = { eclat: "ÉCLAT", prisme: "PRISME", spectre: "SPECTRE", mirage: "MIRAGE", zenkai: "ZENKAI" };
const POOL = window.ZK_CARDS.cards.map(c => Object.assign({}, c, {
  ill: c.base + "ill.webp", over: c.base + "over.webp", masks: c.base + "masks.png", full: c.base + "full.webp",
  asm: c.rarity === "zenkai" ? [["ill", c.base + "ill.webp"], ["voile", c.base + "voile.webp"], ["lueur", IMG + "frames/zenkai_lueur.webp"],
    ["bande", IMG + "frames/zenkai_bande.webp"], ["flammes", IMG + "frames/zenkai_flammes.webp"], ["couronne", IMG + "frames/zenkai_couronne.webp"],
    ["eclats", IMG + "frames/zenkai_eclats.webp"], ["infos", c.base + "infos.webp"]] : null,
}));
// tirage du booster : pondéré par rareté, sans doublon, révélé de la moins rare à la plus rare
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
// pré-chargement
[...POOL.flatMap(c => [c.ill, c.over, c.masks, c.full]), ...POOL[0] ? [] : [], IMG + "dos.webp", IMG + "embleme.png",
 ...["lueur", "bande", "flammes", "couronne", "eclats"].map(k => IMG + "frames/zenkai_" + k + ".webp")]
  .forEach(s => { const i = new Image(); i.src = s; });

const stage = $("#stage"), booster = $("#booster"), bTilt = $("#booster .tilt"), lang = $("#booster .lang"), corps = $("#booster .corps");
const cardwrap = $("#cardwrap"), card = $("#card"), cTilt = $("#card .tilt"), inner = $("#card .inner"), ghosts = $("#ghosts");
const back = $(".face.back"), backImg = $(".face.back img"), glow = $(".face.back .glow"), rays = $(".face.back .rays");
const front = $(".face.front"), glc = $("#gl"), asm = $(".face.front .asm"), aura = $("#card .aura");
const hint = $("#hint"), veil = $("#veil"), wave = $("#wave"), flash = $("#flash"), site = $("#site"), skipB = $("#skip");
let gl = null;
try { gl = new CardGL(glc); } catch (e) { console.warn("WebGL indisponible", e); }

const viewer = $("#viewer"); let vgl = null;
let state = "booster", idx = 0, tl = null, finish = null, fast = false;
const say = (txt, d = 0.4) => gsap.to(hint, { opacity: txt ? 1 : 0, duration: d, onStart: () => { if (txt) hint.textContent = txt; } });
say("Touche le booster pour l'ouvrir", 1);

/* ================= fond d'invocation (canvas) */
const bg = $("#bg"), bx = bg.getContext("2d");
const BG = { dim: 0, mir: 0, zen: 0, spe: 0, rays: 0, rot: 0, emb: 0.07, tint: [60, 30, 110] };
const emb = new Image(); emb.src = IMG + "embleme.png";
const parts = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), v: 0.01 + Math.random() * 0.03, s: 0.5 + Math.random() * 1.8, p: Math.random() * 6 }));
function drawBG(t) {
  const w = bg.width, h = bg.height, c = BG.tint, m = Math.min(w, h);
  bx.globalCompositeOperation = "source-over";
  const g = bx.createRadialGradient(w / 2, h * 0.48, 0, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  const k = 1 - BG.dim * 0.7;
  g.addColorStop(0, `rgb(${c[0] * 0.55 * k | 0},${c[1] * 0.55 * k | 0},${c[2] * 0.55 * k | 0})`);
  g.addColorStop(0.45, `rgb(${c[0] * 0.18 * k | 0},${c[1] * 0.15 * k | 0},${c[2] * 0.2 * k | 0})`);
  g.addColorStop(1, "#040308");
  bx.fillStyle = g; bx.fillRect(0, 0, w, h);
  bx.globalCompositeOperation = "lighter";
  if (BG.rays > 0.01) {                         // rayons dorés ZENKAI
    bx.save(); bx.translate(w / 2, h / 2); bx.rotate(t * 0.12 + BG.rot);
    for (let i = 0; i < 28; i++) {
      bx.rotate(Math.PI * 2 / 28);
      const gr = bx.createLinearGradient(0, 0, 0, -m * 0.95);
      gr.addColorStop(0, `rgba(255,200,90,${0.22 * BG.rays})`); gr.addColorStop(1, "rgba(255,170,40,0)");
      bx.fillStyle = gr; bx.beginPath(); bx.moveTo(0, 0); bx.lineTo(-m * 0.06, -m); bx.lineTo(m * 0.06, -m); bx.fill();
    }
    bx.restore();
  }
  if (BG.mir > 0.01) {                          // ondulations de mirage
    for (let j = 0; j < 9; j++) {
      bx.beginPath();
      const y0 = h * (0.12 + j * 0.1), col = [[205, 180, 255], [255, 170, 230], [150, 235, 255]][j % 3];
      for (let x = 0; x <= w; x += 12) bx.lineTo(x, y0 + Math.sin(x / (w * 0.09) + t * 1.4 + j) * h * 0.018 + Math.sin(x / (w * 0.03) - t * 2.2) * h * 0.004);
      bx.strokeStyle = `rgba(${col},${0.09 * BG.mir})`; bx.lineWidth = h * 0.012; bx.stroke();
    }
  }
  if (BG.spe > 0.01) {                         // volutes spectrales
    for (let j = 0; j < 7; j++) {
      const x = w * (0.5 + 0.42 * Math.sin(t * 0.21 + j * 1.9)), y = h * (0.5 + 0.38 * Math.cos(t * 0.17 + j * 2.7));
      const r = m * (0.35 + 0.15 * Math.sin(t * 0.5 + j));
      const gr = bx.createRadialGradient(x, y, 0, x, y, r);
      const col = j % 2 ? "90,220,255" : "150,90,255";
      gr.addColorStop(0, `rgba(${col},${0.13 * BG.spe})`); gr.addColorStop(1, `rgba(${col},0)`);
      bx.fillStyle = gr; bx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }
  if (emb.complete && BG.emb > 0) {
    bx.save(); bx.globalAlpha = BG.emb * (1 - BG.dim * 0.5); bx.translate(w / 2, h / 2); bx.rotate(t * 0.04);
    const s = m * 1.15; bx.drawImage(emb, -s / 2, -s / 2, s, s); bx.restore();
  }
  for (const p of parts) {
    p.y -= p.v * 0.016; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
    const a = (0.25 + 0.35 * Math.sin(t * 2 + p.p)) * (1 - BG.dim * 0.6);
    bx.fillStyle = `rgba(${Math.min(255, c[0] + 140)},${Math.min(255, c[1] + 130)},${Math.min(255, c[2] + 120)},${a})`;
    bx.beginPath(); bx.arc(p.x * w + Math.sin(t + p.p) * 8, p.y * h, p.s * (w / 900 + 0.6), 0, 7); bx.fill();
  }
  bx.globalCompositeOperation = "source-over";
}

/* ================= effets plein écran (canvas) */
const fx = $("#fx"), fxx = fx.getContext("2d");
let FX = [];
function cardCenter() { const r = cardwrap.getBoundingClientRect(); return [(r.left + r.width / 2) * DPR, (r.top + r.height / 2) * DPR, r.width * DPR, r.height * DPR]; }
const FXT = {
  ring(o, k) {   // anneau lumineux elliptique
    const [cx, cy, cw] = o.c; const r = cw * (o.r0 + (o.r1 - o.r0) * (1 - Math.pow(1 - k, 3)));
    fxx.strokeStyle = `rgba(${o.col},${(1 - k) * o.a})`; fxx.lineWidth = o.lw * DPR * (1 - k * 0.5);
    fxx.beginPath(); fxx.ellipse(cx, cy + o.dy * cw, r, r * o.e, o.rot || 0, 0, 7); fxx.stroke();
  },
  arc(o, k) {    // éclair spectral qui jaillit du bord de la carte
    if (Math.random() < 0.25) return;
    const [cx, cy, cw, ch] = cardCenter();
    const sx = cx + o.ex * cw / 2, sy = cy + o.ey * ch / 2;
    fxx.strokeStyle = `rgba(${o.col},${(1 - k) * 0.95})`; fxx.lineWidth = (1 + 2 * (1 - k)) * DPR;
    fxx.shadowColor = `rgba(${o.col},1)`; fxx.shadowBlur = 12 * DPR;
    fxx.beginPath(); fxx.moveTo(sx, sy);
    let x = sx, y = sy;
    for (let i = 0; i < 9; i++) { x += (o.ex * 0.6 + (Math.random() - 0.5)) * cw * 0.07; y += (o.ey * 0.6 + (Math.random() - 0.5)) * cw * 0.07; fxx.lineTo(x, y); }
    fxx.stroke(); fxx.shadowBlur = 0;
  },
  burst(o, k) {
    for (const p of o.p) {
      const d = p.v * (1 - Math.pow(1 - k, 2)) * o.c[2];
      const x = o.c[0] + Math.cos(p.a) * d, y = o.c[1] + Math.sin(p.a) * d + k * k * o.c[2] * 0.25;
      fxx.fillStyle = `rgba(${o.col},${(1 - k) * p.o})`; fxx.beginPath(); fxx.arc(x, y, p.s * DPR * (1 - k * 0.6), 0, 7); fxx.fill();
    }
  },
  streak(o, k) { // énergie dorée qui traverse l'écran
    const x = -0.2 * W + k * 1.4 * W, y = o.y * H + Math.sin(k * 6 + o.y * 9) * H * 0.03;
    const g = fxx.createLinearGradient(x - o.len, y, x, y);
    g.addColorStop(0, `rgba(${o.col},0)`); g.addColorStop(1, `rgba(${o.col},${o.a * Math.sin(Math.PI * k)})`);
    fxx.strokeStyle = g; fxx.lineWidth = o.lw * DPR; fxx.lineCap = "round";
    fxx.beginPath(); fxx.moveTo(x - o.len, y + o.tilt * o.len); fxx.lineTo(x, y); fxx.stroke();
  },
  spectrum(o, k) { // éventail arc-en-ciel qui sort de la carte (diffraction)
    const [cx, cy, cw] = cardCenter();
    const a = Math.sin(Math.PI * k) * 0.55;
    fxx.save(); fxx.translate(cx, cy); fxx.rotate(o.rot + k * 0.6);
    const cols = ["255,90,200", "190,90,255", "90,120,255", "70,220,255", "110,255,170", "255,240,110", "255,150,80"];
    for (let i = 0; i < 21; i++) {
      const an = (i / 21) * Math.PI * 2, len = cw * (0.9 + 1.4 * k);
      const gr = fxx.createLinearGradient(0, 0, Math.cos(an) * len, Math.sin(an) * len);
      gr.addColorStop(0, `rgba(${cols[i % 7]},0)`); gr.addColorStop(0.35, `rgba(${cols[i % 7]},${a})`); gr.addColorStop(1, `rgba(${cols[i % 7]},0)`);
      fxx.fillStyle = gr; fxx.beginPath(); fxx.moveTo(0, 0);
      fxx.lineTo(Math.cos(an - 0.05) * len, Math.sin(an - 0.05) * len); fxx.lineTo(Math.cos(an + 0.05) * len, Math.sin(an + 0.05) * len); fxx.fill();
    }
    fxx.restore();
  },
  lightRays(o, k) { // lumière qui s'échappe de la déchirure
    const r = booster.getBoundingClientRect(), cx = (r.left + r.width / 2) * DPR, cy = (r.top + r.height * 0.095) * DPR, bw = r.width * DPR;
    const a = Math.sin(Math.PI * Math.min(1, k * 1.3)) * o.a;
    fxx.save(); fxx.translate(cx, cy);
    for (const ray of o.rays) {
      const len = H * (0.35 + 0.8 * k) * ray.l, x0 = ray.x * bw * 0.42;
      const ex = x0 + Math.sin(ray.ang) * len, ey = -Math.cos(ray.ang) * len;
      const g = fxx.createLinearGradient(x0, 0, ex, ey);
      g.addColorStop(0, `rgba(255,246,220,${a * ray.o})`); g.addColorStop(0.5, `rgba(255,200,240,${a * ray.o * 0.35})`); g.addColorStop(1, "rgba(160,200,255,0)");
      fxx.fillStyle = g; fxx.beginPath(); fxx.moveTo(x0 - bw * 0.02, 0); fxx.lineTo(x0 + bw * 0.02, 0);
      const wv = len * ray.w; fxx.lineTo(ex + wv, ey); fxx.lineTo(ex - wv, ey); fxx.fill();
    }
    const gl2 = fxx.createRadialGradient(0, 0, 0, 0, 0, bw * 0.6);
    gl2.addColorStop(0, `rgba(255,250,235,${a * 0.9})`); gl2.addColorStop(0.4, `rgba(255,220,240,${a * 0.35})`); gl2.addColorStop(1, "rgba(255,200,240,0)");
    fxx.fillStyle = gl2; fxx.save(); fxx.scale(1, 0.35); fxx.beginPath(); fxx.arc(0, 0, bw * 0.6, 0, 7); fxx.fill(); fxx.restore();
    fxx.restore();
  },
};
function spawn(type, o, dur) { FX.push(Object.assign({ type, t0: performance.now(), dur: dur * 1000 / (fast ? 2 : 1) }, o)); }
const rings = (n, col, opts = {}) => { for (let i = 0; i < n; i++) setTimeout(() => spawn("ring", Object.assign({ c: cardCenter(), r0: 0.55, r1: 1.35 + i * 0.25, e: 0.3, dy: 0.35, col, a: 0.9, lw: 3 }, opts), 1.6), i * 160 / (fast ? 2 : 1)); };
const burst = (n, col, spd = 0.9) => spawn("burst", { c: cardCenter(), col, p: Array.from({ length: n }, () => ({ a: Math.random() * 7, v: spd * (0.3 + Math.random()), s: 1 + Math.random() * 2.6, o: 0.5 + Math.random() * 0.5 })) }, 1.6);
function drawFX(now) {
  fxx.clearRect(0, 0, W, H);
  fxx.globalCompositeOperation = "lighter";
  FX = FX.filter(o => { const k = (now - o.t0) / o.dur; if (k >= 1) return false; FXT[o.type](o, Math.max(0, k)); return true; });
  fxx.globalCompositeOperation = "source-over";
}

/* ================= tailles */
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = Math.round(innerWidth * DPR); H = Math.round(innerHeight * DPR);
  fx.width = W; fx.height = H; bg.width = Math.round(innerWidth * 0.75); bg.height = Math.round(innerHeight * 0.75);
  if (gl && cardwrap.style.display === "block") gl.resize();
  if (vgl && viewer.style.display === "grid") vgl.resize();
}
addEventListener("resize", resize); resize();

/* ================= inclinaison au doigt / à la souris */
const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", e => {
  const el = state === "booster" ? booster : (viewer.style.display === "grid" ? $("#viewer .vcard") : cardwrap);
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  tilt.tx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width * 0.6)));
  tilt.ty = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / (r.height * 0.6)));
});
addEventListener("pointerleave", () => { tilt.tx = tilt.ty = 0; });
function applyTilt() {
  tilt.x += (tilt.tx - tilt.x) * 0.08; tilt.y += (tilt.ty - tilt.y) * 0.08;
  const rx = -tilt.y * 10, ry = tilt.x * 12;
  const vars = { "--mx": `${50 + tilt.x * 40}%`, "--my": `${40 + tilt.y * 35}%`, "--sx": `${50 + tilt.x * 50}%` };
  if (state === "booster") { bTilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; Object.entries(vars).forEach(([k, v]) => booster.style.setProperty(k, v)); }
  else {
    const t = performance.now() / 1000, hd = CAMH.hand, sh = CAMH.shake;
    const hx = hd * (Math.sin(t * 0.61) * 0.6 + Math.sin(t * 1.37 + 1.3) * 0.3 + Math.sin(t * 2.9) * 0.1) + sh * (Math.sin(t * 23) + Math.sin(t * 37 + 1)) * 0.5;
    const hy = hd * (Math.sin(t * 0.53 + 2.1) * 0.6 + Math.sin(t * 1.21 + 0.4) * 0.3 + Math.sin(t * 3.1) * 0.1) + sh * (Math.sin(t * 29 + 2) + Math.sin(t * 41)) * 0.5;
    cTilt.style.transform = `translate(${hx}px,${hy}px) rotate(${hd * Math.sin(t * 0.47) * 0.15}deg) rotateX(${rx * 0.8}deg) rotateY(${ry * 0.8}deg)`; Object.entries(vars).forEach(([k, v]) => card.style.setProperty(k, v)); }
  if (gl) { gl.state.tiltX = tilt.x * 0.5; gl.state.tiltY = tilt.y * 0.5; }
  if (vgl) { vgl.state.tiltX = tilt.x * 0.5; vgl.state.tiltY = tilt.y * 0.5; $("#viewer .vcard").style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; }
}

/* ================= matière : faisceaux de contre-jour, brume, cendres */
const beams = $("#cardwrap .beams");
function makeBeams(rgb) {               // faisceaux irréguliers et flous, générés une fois par couleur
  const c = document.createElement("canvas"); c.width = c.height = 768; const x = c.getContext("2d");
  x.translate(384, 384); x.filter = "blur(7px)"; x.globalCompositeOperation = "lighter";
  for (let i = 0; i < 70; i++) {
    const an = Math.random() * Math.PI * 2, w = 0.004 + Math.random() * 0.03, L = 384 * (0.55 + Math.random() * 0.45), o = 0.04 + Math.random() * 0.16;
    const g = x.createLinearGradient(0, 0, Math.cos(an) * L, Math.sin(an) * L);
    g.addColorStop(0, `rgba(${rgb},${o})`); g.addColorStop(0.3, `rgba(${rgb},${o * 0.7})`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(an - w) * L, Math.sin(an - w) * L); x.lineTo(Math.cos(an + w) * L, Math.sin(an + w) * L); x.fill();
  }
  const r = x.createRadialGradient(0, 0, 0, 0, 0, 384); r.addColorStop(0, `rgba(${rgb},.75)`); r.addColorStop(0.12, `rgba(${rgb},.3)`); r.addColorStop(0.4, `rgba(${rgb},.06)`); r.addColorStop(1, `rgba(${rgb},0)`);
  x.filter = "none"; x.fillStyle = r; x.fillRect(-384, -384, 768, 768);
  return `url(${c.toDataURL()})`;
}
const BEAMS = {};
const setBeams = (key, rgb) => { BEAMS[key] = BEAMS[key] || makeBeams(rgb); beams.style.backgroundImage = BEAMS[key]; };
const hazeT = document.getElementById("hazeT"), hazeD = document.getElementById("hazeD");
const HZ = { v: 0 };
// caméra « à l'épaule » (2D : léger flottement de toute la scène)
const CAMH = { hand: 3, shake: 0 };
// cendres et braises (écran) — chaleur qui monte, air qui freine, turbulence
let ASH = [];
function emitAsh(nx, ny, spark) {
  const [cx, cy, cw, ch] = cardCenter();
  ASH.push({ x: cx + (nx - 0.5) * cw, y: cy + (ny - 0.5) * ch, vx: (Math.random() - 0.5) * 30 * DPR, vy: -(10 + Math.random() * 30) * DPR, t: 0,
    life: spark ? 0.5 + Math.random() * 0.9 : 1.4 + Math.random() * 1.4, s: (spark ? 0.8 + Math.random() * 1.2 : 1.6 + Math.random() * 2.4) * DPR, spark, ph: Math.random() * 6, h: Math.random() });
}
function drawAsh(dt, t) {
  ASH = ASH.filter(q => {
    q.t += dt; if (q.t > q.life) return false;
    q.vy -= 40 * DPR * dt; q.vx *= 1 - 0.8 * dt; q.vy *= 1 - 0.6 * dt; q.vx += Math.sin(t * 1.7 + q.ph + q.y * 0.01) * 50 * DPR * dt;
    q.x += q.vx * dt; q.y += q.vy * dt;
    const k = q.t / q.life, a = Math.min(1, k * 8) * (1 - k);
    if (q.spark) { fxx.globalCompositeOperation = "lighter"; const hue = (q.h * 360 + t * 90) % 360; fxx.fillStyle = `hsla(${hue},80%,72%,${a})`; fxx.beginPath(); fxx.arc(q.x, q.y, q.s, 0, 7); fxx.fill(); }
    else { fxx.globalCompositeOperation = "source-over"; fxx.fillStyle = `rgba(8,6,10,${a * 0.85})`; fxx.save(); fxx.translate(q.x, q.y); fxx.rotate(q.ph + t * 2); fxx.fillRect(-q.s, -q.s * 0.4, q.s * 2, q.s * 0.8); fxx.restore(); }
    return true;
  });
  fxx.globalCompositeOperation = "source-over";
}
// point au hasard sur le front de flamme (coordonnées normalisées de la carte)
function burnFront(b) {
  const asp = 900 / 1256, d = Math.max(0, -0.13 + 0.63 * b), hw = Math.max(0.02, asp / 2 - d) / asp, hh = Math.max(0.02, 0.5 - d);
  const side = Math.random() * 4 | 0, u = Math.random() * 2 - 1;
  const p = side === 0 ? [u * hw, -hh] : side === 1 ? [hw, u * hh] : side === 2 ? [u * hw, hh] : [-hw, u * hh];
  return [0.5 + p[0], 0.5 + p[1]];
}
const spring = (z = 0.8, w = 9) => { const s = Math.sqrt(1 - z * z), wd = w * s, k = z / s; return t => t >= 1 ? 1 : 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + k * Math.sin(wd * t)); };

/* ================= boucle */
let glOn = false;
let lastT = performance.now();
function loop(now) {
  const t = now / 1000, dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  applyTilt();
  if (+getComputedStyle(bg).opacity > 0) drawBG(t);
  drawFX(now);
  if (gl && gl.state.burn > 0 && gl.state.burn < 0.995) { const n = Math.round((2 + 7 * gl.state.burn) * dt * 60 / 3); for (let i = 0; i < n; i++) { const [x, y] = burnFront(gl.state.burn); emitAsh(x, y, Math.random() < 0.45); } }
  if (ASH.length) drawAsh(dt, t);
  if (HZ.v > 0.001) { hazeT.setAttribute("baseFrequency", `${0.011 + Math.sin(t * 1.3) * 0.002} ${0.032 + Math.sin(t * 1.7) * 0.006}`); hazeD.setAttribute("scale", (HZ.v * 14 * (0.8 + 0.2 * Math.sin(t * 5))).toFixed(2)); }
  if (gl && glOn) gl.draw(now);
  if (vgl && viewer.style.display === "grid") vgl.draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ================= contrôles */
function setSkip(on) { skipB.style.display = on ? "block" : "none"; }
skipB.onclick = e => { e.stopPropagation(); if (tl && finish) { tl.progress(1, true); tl.kill(); const f = finish; finish = null; f(); } };
$("#fast").onclick = e => { e.stopPropagation(); fast = !fast; e.currentTarget.setAttribute("aria-pressed", fast); gsap.globalTimeline.timeScale(fast ? 2 : 1); };
$("#snd").onclick = e => { e.stopPropagation(); A.init(); const m = !A.muted; A.mute(m); e.currentTarget.setAttribute("aria-pressed", !m); };
function run(timeline, done) { tl = timeline; finish = done; setSkip(true); timeline.eventCallback("onComplete", () => { if (finish) { const f = finish; finish = null; f(); } }); }

/* ================= étape 1-3 : booster */
booster.addEventListener("pointerenter", () => { if (state === "booster") A.hover(); });
booster.addEventListener("click", openBooster);
booster.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") openBooster(); });
gsap.set(bTilt, { filter: "brightness(1) saturate(1)" });
gsap.to(booster, { y: -10, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });

function openBooster() {
  if (state !== "booster") return;
  state = "opening"; A.init(); A.ambient(true, 4);
  say("");
  const T = gsap.timeline();
  T.call(() => A.crinkle(5, 0.3))
    .to(booster, { y: -28, scale: 1.04, duration: 0.35, ease: "power2.out" }, 0)
    .to(bTilt, { scaleY: 0.975, scaleX: 1.02, skewX: -1.5, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.3)
    .call(() => A.crinkle(8, 0.35), null, 0.35)
    .to(lang, { rotation: -5, x: "-1%", duration: 0.14, ease: "power1.out" }, 0.78)
    .call(() => A.tear(), null, 0.8)
    .to(lang, { x: "38%", y: "-55%", rotation: 26, opacity: 0, duration: 0.7, ease: "power2.in" }, 0.92)
    .to(corps, { x: 3, duration: 0.05, yoyo: true, repeat: 5, ease: "none" }, 0.82)
    .fromTo("#booster .tearlight", { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 0.4, ease: "power2.out" }, 0.9)
    .call(() => { A.lightBurst(); spawn("lightRays", { a: 1, rays: Array.from({ length: 16 }, (_, i) => { const x = (i / 15) * 2 - 1; return { x, ang: x * 0.45 + (Math.random() - 0.5) * 0.15, w: 0.02 + Math.random() * 0.05, l: 0.5 + Math.random() * 0.6, o: 0.25 + Math.random() * 0.45 }; }) }, 2.2); }, null, 1.0)
    .to(bTilt, { filter: "brightness(1.35) saturate(1.2)", duration: 0.6 }, 1.0)
    .to(veil, { opacity: 0.85, duration: 0.9, ease: "power1.inOut" }, 1.25)
    .to(site, { opacity: 0, duration: 0.9 }, 1.25)
    .call(() => A.whoosh(1.0), null, 1.6)
    .fromTo(wave, { opacity: 0, backgroundPosition: "0% 100%" }, { opacity: 1, backgroundPosition: "100% 0%", duration: 1.15, ease: "power1.inOut" }, 1.6)
    .to(wave, { opacity: 0, duration: 0.4 }, 2.45)
    .to(flash, { opacity: 0.55, duration: 0.08 }, 2.0).to(flash, { opacity: 0, duration: 0.6 }, 2.08)
    .to(booster, { y: "40vh", scale: 0.55, opacity: 0, duration: 0.7, ease: "power2.in" }, 2.0)
    .call(() => window.ZK_BG.play(), null, 1.6)
    .to(bg, { opacity: 1, duration: 1.2 }, 2.1)
    .to(window.ZK_BG.el, { opacity: 1, duration: 1.6 }, 2.1)
    .to(veil, { opacity: 0, duration: 1.2 }, 2.4);
  run(T, () => {
    gsap.set([bg, window.ZK_BG.el], { opacity: 1 }); window.ZK_BG.play(); gsap.set([veil, wave, flash, site], { opacity: 0 }); gsap.set(booster, { display: "none" });
    FX = []; arrive();
  });
}

/* ================= étape 4 : arrivée d'une carte, dos visible */
async function arrive() {
  state = "arrive"; setSkip(false);
  const c = DECK[idx];
  gsap.set(inner, { rotationY: 0, rotationX: 0 }); gsap.set(card, { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0, rotationX: 0 });
  gsap.set([glow, rays, aura, beams], { opacity: 0 }); gsap.set(backImg, { filter: "brightness(1) saturate(1) hue-rotate(0deg)" });
  asm.style.display = "none"; asm.innerHTML = ""; ghosts.innerHTML = ""; glOn = false; gsap.set(glc, { opacity: 1 }); ASH = [];
  cardwrap.style.display = "block";
  if (gl) { await gl.load(c); Object.assign(gl.state, { fx: 0, depth: 0, zoom: 1, ghost: 0, flash: 0, burn: 0 }); }
  A.slide();
  // la carte sort du paquet par le bas : elle décélère et se pose avec son poids, sans rebond
  gsap.fromTo(card, { y: "55vh", rotationX: 50, rotation: -4 }, { y: 0, rotationX: 0, rotation: 0, duration: 1.1, ease: "expo.out" });
  setTimeout(() => { if (state === "arrive") { state = "ready"; say("Touche la carte"); } }, 800);
}
card.addEventListener("click", () => {
  if (state === "ready") reveal();
  else if (state === "revealed") next();
});
card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") card.click(); });
let sx = null;
addEventListener("pointerdown", e => { sx = e.clientX; });
addEventListener("pointerup", e => { if (sx !== null && state === "revealed" && Math.abs(e.clientX - sx) > 60) next(); sx = null; });

/* ================= étape 5 : révélation selon la rareté
   Rien de dessiné par-dessus la scène : la rareté se lit à la lumière (contre-jour, salle qui s'éteint),
   à la matière (brume de chaleur, combustion, dispersion) et au rythme. Mouvements à ressorts amortis. */
function reveal() {
  state = "revealing"; say("");
  const c = DECK[idx];
  ({ zenkai: revealZenkai, mirage: revealMirage, spectre: revealSpectre, prisme: revealPrisme, eclat: revealEclat }[c.rarity] || revealEclat)();
}
function revealed() {
  state = "revealed"; setSkip(false); glOn = true;
  asm.style.display = "none"; gsap.set(glc, { opacity: 1 }); gsap.set(inner, { rotationY: 180, rotationX: 0 }); gsap.set(card, { scale: 1, rotation: 0 });
  if (gl) Object.assign(gl.state, { fx: 1, depth: 0, zoom: 1, ghost: 0, flash: 0, burn: 0 });
  gsap.set(stage, { scale: 1, x: 0, y: 0 }); HZ.v = 0; backImg.style.filter = ""; CAMH.shake = 0;
  if (ghosts.children.length) gsap.set([...ghosts.children], { opacity: 0 });
  A.ambient(true, 3);
  setTimeout(() => { if (state === "revealed") say(idx < DECK.length - 1 ? "Touche ou glisse pour la carte suivante" : "Touche pour voir tes cartes"); }, 1600);
}
// retournement physique : petite anticipation, la carte se soulève, pivote, dépasse à peine et se pose
function flip2(T, at, dur = 0.8, o = {}) {
  if (o.anti !== false) T.to(inner, { rotationY: -6, duration: 0.16, ease: "power2.out" }, at - 0.16);
  T.call(() => A.flick(o.heavy), null, at)
    .to(inner, { rotationY: 180, duration: dur, ease: spring(o.z ?? 0.8, o.w ?? 9) }, at)
    .to(inner, { rotationX: 7, duration: dur * 0.35, ease: "sine.out" }, at)
    .to(inner, { rotationX: 0, duration: dur * 0.75, ease: spring(0.7, 8) }, at + dur * 0.35)
    .to(card, { scale: 1 + (o.lift ?? 0.05), duration: dur * 0.4, ease: "power2.out" }, at)
    .to(card, { scale: 1, duration: dur * 0.85, ease: spring(0.85, 8) }, at + dur * 0.4)
    .to(card, { rotation: 1.6, duration: dur * 0.4, ease: "sine.out" }, at)
    .to(card, { rotation: 0, duration: dur * 0.75, ease: spring(0.7, 8) }, at + dur * 0.4)
    .call(() => { glOn = true; }, null, at + dur * 0.2);
  return T;
}
const G = () => (gl ? gl.state : {});

/* ---- ÉCLAT : version d'origine */
function revealEclat() {
  const T = gsap.timeline();
  T.to(card, { y: -16, scale: 1.03, duration: 0.35, ease: "power2.out" }, 0)
    .fromTo(card, { "--sx": "0%" }, { "--sx": "100%", duration: 0.6, ease: "power1.inOut" }, 0)
    .to(aura, { opacity: 0.55, background: "radial-gradient(closest-side,#f3f0ff,#ffd88a55,#0000)", duration: 0.4 }, 0)
    .call(() => A.eclatFlip(), null, 0.35)
    .to(inner, { rotationY: 180, duration: 0.6, ease: "power3.inOut" }, 0.35)
    .call(() => { glOn = true; if (gl) Object.assign(gl.state, { zoom: 1.04 }); }, null, 0.55)
    .to(card, { y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 0.9)
    .call(() => burst(40, "255,220,150", 0.6), null, 0.9)
    .to(gl ? gl.state : {}, { fx: 1, zoom: 1, duration: 0.9 }, 0.9)
    .to(aura, { opacity: 0.35, duration: 0.6 }, 1.2)
    .to({}, { duration: 0.1 }, 1.8);
  run(T, revealed);
}

/* ---- PRISME : version d'origine */
function revealPrisme() {
  const T = gsap.timeline();
  T.call(() => A.prismeStart())
    .to(BG.tint, { 0: 120, 1: 70, 2: 150, duration: 0.8 }, 0)
    .to(aura, { opacity: 0.8, background: "conic-gradient(from 0deg,#ff7ad9,#8b7bff,#5ae3ff,#b0ff9e,#ffe27a,#ff7ad9)", duration: 0.6 }, 0)
    .fromTo(card, { "--sx": "0%" }, { "--sx": "100%", duration: 0.9, ease: "power1.inOut" }, 0)
    .to(backImg, { filter: "brightness(1.25) saturate(1.6) hue-rotate(0deg)", duration: 0.5 }, 0)
    .to(backImg, { filter: "brightness(1.25) saturate(1.6) hue-rotate(300deg)", duration: 0.9, ease: "none" }, 0.4)
    .call(() => spawn("spectrum", { rot: Math.random() * 6 }, 1.3), null, 0.5)
    .to(card, { scale: 1.05, duration: 0.6, ease: "power2.in" }, 0.5)
    .call(() => A.prismeFlip(), null, 1.1)
    .to(inner, { rotationY: 180, duration: 0.65, ease: "power3.inOut" }, 1.1)
    .call(() => { glOn = true; if (gl) Object.assign(gl.state, { zoom: 1.08 }); }, null, 1.3)
    .to(flash, { opacity: 0.3, duration: 0.06 }, 1.45).to(flash, { opacity: 0, duration: 0.5 }, 1.51)
    .to(card, { scale: 1, duration: 0.7, ease: "back.out(1.6)" }, 1.5)
    .call(() => { rings(2, "255,190,240", { lw: 2.5 }); burst(70, "255,235,255", 0.8); }, null, 1.5)
    .to(gl ? gl.state : {}, { fx: 1, zoom: 1, duration: 1.1 }, 1.6)
    .to(aura, { opacity: 0.45, duration: 0.8 }, 2.0)
    .to({}, { duration: 0.1 }, 2.6);
  run(T, revealed);
}

/* ---- SPECTRE : combustion. Le dos brûle depuis les bords en flammes noires holo, la face apparaît dessous */
function revealSpectre() {
  const T = gsap.timeline();
  T.call(() => A.spectreStart())
    .to(veil, { opacity: 0.55, duration: 1.0 }, 0)
    .to(BG.tint, { 0: 30, 1: 45, 2: 110, duration: 1.2 }, 0)
    .to(stage, { scale: 1.05, duration: 3.2, ease: "sine.inOut" }, 0)
    // bascule invisible : la face est déjà là, recouverte d'une copie du dos qui va brûler
    .call(() => { gsap.set(inner, { rotationY: 180 }); glOn = true; if (gl) gl.state.burn = 0.0001; }, null, 0.35)
    .call(() => A.fire(2.6), null, 0.4)
    .to(G(), { burn: 0.07, duration: 0.5, ease: "sine.in" }, 0.4)
    .to(G(), { burn: 1, duration: 1.9, ease: "power1.in" }, 0.9)
    .to(card, { rotation: 0.6, duration: 1.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.6)
    .to(G(), { ghost: 0.3, duration: 0.9, ease: "power1.in" }, 1.9)
    .to(G(), { fx: 1, duration: 0.9 }, 2.2)
    .call(() => { if (gl) gl.state.burn = 0; A.whoomph(); }, null, 2.82)
    .to(G(), { ghost: 0, duration: 1.4, ease: "power2.out" }, 2.85)
    .to(veil, { opacity: 0.15, duration: 1.4 }, 2.8)
    .to(stage, { scale: 1, duration: 1.4, ease: "power2.inOut" }, 2.8)
    .to(aura, { opacity: 0.3, background: "radial-gradient(closest-side,#6a5cff,#2a1f6a88,#0000)", duration: 1.2 }, 2.8)
    .to({}, { duration: 0.1 }, 3.9);
  run(T, () => { gsap.set(veil, { opacity: 0.15 }); revealed(); });
}

/* ---- MIRAGE (ancienne + nouvelle) : les doubles colorés s'écartent dans un air qui tremble, se referment,
   la carte se retourne à travers la brume puis fait la mise au point */
function revealMirage() {
  const offs = [[-0.3, -0.03, -9, 0], [0.3, 0.02, 8, 120], [-0.16, 0.05, -4, 220], [0.17, -0.05, 5, 300]];
  ghosts.innerHTML = offs.map(() => `<img src="${IMG}dos.webp" alt="">`).join("");
  const GH = [...ghosts.children];
  GH.forEach((g, i) => g.style.filter = `hue-rotate(${offs[i][3]}deg) saturate(1.8) brightness(1.15)`);
  const cw = cardwrap.offsetWidth, ch = cardwrap.offsetHeight;
  setBeams("mirage", "215,200,255");
  const T = gsap.timeline();
  T.call(() => { A.mirageStart(); A.heat(); backImg.style.filter = "url(#haze)"; })
    .to(veil, { opacity: 0.3, duration: 1.2 }, 0)
    .to(BG, { mir: 1, duration: 1.3, ease: "sine.inOut" }, 0)
    .to(BG.tint, { 0: 150, 1: 120, 2: 230, duration: 1.3 }, 0)
    .to(aura, { opacity: 0.8, background: "radial-gradient(closest-side,#ffc6f2,#9fd8ff88,#0000)", duration: 1 }, 0)
    .to(HZ, { v: 1, duration: 1.4, ease: "sine.in" }, 0.1)
    .to(beams, { opacity: 0.22, duration: 1.4 }, 0.2)
    .to(card, { opacity: 0.8, duration: 0.5 }, 0.1);
  GH.forEach((g, i) => {
    T.fromTo(g, { x: 0, y: 0, rotation: 0, opacity: 0 }, { x: offs[i][0] * cw, y: offs[i][1] * ch, rotation: offs[i][2], opacity: 0.55, duration: 0.9, ease: "power2.out" }, 0.15 + i * 0.06)
      .to(g, { x: `+=${(i % 2 ? -1 : 1) * cw * 0.05}`, y: `+=${ch * 0.02}`, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.05)
      .to(g, { x: 0, y: 0, rotation: 0, opacity: 0.9, duration: 0.55, ease: "power3.in" }, 1.55)
      .to(g, { opacity: 0, duration: 0.25 }, 2.1);
  });
  T.to(stage, { x: 14, duration: 1.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.2)
    .to(card, { opacity: 1, duration: 0.3 }, 1.6);
  flip2(T, 1.75, 1.0, { z: 0.72, w: 8, lift: 0.04 });
  T.call(() => { if (gl) Object.assign(gl.state, { ghost: 1, depth: 1, zoom: 1.12 }); }, null, 1.95)
    .to(HZ, { v: 0, duration: 0.5 }, 1.9)
    .call(() => { backImg.style.filter = ""; }, null, 2.45)
    .call(() => A.mirageMerge(), null, 2.05)
    .to(flash, { opacity: 0.3, duration: 0.08 }, 2.1).to(flash, { opacity: 0, duration: 0.7 }, 2.18)
    .call(() => { rings(3, "220,200,255", { lw: 2.5 }); burst(70, "230,215,255", 0.8); }, null, 2.15)
    .to(G(), { ghost: 0, duration: 1.4, ease: "power2.out" }, 2.2)
    .to(G(), { depth: 0, zoom: 1, duration: 2.0, ease: "expo.out" }, 2.2)
    .to(G(), { fx: 1, duration: 1.4 }, 2.6)
    .to(beams, { opacity: 0, duration: 1.4 }, 2.4)
    .to(veil, { opacity: 0.08, duration: 1.4 }, 2.6)
    .to(BG, { mir: 0.35, duration: 1.6 }, 2.8)
    .to(aura, { opacity: 0.55, duration: 1 }, 3.4)
    .to({}, { duration: 0.2 }, 4.4);
  run(T, () => { gsap.set(veil, { opacity: 0.08 }); gsap.set(beams, { opacity: 0 }); gsap.set(card, { opacity: 1 }); revealed(); });
}

/* ---- ZENKAI (ancienne + nouvelle) : rotation, arrêt net dans le noir, une lumière s'allume derrière la carte,
   anneaux et énergie, zoom brutal, assemblage, impulsion finale, la salle se rallume en chaud */
function revealZenkai() {
  const c = DECK[idx];
  asm.innerHTML = c.asm.map(([k, src]) => `<img data-k="${k}" src="${src}" alt="">`).join("");
  const L = k => asm.querySelector(`[data-k=${k}]`);
  setBeams("zenkai", "255,205,130");
  const T = gsap.timeline();
  T.call(() => A.spin(1.5))
    .to(inner, { rotationY: 1440, duration: 1.6, ease: "power2.in" }, 0)
    .to(aura, { opacity: 0.6, background: "radial-gradient(closest-side,#ffd77a,#0000)", duration: 1.2 }, 0)
    // arrêt net : musique et lumières coupées
    .call(() => { A.stopHit(); A.cut(); A.dark(); }, null, 1.6)
    .to(veil, { opacity: 0.93, duration: 0.15 }, 1.6)
    .to(aura, { opacity: 0, duration: 0.15 }, 1.6)
    .to(backImg, { filter: "brightness(0.5) saturate(1)", duration: 0.2 }, 1.6)
    .to(card, { scale: 1.03, duration: 0.08, yoyo: true, repeat: 1 }, 1.6)
    // une lumière s'allume derrière la carte : faisceaux, le dos s'illumine
    .call(() => A.rumble(2.5), null, 2.0)
    .fromTo(aura, { background: "radial-gradient(closest-side,#fff1c8,#ffb45acc 40%,#0000)" }, { opacity: 0.9, duration: 1.8, ease: "sine.in" }, 2.0)
    .to(beams, { opacity: 0.6, duration: 1.8, ease: "sine.in" }, 2.0)
    .to(backImg, { filter: "brightness(1.5) saturate(1.3)", duration: 1.8, ease: "power1.in" }, 2.0)
    .to(glow, { opacity: 0.8, duration: 1.8, ease: "power1.in" }, 2.0)
    .to(BG.tint, { 0: 255, 1: 170, 2: 60, duration: 1.8 }, 2.2)
    .to(veil, { opacity: 0.55, duration: 1.8 }, 2.2)
    .to(stage, { scale: 1.08, duration: 2.0, ease: "sine.inOut" }, 1.9)
    // anneaux + énergie dorée qui traverse
    .call(() => rings(4, "255,205,110", { lw: 4, a: 1 }), null, 3.0)
    .call(() => { for (let i = 0; i < 16; i++) setTimeout(() => spawn("streak", { y: Math.random(), len: W * (0.15 + Math.random() * 0.25), lw: 2 + Math.random() * 4, col: "255,210,120", a: 0.9, tilt: (Math.random() - 0.5) * 0.3 }, 0.9 + Math.random() * 0.4), i * 70 / (fast ? 2 : 1)); }, null, 3.2)
    .to(beams, { opacity: 1, duration: 0.8, ease: "power2.in" }, 3.2)
    .to(card, { scale: 1.06, duration: 1.2, ease: "power1.in" }, 3.0)
    .to(CAMH, { shake: 1.5, duration: 0.6 }, 3.3)
    // la caméra fonce
    .to(stage, { scale: 1.38, duration: 0.3, ease: "expo.in" }, 4.0)
    .to(CAMH, { shake: 8, duration: 0.05 }, 4.0).to(CAMH, { shake: 0, duration: 0.5 }, 4.05)
    .to(flash, { opacity: 1, duration: 0.06 }, 4.3)
    .call(() => { A.impact(); glOn = false; asm.style.display = "block"; gsap.set(glc, { opacity: 0 }); }, null, 4.3)
    .set(inner, { rotationY: 1440 + 180 }, 4.34)
    .set(glow, { opacity: 0 }, 4.34)
    .set(card, { scale: 1 }, 4.34)
    .to(flash, { opacity: 0, duration: 0.8 }, 4.36)
    .to(stage, { scale: 1.12, duration: 0.9, ease: "expo.out" }, 4.36)
    // assemblage : illustration en profondeur, puis le contour doré se reconstruit
    .fromTo(L("ill"), { scale: 1.3, filter: "brightness(2.4) blur(6px)" }, { scale: 1, filter: "brightness(1) blur(0px)", duration: 1.2, ease: "expo.out" }, 4.34)
    .fromTo([L("voile"), L("lueur")], { opacity: 0 }, { opacity: 1, duration: 0.5 }, 4.7)
    .fromTo(L("bande"), { scale: 1.18, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.4)" }, 4.85)
    .call(() => A.whoosh(0.5, false), null, 4.85)
    .fromTo(L("flammes"), { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out" }, 5.1)
    .fromTo(L("couronne"), { y: "-30%", rotation: -25, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" }, 5.35)
    .fromTo([L("eclats"), L("infos")], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 }, 5.6)
    // dernière impulsion lumineuse
    .call(() => { A.zenkaiChord(); burst(140, "255,215,130", 1.2); rings(2, "255,235,170", { r1: 2.2, lw: 6, e: 0.45, dy: 0 }); glOn = true; if (gl) gl.state.fx = 1; }, null, 6.2)
    .to(flash, { opacity: 0.5, duration: 0.07 }, 6.2).to(flash, { opacity: 0, duration: 1.0 }, 6.27)
    .to(glc, { opacity: 1, duration: 0.35 }, 6.25)
    .to(stage, { scale: 1, duration: 1.4, ease: "expo.out" }, 6.25)
    // la salle se rallume en chaud, un halo reste derrière la carte
    .to(veil, { opacity: 0.1, duration: 2.0 }, 6.3)
    .to(beams, { opacity: 0.35, duration: 2.0 }, 6.4)
    .to(aura, { opacity: 0.55, duration: 1 }, 6.4)
    .to(backImg, { filter: "brightness(1) saturate(1)", duration: 0.5 }, 6.4)
    .to({}, { duration: 1.0 }, 7.0);
  run(T, () => { gsap.set(veil, { opacity: 0.1 }); gsap.set(beams, { opacity: 0.35 }); gsap.set(aura, { opacity: 0.55 }); gsap.set([glow, flash], { opacity: 0 }); gsap.set(backImg, { filter: "" }); revealed(); });
}

/* ================= étape 6 : carte suivante */
function next() {
  if (state !== "revealed") return;
  state = "leaving"; say(""); A.slide(true);
  gsap.to(BG, { mir: 0, spe: 0, rays: 0, dim: 0, duration: 0.8 });
  gsap.to(BG.tint, { 0: 60, 1: 30, 2: 110, duration: 0.8 });
  gsap.to(veil, { opacity: 0, duration: 0.8 });
  gsap.to([beams, aura], { opacity: 0, duration: 0.5 });
  // posée sur la pile, à gauche, comme une vraie carte
  gsap.to(card, { x: "-75%", y: "12%", rotation: -14, rotationX: 18, scale: 0.9, duration: 0.62, ease: "power3.in", onComplete: () => {
    glOn = false; idx++;
    if (idx < DECK.length) arrive(); else recap();
  } });
  gsap.to(card, { opacity: 0, duration: 0.2, delay: 0.42 });
}

/* ================= étape 7 : récapitulatif */
function recap() {
  state = "recap"; A.close(); cardwrap.style.display = "none";
  const grid = $("#grid");
  grid.innerHTML = DECK.map((c, i) => `<button data-i="${i}" aria-label="Voir la carte ${c.name}"><img src="${c.full}" alt=""><span class="r-${c.rarity}">${LABEL[c.rarity]}</span></button>`).join("");
  const rc = $("#recap"); rc.style.display = "block";
  gsap.to(bg, { opacity: 0, duration: 1 });
  gsap.fromTo(rc, { opacity: 0 }, { opacity: 1, duration: 0.9 });
  gsap.from("#grid button", { y: 40, opacity: 0, stagger: 0.08, duration: 0.6, ease: "back.out(1.4)", delay: 0.3 });
  grid.querySelectorAll("button").forEach(b => b.onclick = () => openViewer(DECK[+b.dataset.i]));
}
async function openViewer(c) {
  viewer.style.display = "grid";
  if (!vgl) { try { vgl = new CardGL($("#vgl")); } catch (e) { return; } }
  await vgl.load(c); vgl.state.fx = 1; vgl.resize(); A.flipChime();
  gsap.fromTo("#viewer .vcard", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.4)" });
}
$("#vclose").onclick = () => { viewer.style.display = "none"; };
viewer.addEventListener("click", e => { if (e.target === viewer) viewer.style.display = "none"; });
$("#again").onclick = () => {
  idx = 0; DECK = drawBooster(); state = "booster"; FX = [];
  gsap.set(window.ZK_BG.el, { opacity: 0 }); window.ZK_BG.el.pause(); window.ZK_BG.prepare(DECK);
  $("#recap").style.display = "none";
  gsap.set(booster, { display: "block", y: 0, scale: 1, opacity: 1 }); gsap.set(lang, { x: 0, y: 0, rotation: 0, opacity: 1 });
  gsap.set("#booster .tearlight", { opacity: 0 }); gsap.set(bTilt, { filter: "brightness(1) saturate(1)", scaleX: 1, scaleY: 1, skewX: 0 });
  gsap.to(site, { opacity: 1, duration: 0.8 }); gsap.set(bg, { opacity: 0 });
  A.ambient(true, 2); say("Touche le booster pour l'ouvrir", 1);
};
}
