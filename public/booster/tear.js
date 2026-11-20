/* ZENKAI 2027 — déchirure physique de la languette du booster (ammo.js, corps mou).
   La languette devient un tissu fin : le bas est accroché au booster, l'extrémité droite suit le doigt.
   En glissant, les points d'accroche lâchent un à un depuis la droite : le foil se déchire réellement,
   pend, puis tombe avec la gravité une fois arraché.
   ammo.js n'est chargé qu'au premier contact avec le booster. */

let ammoP = null;
function loadAmmo() {
  if (ammoP) return ammoP;
  ammoP = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "ammo/ammo.wasm.js";
    s.onload = () => window.Ammo({ locateFile: f => "ammo/" + f }).then(res, rej);
    s.onerror = rej;
    document.head.appendChild(s);
  });
  return ammoP;
}
export function preloadAmmo() { return loadAmmo().catch(() => null); }

export async function makeTear(THREE, { booster, strip, frontMat, backMat, mats = [] }) {
  const A = await loadAmmo();
  const NX = 30, NY = 6;
  // ---- géométrie de la languette, dans le repère du booster
  booster.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(booster.matrixWorld).invert();
  const fit = { front: null, back: null };
  const box = new THREE.Box3();
  const tmp = new THREE.Vector3();
  strip.traverse(o => {
    if (!o.isMesh) return;
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    const P = o.geometry.attributes.position, UV = o.geometry.attributes.uv;
    // régression linéaire u = a·x + b, v = c·y + d pour reporter la même zone de texture
    let n = 0, sx = 0, su = 0, sxx = 0, sxu = 0, sy = 0, sv = 0, syy = 0, syv = 0;
    for (let i = 0; i < P.count; i++) {
      tmp.fromBufferAttribute(P, i).applyMatrix4(m); box.expandByPoint(tmp);
      if (!UV) continue;
      const u = UV.getX(i), v = UV.getY(i);
      n++; sx += tmp.x; su += u; sxx += tmp.x * tmp.x; sxu += tmp.x * u; sy += tmp.y; sv += v; syy += tmp.y * tmp.y; syv += tmp.y * v;
    }
    if (!UV || n < 4) return;
    const a = (n * sxu - sx * su) / (n * sxx - sx * sx), b = (su - a * sx) / n;
    const c = (n * syv - sy * sv) / (n * syy - sy * sy), d = (sv - c * sy) / n;
    if (o.material === frontMat) fit.front = { a, b, c, d };
    else if (o.material === backMat) fit.back = { a, b, c, d };
  });
  const x0 = box.min.x, x1 = box.max.x, y0 = box.min.y, y1 = box.max.y, zc = (box.min.z + box.max.z) / 2;
  const W = x1 - x0, H = y1 - y0;

  // ---- monde physique
  const cfg = new A.btSoftBodyRigidBodyCollisionConfiguration();
  const world = new A.btSoftRigidDynamicsWorld(new A.btCollisionDispatcher(cfg), new A.btDbvtBroadphase(),
    new A.btSequentialImpulseConstraintSolver(), cfg, new A.btDefaultSoftBodySolver());
  const G = 9.8 * 2.2;                                   // le booster mesure ~2 unités : gravité mise à l'échelle
  const gv = new A.btVector3(0, -G, 0);
  world.setGravity(gv); world.getWorldInfo().set_m_gravity(gv);
  const help = new A.btSoftBodyHelpers();
  const V = (x, y, z) => new A.btVector3(x, y, z);
  const sb = help.CreatePatch(world.getWorldInfo(), V(x0, y0, zc), V(x1, y0, zc), V(x0, y1, zc), V(x1, y1, zc), NX, NY, 0, true);
  const sc = sb.get_m_cfg();
  sc.set_viterations(20); sc.set_piterations(20); sc.set_kDP(0.04); sc.set_kDF(0.3);
  const mat = sb.get_m_materials().at(0);
  mat.set_m_kLST(0.95); mat.set_m_kAST(0.95);
  sb.generateBendingConstraints(2, mat);            // le foil résiste à la flexion
  sb.setTotalMass(0.06, false);
  A.castObject(sb, A.btCollisionObject).getCollisionShape().setMargin(0.004);
  world.addSoftBody(sb, 1, -1);

  // ---- correspondance nœud ↔ grille
  const nodes = sb.get_m_nodes(), N = nodes.size();
  const grid = [], home = [];
  for (let k = 0; k < N; k++) {
    const p = nodes.at(k).get_m_x();
    const i = Math.round((p.x() - x0) / W * (NX - 1)), j = Math.round((p.y() - y0) / H * (NY - 1));
    grid[j * NX + i] = k; home[k] = [p.x(), p.y(), p.z()];
  }
  const mass = 0.06 / N;
  const at = (i, j) => nodes.at(grid[j * NX + i]);
  const pin = (i, j) => sb.setMass(grid[j * NX + i], 0);
  const unpin = (i, j) => sb.setMass(grid[j * NX + i], mass);
  for (let i = 0; i < NX; i++) pin(i, 0);              // le bas est collé au booster
  const HAND = 3;                                       // les 3 dernières colonnes sont tenues par les doigts
  for (let i = NX - HAND; i < NX; i++) for (let j = 0; j < NY; j++) pin(i, j);

  // ---- on déforme le vrai maillage de la languette (texture, sertissage et tranche d'origine) :
  //      chaque sommet suit le tissu par interpolation bilinéaire du déplacement des nœuds voisins
  const parts = [];
  strip.traverse(o => {
    if (!o.isMesh) return;
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    const g = o.geometry.clone(); g.applyMatrix4(m);
    const P = g.attributes.position, n = P.count;
    const rest = Float32Array.from(P.array), cell = new Int32Array(n * 4), wt = new Float32Array(n * 4);
    for (let v = 0; v < n; v++) {
      const gx = Math.min(NX - 1.001, Math.max(0, (rest[v * 3] - x0) / W * (NX - 1)));
      const gy = Math.min(NY - 1.001, Math.max(0, (rest[v * 3 + 1] - y0) / H * (NY - 1)));
      const i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
      cell.set([j * NX + i, j * NX + i + 1, (j + 1) * NX + i, (j + 1) * NX + i + 1], v * 4);
      wt.set([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy], v * 4);
    }
    const mesh = new THREE.Mesh(g, o.material); mesh.frustumCulled = false;
    booster.add(mesh); parts.push({ mesh, g, rest, cell, wt, n });
  });
  strip.visible = false;
  const disp = new Float32Array(NX * NY * 3);

  function sync() {
    for (let q = 0; q < NX * NY; q++) {
      const k = grid[q], p = nodes.at(k).get_m_x(), h = home[k];
      disp[q * 3] = p.x() - h[0]; disp[q * 3 + 1] = p.y() - h[1]; disp[q * 3 + 2] = p.z() - h[2];
    }
    for (const pt of parts) {
      const a = pt.g.attributes.position.array, { rest, cell, wt, n } = pt;
      for (let v = 0; v < n; v++) {
        let dx = 0, dy = 0, dz = 0;
        for (let c = 0; c < 4; c++) { const q = cell[v * 4 + c] * 3, w = wt[v * 4 + c]; dx += disp[q] * w; dy += disp[q + 1] * w; dz += disp[q + 2] * w; }
        a[v * 3] = rest[v * 3] + dx; a[v * 3 + 1] = rest[v * 3 + 1] + dy; a[v * 3 + 2] = rest[v * 3 + 2] + dz;
      }
      pt.g.attributes.position.needsUpdate = true; pt.g.computeVertexNormals();
    }
  }
  sync();

  // ---- état de la déchirure
  const st = { p: 0, hand: new THREE.Vector3(), torn: false, done: false, cut: NX - HAND, released: false, t: 0 };
  const corner = new THREE.Vector3(x1, y0 + H * 0.5, zc);
  const hv = new A.btVector3(0, 0, 0);
  // position de la main pour une progression p (0→1) et un décalage du doigt (dx, dy en unités du booster)
  function setHand(p, dx = 0, dy = 0) {
    st.p = Math.max(st.p, Math.min(1, p));
    // on tire vers la gauche, vers le haut et vers soi, comme un vrai geste d'ouverture
    st.hand.set(corner.x - st.p * W * 0.32 + dx * 0.25, corner.y + st.p * H * 2.2 + dy * 0.6 + Math.sin(st.p * Math.PI) * H * 0.6, corner.z + st.p * 0.35);
    // les points d'accroche lâchent de la droite vers la gauche
    const cutTo = Math.floor((NX - HAND) * (1 - st.p));
    let ripped = 0;
    while (st.cut > cutTo && st.cut > 0) { st.cut--; unpin(st.cut, 0); ripped++; }
    return ripped;
  }
  function step(dt) {
    if (st.done) return;
    if (!st.released) {
      // la colonne tenue suit la main, en gardant sa forme
      for (let i = NX - HAND; i < NX; i++) for (let j = 0; j < NY; j++) {
        const h = home[grid[j * NX + i]];
        hv.setValue(st.hand.x + (h[0] - x1) * 0.9, st.hand.y + (h[1] - corner.y), st.hand.z);
        at(i, j).set_m_x(hv);
      }
    }
    world.stepSimulation(Math.min(dt, 1 / 30), 10, 1 / 120);
    sync();
    if (st.released) { st.t += dt; const o = Math.max(0, 1 - (st.t - 1.1) / 0.7); mats.forEach(m => { if (m.uniforms && m.uniforms.uOp) m.uniforms.uOp.value = o; }); if (st.t > 2.2) dispose(); }
  }
  // arrachée : on lâche tout, la languette part avec l'élan du geste puis tombe
  function release() {
    if (st.released) return;
    st.released = true;
    for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) sb.setMass(grid[j * NX + i], mass);
    const v = new A.btVector3(0, 0, 0);
    for (let k = 0; k < N; k++) { const nd = nodes.at(k); v.setValue(1.4 + Math.random() * 0.3, 2.6, 1.6); nd.set_m_v(v); }
    A.destroy(v);
  }
  function dispose() {
    if (st.done) return; st.done = true;
    for (const pt of parts) { booster.remove(pt.mesh); pt.g.dispose(); }
    world.removeSoftBody(sb);
  }
  function reset() { dispose(); strip.visible = true; }
  return { st, setHand, step, release, dispose, reset, W, H, corner, zc };
}
