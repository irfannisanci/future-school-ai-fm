import type { EnergyBalance, EventId, PlacedItem } from "./types";

const demandByType: Partial<Record<PlacedItem["type"], number>> = {
  education: 12,
  sports: 8,
  recycling: 2,
};

function count(items: PlacedItem[], type: PlacedItem["type"]): number {
  return items.filter((item) => item.type === type).length;
}

function diminishingTotal(amount: number, values: number[]): number {
  return Array.from({ length: amount }, (_, index) => values[Math.min(index, values.length - 1)]).reduce((sum, value) => sum + value, 0);
}

export function getEnergyBalance(items: PlacedItem[], eventId?: EventId): EnergyBalance {
  const grossDemand = items.reduce((sum, item) => sum + (demandByType[item.type] ?? 0), 0);
  const insulationSaving = diminishingTotal(count(items, "insulation"), [4, 3, 1]);
  const daylightSaving = diminishingTotal(count(items, "daylight"), [3, 2, 1]);
  const shadeSaving = Math.min(2, count(items, "shade"));
  const savings = Math.min(Math.max(0, grossDemand - 5), insulationSaving + daylightSaving + shadeSaving);
  const netDemand = Math.max(5, grossDemand - savings);

  const solarCount = count(items, "solar");
  const fullEfficiencyPanels = Math.min(3, solarCount);
  const reducedEfficiencyPanels = Math.max(0, solarCount - fullEfficiencyPanels);
  const normalSolarProduction = fullEfficiencyPanels * 5 + reducedEfficiencyPanels * 2;
  const batterySupport = count(items, "battery") * 3;
  const renewableProduction = eventId === "energyLimit"
    ? Math.min(normalSolarProduction, Math.round(normalSolarProduction * 0.7) + batterySupport)
    : normalSolarProduction;
  const coveragePercent = netDemand === 0 ? 0 : Math.round(renewableProduction / netDemand * 100);

  return {
    grossDemand,
    savings,
    netDemand,
    renewableProduction,
    coveragePercent,
    solarCount,
    reducedEfficiencyPanels,
    gridEnergyNeeded: Math.max(0, netDemand - renewableProduction),
  };
}
