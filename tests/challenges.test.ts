import { describe, expect, it } from "vitest";
import { getChallengeRatio } from "@/lib/game/challenges";
import type { PlacedItem } from "@/lib/game/types";

const item = (id: string, type: PlacedItem["type"], width: number, height: number): PlacedItem => ({ id, type, x: 0, y: 0, width, height });

describe("challenge ratios", () => {
  it("uses supportive cells as numerator and all used cells as denominator", () => {
    const ratio = getChallengeRatio([item("a", "education", 2, 3), item("b", "green", 2, 2), item("c", "shade", 1, 1)], "heat");
    expect(ratio.numerator).toBe(5);
    expect(ratio.denominator).toBe(11);
  });

  it("uses produced energy over net demand for the energy challenge", () => {
    const ratio = getChallengeRatio([
      item("a", "education", 2, 3), item("b", "sports", 2, 2),
      item("c", "solar", 1, 1), item("d", "solar", 1, 1), item("e", "solar", 1, 1),
      item("f", "insulation", 1, 1),
    ], "energy");
    expect(ratio.numerator).toBe(15);
    expect(ratio.denominator).toBe(16);
    expect(ratio.numeratorLabel).toContain("enerji");
  });

  it("does not count building upgrades as campus land in area ratios", () => {
    const ratio = getChallengeRatio([item("a", "education", 2, 3), item("b", "green", 1, 1), item("c", "insulation", 1, 1)], "heat");
    expect(ratio.numerator).toBe(1);
    expect(ratio.denominator).toBe(7);
  });
});
