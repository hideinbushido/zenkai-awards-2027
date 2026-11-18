import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zenkai Anime Awards 2027',
  description: 'Les récompenses anime de la communauté — The community anime awards',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
