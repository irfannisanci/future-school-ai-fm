# Sprint 07 — Olay Zinciri: Olay → Düşüş → Yeniden Tasarım
Status: DONE
Goal: Her sorun × her olay kombinasyonunda öğrenci aynı zinciri görsün: "İlk tasarımım şuydu → 2040 olayı şunu düşürdü → yeniden tasarımla şunu geri kazandım." Olay, öğrencinin takip ettiği oranı da etkilesin.
Roadmap outcome: R6 — Pilot Hardening

## Neden
Kullanıcı testi (yoğun yağış görevi + Aşırı Yağış olayı): "Olay etkisi: Su göstergenden 6 puan düşüyor" notu çıktı ama kullanıcı düşüşü göremedi. Yeniden üretildi:
1. Düşüş motorda uygulanıyor (Su 60 → 54) fakat yalnızca sağ sütunun altındaki gösterge çubuğunda görünüyor; öğrencinin takip ettiği denge kartı (Yağmur tutma, Su karşılama) olaydan hiç etkilenmiyor. Sprint 06'da bilinçli olarak kapsam dışı bırakılmıştı.
2. Karşılaştırma tablosu "Su 54 → 54, +0" gösteriyor; ilk tasarımdaki 60 yalnızca üst şeritte. Öğrencinin zihnindeki "60'tım, 54'e düştüm" zinciri tabloda yok.
3. "Olay etkisi" notu hangi olay kartından geldiğini söylemiyor.

## Scope
### A. Olaylar kaynak dengelerine bağlanır (`resources.ts`)
Her olay, kendi kaynağının dengesini kart metnindeki gerçek hayat etkisiyle değiştirir; olay hiçbir oranı yükseltemez.

| Olay | Oran | Etki |
|---|---|---|
| Sıcak Hava Dalgası | Serinletme | ısınan yüzeyler %30 daha çok ısınır (payda × 1,3) |
| Kuraklık | Su karşılama | yağmur suyu alanları %30 daha az su toplar (× 0,7); gri su arıtma etkilenmez |
| Aşırı Yağış | Yağmur tutma | sert yüzeylerden akan yağmur %50 artar (payda × 1,5) |
| Enerji Kısıtı | Enerji karşılama | güneş × 0,7, depolama korur, rüzgâr etkilenmez (mevcut) |
| Aktif Ulaşım Haftası | Ulaşım kapasitesi | hedef %30 → %45 |
| Sağlıklı Yaşam Haftası | Hareket alanı kapasitesi | hedef %40 → %50 |
| Karbon Azaltma Hedefi | Karbon azaltım | sayılan karbon %25 artar (payda × 1,25) |

### B. 2040 koşulu (`balance.ts`)
Yeniden tasarım aşamasında olayın oranı denge kartında her zaman görünür:
- oran zaten görevin ölçütlerinden biriyse o ölçüt olay koşulunda hesaplanır (zorlaşır);
- değilse denge kartına **"2040 koşulu: <oran> en az %50"** satırı eklenir.
Böylece 49 kombinasyonun hepsinde olayın izlenebilir bir sonucu vardır. 2040 koşulu teknik puanda koruma koşulu gibi sayılır. Sprint 05'in gösterge şoku (30 puan, emilim) aynen kalır; iki sonuç tek "olay etkisi" anlatısında birlikte gösterilir.

### C. Zincir her ekranda görünür (`GameApp.tsx`)
- Olay ekranı: önce oran (`%120 → %80`, nedeni), sonra gösterge (`60 → 54`), varsa "bu olay yeni bir koşul getirdi".
- Yeniden tasarım: not "2040 olayı: <kart adı>" başlığıyla gelir; gösterge çubuklarında ve denge satırlarında **"olay −6"** etiketi; denge kartı denklemi olay koşulundaki sayıları ve nedenini gösterir.
- Karşılaştırma: gösterge tablosu üç noktalı olur (`60 → 54 → 54`, "olay −6", "sen +0"); ilk plan kendi normal puanıyla, altında "2040 olayında" puanıyla gösterilir; "Olayın düşürdükleri" kutusu eklenir.

## Out of scope
Gösterge şoku değerlerinin değiştirilmesi, yeni bileşen, komşuluk kuralları, öğretmenin olay seçmesi.

## Files expected to change
`src/lib/game/{resources,balance,diagnostics,scoring,resilience,types}.ts`, `src/lib/ai/advisor.ts`, `src/app/api/advisor/route.ts`, `src/components/GameApp.tsx`, `src/app/globals.css`, `src/lib/export/png.ts`, testler, `04`, `06`, `07`, `08`, ADR-005 eki.

## Acceptance criteria
1. Her olay kendi oranını yalnızca düşürebilir (rastgele tasarımlarla özellik testi); etkilenmeyen kaynaklar (gri su, rüzgâr) korunur.
2. Yeniden tasarım aşamasında denge ölçütleri olayın oranını her zaman içerir: ya mevcut ölçüt olay koşulunda ya da "2040 koşulu" satırı.
3. 49 sorun × olay kombinasyonunun hepsi 100 bütçe içinde dengeli çözülebilir (test içinde açgözlü tamamlayıcı ile).
4. Değişikliksiz yeniden tasarımda karşılaştırma "olay −N, sen +0" gösterir; kullanıcının senaryosunda Su `60 → 54 → 54`.
5. Sprint 05–06 testleri geçer; lint, typecheck, test, build geçer; AI kapalı akış tamamlanır.

## Test plan
`tests/resources.test.ts` (AC1), `tests/balance.test.ts` (AC2, AC3), `tests/resilience.test.ts` (oran zinciri), uçtan uca: kullanıcının senaryosu (yoğun yağış + Aşırı Yağış, 3 yağmur suyu alanı) ve çapraz bir kombinasyon.

## Risks / rollback
Beşinci denge satırı kartı uzatır; 2040 koşulu eşiği (%50) ilk tahmindir. Rollback: Sprint 06 sonu durumuna dönmek için bu sprintin değişiklikleri geri alınır.

## Implementation notes
- Olay oran etkileri `resources.ts` içinde tek yerde: `EVENT_RESOURCE`, payda çarpanları, hedef yüzdeleri, kuraklık çarpanı. Her denge olay altında bir `eventNote` üretir ("20 → 30"); olay ekranı, yeniden tasarım notu, denge kartı ve karşılaştırma aynı cümleyi kullanır.
- `evaluateChallengeBalance(..., eventId)` ve `eventCondition()`: olay oranı ölçütlerde yoksa `kind: "event"` ölçütü eklenir. Teknik puan, tanılama ve AI jüri girdisi yeniden tasarımda olay koşulunu kullanır.
- Gösterge şoku (Sprint 05) değiştirilmedi; iki etki tek anlatıda birleştirildi.
- Yüzdelerden sonra Türkçe ek kullanılmadı ("%90'den" hatasını önlemek için "%90 → %69" yazımı); sabit iki hedef etiketi elle yazıldı ("%45'i", "%50'si").
- Olay kartı metinleri motorun yaptığıyla eşitlendi (ör. "sert yüzeylerden %50 daha çok yağmur akıyor", "öğrencilerin %45'i"). Enerji kartındaki mekaniği olmayan "şebekeden alınabilen enerji %25 azaldı" iddiası kaldırıldı.

## Verification results
- ESLint: geçti. TypeScript: geçti. Vitest: 12 dosya / 55 test geçti.
- `next build`: geçti (ayrı kopyada; build için yalnızca kendi 3100 sunucum durduruldu, kullanıcının 3000 sunucusuna dokunulmadı).
- AC1: 120 rastgele tasarım × 7 olay × 7 oran: olay yalnızca kendi oranını değiştiriyor ve hiçbirini yükseltmiyor; gri su ve rüzgâr korunuyor (test).
- AC2: 7 × 7 kombinasyonun her birinde olayın oranı ölçütlerde tam bir kez var (test).
- AC3: 49 kombinasyonun hepsi 100 bütçe içinde "dengeli" sonuca ulaşıyor (açgözlü tamamlayıcıyla test).
- AC4: kullanıcının senaryosu tarayıcıda yeniden üretildi (yoğun yağış + Aşırı Yağış, 3 yağmur suyu alanı): olay ekranı "Yağmur tutma %120 → %80", "Su 60 → 54"; yeniden tasarımda "Su olay −6", "Yağmur tutma olay −40"; karşılaştırmada "Su 60 → 54 → 54, olay −6, sen 0" ve "olayın düşürdükleri" kutusu.
- Çapraz kombinasyon (kuraklık görevi + Aşırı Yağış): olay ekranı yeni koşulu duyurdu, denge kartında "⚡ 2040 koşulu: Yağmur tutma" satırı çıktı.
- AC5: Sprint 05–06 testleri geçiyor; A ve B tam akışları AI kapalıyken tamamlandı. Tek konsol hatası önceden var olan favicon 404.

## Docs/ADR updates
- ADR-005: Sprint 07 eki (olay kendi oranını bozar, 2040 koşulu, üç noktalı karşılaştırma).
- `06-event-cards.md`: oran etkisi sütunu ve olay zinciri bölümü. `04-game-rules-and-economy.md`: olay kartları bölümü.
- `07-roadmap.md`, `08-current-state.md`.

## Handoff
- Olay oran etkileri ve 2040 koşulu eşiği (%50) ilk tahmindir; pilotta `resources.ts` ve `balance.ts` içinden ayarlanır.
- Pilot sonrası: komşuluk kuralları, sınıf düzeyine göre oran zorluğu.
