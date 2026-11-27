"""Animations en boucle (4 s) des raretés normales SPECTRE, MIRAGE, ZENKAI, sur les cartes 4K finies.
python3 anim_raretes.py spectre mirage [zenkai]"""
import os
from chemins import BASE, SOURCES, SORTIE_LOT
import json, os, sys, numpy as np, cv2
from PIL import Image
import anim_speciales as A
from anim_speciales import FW, FH, N, xx, yy, ZA, ecran, lisse, bruit, balayage, decaler, commun, arcenciel

CX, CY = FW / 2, FH * 0.44
ANG = np.arctan2(yy - CY, xx - CX); RR = np.hypot(xx - CX, yy - CY)
CADRE = 1 - ZA
FUMEE_Y = None
N31 = bruit(31, 14); N41 = np.vstack([bruit(41, 40)] * 2)
TXT = cv2.GaussianBlur(((yy > FH * 0.73) & (yy < FH * 0.95)).astype(np.float32), (0, 0), 18)
LIBRE = ZA * (1 - TXT)
EMB = np.asarray(Image.open(os.path.join(BASE, "embleme.png")).convert("RGBA")).astype(np.float32)[..., 3] / 255

IDX = np.where(CADRE.ravel() > 0.01)[0]
ANG_C, N31_C, CAD_C = ANG.ravel()[IDX], None, CADRE.ravel()[IDX]
def spectre(base, perso, t, i):
    """Énergie spectrale : des arcs violets et cyan courent dans le cadre, une fumée spectrale dérive derrière le personnage."""
    lum = base.reshape(-1, 3)[IDX].mean(1)
    n = N31.ravel()[IDX]
    arc = (0.5 + 0.5 * np.sin(ANG_C * 22 - 2 * np.pi * t * 3 + n * 9)) ** 14
    arc2 = (0.5 + 0.5 * np.sin(ANG_C * 9 + 2 * np.pi * t * 2 + n * 5)) ** 20
    k = np.clip((arc + arc2) * CAD_C * (0.35 + lum), 0, 1)
    add = np.zeros((FH * FW, 3), np.float32)
    add[IDX] = k[:, None] * np.array([0.7, 0.45, 1.0]) * 0.8 + (arc2 * CAD_C)[:, None] * np.array([0.3, 0.9, 1.0]) * 0.4
    img = ecran(base, add.reshape(FH, FW, 3))
    o = int(FH * t) % FH
    f = N41[o:o + FH]
    fumee = np.clip(f - 0.45, 0, 1) * 1.6 * (1 - perso) * ZA * FUMEE_Y
    img = ecran(img, fumee[..., None] * np.array([0.45, 0.3, 0.8]) * 0.35)
    return ecran(img, balayage((t * 1.3) % 1, 0.7, 80, 0.22, (0.85, 0.8, 1.0)))

def mirage(base, perso, t, i):
    """Mirage : l'air tremble derrière le personnage, un double irisé s'écarte et revient, un reflet nacré passe."""
    s = np.sin(2 * np.pi * t)
    ond = (np.sin(yy / 23 + 2 * np.pi * t * 2) * 2.2) * (1 - perso) * LIBRE
    img = cv2.remap(base, (xx + ond).astype(np.float32), yy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    d = 5 + 4 * s
    r = decaler(base[..., 0], d, 0); b = decaler(base[..., 2], -d, 0)
    fant = np.dstack([r, img[..., 1], b])
    w = (perso * LIBRE * (0.25 + 0.2 * s))[..., None]
    img = img * (1 - w) + fant * w
    nacre = arcenciel(((xx + yy) / (FW + FH)) * 2 - t) * 0.5 + 0.5
    img = ecran(img, nacre * balayage(t, 0.9, 140, 0.3)[..., :1] * CADRE[..., None])
    img = ecran(img, nacre * balayage((t + 0.5) % 1, 0.9, 60, 0.18)[..., :1])
    for k in range(3):     # éclats qui orbitent le long du cadre (calculés dans une petite fenêtre)
        a = 2 * np.pi * (t + k / 3)
        px, py = CX + np.cos(a) * FW * 0.47, CY + np.sin(a) * FH * 0.47
        x0, x1, y0, y1 = max(int(px) - 70, 0), min(int(px) + 70, FW), max(int(py) - 70, 0), min(int(py) + 70, FH)
        if x1 <= x0 or y1 <= y0: continue
        gx, gy = xx[y0:y1, x0:x1], yy[y0:y1, x0:x1]
        g = np.exp(-(((gx - px) / 9) ** 2 + ((gy - py) / 9) ** 2)) + 0.35 * np.exp(-(((gx - px) / 60) ** 2 + ((gy - py) / 3) ** 2)) + 0.35 * np.exp(-(((gx - px) / 3) ** 2 + ((gy - py) / 60) ** 2))
        img[y0:y1, x0:x1] = ecran(img[y0:y1, x0:x1], np.clip(g, 0, 1)[..., None] * np.array([1.0, 0.95, 1.0]))
    return img

def zenkai(base, perso, t, i):
    """Aura Zenkai : l'emblème géant apparaît en filigrane holo au centre, un faisceau de lumière tourne autour,
    un balayage d'or traverse la carte."""
    beam = np.clip(np.cos(ANG - 2 * np.pi * t), 0, 1) ** 10
    souffle = 0.55 + 0.45 * np.sin(2 * np.pi * t)
    col = arcenciel(ANG / (2 * np.pi) + t + (xx + yy) / (FW + FH)) * 0.6 + np.array([1.0, 0.85, 0.5]) * 0.4
    k = np.clip(ZENK * LIBRE * (1 - perso * 0.3) * (0.4 + 1.2 * beam) * (0.7 + 0.3 * souffle), 0, 1)
    kk = (k * (0.18 + 0.5 * base.mean(2)))[..., None]
    img = base * (1 - kk) + np.clip(col * 1.15, 0, 1) * kk          # reflet holo visible même sur une image claire
    img = ecran(img, col * (k * 0.22)[..., None])
    bord = ZENK_BORD
    img = ecran(img, np.ones(3) * (np.clip(bord * 2.5, 0, 1) * LIBRE * (1 - perso * 0.55) * (0.4 + beam))[..., None])
    return ecran(img, balayage((t * 1.0) % 1, 0.65, 110, 0.25, (1.0, 0.85, 0.5)))

def _emb():
    s = int(FW * 0.92); e = cv2.resize(EMB, (s, int(s * EMB.shape[0] / EMB.shape[1])), interpolation=cv2.INTER_AREA)
    m = np.zeros((FH, FW), np.float32); h, w = e.shape; x0, y0 = (FW - w) // 2, int(CY - h / 2)
    m[max(y0, 0):y0 + h, x0:x0 + w] = e[max(-y0, 0):min(h, FH - y0)]
    return cv2.GaussianBlur(m, (0, 0), 1.0)
ZENK = _emb()
FUMEE_Y = lisse((yy / FH - 0.2) / 0.6)
ZENK_BORD = np.clip(ZENK - cv2.erode(ZENK, np.ones((3, 3), np.uint8)), 0, 1)
A.EFFETS.update(spectre=spectre, mirage=mirage, zenkai=zenkai)

if __name__ == "__main__":
    raretes = set(sys.argv[1:]) or {"spectre", "mirage"}
    part = os.environ.get("PART", "0/1"); k, n = map(int, part.split("/"))
    man = json.load(open(os.path.join(BASE, "manifeste.json")))
    todo = [e for e in man if e["rarete"] in raretes and not e.get("special")]
    for j, e in enumerate(todo):
        if j % n != k: continue
        c = f"{SORTIE_LOT}/{e['dossier']}/{e['fichier']}"
        if not os.path.exists(c): continue
        s = c[:-4] + ".mp4"
        if os.path.exists(s): continue
        A.animer(c, e["rarete"], s); print("anim", e["fichier"], flush=True)
