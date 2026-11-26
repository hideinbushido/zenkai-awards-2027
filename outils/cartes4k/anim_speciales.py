"""Animation en boucle (4 s, 24 i/s, 1080 x 1508) de chaque carte spéciale, à partir de la carte 4K finie.
Le cadre reste fixe ; seuls l'illustration et la lumière bougent, avec un effet propre à chaque spéciale."""
import os
from chemins import BASE, SOURCES, SORTIE_LOT
import json, os, sys, subprocess, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session

FW, FH, N = 1080, 1508, 96
yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32)
ses = new_session("isnet-anime")

def lisse(t): t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)
def ecran(a, b): return 1 - (1 - a) * (1 - b)

def zone_art():
    """Intérieur du cadre (là où l'illustration peut bouger), en dégradé doux."""
    m = np.zeros((FH, FW), np.float32); k = FW / 2400
    cv2.rectangle(m, (int(150 * k), int(150 * k)), (FW - int(150 * k), FH - int(150 * k)), 1.0, -1)
    return cv2.GaussianBlur(m, (0, 0), 6)
ZA = zone_art()

def bruit(seed, s=40):
    r = np.random.default_rng(seed).random((FH // 8 + 2, FW // 8 + 2)).astype(np.float32)
    return cv2.resize(cv2.GaussianBlur(r, (0, 0), s / 8), (FW, FH), interpolation=cv2.INTER_CUBIC)

def balayage(t, angle=0.6, largeur=90, force=0.35, couleur=(1, 1, 1)):
    d = xx * np.cos(angle) + yy * np.sin(angle)
    pos = -400 + (FW + FH + 800) * t
    b = np.exp(-((d - pos) / largeur) ** 2) * force
    return b[..., None] * np.array(couleur, np.float32)

def decaler(img, dx, dy):
    M = np.float32([[1, 0, dx], [0, 1, dy]]); return cv2.warpAffine(img, M, (FW, FH), borderMode=cv2.BORDER_REFLECT)

# ------------------------------------------------------------------ effets par spéciale (t de 0 à 1, boucle)
def genga(base, perso, t, i):
    # « line boil » du dessin animé : le trait tremble par paliers de 3 images, la feuille respire
    k = (i // 3) % 3; dx, dy = [(0, 0), (0.8, -0.5), (-0.6, 0.7)][k]
    img = base * (1 - ZA[..., None]) + decaler(base, dx, dy) * ZA[..., None]
    sombre = np.clip(1 - base.mean(2) * 1.4, 0, 1) * ZA
    av = decaler(sombre, -6 - 4 * np.sin(2 * np.pi * t), 3); ap = decaler(sombre, 6 + 4 * np.sin(2 * np.pi * t), -3)
    img = img * (1 - (av * 0.35)[..., None] * np.array([0, 0.75, 0.75])) * (1 - (ap * 0.35)[..., None] * np.array([0.75, 0.5, 0]))
    return ecran(img, balayage(t, 0.9, 120, 0.28) * ZA[..., None])

def sakuga(base, perso, t, i):
    # lignes de vitesse qui défilent derrière le personnage + petite secousse de caméra
    sh = 2.5 * np.sin(2 * np.pi * t * 6) * (lisse((t % 0.5) / 0.1) * (1 - lisse((t % 0.5 - 0.15) / 0.1)))
    img = base * (1 - ZA[..., None]) + decaler(base, sh, -sh * 0.6) * ZA[..., None]
    rng = np.random.default_rng(3); ang = rng.random(240) * 2 * np.pi; ph = rng.random(240)
    cx, cy = FW / 2, FH * 0.42; th = np.arctan2(yy - cy, xx - cx); rr = np.hypot(xx - cx, yy - cy)
    idx = ((th + np.pi) / (2 * np.pi) * 240).astype(int) % 240
    flux = (np.sin((rr / 60 - (t * 8 + ph[idx] * 6)) * np.pi) > 0.92) * (rr > 260) * (rng.random(240)[idx] > 0.55)
    lignes = cv2.GaussianBlur(flux.astype(np.float32), (0, 0), 1.2) * (1 - perso) * ZA
    return ecran(img, lignes[..., None] * 0.55)

def celluloid(base, perso, t, i):
    # le personnage sur acétate glisse légèrement devant le décor ; reflet de film qui passe
    dx = 6 * np.sin(2 * np.pi * t); fond = decaler(base, -dx * 0.4, 0); avant = decaler(base, dx, 0); pm = decaler(perso, dx, 0)
    art = fond * (1 - pm[..., None]) + avant * pm[..., None]
    img = base * (1 - ZA[..., None]) + art * ZA[..., None]
    reflet = balayage(t, 0.35, 160, 0.28, (0.95, 0.98, 1.0)) + balayage((t + 0.08) % 1, 0.35, 30, 0.25)
    return ecran(img, reflet * ZA[..., None])

def sumi(base, perso, t, i):
    # l'encre infuse : des auréoles d'encre naissent et s'étalent dans le fond, puis s'effacent
    img = base.copy(); acc = np.zeros((FH, FW), np.float32)
    for k, (x, y) in enumerate([(0.2, 0.25), (0.78, 0.35), (0.3, 0.7), (0.7, 0.62)]):
        u = (t + k / 4) % 1; r = 40 + 520 * lisse(u); a = (1 - lisse((u - 0.55) / 0.45)) * 0.35
        d = np.hypot(xx - x * FW, yy - y * FH)
        acc = np.maximum(acc, a * np.exp(-((d - r) / 30) ** 2) + a * 0.4 * (d < r))
    acc = acc * (1 - perso) * ZA * (0.6 + 0.4 * bruit(7))
    img = img * (1 - acc[..., None] * 0.6)
    return img

def hanga(base, perso, t, i):
    # estampe : décalage de repérage des couleurs qui respire, comme une impression sur bois
    d = 2.5 * np.sin(2 * np.pi * t)
    r = decaler(base[..., 0], d, 0); b = decaler(base[..., 2], -d, 0)
    art = np.dstack([r, base[..., 1], b])
    img = base * (1 - ZA[..., None]) + art * ZA[..., None]
    grain = (bruit(11 + (i // 4) % 4, 6) - 0.5) * 0.06
    return np.clip(img + (grain * ZA)[..., None] + balayage(t, 1.2, 100, 0.15) * ZA[..., None], 0, 1)

def reiatsu(base, perso, t, i):
    # aura de pression spirituelle qui monte et flamboie autour du personnage
    coul = base[perso > 0.6].mean(0) if (perso > 0.6).sum() > 100 else np.array([0.5, 0.7, 1.0])
    coul = np.clip(coul / max(coul.max(), 1e-3), 0.3, 1)
    bord = np.clip(cv2.GaussianBlur(perso, (0, 0), 18) - perso * 0.9, 0, 1)
    flamme = 0
    for k in range(2):
        n = bruit(20 + k, 30); M = np.float32([[1, 0, 0], [0, 1, -FH * ((t + k * 0.5) % 1)]])
        n = cv2.warpAffine(np.vstack([n, n]), M, (FW, FH)); flamme = flamme + n * 0.5
    aura = np.clip(bord * 2.2 * (0.5 + flamme) * (0.85 + 0.15 * np.sin(2 * np.pi * t * 2)), 0, 1) * ZA
    puls = (0.5 + 0.5 * np.sin(2 * np.pi * t * 2)) * 0.18 * ZA * (1 - perso)
    return ecran(base, (aura[..., None] + puls[..., None]) * np.clip(coul * 1.2, 0, 1) * 0.9)

def ekonte(base, perso, t, i):
    # la ligne de lecture du storyboard descend, la case active s'éclaire, le papier respire
    pos = FH * (0.08 + 0.84 * t)
    ligne = np.exp(-((yy - pos) / 3) ** 2) * 0.5 + np.exp(-((yy - pos) / 60) ** 2) * 0.12
    img = base * (0.97 + 0.03 * np.sin(2 * np.pi * t * 2))
    return ecran(img, (ligne * ZA)[..., None] * np.array([1.0, 0.95, 0.85]))

def arcenciel(t):
    return np.dstack([0.5 + 0.5 * np.cos(6.2832 * (t + o)) for o in (0, 0.33, 0.67)]).astype(np.float32)

RNG = np.random.default_rng(5); PX, PY, PV, PS = RNG.random(70), RNG.random(70), 0.5 + RNG.random(70), RNG.random(70)
def particules(t, couleur):
    c = np.zeros((FH, FW), np.float32)
    for x, y, v, s in zip(PX, PY, PV, PS):
        yy_ = ((y - t * v) % 1) * FH; a = np.sin(np.pi * ((y - t * v) % 1))
        cv2.circle(c, (int(x * FW), int(yy_)), 2 + int(s * 3), float(a), -1, cv2.LINE_AA)
    c = cv2.GaussianBlur(c, (0, 0), 1.5) + cv2.GaussianBlur(c, (0, 0), 6) * 1.5
    return np.clip(c * ZA, 0, 1)[..., None] * np.array(couleur, np.float32)

ZK = {"actif": False, "data": None}
def lumiere_zenkai(img, t):
    """Cadre ZENKAI : une comète de lumière dorée fait le tour de la fenêtre, l'or des fissures et des gravures pulse."""
    if ZK["data"] is None:
        import zk_cadre
        f0, f1 = zk_cadre._charger()
        f0 = cv2.resize(f0, (FW, FH), interpolation=cv2.INTER_AREA)
        k = FW / 2400; IN, RF = 124 * k, (118 - 40) * k
        fen = np.zeros((FH, FW), np.uint8)
        cv2.rectangle(fen, (int(IN + RF), int(IN)), (int(FW - IN - RF), int(FH - IN)), 1, -1); cv2.rectangle(fen, (int(IN), int(IN + RF)), (int(FW - IN), int(FH - IN - RF)), 1, -1)
        for cx, cy in [(IN + RF, IN + RF), (FW - IN - RF, IN + RF), (IN + RF, FH - IN - RF), (FW - IN - RF, FH - IN - RF)]: cv2.circle(fen, (int(cx), int(cy)), int(RF), 1, -1)
        bord = (cv2.dilate(fen, np.ones((5, 5), np.uint8)) - cv2.erode(fen, np.ones((3, 3), np.uint8))).astype(np.float32)
        ang = np.arctan2(yy - FH / 2, (xx - FW / 2) * FH / FW)
        bande = 1 - fen.astype(np.float32)
        orm = np.clip((f0[..., 0] - f0[..., 2] - 0.15) * 3, 0, 1) * np.clip((f0[..., 0] - 0.35) * 3, 0, 1) * bande
        ZK["data"] = (bord, ang, orm)
    bord, ang, orm = ZK["data"]
    if "petit" not in ZK:
        q = 4; ZK["petit"] = (cv2.resize(bord, (FW // q, FH // q), interpolation=cv2.INTER_AREA), cv2.resize(ang, (FW // q, FH // q), interpolation=cv2.INTER_NEAREST))
    pb, pa = ZK["petit"]
    lum = np.zeros_like(pb)
    for k, f in enumerate((1.0, 0.5)):
        a0 = -np.pi + 2 * np.pi * ((t + k * 0.5) % 1)
        da = (pa - a0 + np.pi) % (2 * np.pi) - np.pi
        queue = np.exp(-(np.clip(-da, 0, None) / 0.55)) * (da <= 0.02) + np.exp(-(da / 0.04) ** 2)
        c = np.clip(pb * queue * f, 0, 1)
        lum += cv2.GaussianBlur(c, (0, 0), 3) * 2.2 + cv2.GaussianBlur(c, (0, 0), 0.8) * 1.4 + c
    lum = cv2.resize(np.clip(lum, 0, 1), (FW, FH), interpolation=cv2.INTER_LINEAR)
    out = ecran(img, lum[..., None] * np.array([1.0, 0.82, 0.45], np.float32))
    puls = 0.5 + 0.5 * np.sin(2 * np.pi * t * 2)
    return ecran(out, (orm * (0.15 + 0.35 * puls))[..., None] * np.array([1.0, 0.8, 0.4], np.float32))

def commun(img, base, perso, t):
    """Le cadre holographique qui chatoie + une poussière lumineuse qui monte."""
    if ZK["actif"]: img = lumiere_zenkai(img, t)
    d = (xx * 0.8 + yy) / (FW + FH)
    holo = arcenciel(d * 2 - t) * np.exp(-((d - (t * 1.4 - 0.2)) / 0.12) ** 2)[..., None]
    img = ecran(img, holo * (1 - ZA[..., None]) * 0.55)
    img = ecran(img, balayage(t, 0.75, 70, 0.18) * (1 - ZA[..., None]))
    coul = base[perso > 0.6].mean(0) if (perso > 0.6).sum() > 200 else np.array([0.9, 0.85, 1.0])
    coul = np.clip(coul / max(coul.max(), 1e-3) * 1.1, 0.35, 1)
    return ecran(img, particules(t, coul) * 0.9)

EFFETS = dict(genga=genga, sakuga=sakuga, celluloid=celluloid, sumi=sumi, hanga=hanga, reiatsu=reiatsu, ekonte=ekonte)

def reiatsu_zenkai(base, perso, t, i):
    """Libération : les flammes d'aura montent du bas et des bords, une onde de pression part du centre
    toutes les 2 s (l'image ondule, flash de lumière, petite secousse), les braises s'envolent."""
    global RZ
    if RZ is None or RZ[0] is not base:
        rng = np.random.default_rng(4)
        def champ(sx, sy):
            n = cv2.GaussianBlur(rng.standard_normal((FH * 2, FW)).astype(np.float32), (0, 0), sigmaX=sx, sigmaY=sy)
            n = (n - n.min()) / (n.max() - n.min()); n[FH:] = n[:FH]; return n       # tuile verticale pour boucler
        p = perso > 0.6
        c = base[p].mean(0) if p.sum() > 200 else base.reshape(-1, 3).mean(0)
        c = np.clip((c - c.min()) / max(np.ptp(c), 1e-3), 0.12, 1)
        nx, ny = (xx - FW / 2) / (FW / 2), (yy - FH * 0.45) / (FH * 0.55)
        bord = np.clip(np.hypot(nx * 0.95, ny * 0.8) - 0.55, 0, 1) / 0.45
        zone = np.clip(lisse((yy / FH - 0.45) / 0.55) * 0.9 + lisse((bord - 0.2) / 0.8) * 0.7, 0, 1)
        txt = cv2.GaussianBlur(((yy > FH * 0.73) & (yy < FH * 0.95)).astype(np.float32), (0, 0), 18) * ZA
        RZ = (base, champ(8, 34), champ(3, 13), c, zone, txt)
    _, n1, n2, c, zone, txt = RZ
    vive = np.clip(c * 1.35, 0, 1)
    # onde de pression (deux par boucle)
    u = (t * 2) % 1; cx, cy = FW / 2, FH * 0.42
    rr = np.hypot(xx - cx, (yy - cy) * 1.1); front = u * 1500
    env = np.exp(-((rr - front) / 70) ** 2) * (1 - u) ** 1.5
    dep = env * 14
    ux, uy = (xx - cx) / (rr + 1), (yy - cy) / (rr + 1)
    sh = 5 * np.exp(-u * 18) * np.sin(i * 2.3)
    img = cv2.remap(base, (xx - ux * dep + sh).astype(np.float32), (yy - uy * dep + sh * 0.6).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    wz = (ZA * (1 - txt))[..., None]; img = base * (1 - wz) + img * wz
    img = img * (1 + np.float32(0.12 * np.exp(-u * 10)) * wz)                          # flash au départ de l'onde
    img = ecran(img, vive * (env * ZA * 0.35)[..., None])
    # flammes qui montent (deux couches de bruit qui défilent vers le haut)
    o1 = int(FH * t) % FH; o2 = int(FH * 2 * t) % FH
    f = n1[o1:o1 + FH] * 1.1 * (0.7 + 0.6 * n2[o2:o2 + FH])
    fl = np.clip(zone * (0.3 + f) - 0.45, 0, 1) / 0.55 * ZA * (1 - txt * 0.9)
    coulfl = np.stack([np.interp(fl, [0, 0.35, 0.7, 1], [0, c[k] * 0.35, vive[k], 1.0]) for k in range(3)], -1)
    return ecran(img, coulfl * 0.75)
RZ = None
EFFETS["reiatsu_zenkai"] = reiatsu_zenkai

def animer(carte, special, sortie):
    im = Image.open(carte).convert("RGB").resize((FW, FH), Image.LANCZOS)
    base = np.asarray(im).astype(np.float32) / 255
    perso = np.asarray(remove(im, session=ses, only_mask=True).convert("L")).astype(np.float32) / 255
    perso = np.clip((perso - 0.25) / 0.6, 0, 1) * ZA
    ZK["actif"] = "_ZENKAI" in os.path.basename(carte) or "/rz_" in carte
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{FW}x{FH}", "-r", "24", "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", sortie], stdin=subprocess.PIPE)
    f = EFFETS[special] if special in EFFETS else EFFETS[special.split(':')[0]]
    for i in range(N):
        p.stdin.write((np.clip(commun(f(base, perso, i / N, i), base, perso, i / N), 0, 1) * 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()

if __name__ == "__main__":
    man = json.load(open(os.path.join(BASE, "manifeste.json")))
    filtre = set(sys.argv[1:])
    for e in man:
        if not e["special"] or (filtre and e["special"] not in filtre and e["fichier"] not in filtre): continue
        c = f"{SORTIE_LOT}/{e['dossier']}/{e['fichier']}"
        if not os.path.exists(c): continue
        s = c[:-4] + ".mp4"
        if os.path.exists(s): continue
        animer(c, "reiatsu_zenkai" if (e["special"] == "reiatsu" and e["rarete"] == "zenkai") else e["special"], s); print("anim", e["fichier"], flush=True)
