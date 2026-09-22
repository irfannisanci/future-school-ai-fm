import { describe, expect, it } from "vitest";
import { COMPONENTS, COMPONENT_LIST } from "@/lib/game/catalog";
import { evaluateDesign } from "@/lib/game/engine";
import { EVENTS, getEventImpact } from "@/lib/game/events";
import type { ComponentType, PlacedItem, ScoreKey } from "@/lib/game/types";

const item = (id: string, type: ComponentType): PlacedItem => ({ id, type, x: 0, y: 0, width: COMPONENTS[type].width, height: COMPONENTS[type].height });
const base = [item("education", "education"), item("sports", "sports")];
const scoreKeys: ScoreKey[] = ["climate", "water", "energy", "health", "circularity"];

function seededDesigns(amount: number): PlacedItem[][] {
  let seed = 2040;
  const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  return Array.from({ length: amount }, (_, design) => [
    ...base,
    ...Array.from({ length: Math.floor(random() * 25) }, (_, index) => item(`${design}-${index}`, COMPONENT_LIST[Math.floor(random() * COMPONENT_LIST.length)].type)),
  ]);
}

describe("event stress model", () => {
  it("never raises any indicator above its no-event value", () => {
    for (const design of seededDesigns(200)) {
      const normal = evaluateDesign(design).scores;
      for (const event of EVENTS) {
        const shocked = evaluateDesign(design, event.id).scores;
        for (const key of [...scoreKeys, "total" as const]) expect(shocked[key], `${event.id}/${key}`).toBeLessThanOrEqual(normal[key]);
      }
    }
  });

  it("only changes the focus indicator of the event", () => {
    for (const design of seededDesigns(50)) {
      const normal = evaluateDesign(design).scores;
      for (const event of EVENTS) {
        const shocked = evaluateDesign(design, event.id).scores;
        for (const key of scoreKeys.filter((scoreKey) => scoreKey !== event.focus)) expect(shocked[key]).toBe(normal[key]);
      }
    }
  });

  it("passes the full shock to an unprepared design and none to a fully prepared one", () => {
    for (const event of EVENTS.filter((card) => card.shock > 0)) {
      const unprepared = getEventImpact(base, event.id);
      expect(unprepared).toMatchObject({ shock: event.shock, absorbed: 0, loss: event.shock, absorbers: [] });

      const [type, perItem] = Object.entries(event.absorb)[0] as [ComponentType, number];
      const prepared = [...base, ...Array.from({ length: Math.ceil(event.shock / perItem) }, (_, index) => item(`${type}-${index}`, type))];
      const impact = getEventImpact(prepared, event.id);
      expect(impact.loss).toBe(0);
      expect(impact.absorbed).toBe(event.shock);
      expect(evaluateDesign(prepared, event.id).scores[event.focus]).toBe(evaluateDesign(prepared).scores[event.focus]);
    }
  });

  it("subtracts the remaining loss from the clamped focus score", () => {
    const design = [...base, ...Array.from({ length: 3 }, (_, index) => item(`shade-${index}`, "shade"))];
    const impact = getEventImpact(design, "heatwave");
    expect(impact).toMatchObject({ shock: 30, absorbed: 15, loss: 15 });
    expect(evaluateDesign(design, "heatwave").scores.climate).toBe(evaluateDesign(design).scores.climate - 15);
  });

  it("keeps the energy limit inside the energy balance model", () => {
    const design = [...base, ...Array.from({ length: 3 }, (_, index) => item(`solar-${index}`, "solar"))];
    expect(getEventImpact(design, "energyLimit").loss).toBe(0);
    expect(evaluateDesign(design, "energyLimit").energyBalance.renewableProduction).toBe(11);
    expect(evaluateDesign([...design, item("battery", "battery")], "energyLimit").energyBalance.renewableProduction).toBe(14);
  });
});
