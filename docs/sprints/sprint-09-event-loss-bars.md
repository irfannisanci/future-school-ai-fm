# Sprint 09 — Olay Kaybı Çubukta Kırmızı
Status: DONE
Goal: 2040 olayının düşürdüğü değer, çubuğun üzerinde düştüğü kadar kırmızı parça olarak görünsün (10 birim düştüyse 10 birim kırmızı); altında "kaç iken kaç oldu" ve "neden düştü" yazsın.
Roadmap outcome: R6 — Pilot Hardening

## Neden
Kullanıcı geri bildirimi: "azalan değeri çubuk üzerinde kırmızı olarak göster, kaç iken kaç oldu." Uygulama sırasında ek istek: "10 birim düştüyse çubukta 10 birim kırmızı olsun ve bu açıklansın, neden düştü."
Şu an düşüş yalnızca "olay −6" etiketiyle anlatılıyor; çubuk yalnızca şimdiki değeri gösteriyor. Görev kontrolündeki çubuk hedefe göre dolduğu için, oran hedefi geçtiğinde (%195 → %158, hedef %70) çubuk olaydan önce de sonra da tam dolu; düşüş hiç görünmüyor.

## Scope
1. `LossBar` bileşeni: dolu kısım = şimdiki değer, kırmızı kısım = şimdiki değerden olaydan önceki değere kadar. Çubuk hedeften uzun çizildiğinde hedef yerinde ince bir çizgi.
2. Puan çubukları (İklim, Su, Enerji, Sağlık, Doğa; yeniden tasarım ekranı): kırmızı parça + kırmızı yazı "olay: 60 → 54".
3. Görev kontrolü satırları (yeniden tasarım, karşılaştırma, sergi): kırmızı parça + "olay: %195 → %158". Çubuk ölçeği = en büyük(hedef, şimdiki, olaydan önceki); böylece hedefi aşan oranlarda da düşüş görünür. Bütçe satırı değişmez.
4. "2040 koşulu" satırı da olaydan önceki değerini gösterir (şu an etiket çıkmıyor, çünkü olaysız hesapta bu satır yok).
5. Olay notundaki açıklama cümlesi kırmızı parçayı anlatır.
6. (ek istek) Çubuklarda 10 birimlik aralık çizgileri: kırmızı parça düşüş kadar ve sayılabilir. Her kırmızı parçanın altında "olay: X → Y (N azaldı)" ve "Neden?" satırı.

## Out of scope
Karşılaştırma ekranındaki üç noktalı puan tablosu (çubuk değil, metin), PNG çıktısı, mekanik.

## Technical approach
- `balance.ts`: `criteriaBeforeEvent(items, challengeId, eventId, normal, shocked)` — olay yüzünden düşen ölçütlerin olaydan önceki değerleri; 2040 koşulu satırı için kaynağın olaysız oranı. Deterministik, test edilir.
- `GameApp.tsx`: `LossBar`; `Metrics` ve `ChallengeBalanceCard` bunu kullanır. Puanlar için mevcut `eventDrops` "olaydan önceki değer" döndürecek biçimde değişir.
- `globals.css`: çubuk, kırmızı parça, hedef çizgisi, kırmızı yazı; baskıda renkler korunur (`print-color-adjust: exact`).

## Files expected to change
`src/lib/game/balance.ts`, `src/components/GameApp.tsx`, `src/app/globals.css`, `tests/balance.test.ts`, `docs/product-bible/06-event-cards.md`, `docs/ux/05-language-guide.md`, `07`, `08`.

## Acceptance criteria
1. Yeniden tasarım ekranında olayın düşürdüğü her puan çubuğunda kırmızı parça ve "olay: X → Y" yazısı var; düşmeyen puanlarda yok.
2. Görev kontrolünde hedefi aşan bir oran düştüğünde de (ör. %195 → %158) kırmızı parça görünür.
3. "2040 koşulu" satırı olaydan önceki değerini gösterir.
4. `criteriaBeforeEvent` 7 sorun × 7 olayda yalnızca gerçekten düşen ölçütleri döndürür; olaydan önceki değer her zaman şimdikinden büyüktür (test).
5. lint, typecheck, test, build geçer; tarayıcıda görsel kontrol.

## Test plan
`tests/balance.test.ts` (AC3, AC4); tarayıcıda yoğun yağış + Aşırı Yağış (puan düşen senaryo) ve karbon + Yeni Karbon Kuralı (hedefi aşan oran) ekran görüntüsü (AC1, AC2).

## Risks / rollback
Görev çubuğu ölçeği hedefi aşan oranlarda değişir (artık hedef çizgisi var). Rollback: bu sprintin diff'i geri alınır; mekanik değişmediği için veri etkilenmez.

## Implementation notes
- `criteriaBeforeEvent()` (`balance.ts`): olay yüzünden düşen ölçütlerin normal gündeki değeri; 2040 koşulu satırı için kaynağın olaysız oranı; bütçe hariç.
- `ratioDropReason()` ve `scoreDropReason()` (`resilience.ts`): "Neden?" satırı. Oran için olayın oran notu ("Akıp giden yağmur: 20 → 30 birim."), puan için olayın gücü + bileşenlerin koruması; Bulutlu Günler'de Enerji puanı için güneş üretimi notu.
- `LossBar` (`GameApp.tsx`): ölçek 10'un katına yuvarlanır, her aralık 10 birim. Dolu kısım şimdiki değer; kırmızı parça şimdiki değerden olaydan önceki değere kadar, yani düşüş kadar. Görev satırlarında ölçek = en büyük(hedef, şimdiki, olaydan önceki); hedef ölçekten küçükse koyu hedef çizgisi. Puan çubuklarında ölçek 100.
- `DropNote`: "olay: 60 → 54 (6 puan azaldı)" / "olay: %120 → %80 (40 azaldı)" + "Neden? …".
- Hata düzeltmesi: `focusImpactText()` puan 0'ın altına inemediğinde gerçek düşüşü yazar ("Sağlık puanın 20 puan düştü, çünkü puan 0'ın altına inemez."). Sprint 08 cümlesi bu durumda 25 puan yazıyordu. Olay ekranı ve olay notu da gerçek düşüşü kullanır. Koruyan bileşen yokken cümle artık üç parçalı: "…düşürebilirdi. Tasarımında … koruyan bir bileşen yok. … puan düştü."
- Açıklamalar: olay notunda ve görev kontrolünün altında "her aralık 10 birimdir; koyu çizgi hedeftir; kırmızı parça olayın düşürdüğü kadardır".
- Görev çubuklarının `<progress>` rengi Chrome'da zaten hep yeşildi; yeni çubuk da dolu kısmı yeşil çiziyor, kırmızı yalnızca olay kaybı için kullanılıyor.

## Verification results
- ESLint: geçti. TypeScript: geçti. Vitest: 13 dosya / 65 test geçti. `next build`: geçti (ayrı kopyada, `.env` olmadan; 3000 portundaki dev sunucuna dokunulmadı).
- AC1: Kuraklık görevi + Arabasız Okul Haftası (1 bisiklet parkı): Sağlık çubuğunda 11 ile 28 arası kırmızı; "olay: 28 → 11 (17 puan azaldı)", "Neden? Bu olay Sağlık puanını 25 puan düşürebilirdi. Bileşenlerin bunun 8 puanını önledi. Sağlık puanın 17 puan düştü." Düşmeyen puanlarda kırmızı yok. Yoğun yağış + Aşırı Yağış: Su 54 ile 60 arası 6 birim kırmızı.
- AC2: Yoğun yağış görevi + Aşırı Yağış: Yağmur tutma çubuğu 0–120 ölçekli, %80–%120 arası 4 aralık kırmızı, %70'te hedef çizgisi; "olay: %120 → %80 (40 azaldı)", "Neden? Çok yağmur yağınca beton ve asfalttan %50 daha çok su akıyor. Akıp giden yağmur: 20 → 30 birim." (2× ekran görüntüsüyle kontrol edildi).
- AC3: 2040 koşulu satırı: "olay: %13 → %9 (4 azaldı)", "Neden? Bu olayda hedef büyüdü: %30 → %45…" (tarayıcı) ve test.
- AC4: `tests/balance.test.ts` — 2 tasarım × 7 sorun × 7 olay: dönen her değer şimdikinden büyük, bütçe yok, en az 20 düşüş bulundu (test boşa geçmiyor); hedefi aşan oran (120 → 80) ve 2040 koşulu satırı testleri.
- "Neden?" cümleleri: `tests/resilience.test.ts` (0'da durma, kısmi koruma, bulutlu günde Enerji); `tests/language.test.ts` bu cümleleri de yasak kelime ve cümle uzunluğu için tarıyor.

## Docs/ADR updates
`06-event-cards.md` (yeniden tasarım ekranı), `docs/ux/05-language-guide.md` (çubuk ve "Neden?" satırı), `07-roadmap.md`, `08-current-state.md`. ADR gerekmedi (yalnızca gösterim).

## Handoff
- Karşılaştırma ekranındaki üç noktalı puan tablosu hâlâ metin ("60 → 54 → 54"); pilotta çubuğa çevrilmesi istenebilir.
- Ölçek 400'ü geçerse aralık çizgileri çizilmez (şu anki bileşenlerle oranlar bu değere ulaşmıyor).
