import os, json
from chemins import BASE, SOURCES, SORTIE_LOT
import json, os
man = json.load(open(os.path.join(BASE, "manifeste.json")))
tot = {}; fait = {}
for e in man:
    if e["nom"] == "Inconnu": continue
    j = f"{SORTIE_LOT}/{e['dossier']}/{e['fichier']}"
    if not os.path.exists(j):      # repli éventuel
        continue
    besoin = e.get("special") or e["rarete"] in ("spectre", "mirage", "zenkai")
    if not besoin: continue
    k = ("SP-" if e.get("special") else "") + e["rarete"]
    tot[k] = tot.get(k, 0) + 1
    if os.path.exists(j[:-4] + ".mp4"): fait[k] = fait.get(k, 0) + 1
print({k: f"{fait.get(k,0)}/{v}" for k, v in sorted(tot.items())})
