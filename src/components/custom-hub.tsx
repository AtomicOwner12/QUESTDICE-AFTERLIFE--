import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useMe, type Me } from "@/hooks/use-me";
import { Button } from "./ui/button";
import { MapEditor, newDraft, draftFromRow, type Draft } from "./map-editor";
import { USERNAME_RE, type PlayableMap } from "@/lib/custom-maps";
import { attachNames } from "@/lib/player-names";

type View = { kind: "list" } | { kind: "edit"; draft: Draft } | { kind: "map"; id: string } | { kind: "profile"; id: string };
type Card = { id: string | null; owner_id: string | null; title: string | null; description: string | null; length: number | null; dice: number | null; is_public: boolean | null; made_by_dicey: boolean | null; plays: number | null; username: string | null; likes: number | null; dislikes: number | null; comments: number | null; created_at: string | null };

export const OPEN_CUSTOM_KEY = "qd-open-custom";
export const OPEN_MARKET_KEY = "qd-open-market";

async function signInWith(provider: "google" | "microsoft", returnKey: string) {
  sessionStorage.setItem(returnKey, "1");
  const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
  if (r.error) toast.error("Anmeldung hat nicht geklappt. Bitte nochmal versuchen.");
}

/** Used by actions that need an account: point the player to the sign-in buttons. */
function signIn() {
  toast.info("Melde dich zuerst oben mit Google oder Microsoft an.");
  document.querySelector(".custom-hub")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CustomHub({ onPlay, onBack }: { onPlay: (m: PlayableMap) => void; onBack: () => void }) {
  const { data: me = null, isLoading } = useMe();
  const [tab, setTab] = useState<"mine" | "others">("mine");
  const [view, setView] = useState<View>({ kind: "list" });

  return (
    <section className="custom-hub">
      <div className="section-heading !mb-0"><div><span className="text-secondary text-[10px]">CUSTOM · EIGENE MAPS · DICEY AI · COMMUNITY</span><h2 className="section-title mt-2">CUSTOM</h2></div><Button variant="ghost" onClick={onBack} aria-label="Zurück">←</Button></div>
      <AccountBar me={me} loading={isLoading} />
      {view.kind === "list" && <>
        <div className="hub-tabs" role="tablist">
          <button type="button" role="tab" className="hub-tab" aria-selected={tab === "mine"} onClick={() => setTab("mine")}>🛠 MEINE MAPS</button>
          <button type="button" role="tab" className="hub-tab" aria-selected={tab === "others"} onClick={() => setTab("others")}>🌍 OTHERS</button>
        </div>
        {tab === "mine" ? <MyMaps me={me} onNew={() => setView({ kind: "edit", draft: newDraft() })} onOpen={async (id) => {
          const { data, error } = await supabase.from("maps").select("id, title, description, dice, tiles, platforms, is_public, made_by_dicey").eq("id", id).single();
          if (error || !data) return void toast.error("Map konnte nicht geladen werden.");
          setView({ kind: "edit", draft: draftFromRow(data) });
        }} /> : <Others me={me} onOpen={(id) => setView({ kind: "map", id })} onProfile={(id) => setView({ kind: "profile", id })} />}
      </>}
      {view.kind === "edit" && <MapEditor key={view.draft.id ?? "new"} initial={view.draft} me={me} onPlay={onPlay} onSignIn={signIn} onClose={() => setView({ kind: "list" })} />}
      {view.kind === "map" && <MapDetail id={view.id} me={me} onPlay={onPlay} onBack={() => setView({ kind: "list" })} onProfile={(id) => setView({ kind: "profile", id })} />}
      {view.kind === "profile" && <Profile id={view.id} me={me} onBack={() => setView({ kind: "list" })} onOpen={(id) => setView({ kind: "map", id })} />}
    </section>
  );
}

function MicrosoftButton({ returnKey }: { returnKey: string }) {
  return <button type="button" className="google-btn" onClick={() => signInWith("microsoft", returnKey)}>
    <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><path fill="#F25022" d="M1 1h9v9H1z"/><path fill="#7FBA00" d="M11 1h9v9h-9z"/><path fill="#00A4EF" d="M1 11h9v9H1z"/><path fill="#FFB900" d="M11 11h9v9h-9z"/></svg>
    Weiter mit Microsoft
  </button>;
}

function GoogleButton({ returnKey }: { returnKey: string }) {
  return <button type="button" className="google-btn" onClick={() => signInWith("google", returnKey)}>
    <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
    Weiter mit Google
  </button>;
}

export function AccountBar({ me, loading, returnKey = OPEN_CUSTOM_KEY, intro = "Melde dich an, um Maps zu speichern, Dicey zu nutzen, zu liken, zu kommentieren und Spielern zu folgen." }: { me: Me; loading: boolean; returnKey?: string; intro?: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <div className="hub-card text-xs text-muted-foreground">Lade Konto…</div>;
  if (!me) return <div className="hub-card flex-row items-center justify-between flex-wrap"><p className="text-sm">{intro}</p><div className="flex gap-2 flex-wrap"><GoogleButton returnKey={returnKey} /><MicrosoftButton returnKey={returnKey} /></div></div>;
  async function saveName() {
    if (!me) return;
    if (!USERNAME_RE.test(name)) return void toast.error("3–20 Zeichen: Buchstaben, Zahlen oder _");
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({ id: me.id, username: name });
    setBusy(false);
    if (error) return void toast.error(error.code === "23505" ? "Dieser Username ist schon vergeben." : "Speichern hat nicht geklappt.");
    toast.success(`Willkommen, @${name}!`);
    qc.invalidateQueries({ queryKey: ["me"] });
  }
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  }
  if (!me.username) return <div className="hub-card"><p className="text-sm text-primary font-extrabold">Wähle deinen eigenen Username</p><div className="flex gap-2 flex-wrap"><input className="hub-input flex-1 min-w-40" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Umut_Dice" aria-label="Username" /><Button variant="arcade" disabled={busy} onClick={saveName}>SPEICHERN</Button></div><p className="text-[11px] text-muted-foreground">3–20 Zeichen: Buchstaben, Zahlen oder _. Andere Spieler sehen diesen Namen.</p></div>;
  return <div className="hub-card flex-row items-center justify-between flex-wrap"><span className="text-sm">Angemeldet als <b className="text-primary">@{me.username}</b></span><Button variant="ghost" onClick={signOut}>Abmelden</Button></div>;
}

function MapCardView({ c, onOpen, onProfile }: { c: Card; onOpen: () => void; onProfile?: (() => void) | undefined }) {
  return <div className="hub-card">
    <button type="button" className="text-left flex flex-col gap-1" onClick={onOpen}>
      <span className="font-extrabold text-primary">{c.title}</span>
      {c.description ? <span className="text-xs text-muted-foreground line-clamp-2">{c.description}</span> : null}
    </button>
    <div className="text-xs flex flex-wrap gap-3">
      {onProfile && c.username ? <button type="button" className="underline" onClick={onProfile}>@{c.username}</button> : null}
      <span>{(c.length ?? 0).toLocaleString("de-DE")} Felder</span><span>{"🎲".repeat(c.dice ?? 1)}</span>
      {c.made_by_dicey ? <span>✨ Dicey</span> : null}{c.is_public === false ? <span>🔒 privat</span> : null}
    </div>
    <div className="text-xs flex gap-3"><span>👍 {c.likes ?? 0}</span><span>👎 {c.dislikes ?? 0}</span><span>💬 {c.comments ?? 0}</span><span>▶ {c.plays ?? 0}</span></div>
  </div>;
}

function MyMaps({ me, onNew, onOpen }: { me: Me; onNew: () => void; onOpen: (id: string) => void }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["maps", "mine", me?.id], enabled: !!me,
    queryFn: async () => (await supabase.from("map_cards").select("*").eq("owner_id", me!.id).order("updated_at", { ascending: false })).data ?? [],
  });
  return <div className="flex flex-col gap-3">
    <div className="flex gap-2 flex-wrap"><Button variant="arcade" onClick={onNew}>+ NEUE MAP BAUEN</Button><Button variant="arcadeAlt" onClick={onNew}>✨ MIT DICEY ERSTELLEN</Button></div>
    {!me ? <p className="text-xs text-muted-foreground">Du kannst auch ohne Anmeldung bauen und spielen – zum Speichern melde dich an.</p>
      : isLoading ? <p className="text-xs">Lade deine Maps…</p>
      : data.length === 0 ? <p className="text-xs text-muted-foreground">Noch keine Maps. Bau deine erste!</p>
      : <div className="hub-grid">{data.map((c) => <MapCardView key={c.id} c={c} onOpen={() => c.id && onOpen(c.id)} />)}</div>}
  </div>;
}

function Others({ me, onOpen, onProfile }: { me: Me; onOpen: (id: string) => void; onProfile: (id: string) => void }) {
  const [sort, setSort] = useState<"new" | "top" | "following">("new");
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["maps", "others", sort, q, me?.id],
    queryFn: async () => {
      let query = supabase.from("map_cards").select("*").eq("is_public", true).limit(60);
      if (q.trim()) query = query.ilike("title", `%${q.trim().replace(/[%_]/g, "")}%`);
      if (sort === "following") {
        if (!me) return [];
        const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", me.id);
        const ids = (f ?? []).map((x) => x.following_id);
        if (!ids.length) return [];
        query = query.in("owner_id", ids);
      }
      query = sort === "top" ? query.order("likes", { ascending: false }).order("plays", { ascending: false }) : query.order("created_at", { ascending: false });
      return (await query).data ?? [];
    },
  });
  return <div className="flex flex-col gap-3">
    <div className="flex gap-2 flex-wrap items-center">
      {([["new", "🆕 Neu"], ["top", "🔥 Beliebt"], ["following", "⭐ Gefolgt"]] as const).map(([k, l]) => <Button key={k} variant="ghost" className="brush" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</Button>)}
      <input className="hub-input flex-1 min-w-40" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Maps suchen…" aria-label="Maps suchen" />
    </div>
    {sort === "following" && !me ? <p className="text-xs text-muted-foreground">Melde dich an, um Spielern zu folgen.</p>
      : isLoading ? <p className="text-xs">Lade Maps…</p>
      : data.length === 0 ? <p className="text-xs text-muted-foreground">{sort === "following" ? "Noch keine Maps von Spielern, denen du folgst." : "Noch keine veröffentlichten Maps. Sei der Erste!"}</p>
      : <div className="hub-grid">{data.map((c) => <MapCardView key={c.id} c={c} onOpen={() => c.id && onOpen(c.id)} onProfile={c.owner_id ? () => onProfile(c.owner_id!) : undefined} />)}</div>}
  </div>;
}

function FollowButton({ me, userId }: { me: Me; userId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["follow", userId, me?.id],
    queryFn: async () => {
      const counts = await supabase.rpc("follow_counts", { _user_id: userId });
      const mine = me ? await supabase.from("follows").select("follower_id").eq("follower_id", me.id).eq("following_id", userId).maybeSingle() : null;
      return { count: counts.data?.[0]?.followers ?? 0, following: !!mine?.data };
    },
  });
  if (me?.id === userId) return <span className="text-xs">{data?.count ?? 0} Follower</span>;
  async function toggle() {
    if (!me) return void signIn();
    if (!me.username) return void toast.error("Wähle zuerst oben deinen Username.");
    const { error } = data?.following
      ? await supabase.from("follows").delete().eq("follower_id", me.id).eq("following_id", userId)
      : await supabase.from("follows").insert({ follower_id: me.id, following_id: userId });
    if (error) return void toast.error("Hat nicht geklappt.");
    qc.invalidateQueries({ queryKey: ["follow", userId] });
    qc.invalidateQueries({ queryKey: ["maps", "others"] });
  }
  return <Button variant="ghost" className="brush" aria-pressed={!!data?.following} onClick={toggle}>{data?.following ? "✓ Gefolgt" : "+ Folgen"} · {data?.count ?? 0}</Button>;
}

function MapDetail({ id, me, onPlay, onBack, onProfile }: { id: string; me: Me; onPlay: (m: PlayableMap) => void; onBack: () => void; onProfile: (id: string) => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const { data: card } = useQuery({ queryKey: ["maps", "card", id], queryFn: async () => (await supabase.from("map_cards").select("*").eq("id", id).maybeSingle()).data });
  const { data: myVote = 0 } = useQuery({ queryKey: ["maps", "vote", id, me?.id], enabled: !!me, queryFn: async () => (await supabase.from("map_votes").select("value").eq("map_id", id).eq("user_id", me!.id).maybeSingle()).data?.value ?? 0 });
  const { data: comments = [] } = useQuery({ queryKey: ["maps", "comments", id], queryFn: async () => attachNames((await supabase.from("map_comments").select("id, body, created_at, user_id").eq("map_id", id).order("created_at", { ascending: false }).limit(100)).data ?? [], "user_id") });
  const refresh = () => qc.invalidateQueries({ queryKey: ["maps"] });
  const needName = () => { if (!me) { signIn(); return true; } if (!me.username) { toast.error("Wähle zuerst oben deinen Username."); return true; } return false; };

  async function vote(v: 1 | -1) {
    if (needName() || !me) return;
    const { error } = myVote === v ? await supabase.from("map_votes").delete().eq("map_id", id).eq("user_id", me.id) : await supabase.from("map_votes").upsert({ map_id: id, user_id: me.id, value: v });
    if (error) return void toast.error("Hat nicht geklappt.");
    refresh();
  }
  async function comment() {
    if (needName() || !me || !text.trim()) return;
    const { error } = await supabase.from("map_comments").insert({ map_id: id, user_id: me.id, body: text.trim().slice(0, 500) });
    if (error) return void toast.error("Kommentar konnte nicht gesendet werden.");
    setText(""); refresh();
  }
  async function delComment(cid: string) {
    await supabase.from("map_comments").delete().eq("id", cid); refresh();
  }
  async function play() {
    const { data, error } = await supabase.from("maps").select("id, title, description, dice, tiles, platforms, is_public, made_by_dicey").eq("id", id).single();
    if (error || !data) return void toast.error("Map konnte nicht geladen werden.");
    await supabase.rpc("count_map_play", { _map_id: id });
    const d = draftFromRow(data);
    onPlay({ id: d.id, title: d.title, tiles: d.tiles, platforms: d.platforms, dice: d.dice });
  }
  if (!card) return <div className="flex flex-col gap-3"><Button variant="ghost" className="self-start" onClick={onBack}>← Zurück</Button><p className="text-xs">Lade Map…</p></div>;
  return <div className="flex flex-col gap-4">
    <Button variant="ghost" className="self-start" onClick={onBack}>← Zurück</Button>
    <div className="hub-card">
      <h3 className="text-xl font-extrabold text-primary">{card.title} {card.made_by_dicey ? <span className="text-xs">✨ mit Dicey</span> : null}</h3>
      {card.description ? <p className="text-sm">{card.description}</p> : null}
      <div className="flex gap-3 flex-wrap items-center text-xs">
        {card.username && card.owner_id ? <button type="button" className="underline" onClick={() => onProfile(card.owner_id!)}>von @{card.username}</button> : null}
        {card.owner_id ? <FollowButton me={me} userId={card.owner_id} /> : null}
        <span>{(card.length ?? 0).toLocaleString("de-DE")} Felder · {"🎲".repeat(card.dice ?? 1)} · ▶ {card.plays ?? 0} gespielt</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="arcade" onClick={play}>▶ MAP AUSPROBIEREN</Button>
        <Button variant="ghost" className="brush vote-btn" aria-pressed={myVote === 1} onClick={() => vote(1)} aria-label="Like">👍 {card.likes ?? 0}</Button>
        <Button variant="ghost" className="brush vote-btn" aria-pressed={myVote === -1} onClick={() => vote(-1)} aria-label="Dislike">👎 {card.dislikes ?? 0}</Button>
      </div>
    </div>
    <div className="hub-card">
      <h3 className="font-extrabold">💬 KOMMENTARE ({comments.length})</h3>
      <div className="flex gap-2"><input className="hub-input flex-1" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && comment()} placeholder={me ? "Schreib einen Kommentar…" : "Anmelden zum Kommentieren"} aria-label="Kommentar" /><Button variant="arcade" onClick={comment}>SENDEN</Button></div>
      {comments.map((c) => <div key={c.id} className="border-t border-border pt-2 text-sm flex justify-between gap-2">
        <span><button type="button" className="text-primary font-bold" onClick={() => onProfile(c.user_id)}>@{c.profiles?.username ?? "?"}</button> {c.body}</span>
        {me?.id === c.user_id && <button type="button" className="text-xs text-muted-foreground" onClick={() => delComment(c.id)} aria-label="Kommentar löschen">✕</button>}
      </div>)}
    </div>
  </div>;
}

function Profile({ id, me, onBack, onOpen }: { id: string; me: Me; onBack: () => void; onOpen: (id: string) => void }) {
  const { data } = useQuery({
    queryKey: ["maps", "profile", id],
    queryFn: async () => {
      const [p, maps, following] = await Promise.all([
        supabase.rpc("player_name", { _user_id: id }),
        supabase.from("map_cards").select("*").eq("owner_id", id).eq("is_public", true).order("created_at", { ascending: false }),
        supabase.rpc("follow_counts", { _user_id: id }),
      ]);
      return { username: p.data ?? "?", maps: maps.data ?? [], following: following.data?.[0]?.following ?? 0 };
    },
  });
  return <div className="flex flex-col gap-4">
    <Button variant="ghost" className="self-start" onClick={onBack}>← Zurück</Button>
    <div className="hub-card flex-row items-center justify-between flex-wrap">
      <div><h3 className="text-xl font-extrabold text-primary">@{data?.username ?? "…"}</h3><p className="text-xs">{data?.maps.length ?? 0} Maps · folgt {data?.following ?? 0}</p></div>
      <FollowButton me={me} userId={id} />
    </div>
    <div className="hub-grid">{(data?.maps ?? []).map((c) => <MapCardView key={c.id} c={c} onOpen={() => c.id && onOpen(c.id)} />)}</div>
  </div>;
}
