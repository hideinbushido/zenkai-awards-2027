"""Génère toutes les cartes 4K à partir de manifeste.json.
Pour chaque image : silhouette (isnet-anime), cadrage automatique au format carte, agrandissement x4 (anime6b),
puis cadre hybride de la rareté ou déclinaison spéciale. Sortie JPEG 2400 x 3352 + aperçu 600 px.
Usage : python3 lot.py [debut] [fin]   (indices dans le manifeste ; les cartes déjà faites sont sautées)"""
import os
from chemins import BASE, SOURCES, SORTIE_LOT
import json, os, sys, time, traceback, numpy as np, torch, cv2
from PIL import Image
from spandrel import ModelLoader
from rembg import remove, new_session
torch.set_num_threads(2)

import carte4k as C
import hybride as Hy
import speciales as S1
import speciales2 as S2

W, H = C.W, C.H
RATIO = H / W
FOND = np.array([8, 7, 11], np.float32) / 255
SORTIE = SORTIE_LOT

VARIANTES = dict(S2.VARIANTES)
VARIANTES["ekonte"] = {"spectre": S1.ekonte_planches, "mirage": S1.ekonte_mirage, "zenkai": S1.ekonte_croquis}

modele = ModelLoader().load_from_file(os.path.join(BASE, "modeles", "anime6b.pth")).eval()
session = new_session("isnet-anime")

def x4(im):
    a = np.asarray(im).astype(np.float32) / 255; Hh, Ww, _ = a.shape; T, P, s = 300, 10, 4
    out = np.zeros((Hh * s, Ww * s, 3), np.float32)
    with torch.inference_mode():
        for y in range(0, Hh, T):
            for x in range(0, Ww, T):
                y0, x0 = max(0, y - P), max(0, x - P); y1, x1 = min(Hh, y + T + P), min(Ww, x + T + P)
                r = modele(torch.from_numpy(a[y0:y1, x0:x1]).permute(2, 0, 1)[None])[0].permute(1, 2, 0).clamp(0, 1).numpy()
                out[y * s:min(Hh, y + T) * s, x * s:min(Ww, x + T) * s] = r[(y - y0) * s:(y - y0 + min(T, Hh - y)) * s, (x - x0) * s:(x - x0 + min(T, Ww - x)) * s]
    return Image.fromarray((out * 255).round().astype(np.uint8))

def ouvrir(p):
    im = Image.open(p)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); fond = Image.new("RGBA", im.size, (8, 7, 11, 255)); fond.alpha_composite(im); im = fond
    return im.convert("RGB")

def boite_perso(mk):
    """Boîte du personnage (ou de tout ce qui compte), ignorant les petites taches."""
    b = (mk > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(b, 8)
    aire = b.size; garde = [k for k in range(1, n) if st[k, cv2.CC_STAT_AREA] > aire * 0.004]
    if not garde: return None
    x0 = min(st[k, 0] for k in garde); y0 = min(st[k, 1] for k in garde)
    x1 = max(st[k, 0] + st[k, 2] for k in garde); y1 = max(st[k, 1] + st[k, 3] for k in garde)
    return x0, y0, x1, y1

def cadrer(im, m, dezoom=1.0):
    """Fenêtre au format carte qui garde le personnage entier autant que possible.
    Si l'image doit être réduite pour tout garder, la fenêtre peut dépasser de l'image (25 à 40 % au plus) :
    le dépassement est rempli par un prolongement flouté de l'image. Renvoie (x0, y0, x1, y1) en pixels source,
    éventuellement hors de l'image."""
    sw, sh = im.size; mk = np.asarray(m).astype(np.float32) / 255
    bb = boite_perso(mk) or (0, 0, sw, sh)
    bx0, by0, bx1, by1 = bb; bcx = (bx0 + bx1) / 2
    if sh / sw > RATIO:                                   # image plus haute que la carte
        w, h = sw, sw * RATIO
        besoin = (by1 - by0) / 0.88                       # le personnage doit tenir dans 88 % de la hauteur
        if besoin > h:
            h = min(besoin, sh, sw * 1.28 * RATIO); w = h / RATIO
        y0 = np.clip(by0 - 0.05 * h, 0, sh - h) if h <= sh else 0
        x0 = (sw - w) / 2
    else:                                                 # image plus large que la carte
        h, w = sh, sh / RATIO
        besoin = (bx1 - bx0) / 0.9
        if besoin > w:
            w = min(besoin, sw, sh / RATIO * 1.4); h = w * RATIO
        x0 = np.clip(bcx - w / 2, 0, sw - w) if w <= sw else (sw - w) / 2
        y0 = -(h - sh) * 0.25 if h > sh else 0          # le surplus va surtout en bas, sous la plaque d'infos
    if dezoom != 1.0:
        cx, cy = x0 + w / 2, y0 + h / 2; w, h = w * dezoom, h * dezoom; x0, y0 = cx - w / 2, cy - h / 2
    return (int(round(x0)), int(round(y0)), int(round(x0 + w)), int(round(y0 + h)))

def prolonger(im, m, boite):
    """Découpe la fenêtre ; ce qui dépasse de l'image est rempli par l'image prolongée et très floutée."""
    sw, sh = im.size; x0, y0, x1, y1 = boite
    if x0 >= 0 and y0 >= 0 and x1 <= sw and y1 <= sh: return im.crop(boite), m.crop(boite)
    g, d, hh, bb = max(0, -x0), max(0, x1 - sw), max(0, -y0), max(0, y1 - sh)
    a = np.asarray(im).astype(np.float32)
    ext = cv2.copyMakeBorder(a, hh, bb, g, d, cv2.BORDER_REFLECT)
    s = max(ext.shape[:2]) * 0.03
    flouee = cv2.GaussianBlur(ext, (0, 0), s) * 0.7
    dedans = np.zeros(ext.shape[:2], np.float32); dedans[hh:hh + sh, g:g + sw] = 1
    dedans = cv2.GaussianBlur(dedans, (0, 0), max(sw, sh) * 0.012) * dedans
    out = ext * dedans[..., None] + flouee * (1 - dedans[..., None])
    mm = cv2.copyMakeBorder(np.asarray(m), hh, bb, g, d, cv2.BORDER_CONSTANT, value=0)
    X0, Y0 = x0 + g, y0 + hh
    out = out[Y0:Y0 + (y1 - y0), X0:X0 + (x1 - x0)]; mm = mm[Y0:Y0 + (y1 - y0), X0:X0 + (x1 - x0)]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), Image.fromarray(mm)

class ArtMem(C.Art):
    def __init__(self, rgb, msk):
        self.geo = (W, H, 0, 0)
        self.rgb = rgb
        self.perso = np.clip((msk - 0.25) / 0.6, 0, 1)
        self.large = np.clip((msk - 0.1) / 0.3, 0, 1)

def source(e):
    """Chemin de l'image source : <ZENKAI_SOURCES>/<ANIME>/<RARETÉ>/<fichier>."""
    return os.path.join(SOURCES, *e["origine"].split("/"))

def preparer(src, dezoom=1.0):
    im = ouvrir(src)
    m = remove(im, session=session, only_mask=True).convert("L")
    boite = cadrer(im, m, dezoom)
    crop, mc = prolonger(im, m, boite)
    if crop.width >= 2000:
        grand = crop.resize((W, H), Image.LANCZOS)
    else:
        if crop.width > 600: crop = crop.resize((600, int(round(600 * RATIO))), Image.LANCZOS)
        grand = x4(crop).resize((W, H), Image.LANCZOS)
    rgb = np.asarray(grand).astype(np.float32) / 255
    msk = np.asarray(mc.resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
    return ArtMem(rgb, msk)

def rendre(e, art):
    sans = str.maketrans("ŌōŪūĀāĒēĪī", "OoUuAaEeIi")
    ok = str.maketrans("ŌŪĀĒĪ", "OUAEI")
    C.INFOS.update(nom=e["nom"].translate(sans).upper(), anime=e["anime"].upper(), type=e["type"],
                   num=f"{e['num']:03d}", total=f"{e['total']:03d}", droits=e["credit"].translate(sans))
    r = e["rarete"]
    if e.get("sans_nom"): C.INFOS.update(nom=" ", type="")      # le nom est déjà dans l'illustration
    if e.get("nomine"):
        C.INFOS.update(nom=" ", type="")
        return badge_nomine(getattr(Hy, r)(art), "MEILLEUR OPENING" if e["nomine"] == "opening" else "MEILLEUR ANIMÉ D'ACTION")
    if e.get("special"):
        img = VARIANTES[e["special"]][r](art, r)
    else:
        img = getattr(Hy, r)(art)
    return img

def badge_nomine(img, titre):
    """Plaque « NOMINÉ · MEILLEUR OPENING » en haut, sous la plaque ZENKAI, pour laisser voir le titre de l'animé en bas."""
    import skia
    def dessin(c):
        x, y, h = 200, 330, 150
        tw = max(C.largeur(titre, "black", 64), C.largeur("NOMINÉ", "bold", 30, 0.4)) + 100
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, tw, h), 28, 28), skia.Paint(AntiAlias=True, Color=skia.Color(8, 6, 6, 205)))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, tw, h), 28, 28),
                    skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=4, Color=skia.Color(230, 190, 110, 200)))
        C.texte(c, "NOMINÉ", x + 50, y + 52, "bold", 30, skia.Paint(AntiAlias=True, Color=skia.Color(240, 214, 160)), espace=0.4)
        po = skia.Paint(AntiAlias=True); po.setShader(C.degrade(0, y + 70, 0, y + 130, [(255, 248, 222), (232, 186, 104), (255, 236, 176)]))
        C.texte(c, titre, x + 50, y + 125, "black", 64, po, skew=-0.18)
    return C.poser(img, C.couche_texte(dessin))

def enregistrer(e, img):
    a = C.coins()[..., None]
    rgb = np.clip(img, 0, 1) * a + FOND * (1 - a)
    out = Image.fromarray((rgb * 255).round().astype(np.uint8))
    d = os.path.join(SORTIE, e["dossier"]); os.makedirs(d, exist_ok=True)
    out.save(os.path.join(d, e["fichier"]), quality=93, subsampling=0, optimize=True)
    pd = os.path.join(SORTIE, "_apercus", e["dossier"]); os.makedirs(pd, exist_ok=True)
    out.resize((600, 838), Image.LANCZOS).save(os.path.join(pd, e["fichier"]), quality=85)

if __name__ == "__main__":
    man = json.load(open(os.path.join(BASE, "manifeste.json")))
    a = int(sys.argv[1]) if len(sys.argv) > 1 else 0; b = int(sys.argv[2]) if len(sys.argv) > 2 else len(man)
    for i in range(a, min(b, len(man))):
        e = man[i]
        if e["nom"] == "Inconnu" or os.path.exists(os.path.join(SORTIE, e["dossier"], e["fichier"])): continue
        t = time.time()
        try:
            art = preparer(source(e), e.get("dezoom", 1.0))
            try:
                img = rendre(e, art)
            except Exception:
                if not e.get("special"): raise
                traceback.print_exc()
                e = dict(e, special=None, fichier=e["fichier"].replace("_" + e["special"].upper(), ""))
                img = rendre(e, art)
                print("  repli sur la carte normale", flush=True)
            enregistrer(e, img)
            print(i, e["dossier"], e["fichier"], round(time.time() - t), "s", flush=True)
        except Exception:
            print("ERREUR", i, e["src"], flush=True); traceback.print_exc()
    print("FINI", a, b, flush=True)
