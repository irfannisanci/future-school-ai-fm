import type { ComponentDefinition, ComponentType, Contributions, PlacedItem } from "./types";

const c = (climate: number, water: number, energy: number, health: number, circularity: number): Contributions => ({
  climate, water, energy, health, circularity
});

export const COMPONENTS: Record<ComponentType, ComponentDefinition> = {
  education: { type: "education", label: "Eğitim binası", shortLabel: "Eğitim", width: 2, height: 3, cost: 18, color: "#315f87", landUse: "building", contributions: c(2, 0, 0, 2, 1), helps: [], effects: ["12 enerji birimi ihtiyacı oluşturur"], risks: ["Yeşil alanı azaltır", "Enerji kullanır"] },
  sports: { type: "sports", label: "Spor salonu", shortLabel: "Spor", width: 2, height: 2, cost: 12, color: "#d46b45", landUse: "building", required: true, contributions: c(0, 0, 0, 18, 0), helps: ["healthyLiving"], effects: ["Sağlık göstergesini artırır", "8 enerji birimi ihtiyacı oluşturur"], risks: ["Fazla alan kaplar", "Enerji kullanır"] },
  green: { type: "green", label: "Yeşil alan", shortLabel: "Yeşil", width: 1, height: 1, cost: 2, color: "#6a9b59", landUse: "open", contributions: c(8, 4, 0, 2, 6), helps: ["heat", "drought", "heavyRain", "healthyLiving", "carbon"], effects: ["İklim, su ve doğa göstergelerini destekler", "Açık alan oranını düşürmez"], risks: ["Bakım ve sulama ister"] },
  solar: { type: "solar", label: "Güneş paneli", shortLabel: "Güneş", width: 1, height: 1, cost: 5, color: "#e6b94e", landUse: "infrastructure", contributions: c(2, 0, 18, 0, 0), helps: ["energy", "carbon"], effects: ["İlk 3 panelin her biri 5 enerji üretir", "Sonraki panellerin her biri 2 enerji üretir"], risks: ["Kurulum bütçesi yüksektir", "Zeminde kullanılabilir açık alanı azaltır"] },
  rainwater: { type: "rainwater", label: "Yağmur suyu alanı", shortLabel: "Su", width: 1, height: 1, cost: 4, color: "#4d9cc1", landUse: "open", contributions: c(3, 20, 0, 0, 1), helps: ["drought", "heavyRain"], effects: ["Su göstergesini güçlü biçimde artırır", "Açık alan oranını düşürmez"], risks: ["Bakım gerektirir"] },
  recycling: { type: "recycling", label: "Geri dönüşüm merkezi", shortLabel: "Dönüşüm", width: 1, height: 1, cost: 3, color: "#7f8c55", landUse: "building", contributions: c(1, 0, 0, 0, 18), helps: ["carbon"], effects: ["Doğa göstergesini artırır", "2 enerji birimi ihtiyacı oluşturur"], risks: ["Yerleşim için alan ayırır"] },
  bike: { type: "bike", label: "Bisiklet parkı", shortLabel: "Bisiklet", width: 1, height: 1, cost: 2, color: "#7b6fc2", landUse: "open", contributions: c(5, 0, 0, 8, 0), helps: ["activeTransport", "healthyLiving", "carbon"], effects: ["Sağlık ve iklim göstergelerini artırır", "Üstü açık olduğu için açık alan oranını düşürmez"], risks: ["Başka kullanımlar için alanı azaltır"] },
  shade: { type: "shade", label: "Ağaç / gölgelik", shortLabel: "Gölge", width: 1, height: 1, cost: 2, color: "#397254", landUse: "open", contributions: c(8, 1, 0, 3, 4), helps: ["heat", "healthyLiving", "carbon", "energy"], effects: ["En fazla 2 enerji birimi tasarrufuna katkı verir", "İklim ve sağlık göstergelerini artırır", "Açık alan oranını düşürmez"], risks: ["Bakım gerektirir"] },
  garden: { type: "garden", label: "Öğrenci bahçesi", shortLabel: "Bahçe", width: 1, height: 1, cost: 3, color: "#9aaf54", landUse: "open", contributions: c(4, 2, 0, 2, 8), helps: ["heat", "drought", "heavyRain", "healthyLiving", "carbon"], effects: ["Doğa ve sağlık göstergelerini destekler", "Açık alan oranını düşürmez"], risks: ["Su ve bakım ister"] },
  outdoorClass: { type: "outdoorClass", label: "Açık hava sınıfı", shortLabel: "Açık sınıf", width: 1, height: 1, cost: 3, color: "#3b8f88", landUse: "open", contributions: c(3, 1, 0, 3, 4), helps: ["heat", "healthyLiving"], effects: ["Açık hava öğrenmesini destekler", "Açık alan oranını düşürmez"], risks: ["Hava koşullarından etkilenir"] },
  insulation: { type: "insulation", label: "Yalıtım ve verimlilik", shortLabel: "Yalıtım", width: 1, height: 1, cost: 5, color: "#b36a43", landUse: "upgrade", contributions: c(4, 0, 15, 1, 2), helps: ["energy", "carbon"], effects: ["İlk uygulama 4, ikincisi 3 enerji birimi tasarruf ettirir", "Bina iyileştirmesi olduğu için arazi alanı kullanmaz"], risks: ["Sonraki uygulamaların tasarrufu azalır", "Başlangıç bütçesi gerektirir"] },
  daylight: { type: "daylight", label: "Doğal aydınlatma", shortLabel: "Gün ışığı", width: 1, height: 1, cost: 3, color: "#e3a95b", landUse: "upgrade", contributions: c(2, 0, 12, 2, 1), helps: ["energy", "healthyLiving", "carbon"], effects: ["İlk uygulama 3, ikincisi 2 enerji birimi tasarruf ettirir", "Bina iyileştirmesi olduğu için arazi alanı kullanmaz"], risks: ["Sonraki uygulamaların tasarrufu azalır"] },
  battery: { type: "battery", label: "Enerji depolama", shortLabel: "Depolama", width: 1, height: 1, cost: 7, color: "#536777", landUse: "infrastructure", contributions: c(1, 0, 8, 0, 1), helps: ["energy"], effects: ["Enerji kısıtı olayında 3 birim üretimi korur"], risks: ["Normal koşulda enerji üretmez", "Bütçesi yüksektir", "Zeminde kullanılabilir açık alanı azaltır"] }
};

export const COMPONENT_LIST = Object.values(COMPONENTS);
export const BUILT_TYPES: ComponentType[] = ["education", "sports", "recycling"];
export const GREEN_TYPES: ComponentType[] = ["green", "shade", "garden", "outdoorClass"];

export function footprintCells(item: PlacedItem): number {
  return COMPONENTS[item.type].landUse === "upgrade" ? 0 : item.width * item.height;
}
