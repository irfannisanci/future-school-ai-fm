import type { ChallengeId, GradeBand, MathResult } from "@/lib/game/types";

export type MathTutorInput = {
  gradeBand: GradeBand;
  challengeId: ChallengeId;
  numeratorLabel: string;
  numerator: number;
  denominator: number;
  expectedNumerator: number;
  expectedDenominator: number;
};

export const mathOutputSchema = {
  type: "object",
  properties: {
    simplifiedNumerator: { type: "integer", minimum: 0 },
    simplifiedDenominator: { type: "integer", minimum: 1 },
    decimal: { type: "number", minimum: 0 },
    percentage: { type: "number", minimum: 0 },
    explanation: { type: "string", minLength: 15, maxLength: 300 },
    hint: { type: "string", minLength: 5, maxLength: 220 },
  },
  required: ["simplifiedNumerator", "simplifiedDenominator", "decimal", "percentage", "explanation", "hint"],
  additionalProperties: false,
} as const;

const gradeBands: GradeBand[] = ["5", "6", "7", "8"];
const challengeIds: ChallengeId[] = ["heat", "drought", "heavyRain", "energy", "activeTransport", "healthyLiving", "carbon"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMathInput(value: unknown): MathTutorInput | null {
  if (!isRecord(value) || !gradeBands.includes(value.gradeBand as GradeBand) || !challengeIds.includes(value.challengeId as ChallengeId)) return null;
  const numberKeys = ["numerator", "denominator", "expectedNumerator", "expectedDenominator"] as const;
  if (!numberKeys.every((key) => Number.isInteger(value[key]) && (value[key] as number) >= 0)) return null;
  if ((value.denominator as number) < 1 || (value.expectedDenominator as number) < 1) return null;
  if (typeof value.numeratorLabel !== "string" || value.numeratorLabel.length > 100) return null;
  return {
    gradeBand: value.gradeBand as GradeBand,
    challengeId: value.challengeId as ChallengeId,
    numeratorLabel: value.numeratorLabel,
    numerator: value.numerator as number,
    denominator: value.denominator as number,
    expectedNumerator: value.expectedNumerator as number,
    expectedDenominator: value.expectedDenominator as number,
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function calculateRatio(input: Pick<MathTutorInput, "numerator" | "denominator">) {
  const divisor = gcd(input.numerator, input.denominator);
  const decimal = Number((input.numerator / input.denominator).toFixed(4));
  return { simplifiedNumerator: input.numerator / divisor, simplifiedDenominator: input.denominator / divisor, decimal, percentage: Number((decimal * 100).toFixed(1)) };
}

// AI'ya ulaşılamadığında oran laboratuvarı bu deterministik sonuçla devam eder; ipucu doğru cevabı vermez.
export function fallbackMathResult(input: MathTutorInput): MathResult {
  const ratio = calculateRatio(input);
  const simplified = ratio.simplifiedNumerator === input.numerator
    ? `${input.numerator}/${input.denominator} kesri zaten en sade hâlinde.`
    : `${input.numerator}/${input.denominator} kesri sadeleşince ${ratio.simplifiedNumerator}/${ratio.simplifiedDenominator} olur.`;
  return {
    matchesDesign: input.numerator === input.expectedNumerator && input.denominator === input.expectedDenominator,
    ...ratio,
    explanation: `${simplified} ${input.numerator} ÷ ${input.denominator} = ${ratio.decimal}; 100 ile çarpınca %${ratio.percentage} eder.`,
    hint: `Kartlara yeniden bak: pay, “${input.numeratorLabel}” sayısıdır. Payı ve paydayı ayrı ayrı yeniden hesapla.`,
  };
}

export function parseMathResponse(value: string, input: MathTutorInput): MathResult | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return null;
    const { simplifiedNumerator, simplifiedDenominator, decimal, percentage } = calculateRatio(input);
    if (parsed.simplifiedNumerator !== simplifiedNumerator || parsed.simplifiedDenominator !== simplifiedDenominator) return null;
    if (typeof parsed.decimal !== "number" || Math.abs(parsed.decimal - decimal) > 0.001) return null;
    if (typeof parsed.percentage !== "number" || Math.abs(parsed.percentage - percentage) > 0.1) return null;
    if (typeof parsed.explanation !== "string" || parsed.explanation.length < 15) return null;
    if (typeof parsed.hint !== "string" || parsed.hint.length < 5) return null;
    return {
      matchesDesign: input.numerator === input.expectedNumerator && input.denominator === input.expectedDenominator,
      simplifiedNumerator,
      simplifiedDenominator,
      decimal,
      percentage,
      explanation: parsed.explanation.replace(/\p{Cf}/gu, "").trim(),
      hint: parsed.hint.replace(/\p{Cf}/gu, "").trim(),
    };
  } catch {
    return null;
  }
}
