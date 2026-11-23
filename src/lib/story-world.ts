// Free-roaming story worlds, the big dungeons and the hidden Heartrose relationship rules.
// The generated tile maps (story-terrain.ts) decide where you can walk; everything stays deterministic.
import { CITIES, CITIES_PER_WORLD, COMPANIONS, GUIDES, WORLDS } from "./story-content";
import {
  worldMap, worldCell, dungeonCell, terrainOpen, bushIdAt, inSafeZone,
  WORLD_W, WORLD_H, DUNGEON_W, DUNGEON_H, DUNGEON_ENTRY, DUNGEON_EXIT_Y, GATE_ROWS, GATE_X, DUNGEON_FOES, DUNGEON_CHESTS, dungeonRoomAt,
  type DungeonFoeSpot,
} from "./story-terrain";
import {
  worldOf, worldSpawn, LEVELS_PER_WORLD, MAX_CHILDREN, cleanLook, SECRET_PARTNER_ID, worldSaved,
  type Buy, type Child, type HeroLook, type StorySave,
} from "./story";
import { sideQuests, sideStep } from "./story-quests";

export { WORLD_W, WORLD_H, DUNGEON_W, DUNGEON_H, DUNGEON_ENTRY, DUNGEON_EXIT_Y, GATE_ROWS, DUNGEON_FOES, DUNGEON_CHESTS, dungeonRoomAt, bushIdAt, inSafeZone };
export const HOME_PRICE = 300;
export const GIFT_PRICE = 25;
export const DATE_PRICE = 15;
export { MAX_CHILDREN, worldSpawn };

export type Direction = 0 | 1 | 2 | 3; // down, left, right, up
export type Point = {
  id: string; x: number; y: number;
  kind: "dungeon" | "city" | "npc" | "romance" | "home" | "rose" | "woods" | "secret" | "guide" | "lost" | "hermit" | "hermititem" | "smith";
  ref: number; name: string; emoji: string;
};
export type Datable = { id: string; name: string; world: number; portrait: number; gift: string; hello: string; date: string; look: HeroLook };

const look = (l: Partial<HeroLook>): HeroLook => cleanLook(l, { skin: 1, hair: 0, outfit: 0, style: 0, body: 0, eyes: 0, head: 0, ears: 0 });
export const DATABLES: Datable[] = [
  { id: "liora", name: "Liora Silberblatt", world: 0, portrait: 0, gift: "Walderdbeeren", hello: "Der Wald erzählt mir normalerweise alle Geheimnisse. Deins hat er mir verschwiegen.", date: "Wir lauschen dem Fluss, bis die Sterne zwischen den Blättern funkeln.", look: look({ body: 1, hair: 3, style: 0, eyes: 0, outfit: 7, head: 4, skin: 0 }) },
  { id: "elean", name: "Elean Nachtfeder", world: 1, portrait: 1, gift: "eine Wüstenrose", hello: "Du hast den Sandsturm überstanden. Beeindruckend. Aber kannst du auch schweigen und den Sonnenuntergang genießen?", date: "Auf den Dünen zeigt dir Elean die Sternbilder der alten Elfen.", look: look({ body: 0, hair: 1, style: 5, eyes: 2, outfit: 3, head: 3, skin: 2 }) },
  { id: "sylwen", name: "Sylwen Feuerblume", world: 2, portrait: 2, gift: "leuchtenden Sumpfmoos-Tee", hello: "Keine Sorge, ich beiße nicht. Mein Lächeln ist viel gefährlicher.", date: "Bei warmem Tee verwandelt sich der neblige Sumpf in einen verzauberten Garten.", look: look({ body: 1, hair: 2, style: 2, eyes: 0, outfit: 0, head: 0, skin: 1 }) },
  { id: "thandor", name: "Thandor Sternenschatten", world: 3, portrait: 3, gift: "einen Kristallanhänger", hello: "Das Eis bewahrt jede Spur. Deine sieht aus wie der Anfang eines Abenteuers.", date: "Ihr wandert über das stille Gletscherlicht und teilt warme Geschichten.", look: look({ body: 0, hair: 8, style: 0, eyes: 5, outfit: 1, head: 0, skin: 3 }) },
  { id: "ysera", name: "Ysera Mondglanz", world: 4, portrait: 4, gift: "einen Sternenstaub-Ring", hello: "Selbst in dieser dunklen Zitadelle leuchtet etwas. Ich glaube, das bist du.", date: "Auf dem höchsten Turm zählt ihr gemeinsam Sternschnuppen über dem violetten Kanal.", look: look({ body: 1, hair: 4, style: 3, eyes: 3, outfit: 2, head: 2, skin: 1 }) },
];

/** Hidden adult elf in the code-locked flower cottage of the Würfelwald (an original character, not part of DATABLES' one-per-world list). */
export const SECRET_DATABLE: Datable = { id: SECRET_PARTNER_ID, name: "Floria Blütenhain", world: 0, portrait: 5, gift: "einen Strauß Mondlilien", hello: "Du hast den Code gewusst? Dann bist du hier willkommen. In meinem Häuschen blüht alles, was man mit Liebe gießt – vielleicht auch wir zwei.", date: "Floria zeigt dir ihren verborgenen Blumengarten. Unter leuchtenden Blüten tanzt ihr, bis der Mond aufgeht.", look: look({ body: 1, hair: 2, style: 3, eyes: 0, outfit: 7, head: 4, skin: 0 }) };
/** Six-digit door code of the cottage; it keeps the grown-up part of the game away from younger players. */
export const SECRET_CODE = "201356";
export const datableById = (id: string): Datable | undefined => DATABLES.find((d) => d.id === id) ?? (id === SECRET_DATABLE.id ? SECRET_DATABLE : undefined);
const canCourt = (s: StorySave, id: string) => (id === SECRET_DATABLE.id ? s.secretHouse : s.heartRose && DATABLES.some((d) => d.id === id));
/** Opens the cottage door; every visit needs the code again. */
export function openSecretHouse(s: StorySave, code: string): Buy {
  if (code.replace(/\s/g, "") !== SECRET_CODE) return { ok: false, error: "🔒 Falscher Code. Die Tür bleibt verschlossen." };
  return { ok: true, save: s.secretHouse ? s : { ...s, secretHouse: true } };
}
/** Floria comes along through every world once she likes you (2 hearts), or stays in her cottage. */
export function setPartnerFollows(s: StorySave, on: boolean): Buy {
  if (!on) return { ok: true, save: { ...s, partnerFollows: false } };
  if (!s.secretHouse) return { ok: false, error: "Diese Begegnung ist noch ein Geheimnis." };
  if (relationOf(s, SECRET_DATABLE.id).affection < 2) return { ok: false, error: "Floria kennt dich noch nicht gut genug (2 Herzen)." };
  return { ok: true, save: { ...s, partnerFollows: true } };
}
export const partnerWalking = (s: StorySave) => s.secretHouse && s.partnerFollows;

/** The cottage hides at the end of a hidden trail in the overgrown south-west of the Würfelwald. */
export const secretCottage = () => { const [x, y] = worldMap(0).sites.cottage!; return { world: 0, x, y }; };

/** The Lost Woods start at an overgrown dead end in the north-west of the Würfelwald; the holy sword rests deep inside. */
export const lostWoodsEntrance = () => { const [x, y] = worldMap(0).sites.woods!; return { world: 0, x, y }; };
export type WoodsDir = "N" | "E" | "S" | "W";
/** The one way through the fog. Any other turn leads back to the edge of the woods. */
export const LOST_WOODS_PATH: readonly WoodsDir[] = ["N", "W", "N", "E", "N"];
/** Next clearing for a turn: one deeper on the right path, otherwise back to the first clearing. */
export const lostWoodsStep = (stage: number, dir: WoodsDir) => (stage < LOST_WOODS_PATH.length && LOST_WOODS_PATH[stage] === dir ? stage + 1 : 0);
/** Where the fireflies drift in a clearing; null in the sword glade. */
export const lostWoodsHint = (stage: number): WoodsDir | null => LOST_WOODS_PATH[stage] ?? null;
export const inSwordGlade = (stage: number) => stage >= LOST_WOODS_PATH.length;

const pointCache = new Map<number, Point[]>();
/** Fixed places of a world: one big dungeon, five villages, two helpers, and the secrets of the Würfelwald. */
export function worldPoints(world: number): Point[] {
  const hit = pointCache.get(world);
  if (hit) return hit;
  const sites = worldMap(world).sites;
  const boss = WORLDS[world]?.boss;
  const points: Point[] = [{ id: `dungeon-${world}`, kind: "dungeon", ref: world, x: sites.dungeon[0], y: sites.dungeon[1], name: boss ? `Dungeon von ${boss.mask?.name ?? boss.name}` : "Dungeon", emoji: "🏛️" }];
  sites.cities.forEach(([x, y], k) => {
    const ref = world * CITIES_PER_WORLD + k;
    const city = CITIES[ref];
    if (city) points.push({ id: `city-${ref}`, kind: "city", ref, x, y, name: city.name, emoji: city.emoji });
    const smith = sites.smiths[k];
    if (city && smith) points.push({ id: `smith-${ref}`, kind: "smith", ref, x: smith[0], y: smith[1], name: `Schmiede von ${city.name}`, emoji: "🔨" });
  });
  const local = COMPANIONS.map((c, ref) => ({ c, ref })).filter((e) => e.c.world === world);
  local.forEach(({ c, ref }, k) => { const spot = sites.npcs[k]; if (spot) points.push({ id: `npc-${c.id}`, kind: "npc", ref, x: spot[0], y: spot[1], name: c.name, emoji: c.emoji }); });
  const date = DATABLES.find((d) => d.world === world);
  if (date && sites.romance) points.push({ id: `romance-${date.id}`, kind: "romance", ref: date.portrait, x: sites.romance[0], y: sites.romance[1], name: date.name, emoji: "🧝" });
  if (sites.woods) points.push({ id: "lost-woods", kind: "woods", ref: 0, x: sites.woods[0], y: sites.woods[1], name: "Lost Woods", emoji: "🌲" });
  if (sites.home) points.push({ id: "home", kind: "home", ref: 0, x: sites.home[0], y: sites.home[1], name: "Dein zukünftiges Zuhause", emoji: "🏡" });
  if (sites.cottage) points.push({ id: "secret-cottage", kind: "secret", ref: 0, x: sites.cottage[0], y: sites.cottage[1], name: "Verwachsenes Häuschen", emoji: "🛖" });
  if (sites.rose) points.push({ id: "heartrose", kind: "rose", ref: 0, x: sites.rose[0], y: sites.rose[1], name: "Eine seltsame rote Blume", emoji: "🌹" });
  for (const q of sideQuests(world)) points.push({ id: `side-${q.key}`, kind: "hermit", ref: q.index, x: q.giver.x, y: q.giver.y, name: q.name, emoji: "🧙" });
  pointCache.set(world, points);
  return points;
}

/** True when the ground at this cell is walkable (meadows, roads, bridges, plazas). */
export const worldGroundOpen = (world: number, x: number, y: number) => terrainOpen(worldCell(world, x, y));

export function canWalkWorld(world: number, x: number, y: number): boolean {
  if (!worldGroundOpen(world, x, y)) return false;
  return !worldPoints(world).some((p) => p.x === x && p.y === y && p.kind !== "rose");
}

/** The closest place within one step (diagonals count), so doors are easy to use. */
export const nearbyPoint = (world: number, x: number, y: number): Point | null => nearestPoint(worldPoints(world), x, y);
export function nearestPoint(points: readonly Point[], x: number, y: number): Point | null {
  const near = points
    .map((p) => ({ p, d: Math.abs(p.x - x) + Math.abs(p.y - y), c: Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) }))
    .filter((e) => e.c <= 1)
    .sort((a, b) => a.d - b.d);
  return near[0]?.p ?? null;
}

// ---------- The big dungeon of every world ----------
/** Level id of a dungeon room: rooms 0–2 are fight rooms, room 3 is the boss. */
export const roomLevel = (world: number, room: number) => world * LEVELS_PER_WORLD + room;
export const roomCleared = (s: Pick<StorySave, "cleared">, world: number, room: number) => s.cleared.includes(roomLevel(world, room));
export const hasDungeonItem = (s: Pick<StorySave, "dungeonItems">, world: number) => s.dungeonItems.includes(world);
/** Gate k leads from room k to room k+1; it opens once room k is cleared. The boss gate also needs the dungeon item. */
export function gateOpen(s: Pick<StorySave, "cleared" | "dungeonItems">, world: number, gate: number): boolean {
  if (!roomCleared(s, world, gate)) return false;
  return gate < 2 || hasDungeonItem(s, world);
}
export const gateIndexAt = (x: number, y: number) => (x >= GATE_X[0] && x <= GATE_X[1] ? (GATE_ROWS as readonly number[]).indexOf(y) : -1);
export function canWalkDungeon(s: Pick<StorySave, "cleared" | "dungeonItems">, world: number, x: number, y: number): boolean {
  if (!terrainOpen(dungeonCell(world, x, y))) return false;
  const g = gateIndexAt(x, y);
  return g < 0 || gateOpen(s, world, g);
}
/** The plaza cell right in front of a world's dungeon door: where you stand after leaving the dungeon. */
export const dungeonDoorStep = (world: number) => { const [x, y] = worldMap(world).sites.dungeon; return { x, y: y + 1 }; };
export function startDungeon(world: number): NonNullable<StorySave["dungeon"]> {
  return { level: world * LEVELS_PER_WORLD, ...DUNGEON_ENTRY, defeated: [], loot: [] };
}
/** Enemies still waiting: rooms you already cleared stay empty on every visit. */
export const dungeonFoesFor = (s: Pick<StorySave, "cleared">, world: number): DungeonFoeSpot[] => DUNGEON_FOES.filter((f) => !roomCleared(s, world, f.room));
/** The room a run is in, or the first uncleared room for the location chip. */
export const currentRoom = (y: number) => dungeonRoomAt(y);
export const isDungeonExit = (y: number) => y >= DUNGEON_EXIT_Y;
/** How far you got in a world's dungeon: rooms cleared out of four. */
export const dungeonProgress = (s: Pick<StorySave, "cleared">, world: number) => [0, 1, 2, 3].filter((r) => roomCleared(s, world, r)).length;

export function findHeartRose(s: StorySave): StorySave {
  return s.heartRose ? s : { ...s, heartRose: true };
}
export function buyHome(s: StorySave): Buy {
  if (s.homeOwned) return { ok: false, error: "Dieses Haus gehört dir schon." };
  if (s.rubies < HOME_PRICE) return { ok: false, error: `Dir fehlen ${HOME_PRICE - s.rubies} Rubine.` };
  return { ok: true, save: { ...s, rubies: s.rubies - HOME_PRICE, homeOwned: true } };
}
export const relationOf = (s: StorySave, id: string) => s.relationships[id] ?? { affection: 0, dates: 0, married: false, child: false };
const withRelation = (s: StorySave, id: string, rel: ReturnType<typeof relationOf>): StorySave => ({ ...s, relationships: { ...s.relationships, [id]: rel } });
export function giveGift(s: StorySave, id: string): Buy {
  if (!canCourt(s, id)) return { ok: false, error: "Diese Begegnung ist noch ein Geheimnis." };
  if (s.rubies < GIFT_PRICE) return { ok: false, error: `Dir fehlen ${GIFT_PRICE - s.rubies} Rubine.` };
  const r = relationOf(s, id);
  return { ok: true, save: withRelation({ ...s, rubies: s.rubies - GIFT_PRICE }, id, { ...r, affection: Math.min(10, r.affection + 1) }) };
}
export function goOnDate(s: StorySave, id: string): Buy {
  const r = relationOf(s, id);
  if (!canCourt(s, id) || r.affection < 2) return { ok: false, error: "Ihr müsst euch erst besser kennenlernen (2 Herzen)." };
  if (s.rubies < DATE_PRICE) return { ok: false, error: `Dir fehlen ${DATE_PRICE - s.rubies} Rubine.` };
  return { ok: true, save: withRelation({ ...s, rubies: s.rubies - DATE_PRICE }, id, { ...r, dates: r.dates + 1, affection: Math.min(10, r.affection + 1) }) };
}
export function propose(s: StorySave, id: string): Buy {
  const r = relationOf(s, id);
  if (!s.homeOwned && !(id === SECRET_DATABLE.id && s.secretHouse)) return { ok: false, error: "Du brauchst zuerst ein eigenes Haus." };
  if (r.affection < 8 || r.dates < 2) return { ok: false, error: "Für die Heirat braucht ihr 8 Herzen und 2 Dates." };
  if (Object.values(s.relationships).some((x) => x.married)) return { ok: false, error: "Du bist bereits verheiratet." };
  return { ok: true, save: withRelation(s, id, { ...r, married: true }) };
}
/** Dates needed before the next child: 3 for the first, then one more date per child. */
export const datesForNextChild = (s: StorySave, id: string) => 3 + s.children.filter((c) => c.parent === id).length;
/** A child's look mixes both parents and is fixed at birth. */
export function childLook(hero: HeroLook, partner: HeroLook, index: number): HeroLook {
  const pick = <K extends keyof HeroLook>(k: K, first: boolean) => (first ? hero[k] : partner[k]);
  return { skin: pick("skin", index % 2 === 0), hair: pick("hair", index % 2 === 1), eyes: pick("eyes", index % 3 !== 1), ears: pick("ears", index % 2 === 0), style: (index * 2 + 1) % 6, outfit: (hero.outfit + index + 1) % 8, body: index % 2, head: 0 };
}
export function welcomeChild(s: StorySave, id: string, name: string): Buy {
  const r = relationOf(s, id);
  const n = name.trim();
  if (!r.married) return { ok: false, error: "Nur verheiratete Paare können eine Familie gründen." };
  if (s.children.length >= MAX_CHILDREN) return { ok: false, error: `Euer Haus ist voll – ${MAX_CHILDREN} Kinder sind das Maximum.` };
  const need = datesForNextChild(s, id);
  if (r.dates < need) return { ok: false, error: `Verbringt erst noch ein Date miteinander (${r.dates}/${need} Dates).` };
  if (n.length < 2 || n.length > 16) return { ok: false, error: "Gib eurem Kind einen Namen (2–16 Zeichen)." };
  const partner = datableById(id);
  const kid: Child = { name: n, parent: id, look: childLook(s.heroLook, partner?.look ?? s.heroLook, s.children.length) };
  return { ok: true, save: { ...withRelation(s, id, { ...r, child: true }), children: [...s.children, kid] } };
}
export const unlockedWorld = (s: StorySave, world: number) => world <= worldOf(s.unlocked);

// ---------- Guides in their villages ----------
/** Where a world's guide waits beside the start village, and where their lost item lies. */
export const guideSpot = (world: number) => { const g = worldMap(world).sites.guide; return { home: g.home, lost: g.lost }; };
/** Village a guide lives in: the first village of their world. */
export const guideVillage = (world: number) => CITIES[world * CITIES_PER_WORLD];
export type GuideStep = "none" | "ask" | "search" | "return" | "walking" | "done";
/** ask → search (item lies in the world) → return (bring it back) → walking with you → done once the world is saved. */
export function guideStep(s: StorySave, world: number): GuideStep {
  if (!GUIDES.some((g) => g.world === world)) return "none";
  if (worldSaved(s, world)) return "done";
  if (s.guidesJoined.includes(world)) return "walking";
  if (s.guideFinds.includes(world)) return "return";
  return s.guideQuests.includes(world) ? "search" : "ask";
}
/** The guide standing in the village (unless walking with you) and their lost item while you look for it. */
export function guidePoints(s: StorySave, world: number): Point[] {
  const step = guideStep(s, world), g = GUIDES.find((x) => x.world === world), spot = guideSpot(world);
  if (step === "none" || step === "walking" || !g || !spot) return [];
  const out: Point[] = [{ id: `guide-${g.id}`, kind: "guide", ref: world, x: spot.home[0], y: spot.home[1], name: g.name, emoji: "🧝" }];
  if (step === "search") out.push({ id: `lost-${g.id}`, kind: "lost", ref: world, x: spot.lost[0], y: spot.lost[1], name: g.quest.item, emoji: g.quest.emoji });
  return out;
}
export function askGuide(s: StorySave, world: number): StorySave {
  return guideStep(s, world) === "ask" ? { ...s, guideQuests: [...s.guideQuests, world] } : s;
}
/** Picks up the lost item; you have to stand right next to it in its world. */
export function pickGuideItem(s: StorySave, world: number): Buy {
  const spot = guideSpot(world);
  if (guideStep(s, world) !== "search") return { ok: false, error: "Hier gibt es nichts zu finden." };
  if (s.dungeon || s.world !== world || Math.max(Math.abs(s.worldPos.x - spot.lost[0]), Math.abs(s.worldPos.y - spot.lost[1])) > 1) return { ok: false, error: "Geh näher heran." };
  return { ok: true, save: { ...s, guideFinds: [...s.guideFinds, world] } };
}
/** Bringing the item back makes the guide join you. */
export function guideJoins(s: StorySave, world: number): Buy {
  if (guideStep(s, world) !== "return") return { ok: false, error: "Hilf zuerst bei der Suche." };
  return { ok: true, save: { ...s, guidesJoined: [...s.guidesJoined, world] } };
}
/** Lost items of the hermits' side quests, lying in the world while you look for them. */
export function sideItemPoints(s: StorySave, world: number): Point[] {
  return sideQuests(world).filter((q) => sideStep(s, world, q.index) === "search")
    .map((q) => ({ id: `sideitem-${q.key}`, kind: "hermititem", ref: q.index, x: q.item.x, y: q.item.y, name: q.item.name, emoji: q.item.emoji }));
}
/** A guide's spot blocks walking while they stand there (and so does a lost item lying on the ground). */
export const guideBlocks = (s: StorySave, world: number, x: number, y: number) => [...guidePoints(s, world), ...sideItemPoints(s, world)].some((p) => p.x === x && p.y === y);
/** Every place on the map for this save: fixed places plus the guide waiting in the village, lost items and hermits' lost things. */
export const savePoints = (s: StorySave, world: number): Point[] => [...worldPoints(world), ...guidePoints(s, world), ...sideItemPoints(s, world)];
/** Walkable for this save: painted ground that no place, waiting guide or lost item stands on. */
export const canWalkSave = (s: StorySave, world: number, x: number, y: number) => canWalkWorld(world, x, y) && !guideBlocks(s, world, x, y);
