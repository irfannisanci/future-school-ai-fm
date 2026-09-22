import { COMPONENTS } from "./catalog";
import { getEnergyBalance } from "./energy";
import type { ChallengeId, ComponentType, EventId, PlacedItem, ResourceBalance, ResourceId, ResourceRow } from "./types";

type Step = { type: ComponentType; values: number[]; reason: string };
type Phrases = { supply: string; demand?: string; saving?: string };

export type ResourceDefinition = {
  id: ResourceId;
  title: string;
  question: string;
  unit: string;
  supplyLabel: string;
  demandLabel: string;
  supply: Step[];
  demand: Step[];
  saving: Step[];
  fixedDemand?: { students: number; percent: number; label: string; reason: string };
  minNet: number;
  phrases: Phrases;
};

export const SCHOOL_STUDENTS = 500;

// Değerler eğitsel oyun birimidir; gerçek mühendislik ölçümü değildir. Dizideki her sayı bir sonraki bileşenin katkısıdır; son sayı tekrar eder (azalan getiri).
export const RESOURCES: Record<ResourceId, ResourceDefinition> = {
  energy: {
    id: "energy", title: "Enerji karşılama", question: "Temiz enerji okulun enerji ihtiyacının ne kadarını karşılıyor?", unit: "enerji birimi",
    supplyLabel: "üretilen temiz enerji", demandLabel: "okulun harcadığı enerji", minNet: 5,
    supply: [
      { type: "solar", values: [5, 5, 5, 2], reason: "En güneşli yerler ilk 3 panelle dolar; sonraki paneller az üretir." },
      { type: "wind", values: [6, 6, 3], reason: "Türbinler birbirinin rüzgârını keser; ilk 2 türbinden sonrakiler az üretir." },
    ],
    demand: [
      { type: "education", values: [12], reason: "Lambalar, ısıtma ve bilgisayarlar enerji harcar." },
      { type: "sports", values: [8], reason: "Havalandırma ve lambalar enerji harcar." },
      { type: "recycling", values: [2], reason: "Atıkları ayıran makineler enerji harcar." },
      { type: "greywater", values: [1], reason: "Suyu temizleyen pompa enerji harcar." },
    ],
    saving: [
      { type: "insulation", values: [4, 3, 1], reason: "Binanın ısısı dışarı kaçmaz. Her yeni yalıtım bir öncekinden az işe yarar." },
      { type: "daylight", values: [3, 2, 1], reason: "Gündüz lamba yakmak gerekmez. Her yeni pencere bir öncekinden az işe yarar." },
      { type: "shade", values: [1, 1, 0], reason: "Binayı gölgeler, klima az çalışır. En fazla 2 ağaç işe yarar." },
    ],
    phrases: { supply: "{v} enerji birimi üretir", demand: "{v} enerji birimi harcar", saving: "{v} enerji birimi tasarruf ettirir" },
  },
  water: {
    id: "water", title: "Su karşılama", question: "Okulun kendi suyu, su ihtiyacının ne kadarını karşılıyor?", unit: "su birimi",
    supplyLabel: "okulun topladığı ve yeniden kullandığı su", demandLabel: "okulun harcadığı su", minNet: 1,
    supply: [
      { type: "rainwater", values: [6, 6, 6, 3], reason: "Yağmur çatıdan toplanır. Çatı küçük olduğu için 3. depodan sonra az su toplanır." },
      { type: "greywater", values: [5, 3], reason: "Lavaboda kullanılan suyu temizler; bu su bahçede yeniden kullanılır." },
    ],
    demand: [
      { type: "education", values: [8], reason: "Lavabolar ve tuvaletler su harcar." },
      { type: "sports", values: [6], reason: "Duşlar ve temizlik su harcar." },
      { type: "green", values: [1], reason: "Çim yazın sulanmak ister." },
      { type: "shade", values: [1], reason: "Genç ağaçlar sulanmak ister." },
      { type: "garden", values: [2], reason: "Sebze ve çiçekler çok su ister." },
    ],
    saving: [],
    phrases: { supply: "{v} su birimi sağlar", demand: "{v} su birimi harcar" },
  },
  rain: {
    id: "rain", title: "Yağmur tutma", question: "Kampüs yağan yağmurun ne kadarını tutabiliyor?", unit: "yağmur birimi",
    supplyLabel: "okulun tuttuğu yağmur", demandLabel: "beton ve asfalttan akıp giden yağmur", minNet: 1,
    supply: [
      { type: "rainwater", values: [8, 8, 8, 4], reason: "Yağmuru depoda biriktirir; 3. depodan sonra az su toplanır." },
      { type: "green", values: [1], reason: "Çim yağmuru emer." },
      { type: "garden", values: [1], reason: "Toprak yağmuru emer." },
      { type: "shade", values: [1], reason: "Ağaç kökleri yağmuru toprağa çeker." },
    ],
    demand: [
      { type: "education", values: [12], reason: "Çatı ve beton yağmuru emmez." },
      { type: "sports", values: [8], reason: "Geniş çatı yağmuru emmez." },
      { type: "recycling", values: [2], reason: "Beton zemin yağmuru emmez." },
      { type: "bike", values: [2], reason: "Asfalt yağmuru emmez." },
      { type: "path", values: [2], reason: "Sert zemin yağmuru emmez." },
      { type: "outdoorClass", values: [1], reason: "Sert zemin yağmuru emmez." },
      { type: "solar", values: [1], reason: "Panel yüzeyinden yağmur akar." },
      { type: "wind", values: [1], reason: "Beton temel yağmuru emmez." },
      { type: "battery", values: [1], reason: "Beton kabin yağmuru emmez." },
    ],
    saving: [],
    phrases: { supply: "{v} birim yağmur tutar", demand: "{v} birim yağmurun akmasına yol açar" },
  },
  cooling: {
    id: "cooling", title: "Serinletme", question: "Gölge ve yeşil alanlar, güneşte ısınan yerlerin ne kadarını serinletiyor?", unit: "serinlik birimi",
    supplyLabel: "gölge, yeşil alan ve suyun serinletmesi", demandLabel: "güneşte ısınan yüzeyler", minNet: 1,
    supply: [
      { type: "shade", values: [3], reason: "Gölgesi zemini ve binayı serinletir." },
      { type: "green", values: [2], reason: "Çim güneşte betondan az ısınır." },
      { type: "garden", values: [1], reason: "Bitkiler çevresini serinletir." },
      { type: "rainwater", values: [1], reason: "Su, çevresindeki havayı serinletir." },
    ],
    demand: [
      { type: "education", values: [12], reason: "Beton ve çatı güneşte ısınır." },
      { type: "sports", values: [8], reason: "Geniş çatı güneşte ısınır." },
      { type: "recycling", values: [1], reason: "Beton zemin güneşte ısınır." },
      { type: "bike", values: [1], reason: "Asfalt güneşte ısınır." },
      { type: "path", values: [1], reason: "Sert zemin güneşte ısınır." },
      { type: "solar", values: [1], reason: "Koyu panel güneşte ısınır." },
      { type: "battery", values: [1], reason: "Metal kabin güneşte ısınır." },
      { type: "daylight", values: [2], reason: "Büyük pencereler yazın binayı ısıtır." },
    ],
    saving: [
      { type: "insulation", values: [2, 1], reason: "Yalıtımlı bina yazın daha az ısınır." },
    ],
    phrases: { supply: "{v} birim serinletir", demand: "{v} birim ısınır", saving: "binanın ısınmasını {v} birim azaltır" },
  },
  transport: {
    id: "transport", title: "Çevreci ulaşım", question: "Yürüyerek veya bisikletle gelmesi istenen öğrencilerin ne kadarına yer var?", unit: "öğrenci",
    supplyLabel: "yürüyerek veya bisikletle gelebilecek öğrenci", demandLabel: "yürüyerek veya bisikletle gelmesi istenen öğrenci", minNet: 1,
    supply: [
      { type: "bike", values: [20, 20, 20, 20, 20, 10], reason: "Her park 20 bisiklet alır. 5. parktan sonra okul girişi kalabalıklaşır." },
      { type: "path", values: [15, 15, 10], reason: "Her yolda 15 öğrenci güvenle yürür. İlk 2 yoldan sonrakiler 10 öğrenciye yeter." },
    ],
    demand: [],
    saving: [],
    fixedDemand: { students: SCHOOL_STUDENTS, percent: 30, label: "Hedef: öğrencilerin %30'u", reason: "Okul, öğrencilerin %30'unun yürüyerek veya bisikletle gelmesini istiyor." },
    phrases: { supply: "{v} öğrencinin yürüyerek veya bisikletle gelmesini sağlar" },
  },
  activity: {
    id: "activity", title: "Hareket alanı", question: "Teneffüste hareket etmesi istenen öğrencilerin ne kadarına yer var?", unit: "öğrenci",
    supplyLabel: "aynı anda hareket edebilecek öğrenci", demandLabel: "teneffüste hareket etmesi istenen öğrenci", minNet: 1,
    supply: [
      { type: "sports", values: [60, 40], reason: "Salon 60 öğrenci alır. İkinci salon aynı teneffüste daha az dolar." },
      { type: "outdoorClass", values: [10], reason: "Açık alanda 10 öğrenci hareket edebilir." },
      { type: "green", values: [8], reason: "Çimde 8 öğrenci oynayabilir." },
      { type: "garden", values: [5], reason: "Bahçe işleri 5 öğrenciyi hareket ettirir." },
      { type: "bike", values: [5], reason: "Bisiklet alanında 5 öğrenci hareket eder." },
      { type: "path", values: [5], reason: "Yürüyüş yolunda 5 öğrenci yürüyebilir." },
    ],
    demand: [],
    saving: [],
    fixedDemand: { students: SCHOOL_STUDENTS, percent: 40, label: "Hedef: öğrencilerin %40'ı", reason: "Okul, her teneffüste öğrencilerin %40'ının hareket edebilmesini istiyor." },
    phrases: { supply: "{v} öğrenciye hareket alanı açar" },
  },
  carbon: {
    id: "carbon", title: "Karbon azaltma", question: "Okul, ürettiği karbonun ne kadarını azaltıyor?", unit: "karbon birimi",
    supplyLabel: "okulun azalttığı karbon", demandLabel: "okulun ürettiği karbon", minNet: 1,
    supply: [
      { type: "solar", values: [5, 5, 5, 2], reason: "Güneş enerjisi kömür ve doğal gazın yerini alır." },
      { type: "wind", values: [6, 6, 3], reason: "Rüzgâr enerjisi kömür ve doğal gazın yerini alır." },
      { type: "recycling", values: [3], reason: "Eski malzeme yeniden kullanılır; fabrikada yenisi üretilmez." },
      { type: "bike", values: [2], reason: "Bisikletle gelen öğrenci arabaya binmez." },
      { type: "path", values: [1], reason: "Yürüyerek gelen öğrenci arabaya binmez." },
      { type: "shade", values: [1], reason: "Ağaçlar havadaki karbonu emer." },
      { type: "green", values: [1], reason: "Bitkiler havadaki karbonu emer." },
    ],
    demand: [
      { type: "education", values: [12], reason: "Isıtma ve elektrik karbon üretir." },
      { type: "sports", values: [8], reason: "Isıtma ve elektrik karbon üretir." },
      { type: "recycling", values: [2], reason: "Atıkları taşıyan kamyonlar karbon üretir." },
      { type: "battery", values: [1], reason: "Pil fabrikada yapılırken karbon çıkar." },
    ],
    saving: [
      { type: "insulation", values: [4, 3, 1], reason: "Bina az ısıtılır; daha az karbon çıkar." },
      { type: "daylight", values: [3, 2, 1], reason: "Az lamba yanar; daha az karbon çıkar." },
    ],
    phrases: { supply: "{v} karbon birimi azaltır", demand: "{v} karbon birimi üretir", saving: "{v} karbon birimi tasarruf ettirir" },
  },
};

// Her olay kendi kaynağının dengesini kart metnindeki gerçek hayat etkisiyle bozar; hiçbir oranı yükseltemez.
export const EVENT_RESOURCE: Record<EventId, ResourceId> = {
  heatwave: "cooling", drought: "water", heavyRain: "rain", energyLimit: "energy", activeTransport: "transport", healthyLiving: "activity", carbonLimit: "carbon",
};
// text, "önce → sonra birim" ile tamamlanan cümlenin başıdır; son kelimeler değişen sayının adını söyler.
const EVENT_DEMAND_FACTOR: Partial<Record<EventId, { factor: number; text: string }>> = {
  heatwave: { factor: 1.3, text: "Çok sıcak günlerde beton, asfalt ve çatılar %30 daha çok ısınıyor. Isınan yüzeyler" },
  heavyRain: { factor: 1.5, text: "Çok yağmur yağınca beton ve asfalttan %50 daha çok su akıyor. Akıp giden yağmur" },
  carbonLimit: { factor: 1.25, text: "Yeni kurala göre okulun ürettiği karbon %25 daha fazla sayılıyor. Okulun karbonu" },
};
const EVENT_TARGET: Partial<Record<EventId, { percent: number; label: string }>> = {
  activeTransport: { percent: 45, label: "Hedef: öğrencilerin %45'i" },
  healthyLiving: { percent: 50, label: "Hedef: öğrencilerin %50'si" },
};
const DROUGHT_RAIN_FACTOR = 0.7;

export const CHALLENGE_RESOURCE: Record<ChallengeId, ResourceId> = {
  heat: "cooling", drought: "water", heavyRain: "rain", energy: "energy", activeTransport: "transport", healthyLiving: "activity", carbon: "carbon",
};

const perItem = (values: number[], count: number) => Array.from({ length: count }, (_, index) => values[Math.min(index, values.length - 1)]);

// 3 × 5 + 2 gibi okunabilir işlem; sıfır katkılar yazılmaz.
function expression(values: number[]): string {
  const runs: Array<{ value: number; length: number }> = [];
  for (const value of values.filter((item) => item > 0)) {
    const last = runs.at(-1);
    if (last && last.value === value) last.length += 1; else runs.push({ value, length: 1 });
  }
  return runs.map((run) => run.length > 1 ? `${run.length} × ${run.value}` : String(run.value)).join(" + ") || "0";
}

function stepRows(items: PlacedItem[], steps: Step[], role: ResourceRow["role"]): ResourceRow[] {
  return steps.flatMap((step) => {
    const count = items.filter((item) => item.type === step.type).length;
    if (count === 0) return [];
    const values = perItem(step.values, count);
    const calculation = expression(values);
    return [{ key: `${role}-${step.type}`, label: COMPONENTS[step.type].label, detail: `${count} adet • ${calculation}`, calculation, value: values.reduce((sum, value) => sum + value, 0), role, reason: step.reason }];
  });
}

export function getResourceBalance(items: PlacedItem[], id: ResourceId, eventId?: EventId): ResourceBalance {
  const definition = RESOURCES[id];
  const rows = [...stepRows(items, definition.supply, "supply"), ...stepRows(items, definition.demand, "demand"), ...stepRows(items, definition.saving, "saving")];
  const affected = eventId !== undefined && EVENT_RESOURCE[eventId] === id;
  let eventNote: string | undefined;
  if (definition.fixedDemand) {
    const { students, label, reason } = definition.fixedDemand;
    const eventTarget = affected ? EVENT_TARGET[eventId] : undefined;
    const percent = eventTarget?.percent ?? definition.fixedDemand.percent;
    const calculation = `${students} × ${percent} ÷ 100`;
    rows.push({ key: "demand-target", label: eventTarget?.label ?? label, detail: `${students} öğrenci • ${calculation}`, calculation, value: students * percent / 100, role: "demand", reason });
    if (eventTarget) eventNote = `Bu olayda hedef büyüdü: %${definition.fixedDemand.percent} → %${percent}. Yani ${students * definition.fixedDemand.percent / 100} öğrenci yerine ${students * percent / 100} öğrenci.`;
  }
  if (affected && eventId === "drought") {
    const rain = rows.find((row) => row.key === "supply-rainwater");
    if (rain) {
      const before = rain.value;
      rain.value = Math.round(before * DROUGHT_RAIN_FACTOR);
      rain.calculation = String(rain.value);
      eventNote = `Az yağmur yağdığı için yağmur suyu alanların %30 daha az su topluyor: ${before} → ${rain.value} birim. Gri su arıtma yağmura bağlı değil; o etkilenmiyor.`;
    } else eventNote = "Az yağmur yağdığı için yağmur suyu alanları %30 daha az su toplar. Gri su arıtma yağmura bağlı değil; o etkilenmez.";
  }
  // Bulutlu günler olayında güneş üretimi enerji dengesi modelinden gelir (depolama korumasıyla birlikte).
  if (id === "energy" && eventId === "energyLimit") {
    const solar = rows.find((row) => row.key === "supply-solar");
    if (solar) {
      solar.value = getEnergyBalance(items, eventId).solarProduction;
      solar.calculation = String(solar.value);
      solar.detail = `${solar.detail} • bulutlu günde ${solar.value}`;
    }
    const normal = getEnergyBalance(items);
    eventNote = `Bulutlu günde güneş panellerin %30 daha az elektrik üretiyor: ${normal.solarProduction} → ${getEnergyBalance(items, eventId).solarProduction} birim. Enerji depolama bunun bir kısmını korur. Rüzgâr türbini etkilenmez.`;
  }
  const sum = (role: ResourceRow["role"]) => rows.filter((row) => row.role === role).reduce((total, row) => total + row.value, 0);
  const supply = sum("supply");
  let grossDemand = sum("demand");
  const demandEffect = affected ? EVENT_DEMAND_FACTOR[eventId] : undefined;
  if (demandEffect) {
    const before = grossDemand;
    grossDemand = Math.round(before * demandEffect.factor);
    eventNote = `${demandEffect.text}: ${before} → ${grossDemand} birim.`;
  }
  const savings = Math.min(Math.max(0, grossDemand - definition.minNet), sum("saving"));
  const netDemand = Math.max(definition.minNet, grossDemand - savings);
  return { id, supply, grossDemand, savings, netDemand, coveragePercent: Math.round(supply / netDemand * 100), rows, eventNote };
}

export function challengeResource(challengeId: ChallengeId) {
  return RESOURCES[CHALLENGE_RESOURCE[challengeId]];
}

// Bir bileşenin yardım ettiği sorunlar: o sorunun ana oranında paya katkı veya tasarruf.
export function helpedChallenges(type: ComponentType): ChallengeId[] {
  return (Object.keys(CHALLENGE_RESOURCE) as ChallengeId[]).filter((challengeId) => {
    const definition = challengeResource(challengeId);
    return [...definition.supply, ...definition.saving].some((step) => step.type === type);
  });
}

export function supportTypes(challengeId: ChallengeId): ComponentType[] {
  return challengeResource(challengeId).supply.map((step) => step.type);
}

export type ComponentEffect = { tone: "good" | "cost"; text: string };

const scoreNames = { climate: "İklim", water: "Su", energy: "Enerji", health: "Sağlık", circularity: "Doğa" } as const;

// Etki kartındaki sayısal satırlar motor verisinden üretilir; metin ile mekanik ayrışamaz.
export function componentEffects(type: ComponentType): ComponentEffect[] {
  const effects: ComponentEffect[] = [];
  for (const definition of Object.values(RESOURCES)) {
    const phrase = (template: string | undefined, value: number) => (template ?? "").replace("{v}", String(value));
    for (const step of definition.supply.filter((item) => item.type === type)) effects.push({ tone: "good", text: `${phrase(definition.phrases.supply, step.values[0])} → ${definition.title} ↑` });
    for (const step of definition.saving.filter((item) => item.type === type)) effects.push({ tone: "good", text: `${phrase(definition.phrases.saving, step.values[0])} → ${definition.title} ↑` });
    for (const step of definition.demand.filter((item) => item.type === type)) effects.push({ tone: "cost", text: `${phrase(definition.phrases.demand, step.values[0])} → ${definition.title} ↓` });
  }
  const contributions = COMPONENTS[type].contributions;
  for (const key of Object.keys(scoreNames) as Array<keyof typeof scoreNames>) {
    if (contributions[key] < 0) effects.push({ tone: "cost", text: `${scoreNames[key]} puanını ${-contributions[key]} puan düşürür` });
  }
  return effects;
}
