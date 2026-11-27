import os, json
from chemins import BASE, SOURCES, SORTIE_LOT
"""Animations dédiées : les 3 SAKUGA (essai de trait / images de choc / caméra 2.5D) et la GENGA SPECTRE (le dessin se trace).
Habillage linéaire : carte = contenu * A + B (A, B calculés une fois en 4K)."""
import json, os, sys, numpy as np, cv2, subprocess
import carte4k as C, speciales as S1, speciales2 as S2, lot
import anim_speciales as AS
from speciales2 import couleur_perso, arriere_plan, papier

FW, FH = 1080, 1508; W, H = C.W, C.H
yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32)
def petit(a): return cv2.resize(a, (FW, FH), interpolation=cv2.INTER_AREA)
def lis(t): t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)

def capture(fonction, art, r):
    """Contenu de la fenêtre (avant habillage) + (A, B) de l'habillage réel."""
    pris = {}
    vrais = (S1.habiller, S2.habiller)
    def faux(rr, img, *a, **k): pris.update(rr=rr, img=img, a=a, k=k); return img
    S1.habiller = S2.habiller = faux
    try: fonction(art, r)
    finally: S1.habiller, S2.habiller = vrais
    noir = vrais[0](pris["rr"], np.zeros((H, W, 3), np.float32), *pris["a"], **pris["k"])
    blanc = vrais[0](pris["rr"], np.ones((H, W, 3), np.float32), *pris["a"], **pris["k"])
    co = C.coins()[..., None]
    return pris["img"], petit((blanc - noir) * co), petit(noir * co)

def ecrire(frames, sortie, base, perso, zenkai=False, N=None):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{FW}x{FH}", "-r", "24", "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", sortie], stdin=subprocess.PIPE)
    AS.ZK["actif"] = zenkai
    for i, f in enumerate(frames):
        f = AS.commun(np.clip(f.astype(np.float32), 0, 1), base, perso, i / (N or len(frames)))
        p.stdin.write((np.clip(f, 0, 1) * 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()

def trait(img, graine, k=27):
    r = np.random.default_rng(graine)
    n = cv2.GaussianBlur(r.standard_normal((FH, FW)).astype(np.float32), (0, 0), 6) * 5
    n2 = cv2.GaussianBlur(r.standard_normal((FH, FW)).astype(np.float32), (0, 0), 6) * 5
    im = cv2.remap(img, xx + n, yy + n2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    g = im[..., 0] * 0.3 + im[..., 1] * 0.59 + im[..., 2] * 0.11
    a = cv2.GaussianBlur(g, (0, 0), 0.8); b = cv2.GaussianBlur(g, (0, 0), 1.3)
    d = k * a - (k - 1) * b
    return np.where(d >= -0.012, 1.0, 1 + np.tanh(14 * (d + 0.012))).astype(np.float32)

# ------------------------------------------------------------ SPECTRE : essai de trait
def sakuga_spectre(art, A, B):
    rgb, perso = petit(art.rgb), petit(art.perso)
    pap = petit(papier((246, 244, 238), 0.025, 0.03, 4))
    def pose(q):
        if q < 0.25: return -0.25 * lis(q / 0.25)
        if q < 0.4: return -0.25 + 1.35 * lis((q - 0.25) / 0.15)
        if q < 0.5: return 1.1 - 0.1 * lis((q - 0.4) / 0.1)
        return 1.0 - lis((q - 0.5) / 0.5)
    def deplace(img, u):
        M = np.float32([[1 + 0.06 * u, 0, -FW * 0.03 * u + 60 * u], [0, 1 + 0.06 * u, -FH * 0.03 * u - 20 * u]])
        return cv2.warpAffine(img, M, (FW, FH), borderMode=cv2.BORDER_REFLECT)
    N = 96; frames = []
    for i in range(N):
        q = (i // 2 * 2) / N
        u = pose(q); u0 = pose(max(0, q - 6 / N)); u1 = pose(min(1, q + 6 / N))
        cur = deplace(rgb, u); t = trait(cur, i // 2 % 3)
        av = trait(deplace(rgb, u0), 7); ap = trait(deplace(rgb, u1), 9)
        img = pap.copy()
        img = img * (1 - ((1 - av) * 0.45)[..., None]) + np.array([0.86, 0.2, 0.2]) * ((1 - av) * 0.45)[..., None]
        img = img * (1 - ((1 - ap) * 0.45)[..., None]) + np.array([0.2, 0.42, 0.86]) * ((1 - ap) * 0.45)[..., None]
        coul = np.exp(-((q - 0.42) / 0.06) ** 2); pm = deplace(perso, u)
        img = img * (1 - (pm * coul * 0.85)[..., None]) + cur * (pm * coul * 0.85)[..., None]
        img = img * (1 - ((1 - t) * 0.9)[..., None]) + np.array([0.18, 0.18, 0.2]) * ((1 - t) * 0.9)[..., None]
        frames.append((img * A + B).astype(np.float16))
    return frames

# ------------------------------------------------------------ MIRAGE : images de choc
def sakuga_mirage(art, A, B):
    rgb = petit(art.rgb)
    g = rgb[..., 0] * 0.3 + rgb[..., 1] * 0.59 + rgb[..., 2] * 0.11
    neg = 1 - g; neg = np.dstack([np.where(neg > 0.55, 1.0, np.where(neg > 0.3, 0.45, 0.0)).astype(np.float32)] * 3)
    coul = couleur_perso(art)
    a_ = cv2.GaussianBlur(g, (0, 0), 0.8); b_ = cv2.GaussianBlur(g, (0, 0), 1.3); tr = np.where(31 * a_ - 30 * b_ >= -0.012, 1.0, 0.0).astype(np.float32)
    neon = np.where((g > 0.45)[..., None], np.clip(coul * 1.3 + 0.2, 0, 1), np.array([0.05, 0.02, 0.1])).astype(np.float32)
    neon = neon * tr[..., None] + (1 - tr[..., None])
    rafale = ["neg", "neon", "neg", "norm", "neon", "neg", "neon"]
    N = 96; frames = []
    for i in range(N):
        c = (i / 24) % 2.0; img = rgb
        if 1.2 <= c < 1.2 + len(rafale) * 2 / 24:
            k = int((c - 1.2) * 12); img = {"neg": neg, "neon": neon, "norm": rgb}[rafale[min(k, len(rafale) - 1)]]
            z = 1.08 - 0.05 * (c - 1.2) / 0.6; sh = (np.random.default_rng(i).random(2) - 0.5) * 30
            M = cv2.getRotationMatrix2D((FW / 2, FH * 0.42), (np.random.default_rng(i + 5).random() - 0.5) * 2, z); M[:, 2] += sh
            img = cv2.warpAffine(img, M, (FW, FH), borderMode=cv2.BORDER_REFLECT)
        elif c >= 1.2 + len(rafale) * 2 / 24:
            t = (c - 1.2 - len(rafale) * 2 / 24) / 0.25
            if t < 1: img = rgb + (1 - t) * 0.35
        frames.append((img * A + B).astype(np.float16))
    return frames

def sakuga_mirage_remanence(art, A, B, fenetre):
    """4 s : deux élans. Les rémanences surgissent loin derrière et rattrapent le personnage en un
    éclair (le smear), petit tremblement à l'arrivée ; les traits d'action défilent en continu."""
    rgb = petit(art.rgb); pm = petit(art.perso); coul = couleur_perso(art)
    if pm.mean() < 0.03:             # même repli que la carte fixe : zone centrale gardée nette
        el = ((xx - FW * 0.5) / (FW * 0.46)) ** 2 + ((yy - FH * 0.46) / (FH * 0.44)) ** 2
        pm = np.clip((1.15 - el) / 0.5, 0, 1).astype(np.float32)
    base = petit(fenetre)
    ang = np.deg2rad(-28); dx, dy = np.cos(ang), np.sin(ang)
    S = FW / 2400
    r = np.random.default_rng(12); proj = (xx * -dy + yy * dx)
    N = 96; frames = []
    for i in range(N):
        s = (i / 24) % 2.0
        u = 0.0 if s < 0.35 else min(1.0, (s - 0.35) / 0.4)          # 0 = loin, 1 = rattrapé
        el = (1 - u) ** 2 if 0.35 <= s < 0.75 else 0.0
        f = base.copy()
        if el > 0:
            for dist, a in ((330, 0.4), (220, 0.55), (110, 0.7)):
                d = dist * S * (0.4 + 2.2 * el)
                M = np.float32([[1, 0, -dx * d], [0, 1, -dy * d]])
                g = cv2.warpAffine(rgb, M, (FW, FH), borderMode=cv2.BORDER_REFLECT)
                gm = cv2.warpAffine(pm, M, (FW, FH)) * (1 - pm)
                t = np.clip(g * 0.45 + coul * 0.75, 0, 1)
                f = f * (1 - (gm * a * el)[..., None]) + t * (gm * a * el)[..., None]
        if 0.75 <= s < 0.95:                                              # tremblement à l'arrivée
            k = (np.random.default_rng(i).random(2) - 0.5) * 10 * S * (0.95 - s) / 0.2
            f = cv2.warpAffine(f, np.float32([[1, 0, k[0]], [0, 1, k[1]]]), (FW, FH), borderMode=cv2.BORDER_REFLECT)
        decal = (i * 0.012) % 1.0                                          # traits d'action qui défilent
        bande = r.random(900); idx = (((proj - proj.min()) / (proj.max() - proj.min()) + decal) % 1.0 * 899).astype(int)
        lignes = (bande[idx] > 0.965).astype(np.float32) * (1 - pm) * 0.35
        f = 1 - (1 - f) * (1 - lignes[..., None])
        frames.append((f * A + B).astype(np.float16))
    return frames

# ------------------------------------------------------------ ZENKAI : caméra 2.5D
def sakuga_zenkai(art, A, B):
    art.perso = np.maximum(art.perso, C.flou(art.large, 2))
    rgb, perso = petit(art.rgb), petit(art.perso)
    decor = arriere_plan(art, rgb, perso)
    m = cv2.moments(perso); cx, cy = (m["m10"] / m["m00"], m["m01"] / m["m00"]) if m["m00"] else (FW / 2, FH / 2)
    rr = np.hypot(xx - cx, yy - cy); th = np.arctan2(yy - cy, xx - cx)
    r700 = np.random.default_rng(4).random(700); idx = ((((th + np.pi) / (2 * np.pi)) * 700).astype(int)) % 700
    bord = np.clip(cv2.GaussianBlur(perso, (0, 0), 2) - perso * 0.85, 0, 1) * 1.6
    parts = np.random.default_rng(2).random((160, 3)).astype(np.float32)
    N = 96; frames = []
    for i in range(N):
        s = i / 24; p = i / N
        frappe = np.exp(-((s % 2.0) - 1.0) ** 2 / 0.004)
        zd = 1.02 + 0.03 * np.sin(p * 2 * np.pi) + 0.03 * frappe; zp = 1.0 + 0.06 * np.sin(p * 2 * np.pi) + 0.08 * frappe
        Mp = cv2.getRotationMatrix2D((cx, cy), 0, zp); Mp[0, 2] -= 10 * np.sin(p * 2 * np.pi)
        acc = np.zeros_like(decor)
        for k in range(6):
            M2 = cv2.getRotationMatrix2D((cx, cy), 0, zd + k * (0.006 + 0.01 * frappe)); M2[0, 2] += 18 * np.sin(p * 2 * np.pi)
            acc += cv2.warpAffine(decor, M2, (FW, FH), borderMode=cv2.BORDER_REFLECT)
        d = acc / 6 * 0.8
        lignes = (r700[idx] > 0.7) * lis((rr - 260 + 120 * ((p * 3) % 1)) / 300) * (0.6 + 0.6 * frappe)
        d = 1 - (1 - d) * (1 - np.array([1.0, 0.85, 0.5]) * (lignes * 0.45)[..., None])
        lum = np.zeros((FH, FW), np.float32)
        for (px, sp, ph) in parts:
            age = (p * (1 + sp) + ph) % 1
            x = int(FW * px + np.sin(ph * 20 + p * 6) * 12); y = int(FH * (1.05 - age * 1.1))
            if 0 <= x < FW and 0 <= y < FH: cv2.ellipse(lum, (x, y), (2, 6), 0, 0, 360, float(1 - age * 0.6), -1)
        d = 1 - (1 - d) * (1 - np.array([1.0, 0.82, 0.4]) * np.clip(cv2.GaussianBlur(lum, (0, 0), 1.5) * 2, 0, 1)[..., None])
        pr = cv2.warpAffine(rgb, Mp, (FW, FH), borderMode=cv2.BORDER_REFLECT); pm = cv2.warpAffine(perso, Mp, (FW, FH)); pb = cv2.warpAffine(bord, Mp, (FW, FH))
        om = cv2.GaussianBlur(pm, (0, 0), 9) * 0.5
        img = d * (1 - om[..., None]); img = img * (1 - pm[..., None]) + pr * pm[..., None]
        img = 1 - (1 - img) * (1 - np.array([1.0, 0.86, 0.5]) * np.clip(pb * (0.8 + 0.8 * frappe), 0, 1)[..., None])
        frames.append((img * A + B).astype(np.float16))
    return frames

# ------------------------------------------------------------ GENGA SPECTRE : le dessin se trace, se colore, s'efface
def genga_spectre(art, A, B, contenu_plein, contenu_trait):
    plein, tr = petit(contenu_plein), petit(contenu_trait)
    pap = petit(papier((246, 244, 238), 0.025, 0.03, 4))
    rng = np.random.default_rng(3)
    bruit = cv2.GaussianBlur(rng.random((FH // 4, FW // 4)).astype(np.float32), (0, 0), 6)
    bruit = cv2.resize((bruit - bruit.min()) / (bruit.max() - bruit.min()), (FW, FH))
    ordre = np.clip(0.55 * (yy / FH) + 0.25 * (xx / FW) + 0.35 * bruit, 0, None); ordre = (ordre - ordre.min()) / (ordre.max() - ordre.min())
    N = 96; frames = []
    for i in range(N):
        t = i / N
        p = lis(t / 0.42)                                      # 0 à 1,7 s : le crayon trace
        front = np.exp(-((ordre - p * 1.05) / 0.015) ** 2) * (p < 1)
        rev = lis((p * 1.05 - ordre) / 0.02)
        lav = lis((t - 0.42) / 0.2)                            # 1,7 à 2,5 s : la couleur arrive
        eff = lis((t - 0.86) / 0.12)                           # 3,4 à 4 s : la feuille se vide
        jitter = (i // 2) % 3
        dx = [0, 0.7, -0.6][jitter]; dy = [0, -0.5, 0.6][jitter]
        trc = cv2.warpAffine(tr, np.float32([[1, 0, dx], [0, 1, dy]]), (FW, FH), borderMode=cv2.BORDER_REFLECT)
        img = pap * (1 - rev[..., None]) + trc * rev[..., None]
        img = img * (1 - lav) + (pap * (1 - rev[..., None]) + plein * rev[..., None]) * lav
        img = 1 - (1 - img) * (1 - np.array([0.25, 0.25, 0.3]) * np.clip(cv2.GaussianBlur(front, (0, 0), 3) * 0.8, 0, 1)[..., None])
        img = img * (1 - eff) + pap * eff
        frames.append((img * A + B).astype(np.float16))
    return frames

# ------------------------------------------------------------ EKONTE : les animations prévues, appliquées à chaque carte
def carte_de(fn, art, r, **kw):
    im = C.finir(fn(art, r, **kw)) if kw else C.finir(fn(art, r))
    return petit(np.asarray(im.convert("RGB")).astype(np.float32) / 255)

def ekonte_spectre(A, B):
    """6 s : les 3 cases brillent à tour de rôle, s'assemblent en l'image complète, puis se redécoupent."""
    S = FW / 2400
    cases = np.array([(250, 420 + k * 710, 1700, 640) for k in range(3)], np.float32) * S
    grand = np.array([250, 420, 1700, 2050], np.float32) * S
    N = 144
    for i in range(N):
        s = i / 24.0
        u = 0.0 if s < 2.4 else lis((s - 2.4) / 0.8) if s < 3.2 else 1.0 if s < 5.0 else 1 - lis((s - 5.0) / 0.8) if s < 5.8 else 0.0
        f = A.copy()
        if u > 0:
            rects = [c * (1 - u) + grand * u for c in cases]
            masq = np.zeros((FH, FW), np.float32)
            for (x, y, w, h) in rects: masq[int(y):int(y + h), int(x):int(x + w)] = 1
            if u < 1:
                f = A * (1 - masq[..., None] * u) + (B * u + A * (1 - u)) * (masq[..., None] * u)
                for (x, y, w, h) in rects: cv2.rectangle(f, (int(x), int(y)), (int(x + w), int(y + h)), (0.08, 0.07, 0.06), 3)
            else: f = B.copy()
        if s < 2.4:
            k = int(s / 0.8); t = (s - k * 0.8) / 0.8
            for j, (x, y, w, h) in enumerate(cases.astype(int)):
                reg = f[y:y + h, x:x + w]
                if j != k: reg *= 0.68
                else:
                    pos = t * (w + 300) - 150
                    reg += (np.exp(-((xx[y:y + h, x:x + w] - x - pos) / 60) ** 2) * 0.4)[..., None] * np.array([1.0, 0.98, 0.9])
                    cv2.rectangle(f, (x - 4, y - 4), (x + w + 4, y + h + 4), (0.86, 0.16, 0.14), 3)
        elif 3.2 <= s < 5.0:
            t = (s - 3.2) / 1.8; x, y, w, h = grand.astype(int); pos = t * (w + h + 400) - 200
            f[y:y + h, x:x + w] += (np.exp(-(((xx[y:y + h, x:x + w] - x) + (yy[y:y + h, x:x + w] - y) * 0.6 - pos) / 90) ** 2) * 0.3)[..., None] * np.array([1.0, 0.98, 0.9])
        yield f

def ekonte_mirage(A, B):
    """5 s : le storyboard se change en image finale derrière une frontière d'air chaud irisée, puis revient."""
    diag = (xx / FW) * 0.55 + (yy / FH) * 0.75
    N = 120
    for i in range(N):
        s = i / 24.0; ph = i / N
        u = 0 if s < 0.6 else lis((s - 0.6) / 1.6) if s < 2.2 else 1 if s < 3.2 else 1 - lis((s - 3.2) / 1.4) if s < 4.6 else 0
        seuil = 1.45 - u * 1.6
        onde = 0.035 * np.sin(yy / FH * 26 + ph * 6.283 * 2) + 0.02 * np.sin(xx / FW * 17 - ph * 6.283 * 3)
        d = diag + onde - seuil
        m = np.clip((d + 0.03) / 0.06, 0, 1); m = m * m * (3 - 2 * m)
        pres = np.exp(-(d / 0.06) ** 2) * (yy < 0.78 * FH)
        mx = (xx + np.sin(yy * 0.11 + ph * 40) * 4 * pres).astype(np.float32); my = (yy + np.cos(xx * 0.09 + ph * 30) * 3 * pres).astype(np.float32)
        a = cv2.remap(A, mx, my, cv2.INTER_LINEAR); b = cv2.remap(B, mx, my, cv2.INTER_LINEAR)
        f = a * (1 - m[..., None]) + b * m[..., None]
        lisr = np.exp(-(d / 0.006) ** 2)
        teinte = np.dstack([0.5 + 0.5 * np.cos(6.283 * (diag * 3 + ph + o)) for o in (0, 0.33, 0.67)]) * 0.8 + 0.45
        f = 1 - (1 - f) * (1 - np.clip(teinte, 0, 1) * lisr[..., None] * 0.9)
        yield 1 - (1 - f) * (1 - np.array([1.0, 0.95, 0.9]) * (cv2.GaussianBlur(lisr, (0, 0), 5) * 0.5)[..., None])

def ekonte_zenkai(base):
    """4 s : le croquis se trace de haut en bas au feutre (lueur de la pointe), puis la carte respire."""
    S = FW / 2400
    trait = (base.mean(2) < 0.18).astype(np.float32)
    fen = ((xx > 265 * S) & (xx < (2400 - 265) * S) & (yy > 335 * S) & (yy < 2555 * S)).astype(np.float32); trait *= fen
    fond = base.copy(); fond[trait > 0] = cv2.inpaint((base * 255).astype(np.uint8), (trait * 255).astype(np.uint8), 3, cv2.INPAINT_TELEA)[trait > 0] / 255
    bruit = cv2.GaussianBlur(np.random.default_rng(2).random((FH, FW)).astype(np.float32), (0, 0), 30); bruit = (bruit - bruit.min()) / (bruit.max() - bruit.min())
    ordre = np.clip(yy / FH * 0.8 + bruit * 0.2, 0, 1)
    for i in range(96):
        t = i / 96; trace = lis((t - 0.02) / 0.55)
        vis = lis((trace * 1.1 - ordre) / 0.05)
        if t > 0.9: vis = vis * (1 - lis((t - 0.9) / 0.1)) + lis((t - 0.9) / 0.1)
        f = fond * (1 - vis[..., None]) + base * vis[..., None]
        front = np.exp(-((ordre - trace * 1.1) / 0.012) ** 2) * (trace < 1) * trait
        yield 1 - (1 - f) * (1 - front[..., None] * np.array([1.0, 0.85, 0.6]) * 0.8)

def faire_ekonte(e):
    art = lot.preparer(lot.source(e), e.get("dezoom", 1.0))
    sans = str.maketrans("ŌōŪūĀāĒēĪī", "OoUuAaEeIi")
    C.INFOS.update(nom=e["nom"].translate(sans).upper(), anime=e["anime"].upper(), type=e["type"], num=f"{e['num']:03d}", total=f"{e['total']:03d}", droits=e["credit"].translate(sans))
    r = e["rarete"]; sortie = f"{SORTIE_LOT}/{e['dossier']}/{e['fichier'][:-4]}.mp4"
    perso = petit(art.perso)
    if r == "spectre":
        A = carte_de(S1.ekonte_planches, art, r); B = carte_de(S1.ekonte_complet, art, r)
        ecrire(ekonte_spectre(A, B), sortie, B, perso, N=144)
    elif r == "mirage":
        A = carte_de(S1.ekonte_mirage, art, r, seuil=2.5); B = carte_de(S1.ekonte_mirage, art, r, seuil=-1.5)
        ecrire(ekonte_mirage(A, B), sortie, B, perso, N=120)
    else:
        base = carte_de(S1.ekonte_croquis, art, r)
        ecrire(ekonte_zenkai(base), sortie, base, perso, zenkai=True, N=96)
    print("anim", e["fichier"], flush=True)

def faire(e):
    art = lot.preparer(lot.source(e), e.get("dezoom", 1.0))
    sans = str.maketrans("ŌōŪūĀāĒēĪī", "OoUuAaEeIi")
    C.INFOS.update(nom=e["nom"].translate(sans).upper(), anime=e["anime"].upper(), type=e["type"], num=f"{e['num']:03d}", total=f"{e['total']:03d}", droits=e["credit"].translate(sans))
    r = e["rarete"]; fn = lot.VARIANTES[e["special"]][r]
    sortie = f"{SORTIE_LOT}/{e['dossier']}/{e['fichier'][:-4]}.mp4"
    base = np.asarray(__import__("PIL.Image", fromlist=["Image"]).open(f"{SORTIE_LOT}/{e['dossier']}/{e['fichier']}").convert("RGB").resize((FW, FH))).astype(np.float32) / 255
    perso = petit(art.perso)
    if e["special"] == "genga":
        S1.GENGA_LAVIS = True; plein, A, B = capture(fn, art, r)
        S1.GENGA_LAVIS = False; trait_seul, _, _ = capture(fn, art, r); S1.GENGA_LAVIS = True
        frames = genga_spectre(art, A, B, plein, trait_seul)
    else:
        fenetre, A, B = capture(fn, art, r)
        if r == "mirage": frames = sakuga_mirage_remanence(art, A, B, fenetre)
        else: frames = {"spectre": sakuga_spectre, "zenkai": sakuga_zenkai}[r](art, A, B)
    ecrire(frames, sortie, base, perso, zenkai=(r == "zenkai"))
    print("anim", e["fichier"], flush=True)

if __name__ == "__main__":
    man = json.load(open(os.path.join(BASE, "manifeste.json")))
    for e in man:
        if e["nom"] == "Inconnu": continue
        c = f"{SORTIE_LOT}/{e['dossier']}/{e['fichier']}"
        if not os.path.exists(c) or os.path.exists(c[:-4] + ".mp4"): continue   # seulement les cartes du lot sans vidéo
        if sys.argv[1:] and e["fichier"] not in sys.argv[1:] and sys.argv[1] != "ekonte": continue
        if e.get("special") == "ekonte" and (not sys.argv[1:] or sys.argv[1] == "ekonte" or e["fichier"] in sys.argv[1:]):
            faire_ekonte(e)
        elif sys.argv[1:2] != ["ekonte"] and (e.get("special") == "sakuga" or (e.get("special") == "genga" and e["rarete"] == "spectre")):
            faire(e)
