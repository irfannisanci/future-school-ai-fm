import { describe, expect, it } from "vitest";
import { getEnergyBalance } from "@/lib/game/energy";
import type { PlacedItem } from "@/lib/game/types";

const item = (id: string, type: PlacedItem["type"]): PlacedItem => ({ id, type, x: 0, y: 0, width: 1, height: 1 });

describe("energy balance", () => {
  it("calculates demand, savings and renewable coverage", () => {
    const result = getEnergyBalance([
      item("a", "education"), item("b", "sports"),
      item("c", "solar"), item("d", "solar"),
      item("e", "insulation"), item("f", "daylight"), item("g", "shade"),
    ]);
    expect(result.grossDemand).toBe(20);
    expect(result.savings).toBe(8);
    expect(result.netDemand).toBe(12);
    expect(result.renewableProduction).toBe(10);
    expect(result.coveragePercent).toBe(83);
  });

  it("reduces the production benefit after the third solar panel", () => {
    const result = getEnergyBalance(Array.from({ length: 5 }, (_, index) => item(String(index), "solar")));
    expect(result.renewableProduction).toBe(19);
    expect(result.reducedEfficiencyPanels).toBe(2);
  });

  it("uses storage to protect production during an energy-limit event", () => {
    const panels = [item("a", "solar"), item("b", "solar")];
    expect(getEnergyBalance(panels, "energyLimit").renewableProduction).toBe(7);
    expect(getEnergyBalance([...panels, item("c", "battery")], "energyLimit").renewableProduction).toBe(10);
  });
});
