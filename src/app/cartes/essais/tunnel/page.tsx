import Barre from "../Barre";
import Tunnel from "./Tunnel";

export const metadata = { title: "Essai galerie · Tunnel · Zenkai" };

export default function Page() {
  return <><Tunnel /><Barre actif="tunnel" sombre /></>;
}
