export const GRID_SIZE = 10;
export const CELL_AREA_M2 = 100;
export const BUDGET_LIMIT = 100;

export type GradeBand = "5" | "6" | "7" | "8";
export type ScoreKey = "climate" | "water" | "energy" | "health" | "circularity";
export type ComponentType =
  | "education"
  | "sports"
  | "green"
  | "solar"
  | "rainwater"
  | "recycling"
  | "bike"
  | "shade"
  | "garden"
  | "outdoorClass";

export type EventId = "heatwave" | "drought" | "heavyRain" | "energyLimit" | "activeTransport";

export type Contributions = Record<ScoreKey, number>;

export type ComponentDefinition = {
  type: ComponentType;
  label: string;
  shortLabel: string;
  width: number;
  height: number;
  cost: number;
  color: string;
  contributions: Contributions;
};

export type PlacedItem = {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated?: boolean;
};

export type ScoreSet = Record<ScoreKey, number> & { total: number };

export type AreaMetrics = {
  usedCells: number;
  usedM2: number;
  usedPercent: number;
  greenCells: number;
  greenPercent: number;
  builtCells: number;
  builtPercent: number;
  openCells: number;
  openPercent: number;
};

export type DesignEvaluation = {
  budgetUsed: number;
  budgetRemaining: number;
  areas: AreaMetrics;
  scores: ScoreSet;
  errors: string[];
  isValid: boolean;
};

export type DesignSnapshot = {
  placedItems: PlacedItem[];
  evaluation: DesignEvaluation;
  createdAt: string;
};

export type SessionState = {
  teamAlias: string;
  memberAliases?: string[];
  gradeBand: GradeBand;
  step: number;
  items: PlacedItem[];
  initialDesign?: DesignSnapshot;
  eventId?: EventId;
  advisorQuestions: string[];
  advisorResponses: string[];
  reflection: string;
};
