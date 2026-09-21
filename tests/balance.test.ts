import { describe, expect, it } from "vitest";
import { CHALLENGES } from "@/lib/game/challenges";
import { evaluateChallengeBalance } from "@/lib/game/balance";
import { evaluateDesign } from "@/lib/game/engine";
import type { PlacedItem } from "@/lib/game/types";

const item = (id: string, type: PlacedItem["type"], width = 1, height = 1): PlacedItem => ({ id, type, x: 0, y: 0, width, height });

describe("challenge balance models", () => {
  it("defines one main goal, two guardrails and a budget rule for every challenge", () => {
    const evaluation = evaluateDesign([]);
    for (const challenge of CHALLENGES) {
      const balance = evaluateChallengeBalance([], evaluation, challenge.id);
      expect(balance.criteria.filter((criterion) => criterion.kind === "main")).toHaveLength(1);
      expect(balance.criteria.filter((criterion) => criterion.kind === "guardrail")).toHaveLength(2);
      expect(balance.criteria.filter((criterion) => criterion.kind === "budget")).toHaveLength(1);
    }
  });

  it("reports side effects when the energy goal is met without its guardrails", () => {
    const items = [
      item("education", "education", 2, 3), item("sports", "sports", 2, 2),
      item("solar-1", "solar"), item("solar-2", "solar"), item("solar-3", "solar"),
    ];
    const balance = evaluateChallengeBalance(items, evaluateDesign(items), "energy");
    expect(balance.criteria.find((criterion) => criterion.kind === "main")?.met).toBe(true);
    expect(balance.status).toBe("side_effects");
  });

  it("recognizes a balanced heat solution", () => {
    const items = [
      item("education", "education", 2, 3), item("sports", "sports", 2, 2),
      ...Array.from({ length: 6 }, (_, index) => item(`shade-${index}`, "shade")),
      item("water-1", "rainwater"), item("water-2", "rainwater"),
    ];
    expect(evaluateChallengeBalance(items, evaluateDesign(items), "heat").status).toBe("balanced");
  });
});
