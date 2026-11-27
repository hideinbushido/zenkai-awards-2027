"""Met à jour sur le site seulement quelques cartes (après une correction), sans tout régénérer.

python maj_site.py <dossier_lot> <public_booster> <fichier.jpg> [...]
Refait full.webp, carte.json et la vidéo de chaque carte, met à jour cards.js, catalogue.json,
src/data/variantes.ts, et src/data/vues.ts pour les Ekonte Spectre (3 planches / image complète)."""
import json, os, re, subprocess, sys
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.dirname(os.path.dirname(BASE))
LOT, PUB = sys.argv[1:3]; W, H = 600, 838
man = json.load(open(os.path.join(BASE, "manifeste.json")))
src_js = open(os.path.join(PUB, "cards.js")).read(); pre = "window.ZK_CARDS = "
data = json.loads(src_js[len(pre):].rstrip().rstrip(";")); cards = {c["id"]: c for c in data["cards"]}
cat = {c["id"]: c for c in json.load(open(os.path.join(BASE, "catalogue.json")))}
vues_p = os.path.join(RACINE, "src/data/vues.ts"); var_p = os.path.join(RACINE, "src/data/variantes.ts")
anim = set(re.findall(r'"([^"]+)"', open(var_p).read().split("new Set(")[1]))
vues = {k: [dict(label=a, src=b), dict(label=c, src=d)] for k, a, b, c, d in re.findall(
    r'"([^"]+)": \[\s*\{ label: "([^"]+)", src: "([^"]+)" \},\s*\{ label: "([^"]+)", src: "([^"]+)" \}', open(vues_p).read())}
for nom in sys.argv[3:]:
    e = next(x for x in man if x["fichier"] == nom)
    cid = f"{re.sub(r'[^A-Za-z0-9]', '', e['dossier'])}-{e['num']:03d}"
    jpg = os.path.join(LOT, e["dossier"], nom); mp4 = jpg[:-4] + ".mp4"
    d = os.path.join(PUB, "img/cards", cid); os.makedirs(d, exist_ok=True)
    Image.open(jpg).convert("RGB").resize((W, H), Image.LANCZOS).save(os.path.join(d, "full.webp"), quality=84, method=6)
    if os.path.exists(mp4):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp4, "-vf", "scale=540:-2", "-c:v", "libx264", "-preset", "veryfast",
                        "-crf", "30", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", os.path.join(PUB, "variantes", cid + ".mp4")], check=True)
        anim.add(cid)
    fiche = dict(id=cid, rarity=e["rarete"], name=e["nom"].strip() or e["anime"], anime=e["anime"], type=e["type"], special=e.get("special"),
                 nomine=e.get("nomine"), base=f"img/cards/{cid}/", flat=True, video=os.path.exists(mp4), fichier=nom[:-4])
    json.dump(fiche, open(os.path.join(d, "carte.json"), "w"), ensure_ascii=False)
    cards[cid] = fiche
    cat[cid] = dict(id=cid, anime=e["anime"], rarete=e["rarete"], nom=fiche["name"], type=e["type"], special=e.get("special"))
    complete = jpg[:-4] + "_VUE-COMPLETE.jpg"
    if os.path.exists(complete):
        v = os.path.join(PUB, "vues", cid); os.makedirs(v, exist_ok=True)
        Image.open(jpg).convert("RGB").resize((W, H), Image.LANCZOS).save(os.path.join(v, "planches.webp"), quality=86, method=6)
        Image.open(complete).convert("RGB").resize((W, H), Image.LANCZOS).save(os.path.join(v, "complete.webp"), quality=86, method=6)
        vues[cid] = [dict(label="3 planches", src=f"/booster/vues/{cid}/planches.webp"), dict(label="Image complète", src=f"/booster/vues/{cid}/complete.webp")]
    print("site", cid, nom, "vidéo" if os.path.exists(mp4) else "", "vues" if cid in vues else "")
ordre = [c["id"] for c in data["cards"]]
data["cards"] = [cards[i] for i in ordre]
open(os.path.join(PUB, "cards.js"), "w").write(pre + json.dumps(data, ensure_ascii=False) + ";\n")
json.dump([cat[i] for i in ordre], open(os.path.join(BASE, "catalogue.json"), "w"), ensure_ascii=False, indent=0)
open(var_p, "w").write("// Cartes qui ont une vidéo (public/booster/variantes/<ID>.mp4) : générée par outils/cartes4k/site.py\n"
                       f"export const variantesAnimees = new Set({json.dumps(sorted(anim))});\n")
if vues:
    s = open(vues_p).read(); tete = s.split("export const vuesCartes")[0]
    corps = ",\n".join(f'  "{k}": [\n' + ",\n".join(f'    {{ label: "{x["label"]}", src: "{x["src"]}" }}' for x in vs) + "\n  ]" for k, vs in sorted(vues.items()))
    open(vues_p, "w").write(tete + "export const vuesCartes: Record<string, Vue[]> = {\n" + corps + ",\n};\n")
