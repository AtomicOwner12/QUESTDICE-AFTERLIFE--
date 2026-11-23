import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useMe, type Me } from "@/hooks/use-me";
import { Button } from "./ui/button";
import { Avatar, type Player } from "./remake-avatar";
import { AccountBar, OPEN_MARKET_KEY } from "./custom-hub";
import { EFFECTS, EFFECT_NAMES, cleanPlatform, effectLabel, type CustomPlatform, type PlayableMap } from "@/lib/custom-maps";
import { SKINS } from "@/lib/game";
import type { Look } from "@/lib/avatar";
import {
  COIN_PACKS, CREATOR_BONUS_SALES, CREATOR_MONTHLY_BONUS, KIND_INFO, MIN_PRICE, PAYMENTS_ENABLED, START_BONUS,
  cleanSkin, cleanSoldMap, cleanSoldPlatform, creatorBonusProgress, creatorBonusUnlocked, marketError, validPrice, type ListingKind,
} from "@/lib/marketplace";
import { attachNames } from "@/lib/player-names";

type Tab = "shop" | "library" | "sell" | "coins";
type Listing = { id: string; seller_id: string; kind: string; title: string; description: string; price: number; preview: Json; sales: number; is_active: boolean; profiles: { username: string | null } | null };

const LISTING_COLS = "id, seller_id, kind, title, description, price, preview, sales, is_active";
const fmt = (n: number) => n.toLocaleString("de-CH");

function useWallet(me: Me) {
  return useQuery({ queryKey: ["wallet", me?.id], enabled: !!me, queryFn: async () => { const { data, error } = await supabase.rpc("my_wallet"); if (error) throw error; return data ?? 0; } });
}

export function Marketplace({ players, onApplySkin, onPlay, onBack }: { players: Player[]; onApplySkin: (index: number, skin: string, look: Look) => void; onPlay: (m: PlayableMap) => void; onBack: () => void }) {
  const { data: me = null, isLoading } = useMe();
  const { data: balance } = useWallet(me);
  const [tab, setTab] = useState<Tab>("shop");
  const tabs: [Tab, string][] = [["shop", "🛒 KAUFEN"], ["library", "🎁 MEINE KÄUFE"], ["sell", "💸 VERKAUFEN"], ["coins", "🪙 QUESTCOINS"]];
  return (
    <section className="custom-hub market-hub">
      <div className="section-heading !mb-0">
        <div><span className="text-secondary text-[10px]">MAPS · SKINS · PLATTFORMEN VON SPIELERN</span><h2 className="section-title mt-2">MARKETPLACE</h2></div>
        <div className="flex items-center gap-2">{me && <span className="coin-badge" aria-label="Deine Questcoins">🪙 {fmt(balance ?? 0)}</span>}<Button variant="ghost" onClick={onBack} aria-label="Zurück">←</Button></div>
      </div>
      <AccountBar me={me} loading={isLoading} returnKey={OPEN_MARKET_KEY} intro={`Melde dich an, um im Marketplace zu kaufen und deine eigenen Maps, Skins und Plattformen zu verkaufen. Neue Spieler bekommen ${START_BONUS} Questcoins geschenkt.`} />
      <div className="hub-tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} type="button" role="tab" className="hub-tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "shop" && <Shop me={me} balance={balance ?? 0} />}
      {tab === "library" && <Library me={me} players={players} onApplySkin={onApplySkin} onPlay={onPlay} />}
      {tab === "sell" && <Sell me={me} players={players} />}
      {tab === "coins" && <Coins me={me} balance={balance ?? 0} />}
    </section>
  );
}

function Preview({ kind, preview, size = "text-5xl" }: { kind: string; preview: Json; size?: string }) {
  if (kind === "skin") { const s = cleanSkin(preview); return <span className={`player-bob ${size}`}><Avatar p={{ name: "", skin: s.skin, look: s.look }} /></span>; }
  if (kind === "platform") { const p = cleanSoldPlatform(preview); return <span className="market-platform"><span className="text-3xl">{p.emoji}</span><span className="text-xs font-bold">{p.name}</span><span className="text-[11px] text-muted-foreground">{effectLabel(p)}</span></span>; }
  const v = (preview && typeof preview === "object" ? preview : {}) as Record<string, unknown>;
  return <span className="market-platform"><span className="text-3xl">🗺️</span><span className="text-xs">{fmt(Number(v["length"]) || 0)} Felder · {"🎲".repeat(Math.max(1, Math.min(3, Number(v["dice"]) || 1)))}</span>{Number(v["platforms"]) > 0 && <span className="text-[11px] text-muted-foreground">{Number(v["platforms"])} eigene Plattformen</span>}</span>;
}

function Shop({ me, balance }: { me: Me; balance: number }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<ListingKind | "all">("all");
  const [sort, setSort] = useState<"new" | "top">("new");
  const [busy, setBusy] = useState<string | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["market", "listings", kind, sort],
    queryFn: async () => {
      let q = supabase.from("market_listings").select(LISTING_COLS).eq("is_active", true).limit(60);
      if (kind !== "all") q = q.eq("kind", kind);
      q = sort === "top" ? q.order("sales", { ascending: false }) : q.order("created_at", { ascending: false });
      return (await attachNames((await q).data ?? [], "seller_id")) as Listing[];
    },
  });
  const { data: owned = [] } = useQuery({ queryKey: ["market", "owned", me?.id], enabled: !!me, queryFn: async () => ((await supabase.from("market_purchases").select("listing_id").eq("buyer_id", me!.id)).data ?? []).map((r) => r.listing_id) });

  async function buy(l: Listing) {
    if (!me) return void toast.info("Melde dich zuerst oben an.");
    if (balance < l.price) return void toast.error(`Dir fehlen ${fmt(l.price - balance)} Questcoins.`);
    if (!confirm(`„${l.title}" für ${fmt(l.price)} Questcoins kaufen?`)) return;
    setBusy(l.id);
    const { error } = await supabase.rpc("buy_listing", { _listing_id: l.id });
    setBusy(null);
    if (error) return void toast.error(marketError(error.message));
    toast.success(`Gekauft! Du findest „${l.title}" unter MEINE KÄUFE.`);
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["market"] });
  }

  return <div className="flex flex-col gap-3">
    <div className="flex gap-2 flex-wrap items-center">
      {([["all", "Alles"], ["map", "🗺️ Maps"], ["skin", "🧍 Skins"], ["platform", "🧩 Plattformen"]] as const).map(([k, l]) => <Button key={k} variant="ghost" className="brush" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</Button>)}
      <span className="flex-1" />
      {([["new", "🆕 Neu"], ["top", "🔥 Bestseller"]] as const).map(([k, l]) => <Button key={k} variant="ghost" className="brush" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</Button>)}
    </div>
    {isLoading ? <p className="text-xs">Lade Angebote…</p>
      : data.length === 0 ? <p className="text-xs text-muted-foreground">Noch nichts im Angebot. Sei der Erste und verkaufe unter 💸 VERKAUFEN deine eigene Erfindung!</p>
      : <div className="hub-grid">{data.map((l) => {
        const mine = me?.id === l.seller_id, has = owned.includes(l.id);
        return <article key={l.id} className="hub-card market-card">
          <div className="market-preview"><Preview kind={l.kind} preview={l.preview} /></div>
          <div className="flex justify-between gap-2 items-start"><span className="font-extrabold text-primary">{l.title}</span><span className="text-[10px] whitespace-nowrap">{KIND_INFO[l.kind as ListingKind]?.icon} {KIND_INFO[l.kind as ListingKind]?.name}</span></div>
          {l.description ? <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p> : null}
          <div className="text-xs flex gap-3 flex-wrap"><span>von @{l.profiles?.username ?? "?"}</span><span>🛍 {fmt(l.sales)} verkauft</span></div>
          {mine ? <span className="text-xs text-secondary">Dein Angebot</span>
            : has ? <span className="text-xs text-primary font-bold">✓ Gekauft</span>
            : <Button variant="arcade" disabled={busy === l.id} onClick={() => buy(l)}>KAUFEN · 🪙 {fmt(l.price)}</Button>}
        </article>;
      })}</div>}
  </div>;
}

function Library({ me, players, onApplySkin, onPlay }: { me: Me; players: Player[]; onApplySkin: (index: number, skin: string, look: Look) => void; onPlay: (m: PlayableMap) => void }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["market", "library", me?.id], enabled: !!me,
    queryFn: async () => {
      const { data: rows } = await supabase.from("market_purchases").select("listing_id, created_at, market_listings(kind, title, preview)").eq("buyer_id", me!.id).order("created_at", { ascending: false });
      const ids = (rows ?? []).map((r) => r.listing_id);
      const { data: contents } = ids.length ? await supabase.from("market_listing_contents").select("listing_id, payload").in("listing_id", ids) : { data: [] };
      const byId = new Map((contents ?? []).map((c) => [c.listing_id, c.payload]));
      return (rows ?? []).flatMap((r) => r.market_listings ? [{ id: r.listing_id, kind: r.market_listings.kind, title: r.market_listings.title, preview: r.market_listings.preview, payload: byId.get(r.listing_id) ?? null }] : []);
    },
  });
  if (!me) return <p className="text-xs text-muted-foreground">Melde dich an, um deine Käufe zu sehen.</p>;
  if (isLoading) return <p className="text-xs">Lade deine Käufe…</p>;
  if (!data.length) return <p className="text-xs text-muted-foreground">Du hast noch nichts gekauft. Schau unter 🛒 KAUFEN vorbei!</p>;
  return <div className="hub-grid">{data.map((it) => <article key={it.id} className="hub-card market-card">
    <div className="market-preview"><Preview kind={it.kind} preview={it.preview} /></div>
    <span className="font-extrabold text-primary">{it.title}</span>
    {it.kind === "map" && <Button variant="arcade" disabled={!it.payload} onClick={() => onPlay(cleanSoldMap(it.payload))}>▶ MAP SPIELEN</Button>}
    {it.kind === "skin" && <div className="flex flex-col gap-1"><span className="text-[11px] text-muted-foreground">Anlegen für:</span><div className="flex gap-1 flex-wrap">{players.map((p, i) => <Button key={i} variant="ghost" className="brush" onClick={() => { const s = cleanSkin(it.payload); onApplySkin(i, s.skin, s.look); toast.success(`${p.name} trägt jetzt „${it.title}"!`); }}>{p.name}</Button>)}</div></div>}
    {it.kind === "platform" && <p className="text-[11px] text-muted-foreground">Gehört dir für immer: Im CUSTOM-Bereich beim Map-Bauen unter „🛒 Gekaufte Plattform" einfügen.</p>}
  </article>)}</div>;
}

const blankPlatform = (): CustomPlatform => cleanPlatform({ name: "Meine Plattform", emoji: "🌀", effect: "steps", value: 3, text: "" });

function Sell({ me, players }: { me: Me; players: Player[] }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<ListingKind>("map");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(String(MIN_PRICE));
  const [mapId, setMapId] = useState("");
  const [skinFrom, setSkinFrom] = useState(0);
  const [platform, setPlatform] = useState<CustomPlatform>(blankPlatform);
  const [busy, setBusy] = useState(false);
  const { data: maps = [] } = useQuery({ queryKey: ["maps", "mine", me?.id], enabled: !!me, queryFn: async () => (await supabase.from("map_cards").select("*").eq("owner_id", me!.id).order("updated_at", { ascending: false })).data ?? [] });
  const { data: listings = [] } = useQuery({ queryKey: ["market", "mine", me?.id], enabled: !!me, queryFn: async () => (await attachNames((await supabase.from("market_listings").select(LISTING_COLS).eq("seller_id", me!.id).order("created_at", { ascending: false })).data ?? [], "seller_id")) as Listing[] });
  if (!me) return <p className="text-xs text-muted-foreground">Melde dich oben an, um deine Erfindungen zu verkaufen.</p>;
  if (!me.username) return <p className="text-xs text-muted-foreground">Wähle oben zuerst deinen Username – Käufer sehen ihn bei deinen Angeboten.</p>;
  const totalSales = listings.reduce((a, l) => a + l.sales, 0);
  const seller = players[skinFrom] ?? players[0];

  async function submit() {
    const n = Math.floor(Number(price));
    if (!validPrice(n)) return void toast.error(`Der Preis muss mindestens ${MIN_PRICE} Questcoins sein.`);
    if (!title.trim()) return void toast.error("Gib deinem Angebot einen Namen.");
    if (kind === "map" && !mapId) return void toast.error("Wähle eine deiner Maps aus.");
    const payload = kind === "skin" && seller ? { skin: seller.skin, look: seller.look } : kind === "platform" ? cleanPlatform(platform) : {};
    setBusy(true);
    const { error } = await supabase.rpc("create_listing", { _kind: kind, _title: title.trim(), _description: description.trim(), _price: n, _map_id: (kind === "map" ? mapId : null) as unknown as string, _payload: payload as unknown as Json });
    setBusy(false);
    if (error) return void toast.error(marketError(error.message));
    toast.success("Dein Angebot ist jetzt im Marketplace!");
    setTitle(""); setDescription(""); setPrice(String(MIN_PRICE));
    qc.invalidateQueries({ queryKey: ["market"] });
  }
  async function toggle(l: Listing) {
    const { error } = await supabase.rpc("set_listing_active", { _listing_id: l.id, _active: !l.is_active });
    if (error) return void toast.error(marketError(error.message));
    qc.invalidateQueries({ queryKey: ["market"] });
  }

  return <div className="flex flex-col gap-4">
    <section className="hub-card payout-card">
      <h3 className="font-extrabold">⭐ CREATOR-BONUS</h3>
      <p className="text-xs">Ab <b>{fmt(CREATOR_BONUS_SALES)} Verkäufen</b> bekommst du jeden Monat automatisch <b>🪙 {fmt(CREATOR_MONTHLY_BONUS)} Questcoins</b>, um selbst mehr im Marketplace zu kaufen.</p>
      <div className="payout-bar" role="progressbar" aria-valuemin={0} aria-valuemax={CREATOR_BONUS_SALES} aria-valuenow={Math.min(totalSales, CREATOR_BONUS_SALES)}><span style={{ width: `${creatorBonusProgress(totalSales) * 100}%` }} /></div>
      <span className="text-xs text-primary font-bold">{fmt(totalSales)} / {fmt(CREATOR_BONUS_SALES)} Verkäufe</span>
      <span className="text-[11px] text-muted-foreground">{creatorBonusUnlocked(totalSales) ? `✓ Freigeschaltet: Jeden Monat kommen ${fmt(CREATOR_MONTHLY_BONUS)} Questcoins auf dein Konto.` : `Noch ${fmt(CREATOR_BONUS_SALES - totalSales)} Verkäufe bis zum Monatsbonus.`}</span>
      <span className="text-[11px] text-secondary">🏆 Echtes Geld gibt es nur bei Turnieren, z. B. für die beste Map.</span>
    </section>

    <section className="hub-card">
      <h3 className="font-extrabold">NEUES ANGEBOT</h3>
      <div className="flex gap-2 flex-wrap">{(Object.keys(KIND_INFO) as ListingKind[]).map((k) => <Button key={k} variant="ghost" className="brush" aria-pressed={kind === k} onClick={() => setKind(k)}>{KIND_INFO[k].icon} {KIND_INFO[k].name}</Button>)}</div>
      {kind === "map" && (maps.length === 0
        ? <p className="text-xs text-muted-foreground">Du hast noch keine gespeicherte Map. Bau eine im CUSTOM-Bereich (auch mit Dicey AI).</p>
        : <select className="hub-input" value={mapId} onChange={(e) => { setMapId(e.target.value); const m = maps.find((x) => x.id === e.target.value); if (m?.title && !title) setTitle(m.title); }} aria-label="Map auswählen">
          <option value="">Map auswählen…</option>{maps.map((m) => <option key={m.id} value={m.id ?? ""}>{m.title} · {fmt(m.length ?? 0)} Felder</option>)}
        </select>)}
      {kind === "skin" && seller && <div className="flex gap-4 items-center flex-wrap">
        <span className="text-6xl player-bob"><Avatar p={seller} /></span>
        <div className="flex flex-col gap-2 text-xs"><span>Look verkaufen von:</span><div className="flex gap-1 flex-wrap">{players.map((p, i) => <Button key={i} variant="ghost" className="brush" aria-pressed={skinFrom === i} onClick={() => setSkinFrom(i)}>{p.name}</Button>)}</div><span className="text-[11px] text-muted-foreground">Gestalte den Look vorher im ✦ SKIN STUDIO. Figur: {SKINS.find((s) => s.id === seller.skin)?.name}</span></div>
      </div>}
      {kind === "platform" && <div className="grid gap-2" style={{ gridTemplateColumns: "56px 1fr" }}>
        <input className="hub-input text-center text-xl" value={platform.emoji} onChange={(e) => setPlatform(cleanPlatform({ ...platform, emoji: e.target.value }))} aria-label="Emoji" />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <input className="hub-input flex-1 min-w-32" maxLength={30} value={platform.name} onChange={(e) => setPlatform(cleanPlatform({ ...platform, name: e.target.value }))} aria-label="Name der Plattform" />
            <select className="hub-input w-auto" value={platform.effect} onChange={(e) => setPlatform(cleanPlatform({ ...platform, effect: e.target.value as CustomPlatform["effect"] }))} aria-label="Effekt">{EFFECTS.map((ef) => <option key={ef} value={ef}>{EFFECT_NAMES[ef]}</option>)}</select>
            {(platform.effect === "steps" || platform.effect === "coins" || platform.effect === "task") && <input className="hub-input w-24" type="number" value={platform.value} onChange={(e) => setPlatform(cleanPlatform({ ...platform, value: Number(e.target.value) }))} aria-label={platform.effect === "task" ? "Sekunden" : "Wert"} />}
          </div>
          <input className="hub-input" maxLength={200} value={platform.text} onChange={(e) => setPlatform(cleanPlatform({ ...platform, text: e.target.value }))} placeholder="Aufgabe oder Beschreibung" aria-label="Text der Plattform" />
          <span className="text-[11px] text-muted-foreground">{effectLabel(platform)} · Käufer behalten die Plattform für immer</span>
        </div>
      </div>}
      <input className="hub-input" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name des Angebots" aria-label="Name des Angebots" />
      <textarea className="hub-input" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung (optional)" aria-label="Beschreibung des Angebots" />
      <label className="flex items-center gap-2 text-xs flex-wrap">PREIS 🪙<input className="hub-input w-32" type="number" min={MIN_PRICE} step={10} value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Preis in Questcoins" /><span className="text-muted-foreground">mindestens {MIN_PRICE}, nach oben offen</span></label>
      <Button variant="arcade" disabled={busy} onClick={submit}>{busy ? "STELLT EIN…" : "💸 VERKAUFEN"}</Button>
    </section>

    <section className="flex flex-col gap-2">
      <h3 className="font-extrabold text-sm">MEINE ANGEBOTE ({listings.length})</h3>
      {listings.length === 0 ? <p className="text-xs text-muted-foreground">Noch keine Angebote.</p>
        : <div className="hub-grid">{listings.map((l) => <article key={l.id} className={`hub-card market-card ${l.is_active ? "" : "opacity-60"}`}>
          <div className="market-preview"><Preview kind={l.kind} preview={l.preview} size="text-4xl" /></div>
          <span className="font-extrabold text-primary">{l.title}</span>
          <div className="text-xs flex gap-3 flex-wrap"><span>🪙 {fmt(l.price)}</span><span>🛍 {fmt(l.sales)} verkauft</span><span>{l.is_active ? "🟢 im Verkauf" : "⏸ pausiert"}</span></div>
          <Button variant="ghost" className="brush" onClick={() => toggle(l)}>{l.is_active ? "Aus dem Verkauf nehmen" : "Wieder verkaufen"}</Button>
        </article>)}</div>}
    </section>
  </div>;
}

function Coins({ me, balance }: { me: Me; balance: number }) {
  return <div className="flex flex-col gap-4">
    <div className="hub-card flex-row items-center justify-between flex-wrap"><span className="text-sm">{me ? <>Du hast <b className="text-primary">🪙 {fmt(balance)} Questcoins</b></> : "Melde dich an, um Questcoins zu bekommen."}</span><span className="text-[11px] text-muted-foreground">Neue Spieler bekommen einmalig {START_BONUS} Questcoins geschenkt.</span></div>
    <div className="coin-packs">{COIN_PACKS.map((p, i) => <article key={p.id} className={`coin-pack coin-pack-${i}`}>
      <span className="text-[10px] text-secondary">{p.label.toUpperCase()}</span>
      <span className="coin-pack-amount">🪙 {fmt(p.coins)}</span>
      <span className="text-[11px] text-muted-foreground">≈ {Math.floor(p.coins / MIN_PRICE)} Teile ab {MIN_PRICE} Coins</span>
      <Button variant="arcade" disabled={!PAYMENTS_ENABLED}>{PAYMENTS_ENABLED ? `${p.chf} CHF` : `${p.chf} CHF · BALD`}</Button>
    </article>)}</div>
    {!PAYMENTS_ENABLED && <p className="text-[11px] text-muted-foreground">Der Kauf mit echtem Geld kommt bald. Bis dahin spielst du mit deinem Startguthaben.</p>}
  </div>;
}
