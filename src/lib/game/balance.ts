import type { ChallengeBalance, ChallengeCriterion, ChallengeId, DesignEvaluation, PlacedItem } from "./types";

type BalanceEvaluation = Pick<DesignEvaluation, "areas" | "budgetUsed" | "energyBalance" | "scores">;

export const CHALLENGE_MISSIONS: Record<ChallengeId, { title: string; question: string }> = {
  heat: { title: "Serinlik, su ve açık alan hedeflerini birlikte karşıla.", question: "Serinlik hedefinin yanında su ve açık alan koşulları da sağlandı mı?" },
  drought: { title: "Su, yeşil alan ve iklim hedeflerini birlikte karşıla.", question: "Su hedefinin yanında yeşil alan ve iklim koşulları da sağlandı mı?" },
  heavyRain: { title: "Yağmur, açık alan ve yeşil alan hedeflerini birlikte karşıla.", question: "Yağmur hedefinin yanında açık ve yeşil alan koşulları da sağlandı mı?" },
  energy: { title: "Enerji, yeşil alan ve sağlık hedeflerini birlikte karşıla.", question: "Enerji hedefinin yanında yeşil alan ve sağlık koşulları da sağlandı mı?" },
  activeTransport: { title: "Ulaşım, sağlık ve iklim hedeflerini birlikte karşıla.", question: "Ulaşım hedefinin yanında sağlık ve iklim koşulları da sağlandı mı?" },
  healthyLiving: { title: "Sağlık, açık alan ve yeşil alan hedeflerini birlikte karşıla.", question: "Sağlık hedefinin yanında açık ve yeşil alan koşulları da sağlandı mı?" },
  carbon: { title: "Karbon, temiz enerji ve sağlık hedeflerini birlikte karşıla.", question: "Karbon hedefinin yanında enerji ve sağlık koşulları da sağlandı mı?" },
};

const count = (items: PlacedItem[], type: PlacedItem["type"]) => items.filter((item) => item.type === type).length;
const cells = (items: PlacedItem[], types: PlacedItem["type"][]) => items.filter((item) => types.includes(item.type)).reduce((sum, item) => sum + item.width * item.height, 0);

function criterion(id: string, label: string, value: number, target: number, unit: ChallengeCriterion["unit"], kind: ChallengeCriterion["kind"], direction: ChallengeCriterion["direction"] = "atLeast"): ChallengeCriterion {
  const rounded = Math.round(value);
  const met = direction === "atLeast" ? rounded >= target : rounded <= target;
  const progress = direction === "atLeast" ? Math.min(1, Math.max(0, rounded / target)) : Math.min(1, Math.max(0, target / Math.max(1, rounded)));
  return { id, label, value: rounded, target, unit, kind, direction, met, progress };
}

export function evaluateChallengeBalance(items: PlacedItem[], evaluation: BalanceEvaluation, challengeId: ChallengeId): ChallengeBalance {
  const { areas, budgetUsed, energyBalance, scores } = evaluation;
  const budget = criterion("budget", "Bütçe kullanımı", budgetUsed, 100, "puan", "budget", "atMost");
  let criteria: ChallengeCriterion[];

  switch (challengeId) {
    case "heat":
      criteria = [
        criterion("cooling", "İklim ve serinlik", scores.climate, 60, "puan", "main"),
        criterion("water", "Su yönetimi", scores.water, 25, "puan", "guardrail"),
        criterion("open", "Açık alan", areas.openPercent, 65, "%", "guardrail"), budget,
      ];
      break;
    case "drought":
      criteria = [
        criterion("water", "Su yönetimi", scores.water, 60, "puan", "main"),
        criterion("green", "Yeşil alan", areas.greenPercent, 12, "%", "guardrail"),
        criterion("climate", "İklim dayanıklılığı", scores.climate, 40, "puan", "guardrail"), budget,
      ];
      break;
    case "heavyRain":
      criteria = [
        criterion("rain", "Yağmur yönetimi", scores.water, 60, "puan", "main"),
        criterion("open", "Açık alan", areas.openPercent, 65, "%", "guardrail"),
        criterion("green", "Yeşil alan", areas.greenPercent, 12, "%", "guardrail"), budget,
      ];
      break;
    case "energy":
      criteria = [
        criterion("coverage", "Enerji karşılama", energyBalance.coveragePercent, 70, "%", "main"),
        criterion("green", "Yeşil alan", areas.greenPercent, 15, "%", "guardrail"),
        criterion("health", "Sağlık ve hareket", scores.health, 35, "puan", "guardrail"), budget,
      ];
      break;
    case "activeTransport": { 
      const access = Math.min(100, count(items, "bike") * 20 + cells(items, ["shade"]) * 5 + cells(items, ["green", "garden"]) * 2);
      criteria = [
        criterion("access", "Aktif ulaşım erişimi", access, 60, "puan", "main"),
        criterion("health", "Sağlık ve hareket", scores.health, 55, "puan", "guardrail"),
        criterion("climate", "İklim dayanıklılığı", scores.climate, 40, "puan", "guardrail"), budget,
      ];
      break;
    }
    case "healthyLiving":
      criteria = [
        criterion("health", "Sağlık ve hareket", scores.health, 60, "puan", "main"),
        criterion("open", "Açık alan", areas.openPercent, 65, "%", "guardrail"),
        criterion("green", "Yeşil alan", areas.greenPercent, 12, "%", "guardrail"), budget,
      ];
      break;
    case "carbon": { 
      const activeTransport = Math.min(100, count(items, "bike") * 20);
      const carbonProgress = scores.climate * 0.35 + Math.min(100, energyBalance.coveragePercent) * 0.3 + scores.circularity * 0.2 + activeTransport * 0.15;
      criteria = [
        criterion("carbon", "Karbon azaltma dengesi", carbonProgress, 60, "puan", "main"),
        criterion("energy", "Temiz enerji karşılama", energyBalance.coveragePercent, 50, "%", "guardrail"),
        criterion("health", "Sağlık ve hareket", scores.health, 40, "puan", "guardrail"), budget,
      ];
      break;
    }
  }

  const mainMet = criteria.find((item) => item.kind === "main")?.met ?? false;
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
