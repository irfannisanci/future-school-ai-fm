import type { ChallengeId, PlacedItem } from "./types";
import { challengeResource, getResourceBalance, CHALLENGE_RESOURCE } from "./resources";

export type ChallengeDefinition = {
  id: ChallengeId;
  emoji: string;
  title: string;
  description: string;
};

export const CHALLENGES: ChallengeDefinition[] = [
  { id: "heat", emoji: "🌡️", title: "Aşırı sıcak", description: "Güneşte ısınan beton ve asfaltı ağaç, gölgelik ve yeşil alanla serinlet." },
  { id: "drought", emoji: "💧", title: "Kuraklık", description: "Okulun harcadığı suyu, kendi topladığı ve yeniden kullandığı suyla karşıla." },
  { id: "heavyRain", emoji: "🌧️", title: "Yoğun yağış", description: "Beton ve asfalttan akıp giden yağmuru biriktir ve toprağa emdir." },
  { id: "energy", emoji: "⚡", title: "Temiz enerji", description: "Güneş, rüzgâr ve tasarrufla okulun harcadığı enerjinin en az %70'ini karşıla." },
  { id: "activeTransport", emoji: "🚲", title: "Aktif ve çevreci ulaşım", description: "Öğrencilerin %30'u okula yürüyerek veya bisikletle gelebilsin." },
  { id: "healthyLiving", emoji: "❤️", title: "Sağlıklı yaşam", description: "Teneffüste öğrencilerin %40'ı koşup oynayabilsin." },
  { id: "carbon", emoji: "🌍", title: "Karbon ayak izini azaltma", description: "Karbon, havayı kirleten ve dünyayı ısıtan bir gazdır. Okulun ürettiği karbonun en az %70'ini azalt." },
];

export function getChallenge(id?: ChallengeId): ChallengeDefinition | undefined {
  return CHALLENGES.find((challenge) => challenge.id === id);
}

export function getChallengeRatio(items: PlacedItem[], challengeId: ChallengeId) {
  const resource = challengeResource(challengeId);
  const balance = getResourceBalance(items, CHALLENGE_RESOURCE[challengeId]);
  return {
    numerator: balance.supply,
    denominator: balance.netDemand,
    numeratorLabel: resource.supplyLabel,
    denominatorLabel: resource.demandLabel,
  };
}
