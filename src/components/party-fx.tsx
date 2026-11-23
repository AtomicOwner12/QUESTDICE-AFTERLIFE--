// Decorative Party Remake 4D layers. Positions come from the index, so SSR and client render identically.
const rnd = (i: number, salt: number) => { const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); };
const COLORS = ["var(--primary)", "var(--secondary)", "var(--accent)", "var(--tile-mini)", "var(--tile-quiz)", "var(--foreground)"];

export function Confetti({ count = 36, className = "" }: { count?: number; className?: string }) {
  return <div className={`confetti-layer ${className}`} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => <span key={i} className="confetti-piece" style={{
      left: `${(rnd(i, 1) * 100).toFixed(2)}%`,
      background: COLORS[i % COLORS.length],
      animationDelay: `${(-rnd(i, 2) * 6).toFixed(2)}s`,
      animationDuration: `${(3.5 + rnd(i, 3) * 4).toFixed(2)}s`,
      width: `${6 + Math.round(rnd(i, 4) * 6)}px`,
      height: `${10 + Math.round(rnd(i, 5) * 8)}px`,
      borderRadius: i % 3 === 0 ? "50%" : "2px",
    }} />)}
  </div>;
}

export function Equalizer({ bars = 40 }: { bars?: number }) {
  return <div className="lobby-equalizer" aria-hidden="true">
    {Array.from({ length: bars }, (_, i) => <span key={i} style={{ animationDelay: `${(-rnd(i, 7) * 0.86).toFixed(2)}s`, animationDuration: `${(0.43 * (1 + (i % 3))).toFixed(2)}s` }} />)}
  </div>;
}

export function Lasers({ count = 8 }: { count?: number }) {
  return <div className="lobby-lasers" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => <span key={i} style={{
      ["--a" as string]: `${-62 + (124 / (count - 1)) * i}deg`,
      background: `linear-gradient(to top, ${COLORS[i % 3]}, transparent 85%)`,
      animationDelay: `${(-i * 0.37).toFixed(2)}s`,
    }} />)}
  </div>;
}

/** Afterlife Remake: glowing soul orbs that rise from the neon floor. */
export function Souls({ count = 26, className = "" }: { count?: number; className?: string }) {
  return <div className={`soul-layer ${className}`} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => <span key={i} className="soul-orb" style={{
      left: `${(4 + rnd(i, 11) * 92).toFixed(2)}%`,
      width: `${10 + Math.round(rnd(i, 12) * 18)}px`,
      animationDelay: `${(-rnd(i, 13) * 9).toFixed(2)}s`,
      animationDuration: `${(6 + rnd(i, 14) * 6).toFixed(2)}s`,
      ["--drift" as string]: `${Math.round((rnd(i, 15) - .5) * 160)}px`,
      ["--soul" as string]: i % 3 === 0 ? "var(--accent)" : i % 3 === 1 ? "var(--secondary)" : "var(--foreground)",
    }} />)}
  </div>;
}

/** Vertical heaven beams above the skyline, pulsing to the beat. */
export function SoulBeams({ count = 9 }: { count?: number }) {
  return <div className="lobby-beams" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => <span key={i} style={{
      left: `${(i < count / 2 ? 3 + i * 7.5 : 62 + (i - Math.ceil(count / 2)) * 8.5).toFixed(2)}%`,
      animationDelay: `${(-rnd(i, 21) * 3).toFixed(2)}s`,
      background: `linear-gradient(to top, ${COLORS[(i + 1) % 3]}, transparent 90%)`,
    }} />)}
  </div>;
}

/** Ghosts that float clearly across the sky. */
export function Ghosts({ count = 5 }: { count?: number }) {
  const faces = ["👻", "👻", "💀", "👻", "🦇", "👻", "🕊️"];
  return <div className="lobby-ghosts" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => <span key={i} style={{
      top: `${(8 + rnd(i, 31) * 30).toFixed(2)}%`,
      fontSize: `${28 + Math.round(rnd(i, 32) * 26)}px`,
      animationDelay: `${(-i * 3.4).toFixed(2)}s`,
      animationDuration: `${(15 + rnd(i, 33) * 8).toFixed(2)}s`,
    }}>{faces[i % faces.length]}</span>)}
  </div>;
}
