import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zenkai Anime Awards 2027",
  description: "La deuxième édition des Zenkai Anime Awards : la communauté vote pour les animés de 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
