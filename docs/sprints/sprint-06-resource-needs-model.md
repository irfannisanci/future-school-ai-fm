# Sprint 06 — Kaynak–İhtiyaç Modeli ve Gerçek Hayat Bedelleri
Status: DONE
Goal: Her bileşenin gerçek hayattan gelen bir bedeli olsun; her sorunun oranı çok kaynaklı, çok adımlı bir "kaynak ÷ ihtiyaç" hesabı olsun ve bu oran görevin ana hedefi olsun.
Roadmap outcome: R6 — Pilot Hardening (oyun mantığı ve matematik derinliği)

## Neden
Kullanıcı geri bildirimi:
1. Tasarım aşamasında bir bileşen eklemek başka bir durumu olumsuz etkilemiyor; bütün katkılar ≥ 0. Etkiler gerçek hayatla bağlantılı olmalı.
2. Oran laboratuvarı çok basit: enerji payında yalnızca güneş paneli var; diğer görevlerde hesap kare saymak ve görevin ana hedefiyle bağı yok. Bütün sorunlarda çok kaynaklı oran istenir.

İki istek aynı modelde birleşir: "çim su ister" hem gerçek hayat bedelidir hem kuraklık oranının paydasıdır. Bu yüzden tek sprintte ele alınır; ayrı yapılsaydı hedef değerleri iki kez dengelenecekti.

Kullanıcı kararları bana bıraktı ("mantıklı olanı seç"). Seçimler: ikinci enerji kaynağı **rüzgâr türbini**; "Doğal aydınlatma" üretim değil tasarruf olduğu için paydada kalır (fen ve matematik açısından doğru olan bu); yeni bileşenler rüzgâr türbini, yaya yolu ve gri su arıtma.

## Scope
### A. Yedi kaynak dengesi (`src/lib/game/resources.ts`)
Her denge: `oran = kaynak ÷ (ihtiyaç − tasarruf)`; ana hedef her görevde **en az %70**.

| Görev | Oran | Pay (kaynak) | Payda (ihtiyaç − tasarruf) |
|---|---|---|---|
| Enerji kısıtı | Enerji karşılama | güneş 5,5,5 sonra 2 • rüzgâr 6,6 sonra 3 | eğitim 12, spor 8, dönüşüm 2, gri su 1 − yalıtım 4,3,1 − gün ışığı 3,2,1 − gölgelik en çok 2 |
| Kuraklık | Su karşılama | yağmur suyu alanı 6,6,6 sonra 3 • gri su arıtma 5 sonra 3 | eğitim 8, spor 6, yeşil alan 1, ağaç 1, bahçe 2 |
| Yoğun yağış | Yağmur tutma | yağmur suyu alanı 8,8,8 sonra 4 • yeşil 1, bahçe 1, ağaç 1 | eğitim 12, spor 8, dönüşüm 2, bisiklet parkı 2, yaya yolu 2, açık sınıf 1, panel 1, türbin 1, depolama 1 |
| Aşırı sıcak | Serinletme | ağaç 3, yeşil 2, bahçe 1, yağmur suyu alanı 1 | eğitim 12, spor 8, dönüşüm 1, bisiklet 1, yaya yolu 1, panel 1, depolama 1, gün ışığı 2 − yalıtım 2 sonra 1 |
| Aktif ulaşım | Ulaşım kapasitesi | bisiklet parkı 20 (5.'den sonra 10) • yaya yolu 15,15 sonra 10 | 500 öğrencinin %30'u |
| Sağlıklı yaşam | Hareket alanı kapasitesi | spor salonu 60 sonra 40 • yeşil 8, açık sınıf 10, bahçe 5, bisiklet 5, yaya yolu 5 | 500 öğrencinin %40'ı |
| Karbon (oyun içi birim) | Karbon azaltım | güneş 5,5,5 sonra 2 • rüzgâr 6,6 sonra 3 • dönüşüm 3, bisiklet 2, ağaç 1, yeşil 1, yaya yolu 1 | eğitim 12, spor 8, dönüşüm 2, depolama 1 − yalıtım 4,3,1 − gün ışığı 3,2,1 |

Gerçek hayat gerekçeleri etki kartında ve oran kartlarında yazılır (çim sulama ister; beton ve asfalt yağmuru emmez ve ısınır; büyük pencere yazın binayı ısıtır; türbinler birbirinin rüzgârını keser; çatı alanı sınırlı olduğu için sonraki depolar daha az su toplar).

### B. Koruma koşulları gerçek gerilim üretir
Ölü "Açık alan ≥ %65" koşulu kaldırılır. Koruma koşulları, ana stratejinin kötüleştirdiği başka bir kaynak oranından seçilir.

| Görev | Ana hedef (≥ %70) | Koruma 1 | Koruma 2 |
|---|---|---|---|
| Aşırı sıcak | Serinletme | Su karşılama ≥ %50 (ağaç ve çim su ister) | Enerji karşılama ≥ %30 |
| Kuraklık | Su karşılama | Yeşil alan ≥ %12 | Serinletme ≥ %50 |
| Yoğun yağış | Yağmur tutma | Su karşılama ≥ %40 | Yeşil alan ≥ %12 |
| Enerji kısıtı | Enerji karşılama | Yeşil alan ≥ %15 | Sağlık ve hareket ≥ 35 (türbin gürültüsü) |
| Aktif ulaşım | Ulaşım kapasitesi | Yağmur tutma ≥ %50 (asfalt) | Serinletme ≥ %50 (asfalt ısınır) |
| Sağlıklı yaşam | Hareket alanı kapasitesi | Su karşılama ≥ %50 | Enerji karşılama ≥ %30 |
| Karbon | Karbon azaltım | Enerji karşılama ≥ %50 | Sağlık ve hareket ≥ 40 |

### C. Bileşenler
- **Yeni:** Rüzgâr türbini (1×1, 8 puan, zemin altyapısı; sağlık −4 gürültü, doğa −3 kuşlar; bulutlu günden etkilenmez), Yaya yolu (1×1, 2 puan; sert zemin), Gri su arıtma (bina iyileştirmesi, 6 puan; pompası 1 enerji ister).
- **Gösterge bedelleri:** yağmur suyu alanı sağlık −2 (durgun su, sivrisinek); geri dönüşüm sağlık −2 (koku, kamyon); doğal aydınlatma iklim −3 (yazın ısıtır); yalıtım doğa −2 (malzemesi zor geri dönüşür); depolama doğa −4 (kimyasal atık); güneş paneli doğa −1 (panel atığı).
- Zorunlu binaların gösterge katkıları negatif yapılmaz: ham puan sıfırın altına inerse ilk eklenen bileşenin etkisi görünmez olur. Binaların bedeli kaynak ihtiyaçlarıdır.
- Etki kartı, `effects/risks` metinlerine ek olarak motor verisinden üretilen sayısal "+ / −" satırlarını gösterir; metin ile mekanik ayrışamaz.

### D. Oran laboratuvarı
Bütün görevlerde PAY / PAYDA kutuları (paya yaz, + paydaya ekle, − paydadan çıkar). Kartlar işlemi gösterir, sonucu göstermez (`3 × 5 + 1 × 2 = ?`); öğrenci çarpar, toplar, çıkarır, böler. Ulaşım ve sağlıkta payda bir yüzde hesabıdır (`500 × 30 ÷ 100 = ?`).

## Out of scope
- Olayların kaynak dengelerini etkilemesi (kuraklıkta su kaynağı ×0,7 gibi). Bu sprintte yalnızca mevcut enerji kısıtı üretimi etkiler; diğer olaylar Sprint 05'teki gibi göstergeleri şoklar. Sonraki sprint adayı.
- Komşuluk / konum kuralları, öğretmen paneli, sınıf düzeyine göre farklı oran zorluğu.
- Gerçek karbon hesabı: karbon dengesi oyun içi birimdir ve öyle etiketlenir.

## Implementation plan
1. `types.ts`: üç yeni `ComponentType`; `ResourceId`, `ResourceBalance`, `ResourceRow`; `EnergyBalance`'a `solarProduction`, `windProduction`.
2. `catalog.ts`: yeni bileşenler, gösterge bedelleri, metinler.
3. `energy.ts`: rüzgâr üretimi (olaydan etkilenmez), gri su ihtiyacı.
4. `resources.ts` (yeni): yedi tanım, `getResourceBalance`, kart satırları, `componentEffects`.
5. `balance.ts`: yeni ölçütler; `challenges.ts`: oran kaynak dengesinden.
6. `GameApp.tsx`, `globals.css`: genel oran laboratuvarı, denge kartında her görev için denklem, sayısal etki kartı, yeni ikonlar.
7. `ai/advisor.ts`: enerji anahtar listesi; testler; dokümanlar.

## Files expected to change
`src/lib/game/{types,catalog,energy,resources,balance,challenges,diagnostics,events}.ts`, `src/lib/ai/advisor.ts`, `src/components/GameApp.tsx`, `src/app/globals.css`, `tests/*`, `docs/product-bible/{04,05,07,08,09}`, `docs/decisions/ADR-006`.

## Acceptance criteria
1. Yedi görevin her birinde oran, en az iki farklı bileşen türünün paya katkı verebildiği bir kaynak dengesinden gelir ve ana hedef bu oranın kendisidir.
2. Zorunlu olmayan her bileşenin bütçe dışında en az bir mekanik bedeli vardır (negatif gösterge, kaynak ihtiyacı veya açık alan kaybı); test ile kanıtlanır.
3. Her görev 100 bütçe ve 10×10 alan içinde dengeli çözülebilir (test içinde referans çözüm).
4. Her görevde yalnızca ana hedefe oynayan en ucuz strateji "ana hedef tamam; diğer koşullar eksik" sonucunu verir (koruma koşulları canlıdır).
5. Oran laboratuvarında beklenen pay ve payda motor tarafından doğrulanır; kartlar sonucu vermez.
6. Sprint 05 özellikleri bozulmaz: olay hiçbir göstergeyi artırmaz, değişikliksiz yeniden tasarımın farkı 0'dır.
7. lint, typecheck, test, build geçer; AI kapalıyken akış baştan sona tamamlanır.

## Test plan
- `tests/resources.test.ts`: her denge için elle hesaplanmış örnek, azalan getiri, yüzde tabanlı payda, AC1–AC4.
- Güncelleme: `balance`, `challenges`, `energy`, `diagnostics`, `scoring`, `advisor` testleri.
- Uçtan uca (izole kopya sunucu, AI kapalı): enerji görevi (güneş + rüzgâr) ve kuraklık görevi; oran laboratuvarı, denge kartı, etki kartı.

## Risks / rollback
- Büyük yeniden dengeleme: hedefler ilk tahmindir; tek dosyada (`resources.ts`, `balance.ts`) tutulur, pilotta ayarlanır.
- Palet 13'ten 16 bileşene çıkar; küçük ekranda kaydırma artar.
- Gösterge (İklim) ile oran (Serinletme) iki ayrı sayı olarak görünür; sözlükte açıklanır.
- Kayıtlı oturum anahtarı v6 olur. Rollback: Sprint 05 sonu durumuna dönmek için bu sprintin değişiklikleri geri alınır.

## Implementation notes
- `resources.ts` tek kaynak: oran hesabı, oran kartları, denge kartı denklemi, etki kartının sayısal satırları ve "yardım ettiği sorunlar" aynı tanımlardan üretilir.
- Enerji dengesi `energy.ts` ile birebir eşit tutuldu (150 rastgele tasarım × olaylı/olaysız testle korunuyor). Enerji kısıtında yalnızca güneş düşer; rüzgâr etkilenmez; depolama güneşi korur.
- Olay emilim tablosuna yeni bileşenler eklendi: Aktif Ulaşım Haftası'na yaya yolu 6, Karbon hedefine rüzgâr 4 ve yaya yolu 1.
- Eğitim binası da "Temel ihtiyaç" olarak işaretlendi (zaten zorunluydu).
- Plandan küçük sapma: su dengesinde tasarruf satırı yok; çıkarma pratiği enerji, serinletme ve karbon oranlarında var.
- Kayıtlı oturum anahtarı v6.

## Verification results
- ESLint: geçti. TypeScript: geçti. Vitest: 12 dosya / 50 test geçti.
- `next build`: geçti (kullanıcının `.next` klasörüne dokunmamak için ayrı kopyada; build sırasında yalnızca kendi 3100 sunucum durduruldu, kullanıcının 3000 sunucusuna dokunulmadı).
- AC1: `tests/resources.test.ts` — her görevin ana oranına en az iki bileşen türü kaynak ekleyebiliyor; ana hedef bu oranın kendisi.
- AC2: zorunlu olmayan 14 bileşenin her birinin bütçe dışı bedeli var (test).
- AC3: yedi görevin hepsinde 100 bütçe içinde referans çözüm "dengeli" (ör. aşırı sıcak: 5 ağaç + 2 yağmur suyu + 2 panel, 58 puan).
- AC4: yedi görevin hepsinde yalnızca ana orana oynayan ucuz strateji "ana hedef tamam; diğer koşullar eksik".
- AC5: oran kartları "= ?" gösterir; beklenen pay/payda motorla doğrulanır. Tarayıcıda enerji (pay `(3 × 5 + 2) + 6`, 23/13) ve kuraklık (pay `(3 × 6 + 3) + 5`, payda `8 + 6 + (3 × 1) + (2 × 2)`, 26/21) laboratuvarları doğru sonuçla geçti.
- AC6: Sprint 05 testleri geçiyor; uçtan uca A senaryosunda değişikliksiz yeniden tasarımın bütün farkları +0.
- AC7: A ve B senaryoları AI kapalıyken baştan sona tamamlandı; tek konsol hatası önceden var olan favicon 404.
- Teknik puan: en zayıf tasarım 21–26, referans dengeli tasarımlar 43–48.

## Docs/ADR updates
- Yeni `ADR-006-resource-needs-model.md`; `docs/decisions/README.md`.
- `04-game-rules-and-economy.md`: bileşen bedelleri tablosu, yedi oran, yeni denge koşulları, arazi sınıfları, 500 öğrenci varsayımı.
- `06-event-cards.md`: yeni bileşenlerin emilim değerleri, rüzgârın bulutlu günden etkilenmemesi.
- `09-glossary.md`: kaynak dengesi, gösterge–oran farkı, azalan getiri, oyun içi karbon.
- `07-roadmap.md`, `08-current-state.md`.

## Handoff
- Değerler ilk tahmindir; pilotta ayarlanacak tek yerler `resources.ts` (katkılar) ve `balance.ts` (hedefler).
- Sonraki aday: olayların kaynak dengelerine bağlanması (kuraklıkta su kaynağı düşer, sıcak dalgada serinletme ihtiyacı artar); böylece stres testi ana hedefi de etkiler.
- Pilot sonrası: komşuluk kuralları, sınıf düzeyine göre oran zorluğu.
