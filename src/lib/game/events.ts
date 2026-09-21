import type { EventId, ScoreKey } from "./types";

export type EventCard = {
  id: EventId;
  title: string;
  description: string;
  icon: string;
  focus: ScoreKey;
};

export const EVENTS: EventCard[] = [
  { id: "heatwave", title: "Sıcak Hava Dalgası", description: "2040'ta şehir 7 gün boyunca aşırı sıcak. Gölge ve yeşil alanların kampüsü koruyabilecek mi?", icon: "☀", focus: "climate" },
  { id: "drought", title: "Kuraklık", description: "Kullanılabilir su %30 azaldı. Kampüsün suyu nasıl koruyacak?", icon: "◌", focus: "water" },
  { id: "heavyRain", title: "Aşırı Yağış", description: "Kısa sürede yoğun yağış bekleniyor. Suyu tutacak alanların yeterli mi?", icon: "☂", focus: "water" },
  { id: "energyLimit", title: "Bulutlu Gün ve Enerji Kısıtı", description: "Güneş üretimi %30, şebekeden alınabilen enerji %25 azaldı. Tasarruf ve depolama kampüsü çalıştırabilecek mi?", icon: "⚡", focus: "energy" },
  { id: "activeTransport", title: "Aktif Ulaşım Haftası", description: "Özel araç girişleri azaltılıyor. Öğrenciler okula hareket ederek gelebilir mi?", icon: "🚲", focus: "health" },
  { id: "healthyLiving", title: "Sağlıklı Yaşam Haftası", description: "Öğrencilerin daha çok hareket etmesi ve açık havada zaman geçirmesi gerekiyor. Kampüsün buna hazır mı?", icon: "❤️", focus: "health" },
  { id: "carbonLimit", title: "Karbon Azaltma Hedefi", description: "Kampüsün oyun içi karbon göstergesini düşürmesi gerekiyor. Enerji ve ulaşım kararların yeterli mi?", icon: "🌍", focus: "climate" }
];

export const getEvent = (id?: EventId) => EVENTS.find((event) => event.id === id);
