// Real-time action combat (Minish-Cap-style) for the open world and the dungeons.
// Enemies walk on the tile grid with their own habits (chasers, rock shooters, chargers, bosses),
// the hero swings the sword, charges a spin attack, rolls away and uses the dungeon items.
// Beaten enemies drop rubies and hearts to pick up. Pure and time-driven: the component passes `now`
// and a random source, so every rule is testable.
import type { Foe, Stats } from "./story";
import type { DungeonItemText } from "./story-content";

export type Direction = 0 | 1 | 2 | 3; // down, left, right, up
export type Hero = { x: number; y: number; dir: Direction };
export type Behavior = "chase" | "shoot" | "charge" | "boss";
export type FoeSpawn = { index: number; foe: Foe; boss: boolean; x: number; y: number; room: number; slot: number; field?: boolean };
export type LiveFoe = {
  index: number; foe: Foe; boss: boolean; behavior: Behavior; room: number; field: boolean;
  x: number; y: number; dir: Direction; stage: number; hp: number; maxHp: number; awake: boolean; touched: boolean;
  nextMove: number; nextAttack: number; nextShot: number; stunUntil: number; hurtUntil: number; frozenUntil: number;
  rush: [number, number] | null;
};
export type Shot = {
  id: number; x: number; y: number; dx: number; dy: number; damage: number; nextMove: number;
  hero: boolean; emoji: string; left: number; back: boolean; boomerang: boolean; stun: number; freeze: boolean; mult: number; hits: number[];
};
export type Bomb = { id: number; x: number; y: number; at: number; mult: number };
export type Drop = { id: number; x: number; y: number; kind: "ruby" | "heart"; value: number; until: number };
export type Combat = { foes: LiveFoe[]; shots: Shot[]; bombs: Bomb[]; drops: Drop[]; invulnUntil: number; nextSwing: number; nextRegen: number; nextTool: number; seq: number };
/** Where things may move: `walk` for enemies (no villages), `fly` for anything thrown or shot. */
export type Arena = { walk: (x: number, y: number) => boolean; fly: (x: number, y: number) => boolean; zone: (x: number, y: number) => number };
export type CombatEvent =
  | { type: "hit"; foe: number; x: number; y: number; damage: number; crit: boolean }
  | { type: "stage"; foe: number; title: string; line: string }
  | { type: "defeated"; foe: number; x: number; y: number; field: boolean; boss: boolean; room: number }
  | { type: "wake"; foe: number; line: string }
  | { type: "hurt"; damage: number; dodged: boolean; push: [number, number] }
  | { type: "heal"; amount: number }
  | { type: "block"; x: number; y: number }
  | { type: "pickup"; kind: Drop["kind"]; value: number; x: number; y: number }
  | { type: "boom"; x: number; y: number; r: number };
export type Step = { combat: Combat; events: CombatEvent[]; heroTo?: { x: number; y: number }[] };

export const DIRS: Record<Direction, [number, number]> = { 0: [0, 1], 1: [-1, 0], 2: [1, 0], 3: [0, -1] };
export const SWING_MS = 260;
/** Hold the sword this long, then let go for a spin attack. */
export const SPIN_CHARGE_MS = 650;
export const HERO_INVULN_MS = 900;
export const ROLL_INVULN_MS = 420;
export const REGEN_MS = 3000;
export const SHOT_STEP_MS = 110;
export const HERO_SHOT_MS = 55;
export const BOMB_FUSE_MS = 1100;
export const DROP_MS = 14000;
/** Open-world enemies further away than this sleep, so a huge map costs nothing. */
export const ACTIVE_RANGE = 18;
const WAKE = { chase: 5, shoot: 7, charge: 6, boss: 9 } as const;
const LEASH = 11;
const MOVE_MS = { foe: [600, 420], boss: [560, 440, 340] };
const SHOT_MS = [2200, 1700, 1300];
const ROCK_MS = 1900;
const RUSH_STEP_MS = 90;

export const behaviorOf = (slot: number, boss: boolean): Behavior => (boss ? "boss" : (["chase", "shoot", "charge"] as const)[slot % 3]!);
export const moveDelay = (f: Pick<LiveFoe, "boss" | "stage">) => (f.boss ? MOVE_MS.boss : MOVE_MS.foe)[f.stage] ?? 340;
export const attackDelay = (f: Pick<LiveFoe, "boss">) => (f.boss ? 800 : 1000);
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** One sword hit: an average roll (3.5) times weapon power plus bonus damage; crits double it. */
export function swordDamage(st: Stats, crit: boolean, firstHit = false) {
  const base = Math.round(3.5 * st.power + st.atk + (firstHit ? st.first : 0));
  return crit ? base * 2 : base;
}
/** Damage an enemy deals on contact: at least 1, reduced by defense and shield. */
export const foeDamage = (power: number, st: Stats) => Math.max(1, Math.round(3.5 * power) - st.def - st.shield);

/** The three cells in front of the hero that the sword swing covers. */
export function swordArc(h: Hero): [number, number][] {
  const [dx, dy] = DIRS[h.dir];
  const fx = h.x + dx, fy = h.y + dy;
  return dx ? [[fx, fy], [fx, fy - 1], [fx, fy + 1]] : [[fx, fy], [fx - 1, fy], [fx + 1, fy]];
}
/** The eight cells around the hero: the spin attack hits all of them. */
export const ringCells = (h: { x: number; y: number }, r = 1): [number, number][] => {
  const out: [number, number][] = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx || dy) out.push([h.x + dx, h.y + dy]);
  return out;
};

export function startCombat(spawns: FoeSpawn[], now: number): Combat {
  const foes = spawns.map((e): LiveFoe => {
    const hp = e.foe.stages[0]!.hp;
    return {
      index: e.index, foe: e.foe, boss: e.boss, behavior: behaviorOf(e.slot, e.boss), room: e.room, field: !!e.field,
      x: e.x, y: e.y, dir: 0, stage: 0, hp, maxHp: hp, awake: false, touched: false,
      nextMove: now + 400, nextAttack: now + 800, nextShot: now + 1500, stunUntil: 0, hurtUntil: 0, frozenUntil: 0, rush: null,
    };
  });
  return { foes, shots: [], bombs: [], drops: [], invulnUntil: 0, nextSwing: 0, nextRegen: now + REGEN_MS, nextTool: 0, seq: 0 };
}

const dirOf = (dx: number, dy: number): Direction => (dx > 0 ? 2 : dx < 0 ? 1 : dy < 0 ? 3 : 0);
const occupied = (foes: LiveFoe[], x: number, y: number, self?: number) => foes.some((f) => f.index !== self && f.x === x && f.y === y);
/** True when a foe stands on this cell (the hero cannot walk through enemies). */
export const foeAt = (c: Combat | null, x: number, y: number) => !!c && occupied(c.foes, x, y);

/** Step toward the hero along the longer axis first; null when both ways are blocked. */
export function chaseStep(f: { x: number; y: number }, hero: { x: number; y: number }, free: (x: number, y: number) => boolean): [number, number] | null {
  const dx = Math.sign(hero.x - f.x), dy = Math.sign(hero.y - f.y);
  const opts: [number, number][] = Math.abs(hero.x - f.x) >= Math.abs(hero.y - f.y) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
  for (const [ox, oy] of opts) if ((ox || oy) && free(f.x + ox, f.y + oy)) return [ox, oy];
  return null;
}
/** Straight line from a foe to the hero (same row or column) with nothing in between. */
export function clearLine(f: { x: number; y: number }, hero: { x: number; y: number }, fly: (x: number, y: number) => boolean, max: number): [number, number] | null {
  if (f.x !== hero.x && f.y !== hero.y) return null;
  const d = dist(f, hero);
  if (!d || d > max) return null;
  const dx = Math.sign(hero.x - f.x), dy = Math.sign(hero.y - f.y);
  for (let k = 1; k < d; k++) if (!fly(f.x + dx * k, f.y + dy * k)) return null;
  return [dx, dy];
}

/** What a beaten enemy leaves behind: field enemies drop rubies or hearts, dungeon enemies sometimes a heart. */
export function dropFor(f: Pick<LiveFoe, "field" | "boss" | "foe">, roll: number): Pick<Drop, "kind" | "value"> | null {
  if (f.boss) return null;
  if (f.field) return roll < 0.6 ? { kind: "ruby", value: Math.max(1, Math.round(f.foe.rubies * 0.5)) } : roll < 0.85 ? { kind: "heart", value: 1 } : null;
  return roll < 0.3 ? { kind: "heart", value: 1 } : null;
}

type StrikeOpts = { mult: number; stun: number; freeze?: boolean; knock: [number, number] | "away"; from: { x: number; y: number }; now: number; rand: () => number; arena: Arena };
/** Hits every foe on the given cells: damage, knockback, stun, boss stages, defeats and drops. */
export function strike(c: Combat, cells: readonly (readonly [number, number])[], st: Stats, o: StrikeOpts): Step & { hits: number } {
  const on = (x: number, y: number) => cells.some(([ax, ay]) => ax === x && ay === y);
  const events: CombatEvent[] = [];
  const foes: LiveFoe[] = [];
  const drops = [...c.drops];
  let seq = c.seq, hits = 0;
  for (const f of c.foes) {
    if (!on(f.x, f.y)) { foes.push(f); continue; }
    hits++;
    const crit = o.rand() < st.crit;
    const damage = Math.max(1, Math.round(swordDamage(st, crit, !f.touched) * o.mult));
    events.push({ type: "hit", foe: f.index, x: f.x, y: f.y, damage, crit });
    const hp = f.hp - damage;
    if (hp > 0) {
      const [px, py] = o.knock === "away" ? [Math.sign(f.x - o.from.x), Math.sign(f.y - o.from.y)] : o.knock;
      const kx = f.x + px, ky = f.y + py;
      const canPush = !f.boss && (px || py) && o.arena.walk(kx, ky) && !occupied(c.foes, kx, ky, f.index) && !(kx === o.from.x && ky === o.from.y);
      foes.push({
        ...f, hp, touched: true, awake: true, rush: null, x: canPush ? kx : f.x, y: canPush ? ky : f.y,
        stunUntil: Math.max(f.stunUntil, o.now + Math.max(450, f.boss ? Math.min(o.stun, 600) : o.stun)), hurtUntil: o.now + 250,
        frozenUntil: o.freeze && !f.boss ? o.now + o.stun : f.frozenUntil, nextAttack: Math.max(f.nextAttack, o.now + 600),
      });
      continue;
    }
    const next = f.foe.stages[f.stage + 1];
    if (next) {
      events.push({ type: "stage", foe: f.index, title: next.title, line: next.line });
      foes.push({ ...f, stage: f.stage + 1, hp: next.hp, maxHp: next.hp, touched: true, awake: true, rush: null, stunUntil: o.now + 900, hurtUntil: o.now + 900, frozenUntil: 0, nextAttack: o.now + 1200, nextShot: o.now + 1400 });
      continue;
    }
    events.push({ type: "defeated", foe: f.index, x: f.x, y: f.y, field: f.field, boss: f.boss, room: f.room });
    const drop = dropFor(f, o.rand());
    if (drop) drops.push({ id: ++seq, x: f.x, y: f.y, ...drop, until: o.now + DROP_MS });
  }
  if (hits && st.leech > 0) events.push({ type: "heal", amount: st.leech });
  return { combat: { ...c, foes, drops, seq }, events, hits };
}
/** Sword shots cut through enemy fireballs and rocks on the struck cells. */
function cutShots(c: Combat, cells: readonly (readonly [number, number])[], events: CombatEvent[]): Combat {
  const shots = c.shots.filter((s) => { const cut = !s.hero && cells.some(([x, y]) => x === s.x && y === s.y); if (cut) events.push({ type: "block", x: s.x, y: s.y }); return !cut; });
  return shots.length === c.shots.length ? c : { ...c, shots };
}

/** Sword swing: hits the three cells in front, knocks enemies back and cuts enemy shots. */
export function swing(c: Combat, hero: Hero, st: Stats, arena: Arena, now: number, rand: () => number): Step {
  if (now < c.nextSwing) return { combat: c, events: [] };
  const arc = swordArc(hero);
  const r = strike(c, arc, st, { mult: 1, stun: 450, knock: DIRS[hero.dir], from: hero, now, rand, arena });
  return { combat: { ...cutShots(r.combat, arc, r.events), nextSwing: now + SWING_MS }, events: r.events };
}
/** Spin attack (charged sword): all eight cells around the hero with double damage. */
export function spinAttack(c: Combat, hero: Hero, st: Stats, arena: Arena, now: number, rand: () => number): Step {
  const ring = ringCells(hero);
  const r = strike(c, ring, st, { mult: 2, stun: 700, knock: "away", from: hero, now, rand, arena });
  return { combat: { ...cutShots(r.combat, ring, r.events), nextSwing: now + SWING_MS * 2 }, events: r.events };
}
/** A dodge roll makes the hero untouchable for a moment. */
export const rollGuard = (c: Combat, now: number): Combat => ({ ...c, invulnUntil: Math.max(c.invulnUntil, now + ROLL_INVULN_MS) });

/** Uses a dungeon item. Throws, shots and bombs fly on their own; a dash returns the cells the hero runs over. */
export function fireTool(c: Combat, hero: Hero, st: Stats, item: DungeonItemText, arena: Arena, now: number, rand: () => number): Step {
  if (now < c.nextTool) return { combat: c, events: [] };
  const [dx, dy] = DIRS[hero.dir];
  const fx = hero.x + dx, fy = hero.y + dy;
  const base = { ...c, nextTool: now + item.cooldown };
  switch (item.tool) {
    case "boomerang": case "shot": {
      if (!arena.fly(fx, fy)) return { combat: base, events: [] };
      const shot: Shot = { id: c.seq + 1, x: hero.x, y: hero.y, dx, dy, damage: 0, nextMove: now, hero: true, emoji: item.emoji, left: item.range, back: false, boomerang: item.tool === "boomerang", stun: item.stun, freeze: !!item.freeze, mult: item.mult, hits: [] };
      return { combat: { ...base, seq: c.seq + 1, shots: [...c.shots, shot] }, events: [] };
    }
    case "bomb": {
      const [bx, by] = arena.fly(fx, fy) ? [fx, fy] : [hero.x, hero.y];
      return { combat: { ...base, seq: c.seq + 1, bombs: [...c.bombs, { id: c.seq + 1, x: bx, y: by, at: now + BOMB_FUSE_MS, mult: item.mult }] }, events: [] };
    }
    case "nova": {
      const r = strike(base, ringCells(hero, item.range), st, { mult: item.mult, stun: item.stun, knock: "away", from: hero, now, rand, arena });
      return { combat: cutShots(r.combat, ringCells(hero, item.range), r.events), events: [{ type: "boom", x: hero.x, y: hero.y, r: item.range }, ...r.events] };
    }
    case "dash": {
      const path: { x: number; y: number }[] = [];
      let x = hero.x, y = hero.y, target: [number, number] | null = null;
      for (let k = 0; k < item.range; k++) {
        const nx = x + dx, ny = y + dy;
        if (occupied(c.foes, nx, ny)) { target = [nx, ny]; break; }
        if (!arena.fly(nx, ny)) break;
        x = nx; y = ny; path.push({ x, y });
      }
      if (!target && occupied(c.foes, x + dx, y + dy)) target = [x + dx, y + dy];
      const guarded = { ...base, invulnUntil: Math.max(c.invulnUntil, now + 120 + path.length * 60) };
      if (!target) return { combat: guarded, events: [], heroTo: path };
      const r = strike(guarded, [target], st, { mult: item.mult, stun: item.stun, knock: [dx, dy], from: { x, y }, now, rand, arena });
      return { combat: r.combat, events: r.events, heroTo: path };
    }
  }
}

/** Advances enemies, shots, bombs and pickups to `now`. Returns the same object when nothing happened. */
export function tickCombat(c: Combat, hero: Hero, st: Stats, arena: Arena, now: number, rand: () => number): Step {
  const events: CombatEvent[] = [];
  let changed = false;
  let invulnUntil = c.invulnUntil;
  let seq = c.seq;
  const heroZone = arena.zone(hero.x, hero.y);
  const hurt = (damage: number, from: { x: number; y: number }) => {
    if (now < invulnUntil) return;
    const dodged = rand() < st.dodge;
    const push: [number, number] = [Math.sign(hero.x - from.x), Math.sign(hero.y - from.y)];
    events.push({ type: "hurt", damage: dodged ? 0 : damage, dodged, push });
    invulnUntil = now + (dodged ? HERO_INVULN_MS / 2 : HERO_INVULN_MS);
  };
  const newShots: Shot[] = [];
  const shoot = (f: LiveFoe, dx: number, dy: number, damage: number, emoji: string) => {
    if (!dx && !dy) return;
    newShots.push({ id: ++seq, x: f.x + dx, y: f.y + dy, dx, dy, damage, nextMove: now + SHOT_STEP_MS, hero: false, emoji, left: 12, back: false, boomerang: false, stun: 0, freeze: false, mult: 0, hits: [] });
  };
  let foes = [...c.foes];
  foes.forEach((f0, i) => {
    let f = f0;
    const d = dist(f, hero);
    if (f.field && d > ACTIVE_RANGE) {
      if (f.awake) { foes[i] = { ...f, awake: false, rush: null }; changed = true; }
      return;
    }
    if (!f.awake && arena.zone(f.x, f.y) === heroZone && d <= WAKE[f.behavior]) {
      f = { ...f, awake: true, nextMove: Math.max(f.nextMove, now + 300) };
      if (!f.field) events.push({ type: "wake", foe: f.index, line: f.foe.intro });
    } else if (f.awake && f.field && d > LEASH) f = { ...f, awake: false, rush: null };
    if (now < f.stunUntil || now < f.frozenUntil) { if (f !== f0) { foes[i] = f; changed = true; } return; }
    const stage = f.foe.stages[f.stage]!;
    const free = (x: number, y: number) => arena.walk(x, y) && !occupied(foes, x, y, f.index) && !(x === hero.x && y === hero.y);
    const moveBy = (s: [number, number] | null, delay: number) => {
      if (s) { f = { ...f, x: f.x + s[0], y: f.y + s[1], dir: dirOf(s[0], s[1]) }; if (dist(f, hero) === 1) f.nextAttack = Math.max(f.nextAttack, now + 250); }
      f = { ...f, nextMove: now + delay };
    };
    if (f.rush && now >= f.nextMove) {
      const [rx, ry] = f.rush;
      if (free(f.x + rx, f.y + ry)) moveBy([rx, ry], RUSH_STEP_MS);
      else f = { ...f, rush: null, stunUntil: now + 700, nextMove: now + 700 };
    } else if (now >= f.nextMove) {
      const delay = moveDelay(f) * (f.awake ? 1 : 1.6);
      const wander = (): [number, number] | null => { if (rand() >= 0.5) return null; const s = DIRS[Math.floor(rand() * 4) as Direction]; return free(f.x + s[0], f.y + s[1]) ? s : null; };
      if (!f.awake) moveBy(wander(), delay);
      else if (f.behavior === "shoot") {
        const line = clearLine(f, hero, arena.fly, 6);
        if (line) { f = { ...f, dir: dirOf(line[0], line[1]) }; moveBy(null, delay); }
        else if (d <= 2) { const away = chaseStep(hero, f, (x, y) => free(f.x + (x - hero.x), f.y + (y - hero.y))); moveBy(away ? [away[0], away[1]] : wander(), delay); }
        else if (d > 5) moveBy(chaseStep(f, hero, free), delay);
        else moveBy(wander(), delay);
      } else if (f.behavior === "charge") {
        const line = clearLine(f, hero, (x, y) => free(x, y) || (x === hero.x && y === hero.y), 6);
        if (line && d > 1) { f = { ...f, rush: line, dir: dirOf(line[0], line[1]), nextMove: now + 250 }; }
        else moveBy(d > 1 ? chaseStep(f, hero, free) : null, delay * 1.3);
      } else {
        if (d > 1) moveBy(chaseStep(f, hero, free), delay);
        else { f = { ...f, dir: dirOf(Math.sign(hero.x - f.x), Math.sign(hero.y - f.y)) }; moveBy(null, delay); }
      }
    }
    if (f.awake && dist(f, hero) === 1 && now >= f.nextAttack) {
      hurt(foeDamage(stage.power, st), f);
      f = { ...f, nextAttack: now + attackDelay(f), rush: null };
    }
    if (f.awake && f.behavior === "shoot" && now >= f.nextShot) {
      const line = clearLine(f, hero, arena.fly, 6);
      if (line) { shoot(f, line[0], line[1], Math.max(1, Math.round(foeDamage(stage.power, st) * 0.8)), "🪨"); f = { ...f, nextShot: now + ROCK_MS }; }
    }
    if (f.boss && f.awake && now >= f.nextShot) {
      const ax = hero.x - f.x, ay = hero.y - f.y;
      const [dx, dy] = Math.abs(ax) >= Math.abs(ay) ? [Math.sign(ax), 0] : [0, Math.sign(ay)];
      const dmg = Math.max(1, Math.round(foeDamage(stage.power, st) * 0.7));
      shoot(f, dx, dy, dmg, "🔥");
      if (f.stage >= 1) { shoot(f, dy, dx, dmg, "🔥"); shoot(f, -dy, -dx, dmg, "🔥"); }
      if (f.stage >= 2) shoot(f, -dx, -dy, dmg, "🔥");
      f = { ...f, nextShot: now + (SHOT_MS[f.stage] ?? 1300) };
    }
    if (f !== f0) { foes[i] = f; changed = true; }
  });

  // Shots: enemy shots hurt the hero; hero shots hit enemies, boomerangs come back.
  let combat: Combat = { ...c, foes };
  const shots: Shot[] = [];
  const keep = (s: Shot) => shots.push(s);
  for (const s0 of [...c.shots, ...newShots]) {
    let s = s0;
    if (!s.hero) {
      if (s.x === hero.x && s.y === hero.y) { hurt(s.damage, { x: s.x - s.dx, y: s.y - s.dy }); changed = true; continue; }
      if (now >= s.nextMove) { s = { ...s, x: s.x + s.dx, y: s.y + s.dy, left: s.left - 1, nextMove: now + SHOT_STEP_MS }; changed = true; }
      if (!arena.fly(s.x, s.y) || s.left <= 0) { changed = true; continue; }
      if (s.x === hero.x && s.y === hero.y) { hurt(s.damage, { x: s.x - s.dx, y: s.y - s.dy }); changed = true; continue; }
      keep(s); continue;
    }
    if (now < s.nextMove) { keep(s); continue; }
    changed = true;
    if (s.back) {
      const ax = hero.x - s.x, ay = hero.y - s.y;
      if (!ax && !ay) continue;
      const [dx, dy] = Math.abs(ax) >= Math.abs(ay) ? [Math.sign(ax), 0] : [0, Math.sign(ay)];
      s = { ...s, x: s.x + dx, y: s.y + dy, dx, dy, nextMove: now + HERO_SHOT_MS };
      if (s.x === hero.x && s.y === hero.y) continue;
    } else {
      const nx = s.x + s.dx, ny = s.y + s.dy;
      if (!arena.fly(nx, ny) || s.left <= 0) { if (s.boomerang) { keep({ ...s, back: true, nextMove: now + HERO_SHOT_MS }); } continue; }
      s = { ...s, x: nx, y: ny, left: s.left - 1, nextMove: now + HERO_SHOT_MS };
      if (s.left <= 0 && s.boomerang) s = { ...s, back: true };
    }
    const target = combat.foes.find((f) => f.x === s.x && f.y === s.y && !s.hits.includes(f.index));
    if (target) {
      const r = strike(combat, [[s.x, s.y]], st, { mult: s.mult, stun: s.stun, freeze: s.freeze, knock: [s.dx, s.dy], from: { x: s.x - s.dx, y: s.y - s.dy }, now, rand, arena });
      combat = r.combat; events.push(...r.events);
      if (!s.boomerang) continue;
      s = { ...s, back: true, hits: [...s.hits, target.index] };
    }
    if (s.boomerang) {
      const got = combat.drops.filter((d) => d.x === s.x && d.y === s.y);
      if (got.length) { for (const d of got) events.push({ type: "pickup", kind: d.kind, value: d.value, x: d.x, y: d.y }); combat = { ...combat, drops: combat.drops.filter((d) => !got.includes(d)) }; }
    }
    keep(s);
  }
  combat = { ...combat, shots };
  // Bombs explode after their fuse.
  if (combat.bombs.length) {
    const live: Bomb[] = [];
    for (const b of combat.bombs) {
      if (now < b.at) { live.push(b); continue; }
      changed = true;
      events.push({ type: "boom", x: b.x, y: b.y, r: 1 });
      const r = strike({ ...combat, bombs: [] }, [[b.x, b.y], ...ringCells(b)], st, { mult: b.mult, stun: 900, knock: "away", from: b, now, rand, arena });
      combat = { ...r.combat, bombs: combat.bombs }; events.push(...r.events);
    }
    combat = { ...combat, bombs: live };
  }
  // Pick up rubies and hearts by walking over them; old ones fade away.
  if (combat.drops.length) {
    const left = combat.drops.filter((d) => {
      if (d.x === hero.x && d.y === hero.y) { events.push({ type: "pickup", kind: d.kind, value: d.value, x: d.x, y: d.y }); return false; }
      return d.until > now;
    });
    if (left.length !== combat.drops.length) { changed = true; combat = { ...combat, drops: left }; }
  }
  let nextRegen = c.nextRegen;
  if (now >= nextRegen) { nextRegen = now + REGEN_MS; changed = true; if (st.regen > 0) events.push({ type: "heal", amount: st.regen }); }
  if (seq !== c.seq || invulnUntil !== c.invulnUntil) changed = true;
  if (!changed && !events.length) return { combat: c, events };
  return { combat: { ...combat, invulnUntil, nextRegen, seq: Math.max(seq, combat.seq) }, events };
}

/** Zelda-style heart row: `hearts` hearts share the max life, each filled in quarters. */
export function heartFills(hp: number, maxHp: number, hearts: number): number[] {
  const count = Math.max(1, hearts), per = maxHp / count;
  return Array.from({ length: count }, (_, i) => Math.ceil(Math.max(0, Math.min(1, (hp - i * per) / per)) * 4) / 4);
}
