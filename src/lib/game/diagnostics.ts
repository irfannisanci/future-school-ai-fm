import { evaluateChallengeBalance } from "./balance";
import { getChallenge } from "./challenges";
import type { ChallengeBalance, ChallengeCriterion, ChallengeId, DesignEvaluation, DesignFinding, EventId, PlacedItem } from "./types";

const criterionText = (criterion: ChallengeCriterion) => criterion.unit === "%" ? `%${criterion.value}` : `${criterion.value} puan`;
const targetText = (criterion: ChallengeCriterion) => `${criterion.direction === "atMost" ? "en fazla" : "en az"} ${criterion.unit === "%" ? `%${criterion.target}` : `${criterion.target} puan`}`;

function criterionQuestion(criterion: ChallengeCriterion): string {
  if (criterion.id === "budget") return "Bütçeyi aşmamak için hangi bileşenden vazgeçebilirsin?";
  return `Tasarımında “${criterion.label}” hedefin altında kaldı. Bunu artırmak için ne ekleyebilirsin?`;
}

function criterionFinding(criterion: ChallengeCriterion): DesignFinding {
  return {
    id: `criterion-${criterion.id}`,
    tone: "gap",
    title: `${criterion.kind === "event" ? "2040 koşulu: " : ""}${criterion.label} ${criterion.direction === "atMost" ? "sınırı aştı" : "hedefin altında"}`,
    detail: `Şu an ${criterionText(criterion)}. Hedef: ${targetText(criterion)}.`,
    question: criterionQuestion(criterion),
  };
}

// Sorular 6. sınıf düzeyinde yorum sorularıdır: konu hakkında iki genel soru ve öğrencinin kendi tasarımına bağlı tek bir soru.
const THEME_QUESTIONS: Record<ChallengeId, [string, string]> = {
  heat: ["Sıcak bir günde okul bahçesini serin tutmak için neler yapılabilir?", "Ağaçlar ve gölgelikler öğrencilere nasıl yardımcı olur?"],
  drought: ["Okulda suyu boşa harcamamak için neler yapılabilir?", "Biriktirilen yağmur suyu okulda nerelerde kullanılabilir?"],
  heavyRain: ["Çok yağmur yağdığında okul bahçesinde su birikmemesi için neler yapılabilir?", "Toprak ve yeşil alanlar yağmur suyuna ne yapar?"],
  energy: ["Okulda enerji tasarrufu için neler yapılabilir?", "Güneş panelleri okulun ne işine yarar?"],
  activeTransport: ["Öğrencilerin okula yürüyerek veya bisikletle gelmesi için okulda neler olmalı?", "Okula hareket ederek gelmenin öğrencilere ne faydası olur?"],
  healthyLiving: ["Sağlıklı yaşam için okulda neler yapılabilir?", "Teneffüste hareket edebilmek için okul bahçesinde neler olmalı?"],
  carbon: ["Okulun havayı daha az kirletmesi için neler yapılabilir?", "Geri dönüşüm ve bisiklet kullanımı çevreye nasıl yardımcı olur?"],
};

export function analyzeDesign(items: PlacedItem[], evaluation: DesignEvaluation, challengeId: ChallengeId, eventId?: EventId): { balance: ChallengeBalance; findings: DesignFinding[]; questions: string[] } {
  const challenge = getChallenge(challengeId)!;
  const balance = evaluateChallengeBalance(items, evaluation, challengeId, eventId);
  const main = balance.criteria.find((criterion) => criterion.kind === "main")!;
  const findings: DesignFinding[] = [];

  if (main.met) {
    findings.push({
      id: "main-strength",
      tone: "strength",
      title: `${challenge.title} ana hedefi karşılandı`,
      detail: `Şu an ${criterionText(main)}. Hedef: ${targetText(main)}.`,
      question: "Tasarımında en çok işe yarayan bileşen sence hangisi? Neden?",
    });
  } else {
    findings.push(criterionFinding(main));
  }

  balance.criteria.filter((criterion) => criterion.kind !== "main" && !criterion.met).forEach((criterion) => findings.push(criterionFinding(criterion)));

  const energy = evaluation.energyBalance;
  if (energy.grossDemand > 0 && energy.renewableProduction === 0 && !findings.some((finding) => finding.id === "energy-zero" || finding.id === "criterion-energy")) {
    findings.push({
      id: "energy-zero",
      tone: "gap",
      title: "Okul enerji harcıyor ama hiç üretmiyor",
      detail: `Okul ${energy.netDemand} birim enerji harcıyor ve hiç enerji üretmiyor. Bu sorunu senin seçimin yaratmadı; okulda henüz çözülmemiş başka bir ihtiyaç.`,
      question: "Okulun enerji üretmesi için hangi bileşeni ekleyebilirsin?",
    });
  }

  const recyclingCount = items.filter((item) => item.type === "recycling").length;
  if (evaluation.scores.circularity < 25 && recyclingCount === 0 && challengeId !== "carbon") {
    findings.push({
      id: "circularity-low",
      tone: "gap",
      title: "Atıklar yeniden kullanılmıyor",
      detail: `Doğa puanın ${evaluation.scores.circularity}. Okulda geri dönüşüm merkezi yok.`,
      question: "Atıkları yeniden kullanmak için tasarıma hangi bileşeni ekleyebilirsin?",
    });
  }

  const gap = main.met ? balance.criteria.find((criterion) => criterion.kind === "guardrail" && !criterion.met) : main;
  const [themeQuestion, closingQuestion] = THEME_QUESTIONS[challengeId];
  const designQuestion = gap ? criterionQuestion(gap) : "Tasarımında en çok işe yarayan bileşen sence hangisi? Neden?";

  return { balance, findings, questions: [themeQuestion, designQuestion, closingQuestion] };
}
