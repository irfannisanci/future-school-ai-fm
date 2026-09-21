import { COMPONENTS } from "@/lib/game/catalog";
import { evaluateChallengeBalance } from "@/lib/game/balance";
import { analyzeDesign } from "@/lib/game/diagnostics";
import { getChallenge } from "@/lib/game/challenges";
import {
  BUDGET_LIMIT,
  type AiAssessment,
  type AreaMetrics,
  type ChallengeId,
  type ChallengeBalance,
  type ComponentType,
  type DesignFinding,
  type EnergyBalance,
  type EventId,
  type GradeBand,
  type PlacedItem,
  type ScoreSet,
} from "@/lib/game/types";

export type AdvisorInput = {
  phase: "initial" | "redesign";
  gradeBand: GradeBand;
  challenge: { id: ChallengeId; title: string };
  challengeBalance: ChallengeBalance;
  designFindings: DesignFinding[];
  groundedQuestions: string[];
  designIntent: string;
  areaMetrics: AreaMetrics;
  budgetUsed: number;
  budgetLimit: number;
  fiveScores: ScoreSet;
  energyBalance: EnergyBalance;
  componentSummary: Array<{ type: ComponentType; label: string; count: number; cells: number }>;
  math: { numerator: number; denominator: number; percentage: number } | null;
  eventCard: EventId | null;
  before: { areaMetrics: AreaMetrics; fiveScores: ScoreSet; energyBalance: EnergyBalance; budgetUsed: number } | null;
};

export type AdvisorResponse = { questions: string[]; assessment: AiAssessment };

const rubricSchema = {
  type: "object",
  properties: {
    goalFit: { type: "integer", minimum: 0, maximum: 20 },
    tradeoffAwareness: { type: "integer", minimum: 0, maximum: 15 },
    evidenceUse: { type: "integer", minimum: 0, maximum: 10 },
    coherence: { type: "integer", minimum: 0, maximum: 5 },
  },
  required: ["goalFit", "tradeoffAwareness", "evidenceUse", "coherence"],
  additionalProperties: false,
} as const;

export const advisorOutputSchema = {
  type: "object",
  properties: {
    assessment: {
      type: "object",
      properties: {
        problemResolution: { type: "string", enum: ["solved", "partly_solved", "not_yet"] },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        rubric: rubricSchema,
        summary: { type: "string", minLength: 20, maxLength: 500 },
        strengths: { type: "array", minItems: 1, maxItems: 2, items: { type: "string", minLength: 10, maxLength: 220 } },
        risks: { type: "array", minItems: 1, maxItems: 2, items: { type: "string", minLength: 10, maxLength: 220 } },
        evidence: { type: "array", minItems: 2, maxItems: 3, items: { type: "string", minLength: 10, maxLength: 220 } },
      },
      required: ["problemResolution", "confidence", "rubric", "summary", "strengths", "risks", "evidence"],
      additionalProperties: false,
    },
    questions: { type: "array", minItems: 2, maxItems: 3, items: { type: "string", minLength: 10, maxLength: 140 } },
  },
  required: ["assessment", "questions"],
  additionalProperties: false,
} as const;

const gradeBands: GradeBand[] = ["5", "6", "7", "8"];
const challengeIds: ChallengeId[] = ["heat", "drought", "heavyRain", "energy", "activeTransport", "healthyLiving", "carbon"];
const eventIds: EventId[] = ["heatwave", "drought", "heavyRain", "energyLimit", "activeTransport", "healthyLiving", "carbonLimit"];
const componentTypes = Object.keys(COMPONENTS) as ComponentType[];
const areaKeys: Array<keyof AreaMetrics> = ["usedCells", "usedM2", "usedPercent", "greenCells", "greenPercent", "builtCells", "builtPercent", "infrastructureCells", "infrastructurePercent", "openCells", "openPercent"];
const scoreKeys: Array<keyof ScoreSet> = ["climate", "water", "energy", "health", "circularity", "total"];
const energyKeys: Array<keyof EnergyBalance> = ["grossDemand", "savings", "netDemand", "renewableProduction", "coveragePercent", "solarCount", "reducedEfficiencyPanels", "gridEnergyNeeded"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickFiniteNumbers<K extends string>(value: unknown, keys: K[]): Record<K, number> | null {
  if (!isRecord(value)) return null;
  const result = {} as Record<K, number>;
  for (const key of keys) {
    const number = value[key];
    if (typeof number !== "number" || !Number.isFinite(number)) return null;
    result[key] = number;
  }
  return result;
}

function pickEvaluation(value: unknown) {
  if (!isRecord(value) || typeof value.budgetUsed !== "number" || !Number.isFinite(value.budgetUsed)) return null;
  const areaMetrics = pickFiniteNumbers(value.areas, areaKeys);
  const fiveScores = pickFiniteNumbers(value.scores, scoreKeys);
  const energyBalance = pickFiniteNumbers(value.energyBalance, energyKeys);
  return areaMetrics && fiveScores && energyBalance ? { areaMetrics, fiveScores, energyBalance, budgetUsed: value.budgetUsed } : null;
}

export function parseAdvisorInput(value: unknown): AdvisorInput | null {
  if (!isRecord(value) || !gradeBands.includes(value.gradeBand as GradeBand)) return null;
  if (value.phase !== "initial" && value.phase !== "redesign") return null;
  if (!challengeIds.includes(value.challengeId as ChallengeId)) return null;
  if (typeof value.designIntent !== "string" || value.designIntent.trim().length < 5 || value.designIntent.length > 400) return null;

  const current = pickEvaluation(value.evaluation);
  const challenge = getChallenge(value.challengeId as ChallengeId);
  if (!current || !challenge || !Array.isArray(value.items)) return null;

  const counts = new Map<ComponentType, { count: number; cells: number }>();
  const safeItems: PlacedItem[] = [];
  for (const item of value.items) {
    if (!isRecord(item) || !componentTypes.includes(item.type as ComponentType)) return null;
    if (typeof item.width !== "number" || typeof item.height !== "number" || !Number.isFinite(item.width) || !Number.isFinite(item.height)) return null;
    const type = item.type as ComponentType;
    safeItems.push({ id: String(safeItems.length), type, x: 0, y: 0, width: item.width, height: item.height });
    const previous = counts.get(type) ?? { count: 0, cells: 0 };
    counts.set(type, { count: previous.count + 1, cells: previous.cells + item.width * item.height });
  }

  const eventCard = value.eventId ?? null;
  if (eventCard !== null && !eventIds.includes(eventCard as EventId)) return null;

  let math: AdvisorInput["math"] = null;
  if (isRecord(value.mathResult) && typeof value.mathResult.numerator === "number" && typeof value.mathResult.denominator === "number" && typeof value.mathResult.percentage === "number") {
    math = { numerator: value.mathResult.numerator, denominator: value.mathResult.denominator, percentage: value.mathResult.percentage };
  }

  const before = value.beforeEvaluation === undefined || value.beforeEvaluation === null ? null : pickEvaluation(value.beforeEvaluation);
  if (value.phase === "redesign" && !before) return null;

  const safeEvaluation = { areas: current.areaMetrics, scores: current.fiveScores, energyBalance: current.energyBalance, budgetUsed: current.budgetUsed };
  const diagnostic = analyzeDesign(safeItems, { ...safeEvaluation, budgetRemaining: BUDGET_LIMIT - current.budgetUsed, errors: [], isValid: true }, challenge.id);

  return {
    phase: value.phase,
    gradeBand: value.gradeBand as GradeBand,
    challenge: { id: challenge.id, title: challenge.title },
    challengeBalance: evaluateChallengeBalance(safeItems, safeEvaluation, challenge.id),
    designFindings: diagnostic.findings,
    groundedQuestions: diagnostic.questions,
    designIntent: value.designIntent.trim(),
    ...current,
    budgetLimit: BUDGET_LIMIT,
    componentSummary: [...counts.entries()].map(([type, summary]) => ({ type, label: COMPONENTS[type].label, ...summary })),
    math,
    eventCard: eventCard as EventId | null,
    before,
  };
}

function stringArray(value: unknown, min: number, max: number): string[] | null {
  if (!Array.isArray(value) || value.length < min || value.length > max) return null;
  if (!value.every((item) => typeof item === "string" && item.trim().length >= 10)) return null;
  return value.map((item) => cleanText(item as string));
}

function cleanText(value: string): string {
  return value.replace(/\p{Cf}/gu, "").trim();
}

function rubricScore(value: unknown, key: string, max: number): number | null {
  if (!isRecord(value) || !Number.isInteger(value[key])) return null;
  const score = value[key] as number;
  return score >= 0 && score <= max ? score : null;
}

export function parseAdvisorResponse(value: string): AdvisorResponse | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || !isRecord(parsed.assessment)) return null;
    const assessment = parsed.assessment;
    if (!isRecord(assessment.rubric)) return null;

    const goalFit = rubricScore(assessment.rubric, "goalFit", 20);
    const tradeoffAwareness = rubricScore(assessment.rubric, "tradeoffAwareness", 15);
    const evidenceUse = rubricScore(assessment.rubric, "evidenceUse", 10);
    const coherence = rubricScore(assessment.rubric, "coherence", 5);
    const strengths = stringArray(assessment.strengths, 1, 2);
    const risks = stringArray(assessment.risks, 1, 2);
    const evidence = stringArray(assessment.evidence, 2, 3);
    const questions = stringArray(parsed.questions, 2, 3);
    if (goalFit === null || tradeoffAwareness === null || evidenceUse === null || coherence === null || !strengths || !risks || !evidence || !questions) return null;
    if (!["solved", "partly_solved", "not_yet"].includes(String(assessment.problemResolution))) return null;
    if (!["low", "medium", "high"].includes(String(assessment.confidence))) return null;
    if (typeof assessment.summary !== "string" || assessment.summary.trim().length < 20) return null;

    return {
      questions,
      assessment: {
        problemResolution: assessment.problemResolution as AiAssessment["problemResolution"],
        confidence: assessment.confidence as AiAssessment["confidence"],
        aiScore: goalFit + tradeoffAwareness + evidenceUse + coherence,
        rubric: { goalFit, tradeoffAwareness, evidenceUse, coherence },
        summary: cleanText(assessment.summary),
        strengths,
        risks,
        evidence,
      },
    };
  } catch {
    return null;
  }
}

export function parseAdvisorQuestions(value: string): string[] | null {
  return parseAdvisorResponse(value)?.questions ?? null;
}
