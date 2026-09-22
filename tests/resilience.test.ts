import { describe, expect, it } from "vitest";
import { COMPONENTS } from "@/lib/game/catalog";
import { getResilienceReport, resilienceSummary, scoreDropReason } from "@/lib/game/resilience";
import type { ComponentType, PlacedItem } from "@/lib/game/types";

const item = (id: string, type: ComponentType): PlacedItem => ({ id, type, x: 0, y: 0, width: COMPONENTS[type].width, height: COMPONENTS[type].height });
const many = (type: ComponentType, amount: number) => Array.from({ length: amount }, (_, index) => item(`${type}-${index}`, type));
const base = [item("education", "education"), item("sports", "sports")];

describe("resilience report", () => {
  it("reports zero change when the team redesigns nothing", () => {
    const design = [...base, ...many("green", 4), ...many("rainwater", 1)];
    const report = getResilienceReport(design, design, "drought");
    expect(report.redesigned).toEqual(report.shocked);
    expect(report.focusRecovery).toBe(0);
    expect(report.focusLoss).toBe(22);
    expect(resilienceSummary(report)).toContain("henüz geri kazanmadın");
  });

  it("measures recovery against the shocked first design, not the no-event one", () => {
    const initial = [...base, ...many("green", 4), ...many("rainwater", 2)];
    const final = [...initial, ...many("rainwater", 1)];
    const report = getResilienceReport(initial, final, "drought");
    expect(report.focus).toBe("water");
    expect(report.normal.scores.water).toBe(56);
    expect(report.shocked.scores.water).toBe(42);
    expect(report.redesigned.scores.water).toBe(70);
    expect(report.focusLoss).toBe(14);
    expect(report.focusRecovery).toBe(28);
    expect(report.recoveryPercent).toBe(200);
    expect(resilienceSummary(report)).toContain("14 puan daha ileri gittin");
  });

  it("reports a partial recovery as a percentage of the loss", () => {
    const initial = [...base, ...many("bike", 1)];
    const final = [...initial, ...many("shade", 2)];
    const report = getResilienceReport(initial, final, "activeTransport");
    expect(report.focusLoss).toBe(17);
    expect(report.focusRecovery).toBe(10);
    expect(report.recoveryPercent).toBe(59);
    expect(resilienceSummary(report)).toContain("10 puanını geri kazandın (kaybın %59 kadarı)");
  });

  it("reports the ratio chain the student tracks, not only the indicator", () => {
    const initial = [...base, ...many("rainwater", 3)];
    const final = [...initial, ...many("green", 6)];
    const report = getResilienceReport(initial, final, "heavyRain");
    expect(report.ratio).toMatchObject({ id: "rain", title: "Yağmur tutma", normal: 120, shocked: 80, redesigned: 100 });
    expect(report.ratio.note).toContain("%50");
    expect([report.normal.scores.water, report.shocked.scores.water]).toEqual([60, 54]);
  });

  it("recognizes a design that was already prepared", () => {
    const design = [...base, ...many("shade", 6)];
    const report = getResilienceReport(design, design, "heatwave");
    expect(report.prepared).toBe(true);
    expect(report.recoveryPercent).toBeNull();
    expect(report.absorbers).toEqual([{ type: "shade", label: "Ağaç / gölgelik", count: 6, points: 30, unit: "puan" }]);
    expect(resilienceSummary(report)).toContain("bileşenlerin onu korudu");
    expect(resilienceSummary(report)).toContain("Serinletme oranını düşürdü: %90 → %69");
  });

  it("credits storage for protected production under the energy limit", () => {
    const design = [...base, ...many("solar", 3), ...many("battery", 1)];
    const report = getResilienceReport(design, design, "energyLimit");
    expect(report.focus).toBe("energy");
    expect(report.absorbers).toEqual([{ type: "battery", label: "Enerji depolama", count: 1, points: 3, unit: "enerji birimi" }]);
    expect(report.shocked.energyBalance.renewableProduction).toBe(14);
    expect(report.focusLoss).toBeGreaterThan(0);
  });

  it("explains why a score dropped, using the real drop when the score hits 0", () => {
    const bare = [...base];
    expect(bare.length).toBe(2);
    // Sağlık puanı 20; olay 25 puan düşürebilir, koruyan bileşen yok; puan 0'ın altına inemez.
    expect(scoreDropReason(bare, "activeTransport", "health")).toBe("Bu olay Sağlık puanını 25 puan düşürebilirdi. Tasarımında bu olaya karşı koruyan bir bileşen yok. Sağlık puanın 20 puan düştü, çünkü puan 0'ın altına inemez.");
    const withBike = [...base, ...many("bike", 1), ...many("green", 3)];
    expect(scoreDropReason(withBike, "activeTransport", "health")).toBe("Bu olay Sağlık puanını 25 puan düşürebilirdi. Bileşenlerin bunun 8 puanını önledi. Sağlık puanın 17 puan düştü.");
    expect(scoreDropReason(withBike, "activeTransport", "water")).toBeUndefined();
    const solar = [...base, ...many("solar", 3)];
    expect(scoreDropReason(solar, "energyLimit", "energy")).toContain("Bulutlu günde güneş panellerin %30 daha az elektrik üretiyor: 15 → 11 birim.");
  });
});
