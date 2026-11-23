import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ChatMessage } from "./dicey-ops";

/** Dicey chats with the player and returns building steps for the current map. Signed-in players only (it uses AI credits). */
export const askDiceyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: ChatMessage[]; map: string }) => ({
    messages: (Array.isArray(input.messages) ? input.messages : []).slice(-12).flatMap((m): ChatMessage[] =>
      m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim() ? [{ role: m.role, text: m.text.trim().slice(0, 1200) }] : []),
    map: String(input.map ?? "").slice(0, 4000),
  }))
  .handler(async ({ data }) => {
    const last = data.messages[data.messages.length - 1];
    if (!last || last.role !== "user") return { ok: false as const, error: "Sag Dicey, was du bauen willst." };
    const { askDicey } = await import("./ai/dicey.server");
    return askDicey(data.messages, data.map);
  });
