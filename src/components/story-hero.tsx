import { memo, useState } from "react";
import { Button } from "./ui/button";
import type { Direction } from "@/lib/story-world";
import { LOOK_COUNTS, type HeroLook, type StorySave } from "@/lib/story";
import {
  ELF_H, ELF_W, ELF_HD, HERO_PRESET, LINK_PRESET, SILVER_PRESET, elfRectsHD, WALK_FRAMES, type WalkFrame, SKIN_NAMES, HAIR_NAMES, STYLE_NAMES, EYE_NAMES, OUTFIT_NAMES, HEAD_NAMES, BODY_NAMES, EAR_NAMES,
} from "@/lib/pixel-elf";

type ElfPath = { fill: string; d: string };
/** Sprite paths per look/direction/frame: one <path> per colour instead of one <rect> per pixel run, computed once. */
const PATHS = new Map<string, ElfPath[]>();
function elfPaths(look: HeroLook, direction: Direction, frame: WalkFrame, gear: boolean | "swing"): ElfPath[] {
  const key = `${look.body}.${look.skin}.${look.hair}.${look.style}.${look.eyes}.${look.outfit}.${look.head}.${look.ears ?? 0}|${direction}|${frame}|${gear === "swing" ? 2 : gear ? 1 : 0}`;
  const hit = PATHS.get(key);
  if (hit) return hit;
  const byFill = new Map<string, string>();
  for (const r of elfRectsHD(look, direction, frame, gear)) byFill.set(r.fill, `${byFill.get(r.fill) ?? ""}M${r.x} ${r.y}h${r.w}v1h-${r.w}z`);
  const out = [...byFill].map(([fill, d]) => ({ fill, d }));
  if (PATHS.size > 4000) PATHS.clear();
  PATHS.set(key, out);
  return out;
}
const sameLook = (a: HeroLook, b: HeroLook) => a === b || (Object.keys(a) as (keyof HeroLook)[]).every((k) => a[k] === b[k]) && Object.keys(a).length === Object.keys(b).length;

type HeroProps = { look: HeroLook; direction?: Direction; walking?: boolean; className?: string; scale?: number; label?: string; gear?: boolean | "swing" };
/** Pixel elf (16x24 art, drawn as smooth 32x48 HD pixels). `scale` = screen pixels per sprite pixel. Skips re-rendering while its look and props stay the same. */
export const StoryHero = memo(function StoryHero({ look, direction = 0, walking = false, className = "", scale = 2, label = "Deine Elfen-Spielfigur", gear = false }: HeroProps) {
  // Standing: one frame. Walking: the 4-step cycle, each frame shown in turn by the CSS walk animation.
  const frames: WalkFrame[] = walking ? [...WALK_FRAMES] : [0];
  return <svg
    className={`pixel-elf ${walking ? "is-walking" : ""} ${className}`}
    width={ELF_W * scale} height={(ELF_H + 1) * scale} viewBox={`0 0 ${ELF_W * ELF_HD} ${(ELF_H + 1) * ELF_HD}`}
    shapeRendering="crispEdges" role="img" aria-label={label}
  >
    <ellipse cx={ELF_W} cy={(ELF_H - 0.2) * ELF_HD} rx={11} ry={2.6} className="pixel-elf-shadow" />
    {frames.map((f) => <g key={f} className={`pixel-elf-frame f${f}`}>
      {elfPaths(look, direction, f, gear).map((p) => <path key={p.fill} d={p.d} fill={p.fill} />)}
    </g>)}
  </svg>;
}, (a, b) => sameLook(a.look, b.look) && a.direction === b.direction && a.walking === b.walking && a.className === b.className && a.scale === b.scale && a.label === b.label && a.gear === b.gear);

const OPTIONS: [keyof HeroLook, string, string[]][] = [
  ["body", "KÖRPER", BODY_NAMES],
  ["skin", "HAUTFARBE", SKIN_NAMES],
  ["hair", "HAARFARBE", HAIR_NAMES],
  ["style", "FRISUR", STYLE_NAMES],
  ["eyes", "AUGENFARBE", EYE_NAMES],
  ["outfit", "KLEIDUNG", OUTFIT_NAMES],
  ["head", "KOPFSCHMUCK", HEAD_NAMES],
  ["ears", "OHREN", EAR_NAMES],
];

export function CharacterStudio({ save, onSave, first = false }: { save: StorySave; onSave: (s: StorySave) => void; first?: boolean }) {
  const [name, setName] = useState(save.heroName);
  const [look, setLook] = useState(save.heroLook);
  const [dir, setDir] = useState<Direction>(0);
  const step = (key: keyof HeroLook, by: number) => setLook((l) => ({ ...l, [key]: (l[key] + by + LOOK_COUNTS[key]) % LOOK_COUNTS[key] }));
  const valid = name.trim().length >= 2;
  return <div className="character-studio">
    <div className="character-preview">
      <div className="character-moon" />
      <StoryHero look={look} direction={dir} walking scale={9} gear />
      <div className="character-turn">
        {([[1, "◀"], [0, "▼"], [3, "▲"], [2, "▶"]] as [Direction, string][]).map(([d, l]) => <button key={d} type="button" aria-label="Figur drehen" aria-pressed={dir === d} onClick={() => setDir(d)}>{l}</button>)}
      </div>
      <span className="character-name">{name.trim() || "Dein Held"}</span>
    </div>
    <div className="character-controls">
      <label className="text-xs">NAME DEINES HELDEN
        <input autoFocus={first} value={name} maxLength={16} onChange={(e) => setName(e.target.value)} placeholder="z. B. Umut" className="character-input" />
      </label>
      <div className="character-options">
        {OPTIONS.map(([key, label, names]) => <div className="character-choice" key={key}>
          <span>{label}<small>{names[look[key]]}</small></span>
          <div className="flex gap-1">
            <Button type="button" variant="arcadeAlt" size="sm" onClick={() => step(key, -1)} aria-label={`${label} zurück`}>◀</Button>
            <Button type="button" variant="arcadeAlt" size="sm" onClick={() => step(key, 1)} aria-label={`${label} ändern`}>▶</Button>
          </div>
        </div>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="arcadeAlt" size="sm" onClick={() => setLook({ ...LINK_PRESET })}>🧢 GRÜNMÜTZEN-LOOK</Button>
        <Button type="button" variant="arcadeAlt" size="sm" onClick={() => setLook({ ...HERO_PRESET })}>⚔ STACHELKOPF-LOOK</Button>
        <Button type="button" variant="arcadeAlt" size="sm" onClick={() => setLook({ ...SILVER_PRESET })}>🗡 SILBERMÄHNEN-LOOK</Button>
      </div>
      <Button type="button" variant="ghost" className="text-xs self-start" onClick={() => setLook(Object.fromEntries(Object.entries(LOOK_COUNTS).map(([k, n]) => [k, Math.floor(Math.random() * n)])) as HeroLook)}>🎲 ZUFÄLLIGER LOOK</Button>
      <Button variant="arcade" className="start-button" disabled={!valid} onClick={() => onSave({ ...save, heroName: name.trim(), heroLook: look })}>{first ? "⚔ ABENTEUER BEGINNEN" : "✓ AUSSEHEN SPEICHERN"}</Button>
      {first && <p className="text-[10px] text-muted-foreground">Du bist ein erwachsener Elf. Name und Aussehen kannst du später jederzeit unter „Charakter“ ändern.</p>}
    </div>
  </div>;
}
