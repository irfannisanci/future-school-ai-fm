import type { ComponentDefinition, ComponentType, Contributions, PlacedItem } from "./types";

const c = (climate: number, water: number, energy: number, health: number, circularity: number): Contributions => ({
  climate, water, energy, health, circularity
});

export const COMPONENTS: Record<ComponentType, ComponentDefinition> = {
  education: { type: "education", label: "Eğitim binası", shortLabel: "Eğitim", width: 2, height: 3, cost: 18, color: "#315f87", landUse: "building", required: true, contributions: c(2, 0, 0, 2, 1), effects: ["Okulun sınıfları bu binadadır"], risks: ["Lambalar, ısıtma ve lavabolar enerji ve su harcar", "Beton ve çatı yağmuru emmez, güneşte ısınır"] },
  sports: { type: "sports", label: "Spor salonu", shortLabel: "Spor", width: 2, height: 2, cost: 12, color: "#d46b45", landUse: "building", required: true, contributions: c(0, 0, 0, 18, 0), effects: ["Yağmurda da karda da spor yapılır"], risks: ["Havalandırma, lambalar ve duşlar enerji ve su harcar", "Geniş çatısı yağmuru emmez, güneşte ısınır"] },
  green: { type: "green", label: "Yeşil alan", shortLabel: "Yeşil", width: 1, height: 1, cost: 2, color: "#6a9b59", landUse: "open", contributions: c(8, 4, 0, 2, 6), effects: ["Çim güneşte betondan az ısınır, yağmuru emer", "Öğrencilere oyun alanı olur"], risks: ["Çim yazın sulanmak ister"] },
  solar: { type: "solar", label: "Güneş paneli", shortLabel: "Güneş", width: 1, height: 1, cost: 5, color: "#e6b94e", landUse: "infrastructure", contributions: c(2, 0, 0, 0, -1), effects: ["Güneşten temiz elektrik üretir"], risks: ["En güneşli yerler ilk 3 panelle dolar; sonrakiler az üretir", "Koyu yüzeyi güneşte ısınır ve yer kaplar", "Eskiyen paneli geri dönüştürmek zordur", "Bulutlu günde az üretir"] },
  rainwater: { type: "rainwater", label: "Yağmur suyu alanı", shortLabel: "Su", width: 1, height: 1, cost: 4, color: "#4d9cc1", landUse: "open", contributions: c(3, 20, 0, -2, 1), effects: ["Yağmuru biriktirir; bu su bahçeyi sular", "Su, çevresindeki havayı serinletir"], risks: ["Kıpırdamayan su sivrisinek çeker", "Çatı küçük olduğu için 3. depodan sonra az su toplanır"] },
  recycling: { type: "recycling", label: "Geri dönüşüm merkezi", shortLabel: "Dönüşüm", width: 1, height: 1, cost: 3, color: "#7f8c55", landUse: "building", contributions: c(1, 0, 0, -2, 18), effects: ["Kâğıt, plastik ve camı yeniden kullanılır hâle getirir"], risks: ["Kötü koku yapar, atık kamyonları gelip gider", "Atıkları ayıran makineler enerji harcar"] },
  bike: { type: "bike", label: "Bisiklet parkı", shortLabel: "Bisiklet", width: 1, height: 1, cost: 2, color: "#7b6fc2", landUse: "open", contributions: c(5, 0, 0, 8, 0), effects: ["20 bisiklete yer açar; daha az öğrenci arabayla gelir"], risks: ["Asfalt zemin yağmuru emmez ve güneşte ısınır"] },
  shade: { type: "shade", label: "Ağaç / gölgelik", shortLabel: "Gölge", width: 1, height: 1, cost: 2, color: "#397254", landUse: "open", contributions: c(8, 1, 0, 3, 4), effects: ["Gölgesi zemini ve binayı serin tutar", "Kökleri yağmuru toprağa çeker"], risks: ["Genç ağaçlar sulanmak ister"] },
  garden: { type: "garden", label: "Öğrenci bahçesi", shortLabel: "Bahçe", width: 1, height: 1, cost: 3, color: "#9aaf54", landUse: "open", contributions: c(4, 2, 0, 2, 8), effects: ["Öğrenciler sebze ve çiçek yetiştirerek öğrenir"], risks: ["Sebze ve çiçekler çok su ister"] },
  outdoorClass: { type: "outdoorClass", label: "Açık hava sınıfı", shortLabel: "Açık sınıf", width: 1, height: 1, cost: 3, color: "#3b8f88", landUse: "open", contributions: c(3, 1, 0, 3, 4), effects: ["Dersler açık havada yapılır"], risks: ["Sert zemini yağmuru emmez"] },
  insulation: { type: "insulation", label: "Bina yalıtımı", shortLabel: "Yalıtım", width: 1, height: 1, cost: 5, color: "#b36a43", landUse: "upgrade", contributions: c(4, 0, 0, 1, -2), effects: ["Kışın ısı dışarı kaçmaz; yazın bina az ısınır"], risks: ["Yalıtım malzemesini geri dönüştürmek zordur", "Her yeni yalıtım bir öncekinden az işe yarar"] },
  daylight: { type: "daylight", label: "Gün ışığı pencereleri", shortLabel: "Gün ışığı", width: 1, height: 1, cost: 3, color: "#e3a95b", landUse: "upgrade", contributions: c(-3, 0, 0, 2, 1), effects: ["Gündüz lamba yakmak gerekmez; gün ışığı sağlığa iyi gelir"], risks: ["Büyük pencereler yazın binayı ısıtır"] },
  battery: { type: "battery", label: "Enerji depolama", shortLabel: "Depolama", width: 1, height: 1, cost: 7, color: "#536777", landUse: "infrastructure", contributions: c(1, 0, 0, 0, -4), effects: ["Güneşli günün elektriğini saklar; bulutlu günde en çok 3 birim geri verir"], risks: ["Kendisi elektrik üretmez", "Eskiyen pil zararlı bir atıktır"] },
  wind: { type: "wind", label: "Rüzgâr türbini", shortLabel: "Rüzgâr", width: 1, height: 1, cost: 8, color: "#6c8fb0", landUse: "infrastructure", contributions: c(3, 0, 0, -4, -3), effects: ["Rüzgârdan temiz elektrik üretir", "Bulutlu havada da çalışır"], risks: ["Gürültüsü dersi ve teneffüsü rahatsız eder", "Dönen kanatları kuşlara çarpabilir", "Türbinler birbirinin rüzgârını keser"] },
  path: { type: "path", label: "Yaya yolu", shortLabel: "Yaya yolu", width: 1, height: 1, cost: 2, color: "#a08c72", landUse: "open", contributions: c(2, 0, 0, 5, 0), effects: ["15 öğrenci okula güvenle yürüyerek gelir"], risks: ["Sert zemini yağmuru emmez ve güneşte ısınır"] },
  greywater: { type: "greywater", label: "Gri su arıtma", shortLabel: "Gri su", width: 1, height: 1, cost: 6, color: "#5a8f9c", landUse: "upgrade", contributions: c(0, 12, 0, 0, 4), effects: ["Lavaboda kullanılan suyu temizler; bu su bahçeyi sular"], risks: ["Suyu temizleyen pompa enerji harcar"] }
};

export const COMPONENT_LIST = Object.values(COMPONENTS);
export const BUILT_TYPES: ComponentType[] = ["education", "sports", "recycling"];
export const GREEN_TYPES: ComponentType[] = ["green", "shade", "garden", "outdoorClass"];

export function footprintCells(item: PlacedItem): number {
  return COMPONENTS[item.type].landUse === "upgrade" ? 0 : item.width * item.height;
}
