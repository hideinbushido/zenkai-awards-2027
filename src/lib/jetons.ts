// Nom de la monnaie du site : à changer ici le jour où on lui donne son vrai nom.
export const JETON = { un: "jeton", plusieurs: "jetons" };

export const jetons = (n: number) => `${n} ${n > 1 ? JETON.plusieurs : JETON.un}`;
