import { BUILT_TYPES, COMPONENTS, GREEN_TYPES, footprintCells } from "./catalog";
import { getEnergyBalance } from "./energy";
import { getEvent, getEventImpact } from "./events";
import { BUDGET_LIMIT, CELL_AREA_M2, GRID_SIZE, type DesignEvaluation, type DesignSnapshot, type EventId, type PlacedItem, type ScoreKey, type ScoreSet } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const cells = (item: PlacedItem) => item.width * item.height;

export function overlaps(a: PlacedItem, b: PlacedItem): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function isInBounds(item: PlacedItem): boolean {
  return item.x >= 0 && item.y >= 0 && item.x + item.width <= GRID_SIZE && item.y + item.height <= GRID_SIZE;
}

export function canPlace(items: PlacedItem[], candidate: PlacedItem, ignoreId?: string): boolean {
  return isInBounds(candidate) && !items.some((item) => item.id !== ignoreId && overlaps(item, candidate));
}

export function evaluateDesign(items: PlacedItem[], eventId?: EventId): DesignEvaluation {
  const usedCells = items.reduce((sum, item) => sum + footprintCells(item), 0);
  const greenCells = items.filter((item) => GREEN_TYPES.includes(item.type)).reduce((sum, item) => sum + cells(item), 0);
  const builtCells = items.filter((item) => BUILT_TYPES.includes(item.type)).reduce((sum, item) => sum + cells(item), 0);
  const infrastructureCells = items.filter((item) => COMPONENTS[item.type].landUse === "infrastructure").reduce((sum, item) => sum + cells(item), 0);
  const openCells = GRID_SIZE * GRID_SIZE - builtCells - infrastructureCells;
  const budgetUsed = items.reduce((sum, item) => sum + COMPONENTS[item.type].cost, 0);
  const energyBalance = getEnergyBalance(items, eventId);
  const raw: Record<ScoreKey, number> = { climate: 0, water: 0, energy: 0, health: 0, circularity: 0 };

  items.forEach((item) => {
    const contribution = COMPONENTS[item.type].contributions;
    (Object.keys(raw) as ScoreKey[]).forEach((key) => { raw[key] += contribution[key]; });
  });

  raw.climate += Math.max(0, openCells) * 0.12;
  raw.energy = energyBalance.coveragePercent;

  const scores = {
    climate: clamp(raw.climate),
    water: clamp(raw.water),
    energy: clamp(raw.energy),
    health: clamp(raw.health),
    circularity: clamp(raw.circularity),
    total: 0
  } satisfies ScoreSet;
  const event = getEvent(eventId);
  if (event) scores[event.focus] = clamp(scores[event.focus] - getEventImpact(items, eventId).loss);
  scores.total = Math.round(scores.climate * 0.25 + scores.water * 0.2 + scores.energy * 0.2 + scores.health * 0.2 + scores.circularity * 0.15);

  const errors: string[] = [];
  if (!items.some((item) => item.type === "education")) errors.push("En az bir eğitim binası eklemelisin.");
  if (!items.some((item) => item.type === "sports")) errors.push("En az bir spor salonu eklemelisin.");
  if (budgetUsed > BUDGET_LIMIT) errors.push("Bütçe sınırı aşıldı.");
  if (items.some((item) => !isInBounds(item))) errors.push("Kampüs alanının dışına taşan bir bileşen var.");
  if (items.some((item, index) => items.slice(index + 1).some((other) => overlaps(item, other)))) errors.push("Bileşenler üst üste geliyor.");

  return {
    budgetUsed,
    budgetRemaining: BUDGET_LIMIT - budgetUsed,
    areas: {
      usedCells,
      usedM2: usedCells * CELL_AREA_M2,
      usedPercent: usedCells,
      greenCells,
      greenPercent: greenCells,
      builtCells,
      builtPercent: builtCells,
      infrastructureCells,
      infrastructurePercent: infrastructureCells,
      openCells,
      openPercent: openCells
    },
    energyBalance,
    scores,
    errors,
    isValid: errors.length === 0
  };
}

export function createSnapshot(items: PlacedItem[], eventId?: EventId): DesignSnapshot {
  return {
    placedItems: items.map((item) => ({ ...item })),
    evaluation: evaluateDesign(items, eventId),
    createdAt: new Date().toISOString()
  };
}
