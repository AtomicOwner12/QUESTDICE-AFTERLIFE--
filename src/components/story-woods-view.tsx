import { useLayoutEffect, useRef } from "react";
import { StoryHero } from "./story-hero";
import { drawWoodsClearing, ART, RES } from "@/lib/story-tiles";
import { WOODS_N, SWORD_STONE, woodsCells } from "@/lib/story-woods";
import { inSwordGlade, type Direction } from "@/lib/story-world";
import type { HeroLook } from "@/lib/story";
import masterSwordAsset from "@/assets/story-master-sword.png.asset.json";

const TILE = 40;

/** Inside the Lost Woods: a misty clearing you walk through yourself. No arrows, no hints – only the forest. */
export function WoodsView({ stage, x, y, dir, walking, look, scale, swordDrawn }: {
  stage: number; x: number; y: number; dir: Direction; walking: boolean; look: HeroLook; scale: number; swordDrawn: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const glade = inSwordGlade(stage);
  useLayoutEffect(() => {
    const c = ref.current?.getContext("2d");
    if (c) drawWoodsClearing(c, woodsCells(stage), WOODS_N);
  }, [stage]);
  const at = (cx: number, cy: number) => ({ left: cx * TILE, top: cy * TILE });
  const stone = SWORD_STONE[0];
  return <div className={`woods-room ${glade ? "is-glade" : ""}`} data-stage={stage} role="region" aria-label={glade ? "Eine stille Lichtung in den Lost Woods" : "In den Lost Woods"}>
    <div key={stage} className="woods-room-stage" style={{ width: WOODS_N * TILE, height: WOODS_N * TILE, transform: `scale(${scale})` }}>
      <canvas ref={ref} width={WOODS_N * ART * RES} height={WOODS_N * ART * RES} className="woods-room-canvas" />
      {glade && <span className="woods-sword-stone" style={{ left: stone.x * TILE, top: (stone.y - 1) * TILE, width: TILE * 2, height: TILE * 2 }}>
        {!swordDrawn && <img src={masterSwordAsset.url} alt="Ein Schwert im Stein" draggable={false} />}
      </span>}
      <span className="woods-room-hero" style={at(x, y)}><StoryHero look={look} direction={dir} walking={walking} scale={3} gear /></span>
      <div className="woods-room-fog" aria-hidden><i /><i /><i /></div>
      {glade && <div className="woods-room-light" aria-hidden />}
    </div>
    <div className="house-room-chip"><b>🌲 Lost Woods</b></div>
  </div>;
}
