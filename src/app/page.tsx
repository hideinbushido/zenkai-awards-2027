import EditionLive from "@/components/EditionLive";
import Etalage from "@/components/Etalage";
import OpeningStage from "@/components/OpeningStage";
import Tenant from "@/components/Tenant";
import VoixLive from "@/components/VoixLive";

// Accueil : court, comme en 2026. Tout le détail vit dans « À propos ».
export default function Accueil() {
  return (
    <>
      <OpeningStage />
      <Etalage />
      <EditionLive compact />
        <Tenant />
      <VoixLive />
    </>
  );
}
