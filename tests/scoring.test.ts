import { describe, expect, it } from "vitest";
import { COMPONENTS } from "@/lib/game/catalog";
import { CHALLENGES } from "@/lib/game/challenges";
import { evaluateDesign } from "@/lib/game/engine";
import { technicalScore } from "@/lib/game/scoring";
import type { ComponentType, PlacedItem } from "@/lib/game/types";

const item = (id: string, type: ComponentType, x = 0, y = 0): PlacedItem => ({ id, type, x, y, width: COMPONENTS[type].width, height: COMPONENTS[type].height });
const many = (type: ComponentType, amount: number) => Array.from({ length: amount }, (_, index) => item(`${type}-${index}`, type));
const base = [item("education", "education", 0, 0), item("sports", "sports", 2, 0)];
const arrange = (extras: PlacedItem[]) => [...base, ...extras.map((extra, index) => ({ ...extra, x: index % 10, y: 3 + Math.floor(index / 10) }))];

describe("technical score", () => {
  it("adds up to its breakdown and stays within 0-50", () => {
    const designs = [[], base, arrange([...many("green", 20), ...many("rainwater", 5), ...many("solar", 3)])];
    for (const design of designs) {
      for (const challenge of CHALLENGES) {
        const score = technicalScore(evaluateDesign(design), design, true, challenge.id);
        expect(score.total).toBe(score.validity + score.math + score.balance + score.indicators);
        expect(score.total).toBeGreaterThanOrEqual(0);
        expect(score.total).toBeLessThanOrEqual(50);
      }
    }
  });

  it("keeps the weakest design that can progress close to the guaranteed 20 points", () => {
    for (const challenge of CHALLENGES) {
      const score = technicalScore(evaluateDesign(base), base, true, challenge.id);
      expect(score.validity + score.math).toBe(20);
      expect(score.total, challenge.id).toBeLessThanOrEqual(26);
    }
  });

  it("rewards a balanced design well above the weakest one", () => {
    const balanced = arrange([...many("shade", 5), ...many("rainwater", 2), ...many("solar", 2)]);
    const score = technicalScore(evaluateDesign(balanced), balanced, true, "heat");
    expect(score.balance).toBe(20);
    expect(score.total).toBeGreaterThanOrEqual(42);
  });

  it("does not give guardrail points while the main goal has no progress", () => {
    const score = technicalScore(evaluateDesign(base), base, true, "drought");
    expect(score.balance).toBe(0);
  });

  it("scores a resilient design higher under the same event", () => {
    const fragile = arrange(many("rainwater", 3));
    const resilient = arrange([...many("rainwater", 3), ...many("shade", 6)]);
    const fragileScore = technicalScore(evaluateDesign(fragile, "heatwave"), fragile, true, "heat");
    const resilientScore = technicalScore(evaluateDesign(resilient, "heatwave"), resilient, true, "heat");
    expect(resilientScore.total).toBeGreaterThan(fragileScore.total);
  });
});
