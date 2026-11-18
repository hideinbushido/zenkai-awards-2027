// Lignes de vitesse façon manga : traits effilés et irréguliers qui partent d'un point de fuite.
// Générées de façon déterministe (même rendu serveur et client), en SVG étiré sur le conteneur.

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Props {
  /** point de fuite, en fraction de la largeur et de la hauteur (0 à 1) */
  fx?: number;
  fy?: number;
  color?: string;
  opacity?: number;
  count?: number;
  seed?: number;
  className?: string;
}

export default function SpeedLines({
  fx = 0.98, fy = 0.45, color = '#F4F4F1', opacity = 0.16, count = 70, seed = 27, className,
}: Props) {
  const W = 1000, H = 1000;
  const r = seeded(seed);
  const cx = fx * W, cy = fy * H, R = Math.hypot(W, H) * 1.2;
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const half = 0.004 + r() * 0.012;
    const r1 = 40 + r() * 120;
    d += `M${(cx + r1 * Math.cos(a)).toFixed(0)} ${(cy + r1 * Math.sin(a)).toFixed(0)}`
      + `L${(cx + R * Math.cos(a - half)).toFixed(0)} ${(cy + R * Math.sin(a - half)).toFixed(0)}`
      + `L${(cx + R * Math.cos(a + half)).toFixed(0)} ${(cy + R * Math.sin(a + half)).toFixed(0)}Z`;
  }
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <path d={d} fill={color} fillOpacity={opacity} />
    </svg>
  );
}
