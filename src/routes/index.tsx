import type { UniquePlatform } from "@/lib/locations";
import { LOCATIONS, locationUnique, locationTasks, locationQuickTasks, locationSpecials, type LocationId } from "@/lib/locations";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SKINS, MINIGAMES, DEATH_GAMES, type Minigame, type DeathGame, applyBad, randomBad, pick, teamOf, teamWinner,
  type TileType, type BadEffect,
} from "@/lib/game";
import { startMusic, stopMusic, beep } from "@/lib/music";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/event-timer";
import { DeathPenalty } from "@/components/death-penalty";
import { ClickPlatformGame } from "@/components/click-platform-game";
import { CLICK_GAMES, quickTaskPosition, type ClickGame } from "@/lib/click-games";
import { QuizGame } from "@/components/quiz-game";
import { SHOP_ITEMS, itemCost, buyItem, applyItem, payFor, stealItems, type ShopItemId } from "@/lib/shop";
import { SIDEKICKS, HELP_COST, sidekickRoll, sidekickCoins, sidekickPenalty, shopDiscount, isImmune, type Sidekick } from "@/lib/sidekicks";
import { DEFAULT_LOOK, LOOK_COMBINATIONS } from "@/lib/avatar";
import { Avatar, type Player } from "@/components/remake-avatar";
import { SkinStudio } from "@/components/skin-studio";
import { RemakeEvent } from "@/components/remake-event";
import { MODES, modeGoal, buildModeBoard, partyTile, advancePosition, hasFinished, platformFor, isEndless, usesStatelessBoard, diceCount, REMAKE_PLATFORMS, type GameMode, type RemakePlatform } from "@/lib/remake";
import remakeWorldAsset from "@/assets/afterlife-remake-lobby.jpg.asset.json";
const remakeWorld = remakeWorldAsset.url;
import { Confetti, Equalizer, Souls, SoulBeams, Ghosts } from "@/components/party-fx";
import { pickRoles, placePowerTiles, POWER_STEPS, ABILITIES, applyAbility, type Ability } from "@/lib/demon-angel";
import { QUIZ_QUESTIONS, type QuizQuestion } from "@/lib/quiz";
import { CustomHub, OPEN_CUSTOM_KEY, OPEN_MARKET_KEY } from "@/components/custom-hub";
import { Marketplace } from "@/components/marketplace";
import { StoryMode } from "@/components/story-mode";
import { CopyrightNotice } from "@/components/copyright-notice";
import { OnlineTab, OnlineRoom, type OnlineSession } from "@/components/online-hub";
import { customBoard, customIndex, applyCustomPlatform, effectLabel, type PlayableMap, type CustomPlatform } from "@/lib/custom-maps";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QUESTDICE AFTERLIFE REMAKE | Anniversary 4D Edition" },
      { name: "description", content: "Das Afterlife-Würfelspiel für 2 bis 4: 43 Welten, 300 Event-Plattformen, 12 Modi und Party ohne Ende – jetzt in 4D." },
      { property: "og:title", content: "QUESTDICE AFTERLIFE REMAKE | Anniversary 4D Edition" },
      { property: "og:description", content: "Das Afterlife-Würfelspiel für 2 bis 4: 43 Welten, 300 Event-Plattformen, 12 Modi und Party ohne Ende – jetzt in 4D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type Screen = "home" | "location" | "settings" | "skins" | "game" | "custom" | "market" | "story";

const skinEmoji = (id: string) => SKINS.find((s) => s.id === id)?.emoji ?? "🙂";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [allPlayers, setPlayers] = useState<Player[]>([
    { name: "Spieler 1", skin: "penguin", look: DEFAULT_LOOK },
    { name: "Spieler 2", skin: "tiger", look: DEFAULT_LOOK },
    { name: "Spieler 3", skin: "frog", look: DEFAULT_LOOK },
    { name: "Spieler 4", skin: "fox", look: DEFAULT_LOOK },
  ]);
  const [count, setCount] = useState(2);
  const [teamMode, setTeamMode] = useState(false);
  const [mode, setMode] = useState<GameMode>("anniversary");
  const players = allPlayers.slice(0, count);
  const [music, setMusic] = useState(false);
  const [loc, setLoc] = useState<LocationId>("zuhause");
  const [custom, setCustom] = useState<PlayableMap | null>(null);
  const [mpTab, setMpTab] = useState<"local" | "online">("local");
  const [online, setOnline] = useState<OnlineSession | null>(null);
  // Return to the Custom area after Google sign-in.
  useEffect(() => {
    if (sessionStorage.getItem(OPEN_CUSTOM_KEY)) { sessionStorage.removeItem(OPEN_CUSTOM_KEY); setScreen("custom"); }
    if (sessionStorage.getItem(OPEN_MARKET_KEY)) { sessionStorage.removeItem(OPEN_MARKET_KEY); setScreen("market"); }
  }, []);

  useEffect(() => {
    if (music && screen !== "game" && screen !== "story" && !online) startMusic();
    else stopMusic();
  }, [music, screen, online]);
  useEffect(() => () => stopMusic(), []);

  if (online) return <OnlineRoom key={online.code + online.seat} session={online} onExit={() => { setOnline(null); setMpTab("online"); setScreen("settings"); }} />;
  if (screen === "game") return <Game players={players} teams={teamMode && count === 4} mode={mode} location={loc} custom={custom} onExit={() => { setScreen(custom ? "custom" : "home"); setCustom(null); }} />;

  return (
    <div className={`remake-lobby min-h-screen ${screen === "home" ? "is-home" : ""}`} onPointerMove={(e) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      e.currentTarget.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    }}>
      <img src={remakeWorld} width={1920} height={1088} alt="Gestreifter Retro-Sonnenuntergang mit Heiligenschein über einem Neon-Raster, Polarlichtern und schwebenden Seelen" className="lobby-world" />
      {screen === "home" && <div className="lobby-motion" aria-hidden="true">
        <div className="lobby-stars" />
        <div className="lobby-stars lobby-stars-b" />
        <div className="lobby-aurora" />
        <div className="lobby-aurora lobby-aurora-b" />
        <div className="lobby-sun-glow" />
        <div className="lobby-horizon-flare" />
        <div className="lobby-floor-veil" />
        <div className="lobby-neon-floor lobby-neon-floor-glow" />
        <div className="lobby-neon-floor" />
        <div className="lobby-light-runner lobby-light-runner-a" />
        <div className="lobby-light-runner lobby-light-runner-b" />
        <SoulBeams />
        <Ghosts />
        <div className="lobby-spot lobby-spot-a" />
        <div className="lobby-spot lobby-spot-b" />
        <Equalizer />
        <Souls count={30} />
        <div className="lobby-strobe" />
        <div className="lobby-lightning" />
      </div>}
      <div className="lobby-shade" />
      {screen !== "story" && <CopyrightNotice />}
      <header className="lobby-header"><span className="brand-mark">⚄ QUESTDICE <b>AFTERLIFE REMAKE</b></span><span className="edition-label">ANNIVERSARY · <span className="badge-4d">4D</span> EDITION</span></header>
      <main className={`lobby-content ${screen === "home" ? "lobby-home" : "lobby-inner"}`}>
        {screen === "home" && (
          <>
            <span className="anniversary-eyebrow">✦ AFTERLIFE REMAKE · ANNIVERSARY 4D ✦</span>
            <h1 className="remake-title" data-text="QUESTDICE"><span className="title-main">QUESTDICE</span><span className="title-party" data-text="AFTERLIFE">AFTERLIFE</span><span className="title-sub">REMAKE</span></h1>
            <p className="home-tagline">Die Party geht weiter – sogar im Jenseits. 300 Plattformen, 43 Welten, 4D.</p>
            <div className="home-actions">
              <Button variant="arcade" className="start-button" onClick={() => { beep(); setScreen("location"); }}>SPIEL STARTEN <span>↗</span></Button>
              <div className="flex gap-3"><Button variant="arcadeAlt" onClick={() => setScreen("settings")}>♟ MULTIPLAYER</Button><Button variant="arcadeAlt" onClick={() => setScreen("skins")}>✦ SKIN STUDIO</Button></div>
              <Button variant="arcadeAlt" className="custom-button story-button" onClick={() => { beep(); setScreen("story"); }}>📖 STORY MODUS · 9 WELTEN + 9 BOSSE</Button>
              <Button variant="arcadeAlt" className="custom-button" onClick={() => { beep(); setScreen("custom"); }}>🛠 CUSTOM · EIGENE MAPS + DICEY AI</Button>
              <Button variant="arcadeAlt" className="custom-button market-button" onClick={() => { beep(); setScreen("market"); }}>🛒 MARKETPLACE · KAUFEN + VERKAUFEN</Button>
              <Button variant="ghost" className="music-control" onClick={() => setMusic(m => !m)} aria-pressed={music}>{music ? "♫" : "♪"} AFTERLIFE SOUND {music ? "AN" : "AUS"}</Button>
            </div>
            <div className="crew-row">{players.map((p, i) => <span key={i} className="player-bob text-3xl"><Avatar p={p} /></span>)}<span>{count} SPIELER · {MODES.find(m => m.id === mode)?.name}</span></div>
          </>
        )}

        {screen === "location" && (
          <section className="w-full">
            <div className="section-heading"><div><span className="text-secondary text-[10px]">AFTERLIFE-WELT AUSWÄHLEN · {LOCATIONS.length} ORTE</span><h2 className="section-title mt-2">WO SEID IHR?</h2>{custom && <p className="text-xs text-primary mt-2">🛠 Custom-Map: {custom.title}</p>}</div><Button variant="ghost" onClick={() => { setScreen(custom ? "custom" : "home"); setCustom(null); }} aria-label="Zurück">←</Button></div>
            <div className="location-grid">{LOCATIONS.map(l => <Button variant="ghost" key={l.id} className="location-option" style={{ animationDelay: `${LOCATIONS.indexOf(l) * 25}ms` }} onClick={() => { beep(); setLoc(l.id); setScreen("game"); }}><span className="text-3xl">{l.emoji}</span><span>{l.name}</span><span className="text-accent">↗</span></Button>)}</div>
          </section>
        )}
        {screen === "settings" && (
          <section className="settings-screen w-full flex flex-col gap-5">
            <h2 className="text-primary text-sm">MULTIPLAYER</h2>
            <div className="hub-tabs" role="tablist" aria-label="Multiplayer-Art">
              <button type="button" role="tab" className="hub-tab" aria-selected={mpTab === "local"} onClick={() => { beep(); setMpTab("local"); }}>🎮 LOKAL</button>
              <button type="button" role="tab" className="hub-tab" aria-selected={mpTab === "online"} onClick={() => { beep(); setMpTab("online"); }}>🌐 ONLINE</button>
            </div>
            {mpTab === "online" ? <>
              <OnlineTab me={allPlayers[0]!} onEnter={setOnline} />
              <Button variant="arcadeAlt" onClick={() => setScreen("home")}>◀ ZURÜCK</Button>
            </> : <>
            <p className="text-[10px] leading-5 text-muted-foreground">DEINE CREW · EIN GERÄT</p>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <Button variant="ghost" key={n} className={`retro-btn flex-1 !p-2 text-xs ${count === n ? "" : "retro-btn-alt"}`} onClick={() => { beep(); setCount(n); if (n !== 4) setTeamMode(false); }}>{n} SPIELER</Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className={`retro-btn flex-1 !p-2 text-xs ${!teamMode ? "" : "retro-btn-alt"}`} onClick={() => { beep(); setTeamMode(false); }}>JEDER GEGEN JEDEN</Button>
              <Button variant="ghost" className={`retro-btn flex-1 !p-2 text-xs ${teamMode ? "" : "retro-btn-alt"}`} onClick={() => { beep(); setCount(4); setTeamMode(true); }}>2 VS 2</Button>
            </div>
            {teamMode && <p className="text-[10px] leading-5 text-muted-foreground">Team A: Spieler 1 + 3 · Team B: Spieler 2 + 4. Ein Team gewinnt, wenn beide im Ziel sind.</p>}
            <h3 className="text-xs text-primary">SPIELMODUS</h3>
            <div className="mode-grid">{MODES.map(m => <Button key={m.id} variant="ghost" aria-pressed={mode === m.id} style={{ animationDelay: `${MODES.indexOf(m) * 40}ms` }} className={`mode-option ${mode === m.id ? "selected" : ""}`} onClick={() => { beep(); setMode(m.id); }}><span className="text-2xl">{m.emoji}</span><span>{m.name}</span><small>{m.label}</small></Button>)}</div>
            {players.map((p, i) => (
              <label key={i} className="flex flex-col gap-2 text-[10px]">
                SPIELER {i + 1} NAME
                <input
                  className="bg-input border-2 border-foreground p-2 text-xs text-foreground"
                  value={p.name}
                  maxLength={12}
                  onChange={(e) => setPlayers((ps) => ps.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
              </label>
            ))}
            <Button variant="arcade" onClick={() => setScreen("home")}>FERTIG</Button>
            </>}
          </section>
        )}

        {screen === "custom" && <CustomHub onPlay={(m) => { beep(); setCustom(m); setScreen("location"); }} onBack={() => setScreen("home")} />}
        {screen === "market" && <Marketplace players={players} onApplySkin={(i, skin, look) => setPlayers(ps => ps.map((x, j) => i === j ? { ...x, skin, look } : x))} onPlay={(m) => { beep(); setCustom(m); setScreen("location"); }} onBack={() => setScreen("home")} />}
        {screen === "story" && <StoryMode hero={allPlayers[0]!} onBack={() => setScreen("home")} />}
        {screen === "skins" && <SkinStudio players={players} onChange={(i, p) => setPlayers(ps => ps.map((x, j) => i === j ? p : x))} onBack={() => setScreen("home")} />}
      </main>
      {screen === "home" && <footer className="lobby-footer"><span>03 / AFTERLIFE REMAKE</span><span>{REMAKE_PLATFORMS.length} EVENT-PLATTFORMEN <b>✦</b> {MODES.length} MODI <b>✦</b> {LOCATIONS.length} WELTEN <b>✦</b> {(LOOK_COMBINATIONS / 1e18).toLocaleString("de-DE", { maximumFractionDigits: 1 })} TRILLIONEN LOOKS</span><span>LIVE. DIE. REPLAY.</span></footer>}
    </div>
  );
}

const TILE_CLASS: Partial<Record<TileType, string>> = {
  empty: "bg-tile-empty",
  task: "bg-tile-task",
  special: "bg-tile-mini",
  bad: "bg-tile-bad",
  death: "bg-tile-death",
  click: "bg-tile-click",
  quiz: "bg-tile-quiz",
  shop: "bg-tile-shop",
  tax: "bg-tile-tax",
  help: "bg-tile-help",
  local: "bg-tile-local",
  demon: "bg-tile-demon",
  angel: "bg-tile-angel",
  start: "bg-foreground",
  goal: "bg-tile-goal",
};
const TILE_ICON: Partial<Record<TileType, string>> = {
  empty: "", task: "!", special: "★", bad: "☠", death: "💀", click: "👆", quiz: "?", shop: "🛒", tax: "💰", help: "🤝", local: "📍", demon: "😈", angel: "😇", start: "S", goal: "🏁",
};

/** Tile height and vertical spacing on a lane (px). Tiles sit centered in their lane. */
const ROW_H = 56;
const ROW_GAP = 6;

type Event =
  | { type: "remake"; platform: RemakePlatform; variant: number; done?: boolean; success?: boolean }
  | { type: "task"; text: string; seconds: number; deadline?: number; expired?: boolean }
  | { type: "click"; game: ClickGame; done?: boolean }
  | { type: "quiz"; question: QuizQuestion; done?: boolean }
  | { type: "minigame"; game: Minigame }
  | { type: "bad"; effect: BadEffect }
  | { type: "death"; game: DeathGame; result?: "ok" | "fail" }
  | { type: "shop"; bought?: string }
  | { type: "tax"; stolen?: string }
  | { type: "help"; offer: Sidekick; taken?: boolean }
  | { type: "use"; item: ShopItemId; used?: string }
  | { type: "local"; steps: number }
  | { type: "empty" }
  | { type: "custom"; platform: CustomPlatform; done?: boolean }
  | { type: "win"; place: number; team?: number | null };

function Game({ players, teams, mode, location, custom, onExit }: { players: Player[]; teams: boolean; mode: GameMode; location: LocationId; custom: PlayableMap | null; onExit: () => void }) {
  const goal = custom ? custom.tiles.length + 1 : modeGoal(mode);
  const endless = !custom && isEndless(mode);
  const stateless = !custom && usesStatelessBoard(mode);
  const dice = custom ? Math.max(1, Math.min(3, custom.dice)) : diceCount(mode);
  const advance = (p: number, steps: number) => custom ? Math.max(0, Math.min(goal, p + steps)) : advancePosition(p, steps, mode);
  const done = (p: number) => custom ? p >= goal : hasFinished(p, mode);
  const customPlatform = (t: TileType) => { const i = customIndex(t); return i === null ? undefined : custom?.platforms[i]; };
  const seeds = useMemo(() => players.map(() => Math.floor(Math.random() * 1e9)), [players.length]);
  const tasks = useMemo(() => locationTasks(location), [location]);
  const quick = useMemo(() => locationQuickTasks(location), [location]);
  const specials = useMemo(() => locationSpecials(location), [location]);
  const unique = locationUnique(location);
  const [announce, setAnnounce] = useState(true);
  // Every player gets an own shuffled board, so nobody shares the same platforms.
  const [turn, setTurn] = useState(0);
  const roles = useMemo(() => pickRoles(players.length), [players.length]);
  const boards = useMemo(() => players.map((_, i) => {
    const b = custom ? customBoard(custom.tiles) : buildModeBoard(mode, seeds[i] ?? 42);
    return roles?.demon === i ? placePowerTiles(b, "demon") : roles?.angel === i ? placePowerTiles(b, "angel") : b;
  }), [players.length, roles, mode, seeds, custom]);
  const tileAt = (player: number, index: number): TileType => {
    if (stateless) {
      if (index >= goal) return "goal";
      const assigned = roles?.demon === player ? "demon" : roles?.angel === player ? "angel" : null;
      if (assigned && [12, 38, 66, 102, 138].includes(index)) return assigned;
      return partyTile(index, seeds[player] ?? 42);
    }
    return boards[player]?.[index] ?? "empty";
  };
  const [powers, setPowers] = useState({ demon: false, angel: false });
  const [powerUsed, setPowerUsed] = useState(false);
  const [aiming, setAiming] = useState(false);
  const [rolesIntro, setRolesIntro] = useState(roles !== null);
  const myPower = roles && powers.demon && roles.demon === turn ? "demon" : roles && powers.angel && roles.angel === turn ? "angel" : null;
  const [ability, setAbility] = useState<Ability | null>(null);
  function usePower(ab: Ability, target: number) {
    if (!myPower || powerUsed) return;
    beep(myPower === "demon" ? 50 : 100);
    const blocked = ab.side === "demon" && powers.angel && target === roles?.angel;
    const n = applyAbility({ pos, coins, frozen, shield }, ab.id, turn, target, goal, blocked);
    setPos(n.pos); setCoins(n.coins); setFrozen(n.frozen); setShield(n.shield);
    setNotice(blocked ? `😇 ${players[target]?.name} ist vom Engel geschützt!` : `${ab.side === "demon" ? "😈" : "😇"} ${ab.emoji} ${ab.name}${ab.self ? "" : ` → ${players[target]?.name}`}: ${ab.desc}!`);
    setPowerUsed(true); setAiming(false); setAbility(null);
  }
  const [sidekick, setSidekick] = useState<(Sidekick | null)[]>(() => players.map(() => null));
  const [pos, setPos] = useState(() => players.map(() => 0));
  const [finished, setFinished] = useState<number[]>([]);
  const nextActive = (from: number, done: number[]) => { let n = from; for (let k = 0; k < players.length; k++) { n = (n + 1) % players.length; if (!done.includes(n)) return n; } return from; };
  const [roll, setRoll] = useState<number[] | null>(null);
  const [landing, setLanding] = useState<{ player: number; index: number; key: number } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [coins, setCoins] = useState(() => players.map(() => 0));
  const [frozen, setFrozen] = useState(() => players.map(() => false));
  const [shield, setShield] = useState(() => players.map(() => false));
  const [dbl, setDbl] = useState(() => players.map(() => false));
  const [notice, setNotice] = useState<string | null>(null);
  const [inv, setInv] = useState<ShopItemId[][]>(() => players.map(() => []));
  const label = (id: ShopItemId, target: number) => { const it = SHOP_ITEMS.find((i) => i.id === id)!; return `${it.emoji} ${it.name}${it.target === "other" ? ` → ${players[target]?.name}` : ""}`; };

  function hire(offer: Sidekick) {
    if ((coins[turn] ?? 0) < HELP_COST) return;
    beep(90);
    setCoins((c) => c.map((x, i) => (i === turn ? x - HELP_COST : x)));
    setSidekick((s) => s.map((x, i) => (i === turn ? offer : x)));
    setEvent({ type: "help", offer, taken: true });
  }
  function save(id: ShopItemId) {
    const c = payFor(coins, turn, id, shopDiscount(sidekick[turn]));
    if (!c) return;
    beep(90); setCoins(c);
    setInv((v) => v.map((x, i) => (i === turn ? [...x, id] : x)));
    setEvent({ type: "shop", bought: `${label(id, turn)} (gespart)` });
  }
  function useSaved(id: ShopItemId, target: number) {
    const n = applyItem({ pos, coins, frozen, shield, double: dbl }, turn, id, target, goal);
    if (!n) return;
    beep(90);
    setPos(n.pos); setFrozen(n.frozen); setShield(n.shield); setDbl(n.double);
    setInv((v) => v.map((x, i) => { if (i !== turn) return x; const k = x.indexOf(id); return x.filter((_, j) => j !== k); }));
    setEvent({ type: "use", item: id, used: label(id, target) });
  }
  function tax(victim: number) {
    const loot = inv[victim] ?? [];
    beep(60);
    setInv((v) => stealItems(v, turn, victim));
    setEvent({ type: "tax", stolen: loot.length ? `${players[victim]?.name}: ${loot.map((id) => SHOP_ITEMS.find((i) => i.id === id)!.emoji).join(" ")}` : `${players[victim]?.name} hatte nichts gespart.` });
  }

  function buy(id: ShopItemId, target: number) {
    const n = buyItem({ pos, coins, frozen, shield, double: dbl }, turn, id, target, goal, shopDiscount(sidekick[turn]));
    if (!n) return;
    beep(90);
    setPos(n.pos); setCoins(n.coins); setFrozen(n.frozen); setShield(n.shield); setDbl(n.double);
    const it = SHOP_ITEMS.find((i) => i.id === id)!;
    setEvent({ type: "shop", bought: `${it.emoji} ${it.name}${it.target === "other" ? ` → ${players[target]?.name}` : ""}` });
  }
  /** Returns true if a shield absorbed the penalty. */
  function consumeShield() {
    if (!shield[turn]) return false;
    setShield((s) => s.map((x, i) => (i === turn ? false : x)));
    setNotice(`🛡️ Schild hat ${players[turn]?.name} beschützt!`);
    return true;
  }

  useEffect(() => {
    setAnnounce(true); setPowerUsed(false); setAiming(false); setAbility(null);
    const t = setTimeout(() => setAnnounce(false), 5000);
    return () => clearTimeout(t);
  }, [turn]);
  const me = pos[turn] ?? 0;
  const VIEW = 10;
  const from = Math.max(0, Math.min(me - 1, goal - VIEW + 1));
  const visible = Array.from({ length: VIEW }, (_, i) => from + i).filter((i) => i <= goal);

  function doRoll() {
    if (rolling || event || announce) return;
    setRolling(true);
    const faces = Array.from({ length: dice }, () => 1 + Math.floor(Math.random() * 6));
    const face = faces.reduce((a, b) => a + b, 0);
    const sk = sidekick[turn];
    const base = sidekickRoll(face, sk);
    const r = dbl[turn] ? base * 2 : base;
    if (dbl[turn]) setDbl((d) => d.map((x, i) => (i === turn ? false : x)));
    setRoll(faces);
    setNotice(null);
    beep(72);
    setTimeout(() => {
      const np = advance(me, r);
      setPos((p) => p.map((x, i) => (i === turn ? np : x)));
      setLanding({ player: turn, index: np, key: Date.now() });
      const t = tileAt(turn, np);
      const remake = platformFor(t);
      const behind = pos.filter((x, i) => i !== turn && x < np).length;
      setCoins((c) => c.map((x, i) => (i === turn ? x + sidekickCoins(np - me, t, behind, sk) : x)));
      if (sk && sk.kind !== "rollPlus" && base !== face) setNotice(`${sk.emoji} ${sk.name}: ${face} → ${base}`);
      setRolling(false);
      const cp = customPlatform(t);
      if (done(np)) { setFinished((f) => f.includes(turn) ? f : [...f, turn]); const nf = finished.includes(turn) ? finished : [...finished, turn]; setEvent({ type: "win", place: nf.length, team: teams ? teamWinner(nf, players.length) : null }); }
      else if (t === "demon" || t === "angel") {
        const first = !powers[t];
        setPowers((pw) => ({ ...pw, [t]: true }));
        setNotice(t === "demon" ? `😈 ${players[turn]?.name} hat DEMON TIME${first ? " – für das ganze Spiel!" : "."}` : `😇 ${players[turn]?.name} hat ANGEL TIME${first ? " – für das ganze Spiel!" : "."}`);
        setEvent({ type: "empty" });
      }
      else if (cp) setEvent({ type: "custom", platform: cp });
      else if (remake) setEvent({ type: "remake", platform: remake, variant: Math.floor(Math.random() * 1000) });
      else if (t === "local") setEvent({ type: "local", steps: unique.steps });
      else if (t === "task") setEvent({ type: "task", text: pick(tasks), seconds: 120 });
      else if (t === "special") setEvent({ type: "minigame", game: (location === "auto" || location === "zug" || Math.random() < 0.5 ? pick(specials) : pick(MINIGAMES)) });
      else if (t === "death") setEvent({ type: "death", game: pick(DEATH_GAMES) });
      else if (t === "click") setEvent({ type: "click", game: pick(CLICK_GAMES) });
      else if (t === "quiz") setEvent({ type: "quiz", question: pick(QUIZ_QUESTIONS) });
      else if (t === "shop") setEvent({ type: "shop" });
      else if (t === "tax") setEvent({ type: "tax" });
      else if (t === "help") setEvent({ type: "help", offer: pick(SIDEKICKS.filter((x) => x.id !== sk?.id)) });
      else if (t === "bad") setEvent({ type: "bad", effect: (() => { const e = randomBad(); return e.kind === "quick" ? { ...e, task: pick(quick) } : e; })() });
      else setEvent({ type: "empty" });
    }, 700);
  }

  function endTurn() {
    if (event?.type === "custom") {
      const cp = event.platform;
      if (cp.effect === "steps" && cp.value < 0 && consumeShield()) { /* absorbed */ }
      else {
        const n = applyCustomPlatform({ pos: pos[turn] ?? 0, coins: coins[turn] ?? 0, shield: shield[turn] ?? false }, cp, goal);
        setPos((p) => p.map((x, i) => (i === turn ? n.pos : x)));
        setCoins((c) => c.map((x, i) => (i === turn ? n.coins : x)));
        setShield((s) => s.map((x, i) => (i === turn ? n.shield : x)));
      }
    }
    if (event?.type === "remake") {
      if (!event.done) return;
      const p = event.platform;
      if (event.success) {
        if (p.kind === "coins") setCoins(c => c.map((x, i) => i === turn ? x + p.value : x));
        else if (p.kind === "shield") setShield(s => s.map((x, i) => i === turn ? true : x));
        else if (p.kind === "risk" && consumeShield()) { /* absorbed */ }
        else setPos(pos => pos.map((x, i) => i === turn ? Math.max(0, Math.min(goal - 1, x + p.value)) : x));
      }
    }
    if (event?.type === "bad") {
      const eff = event.effect;
      if (eff.kind === "quick") {
        setEvent({ type: "task", text: eff.task, seconds: 20, deadline: Date.now() + 20_000 });
        return;
      }
      const e2 = eff.kind === "back" ? { ...eff, steps: sidekickPenalty("bad", eff.steps, sidekick[turn]) } : eff;
      if (!consumeShield()) setPos((p) => p.map((x, i) => (i === turn ? applyBad(x, e2) : x)));
    }
    if (event?.type === "task" && event.deadline !== undefined) {
      const deadline = event.deadline;
      const late = quickTaskPosition(me, deadline, Date.now()) !== me;
      const loss = sidekickPenalty("bad", 3, sidekick[turn]);
      if (late && !consumeShield()) setPos((p) => p.map((x, i) => (i === turn ? Math.max(0, x - loss) : x)));
    }
    if (event?.type === "death" && event.result === "fail" && !consumeShield()) { const loss = sidekickPenalty("death", 15, sidekick[turn]); setPos((p) => p.map((x, i) => (i === turn ? Math.max(0, x - loss) : x))); }
    if (event?.type === "local") {
      const st = event.steps;
      if (st >= 0 || !consumeShield()) setPos((p) => p.map((x, i) => (i === turn ? Math.max(0, Math.min(goal - 1, x + st)) : x)));
    }
    setEvent(null);
    setRoll(null);
    let next = nextActive(turn, finished);
    if (frozen[next]) {
      const skipped = next;
      setFrozen((f) => f.map((x, i) => (i === skipped ? false : x)));
    }
    if (frozen[next] && isImmune(sidekick[next], "freeze")) {
      setNotice((n) => `${n ? n + " " : ""}${sidekick[next]!.emoji} Sidekick schützt ${players[next]?.name} vor dem Eis!`);
    } else if (frozen[next]) {
      const skipped = next;
      setNotice((n) => `${n ? n + " " : ""}🧊 ${players[skipped]?.name} ist eingefroren und setzt aus!`);
      next = nextActive(next, finished);
    }
    setTurn(next);
  }

  return (
    <div className="remake-game min-h-screen bg-background flex flex-col">
      <div className="game-party-lights" aria-hidden="true"><span /><span /></div>
      <Souls count={14} className="game-souls" />
      <header className="game-header flex items-center justify-between p-4 text-[10px] gap-2 flex-wrap">
        <Button variant="ghost" className="retro-btn retro-btn-alt !p-2 text-[10px]" onClick={onExit}>◀ MENÜ</Button>
        {players.map((p, i) => (
          <div key={i} className={`flex items-center gap-2 px-2 py-1 border-2 ${turn === i ? "border-primary" : "border-transparent"}`}>
            <span className="text-2xl pt-2"><Avatar p={p} /></span>
            <span>{p.name}{teams ? ` (Team ${teamOf(i) === 0 ? "A" : "B"})` : ""}<br />{pos[i]}/{endless ? "∞" : goal} · 🪙{coins[i]}{shield[i] ? " 🛡️" : ""}{dbl[i] ? " 🎲" : ""}{frozen[i] ? " 🧊" : ""}{roles && powers.demon && roles.demon === i ? " 😈" : ""}{roles && powers.angel && roles.angel === i ? " 😇" : ""}{sidekick[i] ? <><br /><span title={sidekick[i]!.desc}>🤝{sidekick[i]!.emoji} {sidekick[i]!.desc}</span></> : null}{inv[i]?.length ? <><br />🎒{inv[i]!.map((id) => SHOP_ITEMS.find((x) => x.id === id)!.emoji).join("")}</> : null}</span>
          </div>
        ))}
      </header>

      <div className="text-center text-[9px] text-muted-foreground mb-2">{custom ? `🛠 ${custom.title}` : MODES.find(m => m.id === mode)?.name} · {LOCATIONS.find(l => l.id === location)?.emoji} {LOCATIONS.find(l => l.id === location)?.name}</div>
      <div className={`lane-p${turn} text-center text-lane text-xs turn-callout`}>{players[turn]!.name} ist dran!</div>
      {rolesIntro && roles && (
        <Button variant="ghost" className="fixed inset-0 h-full w-full whitespace-normal z-[60] flex items-center justify-center bg-background/90" onClick={() => setRolesIntro(false)} aria-label="Weiter">
          <div className="turn-banner retro-panel p-8 text-center flex flex-col gap-4 items-center text-xs leading-6">
            <span className="text-tile-death text-lg">😈 DEMON TIME</span>
            <span>vs</span>
            <span className="text-tile-angel text-lg">😇 ANGEL TIME</span>
            <span>{players[roles.demon]?.name} hat 5 Demon-Felder 😈, {players[roles.angel]?.name} hat 5 Angel-Felder 😇.</span>
            <span className="text-muted-foreground">Wer sein Feld betritt, behält die Kraft das ganze Spiel. Demon wählt jede Runde eine von 5 bösen Kräften, Angel ist davor geschützt und wählt eine von 5 guten Kräften.</span>
            <span className="text-primary">TIPPEN ZUM START</span>
          </div>
        </Button>
      )}
      {announce && !event && (
        <Button variant="ghost" className="fixed inset-0 h-full w-full whitespace-normal z-50 flex items-center justify-center bg-background/80" onClick={() => setAnnounce(false)} aria-label="Weiter">
          <Confetti count={24} className="confetti-burst" />
          <div className={`lane-p${turn} turn-banner retro-panel p-8 text-center flex flex-col gap-4 items-center`}>
            <span className="text-6xl pt-6"><Avatar p={players[turn]!} /></span>
            <span className="text-lane text-lg">{players[turn]!.name}</span>
            <span className="text-primary text-xs">IST DRAN!</span>
          </div>
        </Button>
      )}
      {notice && <div className="text-center text-tile-shop text-[10px] mt-1">{notice}</div>}

      <div className="board-stage flex-1 flex justify-center overflow-hidden pt-4">
        <div className="board-track flex gap-2 w-[88%] max-w-2xl" key={turn}>
          {players.map((pl, pi) => {
            const rows = [...visible].reverse();
            const total = rows.length * ROW_H + Math.max(0, rows.length - 1) * ROW_GAP;
            const path = rows.map((i, j) => ({
              i,
              x: 50,
              y: ((j * (ROW_H + ROW_GAP) + ROW_H / 2) / total) * 100,
            }));
            return (
              <div key={pi} className={`lane lane-p${pi} flex-1 min-w-0 ${pi === turn ? "lane-active" : ""}`}>
                <div className="relative">
                  <svg className="lane-path absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <polyline points={path.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")} vectorEffect="non-scaling-stroke" />
                  </svg>
                  {path.map((p, j) => {
                    const t = tileAt(pi, p.i);
                    const remake = platformFor(t);
                    const cpl = customPlatform(t);
                    return (
                      <div key={p.i} className="relative" style={{ height: ROW_H, marginBottom: j < path.length - 1 ? ROW_GAP : 0 }}>
                        <div
                          className={`tile absolute top-0 bottom-0 w-[64%] flex items-center justify-center text-primary-foreground ${cpl ? "bg-tile-custom" : remake ? `bg-tile-remake remake-kind-${remake.kind}${remake.series === "party" ? " tile-party" : remake.series === "afterlife" ? " tile-afterlife" : ""}` : TILE_CLASS[t]}`}
                          style={{ left: `${p.x}%`, transform: "translateX(-50%)", animationDelay: `${j * 35}ms` }}
                        >
                          {landing && landing.player === pi && landing.index === p.i && <span key={landing.key} className="land-burst" aria-hidden="true" />}
                          <span className="absolute left-1 top-1 text-[7px]">{p.i}</span>
                          <span className="text-base" title={cpl?.name ?? remake?.name}>{cpl?.emoji ?? remake?.emoji ?? TILE_ICON[t]}</span>
                          {pos[pi] === p.i && (
                            <div className="absolute inset-0 flex items-end justify-center pb-1" style={{ transform: "rotateX(-58deg)", transformOrigin: "bottom" }}>
                              <span className={`text-4xl ${pi === turn ? "player-bob" : "opacity-80"}`}><Avatar p={pl} /></span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 p-6">
        <div className="flex gap-3 text-[8px] flex-wrap justify-center">
          {!custom && mode !== "classic" && <Legend c="bg-tile-remake" l="✦ Remake Events" />}
          {custom?.platforms.map((cp, k) => <Legend key={k} c="bg-tile-custom" l={`${cp.emoji} ${cp.name}`} />)}
          <Legend c="bg-tile-task" l="! Aufgabe" />
          <Legend c="bg-tile-mini" l="★ Special" />
          <Legend c="bg-tile-bad" l="☠ Unglück" />
          <Legend c="bg-tile-death" l="💀 Death" />
          <Legend c="bg-tile-click" l="👆 Click spiele" />
          <Legend c="bg-tile-quiz" l="? Quiz-Fragen" />
          <Legend c="bg-tile-shop" l="🛒 Shop" />
          <Legend c="bg-tile-tax" l="💰 Tax" />
          <Legend c="bg-tile-help" l="🤝 Help" />
          {roles && <Legend c="bg-tile-demon" l="😈 Demon Time" />}
          {roles && <Legend c="bg-tile-angel" l="😇 Angel Time" />}
          <Legend c="bg-tile-local" l={`${unique.emoji} ${unique.name}`} />
          <Legend c="bg-tile-empty" l="Leer" />
        </div>
        <div className="dice-stage" aria-live="polite">{(roll ?? Array.from({ length: dice }, () => 0)).map((f, k) => <span key={`${k}-${f}-${rolling}`} className={`dice-cube ${rolling ? "dice-roll" : roll ? "dice-landed" : ""}`}>{f ? ["⚀","⚁","⚂","⚃","⚄","⚅"][f - 1] : "🎲"}</span>)}{roll && dice > 1 && !rolling && <span className="dice-total">= {roll.reduce((a, b) => a + b, 0)}</span>}</div>
        {!event && !rolling && (inv[turn]?.length ?? 0) > 0 && (
          <div className="flex gap-2 flex-wrap justify-center text-[8px]">
            <span>🎒 Benutzen:</span>
            {inv[turn]!.map((id, k) => { const it = SHOP_ITEMS.find((x) => x.id === id)!; return (
              <Button variant="ghost" key={k} className="border-2 border-tile-shop px-2 py-1" onClick={() => (it.target === "other" ? setEvent({ type: "use", item: id }) : useSaved(id, turn))}>{it.emoji} {it.name}</Button>
            ); })}
          </div>
        )}
        {!event && !rolling && myPower && !powerUsed && (
          <div className="flex gap-2 flex-wrap justify-center text-[8px]">
            {!ability ? (
              <>
                <span>{myPower === "demon" ? "😈 DEMON TIME:" : "😇 ANGEL TIME:"}</span>
                {ABILITIES.filter((x) => x.side === myPower).map((x) => (
                  <Button variant="ghost" key={x.id} className={`border-2 px-2 py-1 ${myPower === "demon" ? "border-tile-demon" : "border-tile-angel"}`} onClick={() => (x.self ? usePower(x, turn) : setAbility(x))}>{x.emoji} {x.name}<br />{x.desc}</Button>
                ))}
              </>
            ) : (
              <>
                <span>{ability.emoji} {ability.side === "demon" ? "Wen treffen?" : "Wen segnen?"}</span>
                {players.map((pl, i) => (ability.side === "demon" && i === turn) || finished.includes(i) ? null : (
                  <Button variant="ghost" key={i} className="border-2 border-foreground px-2 py-1" onClick={() => usePower(ability, i)}>{pl.name}</Button>
                ))}
                <Button variant="ghost" className="border-2 border-muted px-2 py-1" onClick={() => setAbility(null)}>✕</Button>
              </>
            )}
          </div>
        )}
        <Button variant="ghost" className="retro-btn text-sm" onClick={doRoll} disabled={rolling || !!event}>WÜRFELN</Button>
      </div>

      {event && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 event-backdrop">
          {event.type === "win" && <Confetti count={60} />}
          <div className="retro-panel p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto flex flex-col gap-4 text-center text-xs leading-6">
            {event.type === "custom" ? <CustomEventPanel platform={event.platform} /> : event.type === "remake" ? <RemakeEvent key={`${event.platform.id}-${event.variant}`} platform={event.platform} variant={event.variant} location={LOCATIONS.find(l => l.id === location)?.name ?? location} players={players} onDone={success => setEvent(e => e?.type === "remake" ? { ...e, done: true, success } : e)} /> : event.type === "shop" ? <ShopPanel bought={event.bought} discount={shopDiscount(sidekick[turn])} coins={coins[turn] ?? 0} players={players} turn={turn} onBuy={buy} onSave={save} />
              : event.type === "help" ? <HelpPanel offer={event.offer} taken={event.taken} current={sidekick[turn] ?? null} coins={coins[turn] ?? 0} onHire={hire} />
              : event.type === "tax" ? <TaxPanel stolen={event.stolen} immune={players.map((_, i) => isImmune(sidekick[i], "tax"))} inv={inv} players={players} turn={turn} onSteal={tax} />
              : event.type === "use" ? <UsePanel item={event.item} used={event.used} players={players} turn={turn} onUse={useSaved} onCancel={() => setEvent(null)} /> : event.type === "quiz" ? <QuizGame question={event.question} playerName={players[turn]?.name ?? "Spieler"} onDone={() => setEvent((ev) => ev?.type === "quiz" ? { ...ev, done: true } : ev)} /> : <EventBody event={event} players={players} turn={turn} teams={teams} unique={unique} onExpired={() => setEvent((ev) => ev?.type === "task" ? { ...ev, expired: true } : ev)} onClickDone={() => setEvent((ev) => ev?.type === "click" ? { ...ev, done: true } : ev)} onDeath={(r) => setEvent((ev) => ev && ev.type === "death" ? { ...ev, result: r } : ev)} />}
            {(event.type === "remake" && !event.done) || (event.type === "death" && !event.result) || (event.type === "click" && !event.done) || (event.type === "quiz" && !event.done) || (event.type === "tax" && !event.stolen && players.some((_, i) => i !== turn && (inv[i]?.length ?? 0) > 0 && !isImmune(sidekick[i], "tax"))) || (event.type === "use" && !event.used) ? null : event.type === "win" && (teams ? event.team != null : finished.length >= players.length) ? (
              <Button variant="ghost" className="retro-btn" onClick={onExit}>ZUM MENÜ</Button>
            ) : (
              <Button variant="ghost" className="retro-btn" onClick={event.type === "use" ? () => setEvent(null) : endTurn}>
                {event.type === "bad" && event.effect.kind === "quick" ? "LOS!" : "WEITER"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HelpPanel({ offer, taken, current, coins, onHire }: { offer: Sidekick; taken?: boolean | undefined; current: Sidekick | null; coins: number; onHire: (s: Sidekick) => void }) {
  if (taken) return <><h2 className="text-tile-help">🤝 HELP</h2><div className="text-5xl">{offer.emoji}</div><p className="text-primary">{offer.name} ist jetzt dein Sidekick!</p><p>{offer.desc}</p></>;
  return <>
    <h2 className="text-tile-help">🤝 HELP – SIDEKICK</h2>
    <div className="text-5xl">{offer.emoji}</div>
    <p className="text-primary">{offer.name}</p>
    <p>Fähigkeit: {offer.desc}</p>
    {current && <p className="text-[10px] text-muted-foreground">Dein jetziger Sidekick: {current.emoji} {current.name} – {current.desc}. Du kannst nur austauschen.</p>}
    <Button variant="ghost" className="retro-btn !p-2 text-[10px]" disabled={coins < HELP_COST} onClick={() => onHire(offer)}>{current ? "AUSTAUSCHEN" : "KAUFEN"} 🪙{HELP_COST}</Button>
    {coins < HELP_COST && <p className="text-[9px] text-destructive">Nicht genug Münzen (du hast 🪙{coins}).</p>}
  </>;
}

function ShopPanel({ bought, discount, coins, players, turn, onBuy, onSave }: { bought?: string | undefined; discount: number; coins: number; players: Player[]; turn: number; onBuy: (id: ShopItemId, target: number) => void; onSave: (id: ShopItemId) => void }) {
  const [sel, setSel] = useState<ShopItemId | null>(null);
  const [aim, setAim] = useState(false);
  const others = players.map((p, i) => ({ p, i })).filter((x) => x.i !== turn);
  if (bought) return <><h2 className="text-tile-shop">🛒 SHOP</h2><p>Gekauft: {bought}</p></>;
  const item = SHOP_ITEMS.find((i) => i.id === sel);
  return <>
    <h2 className="text-tile-shop">🛒 SHOP</h2>
    <p>Deine Münzen: 🪙{coins} <span className="text-muted-foreground">(1 Münze pro gelaufenem Schritt)</span></p>
    {item && aim ? <>
      <p className="text-primary">{item.emoji} {item.name}: Wen willst du treffen?</p>
      <div className="flex flex-wrap gap-2 justify-center">{others.map(({ p, i }) => <Button variant="ghost" key={i} className="retro-btn !p-2 text-[10px]" onClick={() => onBuy(item.id, i)}>{skinEmoji(p.skin)} {p.name}</Button>)}</div>
      <Button variant="ghost" className="text-[10px] underline" onClick={() => { setSel(null); setAim(false); }}>Abbrechen</Button>
    </> : item ? <>
      <p className="text-primary">{item.emoji} {item.name} für 🪙{itemCost(item.id, discount)}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="ghost" className="retro-btn !p-2 text-[10px]" onClick={() => (item.target === "other" ? setAim(true) : onBuy(item.id, turn))}>JETZT BENUTZEN</Button>
        <Button variant="ghost" className="retro-btn retro-btn-alt !p-2 text-[10px]" onClick={() => onSave(item.id)}>FÜR SPÄTER SPAREN</Button>
      </div>
      <p className="text-[8px] text-muted-foreground">Achtung: Gesparte Items können auf 💰 Tax-Feldern gestohlen werden!</p>
      <Button variant="ghost" className="text-[10px] underline" onClick={() => setSel(null)}>Abbrechen</Button>
    </> : <>
      {(["other", "self"] as const).map((kind) => <div key={kind} className="flex flex-col gap-2">
        <p className="text-[10px] text-muted-foreground">{kind === "other" ? "SABOTAGE" : "HILFE FÜR DICH"}</p>
        <div className="grid grid-cols-3 gap-2">{SHOP_ITEMS.filter((i) => i.target === kind).map((i) => (
          <Button variant="ghost" key={i.id} disabled={coins < itemCost(i.id, discount)} onClick={() => setSel(i.id)}
            className="border-2 border-tile-shop p-2 flex flex-col items-center gap-1 text-[8px] leading-4 disabled:opacity-30">
            <span className="text-2xl">{i.emoji}</span><span className="text-primary">{i.name}</span><span>{i.desc}</span><span>🪙{itemCost(i.id, discount)}</span>
          </Button>))}</div>
      </div>)}
    </>}
  </>;
}

function TaxPanel({ stolen, immune, inv, players, turn, onSteal }: { stolen?: string | undefined; immune: boolean[]; inv: ShopItemId[][]; players: Player[]; turn: number; onSteal: (victim: number) => void }) {
  const victims = players.map((p, i) => ({ p, i })).filter((x) => x.i !== turn && (inv[x.i]?.length ?? 0) > 0 && !immune[x.i]);
  return <>
    <h2 className="text-tile-tax">💰 TAX</h2>
    {stolen ? <p>Gestohlen von {stolen}</p> : victims.length === 0 ? <p>Niemand hat Items gespart – nichts zu holen!</p> : <>
      <p>Wähle einen Spieler und stiehl alle seine gesparten Items:</p>
      <div className="flex flex-wrap gap-2 justify-center">{victims.map(({ p, i }) => (
        <Button variant="ghost" key={i} className="retro-btn !p-2 text-[10px]" onClick={() => onSteal(i)}>{skinEmoji(p.skin)} {p.name} 🎒{inv[i]!.map((id) => SHOP_ITEMS.find((x) => x.id === id)!.emoji).join("")}</Button>
      ))}</div>
    </>}
  </>;
}

function UsePanel({ item, used, players, turn, onUse, onCancel }: { item: ShopItemId; used?: string | undefined; players: Player[]; turn: number; onUse: (id: ShopItemId, target: number) => void; onCancel: () => void }) {
  const it = SHOP_ITEMS.find((x) => x.id === item)!;
  if (used) return <><h2 className="text-tile-shop">🎒 ITEM</h2><p>Benutzt: {used}</p></>;
  return <>
    <h2 className="text-tile-shop">🎒 {it.emoji} {it.name}</h2>
    <p>Wen willst du treffen?</p>
    <div className="flex flex-wrap gap-2 justify-center">{players.map((p, i) => i === turn ? null : <Button variant="ghost" key={i} className="retro-btn !p-2 text-[10px]" onClick={() => onUse(item, i)}>{skinEmoji(p.skin)} {p.name}</Button>)}</div>
    <Button variant="ghost" className="text-[10px] underline" onClick={onCancel}>Abbrechen</Button>
  </>;
}

function CustomEventPanel({ platform }: { platform: CustomPlatform }) {
  return <>
    <span className="text-[9px] text-secondary">🛠 CUSTOM-PLATTFORM</span>
    <div className="text-5xl">{platform.emoji}</div>
    <h2 className="text-tile-custom text-sm">{platform.name}</h2>
    {platform.text && <p>{platform.text}</p>}
    {platform.effect === "task" ? <Timer seconds={platform.value} onExpired={() => {}} /> : <p className="text-accent">{effectLabel(platform)}</p>}
  </>;
}

function Legend({ c, l }: { c: string; l: string }) {
  return <span className="flex items-center gap-1"><span className={`w-3 h-3 inline-block ${c}`} />{l}</span>;
}

function EventBody({ event, players, turn, teams, unique, onDeath, onExpired, onClickDone }: { event: Event; players: Player[]; turn: number; teams: boolean; unique: UniquePlatform; onDeath: (r: "ok" | "fail") => void; onExpired: () => void; onClickDone: () => void }) {
  if (event.type === "custom" || event.type === "remake" || event.type === "quiz" || event.type === "shop" || event.type === "tax" || event.type === "use" || event.type === "help") return null;
  if (event.type === "click") return <><h2 className="text-tile-click">👆 CLICK SPIELE</h2><p className="text-primary">{event.game.name}</p><ClickPlatformGame game={event.game} players={players} onDone={onClickDone} /></>;
  if (event.type === "death")
    return <><h2 className="text-tile-death">💀 DEATH PENALTY</h2>
      {event.result ? <p className={event.result === "ok" ? "text-tile-mini" : "text-destructive"}>{event.result === "ok" ? "Überlebt! Du bleibst stehen." : "Verpasst! 15 Schritte zurück!"}</p>
        : <DeathPenalty key={event.game.id} game={event.game} onDone={onDeath} />}</>;
  if (event.type === "local")
    return <><h2 className="text-tile-local">{unique.emoji} {unique.name.toUpperCase()}</h2><p>{unique.desc}</p><p className={unique.steps >= 0 ? "text-tile-mini" : "text-destructive"}>{unique.steps >= 0 ? `+${unique.steps}` : unique.steps} Schritte</p></>;
  if (event.type === "win" && teams)
    return <><div className="text-6xl pt-6"><Avatar p={players[turn]!} />🏆</div><h2 className="neon-title text-lg">{players[turn]!.name} IST IM ZIEL!</h2><p>{event.team != null ? `TEAM ${event.team === 0 ? "A" : "B"} GEWINNT! (${players.filter((_, i) => teamOf(i) === event.team).map((p) => p.name).join(" + ")})` : "Jetzt muss dein Teampartner auch noch ins Ziel!"}</p></>;
  if (event.type === "win")
    return <><div className="text-6xl pt-6"><Avatar p={players[turn]!} />🏆</div><h2 className="neon-title text-lg">{players[turn]!.name} {event.place === 1 ? "GEWINNT!" : `IST ${event.place}. PLATZ!`}</h2><p>{event.place < players.length ? "Die anderen spielen weiter bis ins Ziel." : event.place === players.length ? "Alle anderen sind im Ziel – Spiel vorbei!" : ""}</p></>;
  if (event.type === "empty") return <><h2 className="text-muted-foreground">LEERES FELD</h2><p>Hier passiert nichts. Durchatmen!</p></>;
  if (event.type === "task")
    return <><h2 className={event.deadline ? "text-tile-bad" : "text-tile-task"}>{event.deadline ? "☠ SCHNELL-AUFGABE" : "AUFGABE"}</h2><p>{event.text}</p><Timer key={event.text + event.seconds} seconds={event.seconds} deadline={event.deadline} onExpired={onExpired} />{event.expired && event.deadline !== undefined && <p className="text-destructive">Zeit um! 3 Schritte zurück.</p>}</>;
  if (event.type === "bad") {
    const e = event.effect;
    return <><h2 className="text-tile-bad">☠ UNGLÜCK!</h2><p>
      {e.kind === "back" ? `Geh ${e.steps} Schritte zurück!` : e.kind === "start" ? "Zurück zum Anfang!" : `Schnell-Aufgabe in 20 Sekunden: ${e.task}`}
    </p></>;
  }
  return <><h2 className="text-tile-mini">★ SPECIAL</h2><p className="text-primary">{event.game.name}</p>
    {event.game.id === "rps" ? <RPS players={[players[turn]!, players[(turn + 1) % players.length]!]} />
      : event.game.id === "clicker" ? <><p>{event.game.desc}</p><Clicker players={players} /></>
      : event.game.id === "reaction" ? <><p>{event.game.desc}</p><Reaction players={players} /></>
      : <p>{event.game.desc}</p>}
    <p className="text-[9px] text-muted-foreground">Gewinnen bringt nichts – nur Spaß!</p></>;
}


const RPS_OPTS = [{ id: 0, e: "✊", n: "Stein" }, { id: 1, e: "✋", n: "Papier" }, { id: 2, e: "✌️", n: "Schere" }];
function RPS({ players }: { players: Player[] }) {
  const [picks, setPicks] = useState<number[]>([]);
  if (picks.length < 2)
    return (
      <div className="flex flex-col gap-2">
        <p>{players[picks.length]!.name}: wähle geheim!</p>
        <div className="flex justify-center gap-3">
          {RPS_OPTS.map((o) => (
            <Button variant="ghost" key={o.id} className="text-4xl border-2 border-foreground p-2" onClick={() => { beep(); setPicks((p) => [...p, o.id]); }}>{o.e}</Button>
          ))}
        </div>
      </div>
    );
  const a = picks[0]!, b = picks[1]!;
  const res = a === b ? "Unentschieden!" : (a - b + 3) % 3 === 1 ? `${players[0]!.name} gewinnt!` : `${players[1]!.name} gewinnt!`;
  return (
    <div>
      <div className="text-4xl">{RPS_OPTS[a]!.e} vs {RPS_OPTS[b]!.e}</div>
      <p className="text-primary">{res}</p>
      <Button variant="ghost" className="text-[10px] underline" onClick={() => setPicks([])}>Nochmal</Button>
    </div>
  );
}

function Clicker({ players }: { players: Player[] }) {
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [clicks, setClicks] = useState(0);
  const [left, setLeft] = useState(10);
  const [running, setRunning] = useState(false);
  const clicksRef = useRef(0);
  clicksRef.current = clicks;
  useEffect(() => {
    if (!running) return;
    if (left <= 0) { setRunning(false); setScores((s) => [...s, clicksRef.current]); setClicks(0); setLeft(10); setIdx((i) => i + 1); beep(60); return; }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [running, left]);
  if (idx >= players.length) {
    const best = Math.max(...scores);
    return <div className="flex flex-col gap-1">{players.map((p, i) => <p key={i} className={scores[i] === best ? "text-primary" : ""}>{p.name}: {scores[i]} Klicks{scores[i] === best ? " 🏆" : ""}</p>)}</div>;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <p>{players[idx]!.name} ist dran – {left}s</p>
      <Button variant="ghost" className="retro-btn tap-btn text-lg w-48 h-32" onPointerDown={(e) => { e.preventDefault(); if (left <= 0) return; if (!running) setRunning(true); setClicks((c) => c + 1); }}>
        {running ? clicks : "👆 TIPPEN"}
      </Button>
    </div>
  );
}

function Reaction({ players }: { players: Player[] }) {
  const [idx, setIdx] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [state, setState] = useState<"idle" | "wait" | "go">("idle");
  const [goAt, setGoAt] = useState(0);
  useEffect(() => {
    if (state !== "wait") return;
    const id = setTimeout(() => { setState("go"); setGoAt(performance.now()); }, 1000 + Math.random() * 3000);
    return () => clearTimeout(id);
  }, [state]);
  if (idx >= players.length) {
    const best = Math.min(...times);
    return <div className="flex flex-col gap-1">{players.map((p, i) => <p key={i} className={times[i] === best ? "text-primary" : ""}>{p.name}: {times[i] === 9999 ? "zu früh!" : `${times[i]} ms`}{times[i] === best ? " 🏆" : ""}</p>)}</div>;
  }
  const click = () => {
    if (state === "idle") return setState("wait");
    const t = state === "go" ? Math.round(performance.now() - goAt) : 9999;
    beep(); setTimes((x) => [...x, t]); setIdx((i) => i + 1); setState("idle");
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <p>{players[idx]!.name} ist dran</p>
      <Button variant="ghost" onPointerDown={(e) => { e.preventDefault(); click(); }} className={`tap-btn w-48 h-32 h-24 border-4 border-foreground text-[10px] ${state === "go" ? "bg-tile-mini" : state === "wait" ? "bg-tile-bad" : "bg-muted"}`}>
        {state === "idle" ? "START" : state === "wait" ? "WARTE..." : "JETZT!"}
      </Button>
    </div>
  );
}

