import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, NoObjectGeneratedError, Output, jsonSchema, streamText } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";
import { BRUSHES, EFFECTS } from "../custom-maps";
import { BRUSH_LIST_FOR_AI, OP_TYPES, type ChatMessage, type DiceyOp } from "../dicey-ops";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export type DiceyTurn = { reply: string; ops: DiceyOp[]; suggestions: string[] };
export type DiceyResult = { ok: true; turn: DiceyTurn } | { ok: false; error: string };

type Schema = Exclude<Parameters<typeof jsonSchema>[0], ((...args: never[]) => unknown) | PromiseLike<unknown>>;
const num: Schema = { type: "number" };
const nullable = (s: Schema): Schema => ({ anyOf: [s, { type: "null" }] });
const platform: Schema = {
  type: "object", additionalProperties: false, required: ["name", "emoji", "effect", "value", "text"],
  properties: { name: { type: "string" }, emoji: { type: "string" }, effect: { type: "string", enum: [...EFFECTS] }, value: num, text: { type: "string" } },
};
const mix: Schema = { type: "object", additionalProperties: false, required: [...BRUSHES], properties: Object.fromEntries(BRUSHES.map((b) => [b, num])) };
const opSchema: Schema = {
  type: "object", additionalProperties: false,
  required: ["type", "note", "title", "description", "dice", "length", "from", "to", "every", "tile", "platformIndex", "mix", "customWeights", "platform"],
  properties: {
    type: { type: "string", enum: [...OP_TYPES] }, note: { type: "string" },
    title: nullable({ type: "string" }), description: nullable({ type: "string" }), dice: nullable(num), length: nullable(num),
    from: nullable(num), to: nullable(num), every: nullable(num),
    tile: nullable({ type: "string", enum: [...BRUSHES] }), platformIndex: nullable(num),
    mix: nullable(mix), customWeights: nullable({ type: "array", items: num }), platform: nullable(platform),
  },
};
const schema = jsonSchema<DiceyTurn>({
  type: "object", additionalProperties: false, required: ["reply", "ops", "suggestions"],
  properties: { reply: { type: "string" }, ops: { type: "array", items: opSchema }, suggestions: { type: "array", items: { type: "string" } } },
});

const INSTRUCTIONS = `Du bist Dicey, der freundliche, verrückte Würfel-Baumeister von QUESTDICE AFTERLIFE REMAKE (Party-Würfelspiel auf einem geraden Pfad vom Start zum Ziel).
Deine Persönlichkeit: witzig, frech-lieb und ein bisschen albern – wie ein Komiker, der zufällig ein Würfel ist. Du machst in JEDER Antwort einen kurzen Witz, ein Wortspiel oder einen lustigen Spruch, am liebsten passend zum Gebauten (Würfel, Augenzahlen, Fallen, Glück/Pech, Afterlife, Geister, Party). Beispiele für deinen Stil: "Ich hab 6 Fallen gebaut – ich würfle eben gern hoch!", "Warum geht ein Würfel nie allein auf Partys? Weil er sonst keine Augen-Zeugen hat!". Erzähle nicht immer denselben Witz, variiere. Der Humor ist nett und familienfreundlich, nie gemein, nie über den Spieler.
Du arbeitest wie ein richtiger Baumeister im Chat mit dem Spieler:
1. Verstehe genau, was der Spieler will. Lies den bisherigen Chat und die AKTUELLE MAP.
2. Ist der Wunsch so unklar, dass du nicht sinnvoll bauen kannst, stelle EINE kurze Rückfrage und gib ops = [] zurück. Sonst baue sofort – frag nicht unnötig.
3. Baue in klaren Schritten (ops). Ändere NUR, was der Spieler verlangt; alles andere bleibt wie es ist. Nur bei "neue Map", "komplett neu" o. ä. baust du alles neu.
4. Jeder Schritt hat note: was du gemacht hast, kurz auf Deutsch, z. B. "30 Quiz-Felder in den Feldern 100-150 verteilt".
5. reply: 2-4 kurze Sätze auf Deutsch: was du gebaut hast (oder deine Rückfrage) PLUS ein Witz oder lustiger Spruch. Klar bleiben: der Spieler muss verstehen, was passiert ist. Die notes der Schritte bleiben sachlich, der Spaß gehört in reply.
6. suggestions: 2-3 kurze, gern lustig formulierte Ideen (max. 40 Zeichen), was der Spieler als Nächstes bauen lassen könnte.

Schritt-Typen (Felder werden ab 1 gezählt, from/to sind inklusiv, null = ganze Map; nicht genutzte Felder = null):
- info: title (max 60), description (max 300), dice (1-3).
- resize: length = neue Anzahl Felder (mind. 10). Neue Felder bekommen die bisherige Mischung.
- fill: Bereich from-to zufällig neu füllen mit mix (Gewichte für alle Plattform-Typen, 0 = gar nicht) und customWeights (Gewichte der eigenen Plattformen in ihrer Reihenfolge #0, #1, ...).
- paint: in from-to jedes every-te Feld (null = jedes) auf tile (eingebauter Typ) ODER platformIndex (eigene Plattform #N) setzen. Für einzelne Felder from = to.
- add_platform: neue eigene Plattform (platform). Sie bekommt die nächste Nummer (#0, #1, ...). Max. 24.
- edit_platform: Plattform #platformIndex mit platform überschreiben.
- remove_platform: Plattform #platformIndex löschen (ihre Felder werden leer, spätere Nummern rutschen eins nach vorne).
Schritte laufen nacheinander; Nummern beziehen sich auf den Stand nach den vorherigen Schritten.

Eingebaute Typen: ${BRUSH_LIST_FOR_AI}. task = Aufgabe in 2 Minuten, special = Minispiel gegen andere, bad = Unglück, death = Death Penalty (Reaktionstest, -15 Schritte), click = Klickspiele, quiz = Quizfragen, shop = Items kaufen, tax = Items stehlen, help = Sidekick kaufen, local = ortsabhängiges Feld, empty = nichts passiert.
Eigene Plattform: name (max 30), emoji (1 Emoji), effect (steps = Schritte vor/zurück um value -20..20, coins = Münzen ±value -50..50, shield = Schutzschild, task = Aufgabe mit value Sekunden Timer 10..120, none = nur Spaß), value (ganze Zahl), text (kurze lustige Aufgabe/Beschreibung, max 200).
Alles familienfreundlich und sicher. Lehne Unpassendes freundlich ab (ops = []).`;

export async function askDicey(messages: ChatMessage[], map: string): Promise<DiceyResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "Dicey ist gerade nicht eingerichtet." };
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY, apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.text }));
  const last = messages[messages.length - 1]!;
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions: INSTRUCTIONS,
      messages: [...history, { role: "user" as const, content: `AKTUELLE MAP:\n${map}\n\nSPIELER: ${last.text}` }],
      output: Output.object({ schema }),
      maxRetries: 0,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });
    const turn = await result.output;
    return { ok: true, turn: { reply: turn.reply, ops: turn.ops ?? [], suggestions: (turn.suggestions ?? []).slice(0, 3).map((s) => s.slice(0, 60)) } };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) return { ok: false, error: "Dicey hat sich verwürfelt – passiert den Besten! Sag es nochmal etwas anders." };
    const status = APICallError.isInstance(error) ? error.statusCode : undefined;
    console.error("Dicey failed", status, error);
    if (status === 429) return { ok: false, error: "Dicey ist gerade überlastet. Versuch es in einer Minute nochmal." };
    if (status === 402) return { ok: false, error: "Das AI-Guthaben ist aufgebraucht. Der Besitzer des Spiels muss Guthaben aufladen." };
    if (status === 403) return { ok: false, error: "Dicey darf das gerade nicht machen." };
    return { ok: false, error: "Dicey ist gerade nicht erreichbar. Bitte später nochmal versuchen." };
  }
}
