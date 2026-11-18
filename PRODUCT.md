# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Nouveau dépôt, même stack qu'en 2026 (réponse de l'organisateur, 18/11/2026) : Next.js (TypeScript) hébergé sur Vercel, Firebase pour la base de données et l'authentification. Le dépôt 2026 (`hideinbushido/anime-awards`) sert de référence pour la logique (vote, résultats, admin), pas pour l'interface.

## Users

- **Les fans d'anime francophones**, surtout la communauté TikTok de l'organisateur. Ils arrivent souvent sur téléphone, depuis une vidéo ou un live. Leur job : voir les catégories et les nominés, voter une fois, puis suivre la révélation des gagnants.
- **L'équipe** (fondateur, partenaires, monteurs, animateurs du live) : gère les catégories, les nominés, l'ouverture et la fermeture des votes, les résultats.
- **Les créateurs qui ouvrent les enveloppes** pendant le live : chaque catégorie est révélée par une personne différente.

## Product Purpose

Les Zenkai Anime Awards sont un événement communautaire annuel qui récompense les animés, personnages et moments de l'année, uniquement par le vote du public. 2027 est la deuxième édition. Le site sert à présenter l'édition, faire voter, puis garder le palmarès et les archives.

Réussite : un maximum de fans votent (un vote par personne), le live de révélation est suivi, et le palmarès reste consultable ensuite.

## Positioning

Pas de jury, pas d'algorithme : uniquement la voix des fans. Chaque catégorie est révélée par un créateur de la communauté pendant un live TikTok.

## Operating Context

- Le cycle d'une édition : catégories et nominés publiés → votes ouverts → votes fermés → cérémonie en live TikTok (@ricokouame) → résultats publiés catégorie par catégorie (« enveloppes »).
- Le vote passe par un lien d'accès envoyé par e-mail, un seul vote par personne (règle conservée de 2026).
- Le site est bilingue français / anglais.

## Capabilities and Constraints

Fonctions de 2026 conservées :
- Accueil, À propos, Catégories, Nominés par catégorie (navigation « suivant »), Voter, Résultats, Archives (édition par édition), FAQ et règlement, Équipe, animateurs du live, avis des visiteurs (pseudo + message, 500 caractères), bouton son.
- Résultats : une enveloppe par catégorie, avec le créateur qui l'a ouverte, le podium (1er, 2e, 3e) et « Rejouer la révélation ».
- Espace admin : connexion, gestion des catégories et des nominés, résultats des votes, ouverture et fermeture des votes.

Nouveau en 2027 :
- **Vote par plaques** : voter dans une catégorie = retourner la plaque de son nominé ; la plaque retournée porte le tampon 票 (« vote »).

À décider (ne pas inventer) :
- Dates des votes et du live, liste et nombre des catégories 2027, nominés.

## Brand Commitments

- Nom : Zenkai Anime Awards (全快 : la force qui revient pleinement après le combat).
- Logo or de 2026 existant ; une déclinaison adaptée à la direction 2027 est à produire.
- Contact public de l'organisateur et liens TikTok de l'équipe : voir la page Équipe 2026.

## Evidence on Hand

- Palmarès complet 2026 (25 enveloppes) en ligne sur https://animeawards-alpha.vercel.app/fr/resultats : réutilisable dans les archives.
- Photos des animateurs du live 2026, liste de l'équipe 2026.
- Aucun chiffre de participation 2026 fourni : ne pas afficher de nombre de votants, de vues ou de statistiques tant qu'il n'est pas donné.

## Product Principles

1. La voix des fans d'abord : rien sur le site ne doit laisser croire à un jury ou à un classement fabriqué.
2. Voter doit être rapide sur téléphone, une catégorie après l'autre, avec un état clair (voté, pas encore voté, votes fermés).
3. La révélation est le moment fort : le site sert le live, il ne le remplace pas.
4. Chaque édition s'archive : 2026 et 2027 restent consultables côte à côte.

## Accessibility & Inclusion

- Public jeune et mobile : cibles tactiles ≥ 44 px, textes lisibles sur petit écran.
- Les effets de révélation (inversions noir/blanc) ne doivent jamais dépasser 3 flashs par seconde (WCAG 2.3.1) et sont coupés avec `prefers-reduced-motion`.
- Son jamais lancé automatiquement.
