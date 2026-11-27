# Générateur des cartes ZENKAI 2027 (4K + animations)

Ce dossier fabrique les cartes officielles (2400 × 3352) et leurs boucles animées (mp4 de 4 à 6 s, 1080 × 1508)
à partir des images rangées dans `B:\OPENING 2026\<ANIME>\<RARETÉ>\`.

## Installation

```
pip install numpy opencv-python pillow skia-python torch spandrel "rembg[cpu]" scipy
```
Il faut aussi `ffmpeg` dans le PATH. Le modèle de détourage `isnet-anime` est téléchargé automatiquement par rembg.

Chemins (variables d'environnement, voir `chemins.py`) :
- `ZENKAI_SOURCES` : dossier des images (défaut `B:\OPENING 2026`)
- `ZENKAI_SORTIE` : où écrire les cartes (défaut `lot/` dans ce dossier)

## Les fichiers

| Fichier | Rôle |
|---|---|
| `inventaire.json`, `sources_map.json`, `noms.json` | liste des images, leur rareté, le nom du personnage |
| `manifeste.py` → `manifeste.json` | une entrée par carte : source, rareté, nom, numéro, crédit, spéciale, nominé. **Toutes les corrections de noms, spéciales, dézoom et « sans nom » sont dans le dict `CORR`** |
| `lot.py` | génère les cartes : détourage, cadrage, agrandissement ×4 (anime6b), habillage par rareté |
| `carte4k.py`, `hybride.py` | outils communs + cadres ÉCLAT, PRISME, SPECTRE, MIRAGE, ZENKAI |
| `zk_ref.py`, `zk_cadre.py` | cadre ZENKAI définitif (marbre noir + kintsugi + gravures art déco + éclat). Le cadre est mis en cache dans `modeles/cadre_zenkai_combo.npz` au premier lancement |
| `speciales.py`, `speciales2.py` | les éditions spéciales (genga, sakuga, celluloid, sumi, hanga, reiatsu, ekonte) |
| `anim_raretes.py` | animations SPECTRE, MIRAGE, ZENKAI (reflet de l'emblème) des cartes normales |
| `anim_speciales.py` | animations des spéciales (genga, celluloid, sumi, hanga, reiatsu…) + lumière du cadre Zenkai |
| `anim_sp2.py` | animations dédiées SAKUGA (3 raretés), GENGA SPECTRE et EKONTE (3 raretés) |
| `anim_etat.py` | compte les animations faites / à faire |

## Utilisation

```
python manifeste.py                      # après chaque correction dans CORR
python lot.py 0 704                       # génère les cartes manquantes (ne refait pas celles qui existent)
python anim_raretes.py spectre mirage zenkai
python anim_speciales.py
python anim_sp2.py                        # sakuga + genga spectre ;  python anim_sp2.py ekonte
python anim_etat.py
```
Pour refaire une carte : supprimer son .jpg (et son .mp4) puis relancer. Les scripts sautent tout ce qui existe déjà.

Lancer un seul générateur à la fois (environ 3 à 5 Go de mémoire).

## Corriger une carte (exemples dans `CORR`)

```python
("JJK", 55): dict(nom="Maki Zen'in"),                 # renommer
("FIREforce", 28): dict(special="sumi"),              # passer en spéciale
("Wistoria", 4): dict(sans_nom=True),                 # nom déjà dans l'image
("DBSBEERUS", 74): dict(anime="Dragon Ball GT"),      # changer le nom d'anime affiché
("BLACKCLOVER", 44): dict(dezoom=1.3),                # dézoomer le cadrage
```
La clé est `(dossier, numéro de carte)`. Le nom de fichier change avec le nom ou la spéciale : supprimer l'ancien fichier sur le disque.

## À faire
- Dragon Ball : le tri DBZ / DBGT / DBS est fait dans les dossiers. Il faut passer le bon `anime` et le bon crédit
  pour chaque carte, et ajouter la transformation (SUPER SAIYAN 4, ULTRA INSTINCT…) dans `type` (petite ligne au-dessus du nom).
- 76 images « Inconnu » dans `B:\OPENING 2026\_A NOMMER\` : à nommer dans `noms.json`.
