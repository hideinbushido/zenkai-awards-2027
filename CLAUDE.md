# Garde-fous design — Zenkai Anime Awards 2027

Branche de travail : `main`. Carnet : ATELIER.md. Produit : PRODUCT.md. Tokens, recettes et Brief DA : DESIGN.md (à lire avant toute modification d'interface).

Skills à appliquer : `qualite-web` (standard anti-slop), `atelier-web` (section par section, validation avant de coder), et pour la motion `emil-design-eng` / `apple-design`.

## Composants
- 21st.dev et GetLayers comme références d'abord pour les fonds, les trames et les effets : on regarde, on décode, on fait notre version avec les tokens de DESIGN.md ; on ne colle jamais un prompt ou un composant tel quel.
- Bases de code éventuelles (React Bits, shadcn) : toujours retouchées aux tokens et recettes de DESIGN.md.

## Interdits (AI slop)
- Polices : Inter, Roboto, Arial, Open Sans, Space Grotesk, Lato, Geist, pile système seule. Polices du projet : Zen Old Mincho (titres) et Schibsted Grotesk (texte).
- Couleurs Tailwind par défaut ; toute couleur hors des tokens de DESIGN.md.
- Le doré de 2026, les dégradés, le verre flouté, les halos, le néon, les ombres (y compris les ombres décalées dures).
- Le rouge `--impact` en décoration : il signifie toujours « gagnant » ou « voté ».
- Grilles de cartes identiques, cartes dans des cartes, la structure « hero centré + badge + 3 cartes ».
- Sur-titres au-dessus des titres, numéros 01/02/03 décoratifs, emojis en icônes, flèche → collée aux boutons, mot en italique ou en couleur dans un titre.
- Chiffres, témoignages ou statistiques inventés : marquer `[À FOURNIR]`.
- Plus de 3 flashs par seconde ; tout effet de révélation coupé avec `prefers-reduced-motion`.

## Tests avant de montrer
- Détecteurs : `node ~/.agents/skills/avoid-ai-design/scripts/detect.mjs src` et `npx impeccable detect src`.
- Test du générique : logo caché (reconnaissable ?), écart avec la planche de référence, code (rayons, `shadow-*`, gris par défaut, `transition: all`).
- Captures à 390, 1440 et 1920 px ; clavier ; `prefers-reduced-motion`.

## Direction du site
« Impact frame » : bichromie encre #0B0B0C / papier #F4F4F1 qui s'inverse au contact, rouge #E1121B réservé aux gagnants et aux votes, lignes de vitesse et trames de points, aucun arrondi, bordures de cases 2 px, coupes sèches (steps) pour les états, un seul moment orchestré par page. Vote par plaques verticales qui se retournent avec le tampon 票. Détails : DESIGN.md.
