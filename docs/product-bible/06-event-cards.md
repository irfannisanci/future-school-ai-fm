# 2040 Event Cards

Olay kartı bir **stres testidir**: odak göstergede sabit bir şok üretir, hazırlık bileşenleri şoku emer. Bir olay hiçbir göstergeyi artıramaz (ADR-005).

Her olay iki şeyi birlikte yapar (ADR-005 eki, Sprint 07):
1. **Kendi oranını bozar:** kart metnindeki gerçek hayat etkisiyle ilgili kaynak dengesini değiştirir. Oran görevin ölçütlerinden biriyse o ölçüt zorlaşır; değilse yeniden tasarımda **"2040 koşulu: <oran> en az %50"** olarak denge kartına eklenir.
2. **Göstergeyi şoklar:** odak göstergede sabit bir şok; hazırlık bileşenleri şoku emer. `kalan kayıp = max(0, şok − Σ adet × emilim)`.

| Olay | Oranı nasıl bozar | Odak gösterge | Şok | Emilim (bileşen başına puan) |
|---|---|---|---:|---|
| Sıcak Hava Dalgası | Serinletme: ısınan yüzeyler %30 artar (payda × 1,3) | İklim | 30 | gölgelik 5, yeşil alan 3, bahçe 2, açık hava sınıfı 1 |
| Kuraklık | Su karşılama: yağmur suyu alanları %30 az su toplar; gri su etkilenmez | Su | 30 | yağmur suyu alanı 8, gölgelik 1 |
| Aşırı Yağış | Yağmur tutma: sert yüzeylerden akan yağmur %50 artar (payda × 1,5) | Su | 30 | yağmur suyu alanı 8, yeşil alan 3, bahçe 2 |
| Arabasız Okul Haftası | Çevreci ulaşım: hedef %30 → %45 | Sağlık | 25 | bisiklet parkı 8, yaya yolu 6, gölgelik 2 |
| Sağlıklı Yaşam Haftası | Hareket alanı: hedef %40 → %50 | Sağlık | 25 | bisiklet parkı 4, gölgelik 3, açık hava sınıfı 3, yeşil alan 2, bahçe 2 |
| Yeni Karbon Kuralı | Karbon azaltma: sayılan karbon %25 artar (payda × 1,25) | İklim | 25 | güneş paneli 4, rüzgâr türbini 4, bisiklet parkı 3, geri dönüşüm 3, yaya yolu 1, yeşil alan 2, gölgelik 2 |
| Bulutlu Günler | Enerji karşılama: güneş üretimi × 0,7; her depolama 3 birim korur; rüzgâr etkilenmez | Enerji | — | (enerji göstergesi karşılama oranının kendisidir) |

Değerler `src/lib/game/resources.ts` (oran etkileri) ve `src/lib/game/events.ts` (şok/emilim) içindedir; pilot bulgularıyla ayarlanır. AI modifier üretmez.

## Karşılaştırma: olay zinciri
Her ekranda aynı zincir görünür: **ilk tasarım → 2040 olayında → yeniden tasarım**.
- Olay ekranı: önce oran (ör. Yağmur tutma %120 → %80 ve nedeni), sonra gösterge (Su 60 → 54), varsa yeni 2040 koşulu.
- Yeniden tasarım: "2040 olayı: <kart adı>" notu. Puan çubuklarında ve görev kontrolü satırlarında olayın düşürdüğü kısım **kırmızı parça** olarak çizilir (çubukta her aralık 10 birim; 10 birim düştüyse 10 birim kırmızı). Altında "olay: 60 → 54 (6 puan azaldı)" ve **"Neden?"** satırı yazar (Sprint 09).
- Karşılaştırma: gösterge tablosu `60 → 54 → 54` ("olay −6", "sen 0"); "2040 olayının ilk tasarımından düşürdükleri" kutusu. "Sen" farkları, ilk tasarımın olaydaki hâline göre hesaplanır; hiçbir şey değiştirmeyen takımın "sen" farkı 0'dır.

## Öğrenciye anlatım (Sprint 08)
Ekrandaki olay metinleri 6. sınıf diliyle yazılır (`docs/ux/05-language-guide.md`). Yeniden tasarım ekranındaki olay notunun sırası:
1. **Ne oldu:** "Yeni kurala göre okulun ürettiği karbon %25 daha fazla sayılıyor. Okulun karbonu: 21 → 26 birim."
2. **Oran:** "Karbon azaltma oranın: normal günde %195 → bu olayda %158"
3. **Puan:** "Bu olay İklim puanını 25 puan düşürebilirdi. Bileşenlerin bunun hepsini önledi; İklim puanın düşmedi." (kısmi durumda: "…bunun 10 puanını önledi. İklim puanın 15 puan düştü."; koruyan bileşen yoksa: "…25 puan düşürdü. Tasarımında bu olaya karşı koruyan bir bileşen yok.")
4. **Koruyan bileşenler** ve **"olay −N" etiketinin anlamı.**

Karbon, öğrencinin onu ilk gördüğü yerde (sorun kartı ve olay kartı) tek cümleyle açıklanır. Olay kimlikleri (`activeTransport`, `energyLimit`, `carbonLimit`) değişmedi; yalnızca ekrandaki adlar değişti.
