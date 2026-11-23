import { STORY_CREDITS, CREDITS_INSPIRATION } from "@/lib/story";
import { Button } from "./ui/button";
import { beep } from "@/lib/music";

/** Rolling end credits after the final boss. The roll can be skipped; it ends with a button back to the game. */
export function StoryCredits({ onDone }: { onDone: () => void }) {
  return <div className="story-credits hub-card" role="region" aria-label="Abspann">
    <div className="credits-window">
      <div className="credits-roll">
        <p className="credits-kicker">🏆 DU HAST QUESTDICE DURCHGESPIELT!</p>
        <h3 className="credits-title">QUESTDICE</h3>
        <p className="credits-sub">Die neun Würfelwelten</p>
        {STORY_CREDITS.map((s) => <section key={s.title} className="credits-section">
          <small>{s.title}</small>
          {s.names.map((n) => <b key={n}>{n}</b>)}
        </section>)}
        <section className="credits-section"><small>INSPIRATION</small><p>{CREDITS_INSPIRATION}</p></section>
        <p className="credits-end">DANKE FÜRS SPIELEN! 🎲</p>
      </div>
    </div>
    <Button variant="arcade" onClick={() => { beep(); onDone(); }}>✓ WEITER</Button>
  </div>;
}
