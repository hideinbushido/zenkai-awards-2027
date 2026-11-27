"""Les spéciales déclinées par rareté (Spectre, Mirage, Zenkai), sur plusieurs personnages.
Chaque déclinaison a son propre design ; la couleur dominante du personnage sert pour les effets."""
import numpy as np, cv2, skia, json, sys, time
from PIL import Image
from speciales import *          # noqa

def couleur_perso(art):
    """Couleur la plus saturée et fréquente du personnage (pour l'aura, l'encre d'accent...)."""
    p = art.rgb[art.perso > 0.6][::37]
    mx, mn = p.max(1), p.min(1); sat = (mx - mn) / (mx + 1e-4)
    p = p[(sat > 0.45) & (mx > 0.35)]
    if len(p) < 50: return np.array([0.85, 0.2, 0.2])
    _, lab, cen = cv2.kmeans(p.astype(np.float32), 4, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 2, cv2.KMEANS_PP_CENTERS)
    n = np.bincount(lab.flatten(), minlength=4); c = cen[np.argmax(n)]
    return np.clip(c / max(c.max(), 1e-3), 0, 1)

def aplats(rgb, niveaux=5):
    lis = cv2.bilateralFilter((rgb * 255).astype(np.uint8), 15, 60, 15).astype(np.float32) / 255
    return np.round(lis * niveaux) / niveaux

# ================================================================== GENGA
def genga_mirage(art, rarete="mirage"):
    """Le genga en cours de mise en couleur : le trait au crayon partout, la peinture en aplats
    qui monte du bas avec un bord de pinceau, et le nuancier des couleurs sur le côté."""
    img = papier((246, 244, 238), 0.025, 0.03, 4)
    t = traits(art.rgb, 1.2, p=30)
    peint = aplats(art.rgb, 5)
    bruit = flou(np.random.default_rng(6).random((H, W)).astype(np.float32), 18)
    bruit = (bruit - bruit.min()) / (bruit.max() - bruit.min())
    front = lisse((YY / H) * 0.8 + (XX / W) * 0.35 + (bruit - 0.5) * 0.14, 0.52, 0.56)            # bord de pinceau irrégulier
    zone = np.maximum(front, 0) * np.clip(art.perso * 1.2, 0, 1)
    
    img = melange(img, peint, zone)
    img = melange(img, np.array([0.2, 0.2, 0.23]), (1 - t) * 0.9)
    # nuancier : les couleurs réelles du personnage
    pal = art.rgb[art.perso > 0.6][::53].astype(np.float32)
    _, _, cen = cv2.kmeans(pal, 5, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 2, cv2.KMEANS_PP_CENTERS)
    cen = cen[np.argsort(cen.mean(1))]
    def nuancier(c):
        for k, col in enumerate(cen):
            x, y = W - 430, 560 + k * 170
            c.drawRect(skia.Rect.MakeXYWH(x, y, 130, 130), skia.Paint(Color=skia.Color(*(int(v * 255) for v in col))))
            c.drawRect(skia.Rect.MakeXYWH(x, y, 130, 130), skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=skia.Color(40, 40, 46)))
            ecriture(c, f"{k + 1:02d}", x + 150, y + 82, 46, (60, 60, 66), "serif", 230)
    img = dessiner(img, nuancier)
    return habiller(rarete, img, "GENGA", art.perso, voile=(40, 40, 50), voile_force=0.8)

def genga_zenkai(art, rarete="zenkai"):
    """La table lumineuse : la feuille de genga éclairée par-dessous. Le trait au crayon, les
    corrections rouge et bleu, et l'image finale en couleurs qui transparaît à travers le papier.
    Barre de calage dorée en haut, numéro de plan entouré au crayon rouge."""
    # lumière de la table : chaude au centre, qui tombe vers les bords
    d = np.sqrt(((XX - W * 0.5) / (W * 0.62)) ** 2 + ((YY - H * 0.44) / (H * 0.6)) ** 2)
    lum = np.clip(1.16 - 0.5 * d ** 1.6, 0.5, 1.16)[..., None] * np.array([1.0, 0.96, 0.88])
    feuille = papier((250, 248, 242), 0.02, 0.025, 11)
    # l'image en couleurs vue à travers la feuille : douce sur le décor, franche sur le personnage
    eclaire = np.clip(1.25 - d ** 1.6, 0, 1)                                 # 1 sous la lampe, 0 sur les bords
    k = np.clip((0.3 + 0.7 * eclaire) * (0.75 + 0.25 * flou(art.perso, 4)), 0, 0.96)[..., None]
    gm = gris(art.rgb)[..., None]
    couleur = np.clip(gm + (art.rgb - gm) * 1.25, 0, 1) ** 1.1          # couleurs un peu plus vives
    img = np.clip((feuille * (1 - k) + feuille * couleur * k) * lum, 0, 1)
    halo = flou(np.clip(gm[..., 0] - 0.72, 0, 1) * 3, 25)[..., None]          # la lumière de la table qui bave dans les clairs
    img = np.clip(img + halo * np.array([0.35, 0.3, 0.2]), 0, 1)
    # trait au crayon graphite
    t = traits(art.rgb, 1.2, p=30)
    img = melange(img, np.array([0.16, 0.15, 0.17]), (1 - t) * 0.9)
    g = gris(art.rgb)
    ombre = ((g < 0.25) * art.perso).astype(np.float32)
    bo = cv2.Canny((ombre * 255).astype(np.uint8), 50, 150).astype(np.float32) / 255
    img = melange(img, np.array([0.86, 0.16, 0.18]), flou(bo, 1.4) * 0.9)      # limite d'ombre au crayon rouge
    cl = ((g > 0.8) * art.perso).astype(np.float32)
    bl = cv2.Canny((cl * 255).astype(np.uint8), 50, 150).astype(np.float32) / 255
    img = melange(img, np.array([0.18, 0.4, 0.88]), flou(bl, 1.4) * 0.85)      # reflets au crayon bleu
    def notes(c):
        # barre de calage dorée avec ses trois tétons
        barre = skia.Paint(AntiAlias=True, Shader=skia.GradientShader.MakeLinear([(0, 300), (0, 400)],
                           [skia.Color(255, 236, 170), skia.Color(196, 140, 40), skia.Color(120, 78, 18)]))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(W / 2 - 560, 304, 1120, 92), 18, 18), barre)
        teton = skia.Paint(AntiAlias=True, Color=skia.Color(70, 44, 10))
        for x, w in ((W / 2 - 330, 120), (W / 2, 80), (W / 2 + 330, 120)):
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - w / 2, 330, w, 40), 20, 20), teton)
        # numéro de plan entouré au crayon rouge
        etiquette = skia.Paint(AntiAlias=True, Color=skia.Color(250, 246, 236, 235))
        c.save(); c.rotate(-3, W - 410, 515)
        c.drawRect(skia.Rect.MakeXYWH(W - 600, 410, 380, 210), etiquette)
        rouge = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=6, Color=skia.Color(200, 40, 44, 230))
        c.drawOval(skia.Rect.MakeXYWH(W - 560, 430, 300, 170), rouge)
        ecriture(c, "C-" + INFOS["num"], W - 520, 545, 70, (200, 40, 44), "cond")
        c.restore()
        # colonne de feuille d'exposition
        q = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=skia.Color(60, 60, 70, 150))
        for k_ in range(12):
            y = 780 + k_ * 110; c.drawLine(W - 200, y, W - 150, y, q)
            if k_ % 3 == 0: ecriture(c, str(k_ + 1), W - 205, y - 18, 30, (60, 60, 70), "bold")
    img = dessiner(img, notes)
    return habiller(rarete, img, "GENGA", art.perso, voile=(30, 20, 6), voile_force=0.6)

# ================================================================== SAKUGA
def sakuga_spectre(art, rarete="spectre"):
    """Trois images clés côte à côte, comme sur une bande de pellicule : le geste décomposé."""
    img = np.ones((H, W, 3), np.float32) * np.array([0.06, 0.05, 0.09])
    x0, y0, hh = 250, 330, 2300; ww = (W - 2 * x0 - 2 * 40) // 3
    mo = cv2.moments(art.perso); pcx, pcy = (mo["m10"] / mo["m00"] / W, mo["m01"] / mo["m00"] / H) if mo["m00"] else (0.5, 0.4)
    for k in range(3):
        ch_ = H / (1.15 + k * 0.3); cw_ = ch_ * ww / hh                     # cadrage par la hauteur : bande étroite
        x_ = np.clip((pcx + (k - 1) * 0.06) * W - cw_ / 2, 0, W - cw_); y_ = np.clip(pcy * H - ch_ / 2, 0, H - ch_)
        Mk = np.float32([[ww / cw_, 0, -x_ * ww / cw_], [0, hh / ch_, -y_ * hh / ch_]])
        m = cv2.warpAffine(art.rgb, Mk, (ww, hh), flags=cv2.INTER_LANCZOS4)
        if k < 2:
            m = m * 0.75 + cv2.GaussianBlur(m, (0, 0), 3) * 0.25
        x = x0 + k * (ww + 40); img[y0:y0 + hh, x:x + ww] = m
    def pellicule(c):
        p = skia.Paint(AntiAlias=True, Color=skia.Color(230, 230, 240, 200))
        for k in range(3):
            x = x0 + k * (ww + 40)
            ecriture(c, str(k + 1), x + 24, y0 + hh - 30, 90, (255, 255, 255), "cond", 230)
            for j in range(18):
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + j * (ww / 18) + 8, y0 - 46, ww / 18 - 16, 26), 5, 5), p)
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + j * (ww / 18) + 8, y0 + hh + 20, ww / 18 - 16, 26), 5, 5), p)
    img = dessiner(img, pellicule)
    return habiller(rarete, img, "SAKUGA", None)

def sakuga_zenkai(art, rarete="zenkai"):
    """L'impact : éclair blanc derrière le personnage, lignes de concentration noires, contre-jour."""
    fond = 1 - art.perso
    m = cv2.moments(art.perso); cx, cy = (m["m10"] / m["m00"], m["m01"] / m["m00"]) if m["m00"] else (W / 2, H / 2)
    cy = min(cy, H * 0.45)
    rr = np.hypot(XX - cx, YY - cy); th = np.arctan2(YY - cy, XX - cx)
    coul = couleur_perso(art)
    eclat = np.clip(1 - rr / (W * 0.9), 0, 1) ** 1.6
    base = palette(eclat, [(0, (10, 8, 14)), (0.45, tuple(int(v * 255) for v in coul * 0.7)), (0.8, (255, 246, 230)), (1, (255, 255, 255))])
    r = np.random.default_rng(4).random(900)
    idx = (((th + np.pi) / (2 * np.pi)) * 900).astype(int) % 900
    lignes = ((r[idx] > 0.55) * lisse(rr, 380, 900)).astype(np.float32)
    largeur_l = np.abs(np.sin(th * 450)) ** 0.3
    base = melange(base, np.array([0.03, 0.02, 0.04]), lignes * largeur_l * 0.85)
    img = melange(base, art.rgb, art.perso)
    bord = np.clip(flou(art.perso, 5) - art.perso * 0.85, 0, 1) * 2
    img = ecran(img, np.ones(3) * np.clip(bord, 0, 1)[..., None])           # contre-jour blanc
    return habiller(rarete, img, "SAKUGA", art.perso)

# ================================================================== CELLULOÏD
def celluloid_spectre(art, rarete="spectre"):
    """Le cellulo seul, posé sur la table lumineuse : fond gris chaud, ombre, trous de fixation."""
    pap = papier((196, 190, 180), 0.03, 0.04, 21)
    dx, dy = 0, -10; M = np.float32([[1, 0, dx], [0, 1, dy]])
    perso = cv2.warpAffine(art.perso, M, (W, H)); src = cv2.warpAffine(art.rgb, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    cel = aplats(src, 5) * traits(src, 1.4, p=30)[..., None]
    ombre = flou(np.roll(np.roll(perso, 36, 0), 26, 1), 16)
    img = pap * (1 - ombre[..., None] * 0.5)
    img = melange(img, cel, perso)
    gloss = lisse(1 - np.abs((XX + YY * 0.7) / (W + H) - 0.38) * 9, 0, 1) * 0.25
    img = ecran(img, np.ones(3) * gloss[..., None])
    def marques(c):
        c.drawRect(skia.Rect.MakeLTRB(230, 300, W - 230, 2620), skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=skia.Color(255, 255, 255, 150)))
        for x in (W / 2 - 300, W / 2, W / 2 + 300):
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 50, 2540, 100, 40), 20, 20), skia.Paint(AntiAlias=True, Color=skia.Color(40, 36, 32, 220)))
        ecriture(c, "B-07", W - 520, 2500, 80, (40, 36, 32), "serif", 230)
    img = dessiner(img, marques)
    return habiller(rarete, img, "CELLULOÏD", art.perso, voile=(30, 26, 22))

def celluloid_zenkai(art, rarete="zenkai"):
    """Banc multiplan : décor lointain flou, cellulo du personnage, avant-plan flou devant, rais de lumière."""
    fond = 1 - art.perso
    loin = flou(art.rgb, 22) * 0.7
    perso = art.perso; cel = aplats(art.rgb, 6) * traits(art.rgb, 1.4, p=30)[..., None]
    ombre = flou(np.roll(np.roll(perso, 50, 0), 40, 1), 26)
    img = loin * (1 - ombre[..., None] * 0.5)
    img = melange(img, cel, perso)
    # avant-plan : un morceau agrandi du décor, très flou, en bas et sur les côtés
    av = recadrer(art.rgb, 0.85, 0.85, 3.0, W, H); av = flou(av, 30)
    masque_av = np.clip(lisse(YY / H, 0.7, 0.95) * (0.6 + 0.4 * lisse(np.abs(XX / W - 0.5), 0.1, 0.5)), 0, 1)
    img = melange(img, av * 0.6, masque_av * 0.8)
    # rais de lumière entre les plaques de verre
    rais = np.clip(np.sin(XX * 0.004 + YY * 0.0025) * 0.5 + 0.5, 0, 1) ** 6 * lisse(1 - YY / H, 0.3, 1)
    img = ecran(img, np.array([1.0, 0.92, 0.75]) * (rais * 0.35)[..., None])
    return habiller(rarete, img, "CELLULOÏD", art.perso)

# ================================================================== SUMI
def soie(teinte, graine=3):
    r = np.random.default_rng(graine)
    trame = (np.sin(XX * 1.3) * np.sin(YY * 1.3)) * 0.02 + flou(r.standard_normal((H, W)).astype(np.float32), 1) * 0.02
    return np.clip(np.ones((H, W, 3), np.float32) * (np.array(teinte) / 255) + trame[..., None], 0, 1)

def sumi_mirage(art, rarete="mirage"):
    """Encre d'argent sur soie bleu nuit : le trait et les lavis deviennent lumineux."""
    g = gris(art.rgb); t = traits(art.rgb, 1.6, p=24)
    lav = flou(np.round(np.clip((g - 0.05) / 0.8, 0, 1) * 5) / 5, 2)
    img = soie((14, 22, 52))
    argent = np.array([0.82, 0.86, 0.95])
    img = melange(img, argent, lav * 0.55 * (0.3 + 0.7 * art.perso))
    d, sp = relief(1 - t, 1.2, 4, brillance=30)
    img = melange(img, np.clip(argent * (0.7 + 0.4 * d[..., None]) + sp[..., None] * 0.6, 0, 1), (1 - t) * 0.95)
    lune = np.exp(-(((XX - W * 0.72) / 260) ** 2 + ((YY - H * 0.2) / 260) ** 2)) * (1 - art.perso)
    img = ecran(img, argent * (lune * 0.6)[..., None])
    return habiller(rarete, img, "SUMI", art.perso, voile=(8, 12, 30))

def sumi_zenkai(art, rarete="zenkai"):
    """Encre noire et feuilles d'or carrées en fond, comme un paravent."""
    g = gris(art.rgb); t = traits(art.rgb, 1.7, p=22)
    lav = flou(np.round(np.clip((g - 0.08) / 0.8, 0, 1) * 5) / 5, 2)
    # feuilles d'or : carreaux de 230 px, chacun légèrement différent, joints visibles
    tx, ty = (XX // 230).astype(int), (YY // 230).astype(int)
    v = np.random.default_rng(12).random((ty.max() + 2, tx.max() + 2)).astype(np.float32)[ty, tx]
    joint = ((XX % 230 < 3) | (YY % 230 < 3)).astype(np.float32)
    d, sp = relief(flou(np.random.default_rng(3).standard_normal((H, W)).astype(np.float32), 8) * 0.3 + v * 0.7, 3, 4, brillance=24)
    feuilles = or_metal(np.clip(0.45 + 0.4 * v + 0.2 * d, 0, 1), sp * 0.5)
    feuilles = feuilles * (1 - joint[..., None] * 0.25)
    pap = papier((236, 228, 210), 0.04, 0.06, 6)
    img = melange(feuilles, pap, flou(art.perso, 3))
    encre = np.array([0.05, 0.04, 0.05])
    img = melange(img, encre, (1 - lav) * 0.85 * art.perso)
    img = melange(img, encre, (1 - t) * 0.92)
    return habiller(rarete, img, "SUMI", art.perso, voile=(20, 14, 6))

# ================================================================== HANGA
def hanga_spectre(art, rarete="spectre"):
    """Estampe à deux encres : noir et la couleur du personnage, sur papier."""
    coul = couleur_perso(art)
    g = gris(art.rgb)
    pap = papier((238, 228, 206), 0.03, 0.08, 14)
    zone = ((g < 0.55) & (g > 0.12)).astype(np.float32)
    zone = cv2.medianBlur((zone * 255).astype(np.uint8), 9).astype(np.float32) / 255
    usure = (flou(np.random.default_rng(13).random((H, W)).astype(np.float32), 2) > 0.66).astype(np.float32) * 0.3
    img = melange(pap, coul * 0.9, zone * (1 - usure) * 0.92)
    noir = (g < 0.12).astype(np.float32)
    t = cv2.erode(traits(art.rgb, 2.0, p=26), np.ones((3, 3), np.uint8))
    img = melange(img, np.array([0.1, 0.08, 0.08]), np.clip(1 - t + cv2.medianBlur((noir * 255).astype(np.uint8), 7) / 255, 0, 1) * 0.95)
    return habiller(rarete, img, "HANGA", art.perso, voile=(30, 18, 14), voile_force=0.8)

def hanga_zenkai(art, rarete="zenkai"):
    """L'estampe du personnage sur un fond de vagues d'or et de nuages stylisés."""
    small = cv2.resize(art.rgb, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    Z = small.reshape(-1, 3).astype(np.float32)
    _, lab, cen = cv2.kmeans(Z, 6, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 3, cv2.KMEANS_PP_CENTERS)
    flat = cv2.resize(cen[lab.flatten()].reshape(small.shape), (W, H), interpolation=cv2.INTER_NEAREST)
    flat = cv2.medianBlur((np.clip(flat * 1.15, 0, 1) * 255).astype(np.uint8), 7).astype(np.float32) / 255
    # fond : vagues seigaiha en or sur laque rouge sombre, nuages crème en bandes
    vag = seigaiha(90); d, sp = relief(vag, 2, 8)
    fond = melange(np.ones((H, W, 3), np.float32) * np.array([0.32, 0.05, 0.06]), or_metal(d, sp), vag * 0.9)
    nuage = np.zeros((H, W), np.float32)
    for (cy, amp) in ((H * 0.16, 60), (H * 0.62, 50)):
        bord = cy + np.sin(XX * 0.012) * amp + np.sin(XX * 0.031) * amp * 0.4
        nuage = np.maximum(nuage, ((YY > bord) & (YY < bord + 170)).astype(np.float32))
    fond = melange(fond, np.array([0.96, 0.92, 0.82]), flou(nuage, 1.5))
    img = melange(fond, flat, art.perso)
    t = cv2.erode(traits(art.rgb, 2.0, p=26), np.ones((3, 3), np.uint8))
    img = melange(img, np.array([0.1, 0.08, 0.08]), (1 - t) * art.perso * 0.95)
    return habiller(rarete, img, "HANGA", art.perso)

# ================================================================== REIATSU
def reiatsu_spectre(art, rarete="spectre"):
    """Le personnage dans le noir, seulement cerné d'un liseré d'énergie qui crépite."""
    coul = couleur_perso(art)
    img = art.rgb * (0.35 + 0.65 * art.perso[..., None])
    img = melange(img, np.array([0.02, 0.02, 0.03]), (1 - art.perso) * 0.9)
    bord = np.clip(flou(art.perso, 4) - art.perso * 0.8, 0, 1) * 2.5
    bruit = cv2.GaussianBlur(np.random.default_rng(5).standard_normal((H, W)).astype(np.float32), (0, 0), 3)
    crep = np.clip(bord * (0.6 + bruit), 0, 1)
    img = ecran(img, np.clip(coul * 1.2, 0, 1) * flou(crep, 10)[..., None] * 0.9)
    img = ecran(img, (np.ones(3) * 0.4 + coul * 0.6) * crep[..., None])
    etinc = (np.random.default_rng(7).random((H, W)) > 0.9993).astype(np.float32) * lisse(flou(art.perso, 80), 0.05, 0.25) * (1 - art.perso)
    img = ecran(img, coul * np.clip(flou(etinc, 2) * 12, 0, 1)[..., None])
    return habiller(rarete, img, "REIATSU", art.perso, voile=(4, 4, 8))

def reiatsu_zenkai(art, rarete="zenkai"):
    """Une colonne d'énergie traverse la carte de haut en bas et passe par-dessus le cadre."""
    coul = couleur_perso(art)
    img = art.rgb * (0.3 + 0.7 * art.perso[..., None])
    m = cv2.moments(art.perso); cx = m["m10"] / m["m00"] if m["m00"] else W / 2
    bruit = cv2.GaussianBlur(np.random.default_rng(4).standard_normal((H, W)).astype(np.float32), (0, 0), sigmaX=10, sigmaY=60)
    dx = XX - cx + bruit * 60
    coeur = np.exp(-(dx / 60) ** 2); halo = np.exp(-(dx / 320) ** 2)
    colonne = np.clip(coeur + halo * 0.6, 0, 1)
    img = ecran(img, np.clip(coul * 1.3, 0, 1) * (halo * 0.8)[..., None] * (1 - art.perso[..., None] * 0.7))
    img = ecran(img, np.ones(3) * coeur[..., None] * (1 - art.perso[..., None] * 0.85))
    bord = np.clip(flou(art.perso, 6) - art.perso * 0.85, 0, 1) * 2
    img = ecran(img, np.clip(coul * 1.2, 0, 1) * np.clip(bord, 0, 1)[..., None])
    carte = habiller(rarete, img, "REIATSU", art.perso, voile=(6, 4, 8))
    # la colonne casse le cadre : elle repasse par-dessus en haut et en bas
    hors = ((YY < 330) | (YY > H - 330)).astype(np.float32)
    carte = ecran(carte, np.clip(coul * 1.3, 0, 1) * (halo * 0.7 * hors)[..., None])
    carte = ecran(carte, np.ones(3) * (coeur * hors)[..., None])
    return carte

def reiatsu_liberation(art, rarete="zenkai"):
    """Libération du reiatsu : la pression spirituelle envahit la carte. L'illustration reste intacte au centre ;
    une aura de flammes à la couleur du personnage monte du bas et des bords, le pourtour plonge dans le noir,
    des braises s'élèvent. (L'animation ajoute les ondes de pression qui font vibrer l'image.)"""
    coul = couleur_perso(art); coul = np.clip((coul - coul.min()) / max(np.ptp(coul), 1e-3) * 0.85 + 0.15 * (coul.max() == coul), 0, 1)
    vive = np.clip(coul * 1.35, 0, 1)
    img = art.rgb.copy()
    nx, ny = (XX - W / 2) / (W / 2), (YY - H * 0.45) / (H * 0.55)
    bord = np.clip(np.hypot(nx * 0.95, ny * 0.8) - 0.55, 0, 1) / 0.45           # 0 au centre, 1 au pourtour
    img = img * (1 - lisse(bord, 0, 1)[..., None] * 0.8)
    rng = np.random.default_rng(4)
    bruit = cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), sigmaX=22, sigmaY=90)
    bruit = (bruit - bruit.min()) / (bruit.max() - bruit.min())
    fin = cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), sigmaX=6, sigmaY=30)
    fin = (fin - fin.min()) / (fin.max() - fin.min())
    # les flammes : fortes en bas, montent le long des bords
    base = np.clip(lisse(YY / H, 0.45, 1.0) * 0.9 + lisse(bord, 0.2, 1) * 0.7, 0, 1)
    fl = np.clip(base * (0.3 + bruit * 1.1) * (0.7 + fin * 0.6) - 0.25, 0, 1) / 0.75
    img = ecran(img, palette(fl, [(0, (0, 0, 0)), (0.35, tuple(coul * 90)), (0.7, tuple(vive * 255)), (1, (255, 250, 238))]))
    # braises
    br = (rng.random((H, W)) > 0.9993).astype(np.float32) * lisse(YY / H, 0.15, 0.8)
    img = ecran(img, (vive * 0.6 + 0.4) * np.clip(flou(br, 2.5) * 10 + flou(br, 9) * 25, 0, 1)[..., None])
    return habiller(rarete, img, "REIATSU", art.perso, voile=(6, 4, 8))

VARIANTES = {
    "genga": {"spectre": genga, "mirage": genga_mirage, "zenkai": genga_zenkai},
    "sakuga": {"spectre": sakuga_spectre, "mirage": sakuga, "zenkai": sakuga_zenkai},
    "celluloid": {"spectre": celluloid_spectre, "mirage": celluloid, "zenkai": celluloid_zenkai},
    "sumi": {"spectre": sumi, "mirage": sumi_mirage, "zenkai": sumi_zenkai},
    "hanga": {"spectre": hanga_spectre, "mirage": hanga, "zenkai": hanga_zenkai},
    "reiatsu": {"spectre": reiatsu_spectre, "mirage": reiatsu, "zenkai": reiatsu_liberation},
}

def carte(e, n):
    cle = f"{e['anime_cfg']}-{e['id']}"
    art = Art(f"sources/{cle}_x4.png", f"sources/{cle}_masque.png", e["cad"].get("x", 0.5), e["cad"].get("y", 0.3))
    art.proteger(e.get("proteger", []))
    INFOS.update(nom=e["nom"].translate(str.maketrans("ŌōŪūĀā", "OoUuAa")).upper(), anime=e["anime"].upper(), num=f"{n:03d}", total="108", droits=e["credit"])
    return finir(VARIANTES[e["sp"]][e["r"]](art, e["r"]))


# ================================================================== SAKUGA v2
def sakuga_ligne(art, rarete="spectre"):
    """Essai de trait (fixe) : le personnage au crayon sur papier d'animation, l'image d'avant en rouge,
    celle d'après en bleu, et la couleur qui commence à apparaître sur l'image clé."""
    pap = papier((246, 244, 238), 0.025, 0.03, 4)
    def deplace(a, u):
        M = np.float32([[1 + 0.06 * u, 0, -W * 0.03 * u + 130 * u], [0, 1 + 0.06 * u, -H * 0.03 * u - 45 * u]])
        return cv2.warpAffine(a, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    av, ap = traits(deplace(art.rgb, -0.25), 1.3, p=28), traits(deplace(art.rgb, 0.55), 1.3, p=28)
    img = melange(pap, np.array([0.86, 0.2, 0.2]), (1 - av) * 0.5)
    img = melange(img, np.array([0.2, 0.42, 0.86]), (1 - ap) * 0.5)
    cur = deplace(art.rgb, 0.15); pm = deplace(art.perso, 0.15)
    img = melange(img, cur, pm * 0.28)
    img = melange(img, np.array([0.17, 0.17, 0.19]), (1 - traits(cur, 1.2, p=30)) * 0.92)
    return habiller(rarete, img, "SAKUGA", None, voile=(40, 40, 50), voile_force=0.8)

def sakuga_impact(art, rarete="mirage"):
    """Les images d'impact : trois bandes en diagonale, l'image normale, son négatif noir et blanc,
    et une version en aplats néon, comme les images de choc glissées dans une scène d'action."""
    g = gris(art.rgb)
    neg = np.clip(1 - g, 0, 1); neg = np.where(neg > 0.55, 1.0, np.where(neg > 0.3, 0.45, 0.0)).astype(np.float32)
    neg = np.dstack([neg] * 3)
    coul = couleur_perso(art)
    neon = np.where((g > 0.45)[..., None], np.clip(coul * 1.3 + 0.2, 0, 1), np.array([0.05, 0.02, 0.1])).astype(np.float32)
    neon = melange(neon, np.ones(3), (1 - traits(art.rgb, 1.4, p=30)) * 0.9)
    d = (XX / W) * 0.6 + (YY / H) * 0.8
    b1 = lisse(d, 0.47, 0.475); b2 = lisse(d, 0.86, 0.865)
    img = art.rgb * (1 - b1[..., None]) + neg * (b1 * (1 - b2))[..., None] + neon * b2[..., None]
    trait = np.exp(-((d - 0.4725) / 0.003) ** 2) + np.exp(-((d - 0.8625) / 0.003) ** 2)
    img = ecran(img, np.ones(3) * np.clip(trait, 0, 1)[..., None])
    return habiller(rarete, img, "SAKUGA", None)

def arriere_plan(art, rgb, perso):
    """Le décor sans les personnages (bouché par inpainting) pour la profondeur."""
    m = (cv2.dilate((perso > 0.3).astype(np.uint8), np.ones((15, 15), np.uint8)) * 255)
    return cv2.inpaint((rgb * 255).astype(np.uint8), m, 7, cv2.INPAINT_TELEA).astype(np.float32) / 255

def sakuga_profondeur(art, rarete="zenkai"):
    """Caméra 2.5D (fixe) : les personnages détachés du décor, le décor étiré par la vitesse,
    lignes de concentration et particules d'or seulement derrière eux."""
    art.perso = np.maximum(art.perso, flou(art.large, 2))
    petit_rgb = cv2.resize(art.rgb, (W // 2, H // 2)); petit_m = cv2.resize(art.perso, (W // 2, H // 2))
    decor = cv2.resize(arriere_plan(art, petit_rgb, petit_m), (W, H), interpolation=cv2.INTER_CUBIC)
    m = cv2.moments(art.perso); cx, cy = (m["m10"] / m["m00"], m["m01"] / m["m00"]) if m["m00"] else (W / 2, H / 2)
    # flou radial du décor (zoom de caméra)
    acc = np.zeros_like(decor)
    for k in range(8):
        s = 1 + k * 0.012; M = cv2.getRotationMatrix2D((cx, cy), 0, s)
        acc += cv2.warpAffine(decor, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    decor = acc / 8 * 0.8
    rr = np.hypot(XX - cx, YY - cy); th = np.arctan2(YY - cy, XX - cx)
    r = np.random.default_rng(4).random(700); idx = (((th + np.pi) / (2 * np.pi)) * 700).astype(int) % 700
    lignes = (r[idx] > 0.7) * lisse(rr, 500, 1100)
    decor = ecran(decor, np.array([1.0, 0.85, 0.5]) * (lignes * 0.45)[..., None])
    parts = (np.random.default_rng(9).random((H, W)) > 0.9992).astype(np.float32)
    parts = np.clip(cv2.GaussianBlur(parts, (0, 0), sigmaX=1.5, sigmaY=9) * 30, 0, 1)
    decor = ecran(decor, np.array([1.0, 0.82, 0.4]) * parts[..., None])
    ombre = flou(art.perso, 20) * 0.5
    img = decor * (1 - ombre[..., None]) 
    img = melange(img, art.rgb, art.perso)
    bord = np.clip(flou(art.perso, 4) - art.perso * 0.85, 0, 1) * 1.6
    img = ecran(img, np.array([1.0, 0.86, 0.5]) * np.clip(bord, 0, 1)[..., None])
    return habiller(rarete, img, "SAKUGA", art.perso)

VARIANTES["sakuga"] = {"spectre": sakuga_ligne, "mirage": sakuga_impact, "zenkai": sakuga_profondeur}


def sakuga_remanence(art, rarete="mirage"):
    """Les images rémanentes : la vraie image reste nette au premier plan ; derrière le personnage,
    trois copies fantômes décalées dans le sens du geste (le « smear » du sakuga), teintées de sa
    couleur, et le décor filé par la vitesse avec des traits d'action."""
    perso = np.maximum(art.perso, flou(art.large, 2)) if hasattr(art, "large") else art.perso
    if perso.mean() < 0.03:          # détourage vide (image d'action très chargée) : on garde nette toute la zone centrale
        el = ((XX - W * 0.5) / (W * 0.46)) ** 2 + ((YY - H * 0.46) / (H * 0.44)) ** 2
        perso = np.clip((1.15 - el) / 0.5, 0, 1).astype(np.float32)
    coul = couleur_perso(art)
    petit_rgb = cv2.resize(art.rgb, (W // 2, H // 2)); petit_m = cv2.resize(perso, (W // 2, H // 2))
    decor = cv2.resize(arriere_plan(art, petit_rgb, petit_m), (W, H), interpolation=cv2.INTER_CUBIC)
    # sens du mouvement : diagonale montante vers la droite ; le décor est filé dans ce sens
    ang = np.deg2rad(-28); dx, dy = np.cos(ang), np.sin(ang)
    L = 61; k = np.zeros((L, L), np.float32)
    for t in range(L): k[int(L / 2 + (t - L / 2) * dy), int(L / 2 + (t - L / 2) * dx)] = 1
    decor = cv2.filter2D(decor, -1, k / k.sum(), borderType=cv2.BORDER_REFLECT) * 0.82
    # traits d'action le long du mouvement
    r = np.random.default_rng(12); proj = (XX * -dy + YY * dx)
    bande = r.random(1400); idx = ((proj - proj.min()) / (proj.max() - proj.min()) * 1399).astype(int)
    traitsv = (bande[idx] > 0.93).astype(np.float32) * (0.35 + 0.65 * r.random(1400)[idx])
    long_ = flou(r.random((H, W)).astype(np.float32), 40); long_ = (long_ - long_.min()) / (long_.max() - long_.min())
    traitsv *= lisse(long_, 0.45, 0.6)
    img = ecran(decor, np.ones(3) * (traitsv * 0.55)[..., None])
    # trois rémanences derrière le personnage, de la plus lointaine à la plus proche
    for n, (dist, a) in enumerate(((330, 0.3), (220, 0.42), (110, 0.56))):
        M = np.float32([[1, 0, -dx * dist], [0, 1, -dy * dist]])
        g = cv2.warpAffine(art.rgb, M, (W, H), borderMode=cv2.BORDER_REFLECT)
        gm = cv2.warpAffine(perso, M, (W, H)) * (1 - perso)
        teinte = np.clip(g * 0.45 + coul * 0.75, 0, 1)
        img = melange(img, teinte, flou(gm, 3) * a)
        bord = np.clip(flou(gm, 3) - flou(gm, 9), 0, 1) * 2.5
        img = ecran(img, coul * (np.clip(bord, 0, 1) * a)[..., None])
    # la vraie image, nette, avec un liseré lumineux côté mouvement
    img = melange(img, art.rgb, perso)
    bord = np.clip(flou(perso, 5) - perso * 0.9, 0, 1) * 1.8
    img = ecran(img, np.clip(coul * 0.6 + 0.5, 0, 1) * np.clip(bord, 0, 1)[..., None])
    def minutage(c):                 # minutage d'animateur : on 1s (une image par frame)
        p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=4, Color=skia.Color(240, 240, 250, 190))
        for k_ in range(6):
            x = W - 560 + k_ * 62; c.drawLine(x, 330, x, 330 + (46 if k_ % 2 == 0 else 26), p)
        ecriture(c, "1s", W - 560, 430, 44, (240, 240, 250), "cond", 200)
    img = dessiner(img, minutage)
    return habiller(rarete, img, "SAKUGA", None)

VARIANTES["sakuga"]["mirage"] = sakuga_remanence

if __name__ == "__main__":
    sel = json.load(open("selection.json")); filtre = sys.argv[1:]
    for n, e in enumerate(sel, 1):
        if filtre and e["sp"] not in filtre and f"{e['sp']}:{e['r']}" not in filtre: continue
        t = time.time(); carte(e, n * 3 + 11).save(f"sortie/v_{e['sp']}_{e['r']}.png"); print(e["sp"], e["r"], e["nom"], round(time.time() - t, 1), "s", flush=True)
