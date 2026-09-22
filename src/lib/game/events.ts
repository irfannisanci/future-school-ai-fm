import type { ComponentType, EventId, PlacedItem, ScoreKey } from "./types";

export type EventCard = {
  id: EventId;
  title: string;
  description: string;
  icon: string;
  focus: ScoreKey;
  shock: number;
  absorb: Partial<Record<ComponentType, number>>;
};

export type EventImpact = {
  shock: number;
  absorbed: number;
  loss: number;
  absorbers: Array<{ type: ComponentType; count: number; points: number }>;
};

export const EVENTS: EventCard[] = [
  { id: "heatwave", title: "Sıcak Hava Dalgası", description: "2040 yazı: hava 7 gün boyunca çok sıcak. Beton, asfalt ve çatılar %30 daha çok ısınıyor. Ağaçların ve yeşil alanların okulu serin tutabilecek mi?", icon: "☀", focus: "climate", shock: 30, absorb: { shade: 5, green: 3, garden: 2, outdoorClass: 1 } },
  { id: "drought", title: "Kuraklık", description: "Aylardır çok az yağmur yağıyor. Yağmur suyu alanların %30 daha az su topluyor. Okulun suyu yetecek mi?", icon: "◌", focus: "water", shock: 30, absorb: { rainwater: 8, shade: 1 } },
  { id: "heavyRain", title: "Aşırı Yağış", description: "Bir anda çok fazla yağmur yağıyor. Beton ve asfalt suyu emmiyor; bu yüzeylerden %50 daha çok su akıyor. Yağmuru tutacak yerlerin yeterli mi?", icon: "☂", focus: "water", shock: 30, absorb: { rainwater: 8, green: 3, garden: 2 } },
  { id: "energyLimit", title: "Bulutlu Günler", description: "Günlerdir hava bulutlu. Güneş panelleri %30 daha az elektrik üretiyor. Rüzgâr, tasarruf ve enerji depolama okulu çalıştırabilecek mi?", icon: "⚡", focus: "energy", shock: 0, absorb: {} },
  { id: "activeTransport", title: "Arabasız Okul Haftası", description: "Bu hafta okulun önüne araba giremiyor. Artık öğrencilerin %45'i okula yürüyerek veya bisikletle gelmeli (önceki hedef %30). Okulunda onlara yetecek yer var mı?", icon: "🚲", focus: "health", shock: 25, absorb: { bike: 8, path: 6, shade: 2 } },
  { id: "healthyLiving", title: "Sağlıklı Yaşam Haftası", description: "Bu hafta hedef büyüdü: teneffüste öğrencilerin yarısı (%50) hareket edebilmeli (önceki hedef %40). Okulunda herkese yer var mı?", icon: "❤️", focus: "health", shock: 25, absorb: { bike: 4, shade: 3, outdoorClass: 3, green: 2, garden: 2 } },
  { id: "carbonLimit", title: "Yeni Karbon Kuralı", description: "Karbon; ısıtma, elektrik ve arabalardan havaya karışan, dünyayı ısıtan bir gazdır. 2040'ta şehir yeni bir kural koydu: okulların karbonu %25 daha fazla sayılıyor. Temiz enerji ve ulaşım kararların yeterli mi?", icon: "🌍", focus: "climate", shock: 25, absorb: { solar: 4, wind: 4, bike: 3, recycling: 3, path: 1, green: 2, shade: 2 } }
];

export const getEvent = (id?: EventId) => EVENTS.find((event) => event.id === id);

// Olay odak puanda sabit bir düşüş (shock) üretir; koruyan bileşenler bunu azaltır (absorb). Koruma düşüşü aşamaz: olay hiçbir zaman puan artırmaz.
// Bulutlu günler olayının sabit düşüşü 0'dır; etkisi energy.ts içinde üretim üzerinden hesaplanır.
export function getEventImpact(items: PlacedItem[], eventId?: EventId): EventImpact {
  const event = getEvent(eventId);
  if (!event || event.shock === 0) return { shock: 0, absorbed: 0, loss: 0, absorbers: [] };
  let remaining = event.shock;
  const absorbers: EventImpact["absorbers"] = [];
  for (const [type, perItem] of Object.entries(event.absorb) as Array<[ComponentType, number]>) {
    const count = items.filter((item) => item.type === type).length;
    const points = Math.min(remaining, count * perItem);
    if (points === 0) continue;
    remaining -= points;
    absorbers.push({ type, count, points });
  }
  return { shock: event.shock, absorbed: event.shock - remaining, loss: remaining, absorbers };
}
