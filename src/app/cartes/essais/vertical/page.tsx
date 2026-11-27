import Barre from "../Barre";
import Vertical from "./Vertical";

export const metadata = { title: "Essai galerie · Vertical · Zenkai" };

export default function Page() {
  return <><Vertical /><Barre actif="vertical" sombre /></>;
}
