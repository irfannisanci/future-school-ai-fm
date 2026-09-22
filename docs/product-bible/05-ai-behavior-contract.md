# AI Behavior Contract

## AI'nın görevi
Tasarımı öğrencinin yerine yapmak değil; öğrencinin oran hesabını açıklamak, tasarım kararını sorgulatmak ve kanıta dayalı bir jüri değerlendirmesi sunmak.

## Girdi
AI'ya serbest veri yığını değil yapılandırılmış özet gönderilir:
- gradeBand
- selectedChallenge
- designPhase (ilk tasarım / yeniden tasarım)
- areaMetrics
- budgetUsed / budgetLimit
- fiveScores
- componentSummary
- studentRatio (pay / payda)
- eventCard
- studentDesignIntent

## Çıktı
- oran için sadeleştirilmiş kesir, ondalık gösterim, yüzde ve kısa açıklama
- jüri raporunda en az bir sayısal metriğe atıf
- 6. sınıf öğrencisinin ilk okuyuşta anlayacağı Türkçe: cümle başına en fazla 15 kelime, tek fikir, "sen" hitabı, her sayının neyi saydığı yazılı; yasak kelime listesi (gösterge, olaysız, kapasite, kısıt, döngüsellik, emilim, şok, koruma koşulu…) sistem isteminde (`docs/ux/05-language-guide.md`, Sprint 08)
- problemin çözülme düzeyi: çözüldü / kısmen çözüldü / henüz çözülmedi
- 50 puanlık açıklanabilir jüri rubriği ve kullanılan kanıtlar

## Öğrenciye sorulan sorular
Ekrandaki sorular LLM'den değil deterministik soru bankasından gelir (`src/lib/game/diagnostics.ts`). Her takıma üç kısa yorum sorusu sorulur:
1. seçilen sorun hakkında genel bir soru (ör. “Okulda enerji tasarrufu için neler yapılabilir?”),
2. takımın kendi tasarımına bağlı tek bir soru (eksik kalan hedef için “ne ekleyebilirsin?”, her koşul sağlandıysa “en çok işe yarayan bileşen hangisi, neden?”),
3. seçilen sorun hakkında ikinci bir genel soru.

Sorular 6. sınıf düzeyindedir, hesap gerektirmez, tek doğru cevabı yoktur. Sayısal çalışma oran laboratuvarında ve bulgu kartlarında kalır.

## Yeniden tasarım karşılaştırması
Redesign aşamasında `before` verisi, ilk tasarımın aynı olay koşulu altındaki değerleridir (ADR-005). AI olayın etkisini öğrencinin kararının sonucu gibi sunmaz.

## Puanlama sınırı
- Teknik/matematik puanı (50) deterministik TypeScript motorunda hesaplanır.
- AI jüri puanı (50) hedefe uygunluk, riskleri fark etme, kanıt kullanma ve tasarım tutarlılığı rubriğine dayanır.
- AI puanı tek başına gösterilmez; alt ölçütler ve dayanaklar öğrenciye açıklanır.
- Toplam oyun puanı iki bölümün toplamıdır.
- Her sorun için deterministik `challengeBalance` sonucu kullanılır: dengeli çözüm, ana hedef tamam/yan etkiler var veya henüz çözülmedi.
- AI yalnızca bütün denge koşulları sağlandığında sorunu “çözüldü” olarak değerlendirebilir.
- Ana hedef sağlanıp bir koruma koşulu bozulduğunda AI, yeni oluşan sorunu açıkça belirtir ve sonucu “kısmen çözüldü” olarak verir.

## Yapmamalı
- doğrudan nihai tasarım vermemeli
- “%20 yeşil alan yap” gibi emir vermemeli
- öğrenciden kişisel veri istememeli
- bilimsel kesinlik uydurmamalı
- tasarımın ölçülebilir verileriyle desteklenmeyen puan veya sonuç üretmemeli
- öğrencinin pay ve payda girişini sessizce değiştirmemeli

## Fallback
Model cevap yazmadan önce düşünür; düşünme tokenları `max_output_tokens` sınırına dahildir. Sınır dar olursa JSON yarıda kesilir ve oyun yedek moda düşer. Bu yüzden jüri 3.000, matematik 1.500 token sınırıyla çağrılır; yarıda kesilen cevap konsola nedeniyle yazılır. OpenAI çağrısının zaman aşımı 30 sn, en fazla 1 yeniden deneme yapılır.

AI servisi çalışmazsa oyun devam eder: sorular zaten kural tabanlıdır, oran laboratuvarı deterministik yedek hesapla (`fallbackMathResult`) ilerler, jüri bölümünde motorun doğruladığı bulgular gösterilir. Kesir, yüzde, bütçe ve teknik puan kontrolleri deterministik motorla doğrulanır; hatalı bir LLM matematik sonucu kabul edilmez.
