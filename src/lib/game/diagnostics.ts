import { evaluateChallengeBalance } from "./balance";
import { getChallenge } from "./challenges";
import type { ChallengeBalance, ChallengeCriterion, ChallengeId, DesignEvaluation, DesignFinding, PlacedItem } from "./types";

const criterionText = (criterion: ChallengeCriterion) => `${criterion.value}${criterion.unit === "%" ? "%" : " puan"}`;
const targetText = (criterion: ChallengeCriterion) => `${criterion.target}${criterion.unit === "%" ? "%" : " puan"}`;

function criterionQuestion(criterion: ChallengeCriterion): string {
  if (criterion.id === "green") return `Yeşil alanın ${criterionText(criterion)}. Hedefe ulaşmak için kaç kare daha eklemelisin?`;
  if (criterion.id === "open") return `Açık alanın ${criterionText(criterion)}. Hedefi korumak için hangi yerleşimi değiştirebilirsin?`;
  if (criterion.id === "coverage" || criterion.id === "energy") return `Enerji karşılama oranın ${criterionText(criterion)}. Üretimi artırmak mı, ihtiyacı azaltmak mı seçersin?`;
  if (criterion.id === "budget") return `Bütçen hedefi aşıyor. Hangi bileşeni daha ekonomik bir çözümle değiştirebilirsin?`;
  return `${criterion.label} değerin ${criterionText(criterion)}. ${targetText(criterion)} hedefine ulaşmak için neyi değiştirirsin?`;
}

function criterionFinding(criterion: ChallengeCriterion): DesignFinding {
  return {
    id: `criterion-${criterion.id}`,
    tone: "gap",
    title: `${criterion.label} hedefin altında`,
    detail: `${criterion.label} değeri ${criterionText(criterion)}; gereken değer en az ${targetText(criterion)}.`,
    question: criterionQuestion(criterion),
  };
}

function linkedGuardrailQuestion(balance: ChallengeBalance, subject: string): string {
  const protectedCriterion = balance.criteria.find((criterion) => criterion.kind === "guardrail" && criterion.met);
  if (!protectedCriterion) return `${subject} eklerken bütçe sınırını nasıl koruyabilirsin?`;
  return `${subject} eklerken ${protectedCriterion.label.toLocaleLowerCase("tr-TR")} değerini ${targetText(protectedCriterion)} hedefinin üstünde nasıl tutabilirsin?`;
}

export function analyzeDesign(items: PlacedItem[], evaluation: DesignEvaluation, challengeId: ChallengeId): { balance: ChallengeBalance; findings: DesignFinding[]; questions: string[] } {
  const challenge = getChallenge(challengeId)!;
  const balance = evaluateChallengeBalance(items, evaluation, challengeId);
  const main = balance.criteria.find((criterion) => criterion.kind === "main")!;
  const findings: DesignFinding[] = [];

  if (main.met) {
    findings.push({
      id: "main-strength",
      tone: "strength",
      title: `${challenge.title} ana hedefi karşılandı`,
      detail: `${main.label} değeri ${criterionText(main)} ve hedef ${targetText(main)}.`,
      question: `${main.label} hedefini karşılamada hangi iki tasarım kararın birlikte işe yaradı?`,
    });
  } else {
    findings.push(criterionFinding(main));
  }

  balance.criteria.filter((criterion) => criterion.kind !== "main" && !criterion.met).forEach((criterion) => findings.push(criterionFinding(criterion)));

  const energy = evaluation.energyBalance;
  if (energy.grossDemand > 0 && energy.renewableProduction === 0 && !findings.some((finding) => finding.id === "energy-zero" || finding.id === "criterion-coverage" || finding.id === "criterion-energy")) {
    findings.push({
      id: "energy-zero",
      tone: "gap",
      title: "Enerji ihtiyacı var, üretim yok",
      detail: `Okul ${energy.netDemand} oyun içi enerji birimi kullanıyor ve hiç enerji üretmiyor. Bu, seçtiğin çözümün oluşturduğu yeni bir sorun değil; kampüste henüz çözülmemiş başka bir ihtiyaçtır.`,
      question: "Okulun enerji üretmesi için hangi bileşeni ekleyebilirsin?",
    });
  }

  const recyclingCount = items.filter((item) => item.type === "recycling").length;
  if (evaluation.scores.circularity < 25 && recyclingCount === 0 && challengeId !== "carbon") {
    findings.push({
      id: "circularity-low",
      tone: "gap",
      title: "Atık ve yeniden kullanım çözümü zayıf",
      detail: `Doğa ve döngüsellik puanı ${evaluation.scores.circularity}; geri dönüşüm merkezi bulunmuyor.`,
      question: "Atıkları yeniden kullanmak için tasarıma hangi bileşeni ekleyebilirsin?",
    });
  }

  const gaps = findings.filter((finding) => finding.tone === "gap");
  const energyGap = gaps.find((finding) => finding.id === "energy-zero");
  const questions: string[] = [];
  if (energyGap && main.met) {
    questions.push(energyGap.question, linkedGuardrailQuestion(balance, "Enerji çözümü"));
  }
  gaps.filter((finding) => finding.id !== energyGap?.id).forEach((finding) => { if (questions.length < 3) questions.push(finding.question); });
  if (questions.length < 2) questions.push(main.met ? findings[0].question : linkedGuardrailQuestion(balance, "Yeni bir çözüm"));
  if (questions.length < 2) questions.push(`Bütçenin ${evaluation.budgetUsed} puanını kullandın. Aynı hedefe daha az bütçeyle nasıl ulaşabilirsin?`);

  return { balance, findings, questions: [...new Set(questions)].slice(0, 3) };
}
