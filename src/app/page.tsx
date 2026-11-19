import Etalage from "@/components/Etalage";
import Hero from "@/components/Hero";
import Tenant from "@/components/Tenant";
import VoixLive from "@/components/VoixLive";

// Accueil : court, comme en 2026. Tout le détail vit dans « À propos ».
export default function Accueil() {
  return (
    <>
      <Hero />
      <Etalage />
      <Tenant />
      <VoixLive />
    </>
  );
}
