"""Chemins du générateur de cartes ZENKAI. Modifiables par variables d'environnement."""
import os
BASE = os.path.dirname(os.path.abspath(__file__))
# dossier des images sources, rangées en <ANIME>\<RARETÉ>\image.jpg (comme B:\OPENING 2026)
SOURCES = os.environ.get("ZENKAI_SOURCES", r"B:\OPENING 2026")
# dossier où les cartes 4K et leurs animations sont écrites (un sous-dossier par anime)
SORTIE_LOT = os.environ.get("ZENKAI_SORTIE", os.path.join(BASE, "lot"))

# Version « nue » des cartes (cadre + illustration, sans aucun texte) pour le mode carte seule du site sur téléphone :
#   ZENKAI_SANS_TEXTE=1 python lot.py      → écrit dans lot_nu/ (les cartes complètes ne sont pas touchées)
# Puis copier chaque carte en public/booster/img/cards/<ID>/nu.webp et ajouter <ID> dans src/data/nues.ts.
SANS_TEXTE = os.environ.get("ZENKAI_SANS_TEXTE") == "1"
if SANS_TEXTE:
    import skia
    for _m in ("drawString", "drawTextBlob", "drawSimpleText"):
        if hasattr(skia.Canvas, _m):
            setattr(skia.Canvas, _m, lambda self, *a, **k: None)
    SORTIE_LOT = os.environ.get("ZENKAI_SORTIE_NU", os.path.join(BASE, "lot_nu"))
