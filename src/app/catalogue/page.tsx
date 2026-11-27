import { redirect } from "next/navigation";

// Pas de catalogue public : les cartes se découvrent en ouvrant les boosters.
export default function Page() {
  redirect("/booster");
}
