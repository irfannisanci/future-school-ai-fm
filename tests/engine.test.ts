import { describe, expect, it } from "vitest";
import { canPlace, createSnapshot, evaluateDesign, overlaps } from "@/lib/game/engine";
import type { PlacedItem } from "@/lib/game/types";

const item = (id: string, type: PlacedItem["type"], x: number, y: number, width = 1, height = 1): PlacedItem => ({ id, type, x, y, width, height });

describe("rule engine", () => {
  it("rejects overlap and out-of-bounds placement", () => {
    const first = item("a", "education", 0, 0, 2, 3);
    expect(overlaps(first, item("b", "green", 1, 1))).toBe(true);
    expect(canPlace([first], item("b", "green", 2, 2))).toBe(true);
    expect(canPlace([], item("c", "green", 10, 0))).toBe(false);
  });

  it("calculates area, budget and mandatory rules", () => {
    const design = [item("a", "education", 0, 0, 2, 3), item("b", "sports", 3, 0, 2, 2), item("c", "green", 5, 0)];
    const result = evaluateDesign(design);
    expect(result.isValid).toBe(true);
    expect(result.areas.usedM2).toBe(1100);
    expect(result.areas.usedPercent).toBe(11);
    expect(result.budgetUsed).toBe(32);
  });

  it("applies deterministic event modifiers", () => {
    const design = [item("a", "education", 0, 0, 2, 3), item("b", "sports", 3, 0, 2, 2), item("c", "solar", 5, 0)];
    expect(evaluateDesign(design, "energyLimit").scores.energy).not.toBe(evaluateDesign(design).scores.energy);
  });

  it("creates an immutable snapshot", () => {
    const design = [item("a", "education", 0, 0, 2, 3), item("b", "sports", 3, 0, 2, 2)];
    const snapshot = createSnapshot(design);
    design[0].x = 8;
    expect(snapshot.placedItems[0].x).toBe(0);
  });
});
