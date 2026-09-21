import type { ChallengeId, DesignEvaluation, EventId, GradeBand } from "./types";
import { getEvent } from "./events";
import { evaluateChallengeBalance } from "./balance";
import type { PlacedItem } from "./types";

export function fallbackQuestions(evaluation: DesignEvaluation, grade: GradeBand, eventId?: EventId, challengeId?: ChallengeId, items: PlacedItem[] = []): string[] {
  const event = getEvent(eventId);
  if (challengeId) {
    const balance = evaluateChallengeBalance(items, evaluation, challengeId);
    const main = balance.criteria.find((item) => item.kind === "main")!;
    const guardrail = balance.criteria.find((item) => item.kind === "guardrail" && !item.met) ?? balance.criteria.find((item) => item.kind === "guardrail")!;
    return [
      `${main.label} değerin ${main.value}. Hedefe ulaşmak için hangi kararını değiştirebilirsin?`,
      `${guardrail.label} değerin ${guardrail.value}. Ana hedefi geliştirirken bunu nasıl korursun?`,
      balance.status === "side_effects" ? "Ana hedef tamamlandı; hangi denge koşulu hâlâ eksik?" : "İki farklı çözüm yolundan hangisi bütçeyi daha iyi korur?",
    ];
  }
  const questions = [
    "Kampüsün %" + evaluation.areas.usedPercent + " kadarı kullanılıyor. Kalan alanı nasıl kullanmak istersin?",
    "En düşük göstergen " + lowestLabel(evaluation.scores) + ". Onu artırmak için neyi değiştirebilirsin?"
  ];
  if (event) questions.push(event.title + " sırasında hangi tasarım kararın daha çok işe yarar?");
  else if (Number(grade) >= 7) questions.push("100 bütçe puanının " + evaluation.budgetUsed + " puanını kullandın. En yararlı seçimin hangisi?");
  return questions.slice(0, 3);
}

function lowestLabel(scores: DesignEvaluation["scores"]): string {
  const labels = { climate: "iklim dayanıklılığı", water: "su yönetimi", energy: "enerji", health: "sağlık ve hareket", circularity: "döngüsellik ve doğa" };
  const keys = Object.keys(labels) as Array<keyof typeof labels>;
  return labels[keys.reduce((lowest, key) => scores[key] < scores[lowest] ? key : lowest, keys[0])];
}
