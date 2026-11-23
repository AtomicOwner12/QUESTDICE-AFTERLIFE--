import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function Timer({ seconds, deadline, onExpired }: { seconds: number; deadline?: number | undefined; onExpired: () => void }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(deadline !== undefined);
  const end = useRef(deadline ?? 0);
  const expireRef = useRef(onExpired);
  expireRef.current = onExpired;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) { clearInterval(id); setRunning(false); expireRef.current(); }
    }, 100);
    return () => clearInterval(id);
  }, [running]);
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-3xl ${left <= 10 ? "text-destructive" : "text-primary"}`}>{mm}:{ss}</div>
      {left === 0 ? <p className="text-destructive">ZEIT UM!</p> :
        !running && <Button variant="ghost" className="retro-btn retro-btn-alt h-auto !p-2 text-[10px]" onClick={() => { end.current = Date.now() + seconds * 1000; setRunning(true); }}>TIMER STARTEN</Button>}
    </div>
  );
}
