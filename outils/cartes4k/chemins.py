"""Chemins du générateur de cartes ZENKAI. Modifiables par variables d'environnement."""
import os
BASE = os.path.dirname(os.path.abspath(__file__))
# dossier des images sources, rangées en <ANIME>\<RARETÉ>\image.jpg (comme B:\OPENING 2026)
SOURCES = os.environ.get("ZENKAI_SOURCES", r"B:\OPENING 2026")
# dossier où les cartes 4K et leurs animations sont écrites (un sous-dossier par anime)
SORTIE_LOT = os.environ.get("ZENKAI_SORTIE", os.path.join(BASE, "lot"))
