import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { Avatar, type Player } from "@/components/remake-avatar";
import { ClickPlatformGame } from "@/components/click-platform-game";
import { QuizGame } from "@/components/quiz-game";
import { RemakeEvent } from "@/components/remake-event";
import { DeathPenalty } from "@/components/death-penalty";
import { Timer } from "@/components/event-timer";
import { Souls } from "@/components/party-fx";
import { createLobbyFn, joinLobbyFn, lobbyActionFn } from "@/lib/online.functions";
import { MAX_ONLINE_PLAYERS, MAX_ONLINE_TILES, CODE_LENGTH, normalizeCode, onlineTile, onlineGoal, onlineDice, onlineEndless, type OnlineAction, type OnlineState, type OnlineEvent } from "@/lib/online";
import { customIndex, effectLabel } from "@/lib/custom-maps";
import { MODES, platformFor, REMAKE_PLATFORMS } from "@/lib/remake";
import { LOCATIONS, locationUnique } from "@/lib/locations";
import { DEATH_GAMES, type TileType } from "@/lib/game";
import { CLICK_GAMES } from "@/lib/click-games";
import { QUIZ_QUESTIONS } from "@/lib/quiz";
import { SHOP_ITEMS, itemCost, type ShopItemId } from "@/lib/shop";
import { beep } from "@/lib/music";

export type OnlineSession = { code: string; seat: number; token: string };
const SESSION_KEY = "qd-online-session";

export function saveSession(s: OnlineSession | null) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY);
}
function loadSession(): OnlineSession | null {
  try { const s = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); return s && typeof s.code === "string" ? s : null; } catch { return null; }
}

/** Online tab inside MULTIPLAYER: create a lobby or join one with its code. */
export function OnlineTab({ me, onEnter }: { me: Player; onEnter: (s: OnlineSession) => void }) {
  const [name, setName] = useState(me.name);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [saved, setSaved] = useState<OnlineSession | null>(null);
  useEffect(() => { setSaved(loadSession()); }, []);
  const player = { name, skin: me.skin, look: me.look };

  async function create() {
    setBusy("create");
    const r = await createLobbyFn({ data: { player } }).catch(() => null);
    setBusy(null);
    if (!r || !r.ok) { toast.error(r && !r.ok ? r.error : "Lobby konnte nicht erstellt werden."); return; }
    beep(90);
    const s = { code: r.code, seat: r.seat, token: r.token }; saveSession(s); onEnter(s);
  }
  async function join() {
    setBusy("join");
    const r = await joinLobbyFn({ data: { code, player } }).catch(() => null);
    setBusy(null);
    if (!r || !r.ok) { toast.error(r && !r.ok ? r.error : "Beitreten hat nicht geklappt."); return; }
    beep(90);
    const s = { code: r.code, seat: r.seat, token: r.token }; saveSession(s); onEnter(s);
  }

  return (
    <div className="online-tab flex flex-col gap-5">
      <p className="text-[10px] leading-5 text-muted-foreground">Jeder spielt auf seinem eigenen Handy, Tablet oder PC – bis zu {MAX_ONLINE_PLAYERS} Spieler pro Lobby.</p>
      <div className="online-me">
        <span className="text-4xl pt-3"><Avatar p={player} /></span>
        <label className="flex flex-col gap-2 text-[10px] flex-1">DEIN NAME
          <input className="bg-input border-2 border-foreground p-2 text-xs text-foreground" value={name} maxLength={14} onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <p className="text-[9px] text-muted-foreground -mt-3">Dein Look kommt aus dem Skin Studio (Spieler 1).</p>
      {saved && (
        <Button variant="arcadeAlt" onClick={() => onEnter(saved)}>↩ ZURÜCK IN LOBBY {saved.code}</Button>
      )}
      <div className="online-cards">
        <div className="online-card">
          <span className="text-3xl">👑</span>
          <h3 className="text-xs text-primary">LOBBY ERSTELLEN</h3>
          <p className="text-[9px] leading-4 text-muted-foreground">Du bist der Host und bekommst einen Code für die anderen.</p>
          <Button variant="arcade" disabled={!!busy || !name.trim()} onClick={create}>{busy === "create" ? "ERSTELLE…" : "LOBBY ERSTELLEN"}</Button>
        </div>
        <div className="online-card">
          <span className="text-3xl">🔑</span>
          <h3 className="text-xs text-primary">LOBBY BEITRETEN</h3>
          <input aria-label="Lobby-Code" className="online-code-input" placeholder="CODE" value={code} maxLength={CODE_LENGTH} autoCapitalize="characters" autoComplete="off" onChange={(e) => setCode(normalizeCode(e.target.value))} />
          <Button variant="arcade" disabled={!!busy || code.length !== CODE_LENGTH || !name.trim()} onClick={join}>{busy === "join" ? "TRETE BEI…" : "BEITRETEN"}</Button>
        </div>
      </div>
    </div>
  );
}

/** Keeps the lobby state in sync: instant pings between devices plus a slow safety poll. */
function useLobby(code: string) {
  const [lobby, setLobby] = useState<{ state: OnlineState; version: number } | null>(null);
  const [missing, setMissing] = useState(false);
  const version = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const apply = useCallback((state: OnlineState, v: number) => {
    if (v <= version.current) return;
    version.current = v; setLobby({ state, version: v });
  }, []);
  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_online_lobby", { _code: code });
    if (error) return;
    const row = data?.[0];
    if (!row) { setMissing(true); return; }
    apply(row.state as unknown as OnlineState, row.version);
  }, [code, apply]);
  useEffect(() => {
    void refresh();
    const channel = supabase.channel(`qd-online-${code}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "bump" }, () => { void refresh(); })
      .subscribe();
    channelRef.current = channel;
    const poll = setInterval(() => { void refresh(); }, 2500);
    return () => { clearInterval(poll); channelRef.current = null; void supabase.removeChannel(channel); };
  }, [code, refresh]);
  const ping = useCallback(() => { void channelRef.current?.send({ type: "broadcast", event: "bump", payload: {} }); }, []);
  return { lobby, missing, apply, ping };
}

const TILE_CLASS: Partial<Record<TileType, string>> = {
  empty: "bg-tile-empty", task: "bg-tile-task", special: "bg-tile-mini", bad: "bg-tile-bad", death: "bg-tile-death", click: "bg-tile-click",
  quiz: "bg-tile-quiz", shop: "bg-tile-shop", tax: "bg-tile-tax", help: "bg-tile-help", local: "bg-tile-local", start: "bg-foreground", goal: "bg-tile-goal",
};
const TILE_ICON: Partial<Record<TileType, string>> = { task: "!", special: "★", bad: "☠", death: "💀", click: "👆", quiz: "?", shop: "🛒", tax: "💰", help: "🤝", local: "📍", start: "S", goal: "🏁" };

export function OnlineRoom({ session, onExit }: { session: OnlineSession; onExit: () => void }) {
  const { lobby, missing, apply, ping } = useLobby(session.code);
  const [busy, setBusy] = useState(false);
  const act = useCallback(async (action: OnlineAction) => {
    setBusy(true);
    const r = await lobbyActionFn({ data: { ...session, action } }).catch(() => null);
    setBusy(false);
    if (!r || !r.ok) { toast.error(r && !r.ok ? r.error : "Verbindung verloren – nochmal versuchen."); return false; }
    apply(r.state, r.version); ping();
    return true;
  }, [session, apply, ping]);
  const leave = () => { saveSession(null); onExit(); };

  if (missing) return (
    <div className="remake-game min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center text-xs">
      <h2 className="text-primary">LOBBY {session.code} GIBT ES NICHT MEHR</h2>
      <Button variant="arcade" onClick={leave}>ZUM MENÜ</Button>
    </div>
  );
  if (!lobby) return <div className="remake-game min-h-screen flex items-center justify-center text-xs text-muted-foreground">VERBINDE MIT LOBBY {session.code}…</div>;
  const s = lobby.state;
  const host = session.seat === 0;
  const me = s.players[session.seat];
  if (!me) return (
    <div className="remake-game min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center text-xs">
      <p>Du bist nicht mehr in dieser Lobby.</p><Button variant="arcade" onClick={leave}>ZUM MENÜ</Button>
    </div>
  );

  if (s.phase === "lobby") return <WaitingRoom s={s} code={session.code} seat={session.seat} busy={busy} act={act} onExit={onExit} onLeave={leave} />;
  if (s.phase === "over") return <OverScreen s={s} seat={session.seat} onLeave={leave} />;
  return <OnlineGame s={s} seat={session.seat} host={host} code={session.code} busy={busy} act={act} onExit={onExit} />;
}

function WaitingRoom({ s, code, seat, busy, act, onExit, onLeave }: { s: OnlineState; code: string; seat: number; busy: boolean; act: (a: OnlineAction) => Promise<boolean>; onExit: () => void; onLeave: () => void }) {
  const host = seat === 0;
  return (
    <div className="remake-game online-room min-h-screen flex flex-col items-center gap-6 p-6">
      <Souls count={14} className="game-souls" />
      <header className="w-full flex justify-between items-center text-[10px] max-w-3xl">
        <Button variant="ghost" className="retro-btn retro-btn-alt !p-2 text-[10px]" onClick={onExit}>◀ MENÜ</Button>
        <Button variant="ghost" className="text-[9px] underline" onClick={onLeave}>LOBBY VERLASSEN</Button>
      </header>
      <div className="online-code-panel">
        <span className="text-[10px] text-secondary">LOBBY-CODE</span>
        <strong className="online-code" aria-label={`Lobby-Code ${code}`}>{code.split("").map((c, i) => <span key={i} style={{ animationDelay: `${i * 90}ms` }}>{c}</span>)}</strong>
        <span className="text-[9px] leading-5 text-muted-foreground">Andere Geräte: MULTIPLAYER → ONLINE → Code eingeben</span>
      </div>
      <h2 className="text-xs text-primary">{s.players.length} / {MAX_ONLINE_PLAYERS} SPIELER</h2>
      <div className="online-players">
        {s.players.map((p, i) => (
          <div key={i} className={`online-player ${i === seat ? "is-me" : ""}`} style={{ animationDelay: `${(i % 12) * 40}ms` }}>
            <span className="text-3xl pt-3"><Avatar p={p} /></span>
            <span>{p.name}</span>
            <small>{i === 0 ? "👑 HOST" : i === seat ? "DU" : ""}</small>
          </div>
        ))}
      </div>
      {host ? (
        <>
        <MapPicker busy={busy} current={s.map?.title ?? null} act={act} />
        <section className="w-full max-w-3xl flex flex-col gap-4">
          <h3 className="text-xs text-primary">SPIELMODUS</h3>
          <div className="mode-grid">{MODES.map((m) => (
            <Button key={m.id} variant="ghost" aria-pressed={s.mode === m.id} disabled={busy} className={`mode-option ${s.mode === m.id ? "selected" : ""}`} onClick={() => { beep(); void act({ type: "settings", mode: m.id, location: s.location }); }}>
              <span className="text-2xl">{m.emoji}</span><span>{m.name}</span><small>{m.label}</small>
            </Button>))}</div>
          <label className="flex flex-col gap-2 text-[10px]">WO SEID IHR?
            <select className="bg-input border-2 border-foreground p-2 text-xs text-foreground" value={s.location} disabled={busy} onChange={(e) => void act({ type: "settings", mode: s.mode, location: e.target.value as OnlineState["location"] })}>
              {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.emoji} {l.name}</option>)}
            </select>
          </label>
          <Button variant="arcade" className="start-button" disabled={busy || s.players.length < 2} onClick={() => { beep(90); void act({ type: "start" }); }}>
            {s.players.length < 2 ? "WARTE AUF MITSPIELER…" : `SPIEL STARTEN (${s.players.length})`}
          </Button>
        </section>
        </>
      ) : (
        <p className="text-[10px] text-center leading-6">{s.map ? `🛠 ${s.map.title} · ` : ""}{MODES.find((m) => m.id === s.mode)?.emoji} {MODES.find((m) => m.id === s.mode)?.name} · {LOCATIONS.find((l) => l.id === s.location)?.emoji} {LOCATIONS.find((l) => l.id === s.location)?.name}<br /><span className="online-wait">Warte, bis der Host startet…</span></p>
      )}
    </div>
  );
}

/** Host picks one of their own saved maps; the whole lobby then plays those fields. */
function MapPicker({ busy, current, act }: { busy: boolean; current: string | null; act: (a: OnlineAction) => Promise<boolean> }) {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["maps", "mine", me?.id],
    enabled: !!me,
    queryFn: async () => ((await supabase.from("map_cards").select("id, title, length, dice, made_by_dicey").eq("owner_id", me!.id).order("updated_at", { ascending: false })).data ?? [])
      .flatMap((m) => (m.id && m.title ? [{ id: m.id, title: m.title, length: m.length ?? 0, dice: m.dice ?? 1, made_by_dicey: m.made_by_dicey ?? false }] : [])),
  });

  async function pick(id: string, title: string) {
    setLoading(true);
    const { data: row, error } = await supabase.from("maps").select("tiles, platforms, dice").eq("id", id).single();
    if (error || !row) { setLoading(false); toast.error("Map konnte nicht geladen werden."); return; }
    const tiles = Array.isArray(row.tiles) ? row.tiles : [];
    if (tiles.length > MAX_ONLINE_TILES) { setLoading(false); toast.error(`Deine Map ist zu lang für Online (max. ${MAX_ONLINE_TILES} Felder).`); return; }
    const ok = await act({ type: "map", map: { title, tiles, platforms: Array.isArray(row.platforms) ? row.platforms : [], dice: row.dice ?? 1 } });
    setLoading(false);
    if (ok) setOpen(false);
  }

  return (
    <section className="w-full max-w-3xl flex flex-col gap-3">
      <h3 className="text-xs text-primary">EIGENE MAP</h3>
      {current ? (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="text-[10px] text-primary">🛠 {current}</span>
          <Button variant="ghost" className="text-[9px] underline" disabled={busy} onClick={() => void act({ type: "map", map: null })}>Ohne eigene Map spielen</Button>
        </div>
      ) : !me ? (
        <p className="text-[9px] leading-5 text-muted-foreground">Melde dich im CUSTOM-Bereich an – dann kannst du eine deiner eigenen Maps für alle auswählen.</p>
      ) : (
        <>
          <Button variant="arcadeAlt" disabled={busy || loading} onClick={() => { beep(); setOpen((o) => !o); }}>{open ? "ZUMACHEN" : "🛠 EIGENE MAP WÄHLEN"}</Button>
          {open && (isLoading ? <p className="text-[9px] text-muted-foreground">Lade deine Maps…</p> : data.length === 0 ? (
            <p className="text-[9px] leading-5 text-muted-foreground">Du hast noch keine eigene Map. Bau eine im CUSTOM-Bereich (auch mit Dicey AI) – dann kannst du sie hier für alle auswählen.</p>
          ) : (
            <div className="online-map-grid">
              {data.map((m) => (
                <Button key={m.id} variant="ghost" className="retro-btn !p-2 text-[9px] h-auto flex flex-col items-center gap-1" disabled={busy || loading} onClick={() => void pick(m.id, m.title)}>
                  <span className="text-lg">{m.made_by_dicey ? "🤖" : "🛠"}</span>
                  <span className="text-primary">{m.title}</span>
                  <span>{m.length} Felder · {m.dice} Würfel</span>
                </Button>
              ))}
            </div>
          ))}
        </>
      )}
    </section>
  );
}

function OverScreen({ s, seat, onLeave }: { s: OnlineState; seat: number; onLeave: () => void }) {
  const ranked = s.players.map((p, i) => ({ p, i })).sort((a, b) => (a.p.place ?? 1e9) - (b.p.place ?? 1e9) || b.p.pos - a.p.pos);
  return (
    <div className="remake-game min-h-screen flex flex-col items-center gap-5 p-6 text-center">
      <h1 className="neon-title text-lg">🏆 ERGEBNIS</h1>
      <ol className="online-ranking">{ranked.map(({ p, i }, k) => (
        <li key={i} className={i === seat ? "is-me" : ""}><b>{k + 1}.</b><span className="text-2xl pt-2"><Avatar p={p} /></span><span className="flex-1 text-left">{p.name}</span><span>Feld {p.pos}</span></li>
      ))}</ol>
      <Button variant="arcade" onClick={onLeave}>ZUM MENÜ</Button>
    </div>
  );
}

function Lane({ s, seat, highlight }: { s: OnlineState; seat: number; highlight: boolean }) {
  const p = s.players[seat]!;
  const goal = onlineGoal(s);
  const VIEW = 8;
  const from = Math.max(0, Math.min(p.pos - 1, goal - VIEW + 1));
  const rows = Array.from({ length: VIEW }, (_, i) => from + i).filter((i) => i <= goal).reverse();
  return (
    <div className={`lane lane-p${seat % 4} flex-1 min-w-0 ${highlight ? "lane-active" : ""}`}>
      <p className="text-center text-[9px] mb-2 text-lane">{p.name}</p>
      {rows.map((i) => {
        const t = onlineTile(s.mode, p.seed, i, s.map);
        const ci = customIndex(t);
        const cp = ci === null ? undefined : s.map?.platforms[ci];
        const remake = platformFor(t);
        return (
          <div key={i} className="relative" style={{ height: 52, marginBottom: 6 }}>
            <div className={`tile absolute inset-y-0 left-[18%] w-[64%] flex items-center justify-center text-primary-foreground ${cp ? "bg-tile-custom" : remake ? `bg-tile-remake remake-kind-${remake.kind}${remake.series === "party" ? " tile-party" : remake.series === "afterlife" ? " tile-afterlife" : ""}` : TILE_CLASS[t] ?? "bg-tile-empty"}`}>
              <span className="absolute left-1 top-1 text-[7px]">{i}</span>
              <span className="text-base">{cp?.emoji ?? remake?.emoji ?? TILE_ICON[t] ?? ""}</span>
              {p.pos === i && <div className="absolute inset-0 flex items-end justify-center pb-1" style={{ transform: "rotateX(-58deg)", transformOrigin: "bottom" }}><span className={`text-4xl ${highlight ? "player-bob" : "opacity-80"}`}><Avatar p={p} /></span></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OnlineGame({ s, seat, host, code, busy, act, onExit }: { s: OnlineState; seat: number; host: boolean; code: string; busy: boolean; act: (a: OnlineAction) => Promise<boolean>; onExit: () => void }) {
  const myTurn = s.turn === seat;
  const current = s.players[s.turn]!;
  const goal = onlineGoal(s);
  const endless = onlineEndless(s);
  const [banner, setBanner] = useState(true);
  useEffect(() => { setBanner(true); if (s.turn === seat) beep(100); const t = setTimeout(() => setBanner(false), 2200); return () => clearTimeout(t); }, [s.turn, seat]);
  const standings = useMemo(() => s.players.map((p, i) => ({ p, i })).sort((a, b) => (a.p.place ?? 1e9) - (b.p.place ?? 1e9) || b.p.pos - a.p.pos), [s.players]);
  const dice = onlineDice(s);
  return (
    <div className="remake-game min-h-screen bg-background flex flex-col">
      <div className="game-party-lights" aria-hidden="true"><span /><span /></div>
      <Souls count={10} className="game-souls" />
      <header className="game-header flex items-center justify-between p-4 text-[10px] gap-2 flex-wrap">
        <Button variant="ghost" className="retro-btn retro-btn-alt !p-2 text-[10px]" onClick={onExit}>◀ MENÜ</Button>
        <span className="text-center">🌐 ONLINE · CODE <b className="text-primary">{code}</b><br />{s.map ? `🛠 ${s.map.title} · ` : ""}{MODES.find((m) => m.id === s.mode)?.name} · {LOCATIONS.find((l) => l.id === s.location)?.emoji} {LOCATIONS.find((l) => l.id === s.location)?.name}</span>
        {host ? <Button variant="ghost" className="retro-btn retro-btn-alt !p-2 text-[9px]" disabled={busy} onClick={() => { if (confirm("Spiel für alle beenden?")) void act({ type: "end" }); }}>■ BEENDEN</Button> : <span className="w-16" />}
      </header>

      <div className="online-standings" aria-label="Spielerliste">
        {standings.map(({ p, i }) => (
          <div key={i} className={`online-chip ${i === s.turn ? "is-turn" : ""} ${i === seat ? "is-me" : ""}`}>
            <span className="text-xl pt-1"><Avatar p={p} /></span>
            <span>{p.name}<br /><small>{p.place ? `🏁 ${p.place}.` : `${p.pos}/${endless ? "∞" : goal}`} · 🪙{p.coins}{p.shield ? " 🛡️" : ""}{p.double ? " 🎲" : ""}{p.frozen ? " 🧊" : ""}</small></span>
          </div>
        ))}
      </div>

      <div className={`lane-p${s.turn % 4} text-center text-lane text-xs turn-callout mt-2`}>{myTurn ? "DU BIST DRAN!" : `${current.name} ist dran`}</div>
      {banner && (
        <Button variant="ghost" className="fixed inset-0 h-full w-full whitespace-normal z-40 flex items-center justify-center bg-background/80" onClick={() => setBanner(false)} aria-label="Weiter">
          <div className={`lane-p${s.turn % 4} turn-banner retro-panel p-8 text-center flex flex-col gap-4 items-center`}>
            <span className="text-6xl pt-6"><Avatar p={current} /></span>
            <span className="text-lane text-lg">{myTurn ? "DU" : current.name}</span>
            <span className="text-primary text-xs">{myTurn ? "BIST DRAN!" : "IST DRAN!"}</span>
          </div>
        </Button>
      )}

      <div className="board-stage flex-1 flex justify-center overflow-hidden pt-4">
        <div className="board-track flex gap-3 w-[88%] max-w-xl" key={s.turn}>
          <Lane s={s} seat={s.turn} highlight />
          {!myTurn && s.players[seat]!.place === null && <Lane s={s} seat={seat} highlight={false} />}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 p-6">
        <div className="dice-stage" aria-live="polite">{(s.roll ?? Array.from({ length: dice }, () => 0)).map((f, k) => <span key={`${s.eventId}-${k}`} className={`dice-cube ${s.roll ? "dice-landed" : ""}`}>{f ? ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][f - 1] : "🎲"}</span>)}{s.roll && s.roll.length > 1 && <span className="dice-total">= {s.roll.reduce((a, b) => a + b, 0)}</span>}</div>
        {myTurn ? (
          <Button variant="ghost" className="retro-btn text-sm" disabled={busy || !!s.event} onClick={() => { beep(72); void act({ type: "roll" }); }}>{busy && !s.event ? "WÜRFELT…" : "WÜRFELN"}</Button>
        ) : (
          <p className="text-[10px] text-muted-foreground online-wait">{current.name} würfelt…</p>
        )}
        {host && !myTurn && <Button variant="ghost" className="text-[9px] underline" disabled={busy} onClick={() => void act({ type: "skip" })}>⏭ ZUG VON {current.name.toUpperCase()} ÜBERSPRINGEN</Button>}
        <ul className="online-log">{[...s.log].reverse().slice(0, 4).map((l, k) => <li key={`${s.log.length}-${k}`}>{l}</li>)}</ul>
      </div>

      {s.event && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 event-backdrop">
          <div className="retro-panel p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto flex flex-col gap-4 text-center text-xs leading-6">
            {myTurn
              ? <MyEvent key={s.eventId} s={s} ev={s.event} seat={seat} busy={busy} act={act} />
              : <SpectatorEvent s={s} ev={s.event} host={host} busy={busy} act={act} />}
          </div>
        </div>
      )}
    </div>
  );
}

function eventTitle(s: OnlineState, ev: OnlineEvent): string {
  switch (ev.kind) {
    case "task": return "! AUFGABE";
    case "special": return `★ SPECIAL · ${ev.name}`;
    case "bad": return "☠ UNGLÜCK!";
    case "quick": return "☠ SCHNELL-AUFGABE";
    case "death": return "💀 DEATH PENALTY";
    case "click": return `👆 CLICK SPIELE · ${CLICK_GAMES[ev.game]?.name ?? ""}`;
    case "quiz": return "? QUIZ";
    case "remake": { const p = REMAKE_PLATFORMS[ev.platform]; return `${p?.emoji ?? "✦"} ${p?.name ?? "REMAKE EVENT"}`; }
    case "local": { const u = locationUnique(s.location); return `${u.emoji} ${u.name.toUpperCase()}`; }
    case "shop": return "🛒 SHOP";
    case "tax": return "💰 TAX";
    case "help": return "🤝 HELP";
    case "custom": { const cp = s.map?.platforms[ev.platform]; return `🛠 ${cp?.name ?? "CUSTOM-PLATTFORM"}`; }
    case "win": return "🏆 IM ZIEL!";
    default: return "LEERES FELD";
  }
}

function SpectatorEvent({ s, ev, host, busy, act }: { s: OnlineState; ev: OnlineEvent; host: boolean; busy: boolean; act: (a: OnlineAction) => Promise<boolean> }) {
  const p = s.players[s.turn]!;
  return <>
    <span className="text-5xl pt-6"><Avatar p={p} /></span>
    <h2 className="text-primary text-sm">{eventTitle(s, ev)}</h2>
    {ev.kind === "task" || ev.kind === "quick" ? <p>{ev.text}</p> : ev.kind === "special" ? <p>{ev.desc}</p> : ev.kind === "custom" ? <p>{s.map?.platforms[ev.platform]?.text || s.map?.platforms[ev.platform]?.name || "Custom-Plattform"}</p> : ev.kind === "win" ? <p className="neon-title">{p.name} ist {ev.place}. im Ziel!</p> : null}
    <p className="online-wait text-[10px] text-muted-foreground">{p.name} spielt gerade auf dem eigenen Gerät…</p>
    {host && <Button variant="ghost" className="text-[9px] underline" disabled={busy} onClick={() => void act({ type: "skip" })}>⏭ ZUG ÜBERSPRINGEN</Button>}
  </>;
}

function MyEvent({ s, ev, seat, busy, act }: { s: OnlineState; ev: OnlineEvent; seat: number; busy: boolean; act: (a: OnlineAction) => Promise<boolean> }) {
  const me = s.players[seat]!;
  const [result, setResult] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const [item, setItem] = useState<ShopItemId | null>(null);
  const onDeath = useCallback((r: "ok" | "fail") => setResult(r === "ok"), []);
  const onDone = useCallback(() => setDone(true), []);
  const onRemake = useCallback((ok: boolean) => setResult(ok), []);
  const next = (extra: Partial<Extract<OnlineAction, { type: "resolve" }>> = {}) => { beep(); void act({ type: "resolve", ...extra }); };
  const weiter = (enabled = true, extra = {}) => <Button variant="ghost" className="retro-btn" disabled={busy || !enabled} onClick={() => next(extra)}>WEITER</Button>;
  const title = <h2 className="text-primary text-sm">{eventTitle(s, ev)}</h2>;
  const loc = LOCATIONS.find((l) => l.id === s.location)?.name ?? s.location;
  const solo = [{ name: me.name }];

  switch (ev.kind) {
    case "task": return <>{title}<p>{ev.text}</p><Timer seconds={120} onExpired={() => {}} />{weiter()}</>;
    case "special": return <>{title}<p>{ev.desc}</p><p className="text-[9px] text-muted-foreground">Spielt es zusammen – gewinnen bringt nichts, nur Spaß!</p>{weiter()}</>;
    case "bad": return <>{title}<p>Geh {ev.back} Schritte zurück!{me.shield ? " (Dein Schild schützt dich.)" : ""}</p>{weiter()}</>;
    case "quick":
      return <>{title}<p>{ev.text}</p>
        {ev.deadline === undefined
          ? <><p className="text-[10px]">Du hast 20 Sekunden. Sonst 3 Schritte zurück!</p><Button variant="ghost" className="retro-btn" disabled={busy} onClick={() => void act({ type: "go" })}>LOS!</Button></>
          : <><Timer key={ev.deadline} seconds={20} deadline={ev.deadline} onExpired={() => {}} />{weiter()}</>}</>;
    case "death": {
      const game = DEATH_GAMES[ev.game];
      return <>{title}{result === null && game ? <DeathPenalty game={game} onDone={onDeath} /> : <p className={result ? "text-tile-mini" : "text-destructive"}>{result ? "Überlebt! Du bleibst stehen." : "Verpasst! 15 Schritte zurück!"}</p>}{result !== null && weiter(true, { result })}</>;
    }
    case "click": {
      const game = CLICK_GAMES[ev.game];
      return <>{title}{game && <ClickPlatformGame game={game} players={solo} onDone={onDone} />}{weiter(done)}</>;
    }
    case "quiz": {
      const q = QUIZ_QUESTIONS[ev.question];
      return <>{title}{q && <QuizGame question={q} playerName={me.name} onDone={onDone} />}{weiter(done)}</>;
    }
    case "remake": {
      const pl = REMAKE_PLATFORMS[ev.platform];
      return <>{pl && <RemakeEvent platform={pl} variant={ev.variant} location={loc} players={solo} onDone={onRemake} />}{weiter(result !== null, { result: result ?? false })}</>;
    }
    case "local": { const u = locationUnique(s.location); return <>{title}<p>{u.desc}</p><p className={u.steps >= 0 ? "text-tile-mini" : "text-destructive"}>{u.steps >= 0 ? `+${u.steps}` : u.steps} Schritte</p>{weiter()}</>; }
    case "help": return <>{title}<div className="text-5xl">🛡️</div><p>Ein Sidekick-Geist schenkt dir ein Schutzschild gegen die nächste Strafe!</p>{weiter()}</>;
    case "custom": {
      const cp = s.map?.platforms[ev.platform];
      if (!cp) return <>{title}{weiter()}</>;
      return <>{title}<div className="text-5xl">{cp.emoji}</div>
        {cp.text && <p>{cp.text}</p>}
        {cp.effect === "task"
          ? <><p className="text-[10px]">Schaffe es in {cp.value} Sekunden!</p><Timer key={ev.platform} seconds={cp.value} onExpired={() => {}} /></>
          : <p className="text-accent">{effectLabel(cp)}</p>}
        {weiter()}</>;
    }
    case "tax": return <>{title}<p>{ev.from !== null ? `Du kassierst ${ev.amount} Münzen von ${s.players[ev.from]?.name}!` : "Niemand hat Münzen – nichts zu holen!"}</p>{weiter()}</>;
    case "win": return <>{title}<div className="text-6xl pt-6"><Avatar p={me} />🏆</div><p className="neon-title">PLATZ {ev.place}!</p>{weiter()}</>;
    case "shop": {
      const sel = SHOP_ITEMS.find((i) => i.id === item);
      const targets = s.players.map((p, i) => ({ p, i })).filter((x) => x.i !== seat && x.p.place === null);
      if (sel) return <>{title}<p className="text-primary">{sel.emoji} {sel.name}: Wen willst du treffen?</p>
        <div className="online-target-grid">{targets.map(({ p, i }) => <Button key={i} variant="ghost" className="retro-btn !p-2 text-[10px]" disabled={busy} onClick={() => next({ item: sel.id, target: i })}>{p.name}</Button>)}</div>
        <Button variant="ghost" className="text-[10px] underline" onClick={() => setItem(null)}>Abbrechen</Button></>;
      return <>{title}<p>Deine Münzen: 🪙{me.coins}</p>
        <div className="grid grid-cols-3 gap-2">{SHOP_ITEMS.map((i) => (
          <Button key={i.id} variant="ghost" disabled={busy || me.coins < itemCost(i.id) || (i.target === "other" && targets.length === 0)} onClick={() => (i.target === "other" ? setItem(i.id) : next({ item: i.id }))}
            className="border-2 border-tile-shop p-2 h-auto flex flex-col items-center gap-1 text-[8px] leading-4 whitespace-normal disabled:opacity-30">
            <span className="text-2xl">{i.emoji}</span><span className="text-primary">{i.name}</span><span>{i.desc}</span><span>🪙{itemCost(i.id)}</span>
          </Button>))}</div>
        <Button variant="ghost" className="retro-btn retro-btn-alt" disabled={busy} onClick={() => next()}>NICHTS KAUFEN</Button></>;
    }
    default: return <>{title}<p>Hier passiert nichts. Durchatmen!</p>{weiter()}</>;
  }
}
