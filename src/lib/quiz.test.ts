import { describe, expect, it } from "vitest";
import { buildBoard, QUIZ_COUNT } from "./game";
import { QUIZ_QUESTIONS, isQuizAnswerCorrect } from "./quiz";

describe("quiz rules", () => {
  it("adds exactly five quiz tiles without replacing other platform counts", () => {
    expect(QUIZ_COUNT).toBe(5);
    for (const seed of [1, 7, 99]) {
      const board = buildBoard(seed);
      expect(board.filter(t => t === "quiz")).toHaveLength(5);
      expect(board.filter(t => t === "special")).toHaveLength(50);
      expect(board.filter(t => t === "death")).toHaveLength(15);
      expect(board.filter(t => t === "click")).toHaveLength(15);
    }
  });
  it("offers over fifty unique questions", () => {
    expect(QUIZ_QUESTIONS.length).toBeGreaterThan(50);
    expect(new Set(QUIZ_QUESTIONS.map(q => q.question)).size).toBe(QUIZ_QUESTIONS.length);
  });
  it("offers exactly three answers with exactly one correct choice per question", () => {
    for (const question of QUIZ_QUESTIONS) {
      expect(question.answers).toHaveLength(3);
      expect(new Set(question.answers).size).toBe(3);
      expect(question.answers.map((_, i) => isQuizAnswerCorrect(question, i)).filter(Boolean)).toHaveLength(1);
      expect(isQuizAnswerCorrect(question, -1)).toBe(false);
    }
  });
});