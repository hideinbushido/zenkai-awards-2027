import type { Metadata } from "next";
import Collection from "./Collection";

export const metadata: Metadata = { title: "Mes cartes · Zenkai Anime Awards 2027" };

export default function Page() {
  return <Collection />;
}
