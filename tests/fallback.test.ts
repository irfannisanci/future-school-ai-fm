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

  it("asks about energy balance and side effects for the energy challenge", () => {
    const questions = fallbackQuestions(evaluateDesign([]), "7", undefined, "energy");
    expect(questions).toHaveLength(3);
    expect(questions.some((question) => question.includes("Yeşil alan"))).toBe(true);
    expect(questions.some((question) => question.includes("Enerji karşılama"))).toBe(true);
  });
});
