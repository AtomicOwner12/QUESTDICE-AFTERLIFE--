import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { askDiceyFn } from "@/lib/dicey.functions";
import { applyDiceyOps, describeMap, type ChatMessage, type MapState } from "@/lib/dicey-ops";
import type { Me } from "@/hooks/use-me";
import { Button } from "./ui/button";

type Bubble = ChatMessage & { steps?: string[]; shown?: number; canUndo?: boolean };
const STARTERS = ["Bau mir eine gruselige Geisterbahn mit 200 Feldern", "Mach eine kurze, chaotische Party-Map mit 2 Würfeln", "Eine Quiz-Map für die Schule mit vielen Fragen"];

const DICEY_THINKING = [
  "Dicey würfelt Ideen aus…",
  "Dicey zählt seine Augen nach…",
  "Dicey fragt kurz die Geister um Rat…",
  "Dicey rollt sich warm…",
  "Dicey sucht den Witz des Tages…",
];

/** Dicey works like a builder in a chat: remembers the conversation, builds step by step and changes only what was asked. */
export function DiceyChat({ map, me, onApply, onSignIn }: { map: MapState; me: Me; onApply: (next: MapState) => void; onSignIn: () => void }) {
  const ask = useServerFn(askDiceyFn);
  const [chat, setChat] = useState<Bubble[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS);
  const undo = useRef<MapState | null>(null);
  const list = useRef<HTMLDivElement>(null);

  // Reveal the build steps one after another.
  const last = chat[chat.length - 1];
  useEffect(() => {
    if (!last?.steps || (last.shown ?? 0) >= last.steps.length) return;
    const t = setTimeout(() => setChat((c) => c.map((b, i) => (i === c.length - 1 ? { ...b, shown: (b.shown ?? 0) + 1 } : b))), 380);
    return () => clearTimeout(t);
  }, [last]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [chat, thinking]);

  async function send(wish = text) {
    if (!me) return onSignIn();
    const msg = wish.trim();
    if (!msg || thinking) return;
    const history: ChatMessage[] = [...chat.map(({ role, text }) => ({ role, text })), { role: "user", text: msg }];
    setChat((c) => [...c.map((b) => ({ ...b, canUndo: false })), { role: "user", text: msg }]);
    setText(""); setThinking(true); setSuggestions([]);
    try {
      const res = await ask({ data: { messages: history, map: describeMap(map) } });
      if (!res.ok) { toast.error(res.error); setChat((c) => [...c, { role: "assistant", text: `😵 ${res.error}` }]); return; }
      const { state, done } = applyDiceyOps(map, res.turn.ops, Date.now() >>> 0);
      if (done.length) { undo.current = map; onApply(state); }
      setChat((c) => [...c, { role: "assistant", text: res.turn.reply, steps: done, shown: 0, canUndo: done.length > 0 }]);
      setSuggestions(res.turn.suggestions);
    } catch {
      toast.error("Dicey ist gerade nicht erreichbar. Bitte später nochmal versuchen.");
    } finally { setThinking(false); }
  }
  function revert() {
    if (!undo.current) return;
    onApply(undo.current); undo.current = null;
    setChat((c) => [...c.map((b) => ({ ...b, canUndo: false })), { role: "assistant", text: "↩️ Alles klar, ich habe meine letzte Änderung rückgängig gemacht." }]);
  }

  return (
    <section className="hub-card dicey-chat">
      <div className="flex items-center gap-3"><span className={`dicey-orb ${thinking ? "dicey-thinking" : ""}`} aria-hidden="true">🎲</span><div><h3 className="text-primary font-extrabold">DICEY · DEIN AI-BAUMEISTER</h3><p className="text-xs text-muted-foreground">Schreib Dicey wie einem Freund, was du willst. Dicey baut es Schritt für Schritt, merkt sich euer Gespräch und ändert nur, was du sagst – z. B. „mach die letzten 50 Felder schwerer".</p></div></div>
      <div ref={list} className="dicey-log" aria-live="polite">
        {chat.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">🎲 Hey! Was bauen wir heute?</p>}
        {chat.map((b, i) => (
          <div key={i} className={`dicey-msg ${b.role === "user" ? "is-user" : "is-dicey"}`}>
            {b.role === "assistant" && <span className="dicey-avatar" aria-hidden="true">🎲</span>}
            <div className="dicey-bubble">
              {b.steps && b.steps.length > 0 && <ul className="dicey-steps">
                {b.steps.map((s, k) => <li key={k} className={k < (b.shown ?? 0) ? "is-done" : "is-pending"}><span aria-hidden="true">{k < (b.shown ?? 0) ? "✓" : "◌"}</span>{s}</li>)}
              </ul>}
              {(!b.steps || (b.shown ?? 0) >= b.steps.length) && <p>{b.text}</p>}
              {b.canUndo && (b.shown ?? 0) >= (b.steps?.length ?? 0) && <button type="button" className="dicey-undo" onClick={revert}>↩ Rückgängig</button>}
            </div>
          </div>
        ))}
        {thinking && <div className="dicey-msg is-dicey"><span className="dicey-avatar" aria-hidden="true">🎲</span><div className="dicey-bubble dicey-typing"><span /><span /><span /> <em>{DICEY_THINKING[chat.length % DICEY_THINKING.length]}</em></div></div>}
      </div>
      {suggestions.length > 0 && !thinking && <div className="flex gap-2 flex-wrap">{suggestions.map((s) => <button key={s} type="button" className="dicey-chip" onClick={() => send(s)}>{s}</button>)}</div>}
      <div className="flex gap-2">
        <textarea className="hub-input min-h-12 flex-1" rows={2} maxLength={1200} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
          placeholder={me ? "z. B. Füge 10 Quiz-Felder am Ende hinzu und mach eine Falle, die 5 Schritte zurück schickt" : "Melde dich an, um mit Dicey zu bauen"} aria-label="Nachricht an Dicey" />
        <Button variant="arcade" disabled={thinking || (!!me && !text.trim())} onClick={() => void send()} aria-label="An Dicey senden">{thinking ? "…" : "➤"}</Button>
      </div>
    </section>
  );
}
