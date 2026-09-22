# Sprint 05 — Stres Testi ve Dürüst Karşılaştırma
Status: DONE
Goal: 2040 olay kartı bonus değil deterministik bir stres testi olsun; önce/sonra karşılaştırması aynı koşullar arasında yapılsın; teknik puan tasarım kalitesini ayırt etsin.
Roadmap outcome: R6 — Pilot Hardening (skor dengesi iyileştirmesi)

## Neden
Oyun motoru incelemesinde şu sorunlar bulundu:
1. `eventAdjustments` çoğu olayda puan **ekliyordu** (sıcak dalgada 6 gölgelik = iklim +48). Öğrenci hiçbir şey değiştirmese de puanı yükseliyordu; kart metni ("su %30 azaldı") ile mekanik uyuşmuyordu.
2. İlk tasarım olaysız, son tasarım olaylı değerlendiriliyordu; önce/sonra farkı öğrencinin kararını değil olay bonusunu da ölçüyordu.
3. Teknik puanın 50 puanından 30'u (geçerlilik 10 + oran 20) ilerleyebilen her takıma garantiydi; hesap UI bileşeninin içindeydi ve testsizdi.

## Scope
- **Şok–emilim olay modeli:** her olay kartı odak göstergede sabit bir şok üretir; hazırlık bileşenleri şoku emer; olay hiçbir göstergeyi artıramaz. Enerji kısıtı mevcut `getEnergyBalance` modelinde kalır.
- **Dayanıklılık raporu:** `Normal → Olay altında → Yeniden tasarım` üç noktalı karşılaştırma ve "kaybın yüzde kaçı geri kazanıldı" ölçüsü.
- **Teknik puan:** `src/lib/game/scoring.ts` içine taşınır; yeni dağılım geçerlilik 5 · oran 15 · denge 20 · göstergeler 10.
- **Arayüz:** olay ekranında "ilk tasarımına etkisi" kartı; karşılaştırma, sergi ekranı ve PNG çıktısı olay altındaki ilk tasarımı temel alır.
- AI danışmana `beforeEvaluation` olarak olay altındaki ilk tasarım gönderilir.
- Katalogdaki kullanılmayan `contributions.energy` değerleri sıfırlanır (motor enerji puanını zaten karşılama oranından alıyor).

## Out of scope
- Bağlayıcı kısıtlar: ölü "Açık alan ≥ %65" koşulu, azalan getiri, su dengesi, 500 öğrenci kapasite kuralı (Sprint 06 adayı).
- Komşuluk / konum kuralları (pilot sonrası karar).
- Öğretmenin olay kartını seçmesi, oran denemesi sayısına göre puan, yeni bileşen.

## Implementation plan
1. `events.ts`: `EventCard`'a `shock` ve `absorb` alanları; `getEventImpact(items, eventId)`.
2. `engine.ts`: `eventAdjustments` silinir; kayıp 0–100 sıkıştırmasından **sonra** odak göstergeden düşülür (`puan = clamp(clamp(ham) − kayıp)`), böylece kayıp her zaman görünür ve açıklanabilir olur.
3. `energy.ts`: enerji kısıtı sabitleri dışa aktarılır (rapor aynı sayıları kullansın).
4. `resilience.ts` (yeni): `getResilienceReport(initialItems, finalItems, eventId)` saf fonksiyon.
5. `scoring.ts` (yeni): `technicalScore` dökümüyle birlikte.
6. `GameApp.tsx`, `globals.css`, `png.ts`: olay etkisi kartı, üçlü şerit, olay altındaki temel çizgi, puan dökümü.
7. `storage.ts`: anahtar v5 (eski oturumlar karışık sayılar göstermesin).
8. `api/advisor/route.ts`: sistem istemine "before = aynı olay altındaki ilk tasarım" açıklaması.

### Şok–emilim tablosu (başlangıç değerleri, pilotta ayarlanır)
| Olay | Odak | Şok | Emilim (bileşen başına puan) |
|---|---|---:|---|
| Sıcak Hava Dalgası | İklim | 30 | gölgelik 5, yeşil alan 3, bahçe 2, açık hava sınıfı 1 |
| Kuraklık | Su | 30 | yağmur suyu alanı 8, gölgelik 1 |
| Aşırı Yağış | Su | 30 | yağmur suyu alanı 8, yeşil alan 3, bahçe 2 |
| Aktif Ulaşım Haftası | Sağlık | 25 | bisiklet parkı 8, gölgelik 2 |
| Sağlıklı Yaşam Haftası | Sağlık | 25 | bisiklet parkı 4, gölgelik 3, açık hava sınıfı 3, yeşil alan 2, bahçe 2 |
| Karbon Azaltma Hedefi | İklim | 25 | güneş paneli 4, bisiklet parkı 3, geri dönüşüm 3, yeşil alan 2, gölgelik 2 |
| Enerji Kısıtı | Enerji | — | güneş üretimi ×0,7; depolama başına 3 birim üretim korunur (`energy.ts`) |

Onaylı plandan sapma: kuraklıkta "bahçe 1" yerine "gölgelik 1" kullanıldı; bahçe kuraklıkta su tüketen bir alandır, gölge ise buharlaşmayı azaltır. Pedagojik olarak daha savunulabilir.

## Files expected to change
- `src/lib/game/events.ts`, `engine.ts`, `energy.ts`, `catalog.ts`, `storage.ts`
- `src/lib/game/resilience.ts` (yeni), `src/lib/game/scoring.ts` (yeni)
- `src/components/GameApp.tsx`, `src/app/globals.css`, `src/lib/export/png.ts`, `src/app/api/advisor/route.ts`
- `tests/events.test.ts`, `tests/resilience.test.ts`, `tests/scoring.test.ts` (yeni); `tests/engine.test.ts` (güncelleme)
- Docs: `04-game-rules-and-economy.md`, `05-ai-behavior-contract.md`, `06-event-cards.md`, `07-roadmap.md`, `08-current-state.md`, `ADR-004` notu, `ADR-005` (yeni), `docs/decisions/README.md`

## Acceptance criteria
1. Her olay ve her test tasarımı için hiçbir gösterge olaysız değerinden yüksek değildir (sabit tohumlu rastgele tasarımlarla özellik testi).
2. Şok tablosundaki her olayda hazırlıksız tasarım şokun tamamını, tam hazırlıklı tasarım 0 puan kaybeder.
3. Hiçbir şey değiştirmeden yeniden tasarım adımını geçen takımın bütün karşılaştırma farkları 0'dır.
4. Teknik puan her zaman 0–50 aralığındadır; ilerleyebilen en zayıf tasarım (yalnız eğitim binası + spor salonu) düşük, dengeli tasarım yüksek puan alır (eşikler Verification bölümünde ölçülerek yazılır).
5. Olay kartı metinleri ile motor değerleri `06-event-cards.md` içinde birebir tablolanır.
6. lint, typecheck, test ve build geçer; AI kapalıyken akış baştan sona tamamlanır.

## Test plan
- `tests/events.test.ts`: AC1, AC2.
- `tests/resilience.test.ts`: AC3, toparlanma yüzdesi, kayıpsız ("hazırdı") durum, enerji kısıtında depolama.
- `tests/scoring.test.ts`: AC4, döküm toplamı.
- `tests/engine.test.ts`: olay testi yeni modele göre.
- Elle: (a) aşırı sıcak görevi + sıcak dalga (hazırlıklı), (b) kuraklık görevi + aktif ulaşım (hazırlıksız); adım 7, 9, 11 ve PNG sayılarının tutarlılığı.

## Risks / rollback
- Puanlar genel olarak düşer. Dil "kaybettin" değil "olay şu kadar zorladı, şu kadarını geri kazandın" biçimindedir.
- Şok değerleri ilk tahmindir; tek tabloda (`events.ts`) tutulur, pilotta ayarlanır.
- Eski kayıtlı oturumlar v5 anahtarıyla sıfırlanır.
- Rollback: baseline `dc45563`; bu sprintin değişiklikleri geri alınarak dönülür.

## Implementation notes
- Şok, 0–100 sıkıştırmasından sonra odak göstergeden düşülür; emilim şoku aşamaz.
- Denge puanı `ana hedef ilerlemesi × (12 + 8 × koruma koşulları ortalaması)` olarak hesaplanır. Toplamalı formülde ölü "Açık alan ≥ %65" koşulu en zayıf tasarıma bedava puan veriyordu. Bütçe ölçütü yerleşimde zaten zorunlu olduğu için sayılmaz.
- AC4 eşiği ölçülerek yazıldı: en zayıf tasarım ≤ 26 (sağlıklı yaşam görevinde 26; zorunlu spor salonu ana hedefe %33 ilerleme veriyor), dengeli aşırı sıcak tasarımı 44.
- **Plan dışı bulgu ve düzeltme:** oran laboratuvarında AI'ya ulaşılamazsa öğrenci ilerleyemiyordu (deterministik yedek yoktu). `fallbackMathResult` eklendi; ipucu doğru cevabı vermez. Bu, ürün ilkesi 8 ve AC6 için gerekliydi.
- **Sprint dışı kullanıcı isteği:** her adımda üst çubukta "Ana sayfa" bağlantısı; oturum silinmez, ana sayfada "Kaldığın yerden devam et" çıkar (`SessionState.resumeStep`). "Yeni takım başlat" onay ister.
- PNG çıktısında dikey grid çizgileri 8 satırda kesiliyordu; 10'a düzeltildi.

### Kullanıcı geri bildirimi turu (sprint içinde)
1. **"Üretilen / net ihtiyaç neyi temsil ediyor belli değil":** denge kartındaki enerji denklemi açık etiket, birim ve kural cümlesiyle yeniden yazıldı (güneş panellerinin ürettiği ÷ okulun harcadığı = karşılama oranı; harcanan = ihtiyaç − tasarruf). Büyük başlık sayısına hangi göstergeye ait olduğu yazıldı. Azalan panel verimine oyun içi gerekçe eklendi.
2. **"Sorulara cevap vermek zor":** ekrandaki sorular LLM'den değil `diagnostics.ts` soru bankasından geliyordu (`route.ts` LLM sorularını `groundedQuestions` ile değiştiriyor). Sayı ve hedef içeren zor sorular kaldırıldı; iki genel konu sorusu + takımın tasarımına bağlı tek basit soru getirildi. Sorularda rakam yok.
3. **"Denge kontrolünde mantıksızlık":** kullanıcı ayrıntı vermedi; koddan bulunan ve düzeltilen tutarsızlıklar: (a) bütçe çubuğu 0 harcamada bile tam dolu görünüyordu, artık kullanımı gösteriyor; (b) "90% / ≥65" yazımı "Şu an %90 • hedef en az %65" ve "✓ sağlandı / eksik" oldu; (c) yeniden tasarım ekranında olayın düşürdüğü sayılar açıklamasızdı (3 panel = 15 birim beklenirken 11 görünüyordu), canlı "Olay etkisi" notu eklendi; (d) AI istemi ve kural dokümanı enerji görevinde sağlık koşulunu atlıyordu, motorla eşitlendi. Kullanıcının kastettiği başka bir tutarsızlık olabilir; teyit bekliyor.

## Verification results
- ESLint: geçti. TypeScript: geçti. Vitest: 11 dosya / 41 test geçti (geri bildirim turundan sonra yeniden çalıştırıldı).
- `next build`: geçti. Kullanıcının çalışan dev sunucusunun `.next` klasörüne dokunmamak için projenin ayrı bir kopyasında (`.env.local` kopyalanmadan) çalıştırıldı.
- Uçtan uca B senaryosu (kuraklık + Aktif Ulaşım Haftası, `/api/*` 503): akış tamamlandı; Sağlık 28 → 3 → 35; farklar olay altındaki ilk tasarıma göre; ana sayfa/devam et çalıştı. Not: bu koşu, kullanıcıya sorulmadan onun çalışan dev sunucusuna (localhost:3000) karşı yapıldı; kullanıcıya bildirildi.
- Uçtan uca A senaryosu (aşırı sıcak + sıcak dalga, hazırlıklı, değişikliksiz yeniden tasarım): geçti. İklim 67 → 67 → 67, bütün farklar +0, "Tasarımın bu olaya hazırdı". A ve B senaryoları kopyadan başlatılan ayrı sunucuda (port 3100, AI kapalı) yeniden koşturuldu; ikisi de baştan sona tamamlandı.
- Bilinen, sprintle ilgisiz: `/favicon.ico` 404 (projede ikon yok).

## Docs/ADR updates
- Yeni: `ADR-005-event-stress-model.md`. `ADR-004`: teknik puan dağılımı eki. `docs/decisions/README.md`: kayıt listesi.
- `04-game-rules-and-economy.md`: olay modeli, teknik puan, enerji görevi koşulları. `06-event-cards.md`: şok/emilim tablosu ve karşılaştırma kuralı. `05-ai-behavior-contract.md`: soru bankası, `before` tanımı, fallback.
- `07-roadmap.md`, `08-current-state.md`: güncellendi.

## Handoff
- Bütün kabul ölçütleri kanıtlandı; sprint kapatıldı. Değişiklikler commit'lenmedi (kullanıcı commit'liyor).
- Soru kararı: kullanıcı kural tabanlı basit soruları onayladı.
- Sprint 06 adayı (ayrı onay): ölü "Açık alan ≥ %65" koşulu, azalan getiri, su dengesi, 500 öğrenci kapasitesi. Komşuluk kuralları pilot sonrasına.
