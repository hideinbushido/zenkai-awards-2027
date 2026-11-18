// Palmarès des Zenkai Anime Awards 2026 (résultats révélés en direct).
// Ordre = ordre de passage pendant le live. Images : /public/image/<DOSSIER>/...
// Photos des présentateurs : /public/image/presentateurs/...

export interface PodiumEntry {
  name: string;
  /** anime, artiste ou studio affiché sous le nom */
  sub?: string;
  img: string;
}

export interface Winner extends PodiumEntry {
  /** studio, auteur, doubleur ou artiste (crédits officiels du live) */
  credit?: string;
}

export interface Presenter {
  name: string;
  handle?: string;
  photo?: string;
}

export interface PalmaresCategory {
  id: string;
  titleFr: string;
  titleEn: string;
  presenter: Presenter;
  winner: Winner;
  second?: PodiumEntry;
  third?: PodiumEntry;
}

const P = (file: string) => `/visuels/2026/pres-${file.replace(/.[a-z]+$/i, '')}.webp`;

export const PALMARES_2026: PalmaresCategory[] = [
  {
    id: 'p-deception', titleFr: 'Déception de l’année', titleEn: 'Disappointment of the Year', presenter: { name: 'Tempest', handle: '@guy.di.tempest', photo: P('tempest.webp') },
    winner: { name: 'One-Punch Man', sub: 'Saison 3', credit: 'J.C.Staff · ONE', img: '/visuels/2026/deception-one.webp' },
    second: { name: 'The Beginning After the End', sub: 'Saison 2', img: '/visuels/2026/deception-tbate.webp' },
    third: { name: 'Blue Lock', sub: 'Saison 2', img: '/visuels/2026/deception-blue-lock-s2.webp' },
  },
  {
    id: 'p-romance', titleFr: 'Meilleure romance', titleEn: 'Best Romance', presenter: { name: 'Y-Gaëtan', handle: '@yvesgaetan', photo: P('gaetan.webp') },
    winner: { name: 'Bloom', credit: 'CloverWorks · Saka Mikami', img: '/visuels/2026/romance-bloom.webp' },
    second: { name: 'My Dress-Up Darling', sub: 'Saison 2', img: '/visuels/2026/romance-dress.webp' },
    third: { name: 'Blue Box', img: '/visuels/2026/romance-box.webp' },
  },
  {
    id: 'p-sol', titleFr: 'Meilleur slice of life', titleEn: 'Best Slice of Life', presenter: { name: 'Hermione', handle: '@hermione.rbl_', photo: P('hermione.webp') },
    winner: { name: 'Spy × Family', sub: 'Saison 3', credit: 'Wit Studio & CloverWorks · Tatsuya Endo', img: '/visuels/2026/slice-spy.webp' },
    second: { name: 'My Dress-Up Darling', sub: 'Saison 2', img: '/visuels/2026/slice-dress.webp' },
    third: { name: 'Anne Shirley', img: '/visuels/2026/slice-anne.webp' },
  },
  {
    id: 'p-comedie', titleFr: 'Meilleure comédie', titleEn: 'Best Comedy', presenter: { name: 'Daan', handle: '@king_w_dan', photo: P('daan.webp') },
    winner: { name: 'Spy × Family', sub: 'Saison 3', credit: 'Wit Studio & CloverWorks · Tatsuya Endo', img: '/visuels/2026/comedie-spy.webp' },
    second: { name: 'Konosuba', sub: 'Saison 3 · Bonus Stage', img: '/visuels/2026/comedie-bonus.webp' },
    third: { name: 'Ranma ½', img: '/visuels/2026/comedie-ranma.webp' },
  },
  {
    id: 'p-isekai', titleFr: 'Meilleur isekai', titleEn: 'Best Isekai', presenter: { name: 'Shadow', handle: '@accelerator_07', photo: P('shadow.webp') },
    winner: { name: 'Re:Zero', sub: 'Saison 3', credit: 'White Fox · Tappei Nagatsuki', img: '/visuels/2026/isekai-rezero.webp' },
    second: { name: 'Lord of the Mysteries', img: '/visuels/2026/isekai-lord.webp' },
    third: { name: 'The Rising of the Shield Hero', sub: 'Saison 4', img: '/visuels/2026/isekai-shield.webp' },
  },
  {
    id: 'p-seinen', titleFr: 'Meilleur seinen', titleEn: 'Best Seinen', presenter: { name: 'Afro Joestar', handle: '@afrothecreator', photo: P('afro.webp') },
    winner: { name: 'Les Carnets de l’apothicaire', sub: 'Saison 2', credit: 'Toho Animation Studio & OLM · Natsu Hyūga', img: '/visuels/2026/seinen-carnet.webp' },
    second: { name: 'Orb', sub: 'Du mouvement de la Terre', img: '/visuels/2026/nouveaute-orb.webp' },
    third: { name: 'The Summer Hikaru Died', img: '/visuels/2026/seinen-summer.webp' },
  },
  {
    id: 'p-antagoniste', titleFr: 'Meilleur antagoniste', titleEn: 'Best Antagonist', presenter: { name: 'Stylouish', handle: '@stylouish', photo: P('stylouish.webp') },
    winner: { name: 'All For One', sub: 'My Hero Academia', credit: 'Voix japonaise : Akio Ōtsuka', img: '/visuels/2026/antagoniste-all.webp' },
    second: { name: 'Akaza', sub: 'Demon Slayer', img: '/visuels/2026/antagoniste-akaza.webp' },
    third: { name: 'Yhwach', sub: 'Bleach TYBW', img: '/visuels/2026/antagoniste-yhwach.webp' },
  },
  {
    id: 'p-combat', titleFr: 'Meilleur combat', titleEn: 'Best Fight', presenter: { name: 'Alex Kagami', handle: '@alexkagami.manga', photo: P('kagami.webp') },
    winner: { name: 'Akaza vs Giyu & Tanjiro', sub: 'Demon Slayer : La Forteresse Infinie', credit: 'Ufotable', img: '/visuels/2026/combat-akavstan.webp' },
    second: { name: 'Bakugo vs All For One', sub: 'My Hero Academia', img: '/visuels/2026/combat-bakvsafo.webp' },
    third: { name: 'Jinwoo vs Beru', sub: 'Solo Leveling', img: '/visuels/2026/combat-jinvsber.webp' },
  },
  {
    id: 'p-protagoniste', titleFr: 'Meilleur protagoniste', titleEn: 'Best Protagonist', presenter: { name: 'Jason', handle: '@_aljason_', photo: P('jason.webp') },
    winner: { name: 'Izuku Midoriya', sub: 'My Hero Academia', credit: 'Voix japonaise : Daiki Yamashita', img: '/visuels/2026/prota-midoriya.webp' },
    second: { name: 'Sung Jinwoo', sub: 'Solo Leveling', img: '/visuels/2026/prota-jinwoo.webp' },
    third: { name: 'Maomao', sub: 'Les Carnets de l’apothicaire', img: '/visuels/2026/prota-mao.webp' },
  },
  {
    id: 'p-action', titleFr: 'Meilleur animé d’action', titleEn: 'Best Action Anime', presenter: { name: 'Senior Sendo', handle: '@senior.sendo', photo: P('sendo.webp') },
    winner: { name: 'My Hero Academia', sub: 'Saison finale', credit: 'Studio Bones · Kōhei Horikoshi', img: '/visuels/2026/action-mha.webp' },
    second: { name: 'Fire Force', sub: 'Saison 3', img: '/visuels/2026/action-fire.webp' },
    third: { name: 'Solo Leveling', sub: 'Saison 2', img: '/visuels/2026/action-solo.webp' },
  },
  {
    id: 'p-drama', titleFr: 'Meilleur drama', titleEn: 'Best Drama', presenter: { name: 'Afro Otaku', handle: '@audeanselm', photo: P('aude.webp') },
    winner: { name: 'Le Péché originel de Takopi', credit: 'Enishiya · Taizan 5', img: '/visuels/2026/drame-takopi.webp' },
    second: { name: 'Les Carnets de l’apothicaire', sub: 'Saison 2', img: '/visuels/2026/drame-carnet.webp' },
    third: { name: 'To Your Eternity', sub: 'Saison 3', img: '/visuels/2026/drame-eternity.webp' },
  },
  {
    id: 'p-chara', titleFr: 'Meilleur chara-design', titleEn: 'Best Character Design', presenter: { name: 'Spyro', handle: '@spyrosuke', photo: P('spyro.webp') },
    winner: { name: 'Gachiakuta', credit: 'Studio Bones · Kei Urana', img: '/visuels/2026/chara-design-gachiakuta.webp' },
    second: { name: 'To Be Hero X', img: '/visuels/2026/chara-design-hero.webp' },
    third: { name: 'Solo Leveling', sub: 'Saison 2', img: '/visuels/2026/chara-design-solo.webp' },
  },
  {
    id: 'p-animation', titleFr: 'Meilleure animation', titleEn: 'Best Animation', presenter: { name: 'Tsunade Desty', handle: '@tsunadedesty', photo: P('tsunade.webp') },
    winner: { name: 'My Hero Academia', sub: 'Saison finale', credit: 'Studio Bones · Kōhei Horikoshi', img: '/visuels/2026/animation-mha.webp' },
    second: { name: 'Solo Leveling', sub: 'Saison 2', img: '/visuels/2026/animation-solo.webp' },
    third: { name: 'Lord of the Mysteries', img: '/visuels/2026/animation-lord.webp' },
  },
  {
    id: 'p-nouveaute', titleFr: 'Meilleure nouveauté', titleEn: 'Best New Series', presenter: { name: 'Le Zumaki', handle: '@espezumaki1x', photo: P('zumaki.webp') },
    winner: { name: 'Gachiakuta', credit: 'Studio Bones · Kei Urana', img: '/visuels/2026/nouveaute-gachiakuta.webp' },
    second: { name: 'To Be Hero X', img: '/visuels/2026/nouveaute-hero.webp' },
    third: { name: 'Le Péché originel de Takopi', img: '/visuels/2026/nouveaute-takopi.webp' },
  },
  {
    id: 'p-suite', titleFr: 'Meilleure suite', titleEn: 'Best Sequel', presenter: { name: 'Jeremiah', handle: '@jeremiah_san_', photo: P('jeremiah.webp') },
    winner: { name: 'My Hero Academia', sub: 'Saison finale', credit: 'Studio Bones · Kōhei Horikoshi', img: '/visuels/2026/suite-mha.webp' },
    second: { name: 'Dr. Stone', sub: 'Science Future', img: '/visuels/2026/suite-stone.webp' },
    third: { name: 'Solo Leveling', sub: 'Saison 2', img: '/visuels/2026/suite-solo.webp' },
  },
  {
    id: 'p-attachant', titleFr: 'Personnage le plus attachant', titleEn: 'Most Lovable Character', presenter: { name: 'Elyza', handle: '@cmoielyza', photo: P('elyza.webp') },
    winner: { name: 'Anya Forger', sub: 'Spy × Family', credit: 'Voix japonaise : Atsumi Tanezaki', img: '/visuels/2026/attachant-anya.webp' },
    second: { name: 'Suika', sub: 'Dr. Stone', img: '/visuels/2026/attachant-suika.webp' },
    third: { name: 'Kaoruko', sub: 'Bloom', img: '/visuels/2026/attachant-kaoruko.webp' },
  },
  {
    id: 'p-feminin', titleFr: 'Meilleur personnage féminin', titleEn: 'Best Female Character', presenter: { name: 'Yvendis', handle: '@yvendis', photo: P('yvendis.webp') },
    winner: { name: 'Maomao', sub: 'Les Carnets de l’apothicaire', credit: 'Voix japonaise : Aoi Yūki', img: '/visuels/2026/feminin-maomao.webp' },
    second: { name: 'Semiu', sub: 'Gachiakuta', img: '/visuels/2026/feminin-semiu.webp' },
    third: { name: 'Reze', sub: 'Chainsaw Man', img: '/visuels/2026/feminin-reze.webp' },
  },
  {
    id: 'p-secondaire', titleFr: 'Meilleur personnage secondaire', titleEn: 'Best Supporting Character', presenter: { name: 'Mikassa237', handle: '@mikassa237', photo: P('mikassa.webp') },
    winner: { name: 'Katsuki Bakugo', sub: 'My Hero Academia', credit: 'Voix japonaise : Nobuhiko Okamoto', img: '/visuels/2026/secondaire-bak.webp' },
    second: { name: 'Arthur Boyle', sub: 'Fire Force', img: '/visuels/2026/secondaire-arthur.webp' },
    third: { name: 'Shi Huang Di', sub: 'Valkyrie Apocalypse', img: '/visuels/2026/secondaire-shi.webp' },
  },
  {
    id: 'p-sensei', titleFr: 'Meilleur sensei', titleEn: 'Best Sensei', presenter: { name: 'Sensei TV', handle: '@sensei.tv0', photo: P('sensei.webp') },
    winner: { name: 'Senku Ishigami', sub: 'Dr. Stone', credit: 'Voix japonaise : Yūsuke Kobayashi', img: '/visuels/2026/sensei-senku.webp' },
    second: { name: 'Enjin', sub: 'Gachiakuta', img: '/visuels/2026/sensei-enjin.webp' },
    third: { name: 'Seiko Ayase', sub: 'Dandadan', img: '/visuels/2026/sensei-seiko.webp' },
  },
  {
    id: 'p-masculin', titleFr: 'Meilleur personnage masculin', titleEn: 'Best Male Character', presenter: { name: 'Mr. Hunter', handle: '@mr.hunter2g', photo: P('hunter.webp') },
    winner: { name: 'Akaza', sub: 'Demon Slayer', credit: 'Voix japonaise : Akira Ishida', img: '/visuels/2026/masculin-akaza.webp' },
    second: { name: 'Sung Jinwoo', sub: 'Solo Leveling', img: '/visuels/2026/masculin-jinwoo.webp' },
    third: { name: 'X', sub: 'To Be Hero X', img: '/visuels/2026/masculin-x.webp' },
  },
  {
    id: 'p-film', titleFr: 'Meilleur film d’animation', titleEn: 'Best Animated Film', presenter: { name: 'Braizanime', handle: '@braizanime', photo: P('braiz.webp') },
    winner: { name: 'Demon Slayer', sub: 'La Forteresse Infinie', credit: 'Ufotable · Koyoharu Gotouge', img: '/visuels/2026/film-demon.webp' },
    second: { name: 'Chainsaw Man', sub: 'Le film : l’arc de Reze', img: '/visuels/2026/film-reze.webp' },
    third: { name: 'K-Pop Demon Hunters', img: '/visuels/2026/film-kpop.webp' },
  },
  {
    id: 'p-chanson', titleFr: 'Meilleure chanson d’animé', titleEn: 'Best Anime Song', presenter: { name: 'Tomi-tan', handle: '@une_protagoniste', photo: P('tomitan.webp') },
    winner: { name: 'IRIS OUT', sub: 'Chainsaw Man : l’arc de Reze', credit: 'Kenshi Yonezu', img: '/visuels/2026/chanson-iris.webp' },
    second: { name: 'New Type of Hero', sub: 'Griff Clawson · To Be Hero X', img: '/visuels/2026/chanson-new.webp' },
    third: { name: 'Hunting Soul', sub: 'HAYASii · Dandadan S2', img: '/visuels/2026/chanson-hunting.webp' },
  },
  {
    id: 'p-ending', titleFr: 'Meilleur ending', titleEn: 'Best Ending', presenter: { name: 'Rico', handle: '@ricokouame' },
    winner: { name: 'I', sub: 'My Hero Academia · Saison finale', credit: 'BUMP OF CHICKEN', img: '/visuels/2026/ending-i.webp' },
    second: { name: 'The 1', sub: 'Muque · One Piece', img: '/visuels/2026/ending-muque.webp' },
    third: { name: 'Urusairen', sub: 'Umeda Cypher · Fire Force S3', img: '/visuels/2026/ending-urusairen.webp' },
  },
  {
    id: 'p-opening', titleFr: 'Meilleur opening', titleEn: 'Best Opening', presenter: { name: 'Le Grand G', handle: '@gmp_legrandg', photo: P('grandg.webp') },
    winner: { name: 'Mirage', sub: 'Call of the Night · Saison 2', credit: 'Creepy Nuts', img: '/visuels/2026/opening-call.webp' },
    second: { name: 'Kakumei Douchuu', sub: 'Aina The End · Dandadan S2', img: '/visuels/2026/opening-dandadan.webp' },
    third: { name: 'Inertia', sub: 'Hiroyuki Sawano : Rei · To Be Hero X', img: '/visuels/2026/opening-hero.webp' },
  },
];

/** Le grand prix, présenté à part (pic de la page). */
export const ANIME_DE_L_ANNEE: PalmaresCategory = {
  id: 'p-annee', titleFr: 'Animé de l’année', titleEn: 'Anime of the Year', presenter: { name: 'Rico', handle: '@ricokouame' },
  winner: { name: 'My Hero Academia', sub: 'Saison finale', credit: 'Studio Bones · Kōhei Horikoshi', img: '/visuels/2026/annee-mha.webp' },
};
