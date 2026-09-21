import { describe, expect, it } from "vitest";
import { analyzeDesign } from "@/lib/game/diagnostics";
import { evaluateDesign } from "@/lib/game/engine";
import type { PlacedItem } from "@/lib/game/types";

const item = (id: string, type: PlacedItem["type"], width = 1, height = 1): PlacedItem => ({ id, type, x: 0, y: 0, width, height });

describe("grounded design diagnostics", () => {
  it("asks about missing energy without questioning an already-met open-area target", () => {
    const items = [item("education", "education", 2, 3), item("sports", "sports", 2, 2)];
    const base = evaluateDesign(items);
    const evaluation = {
      ...base,
      areas: { ...base.areas, openPercent: 76, greenPercent: 12 },
      scores: { ...base.scores, water: 70 },
    };
    const result = analyzeDesign(items, evaluation, "heavyRain");

    expect(result.findings.some((finding) => finding.detail.includes("hiç enerji üretmiyor"))).toBe(true);
    expect(result.questions[0]).toBe("Okulun enerji üretmesi için hangi bileşeni ekleyebilirsin?");
    expect(result.questions[1]).toContain("açık alan");
    expect(result.questions[1]).toContain("65%");
    expect(result.questions.some((question) => question.includes("nasıl sağladın"))).toBe(false);
  });
});
