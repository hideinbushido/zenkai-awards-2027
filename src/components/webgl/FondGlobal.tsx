"use client";

import VerreHolo from "./VerreHolo";

// Le fond de tout le site : le mur des animés de 2026 qui défile derrière un verre cannelé holographique.
// La teinte du film glisse avec le défilement ; le voile nacré garde le texte lisible.
export default function FondGlobal() {
  return <VerreHolo video="/videos/mur-2026.mp4" className="fond-global" suitDefilement force={0.72} />;
}
