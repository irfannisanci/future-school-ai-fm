import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHALLENGE_MISSIONS, evaluateChallengeBalance } from "@/lib/game/balance";
import { COMPONENT_LIST, COMPONENTS } from "@/lib/game/catalog";
import { CHALLENGES } from "@/lib/game/challenges";
import { analyzeDesign } from "@/lib/game/diagnostics";
import { evaluateDesign } from "@/lib/game/engine";
import { EVENTS, getEventImpact } from "@/lib/game/events";
import { focusImpactText, getResilienceReport, ratioDropReason, resilienceSummary, scoreDropReason } from "@/lib/game/resilience";
import { EVENT_RESOURCE, RESOURCES, componentEffects, getResourceBalance } from "@/lib/game/resources";
import type { ComponentType, PlacedItem } from "@/lib/game/types";

const item = (id: string, type: ComponentType): PlacedItem => ({ id, type, x: 0, y: 0, width: COMPONENTS[type].width, height: COMPONENTS[type].height });
const many = (type: ComponentType, amount: number) => Array.from({ length: amount }, (_, index) => item(`${type}-${index}`, type));
const base = [item("education", "education"), item("sports", "sports")];
const designs: PlacedItem[][] = [
  base,
  [...base, ...many("rainwater", 3), ...many("shade", 2), ...many("solar", 2), item("bike", "bike")],
  [...base, ...many("green", 4), ...many("wind", 2), ...many("recycling", 1), ...many("greywater", 1), ...many("battery", 1)],
];

// 6. sınıf öğrencisinin anlamadığı yetişkin/tasarımcı kelimeleri (Sprint 08 dil kılavuzu).
const BANNED_STEMS = ["gösterge", "olaysız", "kapasite", "kısıt", "döngüsellik", "verimlilik", "altyapı", "emilim", "şok", "ödünleşim", "optimizasyon", "hücre"];
const BANNED_PHRASES = ["oyun içi", "oyun motoru", "koruma koşulu"];
const MAX_WORDS = 18;

function bannedWords(text: string): string[] {
  const lower = text.toLocaleLowerCase("tr-TR");
  const words = lower.split(/[^\p{L}]+/u);
  return [...BANNED_STEMS.filter((stem) => words.some((word) => word.startsWith(stem))), ...BANNED_PHRASES.filter((phrase) => lower.includes(phrase))];
}

function longSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.split(/\s+/).filter((word) => /[\p{L}\d]/u.test(word)).length > MAX_WORDS);
}

// Öğrencinin ekranda okuduğu, veri modüllerinden gelen bütün metinler.
function studentTexts(): string[] {
  const texts: string[] = [];
  for (const event of EVENTS) texts.push(event.title, event.description);
  for (const challenge of CHALLENGES) texts.push(challenge.title, challenge.description);
  for (const mission of Object.values(CHALLENGE_MISSIONS)) texts.push(mission.title, mission.question);
  for (const component of COMPONENT_LIST) {
    texts.push(component.label, ...component.effects, ...component.risks);
    texts.push(...componentEffects(component.type).map((effect) => effect.text));
  }
  for (const resource of Object.values(RESOURCES)) {
    texts.push(resource.title, resource.question, resource.supplyLabel, resource.demandLabel);
    texts.push(...[...resource.supply, ...resource.demand, ...resource.saving].map((step) => step.reason));
    if (resource.fixedDemand) texts.push(resource.fixedDemand.label, resource.fixedDemand.reason);
  }
  for (const items of designs) {
    for (const event of EVENTS) {
      const note = getResourceBalance(items, EVENT_RESOURCE[event.id], event.id).eventNote;
      if (note) texts.push(note);
      texts.push(focusImpactText("İklim", getEventImpact(items, event.id)));
      const report = getResilienceReport(items, [...items, ...many("shade", 2)], event.id);
      texts.push(resilienceSummary(report));
      texts.push(ratioDropReason(items, event.id, EVENT_RESOURCE[event.id]) ?? "");
      for (const key of ["climate", "water", "energy", "health", "circularity"] as const) texts.push(scoreDropReason(items, event.id, key) ?? "");
    }
    for (const challenge of CHALLENGES) {
      const evaluation = evaluateDesign(items);
      const diagnostic = analyzeDesign(items, evaluation, challenge.id, "heavyRain");
      texts.push(...diagnostic.questions, ...diagnostic.findings.flatMap((finding) => [finding.title, finding.detail, finding.question]));
      texts.push(...evaluateChallengeBalance(items, evaluation, challenge.id, "carbonLimit").criteria.map((criterion) => criterion.label));
    }
  }
  return texts.filter(Boolean);
}

describe("6. sınıf dili", () => {
  it("does not use adult or designer jargon in student-facing data texts", () => {
    const offenders = studentTexts().map((text) => ({ text, words: bannedWords(text) })).filter((entry) => entry.words.length > 0);
    expect(offenders).toEqual([]);
  });

  it("keeps every student-facing sentence short", () => {
    const offenders = studentTexts().flatMap(longSentences);
    expect(offenders).toEqual([]);
  });

  it("keeps jargon out of the screen copy in GameApp", () => {
    const source = readFileSync("src/components/GameApp.tsx", "utf8").split("\n").filter((line) => !line.trimStart().startsWith("//")).join("\n");
    const found = bannedWords(source).filter((word) => word !== "hücre" && word !== "şok");
    expect(found).toEqual([]);
  });

  it("explains the carbon event in short, concrete sentences (kullanıcı örneği)", () => {
    const design = [...base, item("battery", "battery"), ...many("solar", 3), ...many("bike", 3), ...many("recycling", 1), ...many("wind", 1)];
    const note = getResourceBalance(design, "carbon", "carbonLimit").eventNote;
    expect(note).toBe("Yeni kurala göre okulun ürettiği karbon %25 daha fazla sayılıyor. Okulun karbonu: 23 → 29 birim.");
    expect(focusImpactText("İklim", getEventImpact(design, "carbonLimit"))).toBe("Bu olay İklim puanını 25 puan düşürebilirdi. Bileşenlerin bunun hepsini önledi; İklim puanın düşmedi.");
    expect(focusImpactText("Su", { shock: 30, absorbed: 0, loss: 30, absorbers: [] })).toBe("Bu olay Su puanını 30 puan düşürebilirdi. Tasarımında bu olaya karşı koruyan bir bileşen yok. Su puanın 30 puan düştü.");
    expect(focusImpactText("Su", { shock: 30, absorbed: 24, loss: 6, absorbers: [] })).toContain("Su puanın 6 puan düştü.");
  });

  it("explains what carbon is where the student first meets it", () => {
    expect(CHALLENGES.find((challenge) => challenge.id === "carbon")?.description).toMatch(/Karbon, .*gazdır\./);
    expect(EVENTS.find((event) => event.id === "carbonLimit")?.description).toMatch(/^Karbon; .*gazdır\./);
  });

  it("tells the AI to write for a 6th grader and lists the banned words", () => {
    for (const route of ["src/app/api/advisor/route.ts", "src/app/api/math/route.ts"]) {
      const source = readFileSync(route, "utf8");
      expect(source, route).toContain("6. sınıf öğrencisinin ilk okuyuşta anlayacağı");
    }
    const advisor = readFileSync("src/app/api/advisor/route.ts", "utf8");
    for (const word of ["gösterge", "olaysız", "kapasite", "kısıt", "döngüsellik", "emilim", "şok", "koruma koşulu"]) expect(advisor).toContain(word);
  });
});
