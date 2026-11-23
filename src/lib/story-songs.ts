// Story-Modus soundtrack: authored chiptune songs (pure data) and the rule that picks which one plays.
// Melodies are written in scale degrees so every song stays in key; `story-music.ts` turns them into sound.
import type { HouseKind } from "./story-houses";

export type Wave = "square" | "pulse25" | "pulse12" | "triangle" | "sawtooth" | "sine";
export type BassStyle = "pulse" | "walk" | "octave" | "gallop" | "drone" | "offbeat";
export type DrumStyle = "none" | "soft" | "march" | "rock" | "shuffle" | "disco" | "heavy" | "hand";
export type Song = {
  id: string; title: string; bpm: number;
  /** MIDI note of degree 1 in the melody octave. */
  root: number;
  scale: readonly number[];
  /** One chord (scale degree 1–7) per bar. */
  chords: readonly number[];
  /** 8 bars × 8 eighth notes. Tokens: degree 1–7 with ' (octave up) , (octave down) # b, "-" holds, "." rests. */
  melody: string;
  lead: Wave; bass: BassStyle; drums: DrumStyle; arp: boolean;
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10], DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MIXO = [0, 2, 4, 5, 7, 9, 10], PHRYG = [0, 1, 3, 5, 7, 8, 10], HARM = [0, 2, 3, 5, 7, 8, 11];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11], PHRYG_DOM = [0, 1, 4, 5, 7, 8, 10];
export const BARS = 8, STEPS_PER_BAR = 8, SONG_STEPS = BARS * STEPS_PER_BAR;

const song = (id: string, title: string, bpm: number, root: number, scale: number[], chords: number[], lead: Wave, bass: BassStyle, drums: DrumStyle, arp: boolean, bars: string[]): Song =>
  ({ id, title, bpm, root, scale, chords, lead, bass, drums, arp, melody: bars.join(" | ") });

/** Outside themes, one per world (index = world). */
export const WORLD_SONGS: readonly Song[] = [
  song("world-0", "Würfelwald-Wanderlied", 120, 72, MAJOR, [1, 1, 4, 5, 1, 6, 4, 5], "square", "walk", "soft", false,
    ["1 - 3 5 1' - 7 6", "5 - 3 - 1 - . .", "6 - 4 6 1' - 6 4", "5 - - - 2 3 4 5", "3' - 2' 1' 5 - 1' 3'", "2' - 1' 6 3 - . 6", "4 5 6 1' 2' - 1' 6", "7 - 5 - 2' - . ."]),
  song("world-1", "Glitzerwüsten-Karawane", 108, 74, PHRYG_DOM, [1, 1, 2, 1, 1, 7, 2, 1], "pulse25", "offbeat", "hand", false,
    ["5 - 6 5 4 3 2 1", "2 - 3 - 1 - . .", "3 4 5 - 6 - 5 4", "3 - 2 - 1 - - .", "1' - 7 6 5 - 6 7", "1' - - 7 6 5 4 3", "4 3 2 3 4 - 3 2", "1 - - - . . 5, ."]),
  song("world-2", "Schlangensumpf-Blues", 92, 64, DORIAN, [1, 4, 1, 4, 6, 7, 1, 5], "triangle", "walk", "shuffle", false,
    ["1 - 3 - 5 4 3 1", "4 - 6 - 5 - 4 .", "3 - 1 - 7, - 1 .", "2 - 4 - 6 - 4 .", "5 - - 6 7 - 6 5", "4 - 3 - 4 5 - .", "3 2 1 - 2 3 4 -", "5 - - - 3 . 2 ."]),
  song("world-3", "Eisberg-Glockenspiel", 100, 77, LYDIAN, [1, 1, 2, 2, 1, 1, 5, 5], "sine", "pulse", "soft", true,
    ["5 - 3 - 1' - 7 -", "6 - 4 - 2 - . .", "5 - 3 - 1' - 2' -", "3' - - - 2' - . .", "1' 7 6 5 4 - 5 6", "7 - 5 - 3 - . .", "2 3 4 5 6 7 1' 2'", "1' - - - 5 - . ."]),
  song("world-4", "Zitadellen-Fließband", 128, 69, HARM, [1, 1, 6, 6, 4, 4, 5, 5], "square", "octave", "march", false,
    ["1 . 1 . 3 . 1 .", "5 - 4 - 3 - 2 -", "1 . 1 . 6, . 7, .", "1 - - - . . 5, .", "6 - 5 - 4 - 3 4", "5 - - - 1' - . .", "7 - 6 - 5 - 4 3", "2 - 7, - 5, - . ."]),
  song("world-5", "Glutgipfel-Aufstieg", 140, 64, PHRYG, [1, 1, 2, 2, 1, 1, 7, 7], "sawtooth", "gallop", "rock", false,
    ["1 - 1 2 3 - 2 1", "2 - - - 1 . 7, .", "1 - 1 2 3 - 5 3", "4 - 3 - 2 - . .", "5 - 6 - 5 4 3 4", "5 - - - 3 - 1 -", "7, - 1 - 2 - 3 -", "2 - - - 1 . . ."]),
  song("world-6", "Wolkengarten-Walzer", 88, 70, MAJOR, [1, 3, 6, 4, 1, 3, 2, 5], "triangle", "drone", "none", true,
    ["3 - - 5 1' - - 7", "6 - - 5 3 - - .", "1' - - 3' 2' - 1' 6", "4 - - - 6 - . .", "5 - - 3' 2' - - 1'", "7 - - 5 3 - - 5", "6 - 7 - 1' - 2' -", "7 - - - 5 - . ."]),
  song("world-7", "Korallenküsten-Calypso", 112, 67, MIXO, [1, 7, 4, 1, 1, 7, 4, 5], "pulse25", "offbeat", "shuffle", false,
    ["1 . 3 . 5 6 5 3", "7 - 6 5 4 - . .", "4 . 6 . 1' - 6 4", "3 - 5 - 1 - . .", "5 . 1' . 3' 2' 1' 7", "7 - 1' 7 6 5 4 .", "6 . 4 . 6 1' 2' 1'", "5 - - - 2 - . ."]),
  song("world-8", "Schattenreich-Nebel", 76, 62, HARM, [1, 1, 6, 6, 4, 4, 5, 5], "triangle", "drone", "none", false,
    ["1 - - - 3 - 2 -", "1 - 7, - 6, - - .", "6 - - - 1' - 7 -", "6 - 5 - 3 - - .", "4 - 5 - 6 - 7 -", "1' - - - 7 - 6 -", "5 - 4 - 3 - 2 -", "7, - - - . . . ."]),
];

/** Dungeon themes, one per world's dungeon. */
export const DUNGEON_SONGS: readonly Song[] = [
  song("dungeon-0", "Wurzelgewölbe", 96, 69, MINOR, [1, 1, 6, 7, 1, 1, 4, 5], "triangle", "pulse", "soft", true,
    ["1 - - - 5 - - -", "4 - 3 - 2 - - -", "3 - - - 1 - - -", "2 - - - 7, - - -", "1 - 2 - 3 - 5 -", "4 - - - 3 - - -", "6 - 5 - 4 - 3 -", "2 - - - 5, - - -"]),
  song("dungeon-1", "Grab der Sandkönige", 104, 62, PHRYG_DOM, [1, 1, 2, 2, 1, 1, 7, 1], "pulse25", "drone", "hand", true,
    ["1 2 1 - . . 5, .", "1 2 3 - 2 - 1 -", "3 4 3 - . . 1 .", "2 - - - . . . .", "5 6 5 - 4 - 3 -", "4 3 2 - 1 - - -", "2 3 4 - 3 - 2 -", "1 - - - . . . ."]),
  song("dungeon-2", "Moorlabyrinth", 84, 60, DORIAN, [1, 1, 4, 4, 1, 1, 7, 7], "square", "walk", "shuffle", false,
    ["1 - 3 - 5 - 4 3", "2 - - - 7, - - .", "1 - 3 - 6 - 5 4", "5 - - - . . . .", "6 - 5 - 4 - 3 -", "4 - 3 - 2 - 1 -", "7, - 1 - 2 - 4 -", "3 - - - 2 - . ."]),
  song("dungeon-3", "Kristallpalast", 116, 71, HARM, [1, 4, 4, 5, 1, 6, 4, 5], "sine", "pulse", "soft", true,
    ["5 - 1' - 7 - 5 -", "6 - 5 - 4 - 3 -", "4 - 3 - 2 - 3 -", "7, - - - . . . .", "5 - 1' - 2' - 3' -", "2' - 1' - 7 - 6 -", "5 - 4 - 3 - 2 -", "1 - - - . . . ."]),
  song("dungeon-4", "Maschinenherz", 136, 64, MINOR, [1, 4, 1, 5, 3, 6, 4, 5], "sawtooth", "octave", "march", false,
    ["1 1 . 1 3 . 1 .", "4 4 . 4 3 . 2 .", "1 1 . 1 6, . 7, .", "1 . 5, . 1 . . .", "3 3 . 3 5 . 3 .", "6 6 . 6 5 . 4 .", "3 . 2 . 1 . 7, .", "1 - - - . . . ."]),
  song("dungeon-5", "Magmakammern", 150, 64, PHRYG, [1, 1, 3, 3, 6, 2, 7, 2], "square", "gallop", "rock", false,
    ["1 . 2 . 1 . 7, .", "1 - - - . 3 2 1", "3 . 4 . 3 . 2 .", "3 - - - . 5 4 3", "6 . 5 . 4 . 3 .", "2 - - - . 1 2 3", "4 . 3 . 2 . 1 .", "2 - - - 1 - - -"]),
  song("dungeon-6", "Sturmtempel", 100, 72, LYDIAN, [1, 5, 1, 1, 2, 5, 5, 1], "triangle", "drone", "soft", true,
    ["1' - 7 - 5 - 4 -", "5 - - - 2 - - -", "1' - 7 - 5 - 7 -", "1' - - - . . . .", "2' - 1' - 7 - 6 -", "7 - - - 4 - - -", "5 - 6 - 7 - 2' -", "1' - - - . . . ."]),
  song("dungeon-7", "Tintengrotte", 108, 62, DORIAN, [1, 4, 1, 4, 4, 5, 4, 1], "pulse25", "offbeat", "shuffle", false,
    ["1 . 5, . 1 2 3 .", "4 . 3 . 2 - . .", "1 . 5, . 1 2 3 5", "4 - - - 3 - . .", "6 . 5 . 4 5 6 .", "7 . 6 . 5 - . .", "4 3 2 3 4 5 6 7", "1' - - - . . . ."]),
  song("dungeon-8", "Festung der Würfel", 88, 57, HARM, [1, 1, 1, 6, 1, 1, 6, 5], "sawtooth", "drone", "heavy", true,
    ["1 - - - 2 - - -", "3 - - - 2 - - -", "1 - - - 7, - - -", "6, - - - 7, - - -", "1 - 3 - 5 - 4 -", "3 - 2 - 7, - - -", "6, - 7, - 1 - 2 -", "7, - - - . . . ."]),
];

/** Boss fights, one unique theme per boss (index = world; 8 is Dicey). */
export const BOSS_SONGS: readonly Song[] = [
  song("boss-0", "Showdown mit Mr. Dixie", 160, 64, MINOR, [1, 7, 1, 3, 4, 5, 6, 7], "square", "gallop", "rock", false,
    ["1 . 1 1 5 . 1 1", "7 - 6 - 5 - 4 -", "1 . 1 1 5 . 1 1", "3' - 2' - 1' - 7 -", "6 . 6 6 4 . 6 6", "5 - 4 - 3 - 2 -", "1 . 2 . 3 . 4 .", "5 - - - 7, - - -"]),
  song("boss-1", "Tanz mit Mrs. Dice", 132, 62, PHRYG_DOM, [1, 1, 2, 1, 4, 4, 2, 1], "pulse25", "octave", "disco", true,
    ["1 1' 7 1' 5 . 6 5", "4 . 3 . 2 3 2 1", "1 1' 7 1' 5 . 6 7", "1' - - - . . . .", "4 4' 3' 4' 2' . 1' 7", "6 . 5 . 4 5 4 3", "2 3 4 5 6 7 1' 2'", "1' - 5 - 1 - . ."]),
  song("boss-2", "Mr. Pentious' Wundermaschine", 144, 67, HARM, [1, 5, 1, 5, 6, 4, 5, 5], "square", "pulse", "march", true,
    ["1 2 3 2 1 7, 1 .", "5 6 7 6 5 4 5 .", "1' 7 6 5 4 3 2 1", "7, - - - 5, - - -", "3 4 5 4 3 2 3 .", "6 7 1' 7 6 5 6 .", "1' . 7 . 6 . 7 .", "1' - - - 7 - - -"]),
  song("boss-3", "Strike gegen Mrs. Rolls", 150, 66, MINOR, [1, 6, 2, 5, 1, 4, 7, 5], "sawtooth", "octave", "rock", false,
    ["1 - 3 - 5 - 3 -", "6 - 5 - 3 - 1 -", "2 - 4 - 6 - 4 -", "5 - - - . 5 6 7", "1' - 7 - 6 - 5 -", "4 - 3 - 2 - 1 -", "2 . 2 . 3 . 4 .", "5 - - - 5, - - -"]),
  song("boss-4", "Mr. Overhauls Schichtende", 168, 57, HARM, [1, 2, 1, 6, 5, 4, 3, 5], "square", "octave", "heavy", false,
    ["1 . . 1 . . 1 .", "2 . . 2 . . 3 .", "1 . . 1 . . 7, .", "6, - - - 7, - - -", "5 . 5 6 5 4 3 .", "4 . 4 5 4 3 2 .", "3 . 3 4 3 2 1 .", "7, - - - 5, - - -"]),
  song("boss-5", "Mrs. Magmas Ausbruch", 176, 64, PHRYG, [1, 1, 1, 6, 5, 3, 7, 1], "sawtooth", "gallop", "rock", false,
    ["1 1 2 1 1 1 3 1", "1 1 2 1 4 - 3 -", "1 1 2 1 1 1 5 1", "6 - 5 - 2 - - -", "5 5 6 5 4 4 5 4", "3 3 4 3 2 - 1 -", "7, 1 2 3 4 5 6 7", "1' - - - 1 - - -"]),
  song("boss-6", "Mr. Nimbus' Sturmsinfonie", 140, 69, MINOR, [1, 1, 4, 4, 6, 4, 7, 5], "triangle", "pulse", "march", true,
    ["5 - - 4 3 - - 2", "3 - - - 1 - - -", "6 - - 5 4 - - 3", "4 - - - 2 - - -", "1' - - 7 6 - - 5", "6 - - 5 4 - - 3", "2 - 3 - 4 - 5 -", "7 - - - 5 - - -"]),
  song("boss-7", "Mrs. Krakens Enterhaken", 152, 62, DORIAN, [1, 4, 7, 3, 1, 6, 4, 1], "sawtooth", "offbeat", "shuffle", false,
    ["1 . 1 3 . 3 5 .", "4 . 4 3 . 2 1 .", "7, . 7, 2 . 2 4 .", "3 . 3 2 . 1 7, .", "1 . 1 3 . 3 5 .", "6 . 6 5 . 4 3 .", "4 . 3 2 . 1 7, .", "1 - - - . . . ."]),
  song("boss-8", "Dicey – Das Ende der Menschheit", 180, 62, HARM, [1, 6, 2, 5, 1, 4, 6, 5], "sawtooth", "octave", "heavy", true,
    ["1 . 5 . 1' . 5 .", "6 . 5 . 4 . 3 .", "2 . 6 . 2' . 6 .", "7 - - - 5 - - -", "1' 7 6 5 6 5 4 3", "4 3 2 1 2 1 7, 6,", "6, . 7, . 1 . 2 .", "3 - 2 - 7, - - -"]),
];

/** Every house, cabin, hut and your own home share this one cosy theme. */
export const HOUSE_SONG = song("house", "Am warmen Kamin", 92, 65, MAJOR, [1, 6, 4, 5, 1, 6, 2, 5], "triangle", "walk", "soft", false,
  ["3 - 4 - 5 - 1' -", "6 - 5 - 3 - - -", "4 - 5 - 6 - 4 -", "5 - - - 2 - - -", "3 - 4 - 5 - 3' -", "2' - 1' - 6 - - -", "4 - 6 - 5 - 4 -", "2 - 7, - 1 - - -"]);
/** Castles, mountain caves, towers, shrines, ruins and crypts share this stately theme. */
export const STRUCTURE_SONG = song("structure", "Hallen aus Stein", 104, 62, MINOR, [1, 1, 7, 7, 6, 6, 5, 5], "pulse25", "pulse", "march", true,
  ["1 - - 5, 1 - 2 -", "3 - - 2 1 - 7, -", "7, - - 4, 7, - 1 -", "2 - - - 5, - - -", "3 - - 1 3 - 4 -", "5 - - 4 3 - 1 -", "2 - 3 - 4 - 5 -", "5 - - - 7, - - -"]);

export const ALL_SONGS: readonly Song[] = [...WORLD_SONGS, ...DUNGEON_SONGS, ...BOSS_SONGS, HOUSE_SONG, STRUCTURE_SONG];
export const songById = (id: string) => ALL_SONGS.find((s) => s.id === id);

const HOMES: readonly HouseKind[] = ["house", "cabin", "hut"];
/** Homes play the house theme; every other enterable building (castle, caves in the mountains, …) the structure theme. */
export const insideSong = (kind: HouseKind) => (HOMES.includes(kind) ? HOUSE_SONG : STRUCTURE_SONG);

export type MusicPlace =
  | { at: "world"; world: number }
  | { at: "dungeon"; world: number; bossFight: boolean }
  | { at: "inside"; kind: HouseKind }
  | { at: "home" };
export function songFor(p: MusicPlace): Song {
  const clampW = (w: number) => Math.max(0, Math.min(8, Math.floor(w) || 0));
  switch (p.at) {
    case "world": return WORLD_SONGS[clampW(p.world)]!;
    case "dungeon": return (p.bossFight ? BOSS_SONGS : DUNGEON_SONGS)[clampW(p.world)]!;
    case "inside": return insideSong(p.kind);
    case "home": return HOUSE_SONG;
  }
}

export type Note = { step: number; len: number; midi: number };
/** MIDI note of a scale degree (1-based, may exceed 7) in a song's key. */
export function degreeMidi(s: Pick<Song, "root" | "scale">, degree: number, octave = 0, shift = 0) {
  const d = degree - 1, o = Math.floor(d / 7), i = ((d % 7) + 7) % 7;
  return s.root + 12 * (octave + o) + (s.scale[i] ?? 0) + shift;
}
/** Turns the melody text into notes; throws on anything that is not a valid token, so bad songs fail the tests. */
export function melodyNotes(s: Song): Note[] {
  const bars = s.melody.split("|").map((b) => b.trim().split(/\s+/));
  if (bars.length !== BARS) throw new Error(`${s.id}: ${bars.length} bars`);
  const notes: Note[] = [];
  bars.forEach((tokens, b) => {
    if (tokens.length !== STEPS_PER_BAR) throw new Error(`${s.id}: bar ${b + 1} has ${tokens.length} steps`);
    tokens.forEach((t, k) => {
      const step = b * STEPS_PER_BAR + k;
      if (t === ".") return;
      if (t === "-") { const last = notes[notes.length - 1]; if (last && last.step + last.len === step) last.len++; return; }
      const m = /^([1-7])([',]*)([#b]?)$/.exec(t);
      if (!m) throw new Error(`${s.id}: bad token "${t}"`);
      const oct = [...m[2]!].reduce((n, c) => n + (c === "'" ? 1 : -1), 0);
      notes.push({ step, len: 1, midi: degreeMidi(s, Number(m[1]), oct, m[3] === "#" ? 1 : m[3] === "b" ? -1 : 0) });
    });
  });
  return notes;
}
/** The three notes of a bar's chord, an octave below the melody. */
export const chordNotes = (s: Song, bar: number) => {
  const d = s.chords[((bar % BARS) + BARS) % BARS] ?? 1;
  return [d, d + 2, d + 4].map((x) => degreeMidi(s, x, -1));
};
