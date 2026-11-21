# DESIGN — Zenkai Anime Awards 2027, édition Holo

## Fiche de direction
- **Référence** : packs et cartes à collectionner (foil holographique), planches de manga encrées ; rythme éditorial de deltacafes.com/en, scènes vivantes de GetLayers (principe seulement).
- **Couleur** : nacre (`--fond` oklch 0.968) + encre graphite (`--encre` oklch 0.2) ; le spectre holo (`--spectre`) est une matière, pas un décor. Une couleur d'accent par famille de boosters (séries cyan, personnages violet, musique rose, technique citron, grand prix or). Le sombre (`--nuit`) seulement en contrepoint.
- **Typo** : Archivo condensé 900 pour les affiches (Google Fonts, OFL), Onest pour le texte (OFL), Michroma pour les numéros de carte (OFL).
- **Intention** : fan arrivé de TikTok sur téléphone ; première action = ouvrir un booster et garder une carte.
- **Interdits** : cartes identiques numérotées comme structure de page ; ombres floues génériques sur les contrôles ; éventails et rotations gratuites quand on doit comparer ; texte gris sur fond chargé ; mot accentué en couleur dans un titre.

## Système
- **Encre et holo** : tout objet qu'on manipule (booster, bouton, barre de navigation, panneau d'action) a un contour d'encre de 2,5 px et une ombre franche décalée. Bouton principal : fond encre, ombre en foil (`--spectre`). Bouton secondaire : fond perle, ombre encre. Au clic, le bouton s'enfonce dans son ombre.
- **Cartes** : format 63:88, foil qui suit le pointeur. Comparées, elles sont toujours **en ligne**, droites et de même taille.
- **Collection** : 25 emplacements, une carte par booster ; on peut passer. L'emplacement vide est en pointillé avec le booster en attente.
- **Mouvement** : `expo.out`, 0,6 / 1,1 / 1,6 s ; entrée à l'écran puis boucle (foil, reflet) ; pas de scrub.
- **Fond** : mur des animés 2026 derrière un verre cannelé holographique, voile nacré pour la lisibilité.
