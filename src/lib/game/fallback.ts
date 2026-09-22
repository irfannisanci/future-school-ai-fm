import type { ChallengeId, DesignEvaluation, EventId, GradeBand } from "./types";
import { getEvent } from "./events";
import { evaluateChallengeBalance } from "./balance";
import type { PlacedItem } from "./types";

export function fallbackQuestions(evaluation: DesignEvaluation, grade: GradeBand, eventId?: EventId, challengeId?: ChallengeId, items: PlacedItem[] = []): string[] {
  const event = getEvent(eventId);
  if (challengeId) {
    const balance = evaluateChallengeBalance(items, evaluation, challengeId);
    const main = balance.criteria.find((item) => item.kind === "main")!;
    const shown = (item: typeof main) => item.unit === "%" ? `%${item.value}` : `${item.value} puan`;
    const guardrail = balance.criteria.find((item) => item.kind === "guardrail" && !item.met) ?? balance.criteria.find((item) => item.kind === "guardrail")!;
    return [
      `${main.label} şu an ${shown(main)}. Hedefe ulaşmak için neyi değiştirebilirsin?`,
      `${guardrail.label} şu an ${shown(guardrail)}. Ana hedefe çalışırken bunu nasıl korursun?`,
      balance.status === "side_effects" ? "Ana hedef tamam. Hangi ek koşul hâlâ eksik?" : "Aklındaki iki çözümden hangisi daha az bütçe harcar?",
    ];
  }
  const questions = [
    "Kampüsün %" + evaluation.areas.usedPercent + " kadarı dolu. Boş kalan yeri nasıl kullanmak istersin?",
    "En düşük puanın " + lowestLabel(evaluation.scores) + ". Onu artırmak için neyi değiştirebilirsin?"
  ];
  if (event) questions.push(event.title + " olayında tasarımındaki hangi bileşen en çok işe yarar?");
  else if (Number(grade) >= 7) questions.push("100 bütçe puanının " + evaluation.budgetUsed + " puanını harcadın. En yararlı seçimin hangisi?");
  return questions.slice(0, 3);
}

function lowestLabel(scores: DesignEvaluation["scores"]): string {
  const labels = { climate: "iklim", water: "su", energy: "enerji", health: "sağlık", circularity: "doğa" };
  const keys = Object.keys(labels) as Array<keyof typeof labels>;
  return labels[keys.reduce((lowest, key) => scores[key] < scores[lowest] ? key : lowest, keys[0])];
}
