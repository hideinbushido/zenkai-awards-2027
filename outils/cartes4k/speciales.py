"""Spéciales 4K : chaque spéciale transforme l'illustration (storyboard, dessin d'animation, cellulo, encre...)
puis reçoit le cadre hybride de sa rareté et la mention ÉDITION SPÉCIALE."""
import numpy as np, cv2, skia
from PIL import Image
from hybride import *          # noqa

rng0 = np.random.default_rng(5)

# ------------------------------------------------------------------ matières de base
def papier(teinte=(240, 233, 216), grain=0.035, fibres=0.05, graine=3):
    r = np.random.default_rng(graine)
    n = r.standard_normal((H, W)).astype(np.float32)
    g = flou(n, 0.7) * grain + flou(n, 6) * grain * 1.6
    fib = cv2.GaussianBlur(r.standard_normal((H, W)).astype(np.float32), (0, 0), sigmaX=24, sigmaY=1.2) * fibres
    base = np.ones((H, W, 3), np.float32) * (np.array(teinte, np.float32) / 255)
    return np.clip(base + (g + fib)[..., None], 0, 1)

def gris(rgb): return rgb[..., 0] * 0.3 + rgb[..., 1] * 0.59 + rgb[..., 2] * 0.11

def traits(rgb, sigma=1.6, k=1.6, p=26, eps=-0.012, phi=14):
    """Lignes façon dessin (XDoG) : 1 = blanc, 0 = trait."""
    g = gris(rgb)
    a = flou(g, sigma); b = flou(g, sigma * k)
    d = (1 + p) * a - p * b
    return np.where(d >= eps, 1.0, 1 + np.tanh(phi * (d - eps))).astype(np.float32)

def recadrer(rgb, cx, cy, zoom, w, h):
    """Extrait une zone de l'illustration (centre cx, cy en fraction, zoom > 1 = plus serré) à la taille w x h."""
    ww, hh = W / zoom, W / zoom * h / w
    x0 = np.clip(cx * W - ww / 2, 0, W - ww); y0 = np.clip(cy * H - hh / 2, 0, H - hh)
    M = np.float32([[w / ww, 0, -x0 * w / ww], [0, h / hh, -y0 * h / hh]])
    return cv2.warpAffine(rgb, M, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)

def coller_zone(img, morceau, x, y):
    h, w = morceau.shape[:2]; img[y:y + h, x:x + w] = morceau[..., :3] if morceau.ndim == 3 else morceau[..., None]; return img

def dessiner(img, f):
    s, c = toile(); f(c); return poser(img, tableau(s))

def crayon(c, path_pts, couleur, ep=6, a=200):
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=ep, Color=skia.Color(*couleur, a), StrokeCap=skia.Paint.kRound_Cap)
    pa = skia.Path(); pa.moveTo(*path_pts[0])
    for q in path_pts[1:]: pa.lineTo(*q)
    c.drawPath(pa, p)

def ecriture(c, s, x, y, taille, couleur, police="xcond", a=255, espace=0.04):
    texte(c, s, x, y, police, taille, skia.Paint(AntiAlias=True, Color=skia.Color(*couleur, a)), espace=espace)

# ------------------------------------------------------------------ cadres hybrides sans effets de fond
STYLES = {
    "eclat": dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(255, 255, 255), (150, 156, 168), (240, 242, 248)]), txt_plaque=(230, 232, 238, 230),
                  contour_plaque=(220, 190, 120, 140), degrade_nom=DEG([(255, 255, 255), (196, 200, 210)]), petit=(214, 216, 224), rarete="ÉCLAT"),
    "prisme": dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(255, 214, 236), (190, 230, 255), (255, 246, 196)]), txt_plaque=(245, 240, 255, 235),
                   fond_plaque=(16, 12, 30, 200), contour_plaque=(255, 220, 140, 150),
                   degrade_nom=lambda y: degrade(206, 0, 2200, 0, [(255, 210, 238), (200, 236, 255), (255, 250, 210), (214, 200, 255)]), petit=(236, 230, 255), rarete="PRISME"),
    "spectre": dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(170, 240, 255), (220, 190, 255)]), txt_plaque=(210, 230, 255, 230), fond_plaque=(6, 4, 18, 210),
                    contour_plaque=(150, 220, 255, 120), nom="contour", petit=(196, 222, 255), rarete="SPECTRE", droits=(200, 220, 255, 140), px=210, py=210, x=216),
    "mirage": dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(236, 230, 255), (180, 210, 255), (255, 236, 250)]), txt_plaque=(236, 232, 255, 235), fond_plaque=(16, 10, 34, 195),
                   contour_plaque=(220, 210, 255, 130), nom="auge", degrade_nom=DEG([(255, 255, 255), (200, 196, 255)]), petit=(226, 222, 255), rarete="MIRAGE",
                   droits=(226, 222, 255, 140), px=210, py=210, x=216),
    "zenkai": dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(255, 242, 212), (190, 140, 70), (255, 236, 180), (170, 120, 60)], [0, 0.4, 0.6, 1]),
                   txt_plaque=(246, 226, 180, 240), fond_plaque=(8, 6, 6, 215), contour_plaque=(230, 190, 110, 160), nom="or", petit=(240, 214, 160),
                   rarete="ZENKAI", droits=(240, 214, 160, 150), px=200, py=206, x=212),
}

def cadre(rarete, img, perso=None, voile=(8, 6, 14), voile_force=0.9, sortie=False):
    if rarete == "zenkai":                       # cadre ZENKAI définitif (marbre + kintsugi + éclat)
        import zk_cadre
        return zk_cadre.appliquer(voile_bas(img, voile, 0.6, voile_force))
    L = couches(rarete)
    img = voile_bas(img, voile, 0.6, voile_force)
    avant = img.copy()
    img = lueur(img, L["lueur"], 0.45)
    zone = np.zeros((H, W), np.float32)
    if rarete == "zenkai":
        bande = masque(lambda c, p: c.drawDRRect(rrect(0, R), rrect(124, R - 92), p))
        d, sp = relief(bande + seigaiha(64) * bande * 0.5, 3, 14)
        img = melange(img, or_metal(d, sp, brosse(50, 5)), bande)
        o = L["bande_or_holo"]; violet = (o[..., 2] > o[..., 0] + 0.08) * o[..., 3]
        img = melange(img, o[..., :3], violet * 0.85)
        img = melange(img, np.array([0.02, 0.02, 0.03]), masque(lambda c, p: (p.setStyle(skia.Paint.kStroke_Style), p.setStrokeWidth(10), c.drawRRect(rrect(126, R - 94), p))))
        for k in ("flammes", "eclats"): img = coller(img, L[k])
        zone = np.maximum(bande, np.maximum(L["flammes"][..., 3], L["eclats"][..., 3]))
        fin = ["couronne_cristal"]
    else:
        if rarete == "prisme":
            val, bord = facettes(58)
            teinte = np.arctan2(YY - H / 2, XX - W / 2) / 6.2832 + val * 0.35 + (XX + YY) / (W + H) * 0.6
            foil = np.clip(arcenciel(teinte, 0.95, 0.62) * (0.75 + 0.5 * val[..., None]) + (1 - lisse(bord, 0, 0.05))[..., None] * 0.35, 0, 1)
            bande = masque(lambda c, p: c.drawDRRect(rrect(0, R), rrect(92, R - 70), p)); d, sp = relief(bande, 6, 10)
            img = melange(img, np.clip(foil * (0.3 + 0.95 * d[..., None]) + sp[..., None] * 0.9, 0, 1), bande); zone = bande
        ordre = {"prisme": ["filets_or_ruban", "epines_or", "cristaux", "etincelles"], "eclat": ["argent", "lisere_or", "etoiles", "eclats"],
                 "spectre": ["bande_energie", "fumee_spectrale", "lames_acier", "eclats_cristal", "couronne", "anneaux", "etincelles"],
                 "mirage": ["bande_verre_argent", "rubans_voiles", "eclats_cristal", "anneaux", "couronne_diamant", "etincelles"]}[rarete]
        for k in ordre:
            img = coller(img, L[k]); zone = np.maximum(zone, L[k][..., 3])
        fin = []
    if sortie and perso is not None:                 # le personnage passe devant le cadre en haut
        devant = perso * (YY < H * 0.42) * lisse(perso, 0.5, 0.9)
        img *= (1 - (flou(devant, 10) * zone * (1 - devant))[..., None] * 0.6)
        img = melange(img, avant, devant * zone)
    for k in fin: img = coller(img, L[k])
    return img

def habiller(rarete, img, special, perso=None, sortie=False, voile=(8, 6, 14), voile_force=0.9):
    sortie = sortie or (rarete == "zenkai" and perso is not None)
    img = cadre(rarete, img, perso, voile, voile_force, sortie)
    INFOS["type"] = f"ÉDITION SPÉCIALE  ·  {special}"
    img = infos(img, STYLES[rarete])
    mat = {"prisme": argent_metal, "eclat": argent_metal, "spectre": argent_metal, "mirage": argent_metal, "zenkai": or_metal}[rarete]
    if rarete == "zenkai": return embleme(img, or_metal, x=W - 360, y=2830, t=190, halo=[1.0, 0.8, 0.4])
    return embleme(img, mat, x=W - 356, y=2850, halo=[0.7, 0.8, 1.0])

# ================================================================== EKONTE · PLANCHES (3 cases de storyboard)
def ekonte_planches(art, rarete="spectre"):
    img = papier((238, 231, 214))
    cases = [(0.44, 0.27, 2.6, "APPROCHE", "3+12"), (0.72, 0.62, 2.4, "REGARD", "2+06"), (0.47, 0.42, 1.05, "ÉLAN", "4+00")]
    x0, w, h, y = 250, 1700, 640, 420
    for k, (cx, cy, z, note, tps) in enumerate(cases):
        m = recadrer(art.rgb, cx, cy, z, w, h)
        t = traits(m, 1.3); g = gris(m)
        ton = np.clip(0.25 + 0.75 * (np.round(g * 4) / 4), 0, 1)       # aplats de gris comme un storyboard lavé
        enc = (t * (0.55 + 0.45 * ton))[..., None] * np.array([0.98, 0.95, 0.88])
        img[y:y + h, x0:x0 + w] = enc
        bord = np.zeros((H, W), np.float32); cv2.rectangle(bord, (x0, y), (x0 + w, y + h), 1.0, 7)
        img = melange(img, np.array([0.08, 0.07, 0.06]), flou(bord, 0.8))
        y += h + 70
    def notes(c):
        yy = 420
        for k, (_, _, _, note, tps) in enumerate(cases):
            ecriture(c, f"{k + 1:02d}", 1990, yy + 80, 76, (196, 40, 36), "cond")
            ecriture(c, note, 1990, yy + 130, 30, (80, 70, 60), "bold", espace=0.14)
            ecriture(c, tps, 1990, yy + 180, 34, (60, 90, 170), "serif")
            crayon(c, [(1990, yy + 200), (2120, yy + 200)], (60, 90, 170), 3, 180)
            yy += 710
        # flèches de caméra au crayon bleu
        crayon(c, [(1500, 760), (1700, 640), (1660, 700)], (50, 90, 190), 7, 170)
        crayon(c, [(1700, 640), (1640, 650)], (50, 90, 190), 7, 170)
        ecriture(c, "PAN", 1720, 650, 40, (50, 90, 190), "serif", 200)
    img = dessiner(img, notes)
    return habiller(rarete, img, "EKONTE", None, voile=(30, 24, 20), voile_force=0.75)

# ================================================================== EKONTE · VUE COMPLÈTE (même style que les planches, une seule grande case)
CASE_COMPLETE = (250, 420, 1700, 2050)          # x, y, largeur, hauteur : la zone que couvrent les 3 cases
def ekonte_complet(art, rarete="spectre"):
    img = papier((238, 231, 214))
    x0, y0, w, h = CASE_COMPLETE
    m = recadrer(art.rgb, 0.47, 0.43, 1.25, w, h)
    t = traits(m, 1.3); g = gris(m)
    ton = np.clip(0.25 + 0.75 * (np.round(g * 4) / 4), 0, 1)
    img[y0:y0 + h, x0:x0 + w] = (t * (0.55 + 0.45 * ton))[..., None] * np.array([0.98, 0.95, 0.88])
    bord = np.zeros((H, W), np.float32); cv2.rectangle(bord, (x0, y0), (x0 + w, y0 + h), 1.0, 7)
    img = melange(img, np.array([0.08, 0.07, 0.06]), flou(bord, 0.8))
    def notes(c):
        ecriture(c, "01-03", 1990, 500, 76, (196, 40, 36), "cond")
        ecriture(c, "9+18", 1990, 560, 34, (60, 90, 170), "serif")
        crayon(c, [(1990, 2400), (1990, 1200)], (196, 40, 36), 4, 170)
        crayon(c, [(1960, 1250), (1990, 1200), (2020, 1250)], (196, 40, 36), 4, 170)
    img = dessiner(img, notes)
    return habiller(rarete, img, "EKONTE", None, voile=(30, 24, 20), voile_force=0.75)

# ================================================================== EKONTE · CROQUIS (le dessin au trait sur papier rouge)
def ekonte_croquis(art, rarete="zenkai"):
    t = traits(art.rgb, 1.2, p=34, phi=20)
    t = cv2.erode(t, np.ones((3, 3), np.uint8))               # trait plus épais, comme au feutre
    pap = papier((176, 38, 40), 0.05, 0.07, 9)
    pap = pap * (0.9 + 0.2 * lisse(np.hypot(XX - W / 2, YY - H * 0.4) / W, 0.7, 0.1)[..., None])
    encre = np.array([0.04, 0.01, 0.02])
    img = melange(pap, encre, (1 - t))
    # ombres posées au lavis sombre, comme un story-board peint
    ombre = (gris(art.rgb) < 0.22).astype(np.float32); ombre = flou(ombre, 3) * art.perso
    img = melange(img, np.array([0.28, 0.04, 0.06]), ombre * 0.6)
    clair = (gris(art.rgb) > 0.72).astype(np.float32) * art.perso
    img = melange(img, np.array([0.98, 0.9, 0.8]), flou(clair, 2.5) * 0.55)      # rehauts à la craie claire
    def marques(c):
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=5, Color=skia.Color(250, 236, 220, 200))
        c.drawRect(skia.Rect.MakeLTRB(260, 330, W - 260, 2560), p)          # cadre caméra
        for (x, y, sx, sy) in ((260, 330, 1, 1), (W - 260, 330, -1, 1), (260, 2560, 1, -1), (W - 260, 2560, -1, -1)):
            crayon(c, [(x - sx * 60, y), (x - sx * 10, y)], (250, 236, 220), 5); crayon(c, [(x, y - sy * 60), (x, y - sy * 10)], (250, 236, 220), 5)
        ecriture(c, "CUT 029", 280, 310, 48, (250, 236, 220), "bold", 220, 0.14)
        crayon(c, [(2050, 1300), (2050, 1700), (2010, 1640)], (250, 236, 220), 8, 200); crayon(c, [(2050, 1700), (2090, 1640)], (250, 236, 220), 8, 200)
        ecriture(c, "T.U", 2075, 1290, 44, (250, 236, 220), "serif", 220)
    img = dessiner(img, marques)
    return habiller(rarete, img, "EKONTE", art.perso, sortie=True, voile=(40, 6, 10), voile_force=0.8)

# ================================================================== EKONTE · MIRAGE (le storyboard qui devient l'image finale)
def ekonte_mirage(art, rarete="mirage", phase=0.0, seuil=None):
    """Moitié storyboard au crayon, moitié image finale en couleur. La frontière ondule comme l'air chaud
    d'un mirage et brille d'un reflet irisé. phase sert à l'animation (la frontière avance et ondule)."""
    pap = papier((238, 231, 214))
    t = traits(art.rgb, 1.3); g = gris(art.rgb)
    ton = np.clip(0.25 + 0.75 * (np.round(g * 4) / 4), 0, 1)
    croquis = pap * (t * (0.6 + 0.4 * ton))[..., None]
    diag = (XX / W) * 0.55 + (YY / H) * 0.75
    onde = 0.035 * np.sin(YY / H * 26 + phase * 6.283) + 0.02 * np.sin(XX / W * 17 - phase * 6.283 * 2)
    seuil = 0.66 + 0.05 * np.sin(phase * 6.283) if seuil is None else seuil
    m = lisse(diag + onde, seuil - 0.03, seuil + 0.03)                  # 0 : storyboard, 1 : image finale
    # l'air chaud déforme légèrement l'image près de la frontière
    pres = np.exp(-((diag + onde - seuil) / 0.06) ** 2)
    dx = np.sin(YY * 0.05 + phase * 20) * 9 * pres; dy = np.cos(XX * 0.04 + phase * 14) * 6 * pres
    mx, my = (XX + dx).astype(np.float32), (YY + dy).astype(np.float32)
    fin = cv2.remap(art.rgb, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    cro = cv2.remap(croquis.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    img = cro * (1 - m[..., None]) + fin * m[..., None]
    # liseré irisé sur la frontière
    liser = np.exp(-((diag + onde - seuil) / 0.006) ** 2)
    img = ecran(img, arcenciel(diag * 3 + phase, 0.8, 0.85) * (liser * 0.9)[..., None])
    img = ecran(img, np.array([1.0, 0.95, 0.9]) * (flou(liser, 12) * 0.5)[..., None])
    return habiller(rarete, img, "EKONTE", art.perso, voile=(20, 12, 30), voile_force=0.85)

# ================================================================== EKONTE · LAYOUT (Mirage) : calque superposé et grille de cadrage
def ekonte_layout(art, rarete="mirage"):
    """Le plan de layout : l'illustration en couleur apparaît à travers des feuilles de papier calque,
    le trait est repris au crayon bleu et la grille de cadrage (field guide) est tracée par-dessus."""
    img = art.rgb.copy()
    # deux feuilles de calque légèrement décalées et tournées
    def feuille(angle, dx, dy):
        m = masque(lambda c, p: (c.save(), c.translate(W / 2 + dx, H * 0.43 + dy), c.rotate(angle),
                                 c.drawRect(skia.Rect.MakeXYWH(-1000, -1250, 2000, 2500), p), c.restore()))
        return m
    f1, f2 = feuille(-2.2, -30, 10), feuille(1.4, 25, -15)
    lait = np.array([0.95, 0.96, 0.98])
    img = melange(img, lait, f1 * 0.5)
    img = melange(img, lait, f2 * 0.38)
    # ombre douce sous les bords de feuille
    for f in (f1, f2):
        bord = np.clip(flou(f, 10) - f, 0, 1); img *= (1 - bord[..., None] * 0.6)
    # trait repris au crayon bleu sur la feuille du dessus
    t = traits(art.rgb, 1.4, p=30)
    img = melange(img, np.array([0.16, 0.32, 0.72]), (1 - t) * f2 * 0.85)
    # bandes adhésives aux coins de la feuille
    def scotch(c, p):
        p.setColor(skia.Color(250, 244, 214, 150))
        for (x, y, a) in ((480, 260, -38), (W - 470, 280, 34), (470, 2420, 32), (W - 470, 2440, -30)):
            c.save(); c.translate(x, y); c.rotate(a); c.drawRect(skia.Rect.MakeXYWH(-120, -38, 240, 76), p); c.restore()
    img = dessiner(img, lambda c: scotch(c, skia.Paint(AntiAlias=True)))
    # grille de cadrage : rectangles emboîtés 12F 10F 8F 6F, croix centrale, graduations
    def grille(c):
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=5, Color=skia.Color(40, 110, 245, 230))
        cx, cy = W / 2, H * 0.43
        for k, f in enumerate((12, 10, 8, 6)):
            w = 1700 * f / 12; h = w * 0.5625 * 1.62
            c.drawRect(skia.Rect.MakeXYWH(cx - w / 2, cy - h / 2, w, h), p)
            ecriture(c, f"{f}F", cx - w / 2 + 16, cy - h / 2 + 56, 46, (40, 110, 245), "bold", 240, 0.1)
        crayon(c, [(cx - 70, cy), (cx + 70, cy)], (70, 140, 255), 3, 200); crayon(c, [(cx, cy - 70), (cx, cy + 70)], (70, 140, 255), 3, 200)
        for i in range(-12, 13):
            crayon(c, [(cx + i * 70, cy - 8), (cx + i * 70, cy + 8)], (70, 140, 255), 2, 150)
        ecriture(c, "LAYOUT   C-029", 300, 520, 52, (40, 80, 170), "bold", 230, 0.14)
        ecriture(c, "BG : ciel rouge  /  BOOK 1", 300, 590, 46, (40, 80, 170), "serif", 220)
        crayon(c, [(1650, 1850), (1950, 1650), (1890, 1660)], (220, 60, 60), 7, 190); crayon(c, [(1950, 1650), (1925, 1710)], (220, 60, 60), 7, 190)
        ecriture(c, "FOLLOW", 1960, 1640, 40, (220, 60, 60), "serif", 220)
    img = dessiner(img, grille)
    return habiller(rarete, img, "EKONTE", None, voile=(20, 22, 40), voile_force=0.85)

# ================================================================== GENGA (dessin d'animation au crayon)
GENGA_LAVIS = True
def genga(art, rarete="spectre"):
    img = papier((246, 244, 238), 0.025, 0.03, 4)
    if GENGA_LAVIS:      # lavis de couleur sous le trait : l'image clé déjà mise en couleur au crayon
        lav = 0.5 + 0.5 * art.rgb
        k = (0.62 * flou(np.maximum(art.perso, art.large * 0.8), 3) + 0.2)[..., None]
        img = img * (1 - k) + img * lav * k
        # guide de cadrage en pointillés et colonne de feuille d'exposition à droite
        def guides(c):
            p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=4, Color=skia.Color(60, 90, 170, 150))
            p.setPathEffect(skia.DashPathEffect.Make([28, 18], 0)); c.drawRect(skia.Rect.MakeLTRB(230, 300, W - 230, H - 520), p)
            q = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=skia.Color(40, 40, 46, 150))
            for k_ in range(14):
                y = 760 + k_ * 110; c.drawLine(W - 200, y, W - 150, y, q)
                if k_ % 3 == 0: ecriture(c, str(k_ + 1), W - 205, y - 18, 30, (40, 40, 46), "bold")
        img = dessiner(img, guides)
    t = traits(art.rgb, 1.2, p=30)
    img = melange(img, np.array([0.22, 0.22, 0.24]), (1 - t) * 0.92)
    g = gris(art.rgb)
    ombre = ((g < 0.25) * art.perso).astype(np.float32)
    bordo = cv2.Canny((ombre * 255).astype(np.uint8), 50, 150).astype(np.float32) / 255
    img = melange(img, np.array([0.86, 0.18, 0.2]), flou(bordo, 1.4) * 0.9)   # limite d'ombre au crayon rouge
    lum = ((g > 0.8) * art.perso).astype(np.float32)
    bl = cv2.Canny((lum * 255).astype(np.uint8), 50, 150).astype(np.float32) / 255
    img = melange(img, np.array([0.2, 0.42, 0.86]), flou(bl, 1.4) * 0.85)     # reflets au crayon bleu
    def notes(c):
        trous = skia.Paint(AntiAlias=True, Color=skia.Color(20, 18, 22))
        for x in (W / 2 - 300, W / 2, W / 2 + 300):
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - (40 if x == W / 2 else 60), 330, 80 if x == W / 2 else 120, 46), 23, 23), trous)
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=4, Color=skia.Color(40, 40, 46, 220))
        c.drawRect(skia.Rect.MakeXYWH(W - 620, 420, 360, 200), p)
        ecriture(c, "C-" + INFOS["num"], W - 600, 500, 64, (40, 40, 46), "cond")
        ecriture(c, "A-1   3k", W - 600, 590, 48, (196, 40, 36), "serif")
        for (x, y) in ((300, 440), (W - 300, 2500), (300, 2500)):
            crayon(c, [(x - 40, y), (x + 40, y)], (40, 40, 46), 4); crayon(c, [(x, y - 40), (x, y + 40)], (40, 40, 46), 4)
        ecriture(c, "OMBRE", 1720, 1500, 40, (196, 40, 36), "serif", 220)
        crayon(c, [(1710, 1490), (1560, 1420)], (196, 40, 36), 4, 200)
    img = dessiner(img, notes)
    return habiller(rarete, img, "GENGA", art.perso, voile=(40, 40, 50), voile_force=0.8)

# ================================================================== SAKUGA (mouvement : traînée, fantômes, lignes de vitesse)
def sakuga(art, rarete="zenkai"):
    img = art.rgb.copy(); fond = 1 - art.perso
    cy, cx = H * 0.33, W * 0.45
    th = np.arctan2(YY - cy, XX - cx); rr = np.hypot(XX - cx, YY - cy)
    rayons = (np.random.default_rng(3).random(720)[(((th + np.pi) / (2 * np.pi)) * 720).astype(int) % 720] > 0.82).astype(np.float32)
    rayons *= lisse(rr, 500, 1400)
    img = melange(img, np.array([1.0, 0.97, 0.92]), rayons * fond * 0.55)
    # fantômes du mouvement (pelure d'oignon) décalés et teintés
    for k, (dx, dy, col, a) in enumerate(((-110, 50, (0.4, 0.9, 1.0), 0.55), (-220, 100, (1.0, 0.4, 0.7), 0.35))):
        M = np.float32([[1, 0, dx], [0, 1, dy]])
        gh = cv2.warpAffine(art.rgb, M, (W, H), borderMode=cv2.BORDER_REFLECT); gm = cv2.warpAffine(art.perso, M, (W, H))
        img = melange(img, ecran(img, gh * np.array(col)), gm * fond * a)
    # flou de bougé sur le fond
    k = 61; ker = np.zeros((k, k), np.float32); ker[k // 2, :] = 1 / k
    bouge = cv2.filter2D(img, -1, ker)
    img = melange(img, bouge, fond * 0.6)
    def notes(c):
        for i, t in enumerate(("1", "2", "3")):
            x = 280 + i * 120
            p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=4, Color=skia.Color(255, 255, 255, 170))
            c.drawRect(skia.Rect.MakeXYWH(x, 2440, 100, 70), p); ecriture(c, t, x + 38, 2492, 44, (255, 255, 255), "bold", 200)
        ecriture(c, "24 i/s", 680, 2492, 40, (255, 255, 255), "serif", 220)
    img = dessiner(img, notes)
    return habiller(rarete, img, "SAKUGA", art.perso, sortie=True)

# ================================================================== CELLULOÏD (le personnage sur acétate, décor peint derrière)
def celluloid(art, rarete="mirage"):
    fond = 1 - art.perso
    decor = flou(art.rgb, 14)
    decor = np.clip(decor * np.array([0.8, 0.85, 1.05]) + np.array([0.05, 0.04, 0.08]), 0, 1)
    decor = np.clip((np.round(decor * 5) / 5) * 0.7 + flou(decor, 20) * 0.3, 0, 1)       # décor gouache en aplats
    decor = np.clip(decor * 0.8 + papier((255, 250, 240), 0.03, 0.04, 2) * 0.2, 0, 1)
    # cellulo : léger décalage + ombre portée sur le décor
    dx, dy = -18, -26
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    perso = cv2.warpAffine(art.perso, M, (W, H)); cel = cv2.warpAffine(art.rgb, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    ombre = flou(np.roll(np.roll(perso, 40, 0), 30, 1), 18)
    img = decor * (1 - ombre[..., None] * 0.45)
    lis = cv2.bilateralFilter((cel * 255).astype(np.uint8), 15, 60, 15).astype(np.float32) / 255
    cel = np.round(lis * 5) / 5                                                      # aplats de peinture cellulo
    trait = traits(cv2.warpAffine(art.rgb, M, (W, H), borderMode=cv2.BORDER_REFLECT), 1.4, p=30)
    cel = cel * trait[..., None]
    img = melange(img, cel, perso)
    # feuille d'acétate : reflet brillant en diagonale, bords visibles
    gloss = lisse(1 - np.abs((XX + YY * 0.7) / (W + H) - 0.42) * 9, 0, 1) * 0.22
    img = ecran(img, np.ones(3) * gloss[..., None])
    def marques(c):
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=skia.Color(255, 255, 255, 120))
        c.drawRect(skia.Rect.MakeLTRB(230, 300, W - 230, 2620), p)
        trous = skia.Paint(AntiAlias=True, Color=skia.Color(30, 20, 20, 200))
        for x in (W / 2 - 300, W / 2, W / 2 + 300):
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 50, 2540, 100, 40), 20, 20), trous)
        ecriture(c, "A-12", W - 520, 2500, 80, (240, 240, 245), "serif", 230)
    img = dessiner(img, marques)
    return habiller(rarete, img, "CELLULOÏD", art.perso)

# ================================================================== SUMI (lavis d'encre, sceau)
def sumi(art, rarete="spectre"):
    g = gris(art.rgb)
    lav = np.clip((g - 0.08) / 0.8, 0, 1)
    lav = np.round(lav * 5) / 5 * 0.7 + lav * 0.3
    lav = flou(lav, 2.2)
    t = traits(art.rgb, 1.8, p=22)
    pap = papier((236, 228, 210), 0.04, 0.06, 6)
    encre = np.array([0.06, 0.05, 0.06])
    img = melange(pap, encre, (1 - lav) * 0.85 * (0.45 + 0.55 * art.perso[..., None].squeeze()))
    img = melange(img, encre, (1 - t) * 0.9)
    # éclaboussures d'encre autour du personnage
    r = np.random.default_rng(8); taches = (flou(r.random((H, W)).astype(np.float32), 14) > 0.515).astype(np.float32)
    taches = flou(taches, 1.5) * lisse(flou(art.perso, 60), 0.05, 0.3) * (1 - art.perso)
    img = melange(img, encre, taches * 0.8)
    # touche de rouge : les flammes restent en vermillon
    rouge = ((art.rgb[..., 0] > 0.72) & (art.rgb[..., 1] < 0.3) & (art.rgb[..., 0] - art.rgb[..., 2] > 0.35)).astype(np.float32) * lisse(flou(art.perso, 30), 0.3, 0.7)
    img = melange(img, np.array([0.8, 0.12, 0.1]), flou(rouge, 1.5) * 0.9)
    # sceau rouge avec l'emblème
    def sceau(c):
        p = skia.Paint(AntiAlias=True, Color=skia.Color(178, 28, 30, 230))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(W - 520, 360, 220, 220), 18, 18), p)
    img = dessiner(img, sceau)
    em = emblème_masque(W - 410, 470, 150); img = melange(img, np.array([0.95, 0.9, 0.85]), em)
    return habiller(rarete, img, "SUMI", art.perso, voile=(30, 26, 24), voile_force=0.75)

# ================================================================== HANGA (estampe sur bois)
def hanga(art, rarete="mirage"):
    small = cv2.resize(art.rgb, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    Z = small.reshape(-1, 3).astype(np.float32)
    _, lab, cen = cv2.kmeans(Z, 5, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 3, cv2.KMEANS_PP_CENTERS)
    cen = np.clip(cen * np.array([1.05, 0.95, 0.85]) + np.array([0.04, 0.02, 0.0]), 0, 1)     # pigments un peu passés
    flat = cen[lab.flatten()].reshape(small.shape); flat = cv2.resize(flat, (W, H), interpolation=cv2.INTER_NEAREST)
    flat = cv2.medianBlur((flat * 255).astype(np.uint8), 7).astype(np.float32) / 255
    # veinage du bois imprimé dans les aplats
    veine = np.sin(YY * 0.045 + flou(np.random.default_rng(2).standard_normal((H, W)).astype(np.float32), 40) * 60) * 0.5 + 0.5
    flat = flat * (0.92 + 0.08 * veine[..., None])
    pap = papier((238, 226, 200), 0.03, 0.08, 12)
    flat = np.clip(flat * 1.25 + 0.06, 0, 1)
    flat = cv2.warpAffine(flat, np.float32([[1, 0, 9], [0, 1, -7]]), (W, H), borderMode=cv2.BORDER_REFLECT)   # repérage décalé
    usure = (flou(np.random.default_rng(13).random((H, W)).astype(np.float32), 2) > 0.62).astype(np.float32) * 0.25
    img = pap * (1 - (1 - flat) * (1 - usure[..., None]))
    t = cv2.erode(traits(art.rgb, 2.0, p=26), np.ones((3, 3), np.uint8))
    img = melange(img, np.array([0.12, 0.09, 0.09]), (1 - t) * 0.95)
    return habiller(rarete, img, "HANGA", art.perso, voile=(30, 18, 14), voile_force=0.8)

# ================================================================== REIATSU (aura de pression spirituelle)
def reiatsu(art, rarete="mirage"):
    img = art.rgb.copy(); fond = 1 - art.perso
    img = melange(img, np.array([0.02, 0.01, 0.02]), fond * 0.82)
    bruit = cv2.GaussianBlur(np.random.default_rng(4).standard_normal((H, W)).astype(np.float32), (0, 0), sigmaX=10, sigmaY=48)
    bruit = (bruit - bruit.min()) / (bruit.max() - bruit.min())
    # l'aura monte : on étire la silhouette vers le haut et on la déforme avec du bruit
    d = cv2.dilate(art.perso, np.ones((5, 5), np.uint8), iterations=8)
    haut = np.zeros_like(d)
    for k in range(1, 9):
        haut = np.maximum(haut, np.roll(d, -k * 28, 0) * (1 - k / 10))
    mx = XX + (bruit - 0.5) * 120; my = YY + (bruit - 0.5) * 160
    aura = cv2.remap(haut, mx, my, cv2.INTER_LINEAR)
    aura = np.clip(flou(aura, 14) * (0.6 + 0.8 * bruit), 0, 1) * fond
    noyau = palette(aura, [(0, (0, 0, 0)), (0.35, (90, 0, 20)), (0.7, (220, 30, 40)), (1, (255, 220, 200))])
    img = ecran(img, noyau * 1.1)
    # liseré noir et rouge autour du personnage (le reiatsu du bankai)
    bordp = np.clip(flou(art.perso, 6) - art.perso * 0.9, 0, 1) * 1.8
    img = ecran(img, np.array([1.0, 0.25, 0.25]) * np.clip(bordp, 0, 1)[..., None] * 0.8)
    return habiller(rarete, img, "REIATSU", art.perso, voile=(10, 2, 4))

TOUTES = ["ekonte_layout", "ekonte_planches", "ekonte_croquis", "genga", "sakuga", "celluloid", "sumi", "hanga", "reiatsu"]

if __name__ == "__main__":
    import sys, time
    art = Art("ichigo_x4.png", "ichigo_masque_src.png", 0.5, 0.25)
    for q in sys.argv[1:] or TOUTES:
        nom, _, r = q.partition(":")
        t = time.time(); im = globals()[nom](art, r) if r else globals()[nom](art)
        finir(im).save(f"sortie/sp_{nom}{'_' + r if r else ''}.png"); print(q, round(time.time() - t, 1), "s")
