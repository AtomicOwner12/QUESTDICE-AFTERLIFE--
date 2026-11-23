// Customizable skin accessories for the lobby.
export type Look = { hat: string; face: string; hand: string; aura: string; tint?: number; pattern?: number; trail?: number; badge?: number; back?: number; feet?: number; fx?: number; dance?: number; halo?: number; spirit?: number };
export const HATS = ["", "🎩", "👑", "🧢", "🎓", "⛑️", "🪖", "👒", "🎀", "🤠"];
export const FACES = ["", "🕶️", "👓", "🥽", "🎭", "😷", "🥸"];
export const HANDS = ["", "⚔️", "🪄", "🎸", "🛹", "🌹", "🍕", "⚽", "🔦", "🎈"];
export const AURAS = ["none", "fire", "ice", "gold", "toxic", "love"] as const;
export const AURA_NAMES: Record<string, string> = { none: "Keine", fire: "Feuer", ice: "Eis", gold: "Gold", toxic: "Gift", love: "Liebe" };
export const DEFAULT_LOOK: Look = { hat: "", face: "", hand: "", aura: "none" };

export const TINTS = ["Original", "Koralle", "Smaragd", "Saphir", "Gold", "Rosenrot", "Mint", "Lava", "Aquamarin", "Magenta", "Limette", "Kirschrot", "Türkis", "Silber", "Rubin", "Honig", "Jade", "Eis", "Sonnenlicht", "Laser", "Chrom", "Neon", "Prisma", "Spektrum"];
export const PATTERNS = ["Clean", "Streifen", "Punkte", "Schach", "Blitze", "Sterne", "Wellen", "Kreuze", "Pixel", "Rauten", "Ringe", "Gitter", "Konfetti", "Strahlen", "Zickzack", "Kristall"];
export const TRAILS = ["✨", "🔥", "❄️", "💫", "🌟", "⚡", "🌈", "🍃", "💥", "🫧", "🎊", "🌸", "💎", "🌀", "☄️", "🎶"];
export const BADGES = ["🏆", "💎", "⚡", "🔥", "❄️", "🌟", "🎯", "🎲", "👑", "💖", "🌈", "☀️", "🌙", "🪐", "🍀", "🎮", "🎵", "🎨", "🚀", "🧿", "💫", "🦋", "🌺", "🪷", "🦅", "🐉", "🦁", "🐾", "⚜️", "🔱", "♟️", "🏅"];
export const BACKS = ["🪽", "🎒", "🛡️", "🎸", "🚀", "🪁", "🗡️", "⚔️", "🏹", "🪄", "🔱", "🛹", "🪂", "🎻", "🥁", "🪭", "☂️", "🌂", "🦋", "🦇", "🐉", "🦅", "🧣", "🎀", "💼", "👜", "🧺", "🪶", "🍃", "🌿", "❄️", "🔥"];
export const FEET = ["👟", "🥾", "🛼", "⛸️", "🩴", "👞", "👠", "🥿", "🩰", "🧦", "🐾", "⚡", "🔥", "❄️", "🌿", "💎", "🌟", "💖", "🎲", "🪙", "🚀", "🛹", "🏄", "🎿", "🛷", "🛸", "☁️", "🌈", "🌀", "💫", "🎊", "👑"];
/** Party Remake 4D finish: animated effects and dances layered on top of every look. */
export const FX = ["Kein FX", "RGB-Split 4D", "Hologramm", "Disco-Glitzer", "Laser-Glow", "Neon-Pink", "Neon-Cyan", "Gold-Glow", "Glitch", "Strobo", "Regenbogen", "Schatten-Klon", "Konfetti", "Bass-Puls", "Sternenstaub", "Prisma 4D"];
export const DANCES = ["Still", "Wackeln", "Hüpfen", "Drehen", "Roboter", "Moonwalk", "Disco-Finger", "Headbang", "Twist", "Wobble", "Flip 4D", "Shuffle"];
/** Afterlife Remake 4D: glowing halos and orbiting spirit companions. */
export const HALOS = ["Kein Halo", "Gold-Halo", "Neon-Halo", "Doppel-Halo", "Sternen-Halo", "Eis-Halo", "Feuer-Halo", "Regenbogen-Halo", "Glitch-Halo", "Seelen-Halo", "Galaxie-Halo", "Schatten-Halo"];
export const SPIRITS = ["", "👻", "💀", "🦋", "🕊️", "🪼", "🔮", "🌙", "⭐", "🕯️", "🫧", "☄️"];
export const LOOK_COMBINATIONS = 58 * HATS.length * FACES.length * HANDS.length * AURAS.length * TINTS.length * PATTERNS.length * TRAILS.length * BADGES.length * BACKS.length * FEET.length * FX.length * DANCES.length * HALOS.length * SPIRITS.length;
export function randomLook(random = Math.random): Look {
  const pick = <T,>(xs: readonly T[]): T | undefined => xs[Math.floor(random() * xs.length)];
  return { hat: pick(HATS) ?? "", face: pick(FACES) ?? "", hand: pick(HANDS) ?? "", aura: pick(AURAS) ?? "none", tint: Math.floor(random() * 24), pattern: Math.floor(random() * 16), trail: Math.floor(random() * 16), badge: Math.floor(random() * 32), back: Math.floor(random() * 32), feet: Math.floor(random() * 32), fx: Math.floor(random() * FX.length), dance: Math.floor(random() * DANCES.length), halo: Math.floor(random() * HALOS.length), spirit: Math.floor(random() * SPIRITS.length) };
}
