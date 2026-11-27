import Barre from "../Barre";
import Adn from "./Adn";

export const metadata = { title: "Essai galerie · ADN · Zenkai" };

export default function Page() {
  return <><Adn /><Barre actif="adn" sombre /></>;
}
