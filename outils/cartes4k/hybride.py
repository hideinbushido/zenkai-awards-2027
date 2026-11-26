"""Cartes 4K hybrides : les ornements de nos cadres d'origine (cristaux, épines d'or, flammes, couronnes,
fumée, lames, anneaux) posés sur le nouveau système (illustration HD pleine carte, effets de fond qui
épargnent le personnage, matières en relief, personnage qui sort du cadre, typographie ZENKAI)."""
import os
from chemins import BASE, SOURCES, SORTIE_LOT
import numpy as np, cv2, skia
from PIL import Image
from carte4k import *          # noqa: outils, Art, textes, matières

Z = os.path.join(BASE, "cadres") + os.sep
DOSSIERS = {"eclat": ("cadre_eclat", ["1_lueur", "2_argent", "3_lisere_or", "4_etoiles", "5_eclats"]),
            "prisme": ("cadre_prisme", ["1_lueur", "2_filets_or_ruban", "3_epines_or", "4_cristaux", "5_etincelles"]),
            "spectre": ("cadre_spectre", ["1_lueur", "2_bande_energie", "3_fumee_spectrale", "4_lames_acier", "5_eclats_cristal", "6_couronne", "7_anneaux", "8_etincelles"]),
            "mirage": ("cadre_mirage", ["1_lueur", "2_bande_verre_argent", "3_rubans_voiles", "4_eclats_cristal", "5_anneaux", "6_couronne_diamant", "7_etincelles"]),
            "zenkai": ("cadre", ["1_lueur", "2_bande_or_holo", "3_flammes", "4_couronne_cristal", "5_eclats"])}

def couches(rarete):
    """Charge les calques d'origine (2520 x 3520) à la taille 4K, agrandis pour que le cadre touche le bord."""
    d, noms = DOSSIERS[rarete]; nom = "zenkai" if rarete == "zenkai" else rarete
    out = {}
    for k in noms:
        im = Image.open(f"{Z}{d}/cadre_{nom}_{k}.png").convert("RGBA")
        e = 1.026; w, h = int(W * e), int(H * e)
        im = im.resize((w, h), Image.LANCZOS); ox, oy = (w - W) // 2, (h - H) // 2
        a = np.asarray(im.crop((ox, oy, ox + W, oy + H))).astype(np.float32) / 255
        out[k.split("_", 1)[1]] = a
    return out

def coller(img, c, opacite=1.0):
    return melange(img, c[..., :3], c[..., 3] * opacite)

def lueur(img, c, force=0.55):
    return ecran(img, c[..., :3] * (c[..., 3] * force)[..., None])

# ------------------------------------------------------------------ textes communs
def infos(img, style):
    """style : couleurs de la plaque, du nom, des petites lignes ; nom 'auge' (gras + italique) ou 'or' (penché)."""
    x0 = style.get("x", 206)
    def dessin(c):
        bandeau_haut(c, style["marque"], style["txt_plaque"], fond=style.get("fond_plaque", (10, 9, 14, 190)),
                     contour=style.get("contour_plaque"), x=style.get("px", 200), y=style.get("py", 196))
        y = 2950
        if style.get("nom") == "auge":
            pn = skia.Paint(AntiAlias=True); pn.setShader(style["degrade_nom"](y))
            mots = INFOS["nom"].split(" ", 1); a = mots[0].upper(); b = mots[1].title() if len(mots) > 1 else ""
            tot = largeur(a, "cond", 228) + (28 + largeur(b, "serif", 222) if b else 0); k = min(1.0, 1650 / max(tot, 1))
            texte(c, a, x0, y, "cond", 228 * k, pn)
            if b: texte(c, b, x0 + largeur(a, "cond", 228 * k) + 28 * k, y, "serif", 222 * k, pn)
        elif style.get("nom") == "or":
            f = skia.Font(TF["black"], 222); blob = skia.TextBlob.MakeFromString(INFOS["nom"], f)
            ech = min(0.86, 1560 / f.measureText(INFOS["nom"]))
            c.save(); c.translate(x0, y); c.skew(-0.2, 0); c.scale(ech, 1)
            c.drawTextBlob(blob, 10, 14, skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, 200), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14)))
            po = skia.Paint(AntiAlias=True); po.setShader(degrade(0, -185, 0, 20, [(255, 248, 222), (232, 186, 104), (255, 236, 176), (150, 98, 40)], [0, 0.45, 0.6, 1]))
            c.drawTextBlob(blob, 0, 0, po)
            c.drawTextBlob(blob, 0, 0, skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=3, Color=skia.Color(80, 50, 18)))
            c.restore()
        elif style.get("nom") == "contour":
            f = skia.Font(TF["cond"], 228); f.setSize(228 * min(1.0, 1650 / max(f.measureText(INFOS["nom"]), 1))); blob = skia.TextBlob.MakeFromString(INFOS["nom"], f)
            c.drawTextBlob(blob, x0, y, skia.Paint(AntiAlias=True, Color=skia.Color(120, 210, 255, 110), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9)))
            c.drawTextBlob(blob, x0, y, skia.Paint(AntiAlias=True, Color=skia.Color(8, 6, 22, 150)))
            pc = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=6)
            pc.setShader(degrade(x0, 0, 2100, 0, [(170, 240, 255), (230, 200, 255), (170, 240, 255)])); c.drawTextBlob(blob, x0, y, pc)
        else:
            pn = skia.Paint(AntiAlias=True); pn.setShader(style["degrade_nom"](y)); texte(c, INFOS["nom"], x0, y, "cond", 228 * min(1.0, 1650 / max(largeur(INFOS["nom"], "cond", 228), 1)), pn)
        pa = skia.Paint(AntiAlias=True, Color=skia.Color(*style["petit"]))
        texte(c, INFOS["type"], x0 + 6, 2695, "bold", 38, pa, espace=0.32)
        texte(c, f"{INFOS['anime']}   ·   {style['rarete']}", x0 + 6, 3040, "bold", 44, pa, espace=0.38)
        droits(c, style.get("droits", (255, 255, 255, 140)), y=H - 172)
    return poser(img, couche_texte(dessin))

def embleme(img, matiere, x=W - 340, y=2850, t=150, halo=None):
    em = emblème_masque(x, y, t)
    if halo is not None: img = ecran(img, np.array(halo) * flou(em, 14)[..., None] * 0.7)
    d, s = relief(em, 2, 6); return melange(img, matiere(d, s), em)

DEG = lambda cols: (lambda y: degrade(0, y - 190, 0, y + 20, cols))

# ================================================================== ÉCLAT
def eclat(art):
    L = couches("eclat"); img = voile_bas(art.rgb.copy(), (8, 8, 12), 0.58, 0.9)
    img = lueur(img, L["lueur"], 0.35)
    for k in ("argent", "lisere_or", "etoiles", "eclats"): img = coller(img, L[k])
    img = infos(img, dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(255, 255, 255), (150, 156, 168), (240, 242, 248)]),
                          txt_plaque=(230, 232, 238, 230), contour_plaque=(220, 190, 120, 140),
                          degrade_nom=DEG([(255, 255, 255), (196, 200, 210)]), petit=(214, 216, 224), rarete="ÉCLAT"))
    return embleme(img, argent_metal)

# ================================================================== PRISME
def prisme(art):
    L = couches("prisme"); img = voile_bas(art.rgb.copy(), (14, 10, 26), 0.58, 0.88)
    val, bord = facettes(58)
    teinte = np.arctan2(YY - H / 2, XX - W / 2) / 6.2832 + val * 0.35 + (XX + YY) / (W + H) * 0.6
    rng = np.random.default_rng(11); pail = np.clip(flou((rng.random((H, W)) > 0.9985).astype(np.float32), 1.2) * 9, 0, 1)[..., None]
    foil = np.clip(arcenciel(teinte, 0.95, 0.62) * (0.75 + 0.5 * val[..., None]) + (1 - lisse(bord, 0, 0.05))[..., None] * 0.35 + pail, 0, 1)
    # éclat prismatique sur le fond, pas sur le personnage
    fond = (1 - art.perso) * (1 - lisse(YY / H, 0.6, 0.85))
    img = melange(img, ecran(img, foil * 0.6), fond * 0.26)
    img = lueur(img, L["lueur"], 0.4)
    # bande à facettes sous les filets d'or d'origine
    bande = masque(lambda c, p: c.drawDRRect(rrect(0, R), rrect(92, R - 70), p))
    d, sp = relief(bande, 6, 10)
    img = melange(img, np.clip(foil * (0.3 + 0.95 * d[..., None]) + sp[..., None] * 0.9, 0, 1), bande)
    for k in ("filets_or_ruban", "epines_or", "cristaux", "etincelles"): img = coller(img, L[k])
    img = infos(img, dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(255, 214, 236), (190, 230, 255), (255, 246, 196)]),
                          txt_plaque=(245, 240, 255, 235), fond_plaque=(16, 12, 30, 200), contour_plaque=(255, 220, 140, 150),
                          degrade_nom=lambda y: degrade(206, 0, 2200, 0, [(255, 210, 238), (200, 236, 255), (255, 250, 210), (214, 200, 255)]),
                          petit=(236, 230, 255), rarete="PRISME"))
    return embleme(img, lambda d, s: np.clip(arcenciel(teinte + 0.15, 0.7, 0.85) * (0.6 + 0.5 * d[..., None]) + s[..., None], 0, 1))

# ================================================================== SPECTRE
def spectre(art):
    L = couches("spectre"); base = art.rgb.copy()
    k = np.clip(np.hypot((XX - W / 2) / W, (YY - H / 2) / H) * 2 - 0.4, 0, 1)
    img = np.dstack([cv2.remap(base[..., 0], XX + 10 * k, YY, cv2.INTER_LINEAR), base[..., 1], cv2.remap(base[..., 2], XX - 10 * k, YY, cv2.INTER_LINEAR)])
    fond = 1 - art.perso
    teinte = palette(img.mean(2) * 1.2, [(0, (8, 6, 22)), (0.5, (70, 40, 140)), (1, (190, 230, 255))])
    img = melange(img, teinte, fond * 0.72)
    lignes = (0.5 + 0.5 * np.sin((XX * 0.8 + YY) * 0.21)) ** 6
    img = ecran(img, arcenciel((XX - YY) / (W + H) * 2.2 + 0.55, 0.8, 0.75) * (lignes * fond * 0.35)[..., None])
    img = voile_bas(img, (6, 4, 16), 0.6, 0.85)
    img = lueur(img, L["lueur"], 0.5)
    for k2 in ("bande_energie", "fumee_spectrale", "lames_acier", "eclats_cristal", "couronne", "anneaux", "etincelles"):
        img = coller(img, L[k2], 0.9 if k2 == "fumee_spectrale" else 1)
    img = infos(img, dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(170, 240, 255), (220, 190, 255)]),
                          txt_plaque=(210, 230, 255, 230), fond_plaque=(6, 4, 18, 210), contour_plaque=(150, 220, 255, 120),
                          nom="contour", petit=(196, 222, 255), rarete="SPECTRE", droits=(200, 220, 255, 140), px=210, py=210, x=216))
    em = emblème_masque(W - 356, 2850, 150)
    img = ecran(img, np.array([0.55, 0.85, 1.0]) * flou(em, 10)[..., None] * 0.9)
    return melange(img, np.array([0.85, 0.95, 1.0]), em)

# ================================================================== MIRAGE
def mirage(art):
    L = couches("mirage"); img = art.rgb.copy()
    cy, cx = H * 0.36, W * 0.47
    rr = np.hypot(XX - cx, (YY - cy) * 0.92); th = np.arctan2(YY - cy, XX - cx)
    haut = (0.5 + 0.5 * np.sin(rr * 0.085 + np.sin(th * 7) * 1.4 + np.sin(rr * 0.008) * 2)).astype(np.float32)
    fond = 1 - art.perso
    d, sp = relief(haut * fond, 1.5, 6, brillance=26)
    froid = palette(img.mean(2) * 1.1, [(0, (16, 10, 40)), (0.45, (110, 90, 190)), (0.8, (190, 210, 255)), (1, (245, 240, 255))])
    img = melange(img, froid, fond * 0.42)
    irise = arcenciel(rr / 1400 + 0.05, 0.5, 0.85)
    img = np.clip(img * (0.82 + 0.3 * d[..., None] * fond[..., None] + 0.18 * (1 - fond[..., None])) + (sp * fond)[..., None] * irise * 0.6, 0, 1)
    img = voile_bas(img, (14, 8, 30), 0.6, 0.86)
    img = lueur(img, L["lueur"], 0.45)
    for k in ("bande_verre_argent", "rubans_voiles", "eclats_cristal", "anneaux", "couronne_diamant", "etincelles"): img = coller(img, L[k])
    img = infos(img, dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(236, 230, 255), (180, 210, 255), (255, 236, 250)]),
                          txt_plaque=(236, 232, 255, 235), fond_plaque=(16, 10, 34, 195), contour_plaque=(220, 210, 255, 130),
                          nom="auge", degrade_nom=DEG([(255, 255, 255), (200, 196, 255)]), petit=(226, 222, 255), rarete="MIRAGE",
                          droits=(226, 222, 255, 140), px=210, py=210, x=216))
    return embleme(img, argent_metal, x=W - 356, y=2850, halo=[0.7, 0.75, 1.0])

# ================================================================== ZENKAI
def zenkai(art):
    """Cadre ZENKAI définitif : marbre noir et kintsugi d'or holo, gravures art déco, lumière qui s'embrase sur l'angle."""
    import zk_cadre
    img = voile_bas(art.rgb.copy(), (6, 5, 8), 0.58, 0.9)
    img = zk_cadre.appliquer(img)
    img = infos(img, dict(marque=lambda a, b, c, d: degrade(a, b, c, d, [(255, 242, 212), (190, 140, 70), (255, 236, 180), (170, 120, 60)], [0, 0.4, 0.6, 1]),
                          txt_plaque=(246, 226, 180, 240), fond_plaque=(8, 6, 6, 215), contour_plaque=(230, 190, 110, 160),
                          nom="or", petit=(240, 214, 160), rarete="ZENKAI", droits=(240, 214, 160, 150), px=200, py=206, x=212))
    return embleme(img, or_metal, x=W - 360, y=2830, t=190, halo=[1.0, 0.8, 0.4])

if __name__ == "__main__":
    import sys, time
    art = Art("ichigo_x4.png", "ichigo_masque_src.png", 0.5, 0.25)
    for q in sys.argv[1:] or ["eclat", "prisme", "spectre", "mirage", "zenkai"]:
        t = time.time(); finir(globals()[q](art)).save(f"sortie/hybride_{q}.png"); print(q, round(time.time() - t, 1), "s")
