import type { Metadata } from "next";
import Missions from "./Missions";

export const metadata: Metadata = { title: "Missions · Zenkai Anime Awards 2027" };

export default function Page() {
  return <Missions />;
}
