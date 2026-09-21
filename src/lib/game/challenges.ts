import type { ChallengeId, ComponentType, PlacedItem } from "./types";
import { getEnergyBalance } from "./energy";
import { footprintCells } from "./catalog";

export type ChallengeDefinition = {
  id: ChallengeId;
  emoji: string;
  title: string;
  description: string;
  numeratorLabel: string;
  supportTypes: ComponentType[];
};

export const CHALLENGES: ChallengeDefinition[] = [
  { id: "heat", emoji: "🌡️", title: "Aşırı sıcak", description: "Okul bahçesini daha serin ve gölgeli yap.", numeratorLabel: "serinlemeyi destekleyen kare", supportTypes: ["green", "shade", "garden", "outdoorClass"] },
  { id: "drought", emoji: "💧", title: "Kuraklık", description: "Suyu koruyan ve yeniden kullanan bir kampüs kur.", numeratorLabel: "suyu koruyan kare", supportTypes: ["rainwater", "green", "garden"] },
  { id: "heavyRain", emoji: "🌧️", title: "Yoğun yağış", description: "Yağmur suyunu tutabilecek alanlar oluştur.", numeratorLabel: "yağmuru yöneten kare", supportTypes: ["rainwater", "green", "garden"] },
  { id: "energy", emoji: "⚡", title: "Enerji kısıtı", description: "Üretim ve tasarrufu dengele; yeşil alanı koruyarak enerji ihtiyacının en az %70'ini karşıla.", numeratorLabel: "üretilen temiz enerji birimi", supportTypes: ["solar", "insulation", "daylight", "battery", "shade"] },
  { id: "activeTransport", emoji: "🚲", title: "Aktif ve çevreci ulaşım", description: "Öğrencilerin hareket ederek okula gelmesini destekle.", numeratorLabel: "aktif ulaşımı destekleyen kare", supportTypes: ["bike"] },
  { id: "healthyLiving", emoji: "❤️", title: "Sağlıklı yaşam", description: "Hareket, dinlenme ve açık hava için alanlar oluştur.", numeratorLabel: "sağlıklı yaşamı destekleyen kare", supportTypes: ["sports", "green", "bike", "shade", "garden", "outdoorClass"] },
  { id: "carbon", emoji: "🌍", title: "Karbon ayak izini azaltma", description: "Enerji ve ulaşım seçimleriyle oyun içi karbon göstergesini azalt.", numeratorLabel: "düşük karbonu destekleyen kare", supportTypes: ["green", "solar", "recycling", "bike", "shade", "garden"] },
];

export function getChallenge(id?: ChallengeId): ChallengeDefinition | undefined {
  return CHALLENGES.find((challenge) => challenge.id === id);
}

export function getChallengeRatio(items: PlacedItem[], challengeId: ChallengeId) {
  const challenge = getChallenge(challengeId)!;
  if (challengeId === "energy") {
    const energy = getEnergyBalance(items);
    return {
      numerator: energy.renewableProduction,
      denominator: energy.netDemand,
      numeratorLabel: challenge.numeratorLabel,
      denominatorLabel: "okulun net enerji ihtiyacı",
    };
  }
  const numerator = items
    .filter((item) => challenge.supportTypes.includes(item.type))
    .reduce((total, item) => total + footprintCells(item), 0);
  const denominator = items.reduce((total, item) => total + footprintCells(item), 0);

  return {
    numerator,
    denominator,
    numeratorLabel: challenge.numeratorLabel,
    denominatorLabel: "kullanılan toplam kare",
  };
}
