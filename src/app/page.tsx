import IndexCategories from "@/components/IndexCategories";
import OpeningStage from "@/components/OpeningStage";
import PacksAnime from "@/components/PacksAnime";
import Tenant from "@/components/Tenant";
import VitrineNomines from "@/components/VitrineNomines";
import VoixLive from "@/components/VoixLive";
import Coutures from "@/components/Coutures";

// Accueil plein écran : l'opening en héros, les 25 catégories en index, les boosters,
// des nominés d'autres catégories avec leur carte, le tenant du titre, puis les voix du live.
export default function Accueil() {
  return (
    <div data-accueil>
      <OpeningStage />
      <IndexCategories />
      <PacksAnime />
      <VitrineNomines />
      <Tenant />
      <VoixLive />
      <Coutures />
    </div>
  );
}
