import { useId } from "react";
import type { Famille } from "@/data/edition";

// Le booster Zenkai en 2D : un paquet de foil holographique encré comme une case de manga.
// Contour épais et ombre portée franche, trame en points, lignes de vitesse autour de l'emblème,
// bandeau d'encre avec la couleur de la famille. Le foil et le reflet glissent en boucle.

const W = 300, H = 520, DENT = 26;

const PALETTE: Record<Famille, { accent: string; teinte: string; bande: string }> = {
  series: { accent: "oklch(0.74 0.14 215)", teinte: "oklch(0.86 0.09 215)", bande: "oklch(0.18 0.03 240)" },
  personnages: { accent: "oklch(0.68 0.19 305)", teinte: "oklch(0.84 0.1 305)", bande: "oklch(0.18 0.04 300)" },
  musique: { accent: "oklch(0.7 0.2 355)", teinte: "oklch(0.86 0.1 355)", bande: "oklch(0.18 0.04 355)" },
  technique: { accent: "oklch(0.87 0.17 118)", teinte: "oklch(0.9 0.1 118)", bande: "oklch(0.18 0.03 130)" },
  "grand-prix": { accent: "oklch(0.83 0.12 85)", teinte: "oklch(0.88 0.08 85)", bande: "oklch(0.14 0.01 270)" },
};

// Silhouette du paquet : soudures crantées en haut et en bas
function silhouette() {
  const pas = 12;
  let d = `M0 ${DENT} L0 ${H - DENT}`;
  for (let x = 0; x < W; x += pas) d += ` L${x + pas / 2} ${H} L${Math.min(x + pas, W)} ${H - DENT}`;
  d += ` L${W} ${DENT}`;
  for (let x = W; x > 0; x -= pas) d += ` L${x - pas / 2} 0 L${Math.max(x - pas, 0)} ${DENT}`;
  return d + " Z";
}
const PAQUET = silhouette();

// Lignes de vitesse autour de l'emblème (arrondies : serveur et navigateur doivent écrire la même chose)
const r1 = (v: number) => Math.round(v * 10) / 10;
function lignes(cx: number, cy: number) {
  const out: string[] = [];
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2 + (i % 2) * 0.03;
    const l = i % 3 === 0 ? 420 : 300;
    const e = 0.018 + (i % 4) * 0.006;
    out.push(`M${r1(cx + Math.cos(a - e) * 70)} ${r1(cy + Math.sin(a - e) * 70)} L${r1(cx + Math.cos(a) * l)} ${r1(cy + Math.sin(a) * l)} L${r1(cx + Math.cos(a + e) * 70)} ${r1(cy + Math.sin(a + e) * 70)}Z`);
  }
  return out.join(" ");
}
const LIGNES = lignes(150, 232);

// Coupe un libellé long en deux lignes, au plus près du milieu
function coupe(t: string) {
  if (t.length <= 11) return [t];
  const milieu = t.length / 2;
  let meilleur = -1;
  for (let i = 0; i < t.length; i++) if (t[i] === " " && (meilleur < 0 || Math.abs(i - milieu) < Math.abs(meilleur - milieu))) meilleur = i;
  return meilleur < 0 ? [t] : [t.slice(0, meilleur), t.slice(meilleur + 1)];
}

type Props = { famille: Famille; titre: string; sousTitre?: string; className?: string };

export default function Booster2D({ famille, titre, sousTitre, className }: Props) {
  const id = useId().replace(/:/g, "");
  const p = PALETTE[famille];
  const lignesTitre = coupe(titre.toUpperCase());
  const plusLongue = Math.max(...lignesTitre.map((l) => l.length));
  const taille = Math.min(44, Math.floor(250 / (plusLongue * 0.5)));
  const hautBande = lignesTitre.length > 1 ? 136 : 112;
  const yBande = 452 - hautBande;

  return (
    <svg viewBox={`-6 -6 ${W + 22} ${H + 22}`} className={className} role="img" aria-label={`Booster ${titre}`}>
      <defs>
        <clipPath id={`${id}-c`}><path d={PAQUET} /></clipPath>
        {/* Foil : spectre pastel qui glisse en boucle */}
        <linearGradient id={`${id}-f`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="520" spreadMethod="reflect">
          <stop offset="0" stopColor="oklch(0.9 0.09 350)" />
          <stop offset="0.22" stopColor="oklch(0.9 0.1 220)" />
          <stop offset="0.44" stopColor="oklch(0.93 0.12 125)" />
          <stop offset="0.66" stopColor="oklch(0.88 0.11 300)" />
          <stop offset="0.88" stopColor="oklch(0.92 0.09 60)" />
          <stop offset="1" stopColor="oklch(0.9 0.09 350)" />
          <animateTransform attributeName="gradientTransform" type="translate" values="0 0; 300 520; 0 0" dur="14s" repeatCount="indefinite" />
        </linearGradient>
        {/* Reflet : une bande claire qui traverse le paquet */}
        <linearGradient id={`${id}-r`} gradientUnits="userSpaceOnUse" x1="-300" y1="0" x2="0" y2="200">
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.65" stopColor="#fff" stopOpacity="0" />
          <animateTransform attributeName="gradientTransform" type="translate" values="-200 -120; 700 420; 700 420" keyTimes="0; 0.45; 1" dur="6s" repeatCount="indefinite" />
        </linearGradient>
        {/* Trame manga */}
        <pattern id={`${id}-t`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3.5" cy="3.5" r="1.5" fill="oklch(0.16 0.02 270)" />
        </pattern>
        <linearGradient id={`${id}-tm`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
        </linearGradient>
        <mask id={`${id}-m`}><rect width={W} height={H} fill={`url(#${id}-tm)`} /></mask>
        {/* Stries des soudures */}
        <pattern id={`${id}-s`} width="5" height="10" patternUnits="userSpaceOnUse">
          <rect width="2" height="10" fill="oklch(0.16 0.02 270)" opacity="0.28" />
        </pattern>
      </defs>

      {/* Ombre portée franche, décalée */}
      <path d={PAQUET} transform="translate(9 10)" fill="oklch(0.16 0.02 270)" />

      <g clipPath={`url(#${id}-c)`}>
        <rect width={W} height={H} fill={`url(#${id}-f)`} />
        <rect width={W} height={H} fill={p.teinte} style={{ mixBlendMode: "multiply" }} opacity="0.55" />
        <path d={LIGNES} fill="oklch(0.16 0.02 270)" opacity="0.13" />
        <rect width={W} height={H} fill={`url(#${id}-t)`} mask={`url(#${id}-m)`} opacity="0.32" />
        <rect y="0" width={W} height={DENT + 8} fill={`url(#${id}-s)`} />
        <rect y={H - DENT - 8} width={W} height={DENT + 8} fill={`url(#${id}-s)`} />
        <line x1="0" x2={W} y1={DENT + 8} y2={DENT + 8} stroke="oklch(0.16 0.02 270)" strokeWidth="3" />
        <line x1="0" x2={W} y1={H - DENT - 8} y2={H - DENT - 8} stroke="oklch(0.16 0.02 270)" strokeWidth="3" />

        {/* En-tête */}
        <text x="150" y="98" textAnchor="middle" fill="oklch(0.16 0.02 270)" style={{ fontFamily: "var(--f-display)", fontWeight: 900, fontStretch: "75%", fontSize: 62, letterSpacing: "-0.01em" }}>ZENKAI</text>
        <text x="150" y="122" textAnchor="middle" fill="oklch(0.16 0.02 270)" style={{ fontFamily: "var(--f-large)", fontSize: 10.5 }}>ANIME AWARDS · 2027</text>

        {/* Emblème */}
        <circle cx="150" cy="232" r="64" fill="oklch(0.99 0.004 260)" stroke="oklch(0.16 0.02 270)" strokeWidth="5" />
        <circle cx="150" cy="232" r="52" fill="none" stroke={p.accent} strokeWidth="4" />
        <image href="/visuels/logo-zenkai-noir.png" x="116" y="198" width="68" height="68" />

        {/* Bandeau d'encre */}
        <rect x="0" y={yBande} width={W} height={hautBande} fill={p.bande} />
        <rect x="0" y={yBande} width={W} height="7" fill={p.accent} />
        {lignesTitre.map((l, i) => (
          <text key={l} x="150" y={yBande + 50 + i * (taille * 0.92)} textAnchor="middle" fill="oklch(0.98 0.004 260)"
            style={{ fontFamily: "var(--f-display)", fontWeight: 900, fontStretch: "75%", fontSize: taille }}>{l}</text>
        ))}
        {sousTitre && (
          <text x="150" y={yBande + hautBande - 16} textAnchor="middle" fill={p.accent} style={{ fontFamily: "var(--f-large)", fontSize: 10.5 }}>{sousTitre.toUpperCase()}</text>
        )}

        <rect width={W} height={H} fill={`url(#${id}-r)`} style={{ mixBlendMode: "overlay" }} />
      </g>

      {/* Contour d'encre */}
      <path d={PAQUET} fill="none" stroke="oklch(0.16 0.02 270)" strokeWidth="6" strokeLinejoin="round" />
    </svg>
  );
}
