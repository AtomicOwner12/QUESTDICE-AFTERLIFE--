import { SKINS } from "@/lib/game";
import { BADGES, BACKS, FEET, TRAILS, SPIRITS, type Look } from "@/lib/avatar";
export type Player = { name: string; skin: string; look: Look };
export function Avatar({ p, className = "" }: { p: Player; className?: string }) {
  const l = p.look;
  return <span className={`remake-avatar relative inline-block leading-none aura-${l.aura} tint-${l.tint ?? 0} pattern-${l.pattern ?? 0} fx-${l.fx ?? 0} dance-${l.dance ?? 0} halo-${l.halo ?? 0} ${className}`}>
    {l.back !== undefined && <span className="avatar-back">{BACKS[l.back]}</span>}
    <span className="avatar-dance"><span className="avatar-core">{SKINS.find(s => s.id === p.skin)?.emoji ?? "🙂"}</span></span>
    <span className="avatar-pattern" />
    {(l.fx ?? 0) > 0 && <span className="avatar-fx" aria-hidden="true" />}
    {(l.halo ?? 0) > 0 && <span className="avatar-halo" aria-hidden="true" />}
    {(l.spirit ?? 0) > 0 && <span className="avatar-spirit" aria-hidden="true">{SPIRITS[l.spirit ?? 0]}</span>}
    {l.hat && <span className="avatar-hat">{l.hat}</span>}
    {l.face && <span className="avatar-face">{l.face}</span>}
    {l.hand && <span className="avatar-hand">{l.hand}</span>}
    {l.trail !== undefined && <span className="avatar-trail">{TRAILS[l.trail]}</span>}
    {l.badge !== undefined && <span className="avatar-badge">{BADGES[l.badge]}</span>}
    {l.feet !== undefined && <span className="avatar-feet">{FEET[l.feet]}</span>}
  </span>;
}
