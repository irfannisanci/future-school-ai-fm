# Sprint 08 — 6. Sınıf Dili: Olay Notları, Tanımlar ve Anlatımlar
Status: DONE
Goal: Öğrencinin ekranda okuduğu her metin (olay kartları, olay notları, denge kartı, bileşen kartları, bulgular, karşılaştırma, AI jüri çıktısı) 6. sınıf öğrencisinin ilk okuyuşta anlayacağı dille yazılsın. Mekanik ve sayılar değişmesin.
Roadmap outcome: R6 — Pilot Hardening

## Neden
Kullanıcı geri bildirimi (yeniden tasarım ekranı, karbon olayı):

> Karbon azaltım oranın: olaysız %194 → olayda %152
> Karbon hedefi sıkılaştı; okulun karbonu %25 daha ağır sayılıyor (21 → 26).
> İklim göstergen: düşmüyor; hazırlıkların olayın 25 puanlık gücünün tamamını karşılıyor
> Aşağıdaki çubuklarda ve denge satırlarında “olay” etiketi bu düşüşleri gösterir.

Bu not doğru ama yetişkin/tasarımcı diliyle yazılmış: "olaysız", "gösterge", "olayın gücü", "hazırlıkların karşılıyor", "denge satırları", "daha ağır sayılıyor". Aynı dil başka ekranlarda da var ("koruma koşulu", "kapasite", "kısıt", "altyapı", "oyun motoru", "döngüsellik", "yüzde puan").

## Scope
### A. Dil kuralları (`docs/ux/05-language-guide.md`)
1. Kısa cümle, tek fikir; öğrenciye "sen" diye seslen.
2. Her sayı neyi saydığını söyler ("21 → 26 birim", "25 puan").
3. Matematik terimleri kalır (6. sınıf kazanımı): pay, payda, oran, yüzde, kesir, ondalık.
4. Bilinmeyen kavram ilk geçtiği yerde bir cümleyle açıklanır (karbon, gri su).
5. Sözlük (eski → yeni):

| Eski | Yeni |
|---|---|
| olaysız | normal günde |
| gösterge / göstergesi | puan / puanı |
| olayın gücü, şok | "bu olay en çok N puan düşürebilir" |
| hazırlıkların karşıladı / emdi | "bileşenlerin N puanını önledi / korudu" |
| koruma koşulu | ek koşul |
| kapasite | yer (oran adları: "Çevreci ulaşım", "Hareket alanı") |
| kısıt | kullanılmaz ("Temiz enerji", "Bulutlu Günler") |
| altyapı / bina iyileştirmesi | teknik alan / binaya eklenir, yer kaplamaz |
| döngüsellik, verimlilik, oyun motoru, oyun içi | doğa puanı, yalıtım, "oyun", (sayıların oyun sayısı olduğu notu kalır) |
| yüzde puan | "%12 → %15" biçiminde önce → sonra |
| grid / hücre | kare / kampüs alanı |

### B. Metinler
- `events.ts`: yedi kartın açıklaması; üç başlık ("Bulutlu Günler", "Arabasız Okul Haftası", "Yeni Karbon Kuralı").
- `resources.ts`: olay notları (ne oldu + hangi sayı nasıl değişti), oran soruları, pay/payda etiketleri, kart gerekçeleri; üç oran adı.
- `catalog.ts`: bileşen etkileri ve zor yanları; iki etiket ("Bina yalıtımı", "Gün ışığı pencereleri").
- `challenges.ts`, `balance.ts`, `diagnostics.ts`, `resilience.ts`, `fallback.ts`, `engine.ts` (hata mesajları), `math.ts` (yedek açıklama).
- `GameApp.tsx`: olay ekranı, yeniden tasarım notu, denge kartı, bilgi kartı, karşılaştırma, jüri kartı, puan özeti, bildirimler.
- `png.ts`: sergi çıktısındaki özet cümlesi.

### C. AI çıktısı
`/api/advisor` ve `/api/math` sistem istemlerine aynı dil kuralları ve yasak kelime listesi eklenir (AI özeti, güçlü yan, düşünülmesi gereken ve kanıt satırları öğrenciye gösteriliyor).

### D. Doğruluk düzeltmesi
Rüzgâr türbini gerekçesi "3. türbinden sonra az üretir" diyordu; motor 3. türbinden itibaren az üretiyor (6, 6, 3). Metin motorla eşitlenir. Mekanik değişmez.

### E. Küçük yardımcı cümle
Oran %100'ün üstündeyse denge kartında "kaynağın ihtiyacından fazla" açıklaması (öğrenci "%194" sayısını yorumlayabilsin).

## Out of scope
Oyun mekaniği, sayılar, eşikler, puanlama; yeni ekran veya bileşen; sınıf düzeyine göre farklı metin setleri (5/7/8 için ayrı dil); İngilizce çeviri.

## Implementation plan
1. Dil kılavuzunu yaz.
2. Veri modüllerindeki metinleri güncelle, sonra `GameApp.tsx` ve `png.ts`.
3. AI istemlerini güncelle.
4. `tests/language.test.ts`: yasak kelime ve cümle uzunluğu koruması; metne bağlı mevcut test beklentilerini güncelle.
5. lint, typecheck, test, build; tarayıcıda kullanıcının karbon senaryosu.
6. Docs: `05-ai-behavior-contract.md`, `06-event-cards.md`, `04-game-rules-and-economy.md` (adlar), `09-glossary.md`, `02-screen-specs.md`, `07`, `08`.

## Files expected to change
`src/lib/game/{events,resources,catalog,challenges,balance,diagnostics,resilience,fallback,engine}.ts`, `src/lib/ai/math.ts`, `src/app/api/{advisor,math}/route.ts`, `src/components/GameApp.tsx`, `src/lib/export/png.ts`, `tests/{language,resilience,fallback}.test.ts`, yukarıdaki docs.

## Acceptance criteria
1. Öğrenciye görünen veri metinlerinde ve `GameApp.tsx` içinde yasak kelimeler geçmez: gösterge, olaysız, kapasite, kısıt, döngüsellik, verimlilik, altyapı, oyun içi, oyun motoru, emilim, şok, ödünleşim, optimizasyon (test).
2. Veri metinlerinde hiçbir cümle 18 kelimeyi aşmaz (test).
3. Kullanıcının örneği yeni dille görünür: ne olduğu, hangi sayının nasıl değiştiği, puanın neden düştüğü/düşmediği ve "olay −N" yazılarının anlamı ayrı kısa cümlelerdir.
4. Mekanik değişmez: Sprint 05–07 testleri sayısal beklentilerde değişiklik olmadan geçer.
5. AI istemleri dil kurallarını ve yasak kelimeleri içerir.
6. lint, typecheck, test, build geçer.

## Test plan
`tests/language.test.ts` (AC1, AC2, AC5), mevcut testler (AC4), tarayıcıda karbon görevi + Yeni Karbon Kuralı olayı (AC3).

## Risks / rollback
- Ad değişiklikleri (3 olay, 3 oran, 1 sorun, 2 bileşen) basılı materyal veya öğretmen notlarıyla uyuşmayabilir; kimlikler (id) değişmediği için kayıtlı oturumlar etkilenmez.
- Kayıtlı oturumlardaki eski soru/bulgu metinleri eski dille kalır (yalnızca devam eden oturumlar).
- Rollback: yalnızca metin değişti; bu sprintin diff'i geri alınır.

## Implementation notes
- Olay notu (`EventEffectNote`) yeniden sıralandı: ne oldu (olay notu, sayılarla) → oran ("normal günde %195 → bu olayda %158", değişmediyse "(değişmedi)") → puan cümlesi → koruyan bileşenler → "olay −N" açıklaması.
- Puan cümlesi tek yerde: `focusImpactText()` (`resilience.ts`). Üç durum: hepsini önledi / bir kısmını önledi / koruyan bileşen yok. Olay ekranı ve yeniden tasarım notu aynı cümleyi kullanır.
- Olay notları "önce → sonra birim" ile biter; `EVENT_DEMAND_FACTOR.text` cümlenin başıdır, son kelimeler değişen sayının adıdır ("Okulun karbonu: 21 → 26 birim.").
- Yeni ekran adları: olaylar "Bulutlu Günler", "Arabasız Okul Haftası", "Yeni Karbon Kuralı"; sorun "Temiz enerji"; oranlar "Çevreci ulaşım", "Hareket alanı", "Karbon azaltma"; bileşenler "Bina yalıtımı", "Gün ışığı pencereleri"; ölçütler "Sağlık puanı", "Harcanan bütçe". Kimlikler (id) değişmedi, kayıtlı oturumlar açılır.
- Karbon, sorun kartında ve olay kartında tek cümleyle tanımlandı.
- Oran %100'ü geçtiğinde görev kontrolünde ve olay ekranında: "%100'den fazla, çünkü pay paydadan büyük: gerekenden fazlası var."
- Görev kontrolündeki "ihtiyaç − tasarruf" açıklaması "Payda = toplam − tasarruf" oldu (karbon ve serinletme için "ihtiyaç" anlamsızdı). "Paydaki kaynakları artır" cümlesi "payda" ile karışıyordu; "paya kaynak ekle" yapıldı.
- Tasarım ekranında görev kartının içindeki olay notu, hemen üstteki olay notunu tekrarladığı için kompakt görünümde gizlendi.
- Karşılaştırma listesi "yüzde puan" yerine "Yeşil alan: %12 → %15" ve "Su puanı: 54 → 60 (+6)" yazıyor; gösterge tablosuna "olay / sen" açıklaması eklendi.
- Görev ölçütü bulgu metinleri yüzdeyi Türkçe biçimde yazıyor ("%72", önceden "72%"); bütçe ölçütü "en fazla" ve "sınırı aştı" diyor (önceden yanlışlıkla "en az", "hedefin altında").
- D (doğruluk): rüzgâr türbini gerekçesi motorla eşitlendi ("ilk 2 türbinden sonrakiler az üretir"; değerler 6, 6, 3). Yaya yolu gerekçesine azalan katkı eklendi (15, 15, 10).
- Mekanik, sayılar ve eşikler değişmedi.

## Verification results
- ESLint: geçti. TypeScript: geçti. Vitest: 13 dosya / 61 test geçti.
- `next build`: geçti (ayrı kopyada, `.env` dosyaları silinmiş hâlde; kullanıcının 3000 portundaki dev sunucusuna dokunulmadı).
- AC1: `tests/language.test.ts`, yedi olay, yedi sorun, 16 bileşen, yedi oran, üç tasarım × yedi olay için olay notları, puan cümleleri, dayanıklılık özetleri, bulgular, sorular ve ölçüt adlarını tarıyor; `GameApp.tsx` kaynağı da taranıyor. Yasak kelime yok. Dedektörün eski metinleri yakaladığı ayrıca doğrulandı ("göstergen", "olaysız", "kapasitesi", "şoku").
- AC2: aynı metinlerde 18 kelimeyi aşan cümle yok (test).
- AC3: headless Chrome'da (AI kapalı) karbon görevi + Yeni Karbon Kuralı yeniden üretildi. Yeniden tasarım notu: "Yeni kurala göre okulun ürettiği karbon %25 daha fazla sayılıyor. Okulun karbonu: 21 → 26 birim." / "Karbon azaltma oranın: normal günde %195 → bu olayda %158" / "Bu olay İklim puanını 25 puan düşürebilirdi. Bileşenlerin bunun hepsini önledi; İklim puanın düşmedi." / "Koruyan bileşenler: 3 × Güneş paneli (12 puan), 2 × Rüzgâr türbini (8 puan), 5 × Bisiklet parkı (5 puan)" / "Aşağıda “olay −N” yazısını görürsen: o sayı bu olay yüzünden N azaldı demektir." Olay ekranı ve karşılaştırma aynı dili kullanıyor. Yoğun yağış + Aşırı Yağış da kontrol edildi. Kısmi düşüş ve koruyan bileşen olmayan durumların cümleleri testte.
- AC4: Sprint 05–07 testlerinde sayısal beklenti değişmedi; yalnızca `tests/resilience.test.ts` içindeki dört metin beklentisi yeni cümlelere güncellendi.
- AC5: iki AI istemi "6. sınıf öğrencisinin ilk okuyuşta anlayacağı" kuralını, cümle sınırını ve yasak kelime listesini içeriyor (test).

## Docs/ADR updates
- Yeni: `docs/ux/05-language-guide.md` (kurallar, yasak kelimeler → yerine, önce/sonra örneği).
- `05-ai-behavior-contract.md` (dil kuralı), `06-event-cards.md` (yeni adlar, öğrenciye anlatım bölümü), `04-game-rules-and-economy.md` (ekran adları), `09-glossary.md` (doküman terimi → ekran terimi), `docs/ux/02-screen-specs.md`, `README.md`, `07-roadmap.md`, `08-current-state.md`.
- ADR gerekmedi: mimari veya ürün kuralı değişmedi, yalnızca metin değişti.

## Handoff
- Pilotta öğrencilerin takıldığı kelimeler not edilip `05-language-guide.md` tablosuna ve `BANNED_STEMS` listesine eklenmeli.
- Kayıtlı oturumlarda daha önce üretilmiş soru ve bulgu metinleri eski dille kalır. Yeni takımlar etkilenmez.
- Olay adları değişti ("Bulutlu Günler", "Arabasız Okul Haftası", "Yeni Karbon Kuralı"); basılı sergi materyali varsa güncellenmeli.
- Sınıf düzeyine göre farklı metin seti (5. ve 7–8. sınıf) kapsam dışı; gerekirse ayrı sprint.
