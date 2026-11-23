// The 1000 residents of the Würfelwelten. Generated from pure indexed templates (no stored list):
// every id has its own name, job, line and pixel-elf look, and a fixed home in the open world or a village.
import { type HeroLook } from "./story";
import { NPC_LOOK_COUNTS as LOOK_COUNTS } from "./pixel-elf";
import { WORLDS, CITIES_PER_WORLD } from "./story-content";
import { worldPoints, worldSpawn, guideSpot } from "./story-world";
import { worldMap, T, hash } from "./story-terrain";

export const NPC_COUNT = 1000;
/** This many residents live and walk around in the villages of one open world; the others live inside the village menus. */
export const OPEN_NPCS_PER_WORLD = 100;

const FEMALE = ["Alina", "Brina", "Calia", "Daria", "Elin", "Fiona", "Gwen", "Hanna", "Isla", "Jara", "Kira", "Lena", "Mira", "Nala", "Ola", "Pia", "Rhea", "Sina", "Tara", "Una", "Vela", "Wenna", "Xenia", "Yara", "Zoe"];
const MALE = ["Arin", "Bodo", "Cian", "Darian", "Eron", "Finn", "Gero", "Hagen", "Ivo", "Jorin", "Kian", "Lian", "Malo", "Nils", "Oren", "Piet", "Quinn", "Rasmus", "Silas", "Taro", "Ulf", "Veit", "Wim", "Xaver", "Yorick"];
const FIRST = [...FEMALE, ...MALE];
const LAST = ["Ahornblatt", "Bachlauf", "Birkenhain", "Blütentau", "Dämmerlicht", "Distelfink", "Eichenherz", "Elsterflug", "Farnwisper", "Feuerstein", "Flussperle", "Funkelstein", "Goldähre", "Graufell", "Hagedorn", "Himmelsglanz", "Honigtau", "Kieselbach", "Kleeblatt", "Lindenduft", "Mondsichel", "Moosbart", "Nebelsang", "Nachtigall", "Perlmutt", "Quellwasser", "Rabenfeder", "Rosenhag", "Sandkorn", "Schilfrohr", "Silberquell", "Sonnenfang", "Sternfunke", "Sturmwind", "Tannenzweig", "Tauperle", "Wellenschlag", "Weidenkorb", "Wolkenstreif", "Zaunkönig"];
const ROLES: [string, string][] = [
  ["Bäcker", "Bäckerin"], ["Fischer", "Fischerin"], ["Schmied", "Schmiedin"], ["Gärtner", "Gärtnerin"], ["Barde", "Bardin"], ["Händler", "Händlerin"],
  ["Heiler", "Heilerin"], ["Jäger", "Jägerin"], ["Kartograf", "Kartografin"], ["Koch", "Köchin"], ["Maler", "Malerin"], ["Müller", "Müllerin"],
  ["Schneider", "Schneiderin"], ["Wächter", "Wächterin"], ["Bibliothekar", "Bibliothekarin"], ["Imker", "Imkerin"], ["Sterndeuter", "Sterndeuterin"], ["Tänzer", "Tänzerin"],
  ["Hirte", "Hirtin"], ["Weber", "Weberin"], ["Alchemist", "Alchemistin"], ["Bote", "Botin"], ["Zimmermann", "Zimmerin"], ["Würfelmeister", "Würfelmeisterin"],
];
const GREETINGS = ["Hallo, Fremder!", "Ah, ein echter Held!", "Schön, dich zu sehen.", "Pssst, komm mal her.", "Guten Tag!", "Na, auch unterwegs?", "Willkommen!", "Oh, du bist es!", "Hast du kurz Zeit?", "Sei gegrüßt, Elf!"];
const TIPS: string[][] = [
  ["Die Fische im Fluss würfeln nachts nur Sechsen.", "Hinter dem Wasserfall soll ein Schatz liegen.", "Ich habe eine rote Blume im Osten leuchten sehen …", "Mr. Dixie trägt seinen Glücksrevolver immer links.", "Die Lichtung östlich des Flusses ist heilig. Niemand weiß, warum.", "Iss nie die blauen Pilze. Glaub mir.", "Die alten Ruinen im Norden sind Dungeons voller Gegner.", "Mein Opa hat einmal drei Sechsen hintereinander gewürfelt!"],
  ["Trink genug Wasser, die Sonne hier ist gnadenlos.", "Mrs. Dice tanzt nur bei Vollmond besonders wild.", "Die Skorpione mögen keine Lieder. Sing ihnen eins!", "In der Oase gibt es die kühlsten Waffen.", "Ich habe Sand in Stellen, die ich nicht nennen will.", "Die Pyramiden sind älter als alle Würfel.", "Ein Kamel hat mir mal den Weg gezeigt.", "Wer im Sand würfelt, verliert manchmal den Würfel."],
  ["Bleib auf den Stegen, der Schlamm ist tief.", "Mr. Pentious baut nachts an neuen Erfindungen.", "Die Frösche hier singen im Takt der Würfel.", "Moorhexe Mabel braut die besten Tränke.", "Im Nebel verirrt man sich leicht – folge den Laternen.", "Ich habe einmal ein Krokodil Salat essen sehen.", "Die Schlangen hier zischen in Reimen.", "Der Sumpf riecht nach Abenteuer. Und ein bisschen nach Füßen."],
  ["Zieh dich warm an, die Eisberge sind gemein.", "Mrs. Rolls kegelt mit Schneekugeln so groß wie Häuser.", "Die Pinguine sind die besten Bowler der Welt.", "Ein Yeti hat mir einmal Socken geschenkt.", "Unter dem Eis schlafen uralte Kristalle.", "Heißer Kakao hilft gegen jede Kälte.", "Rutsch nicht auf dem Gletscher aus!", "Das Nordlicht zeigt den Weg zum Boss."],
  ["Die Zahnräder hier drehen sich nie still.", "Mr. Overhaul will alles grau anstreichen.", "Ich habe meine Lieblingsfarbe versteckt, damit er sie nicht findet.", "Die Roboter hier mögen Öl lieber als Rubine.", "Hinter der Fabrik soll ein Vulkan glühen.", "Ein guter Schraubenschlüssel ist Gold wert.", "Die Laserdrohnen piepen, bevor sie schießen.", "Früher war hier ein Blumenfeld, sagt man."],
  ["Lauf nie barfuß über die Steine hier!", "Mrs. Magma badet jeden Morgen in Lava.", "Die Feuerfledermäuse schlafen tagsüber.", "Über die große Brücke kommt man sicher über den Lavafluss.", "Mein Schwert habe ich in einem Krater geschmiedet.", "Der Drachenschädel im Süden ist der Eingang zum Boss.", "Obsidian ist schärfer als jede Klinge.", "Hier ist es so heiß, dass die Würfel schmelzen."],
  ["Schau nicht nach unten, die Wolken sind tief.", "Mr. Nimbus dirigiert jedes Gewitter selbst.", "Die Inseln schweben, weil sie glücklich sind.", "Der Sternenkompass auf dem Platz zeigt immer zum Abenteuer.", "Ich habe einmal eine Wolke gestreichelt. Sie war weich!", "Die Wasserfälle hier fallen in den Himmel.", "Im Wolkenturm wohnt der Wind.", "Pegasi landen nur bei Sonnenschein."],
  ["Ebbe und Flut würfeln hier um die Wette.", "Mrs. Kraken hat acht Arme und keinen Humor.", "Im Schiffswrack liegt ein alter Piratenschatz.", "Die Korallen leuchten nachts in allen Farben.", "Krabben laufen seitwärts – sie haben es eilig.", "Ich sammle Muscheln, die wie Würfel aussehen.", "Der Riesenkrake im Süden schläft fast nie.", "Delfine lieben Würfelspiele."],
  ["Bleib im Licht der Laternen.", "König Chaoswürfel hat alle Bosse erschaffen.", "Die schwarzen Würfel hier beobachten dich.", "Nur ein wahrer Held kann das Schattenreich befreien.", "Meine Laterne brennt seit tausend Jahren.", "Hinter dem Würfeltor wartet der König.", "Komisch… der Baumeister Dicey weiß immer genau, wo die Bosse warten.", "Ich habe gehört, ein heiliges Schwert macht dich unbesiegbar."],
];

export type Npc = { id: number; name: string; role: string; female: boolean; world: number; line: string; look: HeroLook; dir: 0 | 1 | 2 | 3 };
const LOOK_SPACE = LOOK_COUNTS.skin * LOOK_COUNTS.hair * LOOK_COUNTS.outfit * LOOK_COUNTS.style * LOOK_COUNTS.eyes * LOOK_COUNTS.head * LOOK_COUNTS.ears;

export function npcAt(id: number): Npc {
  if (!Number.isInteger(id) || id < 0 || id >= NPC_COUNT) throw new Error(`no npc ${id}`);
  const f = id % FIRST.length, row = Math.floor(id / FIRST.length);
  const female = f < FEMALE.length;
  const world = id % WORLDS.length;
  // 7919 is prime and does not divide LOOK_SPACE, so different ids always get different looks.
  let k = (id * 7919 + 13) % LOOK_SPACE;
  const take = (n: number) => { const v = k % n; k = Math.floor(k / n); return v; };
  const look: HeroLook = { body: female ? 1 : 0, skin: take(LOOK_COUNTS.skin), hair: take(LOOK_COUNTS.hair), outfit: take(LOOK_COUNTS.outfit), style: take(LOOK_COUNTS.style), eyes: take(LOOK_COUNTS.eyes), head: take(LOOK_COUNTS.head), ears: take(LOOK_COUNTS.ears) };
  const role = ROLES[(id * 5 + row) % ROLES.length]![female ? 1 : 0];
  const tips = TIPS[world]!;
  return {
    id, female, world, look, role, dir: (id % 4) as Npc["dir"],
    name: `${FIRST[f]} ${LAST[(row + 3 * f) % LAST.length]}`,
    line: `${GREETINGS[(id * 7) % GREETINGS.length]} Ich bin ${role} hier in ${WORLDS[world]!.name}. ${tips[Math.floor(id / WORLDS.length) % tips.length]}`,
  };
}

export type PlacedNpc = { id: number; x: number; y: number };
type WorldNpcs = { open: PlacedNpc[]; residents: Record<number, number[]> };
const cache = new Map<number, WorldNpcs>();

/** Homes of all residents of one world: 8 live and walk around in each village of the map, the rest live inside the village menus.
 * A home is the step in front of a house door (they live there) or a spot on the village square. */
export function worldNpcs(world: number): WorldNpcs {
  const hit = cache.get(world);
  if (hit) return hit;
  const ids = Array.from({ length: NPC_COUNT }, (_, i) => i).filter((i) => i % WORLDS.length === world);
  const pois = worldPoints(world), spawn = worldSpawn(world);
  const g = guideSpot(world);
  const busy = (x: number, y: number) => [g.home, g.lost].some(([gx, gy]) => Math.max(Math.abs(gx - x), Math.abs(gy - y)) <= 1) || pois.some((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= 1) || Math.max(Math.abs(spawn.x - x), Math.abs(spawn.y - y)) <= 1;
  const m = worldMap(world), cities = m.sites.cities;
  const used = new Set<string>();
  const open: PlacedNpc[] = [];
  for (let j = 0; j < Math.min(ids.length, OPEN_NPCS_PER_WORLD); j++) {
    const spots = villageSpots(world, j % cities.length).filter(([x, y]) => !busy(x, y) && !used.has(`${x},${y}`));
    const spot = spots[0];
    if (!spot) continue;
    used.add(`${spot[0]},${spot[1]}`);
    open.push({ id: ids[j]!, x: spot[0], y: spot[1] });
  }
  const residents: Record<number, number[]> = {};
  ids.slice(open.length).forEach((id, j) => { const city = world * CITIES_PER_WORLD + (j % CITIES_PER_WORLD); (residents[city] ??= []).push(id); });
  const out = { open, residents };
  cache.set(world, out);
  return out;
}

export const VILLAGE_RADIUS = 23;
const spotCache = new Map<string, [number, number][]>();
/** Open spots of a village: door steps first (nearest first), then square and road cells around the centre. */
export function villageSpots(world: number, village: number): [number, number][] {
  const key = `${world}:${village}`;
  const hit = spotCache.get(key);
  if (hit) return hit;
  const m = worldMap(world), c = m.sites.cities[village]!;
  const walk = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && [T.PATH, T.PLAZA, T.GRASS, T.FLOWERS, T.SAND].includes(m.cells[y * m.w + x]! as never);
  const near = (x: number, y: number) => Math.max(Math.abs(x - c[0]), Math.abs(y - c[1])) <= VILLAGE_RADIUS;
  const doors: [number, number][] = m.structures
    .filter((s) => s.kind === "house" || s.kind === "shop" || s.kind === "home" || s.kind === "smithy")
    .map((s) => [s.x + Math.floor(s.w / 2), s.y + s.h] as [number, number])
    .filter(([x, y]) => near(x, y) && walk(x, y))
    .sort((a, b) => Math.abs(a[0] - c[0]) + Math.abs(a[1] - c[1]) - (Math.abs(b[0] - c[0]) + Math.abs(b[1] - c[1])));
  const ground: [number, number][] = [];
  for (let y = c[1] - VILLAGE_RADIUS; y <= c[1] + VILLAGE_RADIUS; y++) for (let x = c[0] - VILLAGE_RADIUS; x <= c[0] + VILLAGE_RADIUS; x++) {
    const t = m.cells[y * m.w + x];
    if ((t === T.PLAZA || t === T.PATH) && walk(x, y) && !doors.some(([dx, dy]) => dx === x && dy === y)) ground.push([x, y]);
  }
  ground.sort((a, b) => hash(world * 31 + village, a[0], a[1]) - hash(world * 31 + village, b[0], b[1]));
  const out = [...doors, ...ground];
  spotCache.set(key, out);
  return out;
}

/** What each job does when its villager is at work (same order as the job list). */
const ROLE_WORK = ["🍞", "🎣", "🔨", "🌻", "🎵", "💰", "🌿", "🏹", "🗺️", "🍲", "🎨", "🌾", "🧵", "🛡️", "📖", "🐝", "✨", "💃", "🐑", "🧶", "⚗️", "✉️", "🪚", "🎲"];
export function npcWorkEmoji(id: number) {
  const row = Math.floor(id / FIRST.length);
  return ROLE_WORK[(id * 5 + row) % ROLES.length]!;
}

export const cityResidents = (city: number) => worldNpcs(Math.floor(city / CITIES_PER_WORLD)).residents[city] ?? [];
/** The closest open-world resident within one step (diagonals count). */
export function nearbyNpc(world: number, x: number, y: number): PlacedNpc | null {
  let best: PlacedNpc | null = null, bestD = Infinity;
  for (const n of worldNpcs(world).open) {
    if (Math.max(Math.abs(n.x - x), Math.abs(n.y - y)) > 1) continue;
    const d = Math.abs(n.x - x) + Math.abs(n.y - y);
    if (d < bestD) { best = n; bestD = d; }
  }
  return best;
}
export const meetNpc = <S extends { metNpcs: number[] }>(s: S, id: number): S => (s.metNpcs.includes(id) ? s : { ...s, metNpcs: [...s.metNpcs, id] });
