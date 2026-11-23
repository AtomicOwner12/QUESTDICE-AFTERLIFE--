import { AURAS, BACKS, BADGES, DANCES, DEFAULT_LOOK, FACES, FEET, FX, HALOS, HANDS, HATS, PATTERNS, SPIRITS, TINTS, TRAILS, type Look } from "./avatar";
import { SKINS } from "./game";
import { cleanPlatform, cleanTiles, type CustomPlatform, type PlayableMap } from "./custom-maps";

/** Questcoin packs (CHF → Questcoins). Real-money checkout is not switched on yet. */
export const COIN_PACKS = [
  { id: "small", chf: 3, coins: 360, label: "Starter" },
  { id: "medium", chf: 9, coins: 1030, label: "Party" },
  { id: "large", chf: 20, coins: 3000, label: "Afterlife" },
] as const;
export const PAYMENTS_ENABLED = false;

/** Every new account gets this once. */
export const START_BONUS = 360;
export const MIN_PRICE = 180;
export const MAX_PRICE = 1_000_000;
/** Creators with this many total sales get a monthly Questcoin bonus (paid by the `my_wallet` database function). */
export const CREATOR_BONUS_SALES = 1000;
export const CREATOR_MONTHLY_BONUS = 500;

export type ListingKind = "map" | "skin" | "platform";
export const KIND_INFO: Record<ListingKind, { name: string; icon: string }> = {
  map: { name: "Map", icon: "🗺️" }, skin: { name: "Skin", icon: "🧍" }, platform: { name: "Plattform", icon: "🧩" },
};

export const validPrice = (price: number) => Number.isInteger(price) && price >= MIN_PRICE && price <= MAX_PRICE;
export const creatorBonusUnlocked = (totalSales: number) => totalSales >= CREATOR_BONUS_SALES;
export const creatorBonusProgress = (totalSales: number) => Math.min(1, Math.max(0, totalSales) / CREATOR_BONUS_SALES);

const idx = (v: unknown, len: number) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < len ? v : undefined);
const oneOf = (v: unknown, list: readonly string[], fallback: string) => (typeof v === "string" && list.includes(v) ? v : fallback);

export type SoldSkin = { skin: string; look: Look };

/** Keeps only real skin parts so a bought skin can never break the avatar. */
export function cleanSkin(raw: unknown): SoldSkin {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const l = (r["look"] && typeof r["look"] === "object" ? r["look"] : {}) as Record<string, unknown>;
  const look: Look = {
    hat: oneOf(l["hat"], HATS, DEFAULT_LOOK.hat), face: oneOf(l["face"], FACES, DEFAULT_LOOK.face),
    hand: oneOf(l["hand"], HANDS, DEFAULT_LOOK.hand), aura: oneOf(l["aura"], AURAS, DEFAULT_LOOK.aura),
  };
  const nums: [keyof Look, number][] = [["tint", TINTS.length], ["pattern", PATTERNS.length], ["trail", TRAILS.length], ["badge", BADGES.length], ["back", BACKS.length], ["feet", FEET.length], ["fx", FX.length], ["dance", DANCES.length], ["halo", HALOS.length], ["spirit", SPIRITS.length]];
  for (const [k, len] of nums) { const v = idx(l[k], len); if (v !== undefined) (look as Record<string, unknown>)[k] = v; }
  const skin = typeof r["skin"] === "string" && SKINS.some((s) => s.id === r["skin"]) ? (r["skin"] as string) : SKINS[0]!.id;
  return { skin, look };
}

export const cleanSoldPlatform = (raw: unknown): CustomPlatform => cleanPlatform((raw && typeof raw === "object" ? raw : {}) as Partial<CustomPlatform>);

export function cleanSoldMap(raw: unknown, id?: string): PlayableMap {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const platforms = (Array.isArray(r["platforms"]) ? r["platforms"] : []).slice(0, 24).map(cleanSoldPlatform);
  return {
    id, title: String(r["title"] ?? "Map").slice(0, 60),
    tiles: cleanTiles(r["tiles"], platforms.length), platforms,
    dice: Math.max(1, Math.min(3, Math.round(Number(r["dice"]) || 1))),
  };
}

const ERRORS: Record<string, string> = {
  not_signed_in: "Melde dich zuerst an.",
  no_username: "Wähle zuerst deinen Username.",
  price_too_low: `Der Preis muss mindestens ${MIN_PRICE} Questcoins sein.`,
  map_not_found: "Diese Map gehört nicht dir.",
  bad_payload: "Das Teil konnte nicht gespeichert werden.",
  not_found: "Dieses Angebot gibt es nicht mehr.",
  own_listing: "Das ist dein eigenes Angebot.",
  already_owned: "Das hast du schon gekauft.",
  not_enough_coins: "Du hast nicht genug Questcoins.",
};
export function marketError(message: string | undefined) {
  const key = Object.keys(ERRORS).find((k) => message?.includes(k));
  return key ? ERRORS[key]! : "Hat nicht geklappt. Bitte nochmal versuchen.";
}
