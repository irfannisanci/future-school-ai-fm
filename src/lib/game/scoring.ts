import { evaluateChallengeBalance } from "./balance";
import type { ChallengeId, DesignEvaluation, EventId, PlacedItem } from "./types";

export type TechnicalScore = { validity: number; math: number; balance: number; indicators: number; total: number };

// 50 puan: geçerlilik 5 + doğrulanmış oran 15 + denge 20 + göstergeler 10.
// Denge puanı ana hedefin ilerlemesiyle ölçeklenir; koruma koşulları ana hedeften bağımsız puan getirmez. Bütçe yerleşimde zaten zorunlu olduğu için sayılmaz.
export function technicalScore(evaluation: DesignEvaluation, items: PlacedItem[], mathCorrect: boolean, challengeId?: ChallengeId, eventId?: EventId): TechnicalScore {
  const validity = evaluation.isValid ? 5 : 0;
  const math = mathCorrect ? 15 : 0;
  const indicators = Math.round(evaluation.scores.total * 0.1);
  let balance = Math.round(evaluation.scores.total * 0.2);
  if (challengeId) {
    const criteria = evaluateChallengeBalance(items, evaluation, challengeId, eventId).criteria;
    const main = criteria.find((item) => item.kind === "main")!;
    const guardrails = criteria.filter((item) => item.kind === "guardrail" || item.kind === "event");
    const guardrailProgress = guardrails.reduce((sum, item) => sum + item.progress, 0) / guardrails.length;
    balance = Math.round(main.progress * (12 + 8 * guardrailProgress));
  }
  return { validity, math, balance, indicators, total: validity + math + balance + indicators };
}
