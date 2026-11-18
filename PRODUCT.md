# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router, TypeScript), Firebase / Firestore, emails transactionnels, déploiement Vercel. Nouveau dépôt pour l'édition 2027 ; l'édition 2026 (dépôt `anime-awards`) reste en ligne comme archive.

## Users

Fans d'animé francophones (et anglophones), majoritairement arrivés depuis TikTok sur téléphone, souvent le soir. Ils viennent voter pour leurs favoris de l'année, puis suivre le live de révélation. Second public : l'équipe (Corentin « Rico » Kouamé et les présentateurs) qui administre l'édition.

## Product Purpose

Les Zenkai Anime Awards sont une cérémonie communautaire annuelle : la communauté vote, la communauté décide, et les résultats sont révélés en direct sur TikTok, enveloppe par enveloppe, par des créateurs invités. Succès : beaucoup de votes complets et valides, une communauté qui revient pour le live, un palmarès qu'on partage.

## Positioning

Pas de jury ni d'algorithme : seule la voix du public décide, et chaque prix est ouvert en direct par un créateur de la communauté. C'est un événement de communauté, pas un média.

## Operating Context

- Calendrier 2027 (confirmé) : animés diffusés de janvier à décembre 2026 ; votes en mars–avril 2027 ; live début mai 2027 sur TikTok (@ricokouame).
- Statuts d'une édition : brouillon → préparation → votes ouverts → votes fermés → résultats publiés. Le site change de visage selon le statut.
- Vote : lien d'accès unique envoyé par email (24 h), un vote par adresse, progression conservée. **Nouveau en 2027 : on peut passer les catégories qu'on ne connaît pas.** « Animé de l'année » reste la dernière catégorie.
- Live : chaque catégorie est une « enveloppe » ouverte par un présentateur ; podium 1er / 2e / 3e.

## Capabilities and Constraints

- 25 catégories (séries, personnages, musique, technique, grand prix « Animé de l'année »).
- Nominés : image, nom, détail (série, saison), extrait audio pour openings / endings / chansons.
- Pages : accueil, catégories, nominés, vote (accès, parcours, confirmation), palmarès, archives, équipe / présentateurs, FAQ et règlement, avis du public.
- Admin : tableau de bord et statistiques de visites, gestion catégories / nominés / votes, export CSV, relances email, modération des avis, paramètres d'édition.
- Bilingue FR / EN.
- Non décidé : liste définitive des catégories 2027 et des nominés ; dates exactes ; présentateurs 2027.

## Brand Commitments

- Nom : « Zenkai Anime Awards », 2e édition en 2027. Emblème Zenkai (quatre pales autour d'un point) : `public/visuels/logo-zenkai-noir.png`.
- L'édition 2026 avait une DA « or prestige » : 2027 doit s'en distinguer nettement.
- Le son n'est jamais imposé : pas de fenêtre bloquante pour activer la musique.
- Ton : tutoiement chaleureux de fan à fan, français d'abord.

## Evidence on Hand

- Palmarès réel 2026 (dépôt `anime-awards`, `src/data/palmares2026.ts`) : ex. Animé de l'année = My Hero Academia (saison finale).
- Visuels 2026 (affiches, présentateurs) dans `public/visuels/`, **provisoires** : à remplacer par les nominés 2027.
- Aucun chiffre de participation 2026 vérifié ici : n'en afficher aucun sans source.

## Product Principles

1. La communauté décide : rien ne doit laisser penser à un jury ou à un classement éditorial.
2. Voter doit être un plaisir, pas un formulaire : on peut passer, revenir, écouter.
3. Le live est le sommet : tout le site prépare la révélation.
4. Chaque édition a son monde, mais Zenkai reste reconnaissable.

## Accessibility & Inclusion

Mobile d'abord (390 px), contraste AA, navigation clavier, `prefers-reduced-motion` respecté, son coupé par défaut.
