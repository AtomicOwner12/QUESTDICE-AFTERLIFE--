import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { StoryHero } from "./story-hero";
import { npcAt, worldNpcs } from "@/lib/story-npcs";
import { npcNow, NPC_STEP_MS } from "@/lib/story-life";

const TILE = 40;

/** The villagers of the map going about their day: they stroll between home, work, the square and their neighbours. */
export const Villagers = memo(function Villagers({ world, heroX, heroY, halfW, halfH, onTalk }: {
  world: number; heroX: number; heroY: number; halfW: number; halfH: number; onTalk: (id: number) => void;
}) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 150);
    return () => clearInterval(id);
  }, []);
  return <>
    {worldNpcs(world).open.map((n) => {
      const now = npcNow(world, n.id, t);
      if (!now || now.hidden || Math.abs(now.x - heroX) > halfW + 3 || Math.abs(now.y - heroY) > halfH + 3) return null;
      const npc = npcAt(n.id), near = Math.max(Math.abs(now.x - heroX), Math.abs(now.y - heroY)) <= 1;
      return <button key={n.id} className={`world-poi world-resident ${near ? "is-near" : ""} ${now.walking ? "is-walking" : ""}`}
        style={{ left: now.x * TILE, top: now.y * TILE, transitionDuration: `${NPC_STEP_MS}ms` }} aria-label={`${npc.name}, ${npc.role}`}
        onClick={() => { if (near) onTalk(n.id); else toast(`🧝 ${npc.name} · ${npc.role}`); }}>
        <StoryHero look={npc.look} direction={now.dir} walking={now.walking} scale={2.6} label={npc.name} className="resident-elf" />
        {now.mood && <span className="resident-mood" aria-hidden>{now.mood}</span>}
        <small>{npc.name} · {npc.role}</small>
      </button>;
    })}
  </>;
});
