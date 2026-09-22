import { describe, expect, it } from "vitest";
import { fallbackMathResult, parseMathInput, parseMathResponse } from "@/lib/ai/math";

describe("AI math tutor contract", () => {
  it("validates input and verifies the model calculation", () => {
    const input = parseMathInput({ gradeBand: "6", challengeId: "heat", numeratorLabel: "yeşil kare", numerator: 6, denominator: 24, expectedNumerator: 6, expectedDenominator: 24 });
    expect(input).not.toBeNull();
    const result = parseMathResponse(JSON.stringify({ simplifiedNumerator: 1, simplifiedDenominator: 4, decimal: 0.25, percentage: 25, explanation: "6 sayısını 24 sayısına böleriz. Sonuç yüzde 25 olur.", hint: "Kareleri doğru saydın." }), input!);
    expect(result).toMatchObject({ matchesDesign: true, percentage: 25 });
  });

  it("rejects incorrect arithmetic returned by the model", () => {
    const input = parseMathInput({ gradeBand: "6", challengeId: "heat", numeratorLabel: "yeşil kare", numerator: 6, denominator: 24, expectedNumerator: 8, expectedDenominator: 24 })!;
    expect(parseMathResponse(JSON.stringify({ simplifiedNumerator: 1, simplifiedDenominator: 3, decimal: 0.33, percentage: 33, explanation: "Bu açıklama yeterince uzundur.", hint: "Tekrar saymayı dene." }), input)).toBeNull();
  });

  it("continues deterministically when the AI tutor is unavailable", () => {
    const correct = parseMathInput({ gradeBand: "6", challengeId: "heat", numeratorLabel: "yeşil kare", numerator: 6, denominator: 24, expectedNumerator: 6, expectedDenominator: 24 })!;
    expect(fallbackMathResult(correct)).toMatchObject({ matchesDesign: true, simplifiedNumerator: 1, simplifiedDenominator: 4, decimal: 0.25, percentage: 25 });

    const wrong = fallbackMathResult({ ...correct, numerator: 5 });
    expect(wrong.matchesDesign).toBe(false);
    expect(wrong.hint).not.toContain("6");
  });
});
