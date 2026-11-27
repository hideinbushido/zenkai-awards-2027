"""Cadre ZENKAI définitif (marbre noir + kintsugi + gravures art déco + éclat), mis en cache.
Le cadre est une transformation affine de l'image par pixel : sortie = F0 + (F1 - F0) * image."""
import os
from chemins import BASE, SOURCES, SORTIE_LOT
import os, numpy as np
CACHE = os.path.join(BASE, "modeles", "cadre_zenkai_combo.npz")
_F = None
def _charger():
    global _F
    if _F is None:
        if os.path.exists(CACHE):
            z = np.load(CACHE); _F = (z["f0"], z["f1"])
        else:
            import zk_ref
            f0 = zk_ref.combo(np.zeros((zk_ref.H, zk_ref.W, 3), np.float32)).astype(np.float32)
            f1 = zk_ref.combo(np.ones((zk_ref.H, zk_ref.W, 3), np.float32)).astype(np.float32)
            np.savez(CACHE, f0=f0, f1=f1); _F = (f0, f1)
    return _F
def appliquer(img):
    f0, f1 = _charger()
    return f0 + (f1 - f0) * img
