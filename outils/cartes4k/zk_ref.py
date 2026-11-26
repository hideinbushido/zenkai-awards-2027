"""Cadres ZENKAI d'après les références : MARBRE (marbre noir + kintsugi d'or holo) et AUBE (bronze sombre gravé + éclat de lumière).
python3 zk_ref.py [MARBRE AUBE]"""
import sys, numpy as np, cv2, skia
from PIL import Image
from carte4k import *          # noqa
from hybride import infos, embleme

IN = 124            # largeur de la bordure (px sur 2400)
RF = R - 40        # rayon de la fenêtre

def bruit_oct(graine, echelles=(220, 90, 36, 14), poids=(1, 0.5, 0.25, 0.12)):
    rng = np.random.default_rng(graine); n = np.zeros((H, W), np.float32)
    for s, p in zip(echelles, poids):
        b = cv2.resize(rng.standard_normal((H // 8 + 2, W // 8 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
        n += p * flou(b, s / 8)
    return (n - n.mean()) / (n.std() + 1e-6)

def or_holo(m, r=3, f=12, iris=0.45, t=0.0):
    d, sp = relief(m, r, f); base = or_metal(d, sp, brosse(50, 5))
    teinte = (XX * 0.7 + YY) / (W + H) * 3 + d * 0.6 + t
    return np.clip(ecran(base, arcenciel(teinte, 1.0, 0.6) * iris * (d ** 1.6)[..., None] * 1.25), 0, 1)

def trace(pts, w):
    def d(c, p):
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(w); p.setStrokeCap(skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join)
        path = skia.Path(); path.moveTo(*pts[0])
        for q in pts[1:]: path.lineTo(*q)
        c.drawPath(path, p)
    return masque(d)

BANDE = masque(lambda c, p: c.drawDRRect(rrect(0, R), rrect(IN, RF), p))
FENETRE = masque(lambda c, p: c.drawRRect(rrect(IN, RF), p))

# ================================================================== MARBRE NOIR & KINTSUGI
def fissure(rng, x, y, ang, long, w, prof=0):
    """Fissure en zigzag avec ramifications (coordonnées px)."""
    pts = [(x, y)]; ms = []
    for k in range(int(long / 26)):
        ang += rng.normal(0, 0.16); x += np.cos(ang) * 26; y += np.sin(ang) * 26; pts.append((x, y))
        if prof < 1 and rng.random() < 0.08:
            ms += fissure(rng, x, y, ang + rng.choice([-1, 1]) * rng.uniform(0.5, 1.1), long * rng.uniform(0.25, 0.45), w * 0.55, prof + 1)
    return [(pts, w)] + ms

def marbre(img):
    n1, n2 = bruit_oct(3, (700, 350, 170, 90), (1, 0.5, 0.2, 0.06)), bruit_oct(8, (800, 400, 200, 100), (1, 0.5, 0.2, 0.06))
    nA = bruit_oct(13, (1200, 600, 260, 120), (1, 0.45, 0.15, 0.05)); nB = bruit_oct(17, (900, 420, 200, 90), (1, 0.45, 0.15, 0.05))
    v = np.abs(nA + 0.25 * np.sin(XX / 300 + YY / 500)); v2 = np.abs(nB - 0.4)
    veines = (1 - np.clip(v / 0.045, 0, 1)) ** 1.4 * 0.9 + (1 - np.clip(v / 0.3, 0, 1)) * 0.12 + (1 - np.clip(v2 / 0.03, 0, 1)) ** 1.4 * 0.5
    nuage = np.clip(0.45 + 0.12 * n2, 0, 1)
    d, sp = relief(BANDE, 22, 5, brillance=18)
    base = palette(nuage * 0.55 + veines * 0.95, [(0, (4, 4, 6)), (0.4, (14, 13, 16)), (0.7, (60, 58, 64)), (1, (190, 188, 196))])
    poli = np.clip(((XX - YY * 0.7) / (W + H) * 3) % 1.0, 0, 1); poli = np.exp(-((poli - 0.5) / 0.08) ** 2) * 0.10
    teinte = arcenciel((XX + YY) / (W + H) * 2.5 + n2 * 0.3, 0.9, 0.5)
    mat = base * (0.65 + 0.5 * d[..., None]) + sp[..., None] * 0.35 + poli[..., None] + teinte * (sp * 0.25 + veines * 0.06)[..., None]
    img = img * (1 - flou(BANDE, 30)[..., None] * 0.35)                     # ombre portée dans la fenêtre
    img = melange(img, np.clip(mat, 0, 1), BANDE)
    # kintsugi : fissures d'or qui traversent l'angle haut-droit et l'angle bas-gauche
    rng = np.random.default_rng(21); fis = np.zeros((H, W), np.float32)
    for (x, y, a, L, w) in [(W - 760, -10, 0.62, 1000, 11), (W + 10, 560, 2.6, 520, 8), (W - 300, -10, 1.15, 320, 6),
                            (-10, H - 760, -0.62, 1000, 11), (560, H + 10, -2.3, 520, 8), (-10, H - 300, -0.35, 320, 6)]:
        for pts, ww in fissure(rng, x, y, a, L, w): fis = np.maximum(fis, trace(pts, ww))
    zone = np.clip(BANDE + flou(BANDE, 40) * 0.0, 0, 1)
    fis_b = fis * np.clip(BANDE + FENETRE * (1 - lisse(np.minimum.reduce([XX, YY, W - XX, H - YY]), 140, 190)) * 0.8, 0, 1)   # déborde un peu sur l'image
    halo = flou(fis_b, 14)
    img = ecran(img, np.array([1.0, 0.72, 0.3]) * (halo * 0.9 + flou(fis_b, 40) * 0.5)[..., None])
    img = melange(img, or_holo(fis_b, 2, 18, 0.55), fis_b)
    # filets d'or : bord extérieur + liseré de la fenêtre
    f1 = masque(lambda c, p: c.drawDRRect(rrect(0, R), rrect(7, R - 6), p))
    f2 = masque(lambda c, p: c.drawDRRect(rrect(IN - 4, RF + 4), rrect(IN + 5, RF - 5), p))
    f3 = masque(lambda c, p: c.drawDRRect(rrect(IN + 16, RF - 14), rrect(IN + 19, RF - 17), p))
    m = np.maximum(np.maximum(f1, f2), f3 * 0.8)
    return melange(img, or_holo(m, 1.5, 16, 0.5), m)

# ================================================================== AUBE : BRONZE SOMBRE GRAVÉ + ÉCLAT
def aube(img):
    d, sp = relief(BANDE, 14, 6, brillance=22)
    g = brosse(70, 4); n = bruit_oct(5, (300, 80, 20, 6), (0.6, 0.3, 0.2, 0.15))
    bronze = palette(d * 0.7 + 0.03 * g + 0.05 * n, [(0, (10, 7, 4)), (0.45, (38, 26, 14)), (0.75, (88, 62, 34)), (1, (150, 112, 64))])
    img = img * (1 - flou(BANDE, 28)[..., None] * 0.35)
    img = melange(img, np.clip(bronze + sp[..., None] * 0.3, 0, 1), BANDE)
    return deco_aube(img)

def deco_aube(img, rayons_on=True):
    # gravures : filets concentriques + motifs art déco (gradins aux angles, faisceaux de lignes sur les côtés)
    def grav(c, p):
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(4)
        for ins, r in [(20, R - 16), (34, R - 28)]: c.drawRRect(rrect(ins, r), p)
        for sx, sy in [(1, 1), (-1, 1), (1, -1), (-1, -1)]:
            x0 = 0 if sx > 0 else W; y0 = 0 if sy > 0 else H
            for k, o in enumerate((50, 62, 74)):           # gradins d'angle
                L = 300 - k * 40
                path = skia.Path(); path.moveTo(x0 + sx * o, y0 + sy * (o + L)); path.lineTo(x0 + sx * o, y0 + sy * (o + 30))
                path.lineTo(x0 + sx * (o + 30), y0 + sy * o); path.lineTo(x0 + sx * (o + L), y0 + sy * o); c.drawPath(path, p)
        for x in (54, 64, 74, W - 54, W - 64, W - 74):        # faisceaux verticaux au milieu des côtés
            c.drawLine(x, H * 0.42, x, H * 0.58, p)
        for y in (54, 64, 74):
            c.drawLine(W * 0.36, y, W * 0.64, y, p)
        p.setStyle(skia.Paint.kFill_Style)
        for (x, y) in [(64, H * 0.4), (64, H * 0.6), (W - 64, H * 0.4), (W - 64, H * 0.6), (W * 0.34, 64), (W * 0.66, 64), (W * 0.34, H - 64), (W * 0.66, H - 64)]:
            path = skia.Path(); path.moveTo(x, y - 14); path.lineTo(x + 14, y); path.lineTo(x, y + 14); path.lineTo(x - 14, y); path.close(); c.drawPath(path, p)
    gm = masque(grav) * BANDE
    img = melange(img, np.array([0.03, 0.02, 0.01]), flou(gm, 1.5) * 0.6)             # creux de la gravure
    img = melange(img, or_holo(gm, 1, 14, 0.35), gm * 0.92)
    lis = masque(lambda c, p: c.drawDRRect(rrect(IN - 5, RF + 5), rrect(IN + 4, RF - 4), p))
    img = melange(img, or_holo(lis, 1.5, 16, 0.4), lis)
    # contour de la fenêtre : la lumière court le long, concentrée sur l'angle haut-droit et au centre du bas
    bord = np.clip(FENETRE - cv2.erode(FENETRE, np.ones((5, 5), np.uint8)), 0, 1)
    dist = cv2.distanceTransform((bord < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    ligne = np.exp(-(dist / 5) ** 2)
    coin = np.exp(-np.hypot(XX - (W - IN - RF * 0.3), YY - (IN + RF * 0.3)) / 300)
    bas = np.exp(-np.abs(XX - W / 2) / 260) * (YY > H * 0.9)
    poids = coin * 3.0 + bas * 1.6
    eclat = np.clip(ligne * poids, 0, 2.5)
    img = ecran(img, np.array([1.0, 0.7, 0.3]) * np.clip(flou(eclat, 90) * 3.5 + flou(eclat, 28) * 2.2, 0, 1)[..., None])
    img = ecran(img, (np.array([1.0, 0.95, 0.82]) * 0.7 + arcenciel((XX + YY) / (W + H) * 4, 0.9, 0.6) * 0.3) * np.clip(eclat * 1.2, 0, 1)[..., None])
    # rayons gravés qui partent de la lumière vers l'extérieur
    cx, cy = W - IN - RF, IN + RF
    ang = np.arctan2(YY - cy, XX - cx); rr = np.hypot(XX - cx, YY - cy)
    rayons = ((0.5 + 0.5 * np.cos(ang * 110)) ** 20) * np.exp(-((ang + np.pi / 4) / 0.9) ** 2) * lisse(rr, RF + 14, RF + 30) * BANDE
    rb = ((0.5 + 0.5 * np.cos((XX - W / 2) / 12)) ** 24) * np.exp(-((XX - W / 2) / 220) ** 2) * np.exp(-(YY - (H - IN)) / 40) * (YY > H - IN + 8) * BANDE
    ray = np.clip((rayons + rb) * 2.5, 0, 1)
    img = melange(img, or_holo(ray, 1, 12, 0.4), ray * 0.9)
    return ecran(img, np.array([1.0, 0.75, 0.35]) * (flou(ray, 6) * 0.5)[..., None])

def combo(img):
    """Marbre noir + kintsugi d'or, filets gravés art déco incrustés d'or, lumière qui s'embrase sur l'angle haut-droit
    (les fissures partent de l'éclat)."""
    return deco_aube(marbre(img))

VARIANTES = dict(MARBRE=marbre, AUBE=aube, COMBO=combo)
STYLE = dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(255, 242, 212), (190, 140, 70), (255, 236, 180), (170, 120, 60)], [0, 0.4, 0.6, 1]),
             txt_plaque=(246, 226, 180, 240), fond_plaque=(8, 6, 6, 215), contour_plaque=(230, 190, 110, 160),
             nom="or", petit=(240, 214, 160), rarete="ZENKAI", droits=(240, 214, 160, 150), px=200, py=206, x=212)

def carte(art, v):
    img = voile_bas(art.rgb.copy(), (6, 5, 8), 0.58, 0.9); avant = img.copy()
    img = VARIANTES[v](img)
    img = infos(img, STYLE)
    return embleme(img, or_metal, x=W - 360, y=2830, t=190, halo=[1.0, 0.8, 0.4]) * coins()[..., None]

if __name__ == "__main__":
    art = Art("ichigo_x4.png", "ichigo_masque_src.png", 0.5, 0.25)
    for v in sys.argv[1:] or ["MARBRE", "AUBE"]:
        finir(carte(art, v)).convert("RGB").save(f"sortie/zenkai_ref_{v}.jpg", quality=93); print(v, flush=True)
