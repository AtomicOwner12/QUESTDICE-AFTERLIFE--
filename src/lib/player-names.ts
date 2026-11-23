import { supabase } from "@/integrations/supabase/client";

/** Public usernames for some players. Profiles are private; only this narrow lookup shares the display name. */
export async function playerNames(ids: (string | null | undefined)[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))].slice(0, 200);
  const out = new Map<string, string | null>();
  if (!unique.length) return out;
  const { data } = await supabase.rpc("player_names", { _ids: unique });
  for (const row of data ?? []) if (row.id) out.set(row.id, row.username ?? null);
  return out;
}

/** Adds `profiles: { username }` to rows, read from the public name lookup by the given id field. */
export async function attachNames<T extends Record<string, unknown>>(rows: T[], idKey: keyof T): Promise<(T & { profiles: { username: string | null } | null })[]> {
  const names = await playerNames(rows.map((r) => r[idKey] as string | null));
  return rows.map((r) => ({ ...r, profiles: { username: names.get(r[idKey] as string) ?? null } }));
}
