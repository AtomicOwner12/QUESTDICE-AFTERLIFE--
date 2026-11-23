import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isQuizAnswerCorrect, type QuizQuestion } from "@/lib/quiz";

const ANSWER_STYLES = ["bg-tile-bad text-destructive-foreground", "bg-tile-task text-primary-foreground", "bg-primary text-primary-foreground"];
const SYMBOLS = ["▲", "◆", "●"];

export function QuizGame({ question, playerName, onDone }: { question: QuizQuestion; playerName: string; onDone: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = selected !== null && isQuizAnswerCorrect(question, selected);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-tile-quiz">? QUIZ-FRAGEN</h2>
      <p className="text-muted-foreground text-[10px]">{playerName}</p>
      <p className="text-primary text-sm leading-7 break-words">{question.question}</p>
      <div className="grid gap-3">
        {question.answers.map((answer, index) => (
          <Button key={index} variant="ghost" disabled={selected !== null}
            className={`tap-btn h-auto min-h-16 w-full justify-start border-2 border-foreground whitespace-normal text-left text-xs leading-6 px-4 py-3 ${ANSWER_STYLES[index]} ${selected === index ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
            onClick={() => { if (selected !== null) return; setSelected(index); onDone(); }}>
            <span aria-hidden="true" className="text-xl shrink-0">{SYMBOLS[index]}</span>
            <span className="min-w-0 break-words">{answer}</span>
          </Button>
        ))}
      </div>
      {selected !== null && <div role="status" className="flex flex-col gap-2">
        <p className={correct ? "text-tile-mini" : "text-destructive"}>{correct ? "✓ RICHTIG!" : "✕ LEIDER FALSCH!"}</p>
        <p>Richtige Antwort: {question.answers[question.correctIndex]}</p>
      </div>}
    </div>
  );
}