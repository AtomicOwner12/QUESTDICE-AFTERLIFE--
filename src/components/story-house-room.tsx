import { useLayoutEffect, useRef } from "react";
import { StoryHero } from "./story-hero";
import { chestKey, type House, type Room } from "@/lib/story-houses";
import { drawRoom, spriteUrl, ART } from "@/lib/story-tiles";
import type { Direction } from "@/lib/story-world";
import type { HeroLook } from "@/lib/story";

const TILE = 40;

/** The inside of a house, cabin or ruin: a small pixel room you walk around in; chests open when you bump into them. */
export function HouseRoomView({ house, room, loot, x, y, dir, walking, look, scale }: {
  house: House; room: Room; loot: readonly string[]; x: number; y: number; dir: Direction; walking: boolean; look: HeroLook; scale: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current?.getContext("2d");
    if (c) drawRoom(c, room.rows, house.world, house.kind);
  }, [room, house.world, house.kind]);
  const at = (cx: number, cy: number) => ({ left: cx * TILE, top: cy * TILE });
  return <div className="house-room" role="region" aria-label={`Im Inneren: ${house.name}`}>
    <div className="house-room-stage" style={{ width: room.w * TILE, height: room.h * TILE, transform: `scale(${scale})` }}>
      <canvas ref={ref} width={room.w * ART} height={room.h * ART} className="house-room-canvas" />
      {room.chests.map((c) => {
        const open = loot.includes(chestKey(house.world, house.index, c.k));
        return <img key={c.k} src={spriteUrl(open ? "chestopen" : "chest", house.world)} alt={open ? "Leere Truhe" : "Truhe"} className={`house-chest ${open ? "is-open" : ""}`} style={at(c.x, c.y)} draggable={false} />;
      })}
      <span className="house-hero" style={at(x, y)}><StoryHero look={look} direction={dir} walking={walking} scale={3} gear /></span>
    </div>
    <div className="house-room-chip"><b>{house.emoji} {house.name}</b><small>Lauf gegen eine Truhe zum Öffnen · durch die Tür unten wieder hinaus</small></div>
  </div>;
}
