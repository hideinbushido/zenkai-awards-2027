"""Construit manifeste.json : une entrée par carte (source, rareté, nom, numéro, crédit, spéciale)."""
import json, unicodedata, re
import os; _B = os.path.dirname(os.path.abspath(__file__)); L = json.load(open(os.path.join(_B, "inventaire.json"))); src = json.load(open(os.path.join(_B, "sources_map.json"))); N = json.load(open(os.path.join(_B, "noms.json")))

ANIME = {
    "BLACKCLOVER": ("Black Clover", "© Yūki Tabata / Shueisha, TV Tokyo, Pierrot"),
    "BLEACH": ("Bleach", "© Tite Kubo / Shueisha, TV Tokyo, dentsu, Pierrot"),
    "ClassroomOFTHEelite": ("Classroom of the Elite", "© Shōgo Kinugasa, Tomoseshunsaku / KADOKAWA, Lerche"),
    "DANDADAN": ("Dandadan", "© Yukinobu Tatsu / Shueisha, Science SARU"),
    "DBSBEERUS": ("Dragon Ball Super", "© Bird Studio / Shueisha, Toei Animation"),
    "Demon Slayer": ("Demon Slayer", "© Koyoharu Gotōge / Shueisha, Aniplex, ufotable"),
    "Dr.Stone": ("Dr. Stone", "© Riichiro Inagaki, Boichi / Shueisha, TMS Entertainment"),
    "FIREforce": ("Fire Force", "© Atsushi Ōkubo / Kōdansha, David Production"),
    "GACHIAKUTA": ("Gachiakuta", "© Kei Urana, Hideyoshi Andō / Kōdansha, Bones Film"),
    "HELLSParadise": ("Hell's Paradise", "© Yūji Kaku / Shueisha, Twin Engine, MAPPA"),
    "JJK": ("Jujutsu Kaisen", "© Gege Akutami / Shueisha, MAPPA"),
    "JOJOSBR": ("Steel Ball Run", "© Hirohiko Araki & LUCKY LAND COMMUNICATIONS / Shueisha, David Production"),
    "KillBLUE": ("Kill Blue", "© Tadatoshi Fujimaki / Shueisha"),
    "MARRIAGETOXIC": ("Marriagetoxin", "© Joumyaku, Mizuki Yoda / Shueisha"),
    "MHA": ("My Hero Academia", "© Kōhei Horikoshi / Shueisha, Bones"),
    "Nippun Sengoku": ("Nippon Sangoku", "© Ikka Matsuki / Shogakukan"),
    "ONEPIECE": ("One Piece", "© Eiichirō Oda / Shueisha, Toei Animation"),
    "Reborn": ("Reborn!", "© Akira Amano / Shueisha"),
    "TOKYORevengers": ("Tokyo Revengers", "© Ken Wakui / Kōdansha, LIDENFILMS"),
    "Wistoria": ("Wistoria", "© Fujino Ōmori, Toshi Aoi / Kōdansha, Actas"),
    "YominoTsugai": ("Yomi no Tsugai", "© Hiromu Arakawa / Square Enix, Bones Film"),
    "witchHATatelier": ("Witch Hat Atelier", "© Kamome Shirahama / Kōdansha, Bug Films"),
}
ORDRE = ["ECLAT", "PRISME", "SPECTRE", "MIRAGE", "ZENKAI"]
SPECIALES = ["genga", "sakuga", "celluloid", "sumi", "hanga", "reiatsu", "ekonte"]
NON_PERSO = {"Taureaux Noirs", "Planète de Beerus", "Les Piliers", "Lunes Supérieures", "Compagnie 8", "Steel Ball Run"}

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-") or "Inconnu"

par_anime = {}
for i, (a, r, f, s) in enumerate(L):
    par_anime.setdefault(a, []).append((ORDRE.index(r), f, i, r))
man = []; k_sp = 0; rang_smz = 0
for a in sorted(par_anime):
    nom_anime, credit = ANIME[a]
    items = sorted(par_anime[a])
    for n, (_, f, i, r) in enumerate(items, 1):
        nom = N[str(i)]
        typ = "ILLUSTRATION" if (nom in NON_PERSO or nom == nom_anime or nom in {v[0] for v in ANIME.values()} or nom == "Inconnu" and False) else "PERSONNAGE"
        sp = None
        if r in ("SPECTRE", "MIRAGE", "ZENKAI"):
            rang_smz += 1
            if rang_smz % 4 == 2:                      # une carte sur quatre devient une spéciale
                sp = SPECIALES[k_sp % len(SPECIALES)]; k_sp += 1
        fichier = f"{n:03d}_{r}" + (f"_{sp.upper()}" if sp else "") + f"_{slug(nom)}.jpg"
        man.append(dict(src=src[f"{a}/{r}/{f}"], origine=f"{a}/{r}/{f}", dossier=a, anime=nom_anime, credit=credit,
                        rarete=r.lower(), special=sp, nom=nom, type=typ, num=n, total=len(items), fichier=fichier))
NOMINES = {539: "opening", 701: "opening", 566: "opening", 447: "opening", 614: "opening", 105: "opening", 604: "opening",
           659: "opening", 150: "opening", 640: "opening", 48: "opening", 246: "opening", 585: "opening", 410: "action"}
TITRES = {"opening": "MEILLEUR OPENING", "action": "MEILLEUR ANIMÉ D'ACTION"}
NOMINES[410] = "opening"
for i, c in NOMINES.items():
    e = man[i]; e["special"] = None; e["nomine"] = c; e["nom"] = TITRES[c].title().replace("Animé D'Action","animé d'action").replace("Opening","opening"); e["type"] = "NOMINÉ"
    e["fichier"] = f"{e['num']:03d}_{e['rarete'].upper()}_NOMINE_{slug(e['anime'])}.jpg"
t = next(i for i, e in enumerate(man) if e["dossier"] == "TOKYORevengers")
e = man[t]; e["nomine"] = "opening"; e["nom"] = "Meilleur opening"; e["type"] = "NOMINÉ"; e["special"] = None
e["fichier"] = f"{e['num']:03d}_{e['rarete'].upper()}_NOMINE_{slug(e['anime'])}.jpg"
CORR = {("BLACKCLOVER", 40): dict(nom="Asta & Lucifero"), ("BLACKCLOVER", 41): dict(nom="Asta & Yuno"), ("BLACKCLOVER", 47): dict(nom="Black Clover", type="ILLUSTRATION"),
        ("BLACKCLOVER", 44): dict(dezoom=1.3), ("BLACKCLOVER", 37): dict(nom="Asta & Yuno"),
        ("BLACKCLOVER", 35): dict(nom="Asta & Yami"), ("BLACKCLOVER", 32): dict(nom="Asta & Yuno"),
        ("BLACKCLOVER", 29): dict(nom="Asta"), ("BLACKCLOVER", 28): dict(nom="Asta & Liebe"), ("BLACKCLOVER", 27): dict(nom="Asta"),
        ("BLACKCLOVER", 18): dict(nom="Black Clover", type="ILLUSTRATION"), ("BLACKCLOVER", 15): dict(nom="Yami & Asta"),
        ("BLACKCLOVER", 14): dict(nom="Yami Sukehiro"), ("BLACKCLOVER", 13): dict(nom="Black Clover", type="ILLUSTRATION"),
        ("BLACKCLOVER", 3): dict(nom="Asta & Fanzell Kruger"), ("BLACKCLOVER", 11): dict(nom="Asta & Kiato"), ("BLEACH", 63): dict(nom="Ichigo Kurosaki"), ("FIREforce", 29): dict(nom="Benimaru Shinmon", type="PERSONNAGE"),
        ("FIREforce", 27): dict(nom="Fire Force", type="ILLUSTRATION"), ("FIREforce", 26): dict(nom="Arthur Boyle"),
        ("FIREforce", 24): dict(dezoom=1.3), ("FIREforce", 10): dict(nom="Fire Force", type="ILLUSTRATION"), ("HELLSParadise", 22): dict(nom="Shion"), ("HELLSParadise", 31): dict(nom="Shion"), ("HELLSParadise", 27): dict(nom="Shion"), ("HELLSParadise", 24): dict(nom="Shugen"),
        ("FIREforce", 28): dict(special="sumi"), ("Wistoria", 19): dict(special="hanga"), ("Wistoria", 14): dict(nom="Lianna"),
        ("Wistoria", 9): dict(nom="Ellenor Ljos Alf"), ("Wistoria", 5): dict(nom="Edward", type="PERSONNAGE"), ("Wistoria", 4): dict(sans_nom=True), ("Wistoria", 2): dict(sans_nom=True), ("Wistoria", 1): dict(sans_nom=True), ("DBSBEERUS", 23): dict(nom="Son Gohan du futur"), ("DBSBEERUS", 26): dict(nom="Buutenks & Buuhan"), ("DBSBEERUS", 27): dict(nom="Cell Max & Gohan"),
        ("DBSBEERUS", 103): dict(special="reiatsu"), ("DBSBEERUS", 97): dict(anime="Dragon Ball Daima"),
        ("DBSBEERUS", 79): dict(nom="Granolah"), ("DBSBEERUS", 78): dict(nom="Son Goku & Vegeta"),
        ("DBSBEERUS", 55): dict(nom="Trunks"), ("DBSBEERUS", 102): dict(nom="Son Gohan du futur"),
        ("DBSBEERUS", 99): dict(nom="Son Gohan du futur", special="celluloid"), ("DBSBEERUS", 85): dict(nom="Son Gohan du futur, Piccolo & Son Goku"), ("DBSBEERUS", 81): dict(nom="Son Gohan du futur"), ("DBSBEERUS", 72): dict(nom="Son Gohan & Son Goku"), ("DBSBEERUS", 62): dict(nom="Trunks"), ("DBSBEERUS", 57): dict(nom="Trunks"), ("DBSBEERUS", 74): dict(nom="Gogeta Super Saiyan 4", anime="Dragon Ball GT"), ("JOJOSBR", 2): dict(nom="Johnny Joestar"),
        ("JOJOSBR", 3): dict(nom="Steel Ball Run", type="ILLUSTRATION"), ("JOJOSBR", 5): dict(nom="Diego Brando"),
        ("JOJOSBR", 11): dict(nom="Diego Brando"), ("JOJOSBR", 10): dict(nom="Jodio Joestar", anime="The JOJOLands"),
        ("JOJOSBR", 20): dict(nom="Jodio Joestar", anime="The JOJOLands"), ("JOJOSBR", 22): dict(nom="Jodio Joestar", anime="The JOJOLands"),
        ("witchHATatelier", 43): dict(special="sumi"), ("JJK", 79): dict(nom="Kinji Hakari"),
        ("JJK", 77): dict(special="reiatsu"), ("JJK", 86): dict(nom="Suguru Geto & Yuta Okkotsu"), ("JJK", 85): dict(nom="Satoru Gojo"),
        ("JJK", 70): dict(nom="Yuta Okkotsu"), ("JJK", 68): dict(nom="Toge Inumaki"), ("JJK", 65): dict(nom="Mahito"), ("JJK", 59): dict(nom="Ryomen Sukuna"),
        ("JJK", 55): dict(nom="Maki Zen'in"), ("JJK", 51): dict(nom="Yuta Okkotsu"), ("JJK", 16): dict(nom="Kinji Hakari"),
        ("JJK", 15): dict(nom="Maki Zen'in"), ("JJK", 13): dict(nom="Jujutsu Kaisen", type="ILLUSTRATION"), ("JJK", 4): dict(nom="Atsuya Kusakabe")}
for e in man:
    c = CORR.get((e["dossier"], e["num"]))
    if c:
        e.update(c)
        if ("nom" in c or "special" in c) and not e.get("nomine"):
            sp = f"_{e['special'].upper()}" if e["special"] else ""
            e["fichier"] = f"{e['num']:03d}_{e['rarete'].upper()}{sp}_{slug(e['nom'])}.jpg"
json.dump(man, open(os.path.join(_B, "manifeste.json"), "w"), ensure_ascii=False, indent=0)
import collections
print(len(man), collections.Counter(e["special"] for e in man))
