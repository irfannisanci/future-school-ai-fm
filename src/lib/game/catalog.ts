import type { ComponentDefinition, ComponentType, Contributions } from "./types";

const c = (climate: number, water: number, energy: number, health: number, circularity: number): Contributions => ({
  climate, water, energy, health, circularity
});

export const COMPONENTS: Record<ComponentType, ComponentDefinition> = {
  education: { type: "education", label: "Eğitim binası", shortLabel: "Eğitim", width: 2, height: 3, cost: 18, color: "#315f87", contributions: c(2, 0, 0, 2, 1) },
  sports: { type: "sports", label: "Spor salonu", shortLabel: "Spor", width: 2, height: 2, cost: 12, color: "#d46b45", contributions: c(0, 0, 0, 18, 0) },
  green: { type: "green", label: "Yeşil alan", shortLabel: "Yeşil", width: 1, height: 1, cost: 2, color: "#6a9b59", contributions: c(8, 4, 0, 2, 6) },
  solar: { type: "solar", label: "Güneş paneli", shortLabel: "Güneş", width: 1, height: 1, cost: 5, color: "#e6b94e", contributions: c(2, 0, 18, 0, 0) },
  rainwater: { type: "rainwater", label: "Yağmur suyu alanı", shortLabel: "Su", width: 1, height: 1, cost: 4, color: "#4d9cc1", contributions: c(3, 20, 0, 0, 1) },
  recycling: { type: "recycling", label: "Geri dönüşüm merkezi", shortLabel: "Dönüşüm", width: 1, height: 1, cost: 3, color: "#7f8c55", contributions: c(1, 0, 0, 0, 18) },
  bike: { type: "bike", label: "Bisiklet parkı", shortLabel: "Bisiklet", width: 1, height: 1, cost: 2, color: "#7b6fc2", contributions: c(5, 0, 0, 8, 0) },
  shade: { type: "shade", label: "Ağaç / gölgelik", shortLabel: "Gölge", width: 1, height: 1, cost: 2, color: "#397254", contributions: c(8, 1, 0, 3, 4) },
  garden: { type: "garden", label: "Öğrenci bahçesi", shortLabel: "Bahçe", width: 1, height: 1, cost: 3, color: "#9aaf54", contributions: c(4, 2, 0, 2, 8) },
  outdoorClass: { type: "outdoorClass", label: "Açık hava sınıfı", shortLabel: "Açık sınıf", width: 1, height: 1, cost: 3, color: "#3b8f88", contributions: c(3, 1, 0, 3, 4) }
};

export const COMPONENT_LIST = Object.values(COMPONENTS);
export const BUILT_TYPES: ComponentType[] = ["education", "sports", "recycling"];
export const GREEN_TYPES: ComponentType[] = ["green", "shade", "garden", "outdoorClass"];
