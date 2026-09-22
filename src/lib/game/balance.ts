import { EVENT_RESOURCE, getResourceBalance, RESOURCES } from "./resources";
import type { ChallengeBalance, ChallengeCriterion, ChallengeId, DesignEvaluation, EventId, PlacedItem, ResourceId } from "./types";

type BalanceEvaluation = Pick<DesignEvaluation, "areas" | "budgetUsed" | "energyBalance" | "scores">;

export const CHALLENGE_MISSIONS: Record<ChallengeId, { title: string; question: string }> = {
  heat: { title: "Okulu serinlet; suyu ve enerjiyi de unutma.", question: "Okul serinledi mi? Su ve enerji de yetiyor mu?" },
  drought: { title: "Suyu karşıla; yeşil alanı ve serinliği de unutma.", question: "Su yetiyor mu? Yeşil alan ve serinlik de yeterli mi?" },
  heavyRain: { title: "Yağmuru tut; suyu ve yeşil alanı da unutma.", question: "Yağmur tutuluyor mu? Su ve yeşil alan da yeterli mi?" },
  energy: { title: "Temiz enerji üret; yeşil alanı ve sağlığı da unutma.", question: "Enerji yetiyor mu? Yeşil alan ve sağlık da yeterli mi?" },
  activeTransport: { title: "Yürüyen ve bisikletli öğrenciye yer aç; yağmuru ve serinliği de unutma.", question: "Herkese yer var mı? Yağmur tutuluyor ve okul serin kalıyor mu?" },
  healthyLiving: { title: "Hareket alanı aç; suyu ve enerjiyi de unutma.", question: "Herkese hareket alanı var mı? Su ve enerji de yetiyor mu?" },
  carbon: { title: "Karbonu azalt; enerjiyi ve sağlığı da unutma.", question: "Karbon yeterince azaldı mı? Enerji ve sağlık da yeterli mi?" },
};

type Rule = { kind: "resource"; id: ResourceId; target: number } | { kind: "green" | "health"; target: number };

// Her sorunda ana hedef, ana kaynak oranının en az %70 olmasıdır. Koruma koşulları, ana stratejinin kötüleştirdiği başka bir dengeyi izler.
const RULES: Record<ChallengeId, [Rule, Rule, Rule]> = {
  heat: [{ kind: "resource", id: "cooling", target: 70 }, { kind: "resource", id: "water", target: 50 }, { kind: "resource", id: "energy", target: 30 }],
  drought: [{ kind: "resource", id: "water", target: 70 }, { kind: "green", target: 12 }, { kind: "resource", id: "cooling", target: 50 }],
  heavyRain: [{ kind: "resource", id: "rain", target: 70 }, { kind: "resource", id: "water", target: 40 }, { kind: "green", target: 12 }],
  energy: [{ kind: "resource", id: "energy", target: 70 }, { kind: "green", target: 15 }, { kind: "health", target: 35 }],
  activeTransport: [{ kind: "resource", id: "transport", target: 70 }, { kind: "resource", id: "rain", target: 50 }, { kind: "resource", id: "cooling", target: 50 }],
  healthyLiving: [{ kind: "resource", id: "activity", target: 70 }, { kind: "resource", id: "water", target: 50 }, { kind: "resource", id: "energy", target: 30 }],
  carbon: [{ kind: "resource", id: "carbon", target: 70 }, { kind: "resource", id: "energy", target: 50 }, { kind: "health", target: 40 }],
};

function criterion(id: string, label: string, value: number, target: number, unit: ChallengeCriterion["unit"], kind: ChallengeCriterion["kind"], direction: ChallengeCriterion["direction"] = "atLeast"): ChallengeCriterion {
  const rounded = Math.round(value);
  const met = direction === "atLeast" ? rounded >= target : rounded <= target;
  const progress = direction === "atLeast" ? Math.min(1, Math.max(0, rounded / target)) : Math.min(1, Math.max(0, target / Math.max(1, rounded)));
  return { id, label, value: rounded, target, unit, kind, direction, met, progress };
}

// 2040 olayının oranı görevin ölçütleri arasında değilse yeniden tasarımda ek koşul olarak izlenir.
export const EVENT_CONDITION_TARGET = 50;

function ruleCriterion(rule: Rule, kind: ChallengeCriterion["kind"], items: PlacedItem[], evaluation: BalanceEvaluation, eventId?: EventId): ChallengeCriterion {
  if (rule.kind !== "resource") {
    return rule.kind === "green"
      ? criterion("green", "Yeşil alan", evaluation.areas.greenPercent, rule.target, "%", kind)
      : criterion("health", "Sağlık puanı", evaluation.scores.health, rule.target, "puan", kind);
  }
  // Enerji oranı değerlendirmeden gelir (olay koşulunu zaten içerir); diğer oranlar yerleşimden ve olaydan hesaplanır.
  const value = rule.id === "energy" ? evaluation.energyBalance.coveragePercent : getResourceBalance(items, rule.id, eventId).coveragePercent;
  return criterion(rule.id, RESOURCES[rule.id].title, value, rule.target, "%", kind);
}

// Olayın oranı görevin ölçütleri arasında değilse eklenecek 2040 koşulu (etiket ve hedef).
export function eventCondition(challengeId: ChallengeId, eventId: EventId): { id: ResourceId; label: string; target: number } | undefined {
  const id = EVENT_RESOURCE[eventId];
  if (RULES[challengeId].some((rule) => rule.kind === "resource" && rule.id === id)) return undefined;
  return { id, label: RESOURCES[id].title, target: EVENT_CONDITION_TARGET };
}

export function evaluateChallengeBalance(items: PlacedItem[], evaluation: BalanceEvaluation, challengeId: ChallengeId, eventId?: EventId): ChallengeBalance {
  const rules = RULES[challengeId];
  const [main, first, second] = rules;
  const criteria = [
    ruleCriterion(main, "main", items, evaluation, eventId),
    ruleCriterion(first, "guardrail", items, evaluation, eventId),
    ruleCriterion(second, "guardrail", items, evaluation, eventId),
  ];
  const eventResource = eventId ? EVENT_RESOURCE[eventId] : undefined;
  if (eventResource && !rules.some((rule) => rule.kind === "resource" && rule.id === eventResource)) {
    criteria.push(ruleCriterion({ kind: "resource", id: eventResource, target: EVENT_CONDITION_TARGET }, "event", items, evaluation, eventId));
  }
  criteria.push(criterion("budget", "Harcanan bütçe", evaluation.budgetUsed, 100, "puan", "budget", "atMost"));
  const mainMet = criteria[0].met;
  const allMet = criteria.every((item) => item.met);
  const mission = CHALLENGE_MISSIONS[challengeId];
  return {
    challengeId,
    status: allMet ? "balanced" : mainMet ? "side_effects" : "not_yet",
    title: mission.title,
    question: mission.question,
    criteria,
  };
}

// Olay yüzünden düşen ölçütlerin olaydan önceki değerleri (aynı yerleşim, normal gün). Çubuktaki kırmızı parça buradan gelir.
// "2040 koşulu" satırı normal günde listede olmadığı için kaynağın olaysız oranı kullanılır. Bütçe olaydan etkilenmez.
export function criteriaBeforeEvent(items: PlacedItem[], challengeId: ChallengeId, eventId: EventId, normal: BalanceEvaluation, shocked: BalanceEvaluation): Record<string, number> {
  const before = evaluateChallengeBalance(items, normal, challengeId).criteria;
  const drops: Record<string, number> = {};
  for (const criterion of evaluateChallengeBalance(items, shocked, challengeId, eventId).criteria) {
    if (criterion.kind === "budget") continue;
    const previous = before.find((item) => item.id === criterion.id)?.value ?? Math.round(getResourceBalance(items, criterion.id as ResourceId).coveragePercent);
    if (previous > criterion.value) drops[criterion.id] = previous;
  }
  return drops;
}
