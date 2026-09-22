import { describe, expect, it } from "vitest";
import { COMPONENTS, COMPONENT_LIST } from "@/lib/game/catalog";
import { evaluateChallengeBalance } from "@/lib/game/balance";
import { CHALLENGES } from "@/lib/game/challenges";
import { getEnergyBalance } from "@/lib/game/energy";
import { evaluateDesign } from "@/lib/game/engine";
import { EVENTS } from "@/lib/game/events";
import { CHALLENGE_RESOURCE, EVENT_RESOURCE, RESOURCES, componentEffects, getResourceBalance } from "@/lib/game/resources";
import type { ChallengeId, ComponentType, PlacedItem, ResourceId } from "@/lib/game/types";

// Eğitim binası ve spor salonu üst sırada; diğer bileşenler 4. satırdan itibaren çakışmadan dizilir.
function layout(spec: Array<[ComponentType, number]>): PlacedItem[] {
  const items: PlacedItem[] = [{ id: "education", type: "education", x: 0, y: 0, width: 2, height: 3 }, { id: "sports", type: "sports", x: 2, y: 0, width: 2, height: 2 }];
  let index = 0;
  for (const [type, amount] of spec) {
    for (let copy = 0; copy < amount; copy++, index++) items.push({ id: `${type}-${copy}`, type, x: index % 10, y: 3 + Math.floor(index / 10), width: COMPONENTS[type].width, height: COMPONENTS[type].height });
  }
  return items;
}

const REFERENCE: Record<ChallengeId, { balanced: Array<[ComponentType, number]>; mainOnly: Array<[ComponentType, number]> }> = {
  heat: { balanced: [["shade", 5], ["rainwater", 2], ["solar", 2]], mainOnly: [["shade", 5]] },
  drought: { balanced: [["rainwater", 3], ["greywater", 1], ["shade", 6], ["green", 6]], mainOnly: [["rainwater", 3]] },
  heavyRain: { balanced: [["rainwater", 2], ["green", 12]], mainOnly: [["rainwater", 2]] },
  energy: { balanced: [["solar", 3], ["green", 15]], mainOnly: [["solar", 3]] },
  activeTransport: { balanced: [["bike", 5], ["path", 1], ["rainwater", 2], ["shade", 3], ["green", 3]], mainOnly: [["bike", 5], ["path", 1]] },
  healthyLiving: { balanced: [["green", 10], ["rainwater", 2], ["solar", 2]], mainOnly: [["green", 10]] },
  carbon: { balanced: [["solar", 2], ["bike", 2], ["path", 1]], mainOnly: [["bike", 7]] },
};

describe("resource balances", () => {
  it("computes a multi-source energy ratio with savings", () => {
    const balance = getResourceBalance(layout([["solar", 4], ["wind", 1], ["insulation", 1], ["daylight", 1]]), "energy");
    expect(balance.supply).toBe(3 * 5 + 2 + 6);
    expect(balance.grossDemand).toBe(12 + 8);
    expect(balance.savings).toBe(4 + 3);
    expect(balance.netDemand).toBe(13);
    expect(balance.coveragePercent).toBe(177);
    expect(balance.rows.find((row) => row.key === "supply-solar")?.calculation).toBe("3 × 5 + 2");
  });

  it("adds irrigation to the water demand of green choices", () => {
    const balance = getResourceBalance(layout([["rainwater", 4], ["greywater", 1], ["green", 3], ["garden", 2]]), "water");
    expect(balance.supply).toBe(6 + 6 + 6 + 3 + 5);
    expect(balance.netDemand).toBe(8 + 6 + 3 * 1 + 2 * 2);
    expect(balance.rows.find((row) => row.key === "supply-rainwater")?.calculation).toBe("3 × 6 + 3");
  });

  it("turns a student-count target into a percentage calculation", () => {
    const transport = getResourceBalance(layout([["bike", 6], ["path", 1]]), "transport");
    expect(transport.supply).toBe(5 * 20 + 10 + 15);
    expect(transport.netDemand).toBe(150);
    expect(transport.rows.find((row) => row.key === "demand-target")?.calculation).toBe("500 × 30 ÷ 100");
    expect(getResourceBalance(layout([]), "activity")).toMatchObject({ supply: 60, netDemand: 200, coveragePercent: 30 });
  });

  it("matches the energy balance model with and without the energy limit event", () => {
    let seed = 7;
    const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    for (let design = 0; design < 150; design++) {
      const extras = Array.from({ length: Math.floor(random() * 18) }, () => [COMPONENT_LIST[Math.floor(random() * COMPONENT_LIST.length)].type, 1] as [ComponentType, number]);
      const items = layout(extras);
      for (const eventId of [undefined, "energyLimit" as const]) {
        const energy = getEnergyBalance(items, eventId);
        const resource = getResourceBalance(items, "energy", eventId);
        expect([resource.supply, resource.netDemand, resource.coveragePercent]).toEqual([energy.renewableProduction, energy.netDemand, energy.coveragePercent]);
      }
    }
  });

  it("lets at least two different components add to every challenge's main ratio", () => {
    for (const challenge of CHALLENGES) expect(RESOURCES[CHALLENGE_RESOURCE[challenge.id]].supply.length, challenge.id).toBeGreaterThanOrEqual(2);
  });

  it("gives every optional component a real cost beyond the budget", () => {
    for (const component of COMPONENT_LIST.filter((definition) => !definition.required)) {
      const hasCost = componentEffects(component.type).some((effect) => effect.tone === "cost") || component.landUse === "infrastructure";
      expect(hasCost, component.type).toBe(true);
    }
  });

  it("can balance every challenge within the budget and the grid", () => {
    for (const challenge of CHALLENGES) {
      const items = layout(REFERENCE[challenge.id].balanced);
      const evaluation = evaluateDesign(items);
      expect(evaluation.isValid, challenge.id).toBe(true);
      expect(evaluateChallengeBalance(items, evaluation, challenge.id).status, challenge.id).toBe("balanced");
    }
  });

  it("reports side effects when only the main ratio is chased", () => {
    for (const challenge of CHALLENGES) {
      const items = layout(REFERENCE[challenge.id].mainOnly);
      const balance = evaluateChallengeBalance(items, evaluateDesign(items), challenge.id);
      expect(balance.criteria[0].met, challenge.id).toBe(true);
      expect(balance.status, challenge.id).toBe("side_effects");
    }
  });

  it("uses the student's ratio as the main goal of every challenge", () => {
    for (const challenge of CHALLENGES) {
      const items = layout(REFERENCE[challenge.id].balanced);
      const main = evaluateChallengeBalance(items, evaluateDesign(items), challenge.id).criteria[0];
      expect(main.id).toBe(CHALLENGE_RESOURCE[challenge.id]);
      expect(main.value).toBe(getResourceBalance(items, CHALLENGE_RESOURCE[challenge.id]).coveragePercent);
    }
  });
});

describe("events act on resource balances", () => {
  const resourceIds = Object.keys(RESOURCES) as ResourceId[];

  it("never raises a ratio and only touches the event's own resource", () => {
    let seed = 99;
    const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    for (let design = 0; design < 120; design++) {
      const items = layout(Array.from({ length: Math.floor(random() * 20) }, () => [COMPONENT_LIST[Math.floor(random() * COMPONENT_LIST.length)].type, 1] as [ComponentType, number]));
      for (const event of EVENTS) {
        for (const id of resourceIds) {
          const normal = getResourceBalance(items, id).coveragePercent;
          const shocked = getResourceBalance(items, id, event.id).coveragePercent;
          if (EVENT_RESOURCE[event.id] === id) expect(shocked, `${event.id}/${id}`).toBeLessThanOrEqual(normal);
          else expect(shocked, `${event.id}/${id}`).toBe(normal);
        }
      }
    }
  });

  it("applies the real-life effect written on each card", () => {
    const rainy = layout([["rainwater", 3]]);
    expect(getResourceBalance(rainy, "rain")).toMatchObject({ supply: 24, netDemand: 20, coveragePercent: 120 });
    expect(getResourceBalance(rainy, "rain", "heavyRain")).toMatchObject({ supply: 24, netDemand: 30, coveragePercent: 80 });

    const dry = layout([["rainwater", 2], ["greywater", 1]]);
    expect(getResourceBalance(dry, "water").supply).toBe(12 + 5);
    expect(getResourceBalance(dry, "water", "drought").supply).toBe(8 + 5);

    expect(getResourceBalance(layout([]), "cooling", "heatwave").netDemand).toBe(26);
    expect(getResourceBalance(layout([]), "carbon", "carbonLimit").netDemand).toBe(25);
    expect(getResourceBalance(layout([]), "transport", "activeTransport").netDemand).toBe(225);
    expect(getResourceBalance(layout([]), "activity", "healthyLiving").netDemand).toBe(250);
    expect(getResourceBalance(rainy, "rain", "heavyRain").eventNote).toContain("20 → 30");
  });
});

describe("2040 condition", () => {
  it("always tracks the event's ratio during redesign", () => {
    for (const challenge of CHALLENGES) {
      for (const event of EVENTS) {
        const items = layout(REFERENCE[challenge.id].balanced);
        const criteria = evaluateChallengeBalance(items, evaluateDesign(items, event.id), challenge.id, event.id).criteria;
        expect(criteria.filter((item) => item.id === EVENT_RESOURCE[event.id]), `${challenge.id}/${event.id}`).toHaveLength(1);
        expect(criteria.filter((item) => item.kind === "event").length).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps all 49 challenge and event combinations solvable within the budget", () => {
    const candidates = COMPONENT_LIST.filter((definition) => !definition.required).map((definition) => definition.type);
    const progress = (items: PlacedItem[], challengeId: ChallengeId, eventId: (typeof EVENTS)[number]["id"]) => {
      const evaluation = evaluateDesign(items, eventId);
      const balance = evaluateChallengeBalance(items, evaluation, challengeId, eventId);
      return { balance, evaluation, score: balance.criteria.reduce((sum, item) => sum + item.progress, 0) };
    };
    for (const challenge of CHALLENGES) {
      for (const event of EVENTS) {
        let spec = REFERENCE[challenge.id].balanced.map(([type, amount]) => [type, amount] as [ComponentType, number]);
        for (let step = 0; step < 30 && progress(layout(spec), challenge.id, event.id).balance.status !== "balanced"; step++) {
          const options = candidates.map((type) => {
            const next = spec.some(([existing]) => existing === type) ? spec.map(([existing, amount]) => [existing, existing === type ? amount + 1 : amount] as [ComponentType, number]) : [...spec, [type, 1] as [ComponentType, number]];
            const result = progress(layout(next), challenge.id, event.id);
            return { next, result };
          }).filter((option) => option.result.evaluation.budgetUsed <= 100 && option.result.evaluation.isValid);
          const best = options.sort((a, b) => b.result.score - a.result.score)[0];
          if (!best) break;
          spec = best.next;
        }
        const final = progress(layout(spec), challenge.id, event.id);
        expect(final.balance.status, `${challenge.id}/${event.id}: ${final.balance.criteria.map((item) => `${item.id}=${item.value}/${item.target}`).join(" ")}`).toBe("balanced");
        expect(final.evaluation.budgetUsed).toBeLessThanOrEqual(100);
      }
    }
  });
});
