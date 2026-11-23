import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Avatar, type Player } from "./remake-avatar";
import { StoryOpenWorld } from "./story-open-world";
import { HeartMeter } from "./story-hearts";
import { CharacterStudio, StoryHero } from "./story-hero";
import { StoryCredits } from "./story-credits";
import elfPortraitsAsset from "@/assets/story-elf-portraits.png.asset.json";
import yseraPortraitAsset from "@/assets/story-portrait-ysera.png.asset.json";
import dateSceneAsset from "@/assets/story-date-scene.jpg.asset.json";
import weddingSceneAsset from "@/assets/story-wedding-scene.jpg.asset.json";
import homeInteriorAsset from "@/assets/story-home-interior.jpg.asset.json";
import masterSwordAsset from "@/assets/story-master-sword.png.asset.json";
import floriaPortrait from "@/assets/story-portrait-floria.jpg";
import floriaHouse from "@/assets/story-floria-house.jpg";
import floriaBirth from "@/assets/story-floria-birth.jpg";
import secretCottageArt from "@/assets/story-secret-cottage.png";
const elfPortraits = elfPortraitsAsset.url;
import { datableById, openSecretHouse, setPartnerFollows, SECRET_DATABLE, HOME_PRICE, MAX_CHILDREN, buyHome, giveGift, goOnDate, propose, welcomeChild, relationOf, startDungeon, unlockedWorld, worldSpawn, dungeonProgress, roomCleared, hasDungeonItem, dungeonDoorStep, datesForNextChild, guideStep, guideVillage, askGuide, pickGuideItem, guideJoins } from "@/lib/story-world";
import { beep } from "@/lib/music";
import { playStorySong, stopStorySong, wakeStoryMusic } from "@/lib/story-music";
import { HOUSE_SONG, WORLD_SONGS, songFor } from "@/lib/story-songs";
import { NPC_COUNT, npcAt, cityResidents, meetNpc } from "@/lib/story-npcs";
import {
  WORLDS, CITIES, COMPANIONS, NARRATOR, STORY_INTRO, STORY_ENDING, DICEY_REVEAL, DICEY_EPILOGUE, FINAL_WORLD, bossShown, needsDiceyReveal, revealDicey, LEVELS_PER_WORLD, WEAPON_COUNT, UPGRADES, RARITIES, PERK_TEXT, MAX_WEAPON_LEVEL,
  newSave, cleanSave, playerStats, levelPath, stepTo, worldOf, isBossLevel, enemyFoe, bossFoe, startBattle, battleTurn,
  weaponAt, weaponPower, weaponUpgradeCost, cityShop, buyWeapon, upgradeWeapon, buyUpgrade, healPrice, acceptQuest, questProgress,
  checkDefeatQuests, payQuest, trialPasses, recruit, clearLevel, worldSaved, loseBattle, battleReward, rubyTileValue,
  chestWeapon, companionById, withGreed, GUIDES, DUNGEON_ITEMS, MASTER_SWORD_TEXT, MASTER_SWORD_ID, SWORD_BOSSES, STAT_TEXT,
  isTrueHero, pullMasterSword, takeDungeonItem, guideOf, sayFarewell, heroDown, equipWeapon, equipTool, unequipTool, equippedTool, buyBombs, bombPackPrice,
  BOMB_PACK, MAX_BOMBS, SHOP_BOMB, heroHearts, piecesFound, HEART_PIECES_PER_WORLD, dungeonHeartEarned, dungeonHearts, DUNGEON_HEART_WORLDS, CITIES_PER_WORLD, cityWorld, FLORIA_BLADE_ID, FLORIA_BLADE_TEXT, FLORIA_GIFT_HEARTS, receiveFloriaBlade,
  type StorySave, type Battle, type Foe, type TurnResult, type Tile, type Buy, type HeroLook,
} from "@/lib/story";

const SAVE_KEY = "questdice-story-v1";
const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const d6 = () => 1 + Math.floor(Math.random() * 6);
const fmt = (n: number) => n.toLocaleString("de-CH");
const face = (n: number) => FACES[Math.max(1, Math.min(6, n)) - 1];

type Talk = { emoji: string; name: string; text: string; button: string; next: () => void; look?: HeroLook; big?: boolean; image?: string };
type Overlay =
  | { type: "talk"; talk: Talk }
  | { type: "battle"; foe: Foe; tile: number; dungeon?: number }
  | { type: "city"; city: number; tile: number; tab?: "forge" }
  | { type: "npc"; companion: number; tile: number }
  | { type: "romance"; id: string }
  | { type: "home" }
  | { type: "secret" }
  | { type: "credits" }
  | null;
type Panel = "world" | "map" | "path" | "gear" | "friends" | "hero";

export function StoryMode({ hero, onBack }: { hero: Player; onBack: () => void }) {
  const [save, setSave] = useState<StorySave | null>(null);
  const [panel, setPanel] = useState<Panel>("world");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [lastRoll, setLastRoll] = useState<{ n: number; key: number } | null>(null);

  useEffect(() => {
    let raw: unknown = null;
    try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null"); } catch { raw = null; }
    const s = cleanSave(raw);
    setSave(s);
    if (!raw) setOverlay({ type: "talk", talk: { ...NARRATOR, text: STORY_INTRO, button: "LOS GEHT'S!", next: () => setOverlay(null) } });
  }, []);
  // Saving waits for a short pause (and always runs when leaving), so walking never stutters on storage writes.
  const pendingSave = useRef<StorySave | null>(null);
  useEffect(() => {
    if (!save) return;
    pendingSave.current = save;
    const id = setTimeout(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); pendingSave.current = null; }, 400);
    return () => clearTimeout(id);
  }, [save]);
  useEffect(() => {
    const flush = () => { if (pendingSave.current) { localStorage.setItem(SAVE_KEY, JSON.stringify(pendingSave.current)); pendingSave.current = null; } };
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, []);
  // The game fills the whole screen, so the lobby behind it must not scroll.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // A heart container comes from every beaten dungeon boss and from every three heart pieces: celebrate and heal.
  const heartsSeen = useRef<{ all: number; dungeon: number } | null>(null);
  const hearts = save ? heroHearts(save) : null;
  const fromDungeons = save ? dungeonHearts(save) : null;
  useEffect(() => {
    if (hearts === null || fromDungeons === null) return;
    const before = heartsSeen.current;
    heartsSeen.current = { all: hearts, dungeon: fromDungeons };
    if (before === null || hearts <= before.all) return;
    beep(120);
    const why = fromDungeons > before.dungeon ? "Der Boss hat einen Herzcontainer fallen lassen." : "Aus drei Herzteilen wurde ein ganzer Herzcontainer.";
    toast.success("❤ NEUER HERZCONTAINER!", { description: `${why} Du hast jetzt ${hearts} Herzen – und volles Leben.` });
    setSave((s) => (s ? { ...s, hp: playerStats(s).maxHp } : s));
  }, [hearts, fromDungeons]);

  // Story music always plays (no off switch): the open world reports its place, a boss duel or your home override it.
  const [placeSong, setPlaceSong] = useState(WORLD_SONGS[0]!.id);
  const songNow = overlay?.type === "battle" && overlay.foe.boss ? songFor({ at: "dungeon", world: save?.world ?? 0, bossFight: true }).id
    : overlay?.type === "home" ? HOUSE_SONG.id : placeSong;
  useEffect(() => { playStorySong(songNow); }, [songNow]);
  useEffect(() => () => stopStorySong(), []);
  if (!save) return <p className="text-xs">Lade Story…</p>;
  const st = playerStats(save);
  const weapon = weaponAt(save.weapon);
  const run = save.run;
  const path = run ? levelPath(run.level) : [];
  const update = (fn: (s: StorySave) => StorySave) => setSave((s) => (s ? fn(s) : s));
  const tryBuy = (r: Buy, msg: string) => { if (r.ok) { beep(); setSave(r.save); toast.success(msg); } else toast.error(r.error); };
  /** Shows several speech bubbles one after another. */
  const talkChain = (talks: Omit<Talk, "next">[], done: () => void = () => setOverlay(null)) => {
    const [first, ...rest] = talks;
    if (!first) { done(); return; }
    setOverlay({ type: "talk", talk: { ...first, next: () => talkChain(rest, done) } });
  };
  /** The big plot twist: the first time you meet the final boss, King Chaoswürfel drops his mask – it was Dicey all along. */
  const bossReveal = (world: number, then: () => void = () => setOverlay(null)) => {
    if (!needsDiceyReveal(save!, world)) { then(); return; }
    beep(40);
    update(revealDicey);
    talkChain(DICEY_REVEAL, then);
  };
  const meetResident = (id: number) => {
    const npc = npcAt(id);
    update((s) => meetNpc(s, id));
    talkChain([{ emoji: "🧝", look: npc.look, name: `${npc.name} · ${npc.role}`, text: npc.line, button: "TSCHÜSS!" }]);
  };
  /** A guide asks for help in their village, waits while you search, and joins you once you bring their item back. */
  const talkGuide = (world: number) => {
    const g = guideOf(world);
    if (!g) return;
    const who = { emoji: "🧝", look: g.look, name: `${g.name} · ${g.role}` };
    const first = g.name.split(" ")[0] ?? g.name;
    const village = guideVillage(world)?.name ?? "ihrem Dorf";
    switch (guideStep(save!, world)) {
      case "ask":
        talkChain([{ ...who, text: g.hello, button: "WEITER" }, { ...who, text: g.quest.ask, button: "🤝 ICH HELFE DIR!" }, { ...who, text: g.quest.hint, button: "ICH SUCHE ES!" }], () => {
          beep(); update((s) => askGuide(s, world)); setOverlay(null);
          toast(`${g.quest.emoji} Neue Aufgabe: Finde ${first}s ${g.quest.item}!`, { description: "Es funkelt irgendwo in dieser Welt ✦" });
        });
        return;
      case "search":
        talkChain([{ ...who, text: `Noch kein Glück bei der Suche? ${g.quest.hint}`, button: "ICH SUCHE WEITER" }]);
        return;
      case "return":
        talkChain([{ ...who, emoji: g.quest.emoji, text: g.quest.thanks, button: `🧝 ${first.toUpperCase()} KOMMT MIT!` }], () => {
          beep(); update((s) => { const r = guideJoins(s, world); return r.ok ? r.save : s; }); setOverlay(null);
          toast.success(`🧝 ${first} begleitet dich jetzt durch ${WORLDS[world]!.name}!`);
        });
        return;
      case "walking":
        talkChain([{ ...who, text: g.hello, button: "WEITER GEHT'S" }]);
        return;
      case "done":
        talkChain([{ ...who, text: `Danke, dass du ${WORLDS[world]!.name} gerettet hast! Ich passe hier in ${village} weiter auf alles auf.`, button: "👋 BIS BALD!" }]);
        return;
      default: return;
    }
  };
  const findLostItem = (world: number) => {
    const g = guideOf(world);
    if (!g) return;
    const r = pickGuideItem(save!, world);
    if (!r.ok) { toast.error(r.error); return; }
    beep(); setSave(r.save);
    const first = g.name.split(" ")[0] ?? g.name;
    talkChain([{ emoji: g.quest.emoji, big: true, name: `${g.quest.item.toUpperCase()} GEFUNDEN!`, text: `Du hast ${first}s ${g.quest.item} gefunden! Bring das Fundstück zurück zu ${first} nach ${guideVillage(world)?.name ?? "ins Dorf"}.`, button: "ZURÜCK ZUM DORF!" }]);
  };
  const findItem = (level: number) => {
    const it = DUNGEON_ITEMS[level];
    if (!it) return;
    beep();
    update((s) => takeDungeonItem(s, level));
    talkChain([{ emoji: it.emoji, big: true, name: `DUNGEON-ITEM: ${it.name.toUpperCase()}`, text: `Du hast ${it.name} gefunden! ${STAT_TEXT[it.stat](it.value)} – für immer.`, button: "SUPER!" }]);
  };
  const touchSword = () => {
    if (save!.weapons.includes(MASTER_SWORD_ID)) { toast(MASTER_SWORD_TEXT.owned); return; }
    const r = pullMasterSword(save!);
    if (r.ok) { beep(); setSave(r.save); talkChain([{ emoji: MASTER_SWORD_TEXT.emoji, image: masterSwordAsset.url, name: MASTER_SWORD_TEXT.name.toUpperCase(), text: `${MASTER_SWORD_TEXT.pulled} (${PERK_TEXT.holy})`, button: "⚔ ICH BIN BEREIT!" }]); }
    else talkChain([{ emoji: "🗡️", big: true, name: "Heiliger Schwertsockel", text: `${MASTER_SWORD_TEXT.locked} (Bosse besiegt: ${SWORD_BOSSES.filter((l) => save!.cleared.includes(l)).length}/4)`, button: "OK" }]);
  };

  /** Opens a world's one big dungeon from the world map; you come out at its door. */
  function enterDungeon(w: number) {
    beep();
    const fresh = dungeonProgress(save!, w) === 0;
    update((s) => (s.dungeon && worldOf(s.dungeon.level) === w ? s : { ...s, world: w, worldPos: dungeonDoorStep(w), dungeon: startDungeon(w), run: null, hp: playerStats(s).maxHp }));
    setPanel("world");
    if (fresh) setOverlay({ type: "talk", talk: { ...NARRATOR, text: `${WORLDS[w]!.emoji} ${WORLDS[w]!.name}: ${WORLDS[w]!.story}`, button: "ICH RETTE DIESE WELT!", next: () => setOverlay(null) } });
  }

  const markDone = (tile: number) => update((s) => (tile >= 0 && s.run && !s.run.done.includes(tile) ? { ...s, run: { ...s.run, done: [...s.run.done, tile] } } : s));

  function finishLevel(level: number) {
    const boss = isBossLevel(level), w = worldOf(level);
    update((s) => clearLevel({ ...s, hp: playerStats(s).maxHp, dungeon: null }, level));
    setPanel("map");
    if (boss) {
      const text = w === WORLDS.length - 1 ? `${WORLDS[w]!.saved} ${STORY_ENDING}` : `${WORLDS[w]!.saved} Die nächste Welt wartet schon auf dich!`;
      const talks: Omit<Talk, "next">[] = [{ ...NARRATOR, text: `🏆 ${text}`, button: "WEITER" }];
      const g = guideOf(w);
      if (g && !save!.farewells.includes(w) && save!.guidesJoined.includes(w)) {
        talks.push({ emoji: "🧝", look: g.look, name: `${g.name} verabschiedet sich`, text: g.farewell, button: "👋 LEB WOHL!" });
        update((s) => sayFarewell(s, w));
      }
      const cleared = { cleared: [...save!.cleared, level] };
      if (isTrueHero(cleared) && !isTrueHero(save!) && !save!.weapons.includes(MASTER_SWORD_ID)) talks.push({ ...NARRATOR, text: `✨ ${MASTER_SWORD_TEXT.hint}`, button: "ZUM SCHWERT!" });
      if (w === FINAL_WORLD && !save!.cleared.includes(level)) talks.push(DICEY_EPILOGUE);
      // Beating the final boss ends the game: the credits roll after the last speech bubble.
      if (w === FINAL_WORLD) talkChain(talks, () => setOverlay({ type: "credits" }));
      else talkChain(talks);
    } else toast.success("🏁 Level geschafft! Dein Leben ist wieder voll.");
  }

  function resolve(tile: number, t: Tile, level: number) {
    const w = worldOf(level);
    const greet = (emoji: string, name: string, text: string, button: string, next: () => void) => setOverlay({ type: "talk", talk: { emoji, name, text, button, next } });
    switch (t.kind) {
      case "enemy": case "boss": {
        const foe = t.kind === "boss" ? bossFoe(w) : enemyFoe(w, t.ref ?? 0);
        const fight = () => greet(foe.emoji, foe.name, foe.intro, "⚔ KÄMPFEN", () => setOverlay({ type: "battle", foe, tile }));
        if (t.kind === "boss") bossReveal(w, fight); else fight();
        return;
      }
      case "city": setOverlay({ type: "city", city: t.ref ?? 0, tile }); return;
      case "npc": setOverlay({ type: "npc", companion: t.ref ?? 0, tile }); return;
      case "goal": finishLevel(level); return;
      case "ruby": { const n = withGreed(rubyTileValue(w), st); update((s) => ({ ...s, rubies: s.rubies + n })); toast(`💎 +${n} Rubine`); break; }
      case "heal": { const n = Math.round(st.maxHp * 0.3); update((s) => ({ ...s, hp: Math.min(st.maxHp, s.hp + n) })); toast(`💖 +${n} Leben`); break; }
      case "trap": { const n = Math.max(1, Math.round(st.maxHp * 0.12)); update((s) => ({ ...s, hp: Math.max(1, s.hp - n) })); toast(`🕳️ Falle! -${n} Leben`); break; }
      case "chest": {
        const id = chestWeapon(w, Math.random());
        if (save!.weapons.includes(id)) { const n = withGreed(rubyTileValue(w) * 2, st); update((s) => ({ ...s, rubies: s.rubies + n })); toast(`🎁 Schatztruhe: +${n} Rubine`); }
        else { update((s) => ({ ...s, weapons: [...s.weapons, id] })); toast.success(`🎁 Neue Waffe: ${weaponAt(id).emoji} ${weaponAt(id).name}`); }
        break;
      }
      default: break;
    }
    if (t.kind !== "empty" && t.kind !== "start") markDone(tile);
  }

  function rollPath() {
    if (!run || overlay) return;
    beep();
    const n = d6();
    setLastRoll({ n, key: Date.now() });
    const to = stepTo(path, run.pos, n, run.done);
    update((s) => (s.run ? { ...s, run: { ...s.run, pos: to } } : s));
    const t = path[to];
    if (t && !run.done.includes(to)) setTimeout(() => resolve(to, t, run.level), 420);
  }

  function battleOver(b: Battle, tile: number, dungeonEnemy?: number) {
    const d = save!.dungeon;
    if (!run && dungeonEnemy === undefined) return;
    if (b.status === "lost") {
      setSave(loseBattle(save!));
      setPanel("world");
      setOverlay({ type: "talk", talk: { emoji: b.foe.emoji, name: b.foe.name, text: "Ha! Du bist besiegt. Komm wieder, wenn du stärker bist! (Du verlierst 10 % deiner Rubine und kehrst aus dem Dungeon zurück.)", button: "NOCHMAL VERSUCHEN", next: () => setOverlay(null) } });
      return;
    }
    const level = dungeonEnemy !== undefined && d ? d.level : run!.level;
    const reward = battleReward(save!, b.foe, level);
    let next: StorySave = { ...save!, rubies: save!.rubies + reward, kills: save!.kills + 1, hp: Math.min(st.maxHp, b.playerHp + st.potion) };
    if (dungeonEnemy !== undefined && d) next.dungeon = { ...d, defeated: [...new Set([...d.defeated, dungeonEnemy])] };
    else if (run) next.run = { ...run, done: [...run.done, tile] };
    const q = checkDefeatQuests(next);
    next = q.save;
    setSave(next);
    for (const id of q.joined) toast.success(`🤝 ${companionById(id)?.name} ist jetzt dein Gefährte!`);
    setOverlay({ type: "talk", talk: { emoji: b.foe.emoji, name: b.foe.name, text: `${b.foe.defeat}  (+${fmt(reward)} 💎)`, button: "WEITER", next: () => { setOverlay(null); if (b.foe.boss) finishLevel(level); } } });
  }


  const SHEET: Record<Panel, string> = { world: "", map: "🗺️ WELTKARTE", path: "🎲 KLASSISCHER WÜRFELWEG", gear: "🎒 AUSRÜSTUNG", friends: "🤝 GEFÄHRTEN", hero: "🧝 DEIN CHARAKTER" };
  const ICONS: [Panel, string, string][] = [["map", "🗺️", "WELTKARTE"], ["gear", "🎒", "AUSRÜSTUNG"], ["friends", "🤝", "GEFÄHRTEN"], ["hero", "🧝", "CHARAKTER"], ...(run ? [["path", "🎲", "WEG"] as [Panel, string, string]] : [])];

  return <section className="story-mode is-game" onPointerDown={wakeStoryMusic} onKeyDown={wakeStoryMusic}>
    <div className="game-stage">
      <StoryOpenWorld save={save} setSave={setSave} paused={!!overlay || !save.heroName || panel !== "world"}
      onCity={(city) => setOverlay({ type: "city", city, tile: -1 })}
      onSmith={(city) => setOverlay({ type: "city", city, tile: -1, tab: "forge" })}
      onNpc={(companion) => setOverlay({ type: "npc", companion, tile: -1 })}
      update={update}
      onFoeDefeated={(foe, enemy, level) => {
        const reward = battleReward(save, foe, level);
        update((s) => { const d = s.dungeon; const ps = playerStats(s); return checkDefeatQuests({ ...s, rubies: s.rubies + reward, kills: s.kills + 1, hp: Math.min(ps.maxHp, s.hp + ps.potion), dungeon: d ? { ...d, defeated: [...new Set([...d.defeated, enemy])] } : d }).save; });
        if (foe.boss) setOverlay({ type: "talk", talk: { emoji: foe.emoji, name: foe.name, text: `${foe.defeat}  (+${fmt(reward)} 💎)`, button: "WEITER", next: () => { setOverlay(null); finishLevel(level); } } });
        else toast.success(`⚔ ${foe.name} besiegt! +${fmt(reward)} 💎`, { description: foe.defeat });
      }}
      onFieldFoe={(foe) => {
        const reward = battleReward(save, foe, save.world * LEVELS_PER_WORLD);
        update((s) => { const ps = playerStats(s); return checkDefeatQuests({ ...s, rubies: s.rubies + reward, kills: s.kills + 1, hp: Math.min(ps.maxHp, s.hp + ps.potion) }).save; });
        toast.success(`⚔ ${foe.name} besiegt! +${fmt(reward)} 💎`);
      }}
      onRoomClear={(level) => { update((s) => clearLevel(s, level)); toast.success("Raum geschafft! Das nächste Tor ist offen."); }}
      onHeroDown={(foe) => {
        const inDungeon = !!save.dungeon, village = CITIES[save.world * CITIES_PER_WORLD]?.name ?? "deinem Startdorf";
        update(heroDown);
        setOverlay({ type: "talk", talk: { emoji: foe.emoji, name: foe.name, button: "NOCHMAL VERSUCHEN", next: () => setOverlay(null),
          text: inDungeon ? "Ha! Du bist besiegt. Komm wieder, wenn du stärker bist! (Du verlierst 10 % deiner Rubine und stehst wieder vor dem Dungeon. Geschaffte Räume bleiben offen.)"
            : `Ha! Du bist besiegt. Komm wieder, wenn du stärker bist! (Du verlierst 10 % deiner Rubine und wachst in ${village} wieder auf.)` } });
      }}
      onSong={setPlaceSong}
      onBossWake={(w) => { if (needsDiceyReveal(save, w)) bossReveal(w); }}
      onRomance={(id) => setOverlay({ type: "romance", id })} onHome={() => setOverlay({ type: "home" })} onSecret={() => setOverlay({ type: "secret" })}
      onResident={meetResident} onGuide={talkGuide} onLost={findLostItem} onItem={findItem} onSword={touchSword} />

      <div className="game-hud">
        <StoryHero look={save.heroLook} scale={2.2} gear />
        <div className="game-hud-copy">
          <b>{save.heroName || "Unbenannter Elf"}</b>
          <HeartMeter hp={save.hp} maxHp={st.maxHp} hearts={heroHearts(save)} />
          <span className="game-hud-line">💎 {fmt(save.rubies)} · {weapon.emoji} {weapon.name} +{save.weaponLevels[String(weapon.id)] ?? 0} · ⚔ {st.power} · {save.tool === "bombs" ? `💣×${save.bombs}` : equippedTool(save)?.emoji ?? "🧰 –"}{companionById(save.companion) ? ` · 🤝 ${companionById(save.companion)!.name.split(" ")[0]}` : ""}</span>
        </div>
      </div>

      <nav className="game-icons" aria-label="Menü">
        {ICONS.map(([k, icon, label]) => <button key={k} type="button" className="game-icon" aria-label={label} aria-pressed={panel === k} onClick={() => { beep(); setPanel(panel === k ? "world" : k); }}>{icon}<small>{label}</small></button>)}
        <button type="button" className="game-icon is-back" aria-label="Zurück zur Lobby" onClick={onBack}>↩<small>LOBBY</small></button>
      </nav>
    </div>

    {panel !== "world" && <div className="story-overlay" role="dialog" aria-modal="true" aria-label={SHEET[panel]}>
      <div className="game-sheet hub-card">
        <div className="sheet-head"><b className="text-primary">{SHEET[panel]}</b><Button variant="ghost" onClick={() => { beep(); setPanel("world"); }}>✕ ZURÜCK INS SPIEL</Button></div>

    {panel === "map" && <div className="story-worlds">{WORLDS.map((w, wi) => {
      const locked = !unlockedWorld(save, wi), saved = worldSaved(save, wi), rooms = dungeonProgress(save, wi), it = DUNGEON_ITEMS[wi];
      const inside = !!save.dungeon && worldOf(save.dungeon.level) === wi;
      const boss = bossShown(save, wi);
      return <article key={w.id} className={`hub-card story-world ${locked ? "is-locked" : ""} ${saved ? "is-saved" : ""}`} style={{ animationDelay: `${wi * 60}ms` }}>
        <div className="flex items-center gap-3"><span className="text-4xl">{locked ? "🔒" : w.emoji}</span><div className="flex-1"><b className="text-primary">WELT {wi + 1} · {w.name}</b><p className="text-[11px] text-muted-foreground">Boss: {boss.emoji} {boss.name} – {boss.title}{saved ? " · ✅ GERETTET" : ""}</p></div>
          <Button variant="arcadeAlt" disabled={locked} onClick={() => { beep(); update((s) => ({ ...s, world: wi, dungeon: null, worldPos: worldSpawn(wi) })); setPanel("world"); }}>{save.world === wi && !save.dungeon ? "ZUM DORF" : "REISEN"}</Button></div>
        <div className={`world-dungeon ${saved ? "is-done" : ""} ${inside ? "is-current" : ""}`}>
          <span className="text-2xl">{locked ? "🔒" : saved ? "⭐" : "🏛️"}</span>
          <div className="flex-1 min-w-0"><b>DUNGEON VON {boss.name.toUpperCase()}</b>
            <small>{rooms}/4 Räume · {it ? (hasDungeonItem(save, wi) ? `${it.emoji} ${it.name} gefunden` : "🧰 Dungeon-Item noch versteckt") : ""}</small>
            <small>{wi >= DUNGEON_HEART_WORLDS ? "" : dungeonHeartEarned(save, wi) ? "❤ Herzcontainer erhalten · " : "❤ Herzcontainer nach dem Boss · "}💗 {piecesFound(save, wi)}/{HEART_PIECES_PER_WORLD} Herzteile in dieser Welt</small>
            <span className="story-pips" aria-label={`${rooms} von 4 Räumen geschafft`}>{[0, 1, 2, 3].map((r) => <i key={r} className={roomCleared(save, wi, r) ? "on" : ""} />)}</span></div>
          <Button variant="arcade" disabled={locked} onClick={() => enterDungeon(wi)}>{inside ? "WEITER" : saved ? "NOCHMAL" : "BETRETEN"}</Button>
        </div>
        <small className="text-[10px] text-muted-foreground">🏘️ {CITIES.slice(wi * CITIES_PER_WORLD, (wi + 1) * CITIES_PER_WORLD).map((c) => c.name).join(" · ")}</small>
      </article>;
    })}</div>}

    {panel === "path" && run && <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap"><b className="text-primary">{WORLDS[worldOf(run.level)]!.emoji} {WORLDS[worldOf(run.level)]!.name} · KLASSISCHER WÜRFELWEG</b><span className="text-xs text-muted-foreground">Feld {run.pos} / {path.length - 1}</span></div>
      <div className="story-path">{path.map((t, i) => {
        const row = Math.floor(i / 6), col = row % 2 === 0 ? i % 6 : 5 - (i % 6);
        const done = run.done.includes(i);
        return <div key={i} className={`story-tile kind-${t.kind} ${done ? "is-done" : ""} ${i === run.pos ? "is-here" : ""}`} style={{ gridRow: row + 1, gridColumn: col + 1 }} title={tileName(t)}>
          <span className="story-tile-icon">{tileIcon(t, run.level)}</span><small>{i}</small>
          {i === run.pos && <span key={lastRoll?.key} className="story-hero"><Avatar p={hero} /></span>}
        </div>;
      })}</div>
      <div className="story-roll">{lastRoll && <span key={lastRoll.key} className="story-die">{face(lastRoll.n)}<small>{lastRoll.n}</small></span>}<Button variant="arcade" className="start-button" disabled={!!overlay} onClick={rollPath}>🎲 WÜRFELN</Button></div>
    </div>}

    {panel === "gear" && <Gear save={save} setSave={setSave} />}
    {panel === "friends" && <Friends save={save} setSave={setSave} tryBuy={tryBuy} />}
    {panel === "hero" && <CharacterStudio save={save} onSave={(s) => { setSave(s); toast.success("Dein Charakter wurde gespeichert."); }} />}
      </div>
    </div>}

    {overlay && <div className="story-overlay" role="dialog" aria-modal="true">
      {overlay.type === "talk" && <div className="story-talk hub-card">{overlay.talk.image ? <img src={overlay.talk.image} alt="" width={121} height={192} className="talk-image" /> : overlay.talk.look ? <span className="talk-elf"><StoryHero look={overlay.talk.look} scale={6} label={overlay.talk.name} /></span> : <span className={overlay.talk.big ? "item-reveal" : "story-speaker"}>{overlay.talk.emoji}</span>}<b className="text-primary">{overlay.talk.name}</b><p>{overlay.talk.text}</p><Button variant="arcade" onClick={() => { beep(); overlay.talk.next(); }}>{overlay.talk.button}</Button></div>}
      {overlay.type === "battle" && <BattleView foe={overlay.foe} save={save} onEnd={(b) => battleOver(b, overlay.tile, overlay.dungeon)} />}
      {overlay.type === "city" && <CityView key={`${overlay.city}-${overlay.tab ?? ""}`} city={overlay.city} startTab={overlay.tab} save={save} tryBuy={tryBuy} onMeet={(id) => update((s) => meetNpc(s, id))} onLeave={() => { markDone(overlay.tile); setOverlay(null); }} />}
      {overlay.type === "npc" && <NpcView index={overlay.companion} save={save} setSave={setSave} tryBuy={tryBuy} onLeave={() => { markDone(overlay.tile); setOverlay(null); }} />}
      {overlay.type === "romance" && <RomanceView id={overlay.id} save={save} tryBuy={tryBuy} onLeave={() => setOverlay(null)} />}
      {overlay.type === "secret" && <SecretDoor onOpen={(code) => { const r = openSecretHouse(save, code); if (!r.ok) { toast.error(r.error); return false; } beep(); setSave(r.save); setOverlay({ type: "romance", id: SECRET_DATABLE.id }); return true; }} onLeave={() => setOverlay(null)} />}
      {overlay.type === "credits" && <StoryCredits onDone={() => setOverlay(null)} />}
      {overlay.type === "home" && <HomeView save={save} setSave={setSave} tryBuy={tryBuy} onLeave={() => setOverlay(null)} />}
    </div>}
    {!save.heroName && <div className="story-overlay" role="dialog" aria-modal="true" aria-label="Charakter erstellen"><div className="hub-card character-first"><span className="text-secondary text-[10px]">DEIN ABENTEUER BEGINNT</span><h3 className="section-title">ERSCHAFFE DEINEN ELFEN</h3><CharacterStudio first save={save} onSave={(s) => { setSave(s); beep(); }} /></div></div>}
  </section>;
}

function tileIcon(t: Tile, level: number) {
  const w = worldOf(level);
  switch (t.kind) {
    case "start": return "🚩"; case "ruby": return "💎"; case "heal": return "💖"; case "trap": return "🕳️"; case "chest": return "🎁"; case "goal": return "🏁";
    case "enemy": return WORLDS[w]!.enemies[t.ref ?? 0]!.emoji;
    case "boss": { const b = WORLDS[w]!.boss; return b.mask?.emoji ?? b.emoji; }
    case "city": return CITIES[t.ref ?? 0]!.emoji;
    case "npc": return COMPANIONS[t.ref ?? 0]!.emoji;
    default: return "·";
  }
}
function tileName(t: Tile) {
  return ({ start: "Start", empty: "Weg", ruby: "Rubine", heal: "Heilung", trap: "Falle", chest: "Schatztruhe", enemy: "Gegner", city: t.ref !== undefined ? CITIES[t.ref]?.name : "Stadt", npc: "Jemand braucht Hilfe", boss: "Boss", goal: "Ziel" } as Record<string, string | undefined>)[t.kind] ?? "";
}

function BattleView({ foe, save, onEnd }: { foe: Foe; save: StorySave; onEnd: (b: Battle) => void }) {
  const st = playerStats(save);
  const [b, setB] = useState(() => startBattle(foe, save.hp));
  const [last, setLast] = useState<TurnResult | null>(null);
  const stage = foe.stages[b.stage]!;
  const over = b.status === "won" || b.status === "lost";
  function attack() {
    beep();
    const r = battleTurn(b, st, d6(), d6(), [Math.random(), Math.random()]);
    setB(r.battle); setLast(r);
  }
  return <div className={`story-battle hub-card ${foe.boss ? "is-boss" : ""}`}>
    <div className="flex justify-between text-[11px]"><span className="text-secondary">{foe.boss ? `BOSS · ${foe.title}` : foe.title}</span><span>STUFE {b.stage + 1}/{foe.stages.length} · {stage.title}</span></div>
    <div className="story-arena">
      <div className="story-fighter"><span key={`p${b.turn}`} className={`${last && last.taken ? "story-hit" : ""}`}><StoryHero look={save.heroLook} direction={2} walking={!!last} scale={5} className="battle-elf" gear /></span><div className="story-hp"><span style={{ width: `${(b.playerHp / st.maxHp) * 100}%` }} /><b>DU {Math.max(0, b.playerHp)}/{st.maxHp}</b></div></div>
      <span className="story-vs">VS</span>
      <div className="story-fighter"><span key={`f${b.turn}`} className={`story-foe ${last && last.dealt ? "story-hit" : ""}`}>{foe.emoji}</span><div className="story-hp is-foe"><span style={{ width: `${(b.hp / stage.hp) * 100}%` }} /><b>{foe.name} {Math.max(0, b.hp)}/{stage.hp}</b></div></div>
    </div>
    <p className="story-bubble">„{b.status === "won" ? foe.defeat : b.status === "lost" ? "Ha! Das war wohl nichts!" : stage.line}“</p>
    {last && <div key={b.turn} className="story-dice-row">
      <span className="story-die">{face(last.roll)}<small>Du: {last.roll}</small></span>
      <span className="text-xs">💥 {last.dealt} Schaden{last.crit ? " · KRITISCH!" : ""}{last.healed ? ` · 💚 +${last.healed}` : ""}</span>
      {last.battle.status !== "won" && last.battle.status !== "stage" && <><span className="story-die is-foe">{face(last.enemyRoll)}<small>Gegner: {last.enemyRoll}</small></span><span className="text-xs">{last.dodged ? "💨 Ausgewichen!" : `🩸 -${last.taken}`}</span></>}
      {last.battle.status === "stage" && <span className="text-xs text-primary font-bold">⚠ NÄCHSTE STUFE! Du erholst dich etwas.</span>}
    </div>}
    {over ? <Button variant="arcade" onClick={() => onEnd(b)}>{b.status === "won" ? "🏆 GEWONNEN!" : "💀 BESIEGT"}</Button>
      : <Button variant="arcade" className="start-button" onClick={attack}>🎲 WÜRFELN & ANGREIFEN</Button>}
    <p className="text-[10px] text-muted-foreground">Schaden = Wurf × Waffenkraft ({st.power}){st.atk ? ` + ${st.atk}` : ""}. Eine 6 ist immer kritisch!</p>
  </div>;
}

function CityView({ city, startTab, save, tryBuy, onMeet, onLeave }: { city: number; startTab?: "forge" | undefined; save: StorySave; tryBuy: (r: Buy, msg: string) => void; onMeet: (id: number) => void; onLeave: () => void }) {
  const c = CITIES[city]!;
  const w = cityWorld(city);
  const [tab, setTab] = useState<"weapons" | "forge" | "trainer" | "healer" | "bombs" | "people">(startTab ?? "weapons");
  const [talkTo, setTalkTo] = useState<number | null>(null);
  const people = cityResidents(city);
  const st = playerStats(save);
  return <div className="story-city hub-card">
    <div className="flex items-center gap-3"><span className="text-4xl">{c.emoji}</span><div><b className="text-primary">{c.name}</b><p className="text-xs">{c.keeper}: „{c.greeting}“</p></div></div>
    <div className="hub-tabs">{([["weapons", "⚔ WAFFEN"], ["forge", "🔨 SCHMIEDE"], ["trainer", "💪 TRAINER"], ["healer", "💖 HEILER"], ["bombs", "💣 BOMBEN"], ["people", `🧝 BEWOHNER (${people.length})`]] as const).map(([k, l]) => <button key={k} className="hub-tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
    <span className="coin-badge self-start">💎 {fmt(save.rubies)}</span>
    {tab === "weapons" && <div className="story-shop">{cityShop(city).map((id) => {
      const it = weaponAt(id), owned = save.weapons.includes(id);
      return <div key={id} className={`story-item rarity-${it.rarity}`}><span className="text-2xl">{it.emoji}</span><div className="flex-1 min-w-0"><b>{it.name}</b><small>{RARITIES[it.rarity]} · Kraft {it.power} · {PERK_TEXT[it.perk]}</small></div>
        {owned ? <span className="text-xs text-primary">✓ Hast du</span> : <Button variant="arcadeAlt" onClick={() => tryBuy(buyWeapon(save, id), `${it.name} gekauft und ausgerüstet!`)}>💎 {fmt(it.price)}</Button>}</div>;
    })}</div>}
    {tab === "forge" && <><p className="text-xs text-muted-foreground">🔨 Der Schmied schärft jede deiner Waffen: wähle eine aus und zahle mit Rubinen.</p><div className="story-shop">{[...save.weapons].sort((a, b) => (a === save.weapon ? -1 : b === save.weapon ? 1 : weaponAt(b).power - weaponAt(a).power)).map((id) => {
      const it = weaponAt(id), l = save.weaponLevels[String(id)] ?? 0;
      return <div key={id} className={`story-item rarity-${it.rarity}`}><span className="text-2xl">{it.emoji}</span><div className="flex-1 min-w-0"><b>{it.name} +{l}{id === save.weapon ? " · ausgerüstet" : ""}</b><small>Kraft {weaponPower(it, l)}{l < MAX_WEAPON_LEVEL ? ` → ${weaponPower(it, l + 1)}` : " · MAXIMUM"}</small></div>
        {l < MAX_WEAPON_LEVEL && <Button variant="arcadeAlt" onClick={() => tryBuy(upgradeWeapon(save, id), `${it.name} ist jetzt +${l + 1}!`)}>💎 {fmt(weaponUpgradeCost(it, l))}</Button>}</div>;
    })}</div></>}
    {tab === "trainer" && <><p className="text-xs text-muted-foreground">{save.upgrades.length} / {UPGRADES.length} Upgrades gelernt</p><div className="story-shop">{[...new Set(UPGRADES.map((u) => u.line))].map((line) => {
      const tiers = UPGRADES.filter((u) => u.line === line), next = tiers.find((u) => !save.upgrades.includes(u.id));
      const have = tiers.filter((u) => save.upgrades.includes(u.id)).length;
      return <div key={line} className="story-item"><span className="text-2xl">{tiers[0]!.icon}</span><div className="flex-1 min-w-0"><b>{next ? next.name : tiers.at(-1)!.name}</b><small>{next ? `${next.text} · Stufe ${next.tier + 1}/5` : "Alle 5 Stufen gelernt"}</small><span className="story-pips">{tiers.map((u) => <i key={u.id} className={save.upgrades.includes(u.id) ? "on" : ""} />)}</span></div>
        {next && (next.minWorld > worldOf(save.unlocked) ? <span className="text-[10px] text-muted-foreground">ab Welt {next.minWorld + 1}</span> : <Button variant="arcadeAlt" onClick={() => tryBuy(buyUpgrade(save, next.id), `${next.icon} ${next.name} gelernt!`)}>💎 {fmt(next.price)}</Button>)}
        <span className="sr-only">{have} von 5</span></div>;
    })}</div></>}
    {tab === "healer" && <div className="story-item"><span className="text-2xl">💖</span><div className="flex-1"><b>Volle Heilung</b><small>Leben {save.hp}/{st.maxHp}</small></div>
      <Button variant="arcadeAlt" disabled={save.hp >= st.maxHp} onClick={() => tryBuy(save.rubies >= healPrice(w) ? { ok: true, save: { ...save, rubies: save.rubies - healPrice(w), hp: st.maxHp } } : { ok: false, error: "Nicht genug Rubine." }, "Du bist wieder fit!")}>💎 {fmt(healPrice(w))}</Button></div>}
    {tab === "bombs" && <div className="story-item"><span className="text-2xl">💣</span><div className="flex-1 min-w-0"><b>{BOMB_PACK} Bomben</b><small>Du hast {save.bombs}/{MAX_BOMBS} · {SHOP_BOMB.use} Rüste sie im Item-Slot aus.</small></div>
      <Button variant="arcadeAlt" disabled={save.bombs >= MAX_BOMBS} onClick={() => tryBuy(buyBombs(save, w), `💣 +${BOMB_PACK} Bomben!`)}>💎 {fmt(bombPackPrice(w))}</Button></div>}
    {tab === "people" && <>
      {talkTo !== null && <div className="story-item"><StoryHero look={npcAt(talkTo).look} scale={3.5} label={npcAt(talkTo).name} /><div className="flex-1 min-w-0"><b>{npcAt(talkTo).name} · {npcAt(talkTo).role}</b><small>„{npcAt(talkTo).line}“</small></div></div>}
      <div className="resident-grid">{people.map((id) => { const n = npcAt(id); return <button key={id} type="button" className={`resident-card ${save.metNpcs.includes(id) ? "is-met" : ""}`} aria-pressed={talkTo === id} onClick={() => { beep(); setTalkTo(id); onMeet(id); }}>
        <StoryHero look={n.look} direction={n.dir} scale={2.4} label={n.name} /><b>{n.name}</b><small>{n.role}</small></button>; })}</div>
    </>}
    <Button variant="arcade" onClick={onLeave}>STADT VERLASSEN ↗</Button>
  </div>;
}

function useTrial(save: StorySave, setSave: (s: StorySave) => void) {
  const [dice, setDice] = useState<[number, number] | null>(null);
  return { dice, roll: (id: string) => {
    beep();
    const a = d6(), b = d6();
    setDice([a, b]);
    if (trialPasses(id, a, b)) { setSave(recruit(save, id)); toast.success(`🤝 ${companionById(id)?.name} ist jetzt dein Gefährte!`); }
    else toast.error(`${a + b} – leider zu wenig. Versuch es nochmal!`);
  } };
}

function QuestAction({ id, save, setSave, tryBuy }: { id: string; save: StorySave; setSave: (s: StorySave) => void; tryBuy: (r: Buy, msg: string) => void }) {
  const c = companionById(id)!;
  const trial = useTrial(save, setSave);
  const p = questProgress(save, id);
  if (save.companions.includes(id)) return <p className="text-xs text-primary">„{c.thanks}“</p>;
  if (!(id in save.quests)) return <Button variant="arcade" onClick={() => { beep(); setSave(acceptQuest(save, id)); toast("📜 Aufgabe angenommen!"); }}>🤝 ICH HELFE DIR!</Button>;
  if (c.quest.type === "defeat") return <p className="text-xs">⚔ Besiegte Gegner: {p.have} / {p.need}</p>;
  if (c.quest.type === "rubies") return <Button variant="arcadeAlt" onClick={() => tryBuy(payQuest(save, id), `🤝 ${c.name} ist jetzt dein Gefährte!`)}>💎 {fmt(c.quest.n)} GEBEN</Button>;
  return <div className="flex items-center gap-3 flex-wrap">{trial.dice && <span className="story-die">{face(trial.dice[0])}{face(trial.dice[1])}<small>{trial.dice[0] + trial.dice[1]}</small></span>}<Button variant="arcadeAlt" onClick={() => trial.roll(id)}>🎲🎲 WÜRFELN (mind. {c.quest.target})</Button></div>;
}

function NpcView({ index, save, setSave, tryBuy, onLeave }: { index: number; save: StorySave; setSave: (s: StorySave) => void; tryBuy: (r: Buy, msg: string) => void; onLeave: () => void }) {
  const c = COMPANIONS[index]!;
  return <div className="story-talk hub-card">
    <span className="story-speaker">{c.emoji}</span><b className="text-primary">{c.name}</b>
    <p>„{c.ask}“</p><p className="text-[11px] text-muted-foreground">Belohnung: {c.name} kämpft mit dir · {c.perk}</p>
    <QuestAction id={c.id} save={save} setSave={setSave} tryBuy={tryBuy} />
    <Button variant="ghost" onClick={onLeave}>WEITERGEHEN ↗</Button>
  </div>;
}

function Friends({ save, setSave, tryBuy }: { save: StorySave; setSave: (s: StorySave) => void; tryBuy: (r: Buy, msg: string) => void }) {
  const met = (id: string) => save.companions.includes(id) || id in save.quests;
  return <div className="flex flex-col gap-4">
    <div className="hub-card flex items-center justify-between gap-3 flex-wrap"><b className="text-primary">🧝 BEWOHNER GETROFFEN</b><span className="coin-badge">{save.metNpcs.length} / {fmt(NPC_COUNT)}</span><p className="text-[11px] text-muted-foreground w-full">Jede der neun Welten hat über hundert Bewohner – auf den Wegen und in den Dörfern (Tab „Bewohner“). Sprich mit allen!</p></div>
    <b className="text-primary">BEGLEITER · {GUIDES.length} WELTFÜHRER</b>
    <div className="hub-grid">{GUIDES.map((g) => {
      const open = unlockedWorld(save, g.world), step = guideStep(save, g.world), joined = save.guidesJoined.includes(g.world);
      const village = guideVillage(g.world)?.name ?? "ihrem Dorf";
      const status = !open ? "Wartet in einer fernen Welt"
        : step === "ask" ? `Wartet in ${village} auf deine Hilfe ❗`
        : step === "search" ? `Sucht ${g.quest.emoji} ${g.quest.item} – du hilfst bei der Suche`
        : step === "return" ? `Bring ${g.quest.emoji} ${g.quest.item} zurück nach ${village}`
        : step === "walking" ? `${g.role} · begleitet dich gerade`
        : joined ? "Hat sich verabschiedet 👋" : `Wieder zu Hause in ${village}`;
      return <article key={g.id} className={`hub-card ${step === "walking" && open ? "selected" : ""}`}><div className="flex items-center gap-3">
        {open ? <StoryHero look={g.look} scale={2.6} label={g.name} /> : <span className="text-3xl">❔</span>}
        <div><b className="text-primary">{open ? g.name : "Noch unbekannt"}</b><p className="text-[11px] text-muted-foreground">{WORLDS[g.world]!.emoji} {WORLDS[g.world]!.name} · {status}</p></div></div>
        {open && step === "search" && <p className="text-[11px]">„{g.quest.hint}“</p>}
        {open && step === "done" && joined && <p className="text-[11px]">„{g.farewell}“</p>}
      </article>;
    })}</div>
    <b className="text-primary">GEFÄHRTEN IM KAMPF</b>
    <div className="hub-grid">{COMPANIONS.map((c) => <article key={c.id} className={`hub-card ${save.companion === c.id ? "selected" : ""}`}>
    <div className="flex items-center gap-3"><span className="text-3xl">{met(c.id) ? c.emoji : "❔"}</span><div><b className="text-primary">{met(c.id) ? c.name : "Noch nicht getroffen"}</b><p className="text-[11px] text-muted-foreground">{WORLDS[c.world]!.emoji} {WORLDS[c.world]!.name} · {met(c.id) ? c.perk : "Hilf jemandem auf dem Weg"}</p></div></div>
    {met(c.id) && <QuestAction id={c.id} save={save} setSave={setSave} tryBuy={tryBuy} />}
    {save.companions.includes(c.id) && (save.companion === c.id ? <span className="text-xs font-bold">✓ Kämpft gerade mit dir</span> : <Button variant="arcadeAlt" onClick={() => setSave({ ...save, companion: c.id })}>MITNEHMEN</Button>)}
  </article>)}</div>
  </div>;
}

function Portrait({ portrait, name }: { portrait: number; name: string }) {
  const positions = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];
  const own = portrait >= positions.length;
  const image = portrait === SECRET_DATABLE.portrait ? floriaPortrait : own ? yseraPortraitAsset.url : elfPortraits;
  return <div className="elf-portrait" role="img" aria-label={`Porträt von ${name}`} style={{ backgroundImage: `url(${image})`, backgroundSize: own ? "cover" : undefined, backgroundPosition: own ? "center" : positions[portrait] }} />;
}

function RomanceView({ id, save, tryBuy, onLeave }: { id: string; save: StorySave; tryBuy: (r: Buy, msg: string) => void; onLeave: () => void }) {
  const person = datableById(id);
  const [kidName, setKidName] = useState("");
  const [born, setBorn] = useState<string | null>(null);
  const secret = id === SECRET_DATABLE.id;
  if (!person) return null;
  const rel = relationOf(save, id);
  const kids = save.children.filter((c) => c.parent === id);
  const need = datesForNextChild(save, id);
  return <div className="romance-card hub-card">
    <div className="romance-exit">
      <span className="romance-exit-name">{person.name}</span>
      <Button variant="arcadeAlt" className="romance-exit-btn" onClick={onLeave}>🚪 VERLASSEN</Button>
    </div>
    <Portrait portrait={person.portrait} name={person.name} />
    <div className="romance-copy"><span className="text-secondary text-[10px]">{secret ? "🔐 GEHEIMES HÄUSCHEN · ERWACHSENE ELFE" : "HERZROSE · ERWACHSENE ELFE"}</span><h3 className="text-primary">{person.name}</h3><p>„{rel.married ? "Mein Zuhause ist überall, wo du bist." : person.hello}“</p>
      <div className="heart-meter" aria-label={`${rel.affection} von 10 Herzen`}>{Array.from({ length: 10 }, (_, i) => <span key={i} className={i < rel.affection ? "on" : ""}>♥</span>)}</div>
      <small>{rel.affection}/10 Herzen · {rel.dates} Dates {rel.married ? "· 💍 Verheiratet" : ""} {kids.length ? `· 👶 ${kids.length} ${kids.length === 1 ? "Kind" : "Kinder"}` : ""}</small>
      <div className="romance-actions">
        <Button variant="arcadeAlt" onClick={() => tryBuy(giveGift(save, id), `🎁 ${person.gift} überreicht. +1 Herz!`)}>🎁 GESCHENK · 25 💎</Button>
        <Button variant="arcadeAlt" onClick={() => tryBuy(goOnDate(save, id), `💞 ${person.date}`)}>🌙 DATE · 15 💎</Button>
        {!rel.married && <Button variant="arcade" onClick={() => tryBuy(propose(save, id), `💍 Du und ${person.name} seid jetzt verheiratet!`)}>💍 HEIRATEN</Button>}
        {secret && <Button variant="arcadeAlt" onClick={() => tryBuy(setPartnerFollows(save, !save.partnerFollows), save.partnerFollows ? "🏡 Floria wartet in ihrem Häuschen auf dich." : "🌸 Floria begleitet dich jetzt durch jede Welt!")}>{save.partnerFollows ? "🏡 BLEIB HIER" : "🌸 KOMM MIT MIR"}</Button>}
        {secret && !save.weapons.includes(FLORIA_BLADE_ID) && <Button variant="arcade" onClick={() => tryBuy(receiveFloriaBlade(save), `${FLORIA_BLADE_TEXT.emoji} ${FLORIA_BLADE_TEXT.given} (${PERK_TEXT.bloom})`)}>{FLORIA_BLADE_TEXT.emoji} FLORIAS GESCHENK{rel.affection < FLORIA_GIFT_HEARTS ? ` · ${FLORIA_GIFT_HEARTS} ♥` : ""}</Button>}
        {secret && <Button variant="arcadeAlt" onClick={() => tryBuy({ ok: true, save: { ...save, hp: playerStats(save).maxHp } }, "💖 Am Kamin ausgeruht – dein Leben ist wieder voll.")}>🔥 AM KAMIN AUSRUHEN</Button>}
      </div>
      {rel.married && save.children.length < MAX_CHILDREN && <div className="romance-actions items-end">
        <label className="text-[10px] flex-1 min-w-[150px]">NAME EURES KINDES
          <input value={kidName} maxLength={16} onChange={(e) => setKidName(e.target.value)} placeholder="z. B. Mira" className="character-input" />
        </label>
        <Button variant="arcade" onClick={() => { const r = welcomeChild(save, id, kidName); tryBuy(r, `👶 ${kidName.trim()} ist da! Eure Familie ist gewachsen.`); if (r.ok) { if (secret) setBorn(kidName.trim()); setKidName(""); } }}>👶 {kids.length ? "FAMILIE VERGRÖSSERN" : "FAMILIE GRÜNDEN"}</Button>
        <small className="w-full text-muted-foreground">Dates für das nächste Kind: {Math.min(rel.dates, need)}/{need}</small>
      </div>}
      <p className="text-[10px] text-muted-foreground">{secret ? "Geschenke bringen Herzen. Ab 2 Herzen kommt Floria mit dir durch jede Welt und geht mit dir aus. Heiraten: 8 Herzen und 2 Dates – ihr Häuschen ist euer Zuhause. Nach der Hochzeit wächst eure Familie mit jedem weiteren Date." : "Geschenke bringen Herzen. Ab 2 Herzen kannst du um ein Date bitten. Heiraten: 8 Herzen, 2 Dates und ein eigenes Haus. Nach der Hochzeit wächst eure Familie mit jedem weiteren Date."}</p>
    </div>
    {secret && save.weapons.includes(FLORIA_BLADE_ID) && <div className="hub-card floria-blade" role="note"><span className="text-3xl" aria-hidden>{FLORIA_BLADE_TEXT.emoji}</span><div><b className="text-primary">{FLORIA_BLADE_TEXT.name.toUpperCase()} · SUPER OP</b><p className="text-[10px] text-muted-foreground">{PERK_TEXT.bloom}</p></div></div>}
    {born && <div className="romance-scene birth-scene" style={{ backgroundImage: `url(${floriaBirth})` }} role="img" aria-label={`Geburt von ${born}`}>
      <span>👶 {born.toUpperCase()} IST ZUR WELT GEKOMMEN</span>
      <p className="birth-note">Im warmen Morgenlicht hält Floria euer Baby glücklich im Arm. Die alte Hebamme lächelt: „Willkommen auf der Welt, {born}!“</p>
    </div>}
    {secret && !born && rel.dates === 0 && <div className="romance-scene" style={{ backgroundImage: `url(${floriaHouse})` }}><span>🛖 FLORIAS HÄUSCHEN</span><StoryHero look={save.heroLook} direction={2} scale={4} /><StoryHero look={person.look} direction={1} scale={4} label={person.name} /></div>}
    {rel.dates > 0 && <div className="romance-scene" style={{ backgroundImage: `url(${secret && rel.married ? floriaHouse : rel.married ? weddingSceneAsset.url : dateSceneAsset.url})` }}>
      <span>{rel.married ? "💍 EURE HOCHZEIT" : `🌙 EUER LETZTES DATE`}</span>
      <StoryHero look={save.heroLook} direction={2} scale={4} />
      <StoryHero look={person.look} direction={1} scale={4} label={person.name} />
      {kids.map((k) => <StoryHero key={k.name} look={k.look} scale={2.6} label={k.name} />)}
    </div>}
    <Button variant="ghost" onClick={onLeave}>ZURÜCK IN DIE WELT ↗</Button>
  </div>;
}

function HomeView({ save, setSave, tryBuy, onLeave }: { save: StorySave; setSave: (s: StorySave) => void; tryBuy: (r: Buy, msg: string) => void; onLeave: () => void }) {
  const family = Object.entries(save.relationships).find(([, r]) => r.married);
  const partner = family ? datableById(family[0]) : null;
  if (!save.homeOwned) return <div className="story-talk hub-card home-card"><span className="story-speaker">🏡</span><b className="text-primary">Gemütliches Elfenhaus</b>
    <div className="family-room" style={{ backgroundImage: `url(${homeInteriorAsset.url})` }} role="img" aria-label="Blick ins Haus" />
    <p>Dieses hübsche Haus sucht einen Besitzer. Mit einem eigenen Zuhause kannst du dich ausruhen – und vielleicht später eine Familie gründen.</p>
    <Button variant="arcade" onClick={() => tryBuy(buyHome(save), "🏡 Das Haus gehört dir!")}>🏡 KAUFEN · {HOME_PRICE} 💎</Button>
    <Button variant="ghost" onClick={onLeave}>WEITERGEHEN ↗</Button>
  </div>;
  return <div className="hub-card family-home">
    <b className="text-primary">🏡 {save.heroName}s Zuhause</b>
    <div className="family-room" style={{ backgroundImage: `url(${homeInteriorAsset.url})` }}>
      <div className="family-members">
        <span className="family-member"><StoryHero look={save.heroLook} scale={4} /><small>{save.heroName}</small></span>
        {partner && <span className="family-member"><StoryHero look={partner.look} scale={4} label={partner.name} /><small>💍 {partner.name.split(" ")[0]}</small></span>}
        {save.children.map((k) => <span key={k.name} className="family-member"><StoryHero look={k.look} scale={2.6} label={k.name} /><small>{k.name}</small></span>)}
      </div>
    </div>
    <p className="text-xs">{partner ? `💍 ${partner.name} lebt mit dir hier.` : "Ein warmer Kamin, weiche Betten und ein kleiner Garten."}{save.children.length ? ` 👶 ${save.children.map((k) => k.name).join(", ")} ${save.children.length === 1 ? "spielt" : "spielen"} vor dem Kamin.` : ""}</p>
    <div className="family-actions">
      <Button variant="arcade" onClick={() => { setSave({ ...save, hp: playerStats(save).maxHp }); toast.success("💖 Ausgeruht! Dein Leben ist wieder voll."); }}>🛏️ AUSRUHEN</Button>
      <Button variant="ghost" onClick={onLeave}>WEITERGEHEN ↗</Button>
    </div>
  </div>;
}

function Gear({ save, setSave }: { save: StorySave; setSave: (s: StorySave) => void }) {
  const st = playerStats(save);
  const [page, setPage] = useState(0);
  const per = 40, pages = WEAPON_COUNT / per;
  const apply = (r: Buy, msg: string) => { if (r.ok) { beep(); setSave(r.save); toast.success(msg); } else toast.error(r.error); };
  const weapon = weaponAt(save.weapon), lvl = save.weaponLevels[String(weapon.id)] ?? 0, tool = equippedTool(save);
  return <div className="flex flex-col gap-4">
    <b className="text-primary">AUSGERÜSTET · 2 SLOTS</b>
    <div className="gear-slots">
      <div className="gear-slot is-sword"><small>⚔ SCHWERT-SLOT · nur Waffen</small><span className="gear-slot-icon">{weapon.emoji}</span><b>{weapon.name} +{lvl}</b><small>Kraft {st.power} · {PERK_TEXT[weapon.perk]}</small></div>
      <div className={`gear-slot is-item ${save.tool === null ? "is-empty" : ""}`}><small>🧰 ITEM-SLOT · Dungeon-Items oder Bomben</small>
        <span className="gear-slot-icon">{tool?.emoji ?? (save.tool === "bombs" ? "💣" : "–")}</span>
        <b>{save.tool === null ? "Leer" : save.tool === "bombs" ? `Bomben ×${save.bombs}` : tool?.name}</b>
        <small>{save.tool === null ? "Rüste unten ein Dungeon-Item oder Bomben aus." : `${tool?.use ?? SHOP_BOMB.use} Taste Q / Knopf ITEM.`}</small>
        {save.tool !== null && <Button variant="ghost" className="text-xs" onClick={() => { beep(); setSave(unequipTool(save)); }}>ABLEGEN</Button>}</div>
    </div>
    <div className="story-stats hub-card">
      {([["❤️", "Leben", st.maxHp], ["⚔", "Waffenkraft", st.power], ["💪", "Bonus-Schaden", st.atk], ["🧥", "Verteidigung", st.def + st.shield], ["🍀", "Krit-Chance", `${Math.round(st.crit * 100)} %`], ["💨", "Ausweichen", `${Math.round(st.dodge * 100)} %`], ["🌿", "Leben/Runde", st.regen], ["🩸", "Leben/Treffer", st.leech], ["⚡", "Erster Schlag", `+${st.first}`], ["🧪", "Trank n. Kampf", st.potion], ["💰", "Rubin-Bonus", `${Math.round(st.greed * 100)} %`], ["📈", "Upgrades", `${save.upgrades.length}/50`]] as const).map(([i, l, v]) => <div key={l}><span>{i}</span><small>{l}</small><b>{v}</b></div>)}
    </div>
    <b className="text-primary">FÜR DEN ITEM-SLOT · {save.dungeonItems.length} / {DUNGEON_ITEMS.length} DUNGEON-ITEMS</b>
    <div className="story-shop">
      {DUNGEON_ITEMS.map((it, w) => {
        const has = save.dungeonItems.includes(w), on = save.tool === w;
        return <div key={w} className={`story-item ${has ? "" : "is-locked"} ${on ? "is-equipped" : ""}`}><span className="text-2xl">{has ? it.emoji : "🧰"}</span>
          <div className="flex-1 min-w-0"><b>{has ? it.name : `Dungeon-Item ${w + 1}`}</b><small>{has ? `${it.use} Für immer: ${STAT_TEXT[it.stat](it.value)}` : `Versteckt in der Schatzkammer im Dungeon von ${WORLDS[w]!.name}.`}</small></div>
          {!has ? <span className="text-[10px] text-muted-foreground">🔒 {WORLDS[w]!.emoji} Welt {w + 1}</span>
            : on ? <span className="text-xs text-primary">✓ Im Item-Slot</span>
            : <Button variant="arcadeAlt" onClick={() => apply(equipTool(save, w), `${it.emoji} ${it.name} ist jetzt im Item-Slot.`)}>AUSRÜSTEN</Button>}</div>;
      })}
      <div className={`story-item ${save.bombs ? "" : "is-locked"} ${save.tool === "bombs" ? "is-equipped" : ""}`}><span className="text-2xl">💣</span>
        <div className="flex-1 min-w-0"><b>Bomben ×{save.bombs}</b><small>{SHOP_BOMB.use} {BOMB_PACK} Stück gibt es in jedem Dorfladen (Tab „Bomben“).</small></div>
        {save.tool === "bombs" ? <span className="text-xs text-primary">✓ Im Item-Slot</span> : <Button variant="arcadeAlt" disabled={!save.bombs} onClick={() => apply(equipTool(save, "bombs"), "💣 Bomben sind jetzt im Item-Slot.")}>AUSRÜSTEN</Button>}</div>
    </div>
    <div className="hub-card flex items-center gap-3 flex-wrap"><span className="text-3xl">{save.weapons.includes(MASTER_SWORD_ID) ? "🗡️" : "🪨"}</span><div className="flex-1 min-w-0"><b className="text-primary">{MASTER_SWORD_TEXT.name.toUpperCase()}</b>
      <p className="text-[11px] text-muted-foreground">{save.weapons.includes(MASTER_SWORD_ID) ? `Gehört dir! ${PERK_TEXT.holy}` : isTrueHero(save) ? MASTER_SWORD_TEXT.hint : `Steckt tief in den Lost Woods im Norden des Würfelwalds im Stein. Nur der wahre Held kann es ziehen – besiege die ersten vier Dungeon-Bosse (${SWORD_BOSSES.filter((l) => save.cleared.includes(l)).length}/4).`}</p></div></div>
    <b className="text-primary">FÜR DEN SCHWERT-SLOT · MEINE WAFFEN ({save.weapons.length})</b>
    <div className="story-shop">{save.weapons.map((id) => { const w = weaponAt(id); return <div key={id} className={`story-item rarity-${w.rarity} ${save.weapon === id ? "is-equipped" : ""}`}><span className="text-2xl">{w.emoji}</span><div className="flex-1 min-w-0"><b>{w.name} +{save.weaponLevels[String(id)] ?? 0}</b><small>{RARITIES[w.rarity]} · Kraft {weaponPower(w, save.weaponLevels[String(id)] ?? 0)} · {PERK_TEXT[w.perk]}</small></div>
      {save.weapon === id ? <span className="text-xs text-primary">✓ Im Schwert-Slot</span> : <Button variant="arcadeAlt" onClick={() => apply(equipWeapon(save, id), `${w.emoji} ${w.name} ist jetzt im Schwert-Slot.`)}>AUSRÜSTEN</Button>}</div>; })}</div>
    <div className="flex justify-between items-center gap-2 flex-wrap"><b className="text-primary">ARSENAL · {save.weapons.length} / {fmt(WEAPON_COUNT)} GEFUNDEN</b>
      <div className="flex items-center gap-2"><Button variant="ghost" className="brush" disabled={page === 0} onClick={() => setPage(page - 1)}>◀</Button><span className="text-xs">Seite {page + 1}/{pages}</span><Button variant="ghost" className="brush" disabled={page === pages - 1} onClick={() => setPage(page + 1)}>▶</Button></div></div>
    <div className="story-arsenal">{Array.from({ length: per }, (_, k) => { const w = weaponAt(page * per + k), has = save.weapons.includes(w.id); return <span key={w.id} className={`rarity-${w.rarity} ${has ? "has" : ""}`} title={`${w.name} · Kraft ${w.power} · Welt ${w.tier + 1}`}>{has ? w.emoji : "🔒"}<small>#{w.id + 1}</small></span>; })}</div>
    <p className="text-[11px] text-muted-foreground">Waffen gibt es in den {CITIES.length} Dörfern und in 🎁 Schatztruhen. Jede Welt hat stärkere Waffen.</p>
    <Button variant="ghost" className="self-start text-xs" onClick={() => { if (confirm("Wirklich ganz von vorne anfangen? Dein Fortschritt wird gelöscht.")) setSave(newSave()); }}>↺ Neues Spiel</Button>
  </div>;
}

/** Six-digit keypad on the cottage door; nothing behind it is shown before the right code. */
function SecretDoor({ onOpen, onLeave }: { onOpen: (code: string) => boolean; onLeave: () => void }) {
  const [code, setCode] = useState("");
  const press = (d: string) => { beep(70); const next = (code + d).slice(0, 6); setCode(next); if (next.length === 6 && !onOpen(next)) setCode(""); };
  const pressRef = useRef(press); pressRef.current = press;
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (/^[0-9]$/.test(e.key)) pressRef.current(e.key); else if (e.key === "Backspace") setCode((c) => c.slice(0, -1)); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return <div className="story-talk hub-card secret-door">
    <img src={secretCottageArt} alt="" width={128} height={144} className="secret-door-art" />
    <b className="text-primary">🔐 Verwachsenes Häuschen</b>
    <p className="text-xs">Die runde Tür ist mit einem leuchtenden Zahlenschloss verschlossen. Nur wer den sechsstelligen Code kennt, darf eintreten.</p>
    <div className="secret-code" aria-label={`${code.length} von 6 Ziffern eingegeben`}>{Array.from({ length: 6 }, (_, i) => <span key={i} className={i < code.length ? "on" : ""} />)}</div>
    <div className="secret-keypad">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} type="button" onClick={() => press(d)}>{d}</button>)}
      <button type="button" aria-label="Löschen" onClick={() => setCode(code.slice(0, -1))}>⌫</button>
      <button type="button" onClick={() => press("0")}>0</button>
      <button type="button" aria-label="Alles löschen" onClick={() => setCode("")}>✕</button>
    </div>
    <Button variant="ghost" onClick={onLeave}>WEITERGEHEN ↗</Button>
  </div>;
}
