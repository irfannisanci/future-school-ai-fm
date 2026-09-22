# Öğrenci Dili Kılavuzu (6. sınıf)

Öğrencinin ekranda okuduğu her metin 6. sınıf öğrencisinin **ilk okuyuşta** anlayacağı dille yazılır: olay kartları, olay notları, görev kontrolü, bileşen kartları, bulgular, karşılaştırma, sergi çıktısı ve AI jüri metinleri. Kural Sprint 08'de kondu; `tests/language.test.ts` korur.

## Kurallar
1. **Kısa cümle, tek fikir.** Bir cümle en fazla 18 kelime (AI için 15).
2. **Öğrenciye "sen" diye seslen.** "Bileşenlerin", "oranın", "puanın".
3. **Her sayı neyi saydığını söyler.** "21 → 26 birim", "25 puan", "%45".
4. **Önce ne oldu, sonra sayı.** Olay notu sırası: ne oldu → takip ettiğin oran nasıl değişti → puanın neden düştü veya düşmedi → etiketler ne demek.
5. **Matematik terimleri kalır.** Pay, payda, oran, yüzde, kesir, sadeleştirme, ondalık 6. sınıf kazanımıdır; saklanmaz.
6. **Yeni kavram ilk geçtiği yerde tek cümleyle açıklanır.** Ör. "Karbon, havayı kirleten ve dünyayı ısıtan bir gazdır."
7. **Yüzdeden sonra ek kullanılmaz** ("%90'den" hatası olmasın): "%90 → %69" yazılır. Sabit etiketlerde ek elle yazılır ("%45'i").
8. **Sayıların gerçek ölçüm olmadığı söylenir**, ama "oyun içi", "eğitsel gösterge" gibi yetişkin ifadeleri yerine: "Bu sayılar gerçek ölçüm değil."

## Kullanılmayan kelimeler → yerine
| Kullanma | Yerine |
|---|---|
| olaysız | normal günde |
| gösterge, göstergen | puan, puanın |
| olayın gücü, şok | "Bu olay İklim puanını 25 puan düşürebilirdi." |
| hazırlıkların karşıladı, emilim | "Bileşenlerin bunun 10 puanını önledi." |
| koruma koşulu | ek koşul |
| kapasite | yer; oran adı "Çevreci ulaşım", "Hareket alanı" |
| kısıt | kullanılmaz ("Temiz enerji", "Bulutlu Günler") |
| altyapı, bina iyileştirmesi | Enerji alanı; "Binaya eklenir; yer kaplamaz" |
| döngüsellik | doğa (puan adı "Doğa") |
| verimlilik | yalıtım |
| oyun motoru, oyun içi | "oyun", "oyun sayısı" |
| yüzde puan | "%12 → %15" |
| grid, hücre | kampüs alanı, kare |
| ödünleşim, optimizasyon, metrik, kriter, parametre, senaryo | "iyi ve zor yanları", "sayı", "koşul" |

Kod içindeki tip ve alan adları (`guardrail`, `shock`, `absorb`) değişmez; kural yalnızca öğrencinin gördüğü metindir.

## Örnek: olay notu (yeniden tasarım ekranı)
Önce:
> Karbon azaltım oranın: olaysız %194 → olayda %152
> Karbon hedefi sıkılaştı; okulun karbonu %25 daha ağır sayılıyor (21 → 26).
> İklim göstergen: düşmüyor; hazırlıkların olayın 25 puanlık gücünün tamamını karşılıyor

Sonra:
> 🌍 2040 olayı: Yeni Karbon Kuralı
> Yeni kurala göre okulun ürettiği karbon %25 daha fazla sayılıyor. Okulun karbonu: 21 → 26 birim.
> Karbon azaltma oranın: normal günde %195 → bu olayda %158
> Bu olay İklim puanını 25 puan düşürebilirdi. Bileşenlerin bunun hepsini önledi; İklim puanın düşmedi.
> Koruyan bileşenler: 3 × Güneş paneli (12 puan), 2 × Rüzgâr türbini (8 puan), 5 × Bisiklet parkı (5 puan)
> Aşağıdaki çubuklarda her aralık 10 birimdir; koyu çizgi hedeftir. Kırmızı parça, bu olayın düşürdüğü kadardır; altında nedeni yazar.

Kırmızı parçanın altı (Sprint 09):
> **olay: 60 → 54 (6 puan azaldı)**
> **Neden?** Bu olay Su puanını 30 puan düşürebilirdi. Bileşenlerin bunun 24 puanını önledi. Su puanın 6 puan düştü.

## Yeni metin eklerken
- Metni `tests/language.test.ts` içindeki `studentTexts()` kapsamına giren bir veri modülüne koy (events, resources, catalog, challenges, balance, diagnostics, resilience) ya da `GameApp.tsx` içine yaz; iki yer de testle taranır.
- AI istemleri (`src/app/api/*/route.ts`) aynı kuralları ve yasak kelime listesini içerir.
