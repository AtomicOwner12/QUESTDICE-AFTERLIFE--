import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Me = { id: string; username: string | null } | null;

/** The signed-in player and their custom username (null when signed out). */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("id, username").eq("id", user.id).maybeSingle();
      return { id: user.id, username: data?.username ?? null };
    },
    staleTime: 60_000,
  });
}
