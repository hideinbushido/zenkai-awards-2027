// Données communes aux trois prototypes de l'édition 2027.
// Les nominés sont PROVISOIRES : visuels de l'édition 2026 en attendant la sélection 2027.

export const EDITION = {
  numero: 2,
  annee: 2027,
  periode: "Animés diffusés de janvier à décembre 2026",
  votes: "Mars – avril 2027",
  live: "Mai 2027",
  liveOu: "En direct sur TikTok · @ricokouame",
  tiktok: "https://www.tiktok.com/@ricokouame",
} as const;

export type Categorie = { id: string; titre: string; court: string; famille: Famille };
export type Famille = "series" | "personnages" | "musique" | "technique" | "grand-prix";

export const CATEGORIES: Categorie[] = [
  { id: "action", titre: "Meilleur animé d'action", court: "Action", famille: "series" },
  { id: "comedie", titre: "Meilleure comédie", court: "Comédie", famille: "series" },
  { id: "romance", titre: "Meilleure romance", court: "Romance", famille: "series" },
  { id: "slice", titre: "Meilleur slice of life", court: "Slice of life", famille: "series" },
  { id: "drama", titre: "Meilleur drama", court: "Drama", famille: "series" },
  { id: "seinen", titre: "Meilleur seinen", court: "Seinen", famille: "series" },
  { id: "isekai", titre: "Meilleur isekai", court: "Isekai", famille: "series" },
  { id: "nouveaute", titre: "Meilleure nouveauté", court: "Nouveauté", famille: "series" },
  { id: "suite", titre: "Meilleure suite", court: "Suite", famille: "series" },
  { id: "film", titre: "Meilleur film d'animation", court: "Film", famille: "series" },
  { id: "deception", titre: "Déception de l'année", court: "Déception", famille: "series" },
  { id: "protagoniste", titre: "Meilleur protagoniste", court: "Protagoniste", famille: "personnages" },
  { id: "antagoniste", titre: "Meilleur antagoniste", court: "Antagoniste", famille: "personnages" },
  { id: "feminin", titre: "Meilleur personnage féminin", court: "Perso féminin", famille: "personnages" },
  { id: "masculin", titre: "Meilleur personnage masculin", court: "Perso masculin", famille: "personnages" },
  { id: "secondaire", titre: "Meilleur personnage secondaire", court: "Second rôle", famille: "personnages" },
  { id: "sensei", titre: "Meilleur sensei", court: "Sensei", famille: "personnages" },
  { id: "attachant", titre: "Personnage le plus attachant", court: "Attachant", famille: "personnages" },
  { id: "opening", titre: "Meilleur opening", court: "Opening", famille: "musique" },
  { id: "ending", titre: "Meilleur ending", court: "Ending", famille: "musique" },
  { id: "chanson", titre: "Meilleure chanson d'animé", court: "Chanson", famille: "musique" },
  { id: "animation", titre: "Meilleure animation", court: "Animation", famille: "technique" },
  { id: "chara", titre: "Meilleur chara-design", court: "Chara-design", famille: "technique" },
  { id: "combat", titre: "Meilleur combat", court: "Combat", famille: "technique" },
  { id: "annee", titre: "Animé de l'année", court: "Animé de l'année", famille: "grand-prix" },
];

export type Nomine = { id: string; nom: string; detail?: string; img: string };

const v = (f: string) => `/visuels/${f}.webp`;

// Une catégorie de démonstration par prototype, avec de vrais visuels.
// Nominés « Animé de l'année » de l'édition 2026, utilisés comme exemples.
export const NOMINES_ANNEE: Nomine[] = [
  { id: "mha", nom: "My Hero Academia", img: v("annee-mha") },
  { id: "takopi", nom: "Le Péché originel de Takopi", img: v("annee-takopi") },
  { id: "gachiakuta", nom: "Gachiakuta", img: v("annee-gachiakuta") },
  { id: "dandadan", nom: "Dandadan", img: v("annee-dandadan") },
  { id: "carnet", nom: "Les Carnets de l'apothicaire", img: v("annee-carnet") },
  { id: "kaiju", nom: "Kaiju No. 8", img: v("annee-kaiju") },
];

// Nominés « Meilleur protagoniste » de l'édition 2026, utilisés comme exemples.
export const NOMINES_PROTAGONISTE: Nomine[] = [
  { id: "midoriya", nom: "Izuku Midoriya", detail: "My Hero Academia", img: v("prota-midoriya") },
  { id: "jinwoo", nom: "Sung Jinwoo", detail: "Solo Leveling", img: v("prota-jinwoo") },
  { id: "maomao", nom: "Maomao", detail: "Les Carnets de l'apothicaire", img: v("prota-mao") },
  { id: "denji", nom: "Denji", detail: "Chainsaw Man", img: v("prota-denji") },
  { id: "sakamoto", nom: "Taro Sakamoto", detail: "Sakamoto Days", img: v("prota-sakamoto") },
  { id: "senku", nom: "Senku", detail: "Dr. Stone", img: v("prota-senku") },
];

// Vrais résultats 2026 (src/data/palmares2026.ts du dépôt anime-awards).
export const PALMARES_2026 = [
  { categorie: "Animé de l'année", gagnant: "My Hero Academia", img: v("annee-mha"), presentateur: "Rico", handle: "@ricokouame", photo: null },
  { categorie: "Meilleure romance", gagnant: "Bloom", img: v("romance-bloom"), presentateur: "Y-Gaëtan", handle: "@yvesgaetan", photo: v("pres-gaetan") },
  { categorie: "Meilleur combat", gagnant: "Akaza vs Giyu & Tanjiro", img: v("combat-akavstan"), presentateur: "Alex Kagami", handle: "@alexkagami.manga", photo: v("pres-kagami") },
] as const;

// Présentateurs qui ont ouvert les enveloppes en 2026 (palmares2026.ts, dépôt anime-awards).
export const PRESENTATEURS_2026 = [
  "Tempest", "Y-Gaëtan", "Hermione", "Daan", "Shadow", "Afro Joestar", "Stylouish", "Alex Kagami",
  "Jason", "Senior Sendo", "Afro Otaku", "Spyro", "Tsunade Desty", "Le Zumaki", "Jeremiah", "Elyza",
  "Yvendis", "Mikassa237", "Sensei TV", "Mr. Hunter", "Braizanime", "Tomi-tan", "Le Grand G", "Rico",
] as const;
