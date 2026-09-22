import { COMPONENTS } from "./catalog";
import { ENERGY_LIMIT_SOLAR_FACTOR } from "./energy";
import { evaluateDesign } from "./engine";
import { getEvent, getEventImpact, type EventImpact } from "./events";
import { EVENT_RESOURCE, RESOURCES, getResourceBalance } from "./resources";
import type { ComponentType, DesignEvaluation, EventId, PlacedItem, ResourceId, ScoreKey } from "./types";

export type ResilienceAbsorber = { type: ComponentType; label: string; count: number; points: number; unit: "puan" | "enerji birimi" };

const focusLabels: Record<ScoreKey, string> = { climate: "İklim", water: "Su", energy: "Enerji", health: "Sağlık", circularity: "Doğa" };

export type ResilienceReport = {
  eventId: EventId;
  focus: ScoreKey;
  focusLabel: string;
  impact: EventImpact;
  normal: DesignEvaluation;
  shocked: DesignEvaluation;
  redesigned: DesignEvaluation;
  focusLoss: number;
  focusRecovery: number;
  recoveryPercent: number | null;
  prepared: boolean;
  absorbers: ResilienceAbsorber[];
  ratio: { id: ResourceId; title: string; normal: number; shocked: number; redesigned: number; note?: string };
};

function absorbersFor(items: PlacedItem[], eventId: EventId, normal: DesignEvaluation, shocked: DesignEvaluation): ResilienceAbsorber[] {
  if (eventId === "energyLimit") {
    const batteries = items.filter((item) => item.type === "battery").length;
    const unprotected = Math.round(normal.energyBalance.solarProduction * ENERGY_LIMIT_SOLAR_FACTOR);
    const points = Math.max(0, shocked.energyBalance.solarProduction - unprotected);
    return points > 0 ? [{ type: "battery", label: COMPONENTS.battery.label, count: batteries, points, unit: "enerji birimi" }] : [];
  }
  return getEventImpact(items, eventId).absorbers.map((absorber) => ({ ...absorber, label: COMPONENTS[absorber.type].label, unit: "puan" }));
}

// İlk tasarım hem normal koşulda hem olay altında değerlendirilir; yeniden tasarım yalnızca olay altındaki ilk tasarımla karşılaştırılır.
export function getResilienceReport(initialItems: PlacedItem[], finalItems: PlacedItem[], eventId: EventId): ResilienceReport {
  const focus = getEvent(eventId)!.focus;
  const normal = evaluateDesign(initialItems);
  const shocked = evaluateDesign(initialItems, eventId);
  const redesigned = evaluateDesign(finalItems, eventId);
  const resourceId = EVENT_RESOURCE[eventId];
  const shockedRatio = getResourceBalance(initialItems, resourceId, eventId);
  const focusLoss = normal.scores[focus] - shocked.scores[focus];
  const focusRecovery = redesigned.scores[focus] - shocked.scores[focus];

  return {
    eventId,
    focus,
    focusLabel: focusLabels[focus],
    impact: getEventImpact(initialItems, eventId),
    normal,
    shocked,
    redesigned,
    focusLoss,
    focusRecovery,
    recoveryPercent: focusLoss > 0 ? Math.round(focusRecovery / focusLoss * 100) : null,
    prepared: focusLoss === 0,
    absorbers: absorbersFor(initialItems, eventId, normal, shocked),
    ratio: {
      id: resourceId,
      title: RESOURCES[resourceId].title,
      normal: getResourceBalance(initialItems, resourceId).coveragePercent,
      shocked: shockedRatio.coveragePercent,
      redesigned: getResourceBalance(finalItems, resourceId, eventId).coveragePercent,
      note: shockedRatio.eventNote,
    },
  };
}

// Olayın odak puana etkisi kısa cümlelerle: olay en çok ne kadar düşürebilirdi, bileşenler ne kadarını önledi, ne kadar düştü.
// drop gerçek düşüştür (normal − olayda); puan 0'ın altına inemediği için kalan kayıptan küçük olabilir.
export function focusImpactText(focusLabel: string, impact: EventImpact, drop = impact.loss): string {
  if (impact.shock === 0) return "";
  if (impact.loss === 0) return `Bu olay ${focusLabel} puanını ${impact.shock} puan düşürebilirdi. Bileşenlerin bunun hepsini önledi; ${focusLabel} puanın düşmedi.`;
  const protection = impact.absorbed === 0 ? "Tasarımında bu olaya karşı koruyan bir bileşen yok." : `Bileşenlerin bunun ${impact.absorbed} puanını önledi.`;
  const fall = drop < impact.loss ? `${focusLabel} puanın ${drop} puan düştü, çünkü puan 0'ın altına inemez.` : `${focusLabel} puanın ${impact.loss} puan düştü.`;
  return `Bu olay ${focusLabel} puanını ${impact.shock} puan düşürebilirdi. ${protection} ${fall}`;
}

// Çubuktaki kırmızı parçanın nedeni. Oranlar için olayın oran notu; puanlar için olayın gücü ve bileşenlerin koruması.
export function ratioDropReason(items: PlacedItem[], eventId: EventId, id: ResourceId): string | undefined {
  return getResourceBalance(items, id, eventId).eventNote;
}

export function scoreDropReason(items: PlacedItem[], eventId: EventId, key: ScoreKey): string | undefined {
  const drop = evaluateDesign(items).scores[key] - evaluateDesign(items, eventId).scores[key];
  if (drop <= 0) return undefined;
  // Bulutlu günlerde Enerji puanı, enerji karşılama oranının kendisidir.
  if (eventId === "energyLimit") return `${ratioDropReason(items, eventId, "energy")} Enerji puanı bu orandan hesaplanır.`;
  return focusImpactText(focusLabels[key], getEventImpact(items, eventId), drop);
}

export function resilienceSummary(report: ResilienceReport): string {
  const { focusLabel, focusLoss, focusRecovery, recoveryPercent, shocked, focus, ratio } = report;
  const ratioPart = ratio.normal === ratio.shocked
    ? `${ratio.title} oranın bu olaydan etkilenmedi: %${ratio.normal}.`
    : `Olay, ${ratio.title} oranını düşürdü: %${ratio.normal} → %${ratio.shocked}. Yeniden tasarımla %${ratio.redesigned} oldu.`;
  if (report.eventId === "energyLimit") return ratioPart;
  if (report.prepared) {
    const base = `${ratioPart} ${focusLabel} puanın düşmedi; bileşenlerin onu korudu (olayda da ${shocked.scores[focus]}).`;
    if (focusRecovery > 0) return `${base} Yeniden tasarımla ${focusRecovery} puan daha artırdın.`;
    if (focusRecovery < 0) return `${base} Yeniden tasarımda bu puan ${-focusRecovery} düştü.`;
    return base;
  }
  const pressure = `${ratioPart} ${focusLabel} puanın olayda ${focusLoss} puan düştü.`;
  if (focusRecovery < 0) return `${pressure} Yeniden tasarımda ${-focusRecovery} puan daha düştü.`;
  if (focusRecovery === 0) return `${pressure} Yeniden tasarımla bu kaybı henüz geri kazanmadın.`;
  if (focusRecovery < focusLoss) return `${pressure} Yeniden tasarımla bunun ${focusRecovery} puanını geri kazandın (kaybın %${recoveryPercent} kadarı).`;
  if (focusRecovery === focusLoss) return `${pressure} Yeniden tasarımla kaybın tamamını geri kazandın.`;
  return `${pressure} Yeniden tasarımla kaybın tamamını geri kazandın ve ${focusRecovery - focusLoss} puan daha ileri gittin.`;
}
