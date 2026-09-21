import { describe, expect, it } from "vitest";
import { parseAdvisorInput, parseAdvisorResponse } from "@/lib/ai/advisor";
import { evaluateDesign } from "@/lib/game/engine";

describe("AI jury contract", () => {
  it("sends only a whitelisted design summary to the model", () => {
    const evaluation = evaluateDesign([]);
    const result = parseAdvisorInput({
      phase: "initial", gradeBand: "7", challengeId: "heat", designIntent: "Bahçeyi daha serin yapmak istiyoruz.",
      evaluation: { ...evaluation, areas: { ...evaluation.areas, studentName: "private" }, scores: { ...evaluation.scores, privateNote: "private" } },
      items: [{ type: "green", width: 1, height: 1, studentName: "private" }], eventId: "drought", teamAlias: "private",
    });

    expect(result).toMatchObject({
      phase: "initial", gradeBand: "7", challenge: { id: "heat", title: "Aşırı sıcak" },
      designIntent: "Bahçeyi daha serin yapmak istiyoruz.", areaMetrics: evaluation.areas,
      budgetUsed: evaluation.budgetUsed, budgetLimit: 100, fiveScores: evaluation.scores, eventCard: "drought",
      componentSummary: [{ type: "green", label: "Yeşil alan", count: 1, cells: 1 }],
    });
    expect(result?.challengeBalance.challengeId).toBe("heat");
    expect(result?.challengeBalance.criteria).toHaveLength(4);
    expect(result).not.toHaveProperty("teamAlias");
    expect(result?.areaMetrics).not.toHaveProperty("studentName");
    expect(result?.fiveScores).not.toHaveProperty("privateNote");
    expect(result?.componentSummary[0]).not.toHaveProperty("studentName");
  });

  it("rejects malformed jury input", () => {
    expect(parseAdvisorInput({ gradeBand: "12", evaluation: {} })).toBeNull();
    expect(parseAdvisorInput({ phase: "initial", gradeBand: "6", challengeId: "heat", designIntent: "Amaç", evaluation: { budgetUsed: Number.NaN }, items: [] })).toBeNull();
  });

  it("validates and totals the structured jury rubric", () => {
    const result = parseAdvisorResponse(JSON.stringify({
      assessment: {
        problemResolution: "partly_solved", confidence: "medium",
        rubric: { goalFit: 20, tradeoffAwareness: 10, evidenceUse: 8, coherence: 4 },
        summary: "Tasarım seçilen sorunu sayısal kanıtlarla kısmen çözüyor.",
        strengths: ["Yeşil alan sıcaklık sorununu destekliyor."], risks: ["Yapı alanı açık alan miktarını azaltıyor."],
        evidence: ["Yeşil alan oranı yüzde 25 olarak hesaplandı.", "Bütçenin 70 puanı kullanıldı."],
      },
      questions: ["Yeşil alanı artırırsan hangi alan küçülebilir?", "Grafikte en büyük bölüm hangisidir?"],
    }));
    expect(result?.assessment.aiScore).toBe(42);
    expect(result?.questions).toHaveLength(2);
    expect(parseAdvisorResponse("not-json")).toBeNull();
  });
});
