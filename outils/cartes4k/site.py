"""Publie les cartes officielles sur le site : image web, fiche JSON et vidéo allégée pour chaque carte.

python site.py <dossier_lot> <dossier_disque> <public_booster>
  dossier_lot    : cartes rendues ici (<ANIME>/<fichier>.jpg + .mp4), prioritaires
  dossier_disque : copie de B:\\OPENING 2026 (<ANIME>/CARTES 4K/<fichier>.jpg + .mp4)
  public_booster : public/booster du site

Écrit img/cards/<ID>/full.webp + carte.json, variantes/<ID>.mp4, cards.js et catalogue.json
(liste pour la table « cartes » de Supabase). L'identifiant d'une carte est <DOSSIER>-<NNN>.
"""
import json, os, re, shutil, subprocess, sys
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
LOT, DISQUE, PUB = sys.argv[1:4]
W, H = 600, 838


def trouver(e, ext):
    for p in (os.path.join(LOT, e["dossier"], e["fichier"][:-4] + ext),
              os.path.join(DISQUE, e["dossier"], "CARTES 4K", e["fichier"][:-4] + ext)):
        if os.path.exists(p):
            return p
    return None


def main():
    man = json.load(open(os.path.join(BASE, "manifeste.json")))
    cartes_dir, var_dir = os.path.join(PUB, "img/cards"), os.path.join(PUB, "variantes")
    # on repart de zéro : les anciennes cartes (ancien design) sont remplacées
    for d in (cartes_dir, var_dir):
        shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    cards, catalogue, manquantes, videos = [], [], [], []
    for e in man:
        cid = f"{re.sub(r'[^A-Za-z0-9]', '', e['dossier'])}-{e['num']:03d}"   # identifiant sans espace ni point (liens, contrôles)
        jpg = trouver(e, ".jpg")
        if not jpg:
            manquantes.append(cid); continue
        d = os.path.join(cartes_dir, cid); os.makedirs(d)
        Image.open(jpg).convert("RGB").resize((W, H), Image.LANCZOS).save(os.path.join(d, "full.webp"), quality=84, method=6)
        mp4 = trouver(e, ".mp4")
        if mp4:
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp4, "-vf", "scale=540:-2", "-c:v", "libx264",
                            "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart",
                            os.path.join(var_dir, cid + ".mp4")], check=True)
            videos.append(cid)
        fiche = dict(id=cid, rarity=e["rarete"], name=e["nom"].strip() or e["anime"], anime=e["anime"], type=e["type"],
                     special=e.get("special"), nomine=e.get("nomine"), base=f"img/cards/{cid}/", flat=True,
                     video=bool(mp4), fichier=e["fichier"][:-4])
        json.dump(fiche, open(os.path.join(d, "carte.json"), "w"), ensure_ascii=False)
        cards.append(fiche)
        catalogue.append(dict(id=cid, anime=e["anime"], rarete=e["rarete"], nom=fiche["name"], type=e["type"],
                              special=e.get("special")))
    with open(os.path.join(PUB, "cards.js"), "w") as f:
        f.write("window.ZK_CARDS = " + json.dumps({"booster": 10, "cards": cards}, ensure_ascii=False) + ";\n")
    json.dump(catalogue, open(os.path.join(BASE, "catalogue.json"), "w"), ensure_ascii=False, indent=0)
    print(len(cards), "cartes,", len(videos), "vidéos,", len(manquantes), "manquantes", manquantes[:20])
    return videos


if __name__ == "__main__":
    vids = main()
    # liste des cartes animées pour le site (src/data/variantes.ts)
    racine = os.path.abspath(os.path.join(PUB, "../.."))
    with open(os.path.join(racine, "src/data/variantes.ts"), "w") as f:
        f.write("// Cartes qui ont une vidéo (public/booster/variantes/<ID>.mp4) : générée par outils/cartes4k/site.py\n")
        f.write("export const variantesAnimees = new Set(" + json.dumps(sorted(vids)) + ");\n")
