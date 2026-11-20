/* ZENKAI 2027 — fonds vidéo de la salle d'invocation (banque Canva).
   Le fond annonce la meilleure carte du booster : ZENKAI, MIRAGE et SPECTRE ont les leurs,
   les boosters dont la meilleure carte est PRISME ou ÉCLAT prennent le fond par défaut.
   Chaque rareté a plusieurs vidéos : on en tire une au hasard à chaque booster. */
(function () {
  const LIST = {
    defaut: ["defaut_1"],
    spectre: ["spectre_1", "spectre_2"],
    mirage: ["mirage_1", "mirage_2", "mirage_3"],
    zenkai: ["zenkai_1", "zenkai_2", "zenkai_3"],
  };
  const RANK = { eclat: 0, prisme: 1, spectre: 2, mirage: 3, zenkai: 4 };
  const v = document.getElementById("bgv");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tierOf(deck) {
    const top = deck.reduce((m, c) => Math.max(m, RANK[c.rarity] ?? 0), 0);
    return top >= 4 ? "zenkai" : top === 3 ? "mirage" : top === 2 ? "spectre" : "defaut";
  }
  // prépare le fond du booster tiré (chargé pendant l'ouverture pour être prêt à l'arrivée)
  function prepare(deck) {
    const tier = tierOf(deck), l = LIST[tier], name = l[Math.random() * l.length | 0];
    v.poster = "bg/" + name + ".jpg";
    if (!reduce) { v.src = "bg/" + name + ".mp4"; v.load(); } else v.removeAttribute("src");
    v.dataset.tier = tier;
    return tier;
  }
  function play() { if (!reduce && v.src) v.play().catch(() => {}); }
  window.ZK_BG = { LIST, tierOf, prepare, play, el: v, reduce };
})();
