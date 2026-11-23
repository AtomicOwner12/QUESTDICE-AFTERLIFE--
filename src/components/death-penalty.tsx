import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QTE_WINDOW_MS, QTE_ROUNDS, type DeathGame } from "@/lib/game";
import { beep } from "@/lib/music";

export function DeathPenalty({ game, onDone }: { game: DeathGame; onDone: (r: "ok" | "fail") => void }) {
  const [round, setRound] = useState(0);
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState<"ready" | "wait" | "show">("ready");
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const [decoys, setDecoys] = useState<{ x: number; y: number }[]>([]);
  const rnd = () => ({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });
  // Keep timers alive when the parent re-renders with a new callback.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (phase === "wait") {
      const id = setTimeout(() => {
        setSpot(rnd()); setDecoys(Array.from({ length: game.decoys }, rnd)); setTaps(0); setPhase("show"); beep(90);
      }, 800 + Math.random() * 2000);
      return () => clearTimeout(id);
    }
    if (phase === "show") {
      const mv = game.moving ? setInterval(() => setSpot(rnd()), Math.max(10, QTE_WINDOW_MS / 3)) : undefined;
      const id = setTimeout(() => { beep(50); doneRef.current("fail"); }, QTE_WINDOW_MS * game.taps);
      return () => { clearTimeout(id); if (mv) clearInterval(mv); };
    }
    return undefined;
  }, [phase, game]);
  const hit = () => {
    beep();
    if (taps + 1 < game.taps) return setTaps((t) => t + 1);
    if (round + 1 >= QTE_ROUNDS) return onDone("ok");
    setRound((r) => r + 1); setPhase("wait");
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-primary">{game.name}</p>
      <p>{game.desc} {QTE_ROUNDS} Runden, je {QTE_WINDOW_MS} ms{game.taps > 1 ? ` pro Tap (${game.taps} Taps)` : ""}. Sonst 15 Schritte zurück!</p>
      <p className="text-primary">Runde {round + 1}/{QTE_ROUNDS}</p>
      <div className="relative w-full h-40 border-4 border-foreground bg-muted">
        {phase === "ready" && <Button variant="ghost" className="retro-btn tap-btn absolute inset-0 m-auto w-32 h-14 text-[10px]" onPointerDown={() => setPhase("wait")}>BEREIT</Button>}
        {phase === "wait" && <p className="absolute inset-0 flex items-center justify-center text-[10px]">WARTE...</p>}
        {phase === "show" && decoys.map((d, k) => (
          <Button variant="ghost" key={k} className="tap-btn absolute -translate-x-1/2 -translate-y-1/2 text-2xl" style={{ left: `${d.x}%`, top: `${d.y}%`, width: game.size, height: game.size }}
            onPointerDown={(e) => { e.preventDefault(); beep(50); onDone("fail"); }}>💣</Button>
        ))}
        {phase === "show" && (
          <Button variant="ghost" className="tap-btn absolute -translate-x-1/2 -translate-y-1/2 bg-tile-death border-4 border-foreground text-2xl" style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: game.size, height: game.size }}
            onPointerDown={(e) => { e.preventDefault(); hit(); }}>{game.emoji}{game.taps > 1 ? <span className="absolute -top-2 -right-2 text-[8px] bg-primary text-primary-foreground px-1">{game.taps - taps}</span> : null}</Button>
        )}
      </div>
    </div>
  );
}
