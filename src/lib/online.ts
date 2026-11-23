// Online lobbies: one shared game state per lobby, changed only through applyOnlineAction.
// Pure and deterministic given `now` and `rand`, so the server can run it and tests can check it.
import { SKINS, MINIGAMES, DEATH_GAMES, type TileType } from "./game";
import { DEFAULT_LOOK, type Look } from "./avatar";
import { CLICK_GAMES } from "./click-games";
import { QUIZ_QUESTIONS } from "./quiz";
import { SHOP_ITEMS, buyItem, type ShopItemId } from "./shop";
import { cleanTiles, cleanPlatform, customIndex, MAX_PLATFORMS, type MapTile, type CustomPlatform } from "./custom-maps";
import { LOCATIONS, locationTasks, locationQuickTasks, locationSpecials, locationUnique, type LocationId } from "./locations";
import { MODES, modeGoal, isEndless, usesStatelessBoard, buildModeBoard, partyTile, advancePosition, hasFinished, diceCount, platformFor, REMAKE_PLATFORMS, type GameMode } from "./remake";

export const MAX_ONLINE_PLAYERS = 40;
export const CODE_LENGTH = 6;
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const QUICK_MS = 20_000;
export const DEATH_LOSS = 15;
export const BAD_LOSS = 3;
/** Longest custom map that fits into one online lobby. */
export const MAX_ONLINE_TILES = 5000;

export type OnlinePlayer = {
  name: string; skin: string; look: Look; seed: number;
  pos: number; coins: number; shield: boolean; frozen: boolean; double: boolean; place: number | null;
};
/** A player-built map, copied into the lobby so every device plays the same fields. */
export type OnlineMap = { title: string; tiles: MapTile[]; platforms: CustomPlatform[]; dice: number };

export type OnlineEvent =
  | { kind: "empty" }
  | { kind: "task"; text: string }
  | { kind: "special"; name: string; desc: string }
  | { kind: "bad"; back: number }
  | { kind: "quick"; text: string; deadline?: number }
  | { kind: "death"; game: number }
  | { kind: "click"; game: number }
  | { kind: "quiz"; question: number }
  | { kind: "remake"; platform: number; variant: number }
  | { kind: "local"; steps: number }
  | { kind: "shop" }
  | { kind: "tax"; amount: number; from: number | null }
  | { kind: "help" }
  | { kind: "custom"; platform: number }
  | { kind: "win"; place: number };
export type OnlineState = {
  phase: "lobby" | "playing" | "over";
  mode: GameMode; location: LocationId;
  /** Host's chosen custom map, or null for the built-in modes. */
  map: OnlineMap | null;
  players: OnlinePlayer[];
  turn: number; roll: number[] | null; event: OnlineEvent | null;
  /** Increments with every roll, so clients can key per-event UI. */
  eventId: number;
  log: string[];
};
export type OnlineAction =
  | { type: "settings"; mode: GameMode; location: LocationId }
  | { type: "map"; map: unknown }
  | { type: "start" }
  | { type: "roll" }
  | { type: "go" }
  | { type: "resolve"; result?: boolean; item?: ShopItemId; target?: number }
  | { type: "skip" }
  | { type: "end" };
export type PlayerInfo = { name: string; skin: string; look: Look };

export class OnlineError extends Error {}
const fail = (msg: string): never => { throw new OnlineError(msg); };

export function makeCode(rand: () => number = Math.random) {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)]).join("");
}
export const normalizeCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
export const isValidCode = (code: string) => code.length === CODE_LENGTH && [...code].every((c) => CODE_ALPHABET.includes(c));

const LOOK_STR = ["hat", "face", "hand", "aura"] as const;
const LOOK_NUM = ["tint", "pattern", "trail", "badge", "back", "feet", "fx", "dance", "halo", "spirit"] as const;
/** Keeps only known, bounded look fields from untrusted input. */
export function sanitizePlayer(input: unknown): PlayerInfo {
  const o = (input ?? {}) as Record<string, unknown>;
  const name = String(o["name"] ?? "").replace(/\s+/g, " ").trim().slice(0, 14);
  if (!name) fail("Bitte gib einen Namen ein.");
  const skin = SKINS.some((s) => s.id === o["skin"]) ? String(o["skin"]) : "penguin";
  const raw = (o["look"] ?? {}) as Record<string, unknown>;
  const look: Look = { ...DEFAULT_LOOK };
  for (const k of LOOK_STR) if (typeof raw[k] === "string") look[k] = String(raw[k]).slice(0, 12);
  for (const k of LOOK_NUM) { const v = raw[k]; if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 10_000) look[k] = v; }
  return { name, skin, look };
}

/** Keeps only a valid, bounded custom map from untrusted input. */
export function sanitizeMap(input: unknown): OnlineMap {
  const o = (input ?? {}) as Record<string, unknown>;
  const raw = Array.isArray(o["platforms"]) ? o["platforms"].slice(0, MAX_PLATFORMS) : [];
  const platforms = raw.map((p) => cleanPlatform((p ?? {}) as Partial<CustomPlatform>));
  const tilesRaw = o["tiles"];
  if (Array.isArray(tilesRaw) && tilesRaw.length > MAX_ONLINE_TILES) fail(`Deine Map ist zu lang für Online (max. ${MAX_ONLINE_TILES} Felder).`);
  const tiles = cleanTiles(tilesRaw, platforms.length);
  const title = String(o["title"] ?? "").replace(/\s+/g, " ").trim().slice(0, 40) || "Custom-Map";
  const dice = Number.isFinite(Number(o["dice"])) ? Math.max(1, Math.min(3, Math.round(Number(o["dice"])))) : 1;
  return { title, tiles, platforms, dice };
}

const newPlayer = (p: PlayerInfo, seed: number): OnlinePlayer => ({ ...p, seed, pos: 0, coins: 0, shield: false, frozen: false, double: false, place: null });

export function createOnlineState(host: PlayerInfo, rand: () => number = Math.random): OnlineState {
  return { phase: "lobby", mode: "classic", location: "zuhause", map: null, players: [newPlayer(host, Math.floor(rand() * 1e9))], turn: 0, roll: null, event: null, eventId: 0, log: [] };
}

/** Adds a player to a waiting lobby and returns the new seat number. */
export function addPlayer(s: OnlineState, info: PlayerInfo, rand: () => number = Math.random): { state: OnlineState; seat: number } {
  if (s.phase !== "lobby") fail("Das Spiel hat schon begonnen.");
  if (s.players.length >= MAX_ONLINE_PLAYERS) fail(`Die Lobby ist voll (max. ${MAX_ONLINE_PLAYERS} Spieler).`);
  let name = info.name;
  for (let n = 2; s.players.some((p) => p.name.toLowerCase() === name.toLowerCase()); n++) name = `${info.name.slice(0, 11)} ${n}`;
  const players = [...s.players, newPlayer({ ...info, name }, Math.floor(rand() * 1e9))];
  return { state: { ...s, players, log: pushLog(s.log, `👋 ${name} ist beigetreten.`) }, seat: players.length - 1 };
}

const boardCache = new Map<string, TileType[]>();
/** Tile under a player's lane index; every player has their own shuffled board. */
export function onlineTile(mode: GameMode, seed: number, index: number, map?: OnlineMap | null): TileType {
  if (map) return index <= 0 ? "start" : index > map.tiles.length ? "goal" : map.tiles[index - 1] ?? "empty";
  const goal = modeGoal(mode);
  if (index >= goal) return "goal";
  if (usesStatelessBoard(mode)) return partyTile(index, seed);
  const key = `${mode}:${seed}`;
  let b = boardCache.get(key);
  if (!b) { b = buildModeBoard(mode, seed); boardCache.set(key, b); if (boardCache.size > 64) boardCache.delete(boardCache.keys().next().value as string); }
  return b[index] ?? "empty";
}

export const onlineGoal = (s: OnlineState) => (s.map ? s.map.tiles.length + 1 : modeGoal(s.mode));
export const onlineDice = (s: OnlineState) => (s.map ? s.map.dice : diceCount(s.mode));
/** A custom map always has an end, even in an endless mode. */
export const onlineEndless = (s: OnlineState) => isEndless(s.mode) && !s.map;
const pushLog = (log: string[], line: string) => [...log, line].slice(-8);
const pickIndex = (len: number, rand: () => number) => Math.floor(rand() * len) % Math.max(1, len);
const active = (s: OnlineState) => s.players.map((p, i) => (p.place === null ? i : -1)).filter((i) => i >= 0);

function nextTurn(s: OnlineState): OnlineState {
  const players = s.players.map((p) => ({ ...p }));
  let log = s.log;
  let next = s.turn;
  for (let guard = 0; guard < players.length * 2; guard++) {
    next = (next + 1) % players.length;
    const p = players[next]!;
    if (p.place !== null) continue;
    if (p.frozen) { p.frozen = false; log = pushLog(log, `🧊 ${p.name} ist eingefroren und setzt aus.`); continue; }
    break;
  }
  return { ...s, players, log, turn: next, roll: null, event: null };
}

function finishIfDone(s: OnlineState): OnlineState {
  const left = active(s);
  if (onlineEndless(s) || left.length > 1) return s;
  const placed = s.players.filter((p) => p.place !== null).length;
  const players = s.players.map((p) => (p.place === null ? { ...p, place: placed + 1 } : p));
  return { ...s, players, phase: "over", event: null, roll: null, log: pushLog(s.log, "🏁 Spiel vorbei!") };
}

function eventFor(s: OnlineState, tile: TileType, rand: () => number): OnlineEvent {
  const ci = customIndex(tile);
  if (ci !== null && s.map?.platforms[ci]) return { kind: "custom", platform: ci };
  const remake = platformFor(tile);
  if (remake) return { kind: "remake", platform: REMAKE_PLATFORMS.indexOf(remake), variant: pickIndex(1000, rand) };
  switch (tile) {
    case "task": { const t = locationTasks(s.location); return { kind: "task", text: t[pickIndex(t.length, rand)]! }; }
    case "special": {
      const pool = rand() < 0.5 ? locationSpecials(s.location) : MINIGAMES;
      const g = pool[pickIndex(pool.length, rand)]!;
      return { kind: "special", name: g.name, desc: g.desc };
    }
    case "bad": {
      if (rand() < 0.7) return { kind: "bad", back: BAD_LOSS };
      const q = locationQuickTasks(s.location); return { kind: "quick", text: q[pickIndex(q.length, rand)]! };
    }
    case "death": return { kind: "death", game: pickIndex(DEATH_GAMES.length, rand) };
    case "click": return { kind: "click", game: pickIndex(CLICK_GAMES.length, rand) };
    case "quiz": return { kind: "quiz", question: pickIndex(QUIZ_QUESTIONS.length, rand) };
    case "local": return { kind: "local", steps: locationUnique(s.location).steps };
    case "shop": return { kind: "shop" };
    case "help": return { kind: "help" };
    case "tax": {
      const others = s.players.map((p, i) => ({ p, i })).filter((x) => x.i !== s.turn && x.p.coins > 0).sort((a, b) => b.p.coins - a.p.coins);
      const rich = others[0];
      return { kind: "tax", amount: rich ? Math.min(5, rich.p.coins) : 0, from: rich ? rich.i : null };
    }
    default: return { kind: "empty" };
  }
}

/** Applies one player action. Throws OnlineError for anything not allowed. */
export function applyOnlineAction(s: OnlineState, seat: number, a: OnlineAction, now: number, rand: () => number = Math.random): OnlineState {
  const host = seat === 0;
  const me = s.players[seat] ?? fail("Unbekannter Spieler.");
  if (a.type === "settings") {
    if (!host) fail("Nur der Host kann das ändern.");
    if (s.phase !== "lobby") fail("Das Spiel läuft schon.");
    if (!MODES.some((m) => m.id === a.mode) || !LOCATIONS.some((l) => l.id === a.location)) fail("Ungültige Auswahl.");
    return { ...s, mode: a.mode, location: a.location };
  }
  if (a.type === "map") {
    if (!host) fail("Nur der Host kann die Map wählen.");
    if (s.phase !== "lobby") fail("Das Spiel läuft schon.");
    if (a.map === null || a.map === undefined) return { ...s, map: null };
    return { ...s, map: sanitizeMap(a.map) };
  }
  if (a.type === "start") {
    if (!host) fail("Nur der Host kann starten.");
    if (s.phase !== "lobby") fail("Das Spiel läuft schon.");
    if (s.players.length < 2) fail("Es braucht mindestens 2 Spieler.");
    return { ...s, phase: "playing", turn: 0, roll: null, event: null, log: pushLog(s.log, `🎲 Los geht's! ${s.players.length} Spieler.`) };
  }
  if (a.type === "end") {
    if (!host) fail("Nur der Host kann das Spiel beenden.");
    const ranked = s.players.map((p, i) => ({ p, i })).sort((x, y) => (x.p.place ?? 1e9) - (y.p.place ?? 1e9) || y.p.pos - x.p.pos);
    const players = s.players.map((p) => ({ ...p }));
    ranked.forEach((r, k) => { players[r.i]!.place = k + 1; });
    return { ...s, players, phase: "over", event: null, roll: null, log: pushLog(s.log, "🏁 Der Host hat das Spiel beendet.") };
  }
  if (s.phase !== "playing") fail("Das Spiel läuft gerade nicht.");
  if (a.type === "skip") {
    if (!host) fail("Nur der Host kann Züge überspringen.");
    const skipped = s.players[s.turn]!.name;
    return nextTurn({ ...s, log: pushLog(s.log, `⏭ Zug von ${skipped} übersprungen.`) });
  }
  if (seat !== s.turn) fail("Du bist nicht dran.");
  const goal = onlineGoal(s);

  if (a.type === "roll") {
    if (s.event) fail("Erst das Event beenden.");
    const faces = Array.from({ length: onlineDice(s) }, () => 1 + Math.floor(rand() * 6) % 6);
    const sum = faces.reduce((x, y) => x + y, 0);
    const steps = me.double ? sum * 2 : sum;
    const np = s.map ? Math.max(0, Math.min(goal, me.pos + steps)) : advancePosition(me.pos, steps, s.mode);
    const players = s.players.map((p) => ({ ...p }));
    const p = players[seat]!;
    p.coins += Math.max(0, np - p.pos); p.pos = np; p.double = false;
    let next: OnlineState = { ...s, players, roll: faces, eventId: s.eventId + 1, log: pushLog(s.log, `🎲 ${p.name} würfelt ${faces.join("+")}${steps !== sum ? " ×2" : ""} → Feld ${np}`) };
    if (s.map ? np >= goal : hasFinished(np, s.mode)) {
      p.place = players.filter((x) => x.place !== null).length + 1;
      next = { ...next, event: { kind: "win", place: p.place }, log: pushLog(next.log, `🏆 ${p.name} ist im Ziel – Platz ${p.place}!`) };
    } else {
      next = { ...next, event: eventFor(next, onlineTile(s.mode, p.seed, np, s.map), rand) };
    }
    return next;
  }

  const ev = s.event ?? fail("Kein Event offen.");
  if (a.type === "go") {
    if (ev.kind !== "quick" || ev.deadline !== undefined) throw new OnlineError("Hier gibt es nichts zu starten.");
    return { ...s, event: { ...ev, deadline: now + QUICK_MS } };
  }

  // resolve
  const players = s.players.map((p) => ({ ...p }));
  const p = players[seat]!;
  let log = s.log;
  const penalty = (loss: number, why: string) => {
    if (p.shield) { p.shield = false; log = pushLog(log, `🛡️ Schild schützt ${p.name}!`); return; }
    p.pos = Math.max(0, p.pos - loss); log = pushLog(log, `${why} ${p.name} geht ${loss} zurück.`);
  };
  switch (ev.kind) {
    case "bad": penalty(ev.back, "☠"); break;
    case "quick":
      if (ev.deadline === undefined) throw new OnlineError("Erst LOS drücken.");
      if (now >= ev.deadline) penalty(BAD_LOSS, "⏰ Zeit um!");
      break;
    case "death":
      if (typeof a.result !== "boolean") fail("Erst das Death Penalty spielen.");
      if (!a.result) penalty(DEATH_LOSS, "💀");
      else log = pushLog(log, `💀 ${p.name} hat das Death Penalty überlebt!`);
      break;
    case "remake": {
      if (typeof a.result !== "boolean") fail("Erst das Event spielen.");
      const pl = REMAKE_PLATFORMS[ev.platform];
      if (a.result && pl) {
        if (pl.kind === "coins") p.coins += pl.value;
        else if (pl.kind === "shield") p.shield = true;
        else if (pl.value < 0) penalty(-pl.value, `${pl.emoji}`);
        else p.pos = Math.max(0, Math.min(goal - 1, p.pos + pl.value));
      }
      break;
    }
    case "local": if (ev.steps >= 0) p.pos = Math.min(goal - 1, p.pos + ev.steps); else penalty(-ev.steps, "📍"); break;
    case "custom": {
      const cp = s.map?.platforms[ev.platform];
      if (cp) {
        if (cp.effect === "steps" && cp.value < 0) penalty(-cp.value, `${cp.emoji}`);
        else if (cp.effect === "steps") p.pos = Math.max(0, Math.min(goal - 1, p.pos + cp.value));
        else if (cp.effect === "coins") p.coins = Math.max(0, p.coins + cp.value);
        else if (cp.effect === "shield") p.shield = true;
      }
      break;
    }
    case "help": p.shield = true; log = pushLog(log, `🤝 ${p.name} bekommt ein Schutzschild.`); break;
    case "tax":
      if (ev.from !== null && players[ev.from]) {
        const take = Math.min(ev.amount, players[ev.from]!.coins);
        players[ev.from]!.coins -= take; p.coins += take;
        log = pushLog(log, `💰 ${p.name} kassiert ${take} Münzen von ${players[ev.from]!.name}.`);
      }
      break;
    case "shop":
      if (a.item) {
        const item = SHOP_ITEMS.find((i) => i.id === a.item) ?? fail("Unbekanntes Item.");
        const target = item.target === "self" ? seat : a.target ?? -1;
        if (item.target === "other" && (!players[target] || target === seat || players[target]!.place !== null)) fail("Ungültiges Ziel.");
        const st = { pos: players.map((x) => x.pos), coins: players.map((x) => x.coins), frozen: players.map((x) => x.frozen), shield: players.map((x) => x.shield), double: players.map((x) => x.double) };
        const n = buyItem(st, seat, item.id, target, goal) ?? fail("Nicht genug Münzen.");
        players.forEach((x, i) => { x.pos = n.pos[i]!; x.coins = n.coins[i]!; x.frozen = n.frozen[i]!; x.shield = n.shield[i]!; x.double = n.double[i]!; });
        log = pushLog(log, `🛒 ${p.name}: ${item.emoji} ${item.name}${item.target === "other" ? ` → ${players[target]!.name}` : ""}`);
      }
      break;
    default: break;
  }
  return finishIfDone(nextTurn({ ...s, players, log }));
}
