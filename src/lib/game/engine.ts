import { BUILT_TYPES, COMPONENTS, GREEN_TYPES } from "./catalog";
import { BUDGET_LIMIT, CELL_AREA_M2, GRID_SIZE, type DesignEvaluation, type DesignSnapshot, type EventId, type PlacedItem, type ScoreKey, type ScoreSet } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const count = (items: PlacedItem[], type: PlacedItem["type"]) => items.filter((item) => item.type === type).length;
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

function eventAdjustments(items: PlacedItem[], eventId?: EventId): Partial<Record<ScoreKey, number>> {
  if (!eventId) return {};
  const green = count(items, "green");
  const shade = count(items, "shade");
  const rain = count(items, "rainwater");
  const solar = count(items, "solar");
  const bike = count(items, "bike");

  switch (eventId) {
    case "heatwave": return { climate: green * 4 + shade * 8 - (green + shade < 4 ? 15 : 0) };
    case "drought": return { water: rain * 10 + green * 2 - (rain === 0 ? 20 : 0) };
    case "heavyRain": return { water: rain * 12 + green * 3 - (rain < 2 ? 15 : 0) };
    case "energyLimit": return { energy: solar * 8 - (solar < 2 ? 20 : 0) };
    case "activeTransport": return { health: bike * 10 - (bike === 0 ? 20 : 0) };
  }
}

export function evaluateDesign(items: PlacedItem[], eventId?: EventId): DesignEvaluation {
  const usedCells = items.reduce((sum, item) => sum + cells(item), 0);
  const greenCells = items.filter((item) => GREEN_TYPES.includes(item.type)).reduce((sum, item) => sum + cells(item), 0);
  const builtCells = items.filter((item) => BUILT_TYPES.includes(item.type)).reduce((sum, item) => sum + cells(item), 0);
  const budgetUsed = items.reduce((sum, item) => sum + COMPONENTS[item.type].cost, 0);
  const raw: Record<ScoreKey, number> = { climate: 0, water: 0, energy: 0, health: 0, circularity: 0 };

  items.forEach((item) => {
    const contribution = COMPONENTS[item.type].contributions;
    (Object.keys(raw) as ScoreKey[]).forEach((key) => { raw[key] += contribution[key]; });
  });

  raw.climate += Math.max(0, 100 - usedCells) * 0.12;
  const adjustment = eventAdjustments(items, eventId);
  (Object.keys(raw) as ScoreKey[]).forEach((key) => { raw[key] += adjustment[key] ?? 0; });

  const scores = {
    climate: clamp(raw.climate),
    water: clamp(raw.water),
    energy: clamp(raw.energy),
    health: clamp(raw.health),
    circularity: clamp(raw.circularity),
    total: 0
  } satisfies ScoreSet;
  scores.total = Math.round(scores.climate * 0.25 + scores.water * 0.2 + scores.energy * 0.2 + scores.health * 0.2 + scores.circularity * 0.15);

  const errors: string[] = [];
  if (!items.some((item) => item.type === "education")) errors.push("En az bir eğitim binası eklemelisin.");
  if (!items.some((item) => item.type === "sports")) errors.push("En az bir spor salonu eklemelisin.");
  if (budgetUsed > BUDGET_LIMIT) errors.push("Bütçe sınırı aşıldı.");
  if (items.some((item) => !isInBounds(item))) errors.push("Grid dışında bileşen var.");
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
      openCells: GRID_SIZE * GRID_SIZE - usedCells,
      openPercent: GRID_SIZE * GRID_SIZE - usedCells
    },
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
