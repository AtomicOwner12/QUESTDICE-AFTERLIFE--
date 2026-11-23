import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, type Player } from "./remake-avatar";
import { SKINS } from "@/lib/game";
import { HATS, FACES, HANDS, AURAS, AURA_NAMES, TINTS, PATTERNS, TRAILS, BADGES, BACKS, FEET, FX, DANCES, HALOS, SPIRITS, LOOK_COMBINATIONS, randomLook, type Look } from "@/lib/avatar";
const CATEGORIES = ["Figur", "Accessoires", "Finish", "Party FX 4D", "Afterlife 4D"];
export function SkinStudio({ players, onChange, onBack }: { players: Player[]; onChange: (index: number, player: Player) => void; onBack: () => void }) {
  const [index, setIndex] = useState(0), [tab, setTab] = useState("Figur");
  const p = players[index]; if (!p) return null;
  const update = (key: keyof Look, value: string | number) => onChange(index, { ...p, look: { ...p.look, [key]: value } });
  const accessory = [["hat", "KOPF", HATS], ["face", "GESICHT", FACES], ["hand", "HAND", HANDS], ["aura", "AURA", AURAS]] as const;
  const finish = [["tint", "FARBE", TINTS], ["pattern", "MUSTER", PATTERNS], ["trail", "SPUR", TRAILS], ["badge", "ABZEICHEN", BADGES], ["back", "RÜCKEN", BACKS], ["feet", "FÜSSE", FEET]] as const;
  const party = [["fx", "4D-EFFEKT", FX], ["dance", "TANZ", DANCES]] as const;
  const afterlife = [["halo", "HEILIGENSCHEIN", HALOS], ["spirit", "GEISTER-BEGLEITER", SPIRITS.map(s => s ? `${s} Geist` : "Keiner")]] as const;
  const pickers: readonly (readonly ["fx" | "dance" | "halo" | "spirit", string, readonly string[]])[] = tab === "Afterlife 4D" ? afterlife : party;
  return <section className="studio-screen w-full">
    <div className="flex items-center justify-between gap-3"><div><h2 className="section-title">SKIN STUDIO 4D</h2><p className="text-[10px] text-accent mt-1">{LOOK_COMBINATIONS.toLocaleString("de-DE")} mögliche Looks</p></div><Button variant="ghost" onClick={onBack} aria-label="Zurück">←</Button></div>
    <div className="flex flex-wrap gap-2 my-5">{players.map((player, i) => <Button variant={index === i ? "default" : "outline"} key={i} onClick={() => setIndex(i)}>{player.name}</Button>)}</div>
    <div className="studio-layout">
      <div className="studio-preview flex flex-col items-center justify-center gap-8">
        <div className="studio-stage"><Avatar p={p} className="text-8xl player-bob" /></div>
        <span className="text-xs text-primary">{p.name}</span>
        <Button variant="outline" onClick={() => onChange(index, { ...p, skin: SKINS[Math.floor(Math.random() * SKINS.length)]?.id ?? p.skin, look: randomLook() })}>🎲 ZUFÄLLIG</Button>
      </div>
      <div className="studio-options">
        <div className="flex gap-1 mb-5 flex-wrap">{CATEGORIES.map(c => <Button variant={tab === c ? "default" : "ghost"} key={c} onClick={() => setTab(c)}>{c}</Button>)}</div>
        {tab === "Figur" ? <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">{SKINS.map(s => <Button variant="ghost" title={s.name} aria-label={s.name} aria-pressed={s.id === p.skin} className={`skin-option ${s.id === p.skin ? "selected" : ""}`} key={s.id} onClick={() => onChange(index, { ...p, skin: s.id })}><span className="text-3xl">{s.emoji}</span><span className="text-[9px]">{s.name}</span></Button>)}</div>
          : tab === "Accessoires" ? accessory.map(([key, name, opts]) => <div className="mb-5" key={key}><h3 className="text-[10px] text-muted-foreground mb-2">{name}</h3><div className="flex gap-1 flex-wrap">{opts.map(o => <Button key={o || "none"} variant={p.look[key] === o ? "default" : "outline"} onClick={() => update(key, o)}>{key === "aura" ? AURA_NAMES[o] : o || "✕"}</Button>)}</div></div>)
          : tab === "Finish" ? finish.map(([key, name, opts]) => <div className="mb-5" key={key}><label className="flex items-center justify-between gap-4 text-[10px]"><span>{name}</span><select aria-label={name} value={p.look[key] ?? ""} onChange={e => update(key, Number(e.target.value))} className="studio-select"><option value="" disabled>Original</option>{opts.map((o, i) => <option value={i} key={i}>{o}</option>)}</select></label></div>)
          : pickers.map(([key, name, opts]) => <div className="mb-5" key={key}><h3 className="text-[10px] text-muted-foreground mb-2">{name}</h3><div className="flex gap-1 flex-wrap">{opts.map((o, i) => <Button key={o} variant={(p.look[key] ?? 0) === i ? "default" : "outline"} aria-pressed={(p.look[key] ?? 0) === i} onClick={() => update(key, i)}>{o}</Button>)}</div></div>)}
      </div>
    </div>
  </section>;
}
