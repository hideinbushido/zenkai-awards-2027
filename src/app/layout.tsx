import type { Metadata } from "next";
import { Michroma, Onest } from "next/font/google";
import "./globals.css";

const large = Michroma({ weight: "400", subsets: ["latin"], variable: "--f-large" });
const texte = Onest({ subsets: ["latin"], variable: "--f-texte" });

export const metadata: Metadata = {
  title: "Zenkai Anime Awards 2027 · Édition Holo",
  description: "Deuxième édition des Zenkai Anime Awards : la communauté vote pour les animés de 2026, résultats en live en mai 2027.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${large.variable} ${texte.variable}`}>
      <body>{children}</body>
    </html>
  );
}
