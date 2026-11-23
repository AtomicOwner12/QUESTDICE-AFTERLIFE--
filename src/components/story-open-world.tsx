import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { StoryHero } from "./story-hero";
import { HouseRoomView } from "./story-house-room";
import { WoodsView } from "./story-woods-view";
import { woodsMove, woodsArrival, SWORD_STONE, WOODS_N } from "@/lib/story-woods";
import secretCottage from "@/assets/story-secret-cottage.png";
import {
  DATABLES, SECRET_DATABLE, DUNGEON_ENTRY, DUNGEON_CHESTS, GATE_ROWS, DUNGEON_EXIT_Y,
  savePoints, canWalkWorld, canWalkSave, nearestPoint, worldSpawn, guideStep, partnerWalking, findHeartRose, unlockedWorld,
  canWalkDungeon, gateIndexAt, gateOpen, startDungeon, dungeonFoesFor, isDungeonExit, roomLevel, roomCleared, hasDungeonItem, dungeonProgress,
  dungeonRoomAt, bushIdAt, inSafeZone, inSwordGlade,
  type Direction, type Point, type WoodsDir,
} from "@/lib/story-world";
import { MASTER_SWORD_ID, WORLDS, DUNGEON_ITEMS, HEART_PIECES_PER_WORLD, PIECES_PER_HEART, piecesTowardHeart, equippedTool, spendBomb, worldOf, chestWeapon, weaponAt, playerStats, guideOf, guideWalking, enemyFoe, bossFoe, withGreed, type Foe, type StorySave } from "@/lib/story";
import {
  startCombat, swing, spinAttack, fireTool, rollGuard, tickCombat, foeAt, swordArc, ringCells, DIRS, SPIN_CHARGE_MS,
  type Arena, type Combat, type CombatEvent, type Drop,
} from "@/lib/story-combat";
import { worldMap, dungeonMap, worldCell, T, type TileMap, type Structure } from "@/lib/story-terrain";
import { COAT_OUTFIT, elfPalette } from "@/lib/pixel-elf";
import { drawChunk, spriteUrl, monsterUrl, monsterKindFor, ART, RES, PALETTES } from "@/lib/story-tiles";
import {
  worldHouses, houseAtDoor, houseRoom, roomWalkable, openHouseChest,
  pieceSpot, pieceAt, takePiece, hasPiece, piecesFound, platePuzzle, plateAt, stepPlate, PLATES, PLATES_SOLVED, PIECE_FIELD, PIECE_PUZZLE,
} from "@/lib/story-houses";
import { npcAt } from "@/lib/story-npcs";
import { nearbyVillager } from "@/lib/story-life";
import { Villagers } from "./story-villagers";
import { beep } from "@/lib/music";
import { songFor } from "@/lib/story-songs";
import { guardsNow, nearbyGuard, guardLine, GUARD_LOOK, GUARD_STEP_MS } from "@/lib/story-guards";
import { CASTLE_NAMES } from "@/lib/story-content";
import { sideQuests, sideQuest, sideStep, acceptSide, pickSideItem, finishSide, sideDoneLine, sideQuestsDone, treasureAt, treasureOpened, openTreasure } from "@/lib/story-quests";

const TILE = 40;
/** One step while a direction is held; the hero and camera glide across a tile in exactly this time. */
export const STEP_MS = 160;
/** Tiles that fit on the shorter screen side; the map zooms in so the world feels close like on a handheld. */
const VISIBLE_TILES = 11;
/** The map is drawn in square chunks of this many tiles; only chunks near the camera are on the page. */
const CHUNK = 16;

type Props = {
  save: StorySave; setSave: (s: StorySave) => void; update: (fn: (s: StorySave) => StorySave) => void; paused: boolean;
  onCity: (city: number) => void; onNpc: (npc: number) => void;
  onFoeDefeated: (foe: Foe, enemy: number, level: number) => void; onFieldFoe: (foe: Foe) => void; onRoomClear: (level: number) => void;
  onHeroDown: (foe: Foe) => void;
  /** A dungeon boss noticed you (the final boss uses this for its big reveal). */
  onBossWake?: (world: number) => void;
  onRomance: (id: string) => void; onHome: () => void; onSecret: () => void;
  /** The village blacksmith (city index) who sharpens your weapons. */
  onSmith: (city: number) => void;
  onResident: (id: number) => void; onGuide: (world: number) => void; onLost: (world: number) => void; onItem: (world: number) => void; onSword: () => void;
  /** The theme that fits where the hero stands (world, dungeon, boss room, house or structure). */
  onSong?: (songId: string) => void;
};
type Fx = { id: number; x: number; y: number; text: string; kind: "hit" | "crit" | "hurt" | "heal" | "info" | "ruby"; until: number };
type Ring = { id: number; x: number; y: number; r: number; until: number };
type Ui = {
  fx: Fx[]; rings: Ring[]; bubbles: Record<number, { text: string; until: number }>; banner: { text: string; line: string; until: number } | null;
  hurtUntil: number; swingUntil: number; spinUntil: number; rollUntil: number; charged: boolean;
};
const NO_UI: Ui = { fx: [], rings: [], bubbles: {}, banner: null, hurtUntil: 0, swingUntil: 0, spinUntil: 0, rollUntil: 0, charged: false };
const WOODS_DIR: Record<Direction, WoodsDir> = { 0: "S", 1: "W", 2: "E", 3: "N" };
const KEY_DIRS: Record<string, Direction> = { arrowdown: 0, s: 0, arrowleft: 1, a: 1, arrowright: 2, d: 2, arrowup: 3, w: 3 };
const ARROW = (dx: number, dy: number) => {
  const a = Math.atan2(dy, dx) * (180 / Math.PI);
  return ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"][((Math.round(a / 45) % 8) + 8) % 8]!;
};

const fallsCache = new Map<number, Structure[]>();
/** The waterfalls of a world (a CSS layer adds flowing water on top of the painted cliff). */
const fallsOf = (world: number) => { let f = fallsCache.get(world); if (!f) { f = worldMap(world).structures.filter((s) => s.kind === "falls"); fallsCache.set(world, f); } return f; };

// ---------- Map chunks: painted once, reused while you walk ----------
const chunkCache = new Map<string, HTMLCanvasElement>();
function chunkCanvas(key: string, map: TileMap, theme: number, dungeon: boolean, cx: number, cy: number) {
  let cv = chunkCache.get(key);
  if (cv) { chunkCache.delete(key); chunkCache.set(key, cv); return cv; }
  cv = document.createElement("canvas");
  cv.width = CHUNK * ART * RES; cv.height = CHUNK * ART * RES;
  cv.className = "map-chunk";
  const ctx = cv.getContext("2d");
  if (ctx) drawChunk(ctx, map, theme, dungeon, cx, cy, CHUNK);
  chunkCache.set(key, cv);
  if (chunkCache.size > 72) { const first = chunkCache.keys().next().value; if (first !== undefined) chunkCache.delete(first); }
  return cv;
}
function MapChunk({ id, map, theme, dungeon, cx, cy }: { id: string; map: TileMap; theme: number; dungeon: boolean; cx: number; cy: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cv = chunkCanvas(`${id}:${cx}:${cy}`, map, theme, dungeon, cx, cy);
    el.appendChild(cv);
    return () => { if (cv.parentNode === el) el.removeChild(cv); };
  }, [id, map, theme, dungeon, cx, cy]);
  return <div ref={ref} className="map-chunk-slot" style={{ left: cx * CHUNK * TILE, top: cy * CHUNK * TILE, width: CHUNK * TILE, height: CHUNK * TILE }} />;
}
/** Paints the rest of the map in small idle slices, nearest chunks first, so walking never waits for drawing. */
function usePrewarm(id: string, map: TileMap, theme: number, dungeon: boolean, x: number, y: number) {
  const at = useRef({ x, y }); at.current = { x, y };
  useEffect(() => {
    const cols = Math.ceil(map.w / CHUNK), rows = Math.ceil(map.h / CHUNK);
    const todo: [number, number][] = [];
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) todo.push([cx, cy]);
    const c0 = at.current;
    todo.sort((a, b) => Math.hypot(a[0] * CHUNK - c0.x, a[1] * CHUNK - c0.y) - Math.hypot(b[0] * CHUNK - c0.x, b[1] * CHUNK - c0.y));
    todo.length = Math.min(todo.length, 40);
    let stop = false;
    const step = () => {
      if (stop) return;
      const next = todo.shift();
      if (!next) return;
      chunkCanvas(`${id}:${next[0]}:${next[1]}`, map, theme, dungeon, next[0], next[1]);
      setTimeout(step, 24);
    };
    const t = setTimeout(step, 300);
    return () => { stop = true; clearTimeout(t); };
  }, [id, map, theme, dungeon]);
}

function MiniMap({ map, theme, dungeon, x, y, marks }: { map: TileMap; theme: number; dungeon: boolean; x: number; y: number; marks: { x: number; y: number; kind: string }[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current, c = cv?.getContext("2d");
    if (!cv || !c) return;
    const p = PALETTES[theme] ?? PALETTES[0]!;
    const col: Record<number, string> = {
      [T.GRASS]: p.ground[0], [T.PATH]: p.path[2], [T.FLOWERS]: p.ground[2], [T.TREE]: p.leaf[1], [T.WATER]: p.water[1], [T.ROCK]: p.rock[1], [T.SAND]: p.sand[0],
      [T.BRIDGE]: p.bridge[2], [T.BUILDING]: p.roofs[0]!, [T.WALL]: p.dwall[0], [T.FLOOR]: p.floor[2], [T.CARPET]: "#c03048", [T.PLAZA]: p.plaza[2], [T.MOUNTAIN]: p.rock[0], [T.HIGH]: p.ground[1], [T.UPPER]: p.ground[2], [T.SUMMIT]: p.rock[3], [T.LADDER]: p.bridge[2], [T.CLIFF]: p.rock[1], [T.HEDGE]: p.leaf[0],
    };
    const img = c.createImageData(map.w, map.h);
    for (let i = 0; i < map.cells.length; i++) {
      const hex = col[map.cells[i]!] ?? "#000000";
      img.data[i * 4] = parseInt(hex.slice(1, 3), 16); img.data[i * 4 + 1] = parseInt(hex.slice(3, 5), 16); img.data[i * 4 + 2] = parseInt(hex.slice(5, 7), 16); img.data[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  }, [map, theme, dungeon]);
  const k = dungeon ? 1.5 : Math.min(0.75, 210 / map.w);
  return <div className="world-minimap" style={{ width: map.w * k, height: map.h * k }} aria-hidden>
    <canvas ref={ref} width={map.w} height={map.h} />
    {marks.map((m, i) => <i key={i} className={`mini-mark is-${m.kind}`} style={{ left: `${((m.x + 0.5) / map.w) * 100}%`, top: `${((m.y + 0.5) / map.h) * 100}%` }} />)}
    <b className="mini-hero" style={{ left: `${((x + 0.5) / map.w) * 100}%`, top: `${((y + 0.5) / map.h) * 100}%` }} />
  </div>;
}

export function StoryOpenWorld(props: Props) {
  const { save, setSave, update, paused, onCity, onNpc, onSmith, onRomance, onHome, onResident, onGuide, onLost, onItem, onSword, onSecret } = props;
  const [direction, setDirection] = useState<Direction>(0);
  const [trail, setTrail] = useState<{ x: number; y: number; dir: Direction; world: number } | null>(null);
  const [walking, setWalking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState({ w: 24, h: 16 });
  const [combat, setCombat] = useState<Combat | null>(null);
  const [ui, setUiState] = useState<Ui>(NO_UI);
  const [cutCount, setCutCount] = useState(0);
  /** Inside a house, cabin or ruin: which one and where you stand in its room (not saved; you leave by the door). */
  const [inside, setInsideState] = useState<{ house: number; x: number; y: number } | null>(null);
  const insideRef = useRef<typeof inside>(null);
  const setInside = (v: typeof inside) => { insideRef.current = v; setInsideState(v); };
  /** Walking through the Lost Woods: which clearing and where you stand (not saved; the fog always lets you out at the edge). */
  const [woods, setWoodsState] = useState<{ stage: number; x: number; y: number } | null>(null);
  const woodsRef = useRef<typeof woods>(null);
  const setWoods = (v: typeof woods) => { woodsRef.current = v; setWoodsState(v); };
  /** Lit floor plates of this world's riddle (bit per plate); they reset when you leave the world. */
  const [plates, setPlatesState] = useState(0);
  const platesRef = useRef(0);
  const plateHint = useRef(false);
  const setPlates = (n: number) => { platesRef.current = n; setPlatesState(n); };
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const saveRef = useRef(save); saveRef.current = save;
  const propsRef = useRef(props); propsRef.current = props;
  const dirRef = useRef<Direction>(0);
  const combatRef = useRef<Combat | null>(null);
  const uiRef = useRef<Ui>(NO_UI);
  const keysHeld = useRef<Direction[]>([]);
  const touchDir = useRef<Direction | null>(null);
  const lastStep = useRef(0);
  const stepAt = useRef(0);
  const cameraEl = useRef<HTMLDivElement>(null);
  const playerEl = useRef<HTMLSpanElement>(null);
  const glide = useRef({ fx: 0, fy: 0, tx: 0, ty: 0, start: 0, key: "", done: false });
  const zoomRef = useRef(1);
  const fxSeq = useRef(0);
  /** Bushes cut in the current world; they grow back when you come back. */
  const cut = useRef(new Set<number>());
  const swordHeld = useRef<number | null>(null);
  const nextRoll = useRef(0);
  const lastBump = useRef(0);
  const lastFoes = useRef<Combat["foes"]>([]);
  const setUi = (fn: (u: Ui) => Ui) => { uiRef.current = fn(uiRef.current); setUiState(uiRef.current); };
  const putCombat = (c: Combat | null) => { combatRef.current = c; setCombat(c); };

  const dungeon = save.dungeon;
  const pos = dungeon ?? save.worldPos;
  const world = dungeon ? worldOf(dungeon.level) : save.world;
  const map = dungeon ? dungeonMap(world) : worldMap(world);
  const points = dungeon ? [] : savePoints(save, world);
  const near = dungeon ? null : nearestPoint(points, pos.x, pos.y);
  const nearNpc = dungeon || near ? null : nearbyVillager(world, pos.x, pos.y, Date.now());
  const guide = !dungeon && guideWalking(save, world) ? guideOf(world) : undefined;
  const mapKey = dungeon ? `d${world}` : `w${world}`;
  zoomRef.current = zoom;
  usePrewarm(mapKey, map, world, !!dungeon, pos.x, pos.y);
  // Music follows the place: inside a building, the boss room while the boss lives, the dungeon or the open world.
  const insideKind = inside ? worldHouses(save.world)[inside.house]?.kind : undefined;
  const bossFight = !!dungeon && dungeonRoomAt(pos.y) === 3 && !!combat?.foes.some((f) => f.boss);
  const songId = songFor(insideKind ? { at: "inside", kind: insideKind } : dungeon ? { at: "dungeon", world, bossFight } : { at: "world", world }).id;
  const onSong = props.onSong;
  useEffect(() => { onSong?.(songId); }, [songId, onSong]);

  const bushBlocks = (w: number, x: number, y: number) => { const id = bushIdAt(w, x, y); return id >= 0 && !cut.current.has(id); };
  /** Where the hero may step right now (gates, bushes and enemies block). */
  const heroCanWalk = (s: StorySave, x: number, y: number) => {
    const d = s.dungeon;
    if (foeAt(combatRef.current, x, y)) return false;
    if (d) return canWalkDungeon(s, worldOf(d.level), x, y);
    return canWalkSave(s, s.world, x, y) && !bushBlocks(s.world, x, y);
  };
  const arenaFor = (s: StorySave): Arena => {
    const d = s.dungeon;
    if (d) { const w = worldOf(d.level), open = (x: number, y: number) => canWalkDungeon(s, w, x, y); return { walk: open, fly: open, zone: (_x, y) => dungeonRoomAt(y) }; }
    const w = s.world;
    return {
      walk: (x, y) => canWalkSave(s, w, x, y) && !bushBlocks(w, x, y) && !inSafeZone(w, x, y),
      fly: (x, y) => { const t = worldCell(w, x, y); return t !== T.TREE && t !== T.ROCK && t !== T.BUILDING && t !== T.CLIFF && t !== T.HEDGE && t !== T.WALL && !bushBlocks(w, x, y); },
      zone: () => 0,
    };
  };

  /** Draws hero and camera at the glide position for `now`, snapped to screen pixels so the pixel art stays crisp. */
  const paint = (now: number) => {
    const g = glide.current, cam = cameraEl.current, hero = playerEl.current;
    if (!cam || !hero) return;
    const t = g.start ? Math.min(1, (now - g.start) / STEP_MS) : 1;
    if (g.done && t >= 1) return;
    g.done = t >= 1;
    const x = g.fx + (g.tx - g.fx) * t, y = g.fy + (g.ty - g.fy) * t;
    const k = zoomRef.current * (window.devicePixelRatio || 1);
    const snap = (v: number) => Math.round(v * k) / k;
    cam.style.transform = `translate3d(${snap(-(x + 0.5) * TILE)}px, ${snap(-(y + 0.5) * TILE)}px, 0)`;
    hero.style.transform = `translate3d(${snap(x * TILE)}px, ${snap(y * TILE)}px, 0)`;
  };
  useLayoutEffect(() => {
    const g = glide.current, now = performance.now();
    if (g.key === mapKey && g.tx === pos.x && g.ty === pos.y) { g.done = false; paint(now); return; }
    const start = now - stepAt.current < 60 ? stepAt.current : now;
    const t = g.start ? Math.min(1, (start - g.start) / STEP_MS) : 1;
    const cx = g.fx + (g.tx - g.fx) * t, cy = g.fy + (g.ty - g.fy) * t;
    const jump = g.key !== mapKey || Math.abs(pos.x - cx) + Math.abs(pos.y - cy) > 1.5;
    glide.current = jump ? { fx: pos.x, fy: pos.y, tx: pos.x, ty: pos.y, start: 0, key: mapKey, done: false }
      : { fx: cx, fy: cy, tx: pos.x, ty: pos.y, start, key: mapKey, done: false };
    paint(now);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.x, pos.y, mapKey, zoom]);

  // A save from another world (or an older map) may stand somewhere blocked: put the hero back at the start.
  useEffect(() => {
    if (!dungeon && !canWalkWorld(world, save.worldPos.x, save.worldPos.y)) setSave({ ...save, worldPos: worldSpawn(world) });
  }, [dungeon, world, save, setSave]);

  // Fresh enemies whenever a world or dungeon is entered; cleared dungeon rooms stay empty, bushes grow back.
  useEffect(() => {
    const s = saveRef.current, now = performance.now(), d = s.dungeon;
    cut.current = new Set(); setCutCount(0);
    setInside(null); setWoods(null); setPlates(0); plateHint.current = false;
    if (d) {
      const w = worldOf(d.level);
      putCombat(startCombat(dungeonFoesFor(s, w).filter((f) => !d.defeated.includes(f.index)).map((f) => ({ index: f.index, foe: f.boss ? bossFoe(w) : enemyFoe(w, f.slot), boss: f.boss, x: f.x, y: f.y, room: f.room, slot: f.slot })), now));
    } else {
      const w = s.world;
      putCombat(startCombat(worldMap(w).foes.map((f, i) => ({ index: i, foe: enemyFoe(w, f.slot), boss: false, x: f.x, y: f.y, room: -1, slot: f.slot, field: true })), now));
    }
    uiRef.current = NO_UI; setUiState(NO_UI);
  }, [mapKey]);

  // Zoom so about eleven tiles fill the shorter side of the screen.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const z = Math.max(1, Math.min(2.4, Math.min(r.width, r.height) / (VISIBLE_TILES * TILE)));
      setZoom(z); setView({ w: Math.ceil(r.width / (z * TILE)), h: Math.ceil(r.height / (z * TILE)) });
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const animate = () => {
    setWalking(true);
    if (walkTimer.current) clearTimeout(walkTimer.current);
    walkTimer.current = setTimeout(() => setWalking(false), STEP_MS + 120);
  };
  const addFx = (x: number, y: number, text: string, kind: Fx["kind"], now: number) =>
    setUi((u) => ({ ...u, fx: [...u.fx.slice(-14), { id: ++fxSeq.current, x, y, text, kind, until: now + 750 }] }));
  const addRing = (x: number, y: number, r: number, now: number) => setUi((u) => ({ ...u, rings: [...u.rings.slice(-4), { id: ++fxSeq.current, x, y, r, until: now + 420 }] }));

  const bumpGate = (s: StorySave, x: number, y: number) => {
    const d = s.dungeon, now = performance.now();
    if (!d || now - lastBump.current < 1500) return;
    const g = gateIndexAt(x, y);
    if (g < 0) return;
    const w = worldOf(d.level);
    if (gateOpen(s, w, g)) return;
    lastBump.current = now;
    const it = DUNGEON_ITEMS[w];
    if (!roomCleared(s, w, g)) toast("🔒 Das Tor ist versiegelt. Besiege zuerst alle Gegner in diesem Raum!");
    else if (it) toast(`🔒 Das Boss-Tor öffnet sich nur mit dem ${it.emoji} ${it.name} aus der Schatzkammer (Osten)!`);
  };

  /** Tells you how many heart pieces you have toward the next heart container (the container itself is celebrated by the story screen). */
  const pieceToast = (next: StorySave, w: number, where: string) => {
    const toward = piecesTowardHeart(next);
    beep(108);
    if (toward > 0) toast.success(`💗 Herzteil gefunden! (${toward}/${PIECES_PER_HEART} zum nächsten Herzcontainer)`, { description: `${where} · ${WORLDS[w]!.name}: ${piecesFound(next, w)}/${HEART_PIECES_PER_WORLD} Teile` });
  };
  const openChest = (s: StorySave, house: number, k: number) => {
    const r = openHouseChest(s, s.world, house, k);
    if (!r.ok) { toast(r.error); return; }
    beep(100);
    setSave(r.save);
    if (r.save.hearts.length > s.hearts.length) pieceToast(r.save, s.world, "In der Truhe lag ein schimmerndes Stück Herz.");
    else toast.success(`🎁 Truhe: ${r.reward}`);
  };
  /** A treasure chest standing in the open world: walk into it (or face it and press HANDELN) to open it once. */
  const openFieldChest = (s: StorySave, index: number) => {
    const r = openTreasure(s, s.world, index);
    if (!r.ok) { toast(r.error); return; }
    beep(104);
    setSave(r.save);
    toast.success(`🎁 Schatztruhe: ${r.reward}`);
  };
  /** Hermits: ask → search (their lost thing lies near a landmark) → return → done. */
  const talkHermit = (s: StorySave, index: number) => {
    const w = s.world, q = sideQuest(w, index);
    if (!q) return;
    const step = sideStep(s, w, index);
    beep(84);
    if (step === "ask") { setSave(acceptSide(s, w, index)); toast(`🧙 ${q.name}: „${q.ask}“`, { description: "📜 Neue Nebenquest! Das ? auf der Minikarte zeigt dir, wo du suchen musst.", duration: 9000 }); return; }
    if (step === "search") { toast(`🧙 ${q.name}: „Hast du es schon gefunden?“`, { description: q.hint, duration: 6000 }); return; }
    if (step === "return") {
      const r = finishSide(s, w, index);
      if (!r.ok) { toast(r.error); return; }
      setSave(r.save); beep(108);
      toast.success(`🧙 ${q.name}: „${q.thanks}“`, { description: `📜 Nebenquest geschafft! Belohnung: ${r.reward}`, duration: 7000 });
      return;
    }
    toast(`🧙 ${q.name}: „${sideDoneLine(w, index)}“`);
  };
  /** Walking inside a room: walls and furniture block, chests open when bumped, the door leads back out. */
  const moveInside = (dir: Direction) => {
    const s = saveRef.current, me = insideRef.current;
    if (!me) return;
    const [dx, dy] = DIRS[dir], room = houseRoom(s.world, me.house);
    const x = me.x + dx, y = me.y + dy, t = room.rows[y]?.[x];
    if (t === "D") { setInside(null); toast("Du trittst wieder ins Freie."); return; }
    const chest = room.chests.find((c) => c.x === x && c.y === y);
    if (chest) { openChest(s, me.house, chest.k); return; }
    if (t === "G") { const now = performance.now(); if (now - lastBump.current > 1200) { lastBump.current = now; toast(`🛡️ Wache: „${guardLine(s.world, x + y)}“`); } return; }
    if (!roomWalkable(room, x, y)) return;
    setInside({ ...me, x, y });
    animate();
  };
  /** Lost Woods: walk out of a clearing on any side; only the right turns lead deeper, the rest quietly lead back to the start. */
  const enterWoods = () => { beep(70); setDirection(3); dirRef.current = 3; setWoods({ stage: 0, ...woodsArrival("N") }); };
  const moveWoods = (dir: Direction) => {
    const me = woodsRef.current;
    if (!me) return;
    const r = woodsMove(me.stage, me.x, me.y, WOODS_DIR[dir]);
    if (r.kind === "walk") { setWoods({ ...me, x: r.x, y: r.y }); animate(); }
    else if (r.kind === "leave") { setWoods(null); setDirection(0); dirRef.current = 0; }
    else if (r.kind === "clearing") { beep(r.lost ? 50 : 70); setWoods({ stage: r.stage, x: r.x, y: r.y }); if (r.lost) { setDirection(3); dirRef.current = 3; } }
    else if (r.kind === "sword") onSword();
  };
  const enterHouse = (index: number) => {
    const h = worldHouses(saveRef.current.world)[index];
    if (!h) return;
    beep(80);
    const room = houseRoom(h.world, index);
    setInside({ house: index, x: room.door.x, y: room.door.y - 1 });
    toast(`${h.emoji} ${h.name} betreten`, { description: h.kind === "house" ? "Schau dich ruhig um – vielleicht steht hier eine Truhe." : "Hier war lange niemand mehr … durchsuch die Truhen!" });
  };

  const move = useCallback((dir: Direction) => {
    if (paused) return;
    const s = saveRef.current;
    const [dx, dy] = DIRS[dir];
    setDirection(dir); dirRef.current = dir;
    if (woodsRef.current) { moveWoods(dir); return; }
    if (insideRef.current) { moveInside(dir); return; }
    const d = s.dungeon;
    const here = d ?? s.worldPos;
    const x = here.x + dx, y = here.y + dy;
    if (!d && dir === 3) { const h = houseAtDoor(s.world, x, y); if (h) { enterHouse(h.index); return; } }
    // Walking up into the misty archway leads straight into the Lost Woods.
    if (!d && dir === 3 && savePoints(s, s.world).some((p) => p.kind === "woods" && p.x === x && p.y === y)) { enterWoods(); return; }
    if (!d) { const t = treasureAt(s.world, x, y); if (t >= 0) { if (!treasureOpened(s, s.world, t)) openFieldChest(s, t); return; } }
    if (!heroCanWalk(s, x, y)) { bumpGate(s, x, y); return; }
    if (d) {
      const w = worldOf(d.level);
      if (isDungeonExit(y)) { update((cur) => ({ ...cur, dungeon: null })); toast("Du verlässt den Dungeon. Geschaffte Räume bleiben offen."); return; }
      let loot = d.loot, rubies = 0, weapon: number | null = null, item = false;
      const chest = DUNGEON_CHESTS.find((c) => c.x === x && c.y === y && !loot.includes(c.index));
      if (chest) {
        if (chest.kind === "item") { if (!hasDungeonItem(s, w)) { item = true; loot = [...loot, chest.index]; } }
        else {
          loot = [...loot, chest.index];
          const id = chestWeapon(w, ((w * 37 + 19) % 200) / 200);
          if (chest.kind === "rubies" || s.weapons.includes(id)) { rubies = 25 * (w + 1); toast(`🎁 Truhe: +${rubies} Rubine`); }
          else { weapon = id; toast.success(`🎁 ${weaponAt(id).name} gefunden!`); }
        }
      }
      update((cur) => cur.dungeon ? { ...cur, rubies: cur.rubies + rubies, weapons: weapon !== null && !cur.weapons.includes(weapon) ? [...cur.weapons, weapon] : cur.weapons, dungeon: { ...cur.dungeon, x, y, loot } } : cur);
      animate();
      if (item) onItem(w);
      return;
    }
    setTrail({ x: here.x, y: here.y, dir, world: s.world });
    let next: StorySave = { ...s, worldPos: { x, y } };
    if (pieceAt(s, s.world, x, y)) { next = takePiece(next, s.world, PIECE_FIELD); pieceToast(next, s.world, "Gut versteckt zwischen Bäumen und Felsen …"); }
    const plate = plateAt(s.world, x, y);
    if (plate >= 0 && !hasPiece(s, s.world, PIECE_PUZZLE)) {
      const lit = stepPlate(platesRef.current, plate);
      setPlates(lit);
      beep(lit & (1 << plate) ? 96 : 70);
      if (!plateHint.current) { plateHint.current = true; toast("🔶 Alte Steinplatten!", { description: `Jeder Schritt dreht die Platte und ihre Nachbarn um. Bring alle ${PLATES} zum Leuchten.` }); }
      if (lit === PLATES_SOLVED) { next = takePiece(next, s.world, PIECE_PUZZLE); pieceToast(next, s.world, "Rätsel gelöst! Ein Herzteil erscheint auf der Platte."); }
    }
    const got = next.hearts;
    update((cur) => (cur.dungeon ? cur : { ...cur, worldPos: { x, y }, hearts: got.length > cur.hearts.length ? got : cur.hearts }));
    animate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, update, onItem, onSword]);
  const moveRef = useRef(move); moveRef.current = move;

  const handleEvents = useCallback((events: CombatEvent[], now: number) => {
    const s = saveRef.current, d = s.dungeon, c = combatRef.current;
    const here = d ?? s.worldPos, w = d ? worldOf(d.level) : s.world;
    const st = playerStats(s);
    let hp = s.hp, rubies = 0;
    const cleared = new Set<number>();
    for (const e of events) {
      switch (e.type) {
        case "hit": beep(e.crit ? 96 : 88); addFx(e.x, e.y, e.crit ? `KRIT! ${e.damage}` : `${e.damage}`, e.crit ? "crit" : "hit", now); break;
        case "block": addFx(e.x, e.y, "✦", "info", now); break;
        case "boom": beep(40); addRing(e.x, e.y, e.r, now); break;
        case "wake": {
          setUi((u) => ({ ...u, bubbles: { ...u.bubbles, [e.foe]: { text: e.line, until: now + 2600 } } }));
          if (d && c?.foes.find((x) => x.index === e.foe)?.boss) propsRef.current.onBossWake?.(w);
          break;
        }
        case "stage": beep(72); setUi((u) => ({ ...u, banner: { text: `⚠ ${e.title.toUpperCase()}`, line: e.line, until: now + 2800 } })); break;
        case "defeated": {
          const f = c?.foes.find((x) => x.index === e.foe) ?? lastFoes.current.find((x) => x.index === e.foe);
          addFx(e.x, e.y, "💥", "info", now);
          if (!f) break;
          if (e.field) { propsRef.current.onFieldFoe(f.foe); break; }
          propsRef.current.onFoeDefeated(f.foe, f.index, roomLevel(w, e.room));
          if (!e.boss && !cleared.has(e.room) && c && !c.foes.some((x) => x.room === e.room)) { cleared.add(e.room); propsRef.current.onRoomClear(roomLevel(w, e.room)); }
          break;
        }
        case "pickup": {
          if (e.kind === "ruby") { const n = withGreed(e.value, st); rubies += n; beep(100); addFx(e.x, e.y, `+${n} 💎`, "ruby", now); }
          else { const n = Math.max(4, Math.round(st.maxHp * 0.15)); hp = Math.min(st.maxHp, hp + n); beep(84); addFx(e.x, e.y, `+${n} ❤`, "heal", now); }
          break;
        }
        case "heal": if (hp < st.maxHp) { hp = Math.min(st.maxHp, hp + e.amount); addFx(here.x, here.y, `+${e.amount}`, "heal", now); } break;
        case "hurt": {
          if (e.dodged) { addFx(here.x, here.y, "AUSGEWICHEN", "info", now); break; }
          hp -= e.damage;
          beep(52);
          addFx(here.x, here.y, `-${e.damage}`, "hurt", now);
          setUi((u) => ({ ...u, hurtUntil: now + 900 }));
          if (hp <= 0) { const foe = (c?.foes.find((f) => f.boss) ?? c?.foes.find((f) => f.awake) ?? c?.foes[0] ?? lastFoes.current[0])?.foe; if (foe) propsRef.current.onHeroDown(foe); return; }
          const [px, py] = e.push, nx = here.x + px, ny = here.y + py;
          const push = (px || py) && heroCanWalk(s, nx, ny);
          const left = hp;
          update((cur) => {
            if (cur.dungeon) return { ...cur, hp: left, dungeon: push ? { ...cur.dungeon, x: nx, y: ny } : cur.dungeon };
            return { ...cur, hp: left, worldPos: push ? { x: nx, y: ny } : cur.worldPos };
          });
          hp = left;
          break;
        }
      }
    }
    const hurtNow = events.some((e) => e.type === "hurt" && !e.dodged);
    if ((hp !== s.hp && !hurtNow) || rubies) { const left = hp, got = rubies; update((cur) => ({ ...cur, hp: hurtNow ? cur.hp : left, rubies: cur.rubies + got })); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update]);

  /** Bushes on these cells are cut; sometimes a ruby or a heart hides underneath. */
  const cutBushes = (cells: readonly (readonly [number, number])[], now: number) => {
    const s = saveRef.current;
    if (s.dungeon) return;
    let c = combatRef.current, any = false;
    for (const [x, y] of cells) {
      const id = bushIdAt(s.world, x, y);
      if (id < 0 || cut.current.has(id)) continue;
      cut.current.add(id); any = true;
      addFx(x, y, "🍃", "info", now);
      const roll = Math.random();
      if (c && roll < 0.42) {
        const drop: Drop = { id: c.seq + 1, x, y, kind: roll < 0.3 ? "ruby" : "heart", value: 1 + s.world, until: now + 14000 };
        c = { ...c, seq: c.seq + 1, drops: [...c.drops, drop] };
      }
    }
    if (any) { setCutCount((n) => n + 1); if (c && c !== combatRef.current) putCombat(c); }
  };

  const attack = useCallback(() => {
    if (paused) return;
    const now = performance.now();
    if (now < uiRef.current.swingUntil - 110) return;
    if (insideRef.current || woodsRef.current) { beep(90); return; }
    const s = saveRef.current, c = combatRef.current, here = s.dungeon ?? s.worldPos;
    const hero = { x: here.x, y: here.y, dir: dirRef.current };
    setUi((u) => ({ ...u, swingUntil: now + 250 }));
    cutBushes(swordArc(hero), now);
    const cc = combatRef.current;
    if (!cc) { beep(90); return; }
    const r = swing(cc, hero, playerStats(s), arenaFor(s), now, Math.random);
    if (r.combat === cc) return;
    if (!r.events.some((e) => e.type === "hit")) beep(90);
    lastFoes.current = (c ?? cc).foes;
    putCombat(r.combat);
    handleEvents(r.events, now);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, handleEvents]);

  const spin = () => {
    if (insideRef.current || woodsRef.current) return;
    const now = performance.now(), s = saveRef.current, here = s.dungeon ?? s.worldPos, c = combatRef.current;
    const hero = { x: here.x, y: here.y, dir: dirRef.current };
    beep(110);
    setUi((u) => ({ ...u, spinUntil: now + 380, charged: false }));
    cutBushes(ringCells(hero), now);
    const cc = combatRef.current;
    if (!cc) return;
    const r = spinAttack(cc, hero, playerStats(s), arenaFor(s), now, Math.random);
    lastFoes.current = (c ?? cc).foes;
    putCombat(r.combat);
    handleEvents(r.events, now);
  };
  const pressSword = () => { if (paused) return; attack(); swordHeld.current = performance.now(); };
  const releaseSword = () => {
    const held = swordHeld.current;
    swordHeld.current = null;
    if (held !== null && !paused && performance.now() - held >= SPIN_CHARGE_MS) spin();
    else if (uiRef.current.charged) setUi((u) => ({ ...u, charged: false }));
  };

  const tool = () => {
    if (paused) return;
    if (insideRef.current || woodsRef.current) { toast(woodsRef.current ? "Im Nebel helfen dir keine Items." : "Drinnen brauchst du keine Items."); return; }
    const s = saveRef.current, it = equippedTool(s);
    if (!it) {
      toast(s.tool === "bombs" ? "💣 Keine Bomben mehr. Neue gibt es in jedem Dorfladen!" : "🧰 Dein Item-Slot ist leer. Rüste unter 🎒 AUSRÜSTUNG ein Dungeon-Item oder Bomben aus.");
      return;
    }
    const c = combatRef.current;
    if (!c) return;
    const now = performance.now(), here = s.dungeon ?? s.worldPos;
    const hero = { x: here.x, y: here.y, dir: dirRef.current };
    const arena = arenaFor(s);
    const r = fireTool(c, hero, playerStats(s), it, it.tool === "dash" ? { ...arena, fly: (x, y) => heroCanWalk(s, x, y) } : arena, now, Math.random);
    if (r.combat === c) return;
    beep(it.tool === "bomb" ? 60 : 94);
    if (s.tool === "bombs") update(spendBomb);
    lastFoes.current = c.foes;
    putCombat(r.combat);
    handleEvents(r.events, now);
    if (it.tool === "nova") cutBushes(ringCells(hero, it.range), now);
    r.heroTo?.forEach((p, i) => setTimeout(() => flushSync(() => {
      update((cur) => (cur.dungeon ? { ...cur, dungeon: { ...cur.dungeon, x: p.x, y: p.y } } : { ...cur, worldPos: { x: p.x, y: p.y } }));
      animate();
    }), i * 55));
  };
  const roll = () => {
    if (paused) return;
    const now = performance.now();
    if (now < nextRoll.current) return;
    nextRoll.current = now + 650;
    if (insideRef.current || woodsRef.current) { flushSync(() => moveRef.current(dirRef.current)); return; }
    const c = combatRef.current;
    if (c) putCombat(rollGuard(c, now));
    setUi((u) => ({ ...u, rollUntil: now + 320 }));
    const dir = dirRef.current;
    flushSync(() => moveRef.current(dir));
    setTimeout(() => flushSync(() => moveRef.current(dir)), 85);
  };
  const toolRef = useRef(tool); toolRef.current = tool;
  const rollRef = useRef(roll); rollRef.current = roll;
  const swordRef = useRef({ press: pressSword, release: releaseSword }); swordRef.current = { press: pressSword, release: releaseSword };

  const interact = useCallback(() => {
    if (paused) return;
    const s = saveRef.current;
    const d = s.dungeon;
    const p0 = d ?? s.worldPos;
    const wd = woodsRef.current;
    if (wd) {
      const [dx, dy] = DIRS[dirRef.current];
      if (SWORD_STONE.some((st) => st.x === wd.x + dx && st.y === wd.y + dy) && inSwordGlade(wd.stage)) onSword();
      return;
    }
    const me = insideRef.current;
    if (me) {
      const [dx, dy] = DIRS[dirRef.current], room = houseRoom(s.world, me.house);
      const chest = room.chests.find((c) => c.x === me.x + dx && c.y === me.y + dy);
      if (chest) openChest(s, me.house, chest.k);
      else if (room.rows[me.y + dy]?.[me.x + dx] === "G") toast(`🛡️ Wache: „${guardLine(s.world, me.x + me.y)}“`);
      else if (me.y >= room.door.y - 1 && me.x === room.door.x) { setInside(null); toast("Du trittst wieder ins Freie."); }
      else toast("Lauf gegen eine Truhe, um sie zu öffnen. Die Tür ist unten in der Mitte.");
      return;
    }
    if (!d) { const h = houseAtDoor(s.world, p0.x, p0.y - 1); if (h) { setDirection(3); dirRef.current = 3; enterHouse(h.index); return; } }
    if (d) {
      if (p0.y >= DUNGEON_EXIT_Y - 2) { update((cur) => ({ ...cur, dungeon: null })); toast("Du kehrst in die offene Welt zurück."); return; }
      attack(); return;
    }
    const w = s.world;
    { const [dx, dy] = DIRS[dirRef.current], t = treasureAt(w, p0.x + dx, p0.y + dy); if (t >= 0 && !treasureOpened(s, w, t)) { openFieldChest(s, t); return; } }
    const p: Point | null = nearestPoint(savePoints(s, w), p0.x, p0.y);
    if (!p) {
      const resident = nearbyVillager(w, p0.x, p0.y, Date.now());
      if (resident) { onResident(resident.id); return; }
      const g = nearbyGuard(w, p0.x, p0.y, Date.now());
      if (g) { toast(`🛡️ Wache von ${CASTLE_NAMES[w]}: „${guardLine(w, g.i)}“`); return; }
      if (guideWalking(s, w)) { onGuide(w); return; }
      toast("Nichts in Reichweite. Geh näher an eine Tür, eine Person oder den Dungeon."); return;
    }
    switch (p.kind) {
      case "dungeon": {
        if (!unlockedWorld(s, p.ref)) { toast.error("🔒 Dieser Dungeon ist noch versiegelt."); return; }
        const done = dungeonProgress(s, p.ref);
        update((cur) => ({ ...cur, dungeon: startDungeon(p.ref), hp: playerStats(cur).maxHp }));
        toast(`🏛️ ${p.name} betreten – ${done >= 4 ? "schon gerettet!" : `Raum ${done + 1} von 4`}`, { description: "Besiege alle Gegner eines Raums, dann öffnet sich das Tor nach Norden." });
        return;
      }
      case "city": onCity(p.ref); return;
      case "smith": onSmith(p.ref); return;
      case "npc": onNpc(p.ref); return;
      case "romance":
        if (s.heartRose) onRomance(p.id.replace("romance-", ""));
        else toast(`🧝 ${p.name.split(" ")[0]} lächelt dich freundlich an. Mehr verrät sie dir noch nicht …`);
        return;
      case "home": onHome(); return;
      case "secret": onSecret(); return;
      case "woods": enterWoods(); return;
      case "guide": onGuide(p.ref); return;
      case "lost": onLost(p.ref); return;
      case "hermit": talkHermit(s, p.ref); return;
      case "hermititem": {
        const r = pickSideItem(s, w, p.ref), q = sideQuest(w, p.ref);
        if (!r.ok || !q) { toast(r.ok ? "Hier gibt es nichts zu finden." : r.error); return; }
        setSave(r.save); beep(100);
        toast.success(`${q.item.emoji} ${q.item.name} gefunden!`, { description: `Bring es zurück zu ${q.name} bei der Einsiedlerhütte.` });
        return;
      }
      case "rose":
        if (!s.heartRose) { setSave(findHeartRose(s)); toast.success("🌹 HERZROSE GEFUNDEN! Ein geheimer Teil der Welt ist erwacht …"); }
        else toast("🌹 Die Herzrose leuchtet im Takt deines Herzens.");
        return;
    }
  }, [paused, update, setSave, attack, onCity, onNpc, onSmith, onRomance, onHome, onResident, onGuide, onLost, onSword, onSecret]);

  /** Starts walking in a direction (first step right away), or stops when `null`. */
  const heldDir = () => touchDir.current ?? keysHeld.current.at(-1) ?? null;
  const stepNow = (now = performance.now()) => {
    const d = heldDir();
    if (d === null || now - lastStep.current < STEP_MS) return;
    lastStep.current = now - lastStep.current < STEP_MS * 2 ? lastStep.current + STEP_MS : now;
    stepAt.current = lastStep.current;
    flushSync(() => moveRef.current(d));
  };
  useEffect(() => {
    let id = 0;
    const frame = (now: number) => { stepNow(now); paint(now); id = requestAnimationFrame(frame); };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setTouchDir = (d: Direction | null) => {
    if (touchDir.current === d) return;
    touchDir.current = d;
    if (d !== null) { setDirection(d); dirRef.current = d; stepNow(); }
  };

  // One clock for the enemies, shots, bombs, pickups and the spin-attack charge.
  useEffect(() => {
    if (paused) { keysHeld.current = []; touchDir.current = null; swordHeld.current = null; return; }
    const id = setInterval(() => {
      const now = performance.now();
      const s = saveRef.current, here = s.dungeon ?? s.worldPos, c = combatRef.current;
      if (c && !insideRef.current && !woodsRef.current) {
        const r = tickCombat(c, { x: here.x, y: here.y, dir: dirRef.current }, playerStats(s), arenaFor(s), now, Math.random);
        if (r.combat !== c) { lastFoes.current = c.foes; putCombat(r.combat); }
        if (r.events.length) handleEvents(r.events, now);
      }
      const charged = swordHeld.current !== null && now - swordHeld.current >= SPIN_CHARGE_MS;
      const u = uiRef.current;
      if (charged !== u.charged) setUi((x) => ({ ...x, charged }));
      const expired = u.fx.some((f) => f.until <= now) || u.rings.some((f) => f.until <= now) || Object.values(u.bubbles).some((b) => b.until <= now) || (u.banner && u.banner.until <= now)
        || (u.hurtUntil && u.hurtUntil <= now) || (u.swingUntil && u.swingUntil <= now) || (u.spinUntil && u.spinUntil <= now) || (u.rollUntil && u.rollUntil <= now);
      if (expired) setUi((x) => ({
        ...x,
        fx: x.fx.filter((f) => f.until > now), rings: x.rings.filter((f) => f.until > now),
        bubbles: Object.fromEntries(Object.entries(x.bubbles).filter(([, b]) => b.until > now)),
        banner: x.banner && x.banner.until > now ? x.banner : null,
        hurtUntil: x.hurtUntil > now ? x.hurtUntil : 0, swingUntil: x.swingUntil > now ? x.swingUntil : 0,
        spinUntil: x.spinUntil > now ? x.spinUntil : 0, rollUntil: x.rollUntil > now ? x.rollUntil : 0,
      }));
    }, 30);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, handleEvents]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (paused || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)) return;
      const k = e.key.toLowerCase();
      const dir = KEY_DIRS[k];
      if (dir !== undefined) {
        e.preventDefault();
        if (!keysHeld.current.includes(dir)) { keysHeld.current = [...keysHeld.current, dir]; setDirection(dir); dirRef.current = dir; stepNow(); }
        return;
      }
      if (e.repeat) return;
      if (k === " " || k === "j" || k === "k") { e.preventDefault(); swordRef.current.press(); }
      if (k === "q" || k === "l") { e.preventDefault(); toolRef.current(); }
      if (k === "shift" || k === "r") { e.preventDefault(); rollRef.current(); }
      if (k === "e" || k === "enter") { e.preventDefault(); interact(); }
      if (k === "escape" && woodsRef.current) setWoods(null);
      else if (k === "escape" && insideRef.current) setInside(null);
      else if (k === "escape" && saveRef.current.dungeon) update((cur) => ({ ...cur, dungeon: null }));
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const dir = KEY_DIRS[k];
      if (dir !== undefined) keysHeld.current = keysHeld.current.filter((x) => x !== dir);
      if (k === " " || k === "j" || k === "k") swordRef.current.release();
    };
    const clear = () => { keysHeld.current = []; touchDir.current = null; swordHeld.current = null; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attack, interact, paused, update]);
  useEffect(() => () => { if (walkTimer.current) clearTimeout(walkTimer.current); }, []);

  // ---------- What is on screen ----------
  const halfW = Math.ceil(view.w / 2) + 3, halfH = Math.ceil(view.h / 2) + 3;
  const inView = (x: number, y: number) => Math.abs(x - pos.x) <= halfW && Math.abs(y - pos.y) <= halfH;
  const cols = Math.ceil(map.w / CHUNK), rows = Math.ceil(map.h / CHUNK);
  const chunks: [number, number][] = [];
  for (let cy = Math.max(0, Math.floor((pos.y - halfH - 4) / CHUNK)); cy <= Math.min(rows - 1, Math.floor((pos.y + halfH + 4) / CHUNK)); cy++)
    for (let cx = Math.max(0, Math.floor((pos.x - halfW - 4) / CHUNK)); cx <= Math.min(cols - 1, Math.floor((pos.x + halfW + 4) / CHUNK)); cx++) chunks.push([cx, cy]);
  const wm = dungeon ? null : worldMap(world);
  const plateSpot = dungeon ? null : platePuzzle(world);
  const puzzleDone = !dungeon && hasPiece(save, world, PIECE_PUZZLE);
  const fieldPiece = !dungeon && pieceAt(save, world, pieceSpot(world).x, pieceSpot(world).y) && inView(pieceSpot(world).x, pieceSpot(world).y) ? pieceSpot(world) : null;
  const houseHere = inside ? worldHouses(world)[inside.house] : undefined;
  const doorAbove = !dungeon && !inside && !woods ? houseAtDoor(world, pos.x, pos.y - 1) : undefined;
  void cutCount;
  const bushes = wm ? wm.bushes.map(([x, y], id) => ({ id, x, y })).filter((b) => !cut.current.has(b.id) && inView(b.x, b.y)) : [];
  const bushUrl = wm ? spriteUrl("bush", world) : "";
  const falls = wm ? fallsOf(world).filter((f) => inView(f.x + 1, f.y)) : [];
  const heroPal = elfPalette(save.heroLook);
  // The long black coat look swings a very long, thin katana.
  const masamune = save.heroLook.outfit === COAT_OUTFIT ? "is-masamune" : "";
  const chests = wm ? wm.treasures.map(([x, y], id) => ({ id, x, y, open: treasureOpened(save, world, id) })).filter((t) => inView(t.x, t.y)) : [];
  const facing = DIRS[direction];
  const chestAhead = !dungeon && !inside && !woods && chests.some((t) => !t.open && t.x === pos.x + facing[0] && t.y === pos.y + facing[1]);
  const besideHero = ([[0, 1], [-1, 0], [1, 0], [0, -1]] as const).map(([dx, dy]) => ({ x: pos.x + dx, y: pos.y + dy, dir: 0 as Direction })).find((c) => canWalkSave(save, world, c.x, c.y)) ?? { x: pos.x, y: pos.y + 1, dir: 0 as Direction };
  const follow = trail && trail.world === world && Math.abs(trail.x - pos.x) + Math.abs(trail.y - pos.y) === 1 ? trail : besideHero;
  const partner = !dungeon && partnerWalking(save);
  const partnerSpot = !guide ? follow : ([[0, 1], [-1, 0], [1, 0], [0, -1]] as const).map(([dx, dy]) => ({ x: pos.x + dx, y: pos.y + dy, dir: follow.dir }))
    .find((c) => (c.x !== follow.x || c.y !== follow.y) && canWalkSave(save, world, c.x, c.y)) ?? follow;
  const at = (x: number, y: number) => ({ left: x * TILE, top: y * TILE });
  const foes = (combat?.foes ?? []).filter((f) => !f.field || inView(f.x, f.y));
  const boss = foes.find((f) => f.boss && f.awake);
  const swinging = ui.swingUntil > 0;
  const [sx, sy] = swordArc({ x: pos.x, y: pos.y, dir: direction })[0]!;
  const room = dungeon ? dungeonRoomAt(dungeon.y) : 0;
  const roomFoes = dungeon ? (combat?.foes ?? []).filter((f) => f.room === room).length : 0;
  const item = dungeon ? DUNGEON_ITEMS[world] : undefined;
  const toolItem = equippedTool(save);
  const dungeonPoint = points.find((p) => p.kind === "dungeon");
  const toDungeon = dungeonPoint ? { d: Math.abs(dungeonPoint.x - pos.x) + Math.abs(dungeonPoint.y - pos.y), arrow: ARROW(dungeonPoint.x - pos.x, dungeonPoint.y - pos.y) } : null;
  const marks = dungeon ? DUNGEON_CHESTS.filter((c) => c.kind === "item" && !hasDungeonItem(save, world)).map((c) => ({ x: c.x, y: c.y, kind: "item" }))
    : [...points.filter((p) => p.kind === "dungeon" || p.kind === "city" || p.kind === "hermititem" || (p.kind === "hermit" && sideStep(save, world, p.ref) !== "done")).map((p) => ({ x: p.x, y: p.y, kind: p.kind === "hermit" && sideStep(save, world, p.ref) === "return" ? "hermitback" : p.kind })), { x: worldMap(world).sites.castle[0], y: worldMap(world).sites.castle[1], kind: "castle" }, ...(worldMap(world).sites.labyrinth ? [{ x: worldMap(world).sites.labyrinth!.center[0], y: worldMap(world).sites.labyrinth!.center[1], kind: "labyrinth" }] : [])];
  const insideRoom = inside ? houseRoom(world, inside.house) : null, roomW = insideRoom?.w ?? 11, roomH = insideRoom?.h ?? 8;
  const roomScale = Math.max(0.5, Math.min(2.2, Math.min((view.w * TILE * zoom) / (roomW * TILE + 40), (view.h * TILE * zoom) / (roomH * TILE + 120))));
  const woodsScale = Math.max(0.5, Math.min(2.2, Math.min((view.w * TILE * zoom) / (WOODS_N * TILE + 40), (view.h * TILE * zoom) / (WOODS_N * TILE + 90))));
  const placeName = dungeon ? `${WORLDS[world]!.name} · Dungeon` : WORLDS[world]!.name;

  return <div className="open-world-shell">
    <div ref={viewport} className={`open-world-viewport ${dungeon ? `is-dungeon dungeon-tint-${world}` : `world-${world}`}`}>
      <div className="world-zoom" style={{ transform: `scale(${zoom})` }}>
        <div ref={cameraEl} className="world-camera" style={{ width: map.w * TILE, height: map.h * TILE }}>
          {chunks.map(([cx, cy]) => <MapChunk key={`${mapKey}:${cx}:${cy}`} id={mapKey} map={map} theme={world} dungeon={!!dungeon} cx={cx} cy={cy} />)}
          {falls.map((f) => <span key={`f${f.x},${f.y}`} className={`world-falls falls-${world}`} style={{ left: f.x * TILE, top: f.y * TILE, width: f.w * TILE, height: f.h * TILE }} aria-hidden><i /></span>)}
          {bushes.map((b) => <img key={b.id} src={bushUrl} alt="" className="world-bush" style={at(b.x, b.y)} draggable={false} />)}
          {chests.map((t) => <img key={`t${t.id}`} src={spriteUrl(t.open ? "chestopen" : "chest", world)} alt={t.open ? "Leere Truhe" : "Schatztruhe"} className={`world-chest ${t.open ? "is-open" : ""}`} style={at(t.x, t.y)} draggable={false} />)}
          {!dungeon && plateSpot && Array.from({ length: PLATES }, (_, i) => inView(plateSpot.x + i, plateSpot.y) && <img key={`pl${i}`} src={spriteUrl(puzzleDone || plates & (1 << i) ? "plateon" : "plate", world)} alt="" className={`world-plate ${puzzleDone ? "is-solved" : ""}`} style={at(plateSpot.x + i, plateSpot.y)} draggable={false} />)}
          {!dungeon && fieldPiece && <img src={spriteUrl("piece", world)} alt="Herzteil" className="world-piece" style={at(fieldPiece.x, fieldPiece.y)} draggable={false} />}
          {!dungeon && <CastleGuards world={world} heroX={pos.x} heroY={pos.y} halfW={halfW} halfH={halfH} />}
          {!dungeon && <Villagers world={world} heroX={pos.x} heroY={pos.y} halfW={halfW} halfH={halfH} onTalk={onResident} />}
          {points.map((p) => {
            const locked = p.kind === "dungeon" && !unlockedWorld(save, p.ref);
            const datable = p.kind === "romance" ? DATABLES.find((d) => `romance-${d.id}` === p.id) : null;
            const waiting = p.kind === "guide" ? guideOf(p.ref) : undefined;
            const step = waiting ? guideStep(save, p.ref) : null;
            const hermit = p.kind === "hermit" ? sideQuest(world, p.ref) : undefined;
            const hStep = hermit ? sideStep(save, world, p.ref) : null;
            const door = p.kind === "city" || p.kind === "dungeon" || p.kind === "home" || p.kind === "smith";
            return <button key={p.id} className={`world-poi poi-${p.kind} ${door ? "poi-door" : ""} ${near?.id === p.id ? "is-near" : ""} ${locked ? "is-locked" : ""}`} style={at(p.x, p.y)} onClick={() => {
              if (Math.max(Math.abs(p.x - pos.x), Math.abs(p.y - pos.y)) <= 1) interact();
              else toast(`${p.emoji} ${p.name} · ${Math.abs(p.x - pos.x) + Math.abs(p.y - pos.y)} Schritte entfernt`);
            }} aria-label={p.name}>
              {door ? <span className="poi-door-mark" aria-hidden>{locked ? "🔒" : p.kind === "smith" ? "🔨" : p.kind === "dungeon" ? "▼" : p.kind === "home" && !save.homeOwned ? "🪧" : "▼"}</span>
                : p.kind === "secret" ? <img src={secretCottage} alt="" width={86} height={96} className="poi-cottage" draggable={false} />
                : p.kind === "woods" ? <span className="poi-woods" aria-hidden><i /><i /><i /></span>
                : waiting ? <><StoryHero look={waiting.look} direction={0} scale={2.8} label={p.name} className="poi-elf" /><span className={`poi-quest is-${step}`} aria-hidden>{step === "ask" ? "!" : step === "return" ? waiting.quest.emoji : "?"}</span></>
                : hermit ? <><StoryHero look={hermit.look} direction={0} scale={2.8} label={p.name} className="poi-elf" /><span className={`poi-quest is-${hStep}`} aria-hidden>{hStep === "ask" ? "!" : hStep === "return" ? hermit.item.emoji : "?"}</span></>
                : p.kind === "lost" || p.kind === "hermititem" ? <span className="poi-lost" aria-hidden>{p.emoji}<i>✦</i></span>
                : datable ? <StoryHero look={datable.look} direction={0} scale={2.8} label={p.name} className="poi-elf" />
                : p.kind === "npc" ? <span className="poi-npc">{p.emoji}</span>
                : p.kind === "rose" ? <span className="poi-sparkle">✦</span> : null}
              {datable && save.heartRose && <span className="poi-heart">♥</span>}
              <small>{p.kind === "home" && !save.homeOwned ? "Haus zu verkaufen" : p.kind === "lost" || p.kind === "hermititem" ? `${p.name}?` : p.kind === "hermit" ? `🧙 ${p.name.split(" ")[0]}` : p.kind === "dungeon" ? `🏛️ ${p.name}` : p.name}</small>
            </button>;
          })}
          {dungeon && <>
            {[22, 23, 24, 25].map((x) => <span key={x} className="dungeon-exit" style={at(x, DUNGEON_EXIT_Y)}>{x === 23 ? <>⇩<small>Ausgang</small></> : "⇩"}</span>)}
            {GATE_ROWS.map((y, g) => gateOpen(save, world, g) ? null : [22, 23, 24, 25].map((x) => <img key={`${g}-${x}`} src={spriteUrl("gate", world)} alt="" className={`dungeon-gate ${g === 2 ? "is-boss" : ""}`} style={at(x, y)} draggable={false} />))}
            {DUNGEON_CHESTS.map((c) => {
              const gone = c.kind === "item" ? hasDungeonItem(save, world) : dungeon.loot.includes(c.index);
              if (gone) return null;
              return <span key={c.index} className={`dungeon-chest ${c.kind === "item" ? "is-item" : ""}`} style={at(c.x, c.y)}><img src={spriteUrl(c.kind === "item" ? "bigchest" : "chest", world)} alt="" draggable={false} />{c.kind === "item" && <small>Dungeon-Schatz</small>}</span>;
            })}
          </>}
          {combat?.drops.map((d) => inView(d.x, d.y) && <span key={`d${d.id}`} className={`world-drop is-${d.kind}`} style={at(d.x, d.y)} aria-label={d.kind === "ruby" ? "Rubin" : "Herz"}>{d.kind === "ruby" ? "💎" : "❤️"}</span>)}
          {foes.map((f) => <span key={f.index} className={`dungeon-enemy foe-${f.behavior} ${f.boss ? "is-boss" : ""} ${f.awake ? "is-awake" : ""} ${f.rush ? "is-rushing" : ""} ${ui.fx.length && f.frozenUntil > performance.now() ? "is-frozen" : ""} stage-${f.stage}`} style={at(f.x, f.y)} aria-label={`${f.foe.name}, ${f.hp} von ${f.maxHp} Leben`}>
            <span key={`${f.hp}-${f.stage}`} className={`foe-sprite ${f.touched ? "is-hit" : ""} ${f.boss ? "" : "is-monster"}`}>{f.boss ? f.foe.emoji : <img src={monsterUrl(monsterKindFor(f.behavior, f.index), world)} alt="" draggable={false} />}</span>
            {(f.touched || f.boss) && !(f.boss && f.awake) && <i className="foe-hp"><b style={{ width: `${(f.hp / f.maxHp) * 100}%` }} /></i>}
            {ui.bubbles[f.index] && <em className="foe-bubble">„{ui.bubbles[f.index]!.text}“</em>}
            <small>{f.foe.name}</small>
          </span>)}
          {combat?.shots.map((s) => <span key={s.id} className={s.hero ? `hero-shot dir-${s.dx > 0 ? 2 : s.dx < 0 ? 1 : s.dy < 0 ? 3 : 0} ${s.boomerang ? "is-boomerang" : ""}` : "boss-shot"} style={at(s.x, s.y)}>{s.emoji}</span>)}
          {combat?.bombs.map((b) => <span key={`b${b.id}`} className="world-bomb" style={at(b.x, b.y)}>💣</span>)}
          {guide && <span className="world-guide" style={at(follow.x, follow.y)}><StoryHero look={guide.look} direction={follow.dir} walking={walking} scale={2.8} label={guide.name} /><small>{guide.name.split(" ")[0]}</small></span>}
          {partner && <span className="world-guide world-partner" style={at(partnerSpot.x, partnerSpot.y)}><StoryHero look={SECRET_DATABLE.look} direction={partnerSpot.dir} walking={walking} scale={2.8} label={SECRET_DATABLE.name} /><small>🌸 Floria</small></span>}
          <span ref={playerEl} style={{ ["--arm-skin" as string]: heroPal["n"], ["--arm-cloth" as string]: heroPal["t"], ["--arm-trim" as string]: heroPal["T"] }} className={`world-player ${ui.hurtUntil ? "is-hurt" : ""} ${ui.rollUntil ? "is-rolling" : ""} ${ui.charged ? "is-charged" : ""} ${swinging && !ui.spinUntil ? `is-swinging lunge-${direction}` : ""}`}>
            {/* Legs keep walking while the arm swings the sword; the sheathed sword hides because it is in the hand. */}
            <StoryHero look={save.heroLook} direction={direction} walking={walking} scale={3} gear={swinging || ui.spinUntil > 0 ? "swing" : true} />
            {/* Minish-Cap-style sword: the blade sweeps an arc in front of the hero, a white trail follows it; the spin turns it all the way round. */}
            {swinging && !ui.spinUntil && <span key={`s${ui.swingUntil}`} className={`hero-sword is-swing dir-${direction} ${masamune}`} aria-hidden><i className="sword-trail" /><i className="sword-arm"><b className="sword-blade" /><b className="sword-hand" /></i></span>}
            {ui.spinUntil > 0 && <span key={`p${ui.spinUntil}`} className={`hero-sword is-spin dir-${direction} ${masamune}`} aria-hidden><i className="sword-trail" /><i className="sword-arm"><b className="sword-blade" /><b className="sword-hand" /></i></span>}
          </span>
          {swinging && !ui.spinUntil && <span key={`h${ui.swingUntil}`} className="sword-spark" style={at(sx, sy)} aria-hidden />}
          {ui.rings.map((r) => <span key={r.id} className="boom-ring" style={{ left: (r.x - r.r) * TILE, top: (r.y - r.r) * TILE, width: (r.r * 2 + 1) * TILE, height: (r.r * 2 + 1) * TILE }} aria-hidden />)}
          {ui.fx.map((f) => <span key={f.id} className={`combat-fx fx-${f.kind}`} style={at(f.x, f.y)} aria-hidden>{f.text}</span>)}
        </div>
      </div>
      <div className="world-vignette" />
      {inside && houseHere && <HouseRoomView house={houseHere} room={houseRoom(world, inside.house)} loot={save.houseLoot} x={inside.x} y={inside.y} dir={direction} walking={walking} look={save.heroLook} scale={roomScale} />}
      {woods && <WoodsView stage={woods.stage} x={woods.x} y={woods.y} dir={direction} walking={walking} look={save.heroLook} scale={woodsScale} swordDrawn={save.weapons.includes(MASTER_SWORD_ID)} />}
      {!inside && !woods && <MiniMap map={map} theme={world} dungeon={!!dungeon} x={pos.x} y={pos.y} marks={marks} />}
      {!inside && !woods && <div className="world-location-chip">
        <span>{dungeon ? "🏛️" : WORLDS[world]!.emoji} <b>{placeName}</b></span>
        <small>{dungeon
          ? `Raum ${room + 1}/4 · ${roomCleared(save, world, room) || roomFoes === 0 ? "frei ✓" : `${roomFoes} Gegner`} · ${item ? (hasDungeonItem(save, world) ? `${item.emoji} ✓` : "🧰 Schatz im Osten") : ""}`
          : `${guide ? `🧝 ${guide.name.split(" ")[0]} begleitet dich` : toDungeon ? `🏛️ Dungeon ${toDungeon.arrow} ${toDungeon.d} Schritte · ${dungeonProgress(save, world)}/4 Räume` : ""} · 💗 ${piecesFound(save, world)}/${HEART_PIECES_PER_WORLD} · 📜 ${sideQuestsDone(save, world)}/${sideQuests(world).length}`}</small>
        {dungeon && <button type="button" className="chip-leave" onClick={() => update((cur) => ({ ...cur, dungeon: null }))}>🚪 Verlassen</button>}
      </div>}
      {boss && <div className="boss-bar" role="status"><b>{boss.foe.emoji} {boss.foe.name} · STUFE {boss.stage + 1}/{boss.foe.stages.length}</b><i><span style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }} /></i></div>}
      {ui.banner && <div className="combat-banner" role="status"><b>{ui.banner.text}</b><span>„{ui.banner.line}“</span></div>}
      {!doorAbove && chestAhead && <div className="world-near-hint">✦ Schatztruhe öffnen</div>}
      {doorAbove && <div className="world-near-hint">✦ {doorAbove.emoji} {doorAbove.name} betreten (nach oben laufen)</div>}
      {!doorAbove && !chestAhead && !inside && !woods && near && <div className="world-near-hint">✦ {near.kind === "dungeon" ? `${near.name} betreten` : near.kind === "city" ? `${near.name} besuchen` : near.kind === "smith" ? "Zum Schmied (Waffen verbessern)" : near.kind === "home" ? (save.homeOwned ? "Nach Hause gehen" : "Haus ansehen") : near.kind === "rose" ? "Blume untersuchen" : near.kind === "secret" ? "Verschlossene Tür ansehen" : near.kind === "woods" ? "Die nebligen Lost Woods betreten" : near.kind === "lost" || near.kind === "hermititem" ? `${near.name} aufheben` : `Mit ${near.name.split(" ")[0]} sprechen`}</div>}
      {!doorAbove && !chestAhead && !inside && !woods && !near && nearNpc && <div className="world-near-hint">✦ Mit {npcAt(nearNpc.id).name.split(" ")[0]} sprechen</div>}
      <div className="world-controls-hint">PFEILE/WASD = laufen · LEERTASTE = Schwert (halten = Wirbelattacke) · Q = Item · SHIFT = Rolle · E = Handeln</div>
      <div className="world-touch-controls">
        <DPad onDir={setTouchDir} />
        <div className="world-buttons">
          <button type="button" className="world-btn is-roll" aria-label="Ausweichrolle" onPointerDown={(e) => { e.preventDefault(); roll(); }} onClick={(e) => { if (e.detail === 0) roll(); }}>💨<small>ROLLE</small></button>
          <button type="button" className={`world-btn is-item ${toolItem ? "" : "is-empty"}`} aria-label={toolItem ? `${toolItem.name} benutzen` : "Item-Slot leer"} onPointerDown={(e) => { e.preventDefault(); tool_(); }} onClick={(e) => { if (e.detail === 0) tool_(); }}>{toolItem?.emoji ?? (save.tool === "bombs" ? "💣" : "🧰")}<small>{save.tool === "bombs" ? `×${save.bombs}` : "ITEM"}</small></button>
          <button type="button" className="world-btn is-action" aria-label="Handeln" onPointerDown={(e) => { e.preventDefault(); interact(); }} onClick={(e) => { if (e.detail === 0) interact(); }}>✦<small>HANDELN</small></button>
          <button type="button" className={`world-btn is-sword ${ui.charged ? "is-charged" : ""}`} aria-label="Schwert schwingen, gedrückt halten für die Wirbelattacke"
            onPointerDown={(e) => { e.preventDefault(); pressSword(); }} onPointerUp={releaseSword} onPointerCancel={releaseSword} onPointerLeave={() => { if (swordHeld.current !== null) releaseSword(); }}
            onClick={(e) => { if (e.detail === 0) attack(); }}>⚔<small>SCHWERT</small></button>
        </div>
      </div>
    </div>
  </div>;
  function tool_() { toolRef.current(); }
}

const ARROWS: [Direction, string, string][] = [[3, "▲", "Nach oben"], [1, "◀", "Nach links"], [2, "▶", "Nach rechts"], [0, "▼", "Nach unten"]];
/** Touch pad: press and hold to keep walking; slide the thumb to change direction. */
function DPad({ onDir }: { onDir: (d: Direction | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Direction | null>(null);
  const pick = (e: React.PointerEvent): Direction | null => {
    const r = ref.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 10) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : (dy > 0 ? 0 : 3);
  };
  const set = (d: Direction | null) => { setActive(d); onDir(d); };
  const capture = (e: React.PointerEvent) => { try { ref.current?.setPointerCapture(e.pointerId); } catch { /* keep walking without capture */ } };
  return <div ref={ref} className="world-dpad" role="group" aria-label="Steuerkreuz – gedrückt halten zum Laufen"
    onPointerDown={(e) => { e.preventDefault(); capture(e); set(pick(e)); }}
    onPointerMove={(e) => { if (ref.current?.hasPointerCapture(e.pointerId)) { const d = pick(e); if (d !== null && d !== active) set(d); } }}
    onPointerUp={() => set(null)} onPointerCancel={() => set(null)} onLostPointerCapture={() => set(null)}>
    {ARROWS.map(([d, icon, label]) => <span key={d} className={`dpad-arrow dir-${d} ${active === d ? "is-on" : ""}`} aria-label={label}>{icon}</span>)}
    <span className="dpad-center" aria-hidden />
  </div>;
}

/** Castle guards on the map: two at the gate, four walking their round around the moat. */
function CastleGuards({ world, heroX, heroY, halfW, halfH }: { world: number; heroX: number; heroY: number; halfW: number; halfH: number }) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setT(Date.now()), 200); return () => clearInterval(id); }, []);
  return <>{guardsNow(world, t).map((g) => Math.abs(g.x - heroX) > halfW + 3 || Math.abs(g.y - heroY) > halfH + 3 ? null
    : <span key={g.i} className="world-guide world-guard" style={{ left: g.x * 40, top: g.y * 40, transitionDuration: `${GUARD_STEP_MS}ms` }} aria-label="Schlosswache">
      <StoryHero look={GUARD_LOOK} direction={g.dir} walking={g.walking} scale={2.8} label="Schlosswache" gear /><small>🛡️ Wache</small>
    </span>)}</>;
}
