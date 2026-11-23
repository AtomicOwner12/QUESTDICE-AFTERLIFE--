// Shop items: paid with coins earned from every step a player walks.
export type ShopItemId = "push5" | "bomb10" | "freeze" | "turbo5" | "double" | "shield" | "swap" | "coinsteal" | "jump10";
export type ShopItem = { id: ShopItemId; name: string; emoji: string; desc: string; cost: number; target: "other" | "self" };

export const SHOP_ITEMS: ShopItem[] = [
  { id: "push5", name: "Rückstoß", emoji: "👊", desc: "Ziel geht 5 Schritte zurück", cost: 8, target: "other" },
  { id: "bomb10", name: "Bombe", emoji: "💣", desc: "Ziel geht 10 Schritte zurück", cost: 15, target: "other" },
  { id: "freeze", name: "Eisblock", emoji: "🧊", desc: "Ziel setzt nächste Runde aus", cost: 12, target: "other" },
  { id: "swap", name: "Platztausch", emoji: "🔄", desc: "Tausche deinen Platz mit dem Ziel", cost: 20, target: "other" },
  { id: "coinsteal", name: "Taschendieb", emoji: "🧤", desc: "Stiehl dem Ziel 10 Münzen", cost: 6, target: "other" },
  { id: "turbo5", name: "Turbo", emoji: "🚀", desc: "Du gehst sofort 5 Schritte vor", cost: 8, target: "self" },
  { id: "double", name: "Doppelwurf", emoji: "🎲", desc: "Dein nächster Wurf zählt doppelt", cost: 12, target: "self" },
  { id: "jump10", name: "Mega-Sprung", emoji: "🦘", desc: "Du gehst sofort 10 Schritte vor", cost: 18, target: "self" },
  { id: "shield", name: "Schutzschild", emoji: "🛡️", desc: "Blockt deine nächste Strafe (Unglück/Death)", cost: 15, target: "self" },
];

export type ShopState = { pos: number[]; coins: number[]; frozen: boolean[]; shield: boolean[]; double: boolean[] };
const copy = (s: ShopState): ShopState => ({ pos: [...s.pos], coins: [...s.coins], frozen: [...s.frozen], shield: [...s.shield], double: [...s.double] });

/** Applies an item effect without paying (used for saved items). Returns null for an invalid target. */
export function applyItem(s: ShopState, user: number, id: ShopItemId, target: number, goal: number): ShopState | null {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  if (!item) return null;
  const t = item.target === "self" ? user : target;
  if (item.target === "other" && t === user) return null;
  const n = copy(s);
  const p = n.pos[t] ?? 0;
  if (id === "push5") n.pos[t] = Math.max(0, p - 5);
  if (id === "bomb10") n.pos[t] = Math.max(0, p - 10);
  if (id === "freeze") n.frozen[t] = true;
  if (id === "turbo5") n.pos[t] = Math.min(goal - 1, p + 5);
  if (id === "double") n.double[t] = true;
  if (id === "shield") n.shield[t] = true;
  if (id === "jump10") n.pos[t] = Math.min(goal - 1, p + 10);
  if (id === "swap") { n.pos[t] = n.pos[user] ?? 0; n.pos[user] = p; }
  if (id === "coinsteal") { const take = Math.min(10, n.coins[t] ?? 0); n.coins[t] = (n.coins[t] ?? 0) - take; n.coins[user] = (n.coins[user] ?? 0) + take; }
  return n;
}

/** Pays for an item to keep it for later. Returns the new coins or null if not affordable. */
export const itemCost = (id: ShopItemId, discount = 0) => Math.max(1, (SHOP_ITEMS.find((i) => i.id === id)?.cost ?? 0) - discount);
export function payFor(coins: number[], buyer: number, id: ShopItemId, discount = 0): number[] | null {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  const cost = itemCost(id, discount);
  if (!item || (coins[buyer] ?? 0) < cost) return null;
  return coins.map((c, i) => (i === buyer ? c - cost : c));
}

/** Tax: the thief takes all saved items of the victim. */
export function stealItems(inv: ShopItemId[][], thief: number, victim: number): ShopItemId[][] {
  if (thief === victim) return inv;
  const loot = inv[victim] ?? [];
  return inv.map((x, i) => (i === thief ? [...x, ...loot] : i === victim ? [] : x));
}

/** Buys an item for `buyer` and uses it now on `target` (ignored for self items). Returns null if not affordable. */
export function buyItem(s: ShopState, buyer: number, id: ShopItemId, target: number, goal: number, discount = 0): ShopState | null {
  const coins = payFor(s.coins, buyer, id, discount);
  if (!coins) return null;
  return applyItem({ ...s, coins }, buyer, id, target, goal);
}
