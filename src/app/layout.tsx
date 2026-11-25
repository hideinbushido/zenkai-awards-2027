import type { Metadata } from "next";
import { Archivo, Michroma, Onest } from "next/font/google";
import localFont from "next/font/local";
import Defilement from "@/components/Defilement";
import Fin from "@/components/Fin";
import Nav from "@/components/Nav";
import FondGlobal from "@/components/webgl/FondGlobal";
import "./globals.css";

const large = Michroma({ weight: "400", subsets: ["latin"], variable: "--f-large" });
const texte = Onest({ subsets: ["latin"], variable: "--f-texte" });
const serif = localFont({ src: "../fonts/serif-italique.woff2", style: "italic", weight: "400", variable: "--f-serif", display: "swap" });
const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--f-display" });

export const metadata: Metadata = {
  title: "Zenkai Anime Awards 2027 · Édition Holo",
  description: "Deuxième édition des Zenkai Anime Awards : la communauté vote pour les animés de 2026, résultats en live en mai 2027.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${large.variable} ${texte.variable} ${display.variable} ${serif.variable}`}>
      <body>
        <div className="grain" aria-hidden="true" />
        <Nav />
        <Defilement>
          <div className="contenu">
            <FondGlobal />
            {children}
          </div>
          <Fin />
        </Defilement>
      </body>
    </html>
  );
}
