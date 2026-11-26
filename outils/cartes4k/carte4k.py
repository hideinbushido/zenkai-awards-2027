"""Cartes ZENKAI en 4K (2400 x 3352) : cadres vectoriels dessinés par le code, matières calculées en calques.
Une fonction par rareté. Les calques communs : illustration agrandie, silhouette du personnage (pour les
effets de fond et le débordement du cadre), textes, emblème."""
import os
from chemins import BASE, SOURCES, SORTIE_LOT
import numpy as np, cv2, skia
from PIL import Image

W, H = 2400, 3352
R = 118                       # rayon des coins
P = os.path.join(BASE, "polices") + os.sep
TF = {k: skia.Typeface.MakeFromFile(P + f) for k, f in {
    "cond": "archivo-cond-black.ttf", "black": "archivo-black.ttf", "bold": "archivo-bold.ttf",
    "semi": "archivo-semi.ttf", "xcond": "archivo-xbold-cond.ttf", "serif": "serif-italique.ttf", "mono": "michroma.ttf"}.items()}

# ---------------------------------------------------------------- outils
def toile():
    s = skia.Surface(W, H); c = s.getCanvas(); c.clear(skia.ColorTRANSPARENT); return s, c

def tableau(s):
    return s.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType).astype(np.float32) / 255

def masque(dessin, aa=True):
    s, c = toile(); p = skia.Paint(AntiAlias=aa, Color=skia.ColorWHITE); dessin(c, p); return tableau(s)[..., 3]

def rrect(inset, r):
    return skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(inset, inset, W - inset, H - inset), r, r)

def lisse(v, a, b):
    t = np.clip((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def flou(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)

def melange(fond, rgb, a):
    a = a[..., None] if a.ndim == 2 else a
    return fond * (1 - a) + rgb * a

def ecran(a, b): return 1 - (1 - a) * (1 - b)

YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)

def relief(m, rayon=6, force=9.0, lumiere=(-0.55, -0.75, 0.62), brillance=40):
    """Ombrage d'un masque comme une pièce de métal en relief : diffuse et spéculaire."""
    h = flou(m, rayon)
    gx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3) * force; gy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3) * force
    n = np.dstack([-gx, -gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    L = np.array(lumiere, np.float32); L /= np.linalg.norm(L)
    d = np.clip((n * L).sum(2), 0, 1)
    Hh = L + np.array([0, 0, 1], np.float32); Hh /= np.linalg.norm(Hh)
    sp = np.clip((n * Hh).sum(2), 0, 1) ** brillance
    return d, sp

def brosse(sigma_x=60, graine=1, angle=0):
    rng = np.random.default_rng(graine); n = rng.random((H, W)).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), sigmaX=sigma_x, sigmaY=0.8)
    n = (n - n.mean()) / (n.std() + 1e-6)
    return n

def palette(t, pts):
    """Dégradé multi-arrêts : pts = [(pos, (r,g,b)), ...] avec couleurs 0-255."""
    t = np.clip(t, 0, 1); out = np.zeros(t.shape + (3,), np.float32)
    pos = np.array([p for p, _ in pts], np.float32); cols = np.array([c for _, c in pts], np.float32) / 255
    for k in range(3): out[..., k] = np.interp(t, pos, cols[:, k])
    return out

def arcenciel(t, sat=0.55, lum=0.78):
    """Teinte irisée douce (pas un arc-en-ciel criard) : cosinus décalés."""
    r = 0.5 + 0.5 * np.cos(6.2832 * (t + 0.00)); g = 0.5 + 0.5 * np.cos(6.2832 * (t + 0.33)); b = 0.5 + 0.5 * np.cos(6.2832 * (t + 0.67))
    c = np.dstack([r, g, b]); return lum + (c - 0.5) * sat

def or_metal(d, sp, grain=None):
    t = d * 0.85 + (0.08 * grain if grain is not None else 0)
    c = palette(t, [(0, (58, 34, 12)), (0.35, (150, 98, 38)), (0.62, (226, 178, 92)), (0.82, (250, 222, 150)), (1, (255, 246, 214))])
    return np.clip(c + sp[..., None] * 0.9, 0, 1)

def argent_metal(d, sp, grain=None):
    t = d * 0.85 + (0.07 * grain if grain is not None else 0)
    c = palette(t, [(0, (38, 40, 46)), (0.4, (122, 126, 136)), (0.7, (196, 200, 210)), (1, (246, 248, 252))])
    return np.clip(c + sp[..., None] * 0.9, 0, 1)

# ---------------------------------------------------------------- illustration
class Art:
    def proteger(self, zones):
        """Ajoute à la silhouette des zones importantes du décor (en fractions de l'image source : x, y, rayon x, rayon y),
        pour qu'aucun effet ne les floute ni ne les cache (ex. Gogeta en silhouette au-dessus de Goku et Vegeta)."""
        w, h, ox, oy = self.geo
        for (x, y, rx, ry) in zones:
            m = np.zeros((H, W), np.float32)
            cv2.ellipse(m, (int(x * w - ox), int(y * h - oy)), (int(rx * w), int(ry * h)), 0, 0, 360, 1.0, -1)
            self.perso = np.maximum(self.perso, cv2.GaussianBlur(m, (0, 0), 25))

    def __init__(self, img, msk, cx=0.5, cy=0.3, zoom=1.0):
        im = Image.open(img).convert("RGB"); mk = Image.open(msk).convert("L").resize(im.size, Image.BICUBIC)
        r = max(W / im.width, H / im.height) * zoom
        w, h = int(im.width * r + 0.5), int(im.height * r + 0.5)
        im = im.resize((w, h), Image.LANCZOS); mk = mk.resize((w, h), Image.BICUBIC)
        ox, oy = int((w - W) * cx), int((h - H) * cy)
        self.geo = (w, h, ox, oy)
        self.rgb = np.asarray(im.crop((ox, oy, ox + W, oy + H))).astype(np.float32) / 255
        m = np.asarray(mk.crop((ox, oy, ox + W, oy + H))).astype(np.float32) / 255
        self.perso = np.clip((m - 0.25) / 0.6, 0, 1)            # silhouette nette pour les effets
        self.large = np.clip((m - 0.1) / 0.3, 0, 1)             # silhouette généreuse : tous les personnages, même à moitié détectés

def coins():
    return masque(lambda c, p: c.drawRRect(rrect(0, R), p))

# ---------------------------------------------------------------- textes
def texte(c, s, x, y, tf, taille, paint, espace=0.0, skew=0.0):
    f = skia.Font(TF[tf], taille); f.setSubpixel(True); f.setEdging(skia.Font.Edging.kSubpixelAntiAlias)
    c.save(); c.translate(x, y)
    if skew: c.skew(skew, 0)
    if espace:
        cx = 0
        for ch in s:
            c.drawString(ch, cx, 0, f, paint); cx += f.measureText(ch) + espace * taille
    else:
        c.drawString(s, 0, 0, f, paint)
    c.restore()

def largeur(s, tf, taille, espace=0.0):
    f = skia.Font(TF[tf], taille); return f.measureText(s) + espace * taille * len(s)

def couche_texte(dessin):
    s, c = toile(); dessin(c); return tableau(s)

def poser(fond, couche):
    return melange(fond, couche[..., :3] / np.maximum(couche[..., 3:], 1e-4), couche[..., 3])

def degrade(x0, y0, x1, y1, cols, pos=None):
    return skia.GradientShader.MakeLinear([skia.Point(x0, y0), skia.Point(x1, y1)], [skia.Color(*c) for c in cols], pos)

EMBLEME = np.asarray(Image.open(os.path.join(BASE, "embleme.png")).convert("RGBA")).astype(np.float32)[..., 3] / 255

def emblème_masque(cx, cy, taille):
    e = cv2.resize(EMBLEME, (int(taille), int(taille * EMBLEME.shape[0] / EMBLEME.shape[1])), interpolation=cv2.INTER_AREA)
    m = np.zeros((H, W), np.float32); h, w = e.shape; x0, y0 = int(cx - w / 2), int(cy - h / 2)
    m[y0:y0 + h, x0:x0 + w] = e; return m

INFOS = dict(nom="ICHIGO KUROSAKI", anime="BLEACH", type="PERSONNAGE", num="029", total="066",
             droits="© Tite Kubo / Shueisha, TV Tokyo, dentsu, Pierrot")

# ---------------------------------------------------------------- éléments communs
def bandeau_haut(c, couleur_marque, couleur_txt, fond=(10, 9, 14, 170), contour=None, x=150, y=150):
    """Plaque en haut à gauche : ZENKAI penché comme le logo officiel, code de série et numéro."""
    h = 104; w = 840
    p = skia.Paint(AntiAlias=True, Color=skia.Color(*fond))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), h / 2, h / 2), p)
    if contour:
        q = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=skia.Color(*contour))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), h / 2, h / 2), q)
    pm = skia.Paint(AntiAlias=True); pm.setShader(couleur_marque(x + 40, y + 20, x + 330, y + 90))
    texte(c, "ZENKAI", x + 44, y + 78, "black", 66, pm, skew=-0.22)
    pt = skia.Paint(AntiAlias=True, Color=skia.Color(*couleur_txt))
    texte(c, f"ZK27   {INFOS['num']} / {INFOS['total']}", x + 380, y + 66, "bold", 30, pt, espace=0.12)

def droits(c, couleur=(255, 255, 255, 150), y=H - 92):
    p = skia.Paint(AntiAlias=True, Color=skia.Color(*couleur))
    t = INFOS["droits"]; texte(c, t, W / 2 - largeur(t, "semi", 26) / 2, y, "semi", 26, p)

def voile_bas(img, couleur, haut=0.56, force=0.92):
    t = lisse(YY / H, haut, 1.0) * force
    return melange(img, np.array(couleur, np.float32) / 255, t)

# ================================================================ ÉCLAT : argent brossé, sobre
def eclat(art):
    img = art.rgb.copy()
    img = voile_bas(img, (8, 8, 12), 0.58, 0.9)
    bande = masque(lambda c, p: (c.drawDRRect(rrect(0, R), rrect(64, R - 50), p)))
    filet = masque(lambda c, p: (p.setStyle(skia.Paint.kStroke_Style), p.setStrokeWidth(5), c.drawRRect(rrect(82, R - 64), p)))
    d, sp = relief(bande, 5, 10)
    metal = argent_metal(d, sp, brosse(80, 3))
    img = melange(img, metal, bande)
    img = melange(img, np.array([0.86, 0.88, 0.92]), filet * 0.85)
    # ombre intérieure du cadre
    om = flou(bande, 18) * (1 - bande); img *= (1 - om[..., None] * 0.55)
    def txt(c):
        bandeau_haut(c, lambda a, b, cc, dd: degrade(a, b, cc, dd, [(255, 255, 255), (150, 156, 168), (240, 242, 248)]), (230, 232, 238, 230), contour=(200, 205, 215, 120))
        pn = skia.Paint(AntiAlias=True); pn.setShader(degrade(0, 2850, 0, 3060, [(255, 255, 255), (196, 200, 210)]))
        texte(c, INFOS["nom"], 160, 3030, "cond", 236, pn)
        pa = skia.Paint(AntiAlias=True, Color=skia.Color(200, 204, 214))
        texte(c, INFOS["type"], 166, 2770, "bold", 38, pa, espace=0.32)
        texte(c, INFOS["anime"], 166, 3125, "bold", 44, pa, espace=0.38)
        texte(c, "ÉCLAT", W - 160 - largeur("ÉCLAT", "bold", 34, 0.3), 3125, "bold", 34, pa, espace=0.3)
        droits(c)
    img = poser(img, couche_texte(txt))
    em = emblème_masque(W - 250, 2930, 150); d2, s2 = relief(em, 2, 6)
    img = melange(img, argent_metal(d2, s2), em)
    return img

# ================================================================ PRISME : feuille irisée à facettes
def facettes(taille=150, graine=7):
    """Pavage de triangles : chaque facette reçoit sa propre teinte, comme un film prismatique."""
    rng = np.random.default_rng(graine)
    gx = (XX / taille); gy = (YY / (taille * 0.866))
    row = np.floor(gy); xs = gx + (row % 2) * 0.5; col = np.floor(xs)
    fx = xs - col; fy = gy - row; haut = (fx + fy * 0.5 > 0.5 + (fy - 0.5) * 0) .astype(np.float32)
    tri = (fy > np.abs(fx - 0.5) * 2).astype(np.float32)
    ident = (row * 977 + col * 131 + tri * 53) % 997
    val = rng.random(1000).astype(np.float32)[ident.astype(int)]
    bord = np.minimum(np.abs(fy - np.abs(fx - 0.5) * 2), np.minimum(fy, 1 - fy))
    return val, bord

def prisme(art):
    img = art.rgb.copy()
    img = voile_bas(img, (14, 10, 26), 0.58, 0.88)
    val, bord = facettes(58)
    ang = np.arctan2(YY - H / 2, XX - W / 2) / 6.2832
    teinte = ang * 1.0 + val * 0.35 + (XX + YY) / (W + H) * 0.6
    foil = arcenciel(teinte, sat=0.95, lum=0.62)
    arete = (1 - lisse(bord, 0.0, 0.05))[..., None]
    rng = np.random.default_rng(11); pail = (rng.random((H, W)) > 0.9985).astype(np.float32)
    pail = np.clip(flou(pail, 1.2) * 9, 0, 1)[..., None]
    foil = np.clip(foil * (0.75 + 0.5 * val[..., None]) + arete * 0.35 + pail, 0, 1)
    bande = masque(lambda c, p: c.drawDRRect(rrect(0, R), rrect(84, R - 66), p))
    d, sp = relief(bande, 6, 10)
    cadre = np.clip(foil * (0.3 + 0.95 * d[..., None]) + sp[..., None] * 0.9, 0, 1)
    img = melange(img, cadre, bande)
    # filets dorés pâles de part et d'autre de la bande
    for ins, ep in ((84, 6), (100, 2.5)):
        f = masque(lambda c, p, ins=ins, ep=ep: (p.setStyle(skia.Paint.kStroke_Style), p.setStrokeWidth(ep), c.drawRRect(rrect(ins, R - ins * 0.7), p)))
        img = melange(img, np.array([1.0, 0.95, 0.85]), f * 0.9)
    # diamants taillés dans les coins
    def diamants(c, p):
        for (x, y) in ((92, 92), (W - 92, 92), (92, H - 92), (W - 92, H - 92)):
            c.save(); c.translate(x, y); c.rotate(45); c.drawRect(skia.Rect.MakeXYWH(-30, -30, 60, 60), p); c.restore()
    dm = masque(diamants); dd, ds = relief(dm, 3, 12)
    img = melange(img, np.clip(arcenciel(teinte + 0.3, 0.6, 0.85) * (0.5 + 0.6 * dd[..., None]) + ds[..., None], 0, 1), dm)
    # éclat prismatique discret sur le fond de l'illustration (pas sur le personnage)
    fond = (1 - art.perso) * (1 - bande) * lisse(YY / H, 0.0, 0.2) * (1 - lisse(YY / H, 0.6, 0.85))
    img = melange(img, ecran(img, foil * 0.6), fond * 0.28)
    def txt(c):
        bandeau_haut(c, lambda a, b, cc, dd: degrade(a, b, cc, dd, [(255, 214, 236), (190, 230, 255), (255, 246, 196)]), (245, 240, 255, 235), fond=(16, 12, 30, 190), contour=(255, 255, 255, 90), x=170, y=170)
        pn = skia.Paint(AntiAlias=True)
        pn.setShader(degrade(170, 0, 2200, 0, [(255, 210, 238), (200, 236, 255), (255, 250, 210), (214, 200, 255)]))
        texte(c, INFOS["nom"], 176, 3010, "cond", 236, pn)
        pa = skia.Paint(AntiAlias=True, Color=skia.Color(236, 230, 255))
        texte(c, INFOS["type"], 182, 2750, "bold", 38, pa, espace=0.32)
        texte(c, INFOS["anime"], 182, 3105, "bold", 44, pa, espace=0.38)
        texte(c, "PRISME", W - 176 - largeur("PRISME", "bold", 34, 0.3), 3105, "bold", 34, pa, espace=0.3)
        droits(c, y=H - 118)
    img = poser(img, couche_texte(txt))
    em = emblème_masque(W - 270, 2910, 150); d2, s2 = relief(em, 2, 6)
    img = melange(img, np.clip(arcenciel(teinte + 0.15, 0.7, 0.85) * (0.6 + 0.5 * d2[..., None]) + s2[..., None], 0, 1), em)
    return img

# ================================================================ SPECTRE : spectral, lignes gravées, aberration
def spectre(art):
    base = art.rgb.copy()
    # aberration chromatique croissante vers les bords
    k = np.clip(np.hypot((XX - W / 2) / W, (YY - H / 2) / H) * 2 - 0.4, 0, 1)
    dec = 10
    r = cv2.remap(base[..., 0], XX + dec * k, YY, cv2.INTER_LINEAR); b = cv2.remap(base[..., 2], XX - dec * k, YY, cv2.INTER_LINEAR)
    img = np.dstack([r, base[..., 1], b])
    # le fond vire au violet nuit, le personnage reste
    gris = img.mean(2, keepdims=True)
    teinte = palette(gris[..., 0] * 1.2, [(0, (8, 6, 22)), (0.5, (70, 40, 140)), (1, (190, 230, 255))])
    fond = 1 - art.perso
    img = melange(img, teinte, fond * 0.72)
    # lignes gravées holographiques (fines, diagonales, irisées) sur le fond
    lignes = (0.5 + 0.5 * np.sin((XX * 0.8 + YY) * 0.21)) ** 6
    holo = arcenciel((XX - YY) / (W + H) * 2.2 + 0.55, 0.8, 0.75)
    img = ecran(img, holo * (lignes * fond * 0.35)[..., None])
    # vignette spectrale
    v = lisse(np.hypot((XX - W / 2) / (W * 0.62), (YY - H * 0.46) / (H * 0.62)), 0.6, 1.08)
    img = melange(img, np.array([0.03, 0.02, 0.08]), v * 0.85)
    img = voile_bas(img, (6, 4, 16), 0.6, 0.85)
    # double filet irisé lumineux, sans cadre plein
    halo = np.zeros((H, W), np.float32)
    for ins, ep in ((56, 7), (80, 2.5)):
        f = masque(lambda c, p, ins=ins, ep=ep: (p.setStyle(skia.Paint.kStroke_Style), p.setStrokeWidth(ep), c.drawRRect(rrect(ins, R - ins * 0.6), p)))
        halo = np.maximum(halo, f)
    glow = flou(halo, 14) * 1.6
    hc = arcenciel((XX + YY * 0.4) / W * 0.8 + 0.5, 0.7, 0.8)
    img = ecran(img, hc * np.clip(glow, 0, 1)[..., None] * 0.7)
    img = melange(img, np.clip(hc + 0.25, 0, 1), halo)
    def txt(c):
        bandeau_haut(c, lambda a, b, cc, dd: degrade(a, b, cc, dd, [(170, 240, 255), (220, 190, 255)]), (210, 230, 255, 230), fond=(6, 4, 18, 200), contour=(150, 220, 255, 110), x=150, y=150)
        # nom en contour lumineux
        f = skia.Font(TF["cond"], 236); blob = skia.TextBlob.MakeFromString(INFOS["nom"], f)
        g = skia.Paint(AntiAlias=True, Color=skia.Color(120, 210, 255, 110), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9))
        c.drawTextBlob(blob, 160, 3030, g)
        c.drawTextBlob(blob, 160, 3030, skia.Paint(AntiAlias=True, Color=skia.Color(8, 6, 22, 150)))
        pc = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=6)
        pc.setShader(degrade(160, 0, 2100, 0, [(170, 240, 255), (230, 200, 255), (170, 240, 255)]))
        c.drawTextBlob(blob, 160, 3030, pc)
        pa = skia.Paint(AntiAlias=True, Color=skia.Color(190, 220, 255))
        texte(c, INFOS["type"], 166, 2770, "bold", 38, pa, espace=0.32)
        texte(c, INFOS["anime"], 166, 3125, "bold", 44, pa, espace=0.38)
        texte(c, "SPECTRE", W - 160 - largeur("SPECTRE", "bold", 34, 0.3), 3125, "bold", 34, pa, espace=0.3)
        droits(c, (200, 220, 255, 140))
    img = poser(img, couche_texte(txt))
    em = emblème_masque(W - 260, 2925, 150)
    img = ecran(img, np.array([0.55, 0.85, 1.0]) * flou(em, 10)[..., None] * 0.9)
    img = melange(img, np.array([0.85, 0.95, 1.0]), em)
    return img

# ================================================================ MIRAGE : feuille texturée en vagues de chaleur
def mirage(art):
    img = art.rgb.copy()
    cy, cx = H * 0.36, W * 0.47
    rr = np.hypot(XX - cx, (YY - cy) * 0.92); th = np.arctan2(YY - cy, XX - cx)
    ondes = np.sin(rr * 0.085 + np.sin(th * 7) * 1.4 + np.sin(rr * 0.008) * 2)
    haut = (0.5 + 0.5 * ondes).astype(np.float32)
    fond = (1 - art.perso)
    # relief de la feuille : les vagues sont estampées dans le fond
    d, sp = relief(haut * fond, 1.5, 6, brillance=26)
    chaud = palette(img.mean(2) * 1.1, [(0, (40, 10, 24)), (0.45, (180, 70, 90)), (0.8, (255, 180, 120)), (1, (255, 240, 200))])
    img = melange(img, chaud, fond * 0.45)
    irise = arcenciel(rr / 1400 + 0.05, 0.45, 0.85)
    img = np.clip(img * (0.82 + 0.3 * d[..., None] * fond[..., None] + 0.18 * (1 - fond[..., None])) + (sp * fond)[..., None] * irise * 0.55, 0, 1)
    img = voile_bas(img, (24, 6, 16), 0.6, 0.86)
    # cadre : filet d'or fin et équerres aux coins, rien de plus
    f = masque(lambda c, p: (p.setStyle(skia.Paint.kStroke_Style), p.setStrokeWidth(6), c.drawRRect(rrect(64, R - 40), p)))
    def equerres(c, p):
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(16); p.setStrokeCap(skia.Paint.kSquare_Cap)
        L = 210; m = 100
        for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
            x0 = m if sx > 0 else W - m; y0 = m if sy > 0 else H - m
            path = skia.Path(); path.moveTo(x0, y0 + sy * L); path.lineTo(x0, y0); path.lineTo(x0 + sx * L, y0); c.drawPath(path, p)
    eq = masque(equerres)
    dd, ss = relief(np.maximum(f, eq), 2, 7)
    img = melange(img, or_metal(dd, ss), np.maximum(f, eq))
    def txt(c):
        bandeau_haut(c, lambda a, b, cc, dd: degrade(a, b, cc, dd, [(255, 236, 190), (255, 170, 150), (255, 232, 170)]), (255, 232, 214, 235), fond=(30, 8, 18, 185), contour=(255, 200, 160, 110), x=150, y=150)
        # nom à la manière d'AUGE : grotesque grasse + italique serif
        pn = skia.Paint(AntiAlias=True); pn.setShader(degrade(0, 2860, 0, 3050, [(255, 246, 222), (255, 196, 150)]))
        texte(c, "ICHIGO", 160, 3030, "cond", 236, pn)
        texte(c, "Kurosaki", 160 + largeur("ICHIGO", "cond", 236) + 30, 3030, "serif", 230, pn)
        pa = skia.Paint(AntiAlias=True, Color=skia.Color(255, 220, 200))
        texte(c, INFOS["type"], 166, 2770, "bold", 38, pa, espace=0.32)
        texte(c, INFOS["anime"], 166, 3125, "bold", 44, pa, espace=0.38)
        texte(c, "MIRAGE", W - 160 - largeur("MIRAGE", "bold", 34, 0.3), 3125, "bold", 34, pa, espace=0.3)
        droits(c, (255, 220, 200, 140))
    img = poser(img, couche_texte(txt))
    em = emblème_masque(W - 260, 2925, 150); d2, s2 = relief(em, 2, 6)
    img = melange(img, or_metal(d2, s2), em)
    return img

# ================================================================ ZENKAI : laque noire et or, vagues seigaiha, le personnage sort du cadre
def seigaiha(r=70):
    """Motif de vagues japonaises : écailles d'arcs concentriques."""
    out = np.zeros((H, W), np.float32)
    for dy, dx in ((0, 0), (0.5, 0.5)):
        cy = (np.floor(YY / r - dy) + dy + 1) * r; cx = (np.round(XX / (2 * r) - dx) + dx) * 2 * r
        d = np.hypot(XX - cx, YY - cy); arcs = (0.5 + 0.5 * np.cos(d / r * 3 * 6.2832)) ** 3 * (d < r)
        out = np.where((d < r) & (YY < cy), np.maximum(out, arcs), out)
    return out

def zenkai(art):
    img = art.rgb.copy()
    fond = 1 - art.perso
    # fond : ton laque noire et or, gravure de lignes fines dorées
    lum = img.mean(2)
    ton = palette(lum * 1.15, [(0, (6, 5, 8)), (0.5, (70, 48, 24)), (0.85, (214, 170, 96)), (1, (255, 236, 190))])
    img = melange(img, ton, fond * 0.5)
    traits = (0.5 + 0.5 * np.sin((XX - YY * 0.58) * 0.19)) ** 8
    img = ecran(img, np.array([1.0, 0.82, 0.45]) * (traits * fond * 0.22)[..., None])
    img = voile_bas(img, (6, 5, 8), 0.58, 0.92)
    # cadre d'or épais avec vagues seigaiha en relief
    bande = masque(lambda c, p: c.drawDRRect(rrect(0, R), rrect(118, R - 90), p))
    motif = seigaiha(64) * bande
    d, sp = relief(bande + motif * 0.5, 3, 14)
    metal = or_metal(d, sp, brosse(50, 5))
    # filets intérieurs : double ligne d'or et liseré noir
    noir = masque(lambda c, p: (p.setStyle(skia.Paint.kStroke_Style), p.setStrokeWidth(10), c.drawRRect(rrect(122, R - 92), p)))
    fil = masque(lambda c, p: (p.setStyle(skia.Paint.kStroke_Style), p.setStrokeWidth(4), c.drawRRect(rrect(138, R - 100), p)))
    # le personnage passe devant le cadre en haut (débordement)
    devant = art.perso * (YY < H * 0.42) * lisse(art.perso, 0.5, 0.9)
    couvre = bande * (1 - devant)
    img = melange(img, metal, couvre)
    img = melange(img, np.array([0.02, 0.02, 0.03]), noir * (1 - devant))
    dfl, sfl = relief(fil, 1.5, 5); img = melange(img, or_metal(dfl, sfl), fil * (1 - devant))
    # ombre portée du personnage sur le cadre
    om = flou(devant, 10) * bande * (1 - devant)
    img *= (1 - om[..., None] * 0.6)
    # ornements de coin : fleur d'emblème
    def coins_orn(c, p):
        for (x, y) in ((118, 118), (W - 118, 118), (118, H - 118), (W - 118, H - 118)):
            c.drawCircle(x, y, 52, p)
    co = masque(coins_orn) * (1 - devant); dc, sc = relief(co, 3, 10)
    img = melange(img, or_metal(dc, sc), co)
    for (x, y) in ((118, 118), (W - 118, 118), (118, H - 118), (W - 118, H - 118)):
        e = emblème_masque(x, y, 74) * (1 - devant); img = melange(img, np.array([0.05, 0.04, 0.03]), e)
    def txt(c):
        bandeau_haut(c, lambda a, b, cc, dd: degrade(a, b, cc, dd, [(255, 242, 212), (190, 140, 70), (255, 236, 180), (170, 120, 60)], [0, 0.4, 0.6, 1]), (246, 226, 180, 240), fond=(8, 6, 6, 215), contour=(230, 190, 110, 160), x=196, y=196)
        f = skia.Font(TF["black"], 230); blob = skia.TextBlob.MakeFromString(INFOS["nom"], f)
        ech = min(0.86, 1640 / f.measureText(INFOS['nom']))
        c.save(); c.translate(196, 3000); c.skew(-0.2, 0); c.scale(ech, ech / 0.86 if ech < 0.86 else 1)
        sh = skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, 200), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14))
        c.drawTextBlob(blob, 10, 14, sh)
        po = skia.Paint(AntiAlias=True); po.setShader(degrade(0, -190, 0, 20, [(255, 248, 222), (232, 186, 104), (255, 236, 176), (150, 98, 40)], [0, 0.45, 0.6, 1]))
        c.drawTextBlob(blob, 0, 0, po)
        ps = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=skia.Color(80, 50, 18))
        c.drawTextBlob(blob, 0, 0, ps)
        c.restore()
        pa = skia.Paint(AntiAlias=True, Color=skia.Color(240, 214, 160))
        texte(c, INFOS["type"], 204, 2740, "bold", 38, pa, espace=0.32)
        texte(c, INFOS["anime"], 204, 3100, "bold", 44, pa, espace=0.38)
        texte(c, "ZENKAI", W - 204 - largeur("ZENKAI", "bold", 34, 0.3), 3100, "bold", 34, pa, espace=0.3)
        droits(c, (240, 214, 160, 150), y=H - 150)
    img = poser(img, couche_texte(txt))
    em = emblème_masque(W - 300, 2880, 190); d2, s2 = relief(em, 2.5, 8)
    img = ecran(img, np.array([1.0, 0.8, 0.4]) * flou(em, 16)[..., None] * 0.6)
    img = melange(img, or_metal(d2, s2), em)
    return img

def finir(img):
    a = coins()
    return Image.fromarray((np.dstack([np.clip(img, 0, 1), a]) * 255).round().astype(np.uint8), "RGBA")

if __name__ == "__main__":
    import sys, time
    art = Art("ichigo_x4.png", "ichigo_masque_src.png", 0.5, 0.25)
    quelles = sys.argv[1:] or ["eclat", "prisme", "spectre", "mirage", "zenkai"]
    for q in quelles:
        t = time.time(); finir(globals()[q](art)).save(f"sortie/ichigo_{q}.png"); print(q, round(time.time() - t, 1), "s")
