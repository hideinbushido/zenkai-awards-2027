import Barre from "../Barre";
import Angle from "./Angle";

export const metadata = { title: "Essai galerie · Angle · Zenkai" };

export default function Page() {
  return <><Angle /><Barre actif="angle" sombre /></>;
}
