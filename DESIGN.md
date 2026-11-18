# DESIGN — Zenkai Anime Awards 2027 · « Impact frame »

Direction choisie le 18/11/2026 : **B, Impact frame**, avec la mécanique de vote par plaques de la direction C, redessinée dans ce monde. Planche de référence : https://claude.ai/artifact/Pb1y9SbkBMU8yMUJ3UWBfZ (planche « B — Impact frame », mise à jour avec les plaques).

## Brief DA

```
Projet        : Zenkai Anime Awards 2027, 2e édition. Faire voter les fans, servir le live, archiver le palmarès.
Sensation     : énergie et audace — le choc d'un coup décisif dans un animé.
Oui           : tranché, cinématique, communautaire     Non : doré, luxe générique, néon
Audace        : 5
Fond          : bichromie encre / papier, qui s'inverse
Couleurs      : encre, papier, un rouge d'impact réservé aux gagnants et aux votes validés
Titres        : Mincho japonais très gras (Zen Old Mincho 900), à la manière des cartons-titres d'animé
Formes        : angles vifs, bordures franches 2 px comme les cases d'un manga
Cartes        : remplacées par des plaques verticales (vote) et des cases (nominés, résultats)
Boutons       : bloc plein qui s'inverse en coupe sèche
Mouvement     : coupes sèches pour les états ; un seul moment orchestré par page (la révélation)
Références    : voir « Références décodées »
J'ai          : logo or 2026 (à décliner), palmarès 2026, photos des animateurs 2026
```

**Le monde.** Un *impact frame*, c'est l'image qui passe brutalement en noir et blanc inversé, souvent avec un rouge, au moment où un coup porte. Zenkai, c'est la force qui revient après le combat. Le site entier fonctionne comme ça : des champs d'encre et de papier qui s'inversent au contact, des lignes de vitesse, des trames de points, et le rouge seulement quand un fan vote ou qu'un gagnant tombe.

**La scène.** Des fans sur téléphone, souvent le soir, qui arrivent depuis TikTok ou pendant le live. D'où un monde majoritairement sombre, mais où le papier blanc prend des régions entières (pas un mode sombre avec un accent).

**Stratégie couleur.** Bichromie engagée : l'encre et le papier possèdent chacun des zones entières de la page ; le rouge reste sous 5 % de la surface.

## Tokens

```css
:root {
  /* Couleurs (rôle → valeur) */
  --ink: #0B0B0C;            /* fond encre, texte sur papier */
  --paper: #F4F4F1;          /* fond papier, texte sur encre */
  --ink-2: #1B1B1C;          /* surface sur encre : plaques et cases au repos */
  --mute-on-ink: #8C8C88;    /* texte secondaire sur encre (5,8:1) et sur ink-2 (5,1:1) */
  --mute-on-paper: #5A5A55;  /* texte secondaire sur papier (6,3:1) */
  --impact: #E1121B;         /* rouge : aplats, gagnant, vote validé, tampon 票. Texte blanc dessus (4,9:1). Texte rouge seulement ≥ 24 px sur encre */
  --impact-text-paper: #C40E17; /* petit texte rouge sur papier (5,6:1) */
  --impact-text-ink: #FF4D55;   /* petit texte rouge sur encre (6,0:1) */
  --rule-on-ink: rgb(244 244 241 / 0.18);
  --rule-on-paper: rgb(11 11 12 / 0.18);

  /* Typo */
  --font-display: "Zen Old Mincho", serif;      /* 700 / 900, Google Fonts, OFL */
  --font-text: "Schibsted Grotesk", sans-serif; /* 400 / 500 / 700 / 900, Google Fonts, OFL */
  --fs-wordmark: clamp(160px, 28vw, 420px);     /* ZENKAI en graphisme, aria-hidden, un vrai <h1> lisible à côté */
  --fs-h1: clamp(48px, 7vw, 96px);
  --fs-h2: clamp(36px, 5vw, 64px);
  --fs-h3: 32px;
  --fs-body: 18px;   /* interligne 1.55, mesure 60–70 caractères */
  --fs-small: 14px;
  --tracking-display: -0.01em;

  /* Espacements (échelle 4) */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px;
  --s-7: 48px; --s-8: 64px; --s-9: 96px; --s-10: 128px; --s-11: 192px;
  --gutter: 12px;    /* gouttière entre cases, comme un manga */

  /* Formes */
  --radius: 0;       /* aucun arrondi, nulle part */
  --border: 2px solid currentColor;  /* bordures de cases */

  /* Mouvement */
  --cut: 90ms steps(2, end);                       /* coupe sèche : états, survols, inversions */
  --flip: 320ms cubic-bezier(0.2, 0.8, 0.2, 1);    /* plaque qui se retourne */
  --slam: 420ms cubic-bezier(0.16, 1, 0.3, 1);     /* nom du gagnant qui tombe */
}
```

Règles fixes :
- **Aucune ombre.** La profondeur vient de l'inversion encre/papier et du chevauchement des cases. Pas d'ombre décalée « néo-brutaliste ».
- **Aucun dégradé décoratif**, aucun texte en dégradé, aucun verre flouté, aucun halo.
- **Une seule règle de bordure** : 2 px pleins de la couleur du texte pour les cases et plaques ; filets 1 px à 18 % pour séparer des lignes de liste.
- Chiffres tabulaires partout où il y a des nombres (`font-variant-numeric: tabular-nums`).
- Sélection de texte : fond `--impact`, texte blanc. Barres de défilement et curseur de saisie accordés à la palette.

## Recettes de composants

### Fond « encre » (hero, résultats, live)
- `--ink` plein + lignes de vitesse **dessinées comme dans un manga** : traits effilés, de largeurs et de longueurs irrégulières, qui partent d'un point de fuite (le titre ou le nom révélé). Les générer une fois en SVG (ou en canvas pour la révélation animée), jamais avec un `repeating-conic-gradient` régulier : des rayures parfaites sont une signature d'interface générée (le détecteur Impeccable la signale).
- Texture tramée en option, faite avec l'outil **Dither Art de GetLayers** (palette réglée sur encre et papier uniquement, jamais leur vert par défaut), opacité ≤ 12 %, en canvas 2D, coupée sur mobile si elle fait chuter les FPS.

### Fond « papier »
- `--paper` plein + trame de points là où il faut de la matière : `radial-gradient(var(--ink) 32%, transparent 34%)` en 14 px, masquée en dégradé pour qu'elle s'efface. Inspiré du mécanisme de « Halftone Shader Hop Films » (21st.dev), réduit à deux couleurs.

### Wordmark ZENKAI (hero)
- Zen Old Mincho 900, `--fs-wordmark`, `mix-blend-mode: difference` pour qu'il s'inverse en traversant la frontière encre/papier. `aria-hidden="true"` ; le titre accessible est un `<h1>` lisible (« Zenkai Anime Awards 2027 »).
- Option : logo or 2026 extrudé en 3D avec l'outil **SVG to 3D de GetLayers**, matière noire et papier (pas or), pour l'intro du live.

### Plaque de vote (remplace la carte)
- Plaque verticale, ratio 1 : 3,2, bordure 2 px `--paper` sur fond `--ink-2`. En haut, l'affiche du nominé passée en trame (niveaux de gris + contraste, ou dithering canvas). En bas, le nom en Zen Old Mincho 700, 22 px, en écriture verticale (`writing-mode: vertical-rl`), avec le titre aussi en texte horizontal pour l'accessibilité (`aria-label`).
- Chaque plaque est un vrai `<input type="radio">` avec son `<label>` (un groupe par catégorie, dans un `<fieldset>` avec `<legend>`) : une seule plaque retournée par catégorie, navigable au clavier avec les flèches.
- **États :**
  - repos : fond `--ink-2`, texte `--paper` ;
  - survol / focus visible : inversion en coupe sèche (`--cut`), fond `--paper`, texte `--ink` ; focus en plus : contour 3 px `--impact`, décalé de 4 px ;
  - sélectionnée : la plaque se retourne (`rotateY(180deg)`, `--flip`) et montre son dos rouge `--impact`, tampon 票 blanc en Zen Old Mincho 900, nom en blanc ;
  - votes fermés : opacité 0,45, `aria-disabled`, mention « Votes fermés » au-dessus du groupe.
- Sur téléphone : rangée défilante horizontale (accroche magnétique), plaques de 96 px de large minimum.

### Case nominé / résultat
- Case rectangulaire, bordure 2 px, gouttière 12 px de la couleur opposée. Le gagnant : case entière en `--impact`, « 1er » en Zen Old Mincho 900 très grand, texte blanc. 2e et 3e : cases normales, rang en 48 px.

### Bouton principal
- Bloc plein, aucun arrondi. Sur encre : fond `--paper`, texte `--ink` ; sur papier : l'inverse. Zen Old Mincho 900, 22 px, padding 20 px 36 px, libellé qui dit l'action (« Voter dans cette catégorie », « Proposer », « Recevoir mon lien d'accès »).
- **États :** survol = inversion en coupe sèche (`--cut`) + bordure 2 px pour garder la forme ; appui = `scale(.97)` ; focus = contour 3 px `--impact` décalé de 4 px ; désactivé = fond `--ink-2`, texte `--mute-on-ink`, curseur interdit.
- Un seul bouton principal par écran.

### Bouton secondaire et liens
- Lien texte souligné : épaisseur 2 px, décalage 6 px ; au survol l'épaisseur passe à 4 px en coupe sèche. Pas de flèche ajoutée au libellé.

### Séparateur
- Entre sections : changement de champ encre ↔ papier (la page s'inverse), pas de filet. Dans une liste : filet 1 px `--rule-on-*`.

### Champ de formulaire (lien d'accès e-mail, avis)
- Libellé au-dessus (vrai `<label>`, 16 px, 700). Champ : fond transparent, bordure basse 2 px, texte 18 px. Focus : bordure basse `--impact` + contour 3 px. Erreur : message sous le champ qui nomme le problème et la solution (« Ce lien a expiré : on t'en renvoie un ? »), en `--impact-text-*`, avec une icône SVG.

## Mouvement

- **Coupes sèches** (`--cut`) pour tous les changements d'état : survols, appuis, inversions. Pas de fondu, pas de glissement d'apparition sur chaque section.
- **Un seul moment orchestré par page :**
  - Accueil : le wordmark se pose, les lignes de vitesse convergent une fois.
  - Vote : la plaque qui se retourne et le tampon 票 qui s'imprime (le tampon descend de 1,15 à 1 avec `--slam`).
  - Résultats : la révélation d'une enveloppe = 2 images inversées de 80 ms (jamais plus de 3 flashs par seconde), tunnel de lignes de vitesse 600 ms (inspiration : scènes *Vortex & Tunnel* de GetLayers), puis le nom du gagnant qui tombe (`--slam`). « Rejouer la révélation » relance la séquence.
- `prefers-reduced-motion` : aucun flash, aucun tunnel ; changements instantanés, le tampon apparaît sans mouvement.

## États de contenu (à couvrir sur Vote et Résultats)

| État | Ce qu'on voit |
|---|---|
| Chargement | Structure de la page stable, plaques en `--ink-2` vides avec trame immobile |
| Vide | Nominés pas encore publiés : « Les nominés arrivent le [DATE]. » + lien vers les catégories |
| Erreur | Lien d'accès expiré ou invalide : message clair + bouton « Recevoir un nouveau lien » |
| Partiel | Certaines catégories votées : compteur « [n] / [total] catégories votées » en chiffres tabulaires, plaques retournées visibles |
| Succès | Vote enregistré : toutes les plaques retournées, message « Ton vote est enregistré. Rendez-vous au live le [DATE]. » |
| Permission | Pas de lien, déjà voté, ou votes fermés : explication + l'action possible (demander le lien, voir les nominés, attendre le live) |

## Grammaire des pages

- La page alterne des champs encre et papier pleine largeur ; chaque changement de champ est une « coupe ».
- Pas d'ordre de page standard (hero centré, rangée de logos, trois cartes). L'accueil s'ouvre sur le wordmark et l'état de l'édition (votes ouverts, fermés, live à venir), puis les catégories, puis l'équipe du live.
- Pas de sur-titres au-dessus des titres, pas de numéros décoratifs, pas d'emojis : icônes en SVG, un seul jeu (trait 2 px).
- Mesure du texte courant : 60 à 70 caractères.

## Références décodées

| Référence | URL | Ce qu'on retient |
|---|---|---|
| Ponpon Mania (BD web primée) | https://www.awwwards.com/ponpon-mania-a-comic-that-breathes-through-web-interaction.html | Base noir et blanc, la couleur seulement pour les moments forts ; cases animées en boucle légère ; transitions orchestrées entre cases |
| Halftone Shader Hop Films (21st.dev) | https://21st.dev/@zaiddagamseh/components/halftone-shader-hop-films | Mécanisme de trame en WebGL (densité des points selon la lumière), licence MIT. On réduit sa palette de 5 couleurs (#00001A, #2962FF, #42BDFF, #FFB5B3, #FFC14D) à encre + papier |
| HalftoneTrail (21st.dev) | https://21st.dev/@aayush-duhan/components/halftone-trail | Trame qui réagit au curseur : idée pour le survol des cases nominés (bureau seulement) |
| Dither Art (GetLayers) | https://www.getlayers.ai/tools/dither-art | 51 effets, 9 motifs de tramage, export en prompt canvas 2D. Palette à régler sur encre/papier ; leur rendu par défaut (vert sur noir) est exactement le cliché à éviter |
| SVG to 3D (GetLayers) | https://www.getlayers.ai/tools/svg-to-3d | Logo extrudé pour l'intro du live |
| Vortex & Tunnel (GetLayers, scènes 3D) | https://www.getlayers.ai/3d-scenes | Tunnel de lignes de vitesse pour la révélation ; à refaire en noir et blanc |

Valeurs exactes encore à mesurer pendant le build (atelier-web, « Décoder une référence ») : courbes et durées réelles de Ponpon Mania, densité de trame retenue.

## Interdits propres à ce projet

- Le doré de 2026 (dégradés or, particules dorées, bokeh) : c'est l'édition précédente.
- Ombres décalées dures, néon, verre, dégradés violets (y compris les fonds « Purple » de GetLayers).
- Le rouge utilisé comme décoration : il signifie toujours « gagnant » ou « voté ».
- Plus de 3 flashs par seconde.
