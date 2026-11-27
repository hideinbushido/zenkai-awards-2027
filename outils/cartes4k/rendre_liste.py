"""Rend une liste d'indices du manifeste (au lieu d'une plage) : python rendre_liste.py fichier_indices.json"""
import json, os, sys, time, traceback
sys.path.insert(0, os.environ["CARTES4K"]); os.chdir(os.environ["CARTES4K"])
import lot
man = json.load(open("manifeste.json"))
for i in json.load(open(sys.argv[1])):
    e = man[i]
    if os.path.exists(os.path.join(lot.SORTIE, e["dossier"], e["fichier"])): continue
    t = time.time()
    try:
        art = lot.preparer(lot.source(e), e.get("dezoom", 1.0))
        try:
            img = lot.rendre(e, art)
        except Exception:
            if not e.get("special"): raise
            traceback.print_exc()
            e = dict(e, special=None, fichier=e["fichier"].replace("_" + e["special"].upper(), ""))
            img = lot.rendre(e, art); print("  repli sur la carte normale", flush=True)
        lot.enregistrer(e, img)
        print(i, e["dossier"], e["fichier"], round(time.time() - t), "s", flush=True)
    except Exception:
        print("ERREUR", i, e["origine"], flush=True); traceback.print_exc()
print("FINI", flush=True)
