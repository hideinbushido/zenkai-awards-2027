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
        ("DBSBEERUS", 99): dict(nom="Son Gohan du futur", special="celluloid"), ("DBSBEERUS", 85): dict(nom="Son Gohan du futur, Piccolo & Son Goku"), ("DBSBEERUS", 81): dict(nom="Son Gohan du futur"), ("DBSBEERUS", 72): dict(nom="Son Gohan & Son Goku"), ("DBSBEERUS", 62): dict(nom="Trunks"), ("DBSBEERUS", 57): dict(nom="Trunks"), ("DBSBEERUS", 74): dict(nom="Gogeta Super Saiyan 4", anime="Dragon Ball GT"), ("JOJOSBR", 2): dict(nom="Diego Brando"),
        ("JOJOSBR", 3): dict(nom="Steel Ball Run", type="ILLUSTRATION"), ("JOJOSBR", 5): dict(nom="Diego Brando"),
        ("JOJOSBR", 11): dict(nom="Diego Brando"), ("JOJOSBR", 10): dict(nom="Jodio Joestar", anime="The JOJOLands"),
        ("JOJOSBR", 20): dict(nom="Jodio Joestar", anime="The JOJOLands"), ("JOJOSBR", 22): dict(nom="Jodio Joestar", anime="The JOJOLands"),
        ("witchHATatelier", 43): dict(special="sumi"), ("JJK", 79): dict(nom="Kinji Hakari"),
        ("JJK", 77): dict(special="reiatsu"), ("JJK", 86): dict(nom="Suguru Geto & Yuta Okkotsu"), ("JJK", 85): dict(nom="Satoru Gojo"),
        ("JJK", 70): dict(nom="Yuta Okkotsu"), ("JJK", 68): dict(nom="Toge Inumaki"), ("JJK", 65): dict(nom="Mahito"), ("JJK", 59): dict(nom="Ryomen Sukuna"),
        ("JJK", 55): dict(nom="Maki Zen'in"), ("JJK", 51): dict(nom="Yuta Okkotsu"), ("JJK", 16): dict(nom="Kinji Hakari"),
        ("JJK", 15): dict(nom="Maki Zen'in"), ("JJK", 13): dict(nom="Jujutsu Kaisen", type="ILLUSTRATION"), ("JJK", 4): dict(nom="Atsuya Kusakabe")}

# Les 76 images « Inconnu », nommées par Rico dans B:\\OPENING 2026\\_A NOMMER (rapprochées par taille de fichier)
A_NOMMER = {
    ("BLACKCLOVER", 2): dict(nom="Black Clover", type="ILLUSTRATION"),
    ("BLACKCLOVER", 9): dict(nom="Magna Swing"),
    ("BLACKCLOVER", 12): dict(nom="Zenon Zogratis"),
    ("BLACKCLOVER", 16): dict(nom="Black Clover", type="ILLUSTRATION"),
    ("BLACKCLOVER", 20): dict(nom="Black Clover", type="ILLUSTRATION"),
    ("BLACKCLOVER", 25): dict(nom="Charmy Pappitson"),
    ("BLACKCLOVER", 46): dict(nom="Magna Swing"),
    ("BLEACH", 1): dict(nom="Yhwach"),
    ("BLEACH", 11): dict(nom="Yhwach"),
    ("BLEACH", 48): dict(nom="Byakuya Kuchiki"),
    ("BLEACH", 60): dict(nom="Sosuke Aizen"),
    ("ClassroomOFTHEelite", 12): dict(nom="Riku Utomiya"),
    ("ClassroomOFTHEelite", 18): dict(nom="Takuya Yagami"),
    ("ClassroomOFTHEelite", 20): dict(nom="Kiyotaka Ayanokoji"),
    ("ClassroomOFTHEelite", 23): dict(nom="Kazuomi Hosen"),
    ("ClassroomOFTHEelite", 27): dict(nom="Kiyotaka & Suzune"),
    ("ClassroomOFTHEelite", 32): dict(nom="Kiyotaka Ayanokoji"),
    ("ClassroomOFTHEelite", 33): dict(nom="Takuya Yagami"),
    ("Demon Slayer", 11): dict(nom="Kyojuro Rengoku"),
    ("Demon Slayer", 23): dict(nom="Susamaru & Yahaba"),
    ("Demon Slayer", 55): dict(nom="Akaza"),
    ("Demon Slayer", 70): dict(nom="Akaza"),
    ("Demon Slayer", 77): dict(nom="Akaza"),
    ("FIREforce", 9): dict(nom="Moonlight Mask"),
    ("FIREforce", 18): dict(nom="Dragon"),
    ("FIREforce", 32): dict(nom="Dragon"),
    ("FIREforce", 33): dict(nom="Arthur Boyle"),
    ("GACHIAKUTA", 1): dict(nom="Semiu"),
    ("HELLSParadise", 2): dict(nom="Senta"),
    ("HELLSParadise", 3): dict(nom="Fuchi"),
    ("HELLSParadise", 7): dict(nom="Chobei"),
    ("HELLSParadise", 8): dict(nom="Ju Fa"),
    ("HELLSParadise", 11): dict(nom="Shugen"),
    ("HELLSParadise", 14): dict(nom="Sagiri"),
    ("HELLSParadise", 18): dict(nom="Jikka"),
    ("HELLSParadise", 19): dict(nom="Mu Dan"),
    ("HELLSParadise", 20): dict(nom="Shion & Tenza"),
    ("HELLSParadise", 25): dict(nom="Shion"),
    ("HELLSParadise", 29): dict(nom="Yuzuriha"),
    ("HELLSParadise", 35): dict(nom="Chobei"),
    ("JJK", 2): dict(nom="Megumi Fushiguro"),
    ("JJK", 7): dict(nom="Kinji Hakari"),
    ("JJK", 36): dict(nom="Noritoshi Kamo"),
    ("JJK", 44): dict(nom="Yuji & Mahito"),
    ("JJK", 49): dict(nom="Hiromi Higuruma"),
    ("JJK", 50): dict(nom="Choso"),
    ("JJK", 54): dict(nom="Mechamaru"),
    ("JJK", 60): dict(nom="Satoru Gojo"),
    ("JJK", 69): dict(nom="Hajime Kashimo"),
    ("JJK", 97): dict(nom="Maki Zen'in"),
    ("JJK", 98): dict(nom="Nobara Kugisaki"),
    ("MARRIAGETOXIC", 10): dict(nom="Marriagetoxin", type="ILLUSTRATION"),
    ("Nippun Sengoku", 2): dict(nom="Tonotsugu & Goh Sugoh"),
    ("Nippun Sengoku", 3): dict(nom="Tonotsugu & Sugoh"),
    ("Nippun Sengoku", 4): dict(nom="Yoshitsune Asama & Aoteru Misumi"),
    ("ONEPIECE", 8): dict(nom="Shamrock"),
    ("Wistoria", 6): dict(nom="Workner"),
    ("Wistoria", 8): dict(nom="Elfaria"),
    ("Wistoria", 12): dict(nom="Rosti Nauman"),
    ("Wistoria", 16): dict(nom="Will Serfort"),
    ("Wistoria", 17): dict(nom="Edward"),
    ("Wistoria", 21): dict(nom="Zeo"),
    ("Wistoria", 24): dict(nom="Aron Mastreas"),
    ("Wistoria", 25): dict(nom="Finn"),
    ("YominoTsugai", 1): dict(nom="Hidari"),
    ("YominoTsugai", 2): dict(nom="Dextre"),
    ("YominoTsugai", 3): dict(nom="Hidari"),
    ("YominoTsugai", 6): dict(nom="Ivan"),
    ("YominoTsugai", 7): dict(nom="Hidari"),
    ("YominoTsugai", 8): dict(nom="Jin Kagemori"),
    ("YominoTsugai", 9): dict(nom="Gabby"),
    ("YominoTsugai", 12): dict(nom="Jin Kagemori"),
    ("witchHATatelier", 1): dict(nom="Yinny"),
    ("witchHATatelier", 23): dict(nom="Custas"),
    ("witchHATatelier", 33): dict(nom="Qifrey"),
    ("witchHATatelier", 42): dict(nom="Agott"),
}
for k, v in A_NOMMER.items(): CORR.setdefault(k, {}).update(v)

# Transformations visibles sur les autres animes (ligne au-dessus du nom)
TRANSFO = {
    "BLEACH": {16: "BANKAI", 32: "BANKAI", 40: "BANKAI", 43: "BANKAI", 44: "RESURRECCIÓN", 47: "BANKAI", 49: "SHIKAI",
               54: "BANKAI", 57: "BANKAI", 59: "BANKAI", 61: "SHUNKO", 62: "SHIKAI", 63: "HOLLOW", 64: "VASTO LORDE"},
    "ONEPIECE": {2: "GEAR 4", 7: "GEAR 4", 9: "GEAR 5"},
    "BLACKCLOVER": {10: "BLACK ASTA", 23: "BLACK ASTA", 26: "DEVIL UNION · SPIRIT DIVE", 27: "DEVIL UNION", 28: "DEVIL UNION",
                    29: "BLACK ASTA", 30: "DEVIL UNION", 31: "BLACK ASTA · SPIRIT DIVE", 37: "DEVIL UNION · SPIRIT DIVE",
                    39: "SPIRIT DIVE", 41: "DEVIL UNION · SPIRIT DIVE", 48: "VALKYRIE"},
    "MHA": {2: "DARK DEKU", 7: "FULL COWL"},
}
for a, d in TRANSFO.items():
    for n, t in d.items(): CORR.setdefault((a, n), {})["type"] = t

# Corrections de Rico (26/11) : Demon Slayer passées en spéciales, noms corrigés
for k, v in {("Demon Slayer", 103): dict(nom="Tengen Uzui", special="sumi"), ("Demon Slayer", 107): dict(special="sumi"),
             ("Demon Slayer", 105): dict(special="sakuga"), ("Demon Slayer", 100): dict(special="celluloid"),
             ("Demon Slayer", 92): dict(special="reiatsu"), ("Demon Slayer", 91): dict(nom="Giyu Tomioka", special="genga"),
             ("Demon Slayer", 89): dict(special="hanga")}.items():
    CORR.setdefault(k, {}).update(v)

# Corrections de Rico (26/11, 2e série) : Demon Slayer
for k, v in {("Demon Slayer", 86): dict(nom="Demon Slayer", type="ILLUSTRATION"), ("Demon Slayer", 81): dict(nom="Kyojuro Rengoku"),
             ("Demon Slayer", 80): dict(special="sakuga"), ("Demon Slayer", 71): dict(special="celluloid"),
             ("Demon Slayer", 68): dict(nom="Giyu Tomioka"), ("Demon Slayer", 69): dict(nom="Tanjiro & Rengoku"),
             ("Demon Slayer", 63): dict(special="reiatsu"), ("Demon Slayer", 53): dict(special="ekonte"),
             ("Demon Slayer", 47): dict(nom="Doma"), ("Demon Slayer", 13): dict(nom="Tengen Uzui"),
             ("Demon Slayer", 10): dict(nom="Akaza")}.items():
    CORR.setdefault(k, {}).update(v)

# Dragon Ball : anime selon le tri du disque (CARTES 4K\DBZ, \DBGT, le reste = Super)
# et transformation visible, écrite sur la petite ligne au-dessus du nom.
DBZ = {1, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 19, 23, 24, 26, 28, 29, 31, 32, 34, 35, 37, 40, 42, 43, 44, 50, 53, 56, 57, 58,
       60, 61, 62, 63, 64, 66, 67, 68, 70, 71, 72, 81, 82, 84, 85, 87, 90, 91, 92, 94, 96, 98, 99, 101, 102, 105, 106, 107, 108}
DBGT = {2, 20, 74, 88}
SSJ, SSJ2, SSJ4, GOD, BLUE = "SUPER SAIYAN", "SUPER SAIYAN 2", "SUPER SAIYAN 4", "SUPER SAIYAN GOD", "SUPER SAIYAN BLUE"
FORME = {3: SSJ, 5: GOD, 11: "FORME ORIGINELLE", 16: SSJ2, 17: SSJ, 18: "QUATRIÈME FORME", 19: "MAJIN", 21: GOD, 22: GOD, 23: SSJ,
         24: "FORME FINALE", 30: "ORANGE PICCOLO", 31: "MAJIN", 32: "FORME FINALE", 35: SSJ, 37: "FORME FINALE", 38: GOD,
         41: "ULTRA INSTINCT", 44: SSJ, 46: GOD, 49: GOD, 53: SSJ, 55: SSJ, 56: SSJ, 57: SSJ, 58: SSJ, 60: SSJ2, 61: SSJ2, 62: SSJ,
         63: SSJ, 64: SSJ2, 66: SSJ, 67: SSJ, 68: SSJ, 70: SSJ, 72: SSJ2, 73: GOD, 74: SSJ4, 75: SSJ, 77: "ORANGE PICCOLO & BEAST",
         78: BLUE, 80: "BEAST", 81: SSJ, 82: SSJ2, 83: "BEAST", 84: SSJ2, 87: SSJ2, 89: BLUE, 91: SSJ, 93: "BEAST", 94: SSJ, 95: GOD,
         96: SSJ, 97: SSJ4, 98: SSJ, 99: SSJ, 100: BLUE, 101: SSJ2, 102: SSJ, 103: GOD, 104: "BEAST", 106: SSJ2, 107: SSJ2}
for n in range(1, 109):
    c = CORR.setdefault(("DBSBEERUS", n), {})
    if n in DBZ: c["anime"] = "Dragon Ball Z"
    elif n in DBGT: c["anime"] = "Dragon Ball GT"
    if n in FORME: c["type"] = FORME[n]
CORR[("DBSBEERUS", 74)]["nom"] = "Gogeta"          # la transformation passe sur la ligne du dessus
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
