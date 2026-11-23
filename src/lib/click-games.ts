export type ClickMode = "sprint" | "hunt" | "dodge" | "sequence" | "alternate" | "double" | "precision" | "moving" | "memory" | "reaction";
export type ClickGame = { id: string; name: string; mode: ClickMode; level: number; seconds: number; targetCount: number; size: number; interval: number };

const MODES: [ClickMode, string][] = [
  ["sprint", "Klick-Sprint"], ["hunt", "Sternenjagd"], ["dodge", "Bomben-Ausweichen"],
  ["sequence", "Zahlenkette"], ["alternate", "Links-Rechts"], ["double", "Doppel-Klick"],
  ["precision", "Punktlandung"], ["moving", "Wanderziel"], ["memory", "Merk-Klick"], ["reaction", "Ampel-Klick"],
];

// Ten distinct mechanics, each with ten mechanically different difficulty levels.
export const CLICK_GAMES: ClickGame[] = MODES.flatMap(([mode, name]) =>
  Array.from({ length: 100 }, (_, i) => ({
    id: `${mode}-${i + 1}`, name: `Party Remake ${name} ${i + 1}`, mode, level: i % 10 + 1,
    seconds: 10, targetCount: 3 + i % 10, size: 76 - i % 10 * 4 - Math.floor(i / 10), interval: 1400 - i % 10 * 90 - Math.floor(i / 10) * 20,
  })),
);

export function scoreClick(game: ClickGame, target: number, expected: number, green: boolean) {
  if (game.mode === "dodge" && target !== expected) return -2;
  if (game.mode === "reaction" && !green) return -1;
  if (["sequence", "alternate", "memory"].includes(game.mode) && target !== expected) return -1;
  return 1;
}

export function quickTaskPosition(position: number, deadline: number, now: number) {
  return now >= deadline ? Math.max(0, position - 3) : position;
}