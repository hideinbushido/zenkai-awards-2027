import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Catalogue from "./Catalogue";

export const metadata = { title: "Catalogue des cartes · Zenkai" };
export default async function Page() {
  "use cache";
  const source = await readFile(join(process.cwd(),"public/booster/cards.js"),"utf8");
  const catalogue = JSON.parse(source.slice(source.indexOf("=")+1).trim().replace(/;$/,""));
  return <Catalogue cards={catalogue.cards.map((c:{id:string;name:string;anime:string;rarity:string;special:string|null})=>({
    id:c.id,name:c.name,anime:c.anime,rarity:c.rarity,special:c.special
  }))}/>;
}
