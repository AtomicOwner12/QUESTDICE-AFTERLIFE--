import { describe, it, expect } from "vitest";
import { addPlayer, applyOnlineAction, createOnlineState, makeCode, isValidCode, normalizeCode, sanitizePlayer, sanitizeMap, onlineGoal, onlineDice, onlineTile, MAX_ONLINE_TILES, MAX_ONLINE_PLAYERS, QUICK_MS, OnlineError, type OnlineState, type OnlineMap } from "./online";

const info = (name: string) => sanitizePlayer({ name, skin: "tiger" });
function lobbyWith(n: number): OnlineState {
  let s = createOnlineState(info("Host"), () => 0.1);
  for (let i = 1; i < n; i++) s = addPlayer(s, info(`P${i}`), () => 0.2).state;
  return s;
}

describe("online lobbies", () => {
  it("makes 6-character join codes", () => {
    const c = makeCode();
    expect(c).toHaveLength(6);
    expect(isValidCode(c)).toBe(true);
    expect(normalizeCode("ab-c 12x9")).toBe("ABC12X");
  });
  it("allows more than 32 players, up to 40", () => {
    expect(MAX_ONLINE_PLAYERS).toBeGreaterThan(32);
    const s = lobbyWith(MAX_ONLINE_PLAYERS);
    expect(s.players).toHaveLength(40);
    expect(() => addPlayer(s, info("Zu viel"))).toThrow(OnlineError);
  });
  it("only the host starts, and only with at least 2 players", () => {
    expect(() => applyOnlineAction(lobbyWith(1), 0, { type: "start" }, 0)).toThrow(OnlineError);
    expect(() => applyOnlineAction(lobbyWith(3), 1, { type: "start" }, 0)).toThrow(OnlineError);
    expect(applyOnlineAction(lobbyWith(3), 0, { type: "start" }, 0).phase).toBe("playing");
  });
  it("nobody can join once the game started", () => {
    const s = applyOnlineAction(lobbyWith(2), 0, { type: "start" }, 0);
    expect(() => addPlayer(s, info("Spät"))).toThrow(OnlineError);
  });
  it("only the player whose turn it is can roll", () => {
    const s = applyOnlineAction(lobbyWith(3), 0, { type: "start" }, 0);
    expect(() => applyOnlineAction(s, 1, { type: "roll" }, 0)).toThrow(OnlineError);
    const r = applyOnlineAction(s, 0, { type: "roll" }, 0, () => 0.5);
    expect(r.players[0]!.pos).toBeGreaterThan(0);
    expect(r.event).not.toBeNull();
  });
  it("an expired misfortune quick task costs 3 steps", () => {
    const s0 = applyOnlineAction(lobbyWith(2), 0, { type: "start" }, 0);
    const s: OnlineState = { ...s0, players: s0.players.map((p, i) => (i === 0 ? { ...p, pos: 10 } : p)), event: { kind: "quick", text: "x" } };
    const go = applyOnlineAction(s, 0, { type: "go" }, 1000);
    const late = applyOnlineAction(go, 0, { type: "resolve" }, 1000 + QUICK_MS);
    expect(late.players[0]!.pos).toBe(7);
    const inTime = applyOnlineAction(go, 0, { type: "resolve" }, 1000 + QUICK_MS - 1);
    expect(inTime.players[0]!.pos).toBe(10);
    expect(late.turn).toBe(1);
  });
  it("losing the Death Penalty costs 15 steps", () => {
    const s0 = applyOnlineAction(lobbyWith(2), 0, { type: "start" }, 0);
    const s: OnlineState = { ...s0, players: s0.players.map((p, i) => (i === 0 ? { ...p, pos: 40 } : p)), event: { kind: "death", game: 0 } };
    expect(applyOnlineAction(s, 0, { type: "resolve", result: false }, 0).players[0]!.pos).toBe(25);
  });
});

/** 20 fields; the custom platforms sit at lane positions 3, 7, 11 and 15. */
const TEST_MAP = (): OnlineMap => sanitizeMap({
  title: "Meine Welt",
  dice: 1,
  platforms: [
    { name: "Sprung", emoji: "🚀", effect: "steps", value: 5 },
    { name: "Loch", emoji: "🕳", effect: "steps", value: -4 },
    { name: "Schatz", emoji: "💎", effect: "coins", value: 7 },
    { name: "Schild", emoji: "🛡", effect: "shield" },
  ],
  tiles: Array.from({ length: 20 }, (_, i) => (i === 2 ? "custom-0" : i === 6 ? "custom-1" : i === 10 ? "custom-2" : i === 14 ? "custom-3" : "empty")),
});

describe("online custom maps", () => {
  it("only the host can pick or clear the map, and only before the start", () => {
    const s = lobbyWith(2);
    expect(() => applyOnlineAction(s, 1, { type: "map", map: TEST_MAP() }, 0)).toThrow(OnlineError);
    const withMap = applyOnlineAction(s, 0, { type: "map", map: TEST_MAP() }, 0);
    expect(withMap.map?.title).toBe("Meine Welt");
    expect(applyOnlineAction(withMap, 0, { type: "map", map: null }, 0).map).toBeNull();
    const playing = applyOnlineAction(withMap, 0, { type: "start" }, 0);
    expect(() => applyOnlineAction(playing, 0, { type: "map", map: TEST_MAP() }, 0)).toThrow(OnlineError);
  });
  it("a custom map sets the goal and the dice count", () => {
    const s = applyOnlineAction(lobbyWith(2), 0, { type: "map", map: TEST_MAP() }, 0);
    expect(onlineGoal(s)).toBe(21);
    expect(onlineDice(s)).toBe(1);
    expect(onlineTile(s.mode, s.players[0]!.seed, 3, s.map)).toBe("custom-0");
    expect(onlineTile(s.mode, s.players[0]!.seed, 21, s.map)).toBe("goal");
  });
  it("rolling onto a custom field opens that platform", () => {
    const s = applyOnlineAction(applyOnlineAction(lobbyWith(2), 0, { type: "map", map: TEST_MAP() }, 0), 0, { type: "start" }, 0);
    const r = applyOnlineAction(s, 0, { type: "roll" }, 0, () => 0.4);
    expect(r.players[0]!.pos).toBe(3);
    expect(r.event).toEqual({ kind: "custom", platform: 0 });
  });
  it("custom platforms apply steps, coins and shields", () => {
    const s0 = applyOnlineAction(applyOnlineAction(lobbyWith(2), 0, { type: "map", map: TEST_MAP() }, 0), 0, { type: "start" }, 0);
    const withEvent = (platform: number, pos = 10): OnlineState => ({
      ...s0, event: { kind: "custom", platform },
      players: s0.players.map((p, i) => (i === 0 ? { ...p, pos } : p)),
    });
    expect(applyOnlineAction(withEvent(0), 0, { type: "resolve" }, 0).players[0]!.pos).toBe(15);
    expect(applyOnlineAction(withEvent(1), 0, { type: "resolve" }, 0).players[0]!.pos).toBe(6);
    expect(applyOnlineAction(withEvent(2), 0, { type: "resolve" }, 0).players[0]!.coins).toBe(7);
    expect(applyOnlineAction(withEvent(3), 0, { type: "resolve" }, 0).players[0]!.shield).toBe(true);
  });
  it("a custom map has an end even in an endless mode", () => {
    let s = applyOnlineAction(lobbyWith(2), 0, { type: "settings", mode: "party", location: "zuhause" }, 0);
    s = applyOnlineAction(s, 0, { type: "map", map: TEST_MAP() }, 0);
    s = applyOnlineAction(s, 0, { type: "start" }, 0);
    const near: OnlineState = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, pos: 19 } : p)) };
    const r = applyOnlineAction(near, 0, { type: "roll" }, 0, () => 0.4);
    expect(r.players[0]!.pos).toBe(21);
    expect(r.event).toEqual({ kind: "win", place: 1 });
    expect(r.phase).toBe("playing");
  });
  it("rejects maps that are too long and keeps unknown fields empty", () => {
    expect(() => sanitizeMap({ tiles: Array.from({ length: MAX_ONLINE_TILES + 1 }, () => "empty") })).toThrow(OnlineError);
    const m = sanitizeMap({ title: "  ", dice: 9, platforms: [], tiles: ["task", "quatsch", "custom-9"] });
    expect(m.title).toBe("Custom-Map");
    expect(m.dice).toBe(3);
    expect(m.tiles.slice(0, 3)).toEqual(["task", "empty", "empty"]);
  });
});
