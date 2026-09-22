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
    expect(result.questions.some((question) => question.includes("nasıl sağladın"))).toBe(false);
  });

  it("asks two simple theme questions and one question about the team's own design", () => {
    const items = [item("education", "education", 2, 3), item("sports", "sports", 2, 2)];
    const result = analyzeDesign(items, evaluateDesign(items), "energy");

    expect(result.questions).toEqual([
      "Okulda enerji tasarrufu için neler yapılabilir?",
      "Tasarımında “Enerji karşılama” hedefin altında kaldı. Bunu artırmak için ne ekleyebilirsin?",
      "Güneş panelleri okulun ne işine yarar?",
    ]);
    for (const question of result.questions) expect(question).not.toMatch(/\d/);
  });

  it("asks about the best decision when every balance condition is met", () => {
    const items = [item("education", "education", 2, 3), item("sports", "sports", 2, 2), ...Array.from({ length: 5 }, (_, index) => item(`shade-${index}`, "shade")), item("water-1", "rainwater"), item("water-2", "rainwater"), item("solar-1", "solar"), item("solar-2", "solar")];
    const result = analyzeDesign(items, evaluateDesign(items), "heat");
    expect(result.balance.status).toBe("balanced");
    expect(result.questions[1]).toBe("Tasarımında en çok işe yarayan bileşen sence hangisi? Neden?");
  });
});
