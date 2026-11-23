import { useState } from "react";
import { Button } from "./ui/button";
import { ClickPlatformGame } from "./click-platform-game";
import { QuizGame } from "./quiz-game";
import { CLICK_GAMES } from "@/lib/click-games";
import { QUIZ_QUESTIONS } from "@/lib/quiz";
import { platformChallenge, type RemakePlatform } from "@/lib/remake";
export function RemakeEvent({ platform, variant, location, players, onDone }: { platform: RemakePlatform; variant: number; location: string; players: { name: string }[]; onDone: (success: boolean) => void }) {
  const [answer, setAnswer] = useState(""), [result, setResult] = useState<boolean | null>(null);
  const [memorize, setMemorize] = useState(true);
  const code = String(variant * 7 + platform.variant * 1000).padStart(4 + platform.variant % 3, "0");
  const complete = (success: boolean) => { setResult(success); onDone(success); };
  const click = CLICK_GAMES[variant % CLICK_GAMES.length];
  const question = QUIZ_QUESTIONS[variant % QUIZ_QUESTIONS.length];
  return <><span className="text-[9px] text-secondary">{platform.series === "afterlife" ? "👻 AFTERLIFE REMAKE EVENT 4D" : platform.series === "party" ? "🪩 PARTY REMAKE EVENT 4D" : "★ ANNIVERSARY EVENT"}</span><h2 className="text-primary text-sm">{platform.emoji} {platform.name}</h2>
    {platform.kind === "click" && click ? <ClickPlatformGame game={click} players={players} onDone={() => complete(true)} />
      : platform.kind === "quiz" && question ? <QuizGame question={question} playerName={players[0]?.name ?? "Spieler"} onDone={() => complete(true)} />
      : platform.kind === "memory" ? result !== null ? <p>{result ? "✓ Code geknackt!" : `Code verpasst! Richtig: ${code}`}</p> : memorize ? <><p className="text-3xl text-accent">{code}</p><Button onClick={() => setMemorize(false)}>GEMERKT</Button></> : <><input aria-label="Portalcode" inputMode="numeric" value={answer} onChange={e => setAnswer(e.target.value)} className="bg-input border border-border p-3 text-center" /><Button onClick={() => complete(answer === code)}>PRÜFEN</Button></>
      : ["duel", "acting", "creative"].includes(platform.kind) ? <><p>{platformChallenge(platform, variant, location)}</p>{result === null && <Button onClick={() => complete(true)}>CHALLENGE ERLEDIGT</Button>}</>
      : <><p>{platformChallenge(platform, variant, location)}</p><p className="text-accent">{platform.kind === "coins" ? `+${platform.value} Münzen` : platform.kind === "shield" ? "Ein Schutzschild" : `${platform.value > 0 ? "+" : ""}${platform.value} Schritte`}</p>{result === null && <Button onClick={() => complete(true)}>EVENT ABSCHLIESSEN</Button>}</>}
  </>;
}