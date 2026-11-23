import { buildBoard, type TileType } from "./game";
import { THEMES, PARTY_THEMES, AFTERLIFE_THEMES, remakeChallenge, partyChallenge, afterlifeChallenge } from "./remake-content";

export type GameMode = "anniversary" | "party" | "afterlife" | "mega" | "ultra" | "rave" | "jenseits" | "turbo" | "geister" | "chaos" | "classic" | "blitz";
export const MODES: { id: GameMode; name: string; label: string; emoji: string }[] = [
  { id: "anniversary", name: "ANNIVERSARY", label: "450 Schritte", emoji: "🏆" },
  { id: "party", name: "PARTY ∞", label: "Tausende Plattformen · ohne Ende", emoji: "🎉" },
  { id: "afterlife", name: "AFTERLIFE ∞", label: "3 Würfel · ohne Ende", emoji: "👻" },
  { id: "mega", name: "MEGA PARTY", label: "5.000 Plattformen", emoji: "🪩" },
  { id: "ultra", name: "ULTRA PARTY", label: "10.000 Plattformen", emoji: "🌌" },
  { id: "rave", name: "RAVE 4D ∞", label: "2 Würfel · ohne Ende", emoji: "🔊" },
  { id: "jenseits", name: "JENSEITS 4D", label: "3 Würfel · 600 Schritte", emoji: "🪽" },
  { id: "turbo", name: "TURBO DICE", label: "2 Würfel · 250 Schritte", emoji: "🎲" },
  { id: "geister", name: "GEISTERSTUNDE", label: "Nur Afterlife-Events · 300 Schritte", emoji: "🕯️" },
  { id: "chaos", name: "CHAOS 4D", label: "Nur Events · 200 Schritte", emoji: "🌀" },
  { id: "classic", name: "CLASSIC REMIX", label: "150 Schritte", emoji: "🕹️" },
  { id: "blitz", name: "BLITZ", label: "75 Schritte", emoji: "⚡" },
];
const GOALS: Record<GameMode, number> = { anniversary: 450, party: Number.MAX_SAFE_INTEGER, afterlife: Number.MAX_SAFE_INTEGER, mega: 5000, ultra: 10000, rave: Number.MAX_SAFE_INTEGER, jenseits: 600, turbo: 250, geister: 300, chaos: 200, classic: 150, blitz: 75 };
export const modeGoal = (mode: GameMode) => GOALS[mode];
/** Modes without a goal. */
export const isEndless = (mode: GameMode) => mode === "party" || mode === "rave" || mode === "afterlife";
/** Modes whose tiles come from the stateless lookup instead of a stored board. */
export const usesStatelessBoard = (mode: GameMode) => isEndless(mode) || mode === "mega" || mode === "ultra" || mode === "jenseits";
export const diceCount = (mode: GameMode) => mode === "afterlife" || mode === "jenseits" ? 3 : mode === "turbo" || mode === "rave" ? 2 : 1;

const FAMILIES = [
  ["Wort-Arena", "💬", "duel", 3], ["Portal-Sprung", "🌀", "boost", 4],
  ["Kristall-Tresor", "💎", "coins", 5], ["Schild-Schmiede", "🛡️", "shield", 1],
  ["Glitch-Falle", "⚠️", "risk", -3], ["Memory-Labor", "🧠", "memory", 2],
  ["Klick-Reaktor", "⚡", "click", 3], ["Quiz-Tor", "🔮", "quiz", 2],
  ["Echo-Bühne", "🎭", "acting", 3], ["Finale-Festival", "🎊", "creative", 5],
] as const;
const PARTY_FAMILIES = [
  ["Tanz-Battle", "💃", "duel", 3], ["Konfetti-Kanone", "🎉", "boost", 4],
  ["Glitzer-Tresor", "🪩", "coins", 5], ["Laser-Schild", "🔆", "shield", 1],
  ["Bass-Drop", "🔊", "risk", -3], ["Lichtshow-Memory", "🌈", "memory", 2],
  ["DJ-Pult", "🎧", "click", 3], ["Party-Quiz", "🎤", "quiz", 2],
  ["Karaoke-Bühne", "🎙️", "acting", 3], ["Afterparty-Finale", "🥳", "creative", 5],
] as const;
const AFTERLIFE_FAMILIES = [
  ["Seelen-Duell", "👻", "duel", 3], ["Himmelstor", "🪽", "boost", 4],
  ["Seelen-Tresor", "💠", "coins", 5], ["Halo-Schild", "😇", "shield", 1],
  ["Geisterfalle", "💀", "risk", -3], ["Geister-Memory", "🧿", "memory", 2],
  ["Seelen-Reaktor", "🌩️", "click", 3], ["Orakel-Quiz", "🔮", "quiz", 2],
  ["Phantom-Bühne", "🕯️", "acting", 3], ["Afterlife-Finale", "🌌", "creative", 5],
] as const;
type Kind = (typeof FAMILIES)[number][2];
export type Series = "anniversary" | "party" | "afterlife";
export type RemakePlatform = { id: `remake-${number}`; name: string; emoji: string; kind: Kind; value: number; variant: number; series: Series };
const make = (themes: string[], families: typeof FAMILIES | typeof PARTY_FAMILIES | typeof AFTERLIFE_FAMILIES, offset: number, series: Series): RemakePlatform[] =>
  themes.flatMap((theme, t) => families.map(([name, emoji, kind, value], f) => ({
    id: `remake-${offset + t * 10 + f}` as const, name: `${theme} ${name}`, emoji, kind, value: value + (value > 1 ? t % 3 : 0), variant: t, series,
  })));
/** 100 Anniversary, 100 Party-Remake and 100 Afterlife-Remake platforms. */
export const REMAKE_PLATFORMS: RemakePlatform[] = [...make(THEMES, FAMILIES, 0, "anniversary"), ...make(PARTY_THEMES, PARTY_FAMILIES, 100, "party"), ...make(AFTERLIFE_THEMES, AFTERLIFE_FAMILIES, 200, "afterlife")];
export function platformFor(tile: TileType): RemakePlatform | undefined {
  return tile.startsWith("remake-") ? REMAKE_PLATFORMS[Number(tile.slice(7))] : undefined;
}
export const platformChallenge = (platform: RemakePlatform, index: number, location: string) =>
  platform.series === "afterlife" ? afterlifeChallenge(index, platform.name, location)
    : platform.series === "party" ? partyChallenge(index, platform.name, location) : remakeChallenge(index, platform.name, location);

function shuffled<T>(items: T[], seed: number): T[] {
  const copy = [...items]; let x = seed >>> 0;
  for (let i = copy.length - 1; i > 0; i--) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const j = x % (i + 1); const a = copy[i], b = copy[j];
    if (a !== undefined && b !== undefined) { copy[i] = b; copy[j] = a; }
  }
  return copy;
}
export function buildModeBoard(mode: GameMode, seed: number): TileType[] {
  const base = buildBoard(seed);
  const inner = base.slice(1, -1);
  const platforms = REMAKE_PLATFORMS.map(p => p.id);
  if (mode === "classic") return base;
  if (usesStatelessBoard(mode)) return [];
  if (mode === "blitz") return ["start", ...shuffled(inner, seed).slice(0, 74), "goal"];
  if (mode === "turbo") return ["start", ...shuffled([...inner, ...shuffled(platforms, seed).slice(0, 100)], seed), "goal"];
  if (mode === "geister") {
    const afterlife = platforms.filter(id => platformFor(id)?.series === "afterlife");
    return ["start", ...shuffled([...afterlife, ...afterlife, ...shuffled(inner.filter(t => t !== "empty"), seed).slice(0, 99)], seed), "goal"];
  }
  if (mode === "chaos") return ["start", ...shuffled([...inner.filter(t => t !== "empty"), ...platforms], seed).slice(0, 199), "goal"];
  return ["start", ...shuffled([...inner, ...platforms], seed), "goal"];
}
// Stateless index hashing gives an infinite lane without an infinite array or a repeated 150-field loop.
export function partyTile(index: number, seed: number): TileType {
  if (index === 0) return "start";
  let hash = Math.imul(index ^ seed, 0x45d9f3b); hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b); hash ^= hash >>> 16;
  const roll = (hash >>> 0) % 450;
  if (roll < REMAKE_PLATFORMS.length) return REMAKE_PLATFORMS[roll]?.id ?? "task";
  const types: TileType[] = ["task", "special", "click", "quiz", "shop", "help", "tax", "bad", "death", "local", "empty"];
  return types[roll % types.length] ?? "empty";
}
export const advancePosition = (position: number, steps: number, mode: GameMode) => Math.max(0, Math.min(modeGoal(mode), position + steps));
export const hasFinished = (position: number, mode: GameMode) => !isEndless(mode) && position >= modeGoal(mode);
