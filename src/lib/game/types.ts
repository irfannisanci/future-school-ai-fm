export const GRID_SIZE = 10;
export const CELL_AREA_M2 = 100;
export const BUDGET_LIMIT = 100;

export type GradeBand = "5" | "6" | "7" | "8";
export type ScoreKey = "climate" | "water" | "energy" | "health" | "circularity";
export type ChallengeId = "heat" | "drought" | "heavyRain" | "energy" | "activeTransport" | "healthyLiving" | "carbon";
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
  | "outdoorClass"
  | "insulation"
  | "daylight"
  | "battery";

export type EventId = "heatwave" | "drought" | "heavyRain" | "energyLimit" | "activeTransport" | "healthyLiving" | "carbonLimit";

export type Contributions = Record<ScoreKey, number>;

export type ComponentDefinition = {
  type: ComponentType;
  label: string;
  shortLabel: string;
  width: number;
  height: number;
  cost: number;
  color: string;
  landUse: "building" | "open" | "infrastructure" | "upgrade";
  required?: boolean;
  contributions: Contributions;
  helps: ChallengeId[];
  effects: string[];
  risks: string[];
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
  infrastructureCells: number;
  infrastructurePercent: number;
  openCells: number;
  openPercent: number;
};

export type EnergyBalance = {
  grossDemand: number;
  savings: number;
  netDemand: number;
  renewableProduction: number;
  coveragePercent: number;
  solarCount: number;
  reducedEfficiencyPanels: number;
  gridEnergyNeeded: number;
};

export type ChallengeCriterion = {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: "%" | "puan";
  direction: "atLeast" | "atMost";
  kind: "main" | "guardrail" | "budget";
  met: boolean;
  progress: number;
};

export type ChallengeBalance = {
  challengeId: ChallengeId;
  status: "balanced" | "side_effects" | "not_yet";
  title: string;
  question: string;
  criteria: ChallengeCriterion[];
};

export type DesignEvaluation = {
  budgetUsed: number;
  budgetRemaining: number;
  areas: AreaMetrics;
  energyBalance: EnergyBalance;
  scores: ScoreSet;
  errors: string[];
  isValid: boolean;
};

export type DesignSnapshot = {
  placedItems: PlacedItem[];
  evaluation: DesignEvaluation;
  createdAt: string;
};

export type MathResult = {
  matchesDesign: boolean;
  simplifiedNumerator: number;
  simplifiedDenominator: number;
  decimal: number;
  percentage: number;
  explanation: string;
  hint: string;
};

export type AiRubric = {
  goalFit: number;
  tradeoffAwareness: number;
  evidenceUse: number;
  coherence: number;
};

export type AiAssessment = {
  problemResolution: "solved" | "partly_solved" | "not_yet";
  confidence: "low" | "medium" | "high";
  aiScore: number;
  rubric: AiRubric;
  summary: string;
  strengths: string[];
  risks: string[];
  evidence: string[];
};

export type DesignFinding = {
  id: string;
  tone: "strength" | "gap";
  title: string;
  detail: string;
  question: string;
};

export type SessionState = {
  teamAlias: string;
  gradeBand: GradeBand;
  step: number;
  challengeId?: ChallengeId;
  designIntent: string;
  items: PlacedItem[];
  initialDesign?: DesignSnapshot;
  eventId?: EventId;
  mathNumerator: string;
  mathDenominator: string;
  mathResult?: MathResult;
  initialAssessment?: AiAssessment;
  finalAssessment?: AiAssessment;
  initialFindings?: DesignFinding[];
  finalFindings?: DesignFinding[];
  advisorQuestions: string[];
  advisorResponses: string[];
  reflection: string;
};
