import { describe, expect, it } from "vitest";
import { ALL_SONGS, BOSS_SONGS, DUNGEON_SONGS, HOUSE_SONG, STRUCTURE_SONG, WORLD_SONGS, SONG_STEPS, melodyNotes, songFor, insideSong } from "./story-songs";
import { WORLDS } from "./story";

const tune = (id: string) => JSON.stringify(melodyNotes(ALL_SONGS.find((s) => s.id === id)!).map((n) => [n.step, n.len, n.midi]));

describe("story soundtrack", () => {
  it("has a theme for every world, every dungeon and every boss", () => {
    expect(WORLD_SONGS).toHaveLength(WORLDS.length);
    expect(DUNGEON_SONGS).toHaveLength(WORLDS.length);
    expect(BOSS_SONGS).toHaveLength(WORLDS.length);
  });
  it("every song is a valid 8-bar loop that stays inside its bars", () => {
    for (const s of ALL_SONGS) {
      const notes = melodyNotes(s);
      expect(notes.length, s.id).toBeGreaterThan(10);
      for (const n of notes) expect(n.step + n.len, s.id).toBeLessThanOrEqual(SONG_STEPS);
      expect(s.chords, s.id).toHaveLength(8);
    }
  });
  it("all 29 melodies are different, so every boss sounds unique", () => {
    expect(ALL_SONGS).toHaveLength(29);
    expect(new Set(ALL_SONGS.map((s) => tune(s.id))).size).toBe(29);
    expect(new Set(ALL_SONGS.map((s) => s.id)).size).toBe(29);
  });
  it("outside plays the world's theme, a dungeon its own theme, the boss room the boss theme", () => {
    for (let w = 0; w < 9; w++) {
      expect(songFor({ at: "world", world: w }).id).toBe(`world-${w}`);
      expect(songFor({ at: "dungeon", world: w, bossFight: false }).id).toBe(`dungeon-${w}`);
      expect(songFor({ at: "dungeon", world: w, bossFight: true }).id).toBe(`boss-${w}`);
    }
  });
  it("every house shares one theme; castles, mountain caves and other structures share a different one", () => {
    for (const k of ["house", "cabin", "hut"] as const) expect(insideSong(k)).toBe(HOUSE_SONG);
    for (const k of ["castle", "cave", "tower", "shrine", "ruin", "crypt"] as const) expect(insideSong(k)).toBe(STRUCTURE_SONG);
    expect(songFor({ at: "home" })).toBe(HOUSE_SONG);
    expect(HOUSE_SONG.id).not.toBe(STRUCTURE_SONG.id);
  });
});
