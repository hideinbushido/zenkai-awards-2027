# Zenkai Anime Awards 2027 · Thème Holo · Plan du site

## Idée maîtresse
Chaque **catégorie est un booster**. Ses **nominés sont les cartes holo** à l'intérieur.
On ouvre un booster pour découvrir ses nominés et voter. « Animé de l'année » est le booster secret, ouvert en dernier.

## Stack
Next.js 16, GSAP (ScrollTrigger, SplitText), Lenis (défilement fluide), three.js / @react-three/fiber pour le WebGL
(tissu holo, anneau de cartes, shaders), Canvas 2D pour le dither. Firebase pour les votes (comme en 2026).

## Effets demandés et où ils vivent
| Effet | Où |
|---|---|
| Shader background | Accueil : fond irisé vivant derrière le titre géant ; réagit à la souris |
| Holographic cloth | L'emballage de chaque booster : une feuille de foil qui ondule, qu'on peut attraper |
| Motion (scènes) | Toutes les pages : scènes plein écran enchaînées, GSAP + Lenis |
| Text animations | Tous les grands titres : apparitions lettre par lettre façon ressort (SplitText) |
| Liquid colour | Page d'une catégorie : fond de couleur liquide propre à chaque famille (séries, persos, musique, technique) |
| Refract | Palmarès et carte secrète : l'image vue à travers un verre cannelé qui se dissipe à la révélation |
| Dither art | Transitions entre pages, « Comment ça marche », FAQ, état de chargement |

## Pages et site de référence de chacune

### 1. Accueil
- **Référence :** Marcus Vane (GetLayers) pour le premier écran ; Delta Cafés pour le rythme des scènes.
- **Premier écran :** ZENKAI en lettres géantes, une carte holo plantée *dans* les lettres (devant/derrière), shader irisé au fond.
- **Scènes :** le principe en 3 temps (dither) ; le mur de boosters (aperçu) ; « Animé de l'année », booster secret scellé ;
  Édition 1 (2026) ; rendez-vous live + rappel email.

### 2. Catégories : le mur de boosters
- **Référence :** Mirror Hall (GetLayers) pour l'anneau sur sol réfléchissant ; igloo.inc pour la présentation d'objets 3D.
- 25 boosters en tissu holo, rangés par famille, sur un sol miroir. Survol : le booster s'incline et brille. Clic : on va l'ouvrir.

### 3. Nominés : la page d'une catégorie (le moment fort du site)
- **Référence :** poke-holo / hover-tilt (cartes holo) ; Mirror Hall (anneau draggable).
- On arrive devant le booster scellé. Un geste (glisser ou clic) **déchire le haut du booster**, les cartes jaillissent
  et se déploient en anneau. Chaque carte : visuel, nom, série, extrait audio pour les openings / endings.
- Voter = choisir sa carte (elle se retourne, se pose sur la « fiche ») ; « Je ne connais pas » = passer le booster.
- Fond en couleur liquide selon la famille.

### 4. Voter (le parcours complet)
- **Référence :** Pokémon TCG Pocket (enchaînement des ouvertures de boosters) ; GetLayers « Boarding Pass » pour la confirmation.
- Accès par email (lien 24 h), puis booster après booster, progression sauvegardée, catégories passables,
  récapitulatif « ton classeur » (toutes tes cartes choisies), confirmation en ticket holo.

### 5. Palmarès (2026 maintenant, 2027 après le live)
- **Référence :** Delta Cafés (la frise d'objets éparpillés reliés par des fils) ; Cartier Watches & Wonders 2026 (révélation).
- Les gagnants comme cartes de collection éparpillées sur un grand plan, reliées par des fils ; réfraction qui se dissipe au survol.

### 6. Équipe et présentateurs
- **Référence :** Delta Cafés (le carrousel de portraits) ; Marcus Vane (portrait dans le nom).
- Chaque présentateur en carte holo « créateur » ; Rico en carte vedette.

### 7. FAQ et règlement
- **Référence :** sections FAQ GetLayers ; clarté façon documentation.
- Questions en accordéon, fond dither discret.

### 8. Archives
- **Référence :** Delta Cafés (histoire).
- Les éditions passées comme des sets de cartes : 2026 (Gold) en lien vers l'ancien site.

### Admin
Reprise des fonctionnalités 2026 (dashboard, catégories, nominés, votes, export, relances, modération), habillage sobre.

## Ordre de construction
1. Accueil (validation) → 2. Page d'une catégorie avec ouverture de booster (validation) → 3. Mur de boosters
→ 4. Parcours de vote → 5. Palmarès → 6. Équipe, FAQ, archives → 7. Admin et branchement Firebase.

## Ce qu'il me faut
- Les nominés 2027 (en attendant : visuels 2026, marqués provisoires).
- Feu vert pour des visuels générés si besoin (FLORA, prix annoncé avant).
