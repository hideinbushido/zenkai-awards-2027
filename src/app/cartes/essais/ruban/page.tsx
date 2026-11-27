import Barre from "../Barre";
import Ruban from "./Ruban";

export const metadata = { title: "Essai galerie · Ruban · Zenkai" };

export default function Page() {
  return <><Ruban /><Barre actif="ruban" /></>;
}
