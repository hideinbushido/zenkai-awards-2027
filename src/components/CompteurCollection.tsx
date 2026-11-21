"use client";

import { useCollection } from "@/lib/collection";

// Nombre de cartes gardées, affiché dans la navigation
export default function CompteurCollection({ className }: { className?: string }) {
  const n = Object.keys(useCollection()).length;
  return <span className={className} aria-label={`${n} carte${n > 1 ? "s" : ""} sur 25`}>{n}/25</span>;
}
