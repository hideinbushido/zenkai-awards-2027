# Atelier — Zenkai Anime Awards 2027

Mode : nouveau site (nouveau dépôt, même stack que 2026 : Next.js + Firebase + Vercel)
Brief DA : décidé le 18/11/2026 (champ libre donné par l'organisateur) — voir DESIGN.md
Direction : « Impact frame » + vote par plaques — voir DESIGN.md
Polices : Zen Old Mincho (Google Fonts, OFL), Schibsted Grotesk (Google Fonts, OFL)
Planche : https://claude.ai/artifact/Pb1y9SbkBMU8yMUJ3UWBfZ

## Sections (accueil)
| Section | Forme | Source(s) | Exemples 21st.dev / GetLayers | État |
|---|---|---|---|---|
| Nav | barre fine qui s'inverse sur la frontière encre/papier | planche B | — | à faire |
| Hero | champ coupé encre / papier, wordmark qui s'inverse | planche B ; Ponpon Mania (noir et blanc + couleur rare) | Halftone Shader Hop Films ; Dither Art | à faire |
| État de l'édition | bande pleine largeur : votes ouverts / fermés / live | — | — | à faire |
| Catégories | liste en cases de tailles différentes, Grand Prix en grand | — | — | à faire |
| Animateurs du live | portraits tramés en cases | 2026 (contenu) | HalftoneTrail | à faire |
| Avis | formulaire pseudo + message | 2026 (fonction) | — | à faire |

## Pages
Accueil, À propos, Catégories, Nominés, Voter (plaques), Résultats (enveloppes + rejouer), Archives (2026 + 2027), FAQ, Équipe, Admin (connexion, catégories, nominés, votes, résultats), FR / EN.

## Références décodées
| Référence | URL | Valeurs clés retenues |
|---|---|---|
| Halftone Shader Hop Films | https://21st.dev/@zaiddagamseh/components/halftone-shader-hop-films | trame WebGL, palette réduite à encre + papier |
| Dither Art | https://www.getlayers.ai/tools/dither-art | tramage canvas 2D, palette encre/papier, opacité ≤ 12 % |
| Ponpon Mania | https://www.awwwards.com/ponpon-mania-a-comic-that-breathes-through-web-interaction.html | noir et blanc, couleur pour les moments forts ; courbes à mesurer |

## Assets
| Asset | Origine | Inspiré de | Utilisé où |
|---|---|---|---|
| Logo Zenkai 2027 | à décliner depuis le logo or 2026 (version encre/papier) | — | nav, hero, live |
| Logo 3D (option) | GetLayers SVG to 3D | — | intro du live |
| Affiches des nominés | à fournir | — | plaques, cases |
| Sons (clic, tampon) | générés dans le code | React Bits | vote |

## Décisions
- 18/11/2026 : direction B « Impact frame » retenue, avec le vote par plaques de C. Raison : colle au live et à la révélation, et les outils GetLayers (Dither Art, SVG to 3D, tunnels) servent cette direction.
- 18/11/2026 : titres en Zen Old Mincho 900 plutôt qu'une grotesque condensée, pour éviter le cliché « encre plate + grotesque condensée + ombres décalées ».
- 18/11/2026 : règle de vote 2026 conservée (un vote par personne, lien d'accès par e-mail).

## Prochaine étape
Valider la planche B v2, puis la session Claude Code du PC crée le dépôt et construit le hero (fiche idée d'abord).
