import { describe, expect, it } from "vitest";
import { evaluateDesign } from "@/lib/game/engine";
import { fallbackQuestions } from "@/lib/game/fallback";

describe("fallback advisor", () => {
  it("returns two or three metric-based questions", () => {
    const questions = fallbackQuestions(evaluateDesign([]), "7", "drought");
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions.length).toBeLessThanOrEqual(3);
    expect(questions.some((question) => /%|puan/.test(question))).toBe(true);
  });
});
