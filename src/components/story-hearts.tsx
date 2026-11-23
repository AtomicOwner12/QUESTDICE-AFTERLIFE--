import { heartFills } from "@/lib/story-combat";

/** 8×6 pixel heart; each pixel belongs to one quarter (top-left, bottom-left, bottom-right, top-right) like in the old adventures. */
const HEART = [".##..##.", "########", "########", ".######.", "..####..", "...##..."];
const QUARTER = (x: number, y: number) => (x < 4 ? (y < 3 ? 0 : 1) : y < 3 ? 3 : 2);

function PixelHeart({ fill }: { fill: number }) {
  const quarters = Math.round(fill * 4);
  return <svg viewBox="0 0 8 6" className="zelda-heart" aria-hidden shapeRendering="crispEdges">
    {HEART.flatMap((row, y) => [...row].map((c, x) => c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className={QUARTER(x, y) < quarters ? (y === 1 && (x === 1 || x === 2) ? "is-shine" : "is-full") : "is-empty"} /> : null))}
  </svg>;
}

/** Zelda-style life meter: one heart per heart you own, filled in quarters, ten per row. */
export function HeartMeter({ hp, maxHp, hearts }: { hp: number; maxHp: number; hearts: number }) {
  const fills = heartFills(Math.max(0, hp), maxHp, hearts);
  const low = hp > 0 && hp <= maxHp / hearts;
  return <div className={`zelda-life ${low ? "is-low" : ""}`} role="meter" aria-label={`Leben: ${Math.max(0, Math.round(hp))} von ${maxHp}`} aria-valuenow={Math.max(0, Math.round(hp))} aria-valuemin={0} aria-valuemax={maxHp}>
    <small>— LEBEN —</small>
    <div className="zelda-hearts">{fills.map((f, i) => <PixelHeart key={i} fill={f} />)}</div>
  </div>;
}
