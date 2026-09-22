import { describe, expect, it } from "vitest";
import { CHALLENGES } from "@/lib/game/challenges";
import { criteriaBeforeEvent, evaluateChallengeBalance } from "@/lib/game/balance";
import { evaluateDesign } from "@/lib/game/engine";
import { EVENTS } from "@/lib/game/events";
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
      ...Array.from({ length: 5 }, (_, index) => item(`shade-${index}`, "shade")),
      item("water-1", "rainwater"), item("water-2", "rainwater"), item("solar-1", "solar"), item("solar-2", "solar"),
    ];
    expect(evaluateChallengeBalance(items, evaluateDesign(items), "heat").status).toBe("balanced");
  });

  it("returns the value before the event only for criteria the event lowered", () => {
    const designs: PlacedItem[][] = [
      [item("education", "education", 2, 3), item("sports", "sports", 2, 2)],
      [item("education", "education", 2, 3), item("sports", "sports", 2, 2), item("water-1", "rainwater"), item("water-2", "rainwater"), item("water-3", "rainwater"), item("shade-1", "shade"), item("solar-1", "solar"), item("solar-2", "solar"), item("bike-1", "bike"), item("path-1", "path"), item("green-1", "green")],
    ];
    let found = 0;
    for (const items of designs) {
      const normal = evaluateDesign(items);
      for (const challenge of CHALLENGES) {
        for (const event of EVENTS) {
          const shocked = evaluateDesign(items, event.id);
          const drops = criteriaBeforeEvent(items, challenge.id, event.id, normal, shocked);
          const criteria = evaluateChallengeBalance(items, shocked, challenge.id, event.id).criteria;
          for (const [id, before] of Object.entries(drops)) {
            found += 1;
            const now = criteria.find((criterion) => criterion.id === id);
            expect(now, `${challenge.id}/${event.id}/${id}`).toBeDefined();
            expect(before, `${challenge.id}/${event.id}/${id}`).toBeGreaterThan(now!.value);
          }
          expect(drops.budget).toBeUndefined();
        }
      }
    }
    expect(found).toBeGreaterThan(20);
  });

  it("shows the ratio drop even when the ratio stays above its target", () => {
    const items = [item("education", "education", 2, 3), item("sports", "sports", 2, 2), item("water-1", "rainwater"), item("water-2", "rainwater"), item("water-3", "rainwater")];
    const drops = criteriaBeforeEvent(items, "heavyRain", "heavyRain", evaluateDesign(items), evaluateDesign(items, "heavyRain"));
    expect(drops.rain).toBe(120);
    expect(evaluateChallengeBalance(items, evaluateDesign(items, "heavyRain"), "heavyRain", "heavyRain").criteria.find((criterion) => criterion.id === "rain")?.value).toBe(80);
  });

  it("gives the 2040 condition row its value before the event", () => {
    const items = [item("education", "education", 2, 3), item("sports", "sports", 2, 2), item("water-1", "rainwater"), item("water-2", "rainwater"), item("water-3", "rainwater")];
    const shocked = evaluateDesign(items, "heavyRain");
    const criteria = evaluateChallengeBalance(items, shocked, "drought", "heavyRain").criteria;
    expect(criteria.find((criterion) => criterion.kind === "event")?.id).toBe("rain");
    expect(criteriaBeforeEvent(items, "drought", "heavyRain", evaluateDesign(items), shocked).rain).toBe(120);
  });
});
