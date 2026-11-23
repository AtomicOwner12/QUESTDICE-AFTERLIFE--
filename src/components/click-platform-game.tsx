import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { scoreClick, type ClickGame } from "@/lib/click-games";

type Contestant = { name: string };
const randomCell = () => Math.floor(Math.random() * 16);

export function ClickPlatformGame({ game, players, onDone }: { game: ClickGame; players: Contestant[]; onDone: () => void }) {
  const [player, setPlayer] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(game.seconds);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(0);
  const [progress, setProgress] = useState(0);
  const [green, setGreen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);
  const scoreRef = useRef(0);
  const deadline = useRef(0);
  const active = useRef(false);
  const lastTap = useRef(0);
  const expected = game.mode === "sequence" ? progress % game.targetCount : game.mode === "alternate" ? progress % 2 : game.mode === "memory" ? (sequence[progress] ?? 0) : target;

  function finish() {
    if (!active.current) return;
    active.current = false;
    setRunning(false);
    setScores((s) => [...s, scoreRef.current]);
    setPlayer((p) => p + 1);
    setLeft(game.seconds);
    if (player + 1 >= players.length) onDone();
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
      if (Date.now() >= deadline.current) finish();
    }, 50);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || !["moving", "reaction"].includes(game.mode)) return;
    const id = setInterval(() => {
      if (game.mode === "moving") setTarget(randomCell());
      else setGreen((g) => !g);
    }, game.interval);
    return () => clearInterval(id);
  }, [running, game.mode, game.interval]);

  useEffect(() => {
    if (!preview) return;
    const id = setTimeout(() => setPreview(false), 1500 + game.level * 100);
    return () => clearTimeout(id);
  }, [preview, game.level]);

  function start() {
    scoreRef.current = 0;
    setScore(0); setProgress(0); setTarget(randomCell()); setGreen(false);
    setSequence(Array.from({ length: Math.min(3 + game.level, 10) }, randomCell));
    setPreview(game.mode === "memory");
    lastTap.current = 0;
    deadline.current = Date.now() + game.seconds * 1000;
    active.current = true;
    setRunning(true);
  }

  function tap(cell: number) {
    if (!active.current || preview) return;
    if (Date.now() >= deadline.current) { finish(); return; }
    let delta = scoreClick(game, cell, expected, green);
    if (game.mode === "double") {
      if (lastTap.current === 0 || Date.now() - lastTap.current > game.interval / 2) {
        lastTap.current = Date.now(); return;
      }
      lastTap.current = 0;
    }
    if (game.mode === "sprint") delta = (progress + 1) % game.targetCount === 0 ? 2 : 1;
    scoreRef.current = Math.max(0, scoreRef.current + delta);
    setScore(scoreRef.current);
    if (delta > 0) {
      setProgress((p) => p + 1);
      if (["hunt", "dodge", "double", "precision"].includes(game.mode)) setTarget(randomCell());
      if (game.mode === "memory" && progress + 1 >= sequence.length) {
        setSequence(Array.from({ length: Math.min(3 + game.level, 10) }, randomCell));
        setProgress(0); setPreview(true);
      }
    } else if (game.mode === "memory") { setProgress(0); setPreview(true); }
  }

  if (player >= players.length) {
    const best = Math.max(...scores);
    return <div className="flex flex-col gap-2">{players.map((p, i) => <p key={i} className={scores[i] === best ? "text-primary" : "text-foreground"}>{p.name}: {scores[i]} Punkte {scores[i] === best ? "🏆" : ""}</p>)}</div>;
  }

  const instructions: Record<ClickGame["mode"], string> = {
    sprint: `Tippe so oft wie möglich! Jeder ${game.targetCount}. Klick zählt doppelt.`,
    hunt: "Fange den Stern! Nach jedem Treffer springt er weiter.",
    dodge: `Triff den Stern, nicht die ${Math.min(game.level, 15)} Bomben! Bomben kosten 2 Punkte.`,
    sequence: `Tippe 1 bis ${game.targetCount} in der richtigen Reihenfolge.`,
    alternate: "Tippe abwechselnd links und rechts. Falsche Seite: −1 Punkt.",
    double: `Triff den Stern zweimal innerhalb von ${Math.round(game.interval / 2)} ms.`,
    precision: "Triff das kleine Ziel möglichst oft!",
    moving: "Fange das wandernde Ziel!",
    memory: "Merke dir die Zahlen und tippe die Felder in derselben Reihenfolge.",
    reaction: "Tippe nur bei Grün! Bei Rot verlierst du einen Punkt.",
  };
  const single = game.mode === "sprint" || game.mode === "reaction";
  const cells = game.mode === "alternate" ? 2 : game.mode === "sequence" ? game.targetCount : 16;
  const visibleCells = game.mode === "dodge" ? Array.from({ length: Math.min(game.level + 1, 16) }, (_, i) => (target + i) % 16) : [target];

  return <div className="flex flex-col gap-3 min-w-0">
    <p className="text-[10px] leading-5">{instructions[game.mode]}</p>
    <div className="flex justify-between text-[10px]"><span className="break-all">{players[player]?.name}</span><span>{left}s · {score} Punkte</span></div>
    {!running ? <Button variant="ghost" className="retro-btn h-auto whitespace-normal" onClick={start}>▶ RUNDE STARTEN</Button> :
      <div className={`click-arena ${single ? "click-arena-single" : game.mode === "alternate" ? "click-arena-pair" : ""}`}>
        {single ? <Button variant="ghost" aria-label="Klickziel" className={`tap-btn h-full w-full text-2xl border-4 border-foreground ${game.mode === "reaction" ? green ? "bg-tile-mini" : "bg-tile-bad" : "bg-tile-click"}`} onPointerDown={(e) => { e.preventDefault(); tap(target); }} onClick={(e) => { if (e.detail === 0) tap(target); }}>{game.mode === "reaction" ? green ? "JETZT!" : "WARTE!" : "👆"}</Button> :
          Array.from({ length: cells }, (_, cell) => {
            const gridMode = ["sequence", "alternate", "memory"].includes(game.mode);
            const show = gridMode || visibleCells.includes(cell);
            const bomb = game.mode === "dodge" && cell !== target;
            return <div key={cell} className="flex items-center justify-center min-w-0">
              {show && <Button variant="ghost" aria-label={`Ziel ${cell + 1}`} disabled={preview} className={`tap-btn click-target text-base ${bomb ? "bg-tile-bad" : "bg-tile-click"} ${game.mode === "precision" ? "click-target-small" : ""}`} style={{ width: game.size, height: game.size }} onPointerDown={(e) => { e.preventDefault(); tap(cell); }} onClick={(e) => { if (e.detail === 0) tap(cell); }}>
                {game.mode === "sequence" ? cell + 1 : game.mode === "alternate" ? cell === 0 ? "←" : "→" : game.mode === "memory" ? preview ? sequence.map((value, i) => value === cell ? i + 1 : null).filter(Boolean).join("·") : "?" : bomb ? "💣" : "⭐"}
              </Button>}
            </div>;
          })}
      </div>}
    {running && game.mode === "memory" && <p className="text-[9px]">{preview ? "MERKEN …" : `${progress + 1}/${sequence.length}`}</p>}
  </div>;
}