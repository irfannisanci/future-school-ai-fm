import type { DesignEvaluation, EventId, GradeBand } from "./types";
import { getEvent } from "./events";

export function fallbackQuestions(evaluation: DesignEvaluation, grade: GradeBand, eventId?: EventId): string[] {
  const event = getEvent(eventId);
  const questions = [
    "Kampüsün %" + evaluation.areas.usedPercent + " kadarı kullanılıyor. Boş alanı korumak ile yeni bir bileşen eklemek arasında nasıl karar verdiniz?",
    "En düşük göstergeniz " + lowestLabel(evaluation.scores) + ". Onu artırırken hangi güçlü göstergenizden vazgeçmek zorunda kalabilirsiniz?"
  ];
  if (event) questions.push(event.title + " koşulunda " + event.focus + " puanınızı etkileyen hangi tasarım kararını değiştirmek isterdiniz?");
  else if (Number(grade) >= 7) questions.push("Bütçenin %" + evaluation.budgetUsed + " kadarını kullandınız. Bir birim maliyet başına en çok yarar sağlayan kararınız hangisi?");
  return questions.slice(0, 3);
}

function lowestLabel(scores: DesignEvaluation["scores"]): string {
  const labels = { climate: "iklim dayanıklılığı", water: "su yönetimi", energy: "enerji", health: "sağlık ve hareket", circularity: "döngüsellik ve doğa" };
  const keys = Object.keys(labels) as Array<keyof typeof labels>;
  return labels[keys.reduce((lowest, key) => scores[key] < scores[lowest] ? key : lowest, keys[0])];
}
