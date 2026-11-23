// Side quests of the hermits and the treasure chests of the open countryside.
// Pure and deterministic: who asks, what they lost and what a chest holds come from the world and quest index;
// the save only stores which quests you took on, found and finished, and which chests you opened.
import { worldMap, hash, treasureIdAt } from "./story-terrain";
import { HERMIT_FIRST, HERMIT_LAST, SIDE_ITEMS, LANDMARK_PLACES, COMPASS, SIDE_ASK, SIDE_THANKS, SIDE_DONE } from "./story-content";
import { NPC_LOOK_COUNTS as LOOK_COUNTS } from "./pixel-elf";
import { MAX_BOMBS, chestWeapon, weaponAt, type Buy, type HeroLook, type StorySave } from "./story";

export type SideQuest = {
  world: number; index: number; key: string;
  /** Hermit and the hut they live beside (structure index of the world map). */
  name: string; look: HeroLook; hut: number; giver: { x: number; y: number };
  item: { x: number; y: number; name: string; emoji: string };
  ask: string; thanks: string; hint: string;
  reward: { rubies: number; weapon: number | null };
};
export type SideStep = "ask" | "search" | "return" | "done";
export const sideKey = (world: number, index: number) => `${world}:${index}`;

const cache = new Map<number, SideQuest[]>();
/** The hermit side quests of a world, one per hermit hut. */
export function sideQuests(world: number): SideQuest[] {
  const hit = cache.get(world);
  if (hit) return hit;
  const list = worldMap(world).sites.quests.map((q, index): SideQuest => {
    const n = world * 5 + index;
    const name = `${HERMIT_FIRST[n % HERMIT_FIRST.length]} ${HERMIT_LAST[(n + Math.floor(n / HERMIT_FIRST.length)) % HERMIT_LAST.length]}`;
    const it = SIDE_ITEMS[(n * 5 + world) % SIDE_ITEMS.length]!;
    const mine = it.g === "f" ? "meine" : "mein", pron = it.g === "m" ? "ihn" : it.g === "f" ? "sie" : "es";
    const [gx, gy] = q.giver, [ix, iy] = q.item;
    const angle = Math.atan2(iy - gy, ix - gx), dir = COMPASS[((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8]!;
    const place = LANDMARK_PLACES[q.at] ?? "irgendwo";
    const look: HeroLook = {
      body: n % LOOK_COUNTS.body, skin: (n * 3 + 1) % LOOK_COUNTS.skin, hair: (n * 7 + 5) % LOOK_COUNTS.hair, style: (n * 5 + 2) % LOOK_COUNTS.style,
      eyes: (n * 2 + 1) % LOOK_COUNTS.eyes, outfit: (n * 3 + 4) % LOOK_COUNTS.outfit, head: (n * 4 + 1) % LOOK_COUNTS.head, ears: n % LOOK_COUNTS.ears,
    };
    const weapon = index % 2 === 1 ? chestWeapon(world, hash(world * 71 + index, 3, 9)) : null;
    return {
      world, index, key: sideKey(world, index), name, look, hut: q.hut, giver: { x: gx, y: gy },
      item: { x: ix, y: iy, name: it.name, emoji: it.emoji },
      ask: SIDE_ASK[n % SIDE_ASK.length]!(it.name, mine, pron, place, dir),
      thanks: SIDE_THANKS[n % SIDE_THANKS.length]!,
      hint: `${it.emoji} ${it.name} liegt ${place} im ${dir}.`,
      reward: { rubies: 40 * (world + 1) + index * 10, weapon },
    };
  });
  cache.set(world, list);
  return list;
}
export const sideQuest = (world: number, index: number): SideQuest | undefined => sideQuests(world)[index];

export function sideStep(s: Pick<StorySave, "sideAsked" | "sideFound" | "sideDone">, world: number, index: number): SideStep {
  const k = sideKey(world, index);
  if (s.sideDone.includes(k)) return "done";
  if (s.sideFound.includes(k)) return "return";
  return s.sideAsked.includes(k) ? "search" : "ask";
}
/** Talking to a hermit for the first time: they ask for help. */
export function acceptSide(s: StorySave, world: number, index: number): StorySave {
  if (!sideQuest(world, index) || sideStep(s, world, index) !== "ask") return s;
  return { ...s, sideAsked: [...s.sideAsked, sideKey(world, index)] };
}
/** Picking up the lost item: you have to stand right next to it in its world. */
export function pickSideItem(s: StorySave, world: number, index: number): Buy {
  const q = sideQuest(world, index);
  if (!q || sideStep(s, world, index) !== "search") return { ok: false, error: "Hier gibt es nichts zu finden." };
  if (s.dungeon || s.world !== world || Math.max(Math.abs(s.worldPos.x - q.item.x), Math.abs(s.worldPos.y - q.item.y)) > 1) return { ok: false, error: "Geh näher heran." };
  return { ok: true, save: { ...s, sideFound: [...s.sideFound, q.key] } };
}
/** Bringing the item back: the reward is paid exactly once. */
export function finishSide(s: StorySave, world: number, index: number): Buy & { reward?: string } {
  const q = sideQuest(world, index);
  if (!q || sideStep(s, world, index) !== "return") return { ok: false, error: "Hilf zuerst bei der Suche." };
  const done = [...s.sideDone, q.key];
  const weapon = q.reward.weapon;
  if (weapon !== null && !s.weapons.includes(weapon)) {
    return { ok: true, save: { ...s, sideDone: done, rubies: s.rubies + q.reward.rubies, weapons: [...s.weapons, weapon] }, reward: `+${q.reward.rubies} 💎 · ⚔ ${weaponAt(weapon).name}` };
  }
  const rubies = q.reward.rubies * (weapon !== null ? 2 : 1);
  return { ok: true, save: { ...s, sideDone: done, rubies: s.rubies + rubies }, reward: `+${rubies} 💎` };
}
export const sideDoneLine = (world: number, index: number) => SIDE_DONE[(world + index) % SIDE_DONE.length]!;
export const sideQuestsDone = (s: Pick<StorySave, "sideDone">, world: number) => s.sideDone.filter((k) => k.startsWith(`${world}:`)).length;

// ---------- Treasure chests in the open world ----------
export const treasureKey = (world: number, index: number) => `${world}:${index}`;
export const treasureOpened = (s: Pick<StorySave, "treasures">, world: number, index: number) => s.treasures.includes(treasureKey(world, index));
export const treasureAt = (world: number, x: number, y: number) => treasureIdAt(world, x, y);
/** What a chest holds: every fifth a weapon (rubies once you own it), some bombs once you carry bombs, otherwise rubies. */
export function openTreasure(s: StorySave, world: number, index: number): Buy & { reward?: string } {
  if (index < 0 || index >= worldMap(world).treasures.length) return { ok: false, error: "Hier ist keine Truhe." };
  if (treasureOpened(s, world, index)) return { ok: false, error: "Die Truhe ist leer." };
  const opened = [...s.treasures, treasureKey(world, index)];
  if (index % 5 === 0) {
    const id = chestWeapon(world, hash(world * 53 + index, 7, 1));
    if (!s.weapons.includes(id)) return { ok: true, save: { ...s, treasures: opened, weapons: [...s.weapons, id] }, reward: `⚔ ${weaponAt(id).name}` };
  }
  if (index % 5 === 2 && (s.bombs > 0 || s.tool === "bombs") && s.bombs < MAX_BOMBS) {
    const bombs = Math.min(MAX_BOMBS, s.bombs + 5);
    return { ok: true, save: { ...s, treasures: opened, bombs }, reward: `+${bombs - s.bombs} 💣` };
  }
  const rubies = (20 + (index % 3) * 10) * (world + 1);
  return { ok: true, save: { ...s, treasures: opened, rubies: s.rubies + rubies }, reward: `+${rubies} 💎` };
}
