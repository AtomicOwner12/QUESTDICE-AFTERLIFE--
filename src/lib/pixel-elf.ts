// Retro 16x24 pixel elves in handheld Minish-Cap proportions: a big round head with large eyes,
// a slim body and short legs. Composed from small palette-swapped layers (body, ears, hair,
// headwear, hero gear); coloured outlines and a 3-tone light from the top left are derived
// automatically, so every look (hero, 1000 residents, children) gets the same shading.
// Pure data + functions so SSR and the browser draw the exact same sprite.
import type { HeroLook } from "./story";

export type ElfDir = 0 | 1 | 2 | 3; // down, left, right, up
export const ELF_W = 16;
export const ELF_H = 24;
/** The HD sprites are upscaled this many times (Scale2x) for smooth, rounded outlines. */
export const ELF_HD = 2;
/** Classic green-cap Link: blond hair, blue eyes, long elf ears, green tunic and cap. New heroes start like this. */
export const LINK_PRESET: HeroLook = { body: 0, skin: 1, hair: 0, style: 1, eyes: 1, outfit: 0, head: 1, ears: 0 };
/** The spiky-haired battle hero: spiky blond hair, glowing eyes and dark battle garb with one shoulder guard. */
export const HERO_PRESET: HeroLook = { body: 0, skin: 1, hair: 0, style: 6, eyes: 6, outfit: 8, head: 0, ears: 0 };
/** The silver-haired swordsman: waist-long silver hair, green cat eyes, long black coat with two big silver shoulder guards and a very long katana. */
export const SILVER_PRESET: HeroLook = { body: 0, skin: 0, hair: 3, style: 7, eyes: 7, outfit: 9, head: 0, ears: 2 };
/** Outfit index of the long black coat (two shoulder guards, gloves, long katana instead of shield and sword). */
export const COAT_OUTFIT = 9;
/** Residents keep the original look space; the hero-only options (spiky hair, battle garb, glowing eyes) stay unique to the hero. */
export const NPC_LOOK_COUNTS = { skin: 6, hair: 10, outfit: 8, style: 6, body: 2, eyes: 6, head: 5, ears: 2 };

export const SKIN_NAMES = ["Porzellan", "Hell", "Sommer", "Bronze", "Kakao", "Dunkel"];
export const HAIR_NAMES = ["Gold", "Dunkelbraun", "Kupfer", "Silber", "Nachtblau", "Rosa", "Mintgrün", "Himmelblau", "Schwarz", "Lavendel"];
export const STYLE_NAMES = ["Lang", "Kurz", "Zopf", "Wilde Mähne", "Dutt", "Pferdeschwanz", "Stachelkopf", "Silbermähne"];
export const EYE_NAMES = ["Smaragd", "Saphir", "Bernstein", "Violett", "Braun", "Eisblau", "Leuchtblau", "Mako-Grün"];
export const OUTFIT_NAMES = ["Waldgrün", "Königsblau", "Beerentunika", "Abenteurerbraun", "Schattengrau", "Sonnenocker", "Rubinrot", "Mondweiß", "Kampfgewand", "Schwarzer Mantel"];
export const HEAD_NAMES = ["Keine", "Zipfelmütze", "Diadem", "Stirnband", "Blumenkranz"];
export const BODY_NAMES = ["Elf", "Elfe"];
export const EAR_NAMES = ["Lange Spitzohren", "Kurze Spitzohren", "Unter dem Haar"];

const SKIN = [["#fbe0c8", "#eab896"], ["#f8cfa4", "#e0a478"], ["#e6ab7e", "#c4845a"], ["#c48658", "#9c623c"], ["#94603e", "#70432b"], ["#66432e", "#4a2e20"]];
const HAIR = [["#f8dc48", "#d09a1c"], ["#6a3c24", "#422214"], ["#d8602c", "#963414"], ["#eceff5", "#a9b0c2"], ["#323060", "#191734"], ["#f498cc", "#bc5c9a"], ["#8ce0b4", "#4ea47e"], ["#88caf4", "#4c8cc8"], ["#2a2630", "#0f0d12"], ["#c2a8f0", "#8a70c8"]];
const EYES = ["#1f8a4c", "#2a5ee0", "#c0801a", "#7c44cc", "#5e361c", "#4cb4e6", "#46e0ff", "#4ee08a"];
const OUTFIT = [["#58c040", "#2c8a2c"], ["#3c70c8", "#244484"], ["#b84488", "#7a2a5a"], ["#a0683c", "#6a4224"], ["#5e6a7a", "#3a414e"], ["#d8b440", "#987a20"], ["#d43c40", "#8a2228"], ["#f0ece0", "#b8b0a0"], ["#2c3048", "#171a2a"], ["#3c3846", "#211e2a"]];

type Layer = readonly string[];
const pad = (rows: Layer) => [...rows, ...Array(ELF_H - rows.length).fill(".".repeat(ELF_W))];

// ---- bodies: big head (rows 3-13), slim body (rows 14-18), short legs (rows 19-23) ----
const FRONT_TOP = [
  "................",
  "................",
  "................",
  ".....oooooo.....",
  "...oossssssoo...",
  "..osssssssssso..",
  "..osssssssssso..",
  "..osssssssssso..",
  "..ossoossoosso..",
  "..osseesseesso..",
  "..osseesseesso..",
  "..oSsssmmsssSo..",
  "...oSssssssSo...",
  "....ooSSSSoo....",
  "....oTttttTo....",
  "...opTttttTpo...",
  "...opTttttTpo...",
  "...osbbggbbso...",
  "...ooTttttToo...",
];
// Walk frames: 0 = standing, then a 4-step cycle 1 = stride A, 2 = passing, 3 = stride B, 4 = passing.
const FRONT_LEGS = ["....oTTTTTTo....", "....oBBooBBo....", "....oBBooBBo....", "...oBBBooBBBo...", "...oooo..oooo..."];
// Front/back strides: one boot lifts (swinging forward), the other stays planted, then they swap.
const FRONT_STRIDE_A = ["....oTTTTTTo....", "...oBBBooBBo....", "...ooooooBBo....", "........oBBBo...", "........oooo...."];
const FRONT_STRIDE_B = ["....oTTTTTTo....", "....oBBooBBBo...", "....oBBoooooo...", "...oBBBo........", "...oooo........."];
const FRONT_DRESS = ["....oTTTTTTo....", "...oTTTTTTTTo...", "...oooooooooo...", "....oBBooBBo....", "....oooooooo...."];
const FRONT_DRESS_A = ["....oTTTTTTo....", "...oTTTTTTTTo...", "...oooooooooo...", "........oBBo....", "........oooo...."];
const FRONT_DRESS_B = ["....oTTTTTTo....", "...oTTTTTTTTo...", "...oooooooooo...", "....oBBo........", "....oooo........"];

// Long black coat down to the ankles, open in front so the legs show; the hem sways with the stride.
const COAT_FRONT = ["...oTtqqqqtTo...", "..oTtoqqqqotTo..", "..oTtoBooBotTo..", ".oTTooBooBooTTo.", ".ooo.oooooo.ooo."];
const COAT_FRONT_A = ["...oTtqqqqtTo...", "..oTtoqqqqotTo..", "..oTtoBooqotTo..", ".oTTooooooBoTTo.", ".ooo...ooooo.oo."];
const COAT_FRONT_B = ["...oTtqqqqtTo...", "..oTtoqqqqotTo..", "..oTtoqooBotTo..", ".oTToBooooooTTo.", ".oo.ooooo...ooo."];
const COAT_SIDE = [".....oTttTTo....", ".....oTttTTTo...", "....oTtttTTTo...", "....oTTTTTTTTo..", ".....ooBBoooooo."];
const COAT_SIDE_A = [".....oTttTTo....", ".....oTttTTTo...", "....oTtttTTTTo..", "...oBoTTTTTTTTo.", "...ooooooooooooo"];
const COAT_SIDE_B = [".....oTttTTo....", ".....oTttTTTo...", "....oTtttTTTo...", "....oTTTTTTTToBo", ".....ooooooooooo"];
// Open collar with crossed straps, silver belt and black gloves.
const COAT_CHEST = { front: [...Array<string>(14).fill(""), "....oTtsstTo....", "...opTqssqTpo...", "...opTsqqsTpo...", "...onaaAAaano..."], side: [...Array<string>(14).fill(""), ".....oTstTo.....", ".....oTqttTo....", ".....oTtqtTo....", ".....onaaaao...."] };

const SIDE_TOP = [
  "................",
  "................",
  "................",
  ".....oooooo.....",
  "....ossssssoo...",
  "...ossssssssso..",
  "..osssssssssso..",
  "..osssssssssso..",
  "..ooosssssssso..",
  "..oeesssssssso..",
  "..oEesssssssso..",
  ".osssssssssSo...",
  "..omssssssSo....",
  "...ooSSSSoo.....",
  ".....oTtttTo....",
  ".....oTpttTo....",
  ".....oTsttTo....",
  ".....obbbbbo....",
  ".....oTtttTo....",
];
const SIDE_LEGS = [".....oTTTTTo....", "......oBBBo.....", "......oBBBo.....", ".....oBBBBo.....", ".....oooooo....."];
const SIDE_STRIDE_A = [".....oTTTTTo....", ".....oBBoQQo....", "....oBBo.oQQo...", "...oBBBo..oQQo..", "...oooo...oooo.."];
const SIDE_PASS_A = [".....oTTTTTo....", "......oBBQo.....", "......oBBoQo....", ".....oBBBooo....", ".....ooooo......"];
const SIDE_STRIDE_B = [".....oTTTTTo....", ".....oQQoBBo....", "....oQQo.oBBo...", "...oQQQo..oBBo..", "...oooo...oooo.."];
const SIDE_PASS_B = [".....oTTTTTo....", "......oQQBo.....", "......oQQoBo....", ".....oQQQooo....", ".....ooooo......"];
const SIDE_DRESS = [".....oTTTTTo....", "....oTTTTTTTo...", "....ooooooooo...", "......oBBBo.....", "......ooooo....."];
const SIDE_DRESS_A = [".....oTTTTTo....", "....oTTTTTTTo...", "....ooooooooo...", "....oBBo.oQQo...", "....oooo.oooo..."];
const SIDE_DRESS_B = [".....oTTTTTo....", "....oTTTTTTTo...", "....ooooooooo...", "....oQQo.oBBo...", "....oooo.oooo..."];
/** Side-view arm rows 15–17: the hand swings forward or back opposite to the leading leg. */
const SIDE_ARM_FWD = [".....optttTo....", "....ostttTo.....", ".....obbbbbo...."];
const SIDE_ARM_BACK = [".....oTttpTo....", ".....oTttTso....", ".....obbbbbo...."];

const BACK_TOP = [
  "................",
  "................",
  "................",
  ".....oooooo.....",
  "...oohhhhhhoo...",
  "..ohhhhhhhhhho..",
  "..ohhhhhhhhhho..",
  "..ohhhhhhhhhho..",
  "..ohhhhhhhhhho..",
  "..ohHhhhhhhHho..",
  "..ohhhhhhhhhho..",
  "..oHhhhhhhhhHo..",
  "...oHhhhhhhHo...",
  "....ooSSSSoo....",
  "....oTttttTo....",
  "...opTttttTpo...",
  "...opTttttTpo...",
  "...osbbbbbbso...",
  "...ooTttttToo...",
];

// ---- ears (drawn after hair so they poke through): long Minish ears point out sideways ----
const EARS: Record<"long" | "short", { front: Layer; side: Layer }> = {
  long: {
    front: ["", "", "", "", "", "", "", "", "o..............o", "oso..........oso", "oSss........ssSo", ".oo..........oo."],
    side: ["", "", "", "", "", "", "", "...............o", "............ooso", "...........osSo.", "...........oso..", "............o..."],
  },
  short: {
    front: ["", "", "", "", "", "", "", "", "", ".o............o.", ".so..........os.", "..o..........o.."],
    side: ["", "", "", "", "", "", "", "", "", "............oo..", "...........oso..", "............o..."],
  },
};

// ---- hair styles per view (front / side-left / back extra), drawn over the big head ----
type Hair = { front: Layer; side: Layer; back: Layer };
const SHORT_FRONT = ["", "", "", ".....hhhhhh.....", "...hhhhhhhhhh...", "..hhhhhhhhhhhh..", "..hhhhhhhhhhhh..", "..hhHhhhhhhHhh..", "..hhhH.hhH..hh..", "..hH........Hh..", "..h..........h.."];
const SHORT_SIDE = ["", "", "", ".....hhhhhh.....", "....hhhhhhhhh...", "...hhhhhhhhhhh..", "..hhhhhhhhhhhh..", "..hhhhhhhhhhhh..", "..hh..hhhhhhhh..", "........hhhhhh..", ".........hhhhh..", "..........hhH..."];
const HAIRS: Hair[] = [
  { // Lang
    front: ["", "", "", ".....hhhhhh.....", "...hhhhhhhhhh...", "..hhhhhhhhhhhh..", "..hhhhhhhhhhhh..", "..hhhHhhhhHhhh..", "..hhH..hh..Hhh..", "..hh........hh..", "..hh........hh..", "..hh........hh..", "..hh........hh..", "..hH........Hh..", "..hH........Hh..", "..hH........Hh..", "...H........H..."],
    side: ["", "", "", ".....hhhhhh.....", "....hhhhhhhhh...", "...hhhhhhhhhhh..", "..hhhhhhhhhhhhh.", "..hhhhhhhhhhhhh.", "..hh..hhhhhhhhh.", "........hhhhhhh.", "........hhhhhhh.", ".........hhhhhh.", ".........hHhhhH.", "..........hHhhH.", "..........HhhH..", "...........HH..."],
    back: ["", "", "", "", "", "", "", "", "", "", "", "", "", "...hhhhhhhhhh...", "...hhhhhhhhhh...", "...hHhhhhhhHh...", "....HhhhhhhH...."],
  },
  { // Kurz (Link-style bangs and side locks)
    front: SHORT_FRONT,
    side: SHORT_SIDE,
    back: [],
  },
  { // Zopf
    front: [...SHORT_FRONT, ".............hh.", ".............Hh.", ".............hH.", ".............Hh.", ".............hh.", "............ohho", ".............HH."],
    side: [...SHORT_SIDE, "...........hHh..", "...........hhH..", "...........hHh..", "...........hhH..", "...........ohho.", "............HH.."],
    back: ["", "", "", "", "", "", "", "", "", "", "", "", "", "......hHhh......", "......hhHh......", "......hHhh......", "......hhHh......", "......ohho......", "......oHHo......"],
  },
  { // Wilde Mähne
    front: ["", "", "....h.hh.hh.h...", "...hhhhhhhhhhh..", "..hhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhHhhhhhhHhhh.", ".hhhH..hh..Hhhh.", ".hh..........hh.", ".hh..........hh.", "hhh..........hhh", ".hH..........Hh.", "..H..........H.."],
    side: ["", "", ".....h.hh.h.....", "....hhhhhhhhh...", "...hhhhhhhhhhhh.", "..hhhhhhhhhhhhhh", "..hhhhhhhhhhhhhh", "..hhhhhhhhhhhhhh", "..hh..hhhhhhhhhh", "........hhhhhhhh", ".......hhhhhhhh.", "........hhhhhhhh", "........hHhhhHh.", ".........HhhHh.."],
    back: ["", "", "....h.hh.hh.h...", "...hhhhhhhhhhh..", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", "hhhhhhhhhhhhhhhh", ".hHhhhhhhhhhhHh.", ".hHhhHhhhhHhhHh.", "..H..H.HH.H..H.."],
  },
  { // Dutt
    front: ["", "......hhhh......", ".....hHhhHh.....", ...SHORT_FRONT.slice(3)],
    side: ["", ".........hhhh...", "........hHhhHh..", ...SHORT_SIDE.slice(3)],
    back: ["", "......hhhh......", ".....hHhhHh.....", "", "", "", "", "", "", "", "", "", "....HhhhhhhH...."],
  },
  { // Pferdeschwanz
    front: [...SHORT_FRONT.slice(0, 9), "..hH.........hh.", ".............hh.", ".............hH.", "............hH.."],
    side: ["", "", "", ".....hhhhhh.....", "....hhhhhhhhh...", "...hhhhhhhhhhh..", "..hhhhhhhhhhhhhh", "..hhhhhhhhhhhhhh", "..hh..hhhhhhhhhh", "........hhhhhhhh", "...........hhhhh", "............hhhh", "............hhH.", "...........hhH..", "...........hH..."],
    back: ["", "", "", "", "", "", "", "", "......hhhh......", "......hHhh......", "......hhHh......", ".......hHh......", ".......hh.......", ".......hH.......", ".......hh.......", ".......H........"],
  },
  { // Stachelkopf: tall swept spikes, separated locks and pointed bangs.
    front: [".......h....h...", "....h.hhh..hh...", "...hhhhhhhhhh.h.", "..hhhhHhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhHhhhhHhhhHhh.", "..hhhHhhhHhhhh..", "..hhH.Hh..hH.hh.", "..hh...h....hh..", ".hh..........hh.", "..h..........h.."],
    side: [".........h...h..", "......h.hhh.hh..", ".....hhhhhhhhhh.", "...hhhhHhhhhhhhh", "..hhhHhhhhHhhhh.", "..hhhhhhhhhhhhhh", "..hhhhhhhhhhhhh.", ".hhhhhhhhhhhhhhh", "..hh..hhhhhhhhh.", "..h.....hhhHhhh.", "........hhhhHhh.", ".........hhhhh..", "..........H.H..."],
    back: ["....h....h......", "...hh..hhh.h....", ".h.hhhhhhhhhh...", ".hhhhhhhhHhhhh..", "hhhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhhh", ".hhhhhhhhhhhhhh.", ".hhHhhhhhhhhHhh.", "..hhhhhhhhhhhh..", "..hHhhhhhhhhHh..", "...hhHhhhHhhh...", "...H.hh.hh.hH...", "....HH.H.HH....."],
  },
  { // Silbermähne: a strand sweeping up from the parting (side view), long bangs framing a stern face,
    // strand-textured hair falling to the knees and blowing out to one side.
    front: ["", "", "", ".....hhhhhh.....", "...hhhhhhhhhh...", "..hhhHhhhhHhhh..", "..hhHhhHHhhHhh..", ".hhHhH....HhHhh.", ".hHhH......HhHh.", ".hHH........HHh.", ".hHh........hHh.", ".hHhH......HhHh.", ".hHh........hHh.", ".hHh........hHh.", "hhHh........hHh.", "hhHh........hHh.", "HhH..........Hh.", "hHh..........Hh.", "hhH..........Hh.", "hHh..........H..", "Hh..............", "h.H............."],
    side: ["", "....h...........", "....hhh.........", ".....hhhhhh.....", "....hhhhhhhhh...", "...hhhhHhhhhhh..", "..hhhhhhhHhhhhh.", "..hhhhhhhhHhhhh.", "..hh..hhhhhHhhh.", "......h.hhhhHhh.", "......H.hhhhhHh.", ".......h.hHhhhHh", ".........hhHhhHh", ".........hhHhhHh", "..........hhHhhH", "..........hHhhHh", "..........hhHhhH", "...........hHhhH", "...........hhHhh", "...........hHhhH", "............hHhh", ".............H.H"],
    back: ["", "", "", "", ".......HH.......", ".......HH.......", "", "", "", "", "", "", "", "..hhhhhhhhhhhh..", "..hHhhHhhHhhHh..", "..hHhhHhhHhhHh..", "..hhHhhHhhHhhHh.", "...hHhhHhhHhhHh.", "...hhHhhHhhHhHhh", "....hHhhHhhHhhHh", "....hHhhHhhHhhH.", ".....Hh.Hh.Hh.H."],
  },
];

// ---- headwear (drawn last). Zipfelmütze is the classic floppy green cap whose tip falls behind the head. ----
const HEADS: ({ front: Layer; side: Layer; back: Layer } | null)[] = [
  null,
  {
    front: ["......cccc......", "....cccccccc....", "...ccccccccccc..", "..cccccccccccccc", "..CCCCCCCCCCCCcC", "..............cC", "...............C"],
    side: [".....cccc.......", "....ccccccc.....", "...cccccccccc...", "..ccccccccccccc.", "..CCCCCCCCccccC.", "...........cccC.", "............ccC.", ".............C.."],
    back: ["......cccc......", "....cccccccc....", "...cccccccccc...", "..cccccccccccc..", "..CCCCCCCCCCCC..", ".......ccc......", "........cC......", ".........C......"],
  },
  {
    front: ["", "", "", "", "", "", "..yyyyyyyyyyyy..", ".......gg......."],
    side: ["", "", "", "", "", "", "..yyyyyyyyyyyy..", "..g............."],
    back: ["", "", "", "", "", "", "..yyyyyyyyyyyy.."],
  },
  {
    front: ["", "", "", "", "", "", "", "..CCCCCCCCCCCC..", "..............C.", "..............C."],
    side: ["", "", "", "", "", "", "", "..CCCCCCCCCCCC..", "............CC..", "............C..."],
    back: ["", "", "", "", "", "", "", "..CCCCCCCCCCCC..", ".......CC.......", ".......C.C......"],
  },
  {
    front: ["", "", "", "", "...f.l.f.l.f....", "..lflflflflflf.."],
    side: ["", "", "", "", "...f.l.f.l......", "..lflflflflfl..."],
    back: ["", "", "", "", "...f.l.f.l.f....", "..lflflflflflf.."],
  },
];

// ---- hero gear: small shield and sword, like a classic green-tunic adventurer ----
const SHIELD: { front: Layer; side: Layer; back: Layer } = {
  front: [...Array<string>(14).fill(""), "...........oooo.", "..........oKkkKo", "..........oKkgKo", "..........oKkkKo", "...........oKKo.", "............oo.."],
  side: [...Array<string>(14).fill(""), "..oKKo..........", ".oKkkKo.........", ".oKkgKo.........", ".oKkkKo.........", "..oKKo.........."],
  back: [...Array<string>(14).fill(""), ".....oooooo.....", "....oKkkkkKo....", "....oKkggkKo....", "....oKkkkkKo....", ".....oKkkKo.....", "......oKKo......", ".......oo......."],
};
const SWORD: { front: Layer; side: Layer; back: Layer } = {
  front: [...Array<string>(17).fill(""), ".gyg............", ".owo............", ".owo............", ".owo............", "..W............."],
  side: [...Array<string>(12).fill(""), "............gy..", "...........ob...", "..........ob...."],
  back: [...Array<string>(12).fill(""), "............og..", "...........obo..", "..........obo...", ".........obo....", "........obo.....", ".......obo......", "........o......."],
};
// A very long, thin katana held low in the hand instead of shield and sword.
const KATANA: { front: Layer; side: Layer; back: Layer } = {
  front: [...Array<string>(17).fill(""), "..........oggo..", "............ojo.", "............ojo.", ".............ojo", ".............ojo", "..............oj", "...............W"],
  side: [...Array<string>(17).fill(""), "....oggo........", "....ojo.........", "....ojo.........", "...ojo..........", "...ojo..........", "..ojo...........", "..Wo............"],
  back: [...Array<string>(17).fill(""), "..oggo..........", ".ojo............", ".ojo............", "ojo.............", "ojo.............", "jo..............", "W..............."],
};
// Two big silver shoulder guards for the black coat.
const PAULDRONS: { front: Layer; side: Layer; back: Layer } = {
  front: [...Array<string>(13).fill(""), ".oooo......oooo.", "owwaAo....oAawwo", "oaAaAo....oAaAao", "oAAAAo....oAAAAo", ".oaAo......oAao."],
  side: [...Array<string>(13).fill(""), ".....oooooo.....", "....owwaaaAo....", "....oaaAaaAo....", "....oAAAAAAo....", ".....oAAAAo....."],
  back: [...Array<string>(13).fill(""), ".oooo......oooo.", "oawwAo....oAwwao", "oaAaAo....oAaAao", "oAAAAo....oAAAAo", ".oaAo......oAao."],
};
/** Stern face for the sharp Mako eyes: slanted brows, narrow lids, a one-pixel eye and a closed mouth. */
const STERN_FACE = {
  front: [...Array<string>(8).fill(""), "..osoossssooso..", "..ossoossoosso..", "..osseesseesso..", "..oSssssSsssSo.."],
  side: [...Array<string>(8).fill(""), "..osssssssssso..", "..ooosssssssso..", "..oeesssssssso..", ".osssssssssSo...", "..oSssssssSo...."],
};
/** The two long front bangs fall over the chest, in front of the shoulder guards. */
const FRONT_BANGS = [...Array<string>(14).fill(""), ".....h....h.....", "......h..h......", "......hhhh......"];
// A single anatomical shoulder: front/back placements are opposite.
const PAULDRON: { front: Layer; side: Layer; back: Layer } = {
  front: [...Array<string>(14).fill(""), "..oooo..........", ".oaaAAo.........", "..oAAo.........."],
  side: [...Array<string>(14).fill(""), ".....oooo.......", "....oaaAAo......", ".....oAAo......."],
  back: [...Array<string>(14).fill(""), "..........oooo..", ".........oAAaao.", "..........oAAo.."],
};

function stamp(base: string[], layer: Layer) {
  layer.forEach((row, y) => {
    if (!row || y >= ELF_H) return;
    const chars = base[y]!.split("");
    for (let x = 0; x < ELF_W && x < row.length; x++) if (row[x] !== ".") chars[x] = row[x]!;
    base[y] = chars.join("");
  });
}
const mirror = (rows: string[]) => rows.map((r) => r.split("").reverse().join(""));

export type WalkFrame = 0 | 1 | 2 | 3 | 4;
export const WALK_FRAMES: readonly WalkFrame[] = [1, 2, 3, 4];
const EMPTY = ".".repeat(ELF_W);
const down = (layer: Layer): Layer => ["", ...layer];

/** Composed sprite rows (palette letters), deterministic for a look, direction and walk frame. */
export function elfPixels(look: HeroLook, dir: ElfDir, frame: WalkFrame = 0, gear: boolean | "swing" = false): string[] {
  const female = look.body === 1;
  const view = dir === 0 ? "front" : dir === 3 ? "back" : "side";
  const stride = frame === 1 || frame === 3;
  const top = view === "front" ? FRONT_TOP : view === "back" ? BACK_TOP : SIDE_TOP;
  const legs = view === "side"
    ? female ? [SIDE_DRESS, SIDE_DRESS_A, SIDE_DRESS, SIDE_DRESS_B, SIDE_DRESS][frame]! : [SIDE_LEGS, SIDE_STRIDE_A, SIDE_PASS_A, SIDE_STRIDE_B, SIDE_PASS_B][frame]!
    : female ? [FRONT_DRESS, FRONT_DRESS_A, FRONT_DRESS, FRONT_DRESS_B, FRONT_DRESS][frame]! : [FRONT_LEGS, FRONT_STRIDE_A, FRONT_LEGS, FRONT_STRIDE_B, FRONT_LEGS][frame]!;
  const body = [...top];
  if (view === "side" && stride) { const arm = frame === 1 ? SIDE_ARM_BACK : SIDE_ARM_FWD; body[15] = arm[0]!; body[16] = arm[1]!; body[17] = arm[2]!; }
  // On a stride the body dips one pixel, which gives the walk a soft bounce.
  const upper = stride ? [EMPTY, ...body.slice(0, body.length - 1)] : body;
  const coat = look.outfit === COAT_OUTFIT;
  const coatLegs = view === "side" ? [COAT_SIDE, COAT_SIDE_A, COAT_SIDE, COAT_SIDE_B, COAT_SIDE][frame]! : [COAT_FRONT, COAT_FRONT_A, COAT_FRONT, COAT_FRONT_B, COAT_FRONT][frame]!;
  const rows = pad([...upper, ...(coat ? coatLegs : legs)]);
  if (coat && view !== "back") stamp(rows, (stride ? down : (l: Layer) => l)(COAT_CHEST[view === "side" ? "side" : "front"]));
  if (look.outfit === 8) for (let y = 0; y < rows.length; y++) rows[y] = rows[y]!.replace(/b/g, "x");
  const L = stride ? down : (l: Layer) => l;
  if (female && view === "front") stamp(rows, L(["", "", "", "", "", "", "", "", "....o......o....", "", "", ".......rr......."]));
  if (female && view === "side") stamp(rows, L(["", "", "", "", "", "", "", "", "..o.............", "", "", "", "...r............"]));
  if (look.eyes === 7 && view !== "back") stamp(rows, L(STERN_FACE[view === "side" ? "side" : "front"]));
  const hair = HAIRS[look.style % HAIRS.length]!;
  stamp(rows, L(hair[view]));
  // Very long hair reaches past the head outline, so it gets its own dark outline.
  if (look.style === 7) {
    const isHair = (x: number, y: number) => /[hH]/.test(rows[y]?.[x] ?? "");
    const edge: [number, number][] = [];
    for (let y = 0; y < ELF_H; y++) for (let x = 0; x < ELF_W; x++) {
      if (rows[y]![x] === "." && (isHair(x - 1, y) || isHair(x + 1, y) || isHair(x, y - 1) || isHair(x, y + 1))) edge.push([x, y]);
    }
    for (const [x, y] of edge) rows[y] = rows[y]!.slice(0, x) + "o" + rows[y]!.slice(x + 1);
  }
  if (look.ears !== 2) stamp(rows, L(EARS[look.ears === 1 ? "short" : "long"][view === "side" ? "side" : "front"]));
  const head = HEADS[look.head % HEADS.length];
  if (head) stamp(rows, L(head[view]));
  // Front/back: one hand swings low on each stride.
  if (view !== "side" && stride) {
    const fist = coat ? "n" : "s";
    const hand = frame === 1 ? `...........${fist}o...` : `...o${fist}...........`;
    const sole = frame === 1 ? "...........oo..." : "...oo...........";
    stamp(rows, [...Array(18).fill(""), hand, sole]);
  }
  if (coat) {
    stamp(rows, L(PAULDRONS[view]));
    if (look.style === 7 && view === "front") stamp(rows, L(FRONT_BANGS));
    // A dark crimson sheen runs down the coat's front edges; silver buckles sit on the boots.
    for (let y = 19; y < ELF_H; y++) rows[y] = rows[y]!.replace(/Tt/g, "Tv").replace(/tT/g, "vT");
    if (view === "front") rows[21] = rows[21]!.replace(/B/g, "a");
    if (gear && gear !== "swing") stamp(rows, L(KATANA[view]));
  } else if (gear) {
    stamp(rows, L(SHIELD[view]));
    // While swinging, the sword is in the hand (drawn by the page), so the sheathed sword disappears.
    if (gear !== "swing") stamp(rows, L(SWORD[view]));
  }
  if (look.outfit === 8) stamp(rows, L(PAULDRON[view]));
  return dir === 2 ? mirror(rows) : rows;
}

/** Palette for a look: letter → colour. */
export function elfPalette(look: HeroLook): Record<string, string> {
  const [skin, skinShade] = SKIN[look.skin % SKIN.length]!;
  const [hair, hairShade] = HAIR[look.hair % HAIR.length]!;
  const [cloth, clothShade] = OUTFIT[look.outfit % OUTFIT.length]!;
  const capColor = look.head === 3 ? clothShade : cloth;
  const battle = look.outfit === 8;
  const coat = look.outfit === COAT_OUTFIT;
  return {
    o: "#2b1d1f", s: skin!, S: skinShade!, h: hair!, H: hairShade!, e: EYES[look.eyes % EYES.length]!, E: "#ffffff",
    m: "#b5655a", r: "#d9677a", t: cloth!, T: clothShade!, b: "#6b4a2b", g: "#e8c25a", p: battle ? "#25283b" : coat ? cloth! : "#f4ecd6", B: battle || coat ? "#141623" : "#8a4a2a",
    c: capColor!, C: clothShade!, y: "#f0cc56", f: "#f39ac0", l: "#5fae5a", q: battle ? "#1b1e30" : coat ? "#17151d" : "#cbbf9f", Q: battle || coat ? "#0e101b" : "#5a2c18",
    k: "#3d6fd6", K: "#d9b444", w: "#eef3fa", W: "#9fb0c6", j: "#e4ecf6",
    x: "#b8263a", X: "#77192b", v: "#5e2a44", a: "#cbd4e3", A: "#77859e", n: look.outfit === COAT_OUTFIT ? "#24222c" : skin!,
  };
}

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** Mixes two #rrggbb colours (t = share of the second one). */
export function mix(a: string, b: string, t: number) {
  const x = hex(a), y = hex(b);
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
/** Fills that get the automatic highlight (top/left edge) and shade (bottom/right edge). */
const SHADED = new Set(["s", "h", "t", "c", "p", "k", "B", "q", "x", "a"]);
const OUTLINE_INK = "#1e1424";

/** Final colour of every pixel: selective outlines take a dark tone of the fill they touch, fills get a soft 3-tone light. */
export function elfColors(look: HeroLook, dir: ElfDir, frame: WalkFrame = 0, gear: boolean | "swing" = false): (string | null)[][] {
  const pal = elfPalette(look);
  const rows = elfPixels(look, dir, frame, gear);
  const ch = (x: number, y: number) => rows[y]?.[x] ?? ".";
  const lightFromLeft = dir !== 2;
  return rows.map((row, y) => row.split("").map((c, x) => {
    if (c === ".") return null;
    const base = pal[c] ?? "#ff00ff";
    if (c === "o") {
      const touch = [ch(x, y + 1), ch(x, y - 1), ch(x - 1, y), ch(x + 1, y)].find((n) => n !== "." && n !== "o" && pal[n]);
      return touch ? mix(pal[touch]!, OUTLINE_INK, 0.68) : OUTLINE_INK;
    }
    if (!SHADED.has(c)) return base;
    const up = ch(x, y - 1), down = ch(x, y + 1), side = ch(lightFromLeft ? x - 1 : x + 1, y), away = ch(lightFromLeft ? x + 1 : x - 1, y);
    if (up === "o" || up === ".") return mix(base, "#fff8e8", 0.3);
    if (side === "o" && c !== "s") return mix(base, "#fff8e8", 0.14);
    if (away === "o" || down === "o") return mix(base, "#140c1c", 0.22);
    return base;
  }));
}

/** Run-length rectangles for one sprite frame (keeps the SVG small). */
export function elfRects(look: HeroLook, dir: ElfDir, frame: WalkFrame = 0, gear: boolean | "swing" = false) {
  const out: { x: number; y: number; w: number; fill: string }[] = [];
  elfColors(look, dir, frame, gear).forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const fill = row[x];
      if (!fill) { x++; continue; }
      let w = 1;
      while (row[x + w] === fill) w++;
      out.push({ x, y, w, fill });
      x += w;
    }
  });
  return out;
}

/** Scale2x/EPX on final colours; transparent pixels participate in comparisons. */
export function elfRectsHD(
  look: HeroLook,
  dir: ElfDir,
  frame: WalkFrame = 0,
  gear: boolean | "swing" = false,
) {
  const source = elfColors(look, dir, frame, gear);
  const at = (x: number, y: number): string | null => source[y]?.[x] ?? null;
  const grid: (string | null)[][] = Array.from(
    { length: ELF_H * ELF_HD },
    () => Array<string | null>(ELF_W * ELF_HD).fill(null),
  );

  for (let y = 0; y < ELF_H; y++) {
    for (let x = 0; x < ELF_W; x++) {
      const b = at(x, y - 1), d = at(x - 1, y);
      const e = at(x, y), f = at(x + 1, y), h = at(x, y + 1);
      const edge = b !== h && d !== f;
      grid[y * 2]![x * 2] = edge && d === b ? d : e;
      grid[y * 2]![x * 2 + 1] = edge && b === f ? f : e;
      grid[y * 2 + 1]![x * 2] = edge && d === h ? d : e;
      grid[y * 2 + 1]![x * 2 + 1] = edge && h === f ? f : e;
    }
  }

  // Locate details through the composed letters, respecting hair, headwear,
  // bounce and mirroring rather than assuming fixed facial coordinates.
  const letters = elfPixels(look, dir, frame, gear);
  if (dir !== 3) {
    const eyeY = letters.findIndex((row) => row.includes("e"));
    if (eyeY >= 0) {
      const row = letters[eyeY]!;
      for (let x = 0; x < ELF_W; x++) {
        if (row[x] === "e" && row[x - 1] !== "e") {
          grid[eyeY * 2]![x * 2 + (dir === 2 ? 1 : 0)] = "#ffffff";
        }
      }
    }
  }

  const hairY = letters.findIndex((row) => row.includes("h"));
  if (hairY >= 0) {
    const row = letters[hairY]!;
    const x = dir === 2 ? row.lastIndexOf("h") : row.indexOf("h");
    const color = grid[hairY * 2 + 1]![x * 2];
    if (color) {
      grid[hairY * 2 + 1]![x * 2] = mix(color, "#fff8e8", 0.4);
    }
  }

  // Soft pink cheeks under the big eyes (front view only).
  if (dir === 0) {
    const y = letters.findIndex((row) => /[mr]/.test(row));
    if (y >= 0) for (const x of [4, 11]) {
      if (letters[y]![x] !== "s") continue;
      for (const dx of [0, 1]) {
        const color = grid[y * 2]![x * 2 + dx];
        if (color) grid[y * 2]![x * 2 + dx] = mix(color, "#ef8a96", 0.38);
      }
    }
  }

  const out: { x: number; y: number; w: number; fill: string }[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const fill = row[x];
      if (!fill) { x++; continue; }
      let w = 1;
      while (row[x + w] === fill) w++;
      out.push({ x, y, w, fill });
      x += w;
    }
  });
  return out;
}
