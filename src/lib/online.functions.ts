import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";
import {
  addPlayer, applyOnlineAction, createOnlineState, makeCode, normalizeCode, isValidCode, sanitizePlayer, OnlineError,
  type OnlineAction, type OnlineState,
} from "./online";

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };
const errorOf = (e: unknown) => (e instanceof OnlineError ? e.message : (console.error(e), "Verbindung zum Server fehlgeschlagen. Bitte nochmal versuchen."));

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Loads, changes and saves a lobby with an optimistic version check (retries on conflicts). */
async function mutateLobby(code: string, change: (s: OnlineState) => { state: OnlineState; extra?: Record<string, unknown> }) {
  const db = await admin();
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: row, error } = await db.from("online_lobbies").select("id, state, version").eq("code", code).maybeSingle();
    if (error) throw error;
    if (!row) throw new OnlineError("Lobby nicht gefunden. Prüfe den Code.");
    const { state, extra } = change(row.state as unknown as OnlineState);
    const { data: saved, error: e2 } = await db.from("online_lobbies")
      .update({ state: state as unknown as Json, version: row.version + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("version", row.version).select("version");
    if (e2) throw e2;
    if (saved && saved.length) return { id: row.id, state, version: row.version + 1, extra };
  }
  throw new OnlineError("Gerade ist viel los – bitte nochmal tippen.");
}

export const createLobbyFn = createServerFn({ method: "POST" })
  .inputValidator((input: { player: unknown }) => input)
  .handler(async ({ data }): Promise<Result<{ code: string; seat: number; token: string; version: number }>> => {
    try {
      const host = sanitizePlayer(data.player);
      const db = await admin();
      // Clean up lobbies nobody touched for two days.
      await db.from("online_lobbies").delete().lt("updated_at", new Date(Date.now() - 2 * 864e5).toISOString());
      const state = createOnlineState(host);
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = makeCode();
        const { data: lobby, error } = await db.from("online_lobbies").insert({ code, state: state as unknown as Json, version: 1 }).select("id").single();
        if (error) { if (error.code === "23505") continue; throw error; }
        const { data: seat, error: e2 } = await db.from("online_seats").insert({ lobby_id: lobby.id, seat: 0 }).select("token").single();
        if (e2) throw e2;
        return { ok: true, code, seat: 0, token: seat.token, version: 1 };
      }
      throw new OnlineError("Kein freier Code gefunden – bitte nochmal versuchen.");
    } catch (e) { return { ok: false, error: errorOf(e) }; }
  });

export const joinLobbyFn = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; player: unknown }) => ({ code: normalizeCode(String(input.code ?? "")), player: input.player }))
  .handler(async ({ data }): Promise<Result<{ code: string; seat: number; token: string; version: number }>> => {
    try {
      if (!isValidCode(data.code)) throw new OnlineError("Der Code hat 6 Zeichen.");
      const info = sanitizePlayer(data.player);
      const res = await mutateLobby(data.code, (s) => { const r = addPlayer(s, info); return { state: r.state, extra: { seat: r.seat } }; });
      const seatNo = res.extra!["seat"] as number;
      const db = await admin();
      const { data: seat, error } = await db.from("online_seats").insert({ lobby_id: res.id, seat: seatNo }).select("token").single();
      if (error) throw error;
      return { ok: true, code: data.code, seat: seatNo, token: seat.token, version: res.version };
    } catch (e) { return { ok: false, error: errorOf(e) }; }
  });

export const lobbyActionFn = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; seat: number; token: string; action: OnlineAction }) => ({
    code: normalizeCode(String(input.code ?? "")),
    seat: Number(input.seat),
    token: String(input.token ?? ""),
    action: input.action,
  }))
  .handler(async ({ data }): Promise<Result<{ version: number; state: OnlineState }>> => {
    try {
      if (!isValidCode(data.code) || !Number.isInteger(data.seat) || !/^[0-9a-f-]{36}$/i.test(data.token)) throw new OnlineError("Ungültige Sitzung.");
      const db = await admin();
      const { data: lobby } = await db.from("online_lobbies").select("id").eq("code", data.code).maybeSingle();
      if (!lobby) throw new OnlineError("Lobby nicht gefunden.");
      const { data: seat } = await db.from("online_seats").select("token").eq("lobby_id", lobby.id).eq("seat", data.seat).maybeSingle();
      if (!seat || seat.token !== data.token) throw new OnlineError("Du gehörst nicht zu dieser Lobby.");
      const res = await mutateLobby(data.code, (s) => ({ state: applyOnlineAction(s, data.seat, data.action, Date.now()) }));
      return { ok: true, version: res.version, state: res.state };
    } catch (e) { return { ok: false, error: errorOf(e) }; }
  });
