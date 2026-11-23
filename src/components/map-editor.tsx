import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DiceyChat } from "./dicey-chat";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "./ui/button";
import type { Me } from "@/hooks/use-me";
import { useQuery } from "@tanstack/react-query";
import { cleanSoldPlatform } from "@/lib/marketplace";
import {
  BRUSHES, BRUSH_INFO, EFFECTS, EFFECT_NAMES, MAX_PLATFORMS, MAX_TILES, MIN_TILES, cleanPlatform, cleanTiles, customIndex, customTile, effectLabel, generateTiles,
  type Brush, type CustomPlatform, type MapTile, type PlayableMap,
} from "@/lib/custom-maps";

export type Draft = { id?: string | undefined; title: string; description: string; dice: number; tiles: MapTile[]; platforms: CustomPlatform[]; is_public: boolean; made_by_dicey: boolean };

export const BRUSH_CLASS: Record<Brush, string> = {
  task: "bg-tile-task", special: "bg-tile-mini", bad: "bg-tile-bad", death: "bg-tile-death", click: "bg-tile-click", quiz: "bg-tile-quiz",
  shop: "bg-tile-shop", tax: "bg-tile-tax", help: "bg-tile-help", local: "bg-tile-local", empty: "bg-tile-empty",
};
const DEFAULT_MIX: Partial<Record<Brush, number>> = { task: 20, special: 12, bad: 12, death: 4, click: 5, quiz: 4, shop: 4, tax: 3, help: 3, local: 3, empty: 25 };

export const newDraft = (): Draft => ({
  title: "Meine Afterlife-Map", description: "", dice: 1, is_public: false, made_by_dicey: false,
  platforms: [cleanPlatform({ name: "Geister-Sprung", emoji: "👻", effect: "steps", value: 4, text: "Ein Geist trägt dich nach vorne!" })],
  tiles: generateTiles({ length: 150, mix: DEFAULT_MIX, platformWeights: [6] }, Date.now()),
});

const PAGE = 200;

export function MapEditor({ initial, me, onPlay, onClose, onSignIn }: { initial: Draft; me: Me; onPlay: (m: PlayableMap) => void; onClose: () => void; onSignIn: () => void }) {
  const qc = useQueryClient();
  const [d, setD] = useState<Draft>(initial);
  const [brush, setBrush] = useState<MapTile>("task");
  const [page, setPage] = useState(0);
  const [lengthInput, setLengthInput] = useState(String(initial.tiles.length));
  const [saving, setSaving] = useState(false);
  const painting = useRef(false);
  const pages = Math.max(1, Math.ceil(d.tiles.length / PAGE));
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const t of d.tiles) c.set(t, (c.get(t) ?? 0) + 1);
    return c;
  }, [d.tiles]);

  const update = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const paint = (i: number) => setD((x) => (x.tiles[i] === brush ? x : { ...x, tiles: x.tiles.map((t, k) => (k === i ? brush : t)) }));

  function resize() {
    const n = Math.max(MIN_TILES, Math.min(MAX_TILES, Math.floor(Number(lengthInput) || MIN_TILES)));
    setLengthInput(String(n));
    setD((x) => ({ ...x, tiles: n <= x.tiles.length ? x.tiles.slice(0, n) : [...x.tiles, ...Array.from({ length: n - x.tiles.length }, (): MapTile => "empty")] }));
    setPage(0);
  }
  function setPlatform(i: number, patch: Partial<CustomPlatform>) {
    setD((x) => ({ ...x, platforms: x.platforms.map((p, k) => (k === i ? cleanPlatform({ ...p, ...patch }) : p)) }));
  }
  function addPlatform() {
    if (d.platforms.length >= MAX_PLATFORMS) return;
    setD((x) => ({ ...x, platforms: [...x.platforms, cleanPlatform({ name: `Custom ${x.platforms.length + 1}`, emoji: "✨", effect: "none", text: "" })] }));
  }
  function removePlatform(i: number) {
    setD((x) => ({
      ...x,
      platforms: x.platforms.filter((_, k) => k !== i),
      tiles: x.tiles.map((t) => { const c = customIndex(t); return c === null ? t : c === i ? "empty" : c > i ? customTile(c - 1) : t; }),
    }));
    if (brush === customTile(i)) setBrush("task");
  }

  async function save() {
    if (!me) { onSignIn(); return; }
    if (!me.username) { toast.error("Wähle zuerst oben deinen Username."); return; }
    setSaving(true);
    const row = { title: d.title.trim().slice(0, 60) || "Ohne Namen", description: d.description.slice(0, 500), dice: d.dice, tiles: d.tiles as unknown as Json, platforms: d.platforms as unknown as Json, is_public: d.is_public, made_by_dicey: d.made_by_dicey };
    const res = d.id
      ? await supabase.from("maps").update(row).eq("id", d.id).select("id").single()
      : await supabase.from("maps").insert({ ...row, owner_id: me.id }).select("id").single();
    setSaving(false);
    if (res.error) { toast.error("Speichern hat nicht geklappt. Versuch es nochmal."); return; }
    update({ id: res.data.id });
    toast.success(d.is_public ? "Gespeichert und für alle unter OTHERS sichtbar!" : "Gespeichert (privat).");
    qc.invalidateQueries({ queryKey: ["maps"] });
  }
  async function remove() {
    if (!d.id || !confirm("Diese Map wirklich löschen?")) return;
    const { error } = await supabase.from("maps").delete().eq("id", d.id);
    if (error) { toast.error("Löschen hat nicht geklappt."); return; }
    qc.invalidateQueries({ queryKey: ["maps"] });
    onClose();
  }

  const brushes: { tile: MapTile; icon: string; name: string; cls: string }[] = [
    ...BRUSHES.map((b) => ({ tile: b as MapTile, icon: BRUSH_INFO[b].icon, name: BRUSH_INFO[b].name, cls: BRUSH_CLASS[b] })),
    ...d.platforms.map((p, i) => ({ tile: customTile(i), icon: p.emoji, name: p.name, cls: "bg-tile-custom" })),
  ];
  const cellInfo = (t: MapTile) => { const c = customIndex(t); const p = c !== null ? d.platforms[c] : undefined; return p ? { icon: p.emoji, cls: "bg-tile-custom", name: p.name } : { icon: BRUSH_INFO[t as Brush]?.icon ?? "", cls: BRUSH_CLASS[t as Brush] ?? "bg-tile-empty", name: BRUSH_INFO[t as Brush]?.name ?? "" }; };

  return (
    <div className="flex flex-col gap-4" onPointerUp={() => (painting.current = false)} onPointerLeave={() => (painting.current = false)}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" onClick={onClose}>← Zurück</Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="arcadeAlt" onClick={() => onPlay({ id: d.id, title: d.title, tiles: d.tiles, platforms: d.platforms, dice: d.dice })}>▶ SPIELEN</Button>
          <Button variant="arcade" disabled={saving} onClick={save}>{saving ? "SPEICHERT…" : "💾 SPEICHERN"}</Button>
        </div>
      </div>

      <DiceyChat me={me} onSignIn={onSignIn} map={{ title: d.title, description: d.description, dice: d.dice, tiles: d.tiles, platforms: d.platforms }}
        onApply={(m) => { setD((x) => ({ ...x, ...m, made_by_dicey: true })); setLengthInput(String(m.tiles.length)); setPage(0); }} />

      <section className="hub-card">
        <h3 className="font-extrabold">MAP-INFOS</h3>
        <input className="hub-input" maxLength={60} value={d.title} onChange={(e) => update({ title: e.target.value })} aria-label="Name der Map" placeholder="Name der Map" />
        <textarea className="hub-input" maxLength={500} value={d.description} onChange={(e) => update({ description: e.target.value })} aria-label="Beschreibung" placeholder="Beschreibung (optional)" />
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex flex-col gap-1 text-xs">WÜRFEL<div className="flex gap-1">{[1, 2, 3].map((n) => <Button key={n} variant="ghost" className="brush" aria-pressed={d.dice === n} onClick={() => update({ dice: n })}>{"🎲".repeat(n)}</Button>)}</div></div>
          <label className="flex flex-col gap-1 text-xs">FELDER (bis {MAX_TILES.toLocaleString("de-DE")})
            <span className="flex gap-1"><input className="hub-input w-32" type="number" min={MIN_TILES} max={MAX_TILES} value={lengthInput} onChange={(e) => setLengthInput(e.target.value)} /><Button variant="ghost" className="brush" onClick={resize}>OK</Button></span>
          </label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={d.is_public} onChange={(e) => update({ is_public: e.target.checked })} /> Für alle unter OTHERS veröffentlichen</label>
        </div>
      </section>

      <section className="hub-card">
        <div className="flex justify-between items-center flex-wrap gap-2"><h3 className="font-extrabold">EIGENE CUSTOM-PLATTFORMEN ({d.platforms.length}/{MAX_PLATFORMS})</h3><div className="flex gap-2 flex-wrap"><BoughtPlatforms me={me} disabled={d.platforms.length >= MAX_PLATFORMS} onAdd={(p) => setD((x) => (x.platforms.length >= MAX_PLATFORMS ? x : { ...x, platforms: [...x.platforms, p] }))} /><Button variant="ghost" className="brush" disabled={d.platforms.length >= MAX_PLATFORMS} onClick={addPlatform}>+ Plattform</Button></div></div>
        {d.platforms.length === 0 && <p className="text-xs text-muted-foreground">Noch keine eigenen Plattformen.</p>}
        {d.platforms.map((p, i) => (
          <div key={i} className="grid gap-2 border border-border rounded-md p-2" style={{ gridTemplateColumns: "56px 1fr" }}>
            <input className="hub-input text-center text-xl" value={p.emoji} onChange={(e) => setPlatform(i, { emoji: e.target.value })} aria-label="Emoji" />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <input className="hub-input flex-1 min-w-32" maxLength={30} value={p.name} onChange={(e) => setPlatform(i, { name: e.target.value })} aria-label="Name der Plattform" />
                <select className="hub-input w-auto" value={p.effect} onChange={(e) => setPlatform(i, { effect: e.target.value as CustomPlatform["effect"] })} aria-label="Effekt">{EFFECTS.map((ef) => <option key={ef} value={ef}>{EFFECT_NAMES[ef]}</option>)}</select>
                {(p.effect === "steps" || p.effect === "coins" || p.effect === "task") && <input className="hub-input w-24" type="number" value={p.value} onChange={(e) => setPlatform(i, { value: Number(e.target.value) })} aria-label={p.effect === "task" ? "Sekunden" : "Wert"} />}
                <Button variant="ghost" className="brush" onClick={() => removePlatform(i)} aria-label="Plattform entfernen">✕</Button>
              </div>
              <input className="hub-input" maxLength={200} value={p.text} onChange={(e) => setPlatform(i, { text: e.target.value })} placeholder="Aufgabe oder Beschreibung, z. B. Mache 5 Hampelmänner!" aria-label="Text der Plattform" />
              <span className="text-[11px] text-muted-foreground">{effectLabel(p)} · {counts.get(customTile(i)) ?? 0} Felder auf der Map</span>
            </div>
          </div>
        ))}
      </section>

      <section className="hub-card">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="font-extrabold">SELBST BAUEN · PINSEL WÄHLEN, DANN FELDER ANTIPPEN</h3>
          <div className="flex gap-2">
            <Button variant="ghost" className="brush" onClick={() => update({ tiles: generateTiles({ length: d.tiles.length, mix: DEFAULT_MIX, platformWeights: d.platforms.map(() => 5) }, Date.now()) })}>🎲 Zufällig füllen</Button>
            <Button variant="ghost" className="brush" onClick={() => update({ tiles: d.tiles.map((): MapTile => "empty") })}>Alles leeren</Button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">{brushes.map((b) => <Button key={b.tile} variant="ghost" className="brush" aria-pressed={brush === b.tile} onClick={() => setBrush(b.tile)}><span className={`inline-flex w-5 h-5 rounded items-center justify-center text-[11px] text-primary-foreground ${b.cls}`}>{b.icon}</span>{b.name} <small className="text-muted-foreground">{counts.get(b.tile) ?? 0}</small></Button>)}</div>
        <div className="map-cells select-none touch-none">
          <div className="map-cell bg-foreground text-background" title="Start">S</div>
          {d.tiles.slice(page * PAGE, page * PAGE + PAGE).map((t, k) => {
            const i = page * PAGE + k; const c = cellInfo(t);
            return <button type="button" key={i} className={`map-cell ${c.cls}`} title={`Feld ${i + 1}: ${c.name}`} aria-label={`Feld ${i + 1}: ${c.name}`}
              onPointerDown={(e) => { e.preventDefault(); painting.current = true; paint(i); }}
              onPointerEnter={() => painting.current && paint(i)}><small>{i + 1}</small>{c.icon}</button>;
          })}
          {page === pages - 1 && <div className="map-cell bg-tile-goal" title="Ziel">🏁</div>}
        </div>
        {pages > 1 && <div className="flex gap-2 items-center justify-center text-xs">
          <Button variant="ghost" className="brush" disabled={page === 0} onClick={() => setPage(page - 1)}>◀</Button>
          <span>Felder {page * PAGE + 1}–{Math.min(d.tiles.length, page * PAGE + PAGE)} von {d.tiles.length.toLocaleString("de-DE")}</span>
          <Button variant="ghost" className="brush" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>▶</Button>
        </div>}
      </section>

      {d.id && <Button variant="ghost" className="self-start text-destructive" onClick={remove}>🗑 Map löschen</Button>}
    </div>
  );
}

export function draftFromRow(row: { id: string; title: string; description: string; dice: number; tiles: Json; platforms: Json; is_public: boolean; made_by_dicey: boolean }): Draft {
  const platforms = (Array.isArray(row.platforms) ? row.platforms : []).slice(0, MAX_PLATFORMS).map((p) => cleanPlatform((p ?? {}) as Partial<CustomPlatform>));
  return { id: row.id, title: row.title, description: row.description, dice: row.dice, is_public: row.is_public, made_by_dicey: row.made_by_dicey, platforms, tiles: cleanTiles(row.tiles, platforms.length) };
}

/** Platforms bought in the Marketplace belong to the player forever and can be added to any map. */
function BoughtPlatforms({ me, disabled, onAdd }: { me: Me; disabled: boolean; onAdd: (p: CustomPlatform) => void }) {
  const { data = [] } = useQuery({
    queryKey: ["market", "bought-platforms", me?.id], enabled: !!me,
    queryFn: async () => {
      const { data: rows } = await supabase.from("market_purchases").select("listing_id, market_listings!inner(kind)").eq("buyer_id", me!.id).eq("market_listings.kind", "platform");
      const ids = (rows ?? []).map((r) => r.listing_id);
      if (!ids.length) return [];
      const { data: contents } = await supabase.from("market_listing_contents").select("listing_id, payload").in("listing_id", ids);
      return (contents ?? []).map((c) => ({ id: c.listing_id, platform: cleanSoldPlatform(c.payload) }));
    },
  });
  if (!data.length) return null;
  return <select className="hub-input w-auto brush" disabled={disabled} value="" aria-label="Gekaufte Plattform einfügen" onChange={(e) => { const it = data.find((x) => x.id === e.target.value); if (it) { onAdd(it.platform); toast.success(`${it.platform.emoji} ${it.platform.name} hinzugefügt`); } }}>
    <option value="">🛒 Gekaufte Plattform</option>
    {data.map((x) => <option key={x.id} value={x.id}>{x.platform.emoji} {x.platform.name}</option>)}
  </select>;
}
