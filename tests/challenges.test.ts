import { describe, expect, it } from "vitest";
import { getChallengeRatio } from "@/lib/game/challenges";
import type { PlacedItem } from "@/lib/game/types";

const item = (id: string, type: PlacedItem["type"], width = 1, height = 1): PlacedItem => ({ id, type, x: 0, y: 0, width, height });
const base = [item("a", "education", 2, 3), item("b", "sports", 2, 2)];

describe("challenge ratios", () => {
  it("uses cooling sources over heated surfaces for the heat challenge", () => {
    const ratio = getChallengeRatio([...base, item("c", "shade"), item("d", "shade"), item("e", "green"), item("f", "solar")], "heat");
    expect(ratio.numerator).toBe(3 + 3 + 2);
    expect(ratio.denominator).toBe(12 + 8 + 1);
    expect(ratio.denominatorLabel).toContain("ısınan");
  });

  it("uses solar and wind production over net demand for the energy challenge", () => {
    const ratio = getChallengeRatio([...base, item("c", "solar"), item("d", "solar"), item("e", "solar"), item("f", "wind"), item("g", "insulation")], "energy");
    expect(ratio.numerator).toBe(15 + 6);
    expect(ratio.denominator).toBe(16);
    expect(ratio.numeratorLabel).toContain("enerji");
  });

  it("subtracts building upgrades that save, and adds those that consume", () => {
    const ratio = getChallengeRatio([...base, item("c", "greywater"), item("d", "daylight")], "energy");
    expect(ratio.denominator).toBe(12 + 8 + 1 - 3);
  });
});
