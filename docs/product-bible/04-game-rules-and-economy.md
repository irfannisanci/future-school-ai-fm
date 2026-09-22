# Game Rules & Economy

## Grid
- 10×10 = 100 hücre
- 1 hücre = 100 m²
- toplam = 10.000 m²

## Bileşenler, kazançları ve gerçek hayat bedelleri
Her bileşenin bütçe dışında en az bir bedeli vardır (ADR-006). Kaynak katkıları `src/lib/game/resources.ts`, gösterge katkıları `src/lib/game/catalog.ts` içindedir.

| Bileşen | Boyut | Maliyet | Kazanç | Bedel (gerçek hayat gerekçesi) |
|---|---:|---:|---|---|
| Eğitim binası | 2×3 | 18 | derslikler (zorunlu) | 12 enerji, 8 su; beton yağmuru emmez ve ısınır |
| Spor salonu | 2×2 | 12 | 60 öğrencilik hareket alanı (zorunlu) | 8 enerji, 6 su; geniş çatı ısınır |
| Yeşil alan | 1×1 | 2 | serinletir, yağmuru emer, 8 öğrencilik oyun alanı | sulama: 1 su |
| Güneş paneli | 1×1 | 5 | 5 enerji (4. panelden sonra 2) | ısınır, yağmur akıtır, panel atığı; bulutlu günde üretim düşer |
| Rüzgâr türbini | 1×1 | 8 | 6 enerji (3. türbinden sonra 3); bulutlu günden etkilenmez | gürültü (sağlık −4), kuşlar (doğa −3) |
| Yağmur suyu alanı | 1×1 | 4 | 6 su ve 8 birim yağmur tutar (4. depodan sonra azalır) | durgun su, sivrisinek (sağlık −2) |
| Gri su arıtma | iyileştirme | 6 | 5 su (sonra 3) | pompası 1 enerji ister |
| Geri dönüşüm merkezi | 1×1 | 3 | 3 karbon azaltır | 2 enerji; koku ve kamyon (sağlık −2) |
| Bisiklet parkı | 1×1 | 2 | 20 öğrenci (6. parktan itibaren 10) | asfalt yağmuru emmez ve ısınır |
| Yaya yolu | 1×1 | 2 | 15 öğrenci (3. yoldan itibaren 10) | sert zemin yağmuru emmez ve ısınır |
| Ağaç / gölgelik | 1×1 | 2 | 3 serinlik, yağmur tutar, en çok 2 ağaç enerji tasarrufu | genç ağaç sulanır: 1 su |
| Öğrenci bahçesi | 1×1 | 3 | serinletir, yağmur emer, 5 öğrencilik hareket | çok su ister: 2 su |
| Açık hava sınıfı | 1×1 | 3 | 10 öğrencilik hareket alanı | sert zemin yağmuru emmez |
| Bina yalıtımı | iyileştirme | 5 | 4, 3, 1 enerji tasarrufu; bina yazın az ısınır | malzemesi zor geri dönüşür (doğa −2) |
| Gün ışığı pencereleri | iyileştirme | 3 | 3, 2, 1 enerji tasarrufu | büyük pencere yazın ısıtır (2 ısınan yüzey, iklim −3) |
| Enerji depolama | 1×1 | 7 | bulutlu günde 3 birim güneş üretimini korur | normal günde üretmez; pil atığı (doğa −4) |

## MVP kuralları
- En az 1 eğitim binası bulunmalı.
- En az 1 spor/hareket alanı bulunmalı.
- Bileşenler üst üste gelemez ve grid dışına taşamaz.
- Örnek başlangıç bütçesi: 100 oyun puanı. Pilot sonrası dengelenir.
- Yüzde = kullanılan hücre / 100 × 100.
- Oyun 500 öğrencilik bir okul varsayar (ulaşım ve hareket alanı oranlarının paydası).

## Arazi kullanımı sınıfları
- **Yapı:** Eğitim binası, spor salonu ve geri dönüşüm merkezi açık alanı azaltır.
- **Açık alan bileşeni:** Yeşil alan, yağmur suyu alanı, bisiklet parkı, yaya yolu, ağaç/gölgelik, öğrenci bahçesi ve açık hava sınıfı yerleştirildiğinde açık alan yüzdesi düşmez.
- **Zemin altyapısı:** Güneş paneli, rüzgâr türbini ve enerji depolama yapı yüzdesine eklenmez ancak kullanılabilir açık alanı azaltır.
- **Bina iyileştirmesi** (ekranda "Binaya eklenir; yer kaplamaz"): Bina yalıtımı, gün ışığı pencereleri ve gri su arıtma ayrı arazi alanı kullanmaz ve alan oranlarının paydasına girmez. Griddeki konumu uygulamanın temsili işaretidir.
- Açık alan yüzdesi = 100 − yapı yüzdesi − zemin altyapısı yüzdesi.
- Yeşil alan yüzdesi açık alandan ayrı izlenir; her açık alan yeşil alan değildir.

## Kaynak–ihtiyaç oranları (her görevin ana hedefi)
`oran = kaynak ÷ (ihtiyaç − tasarruf)`; ana hedef her görevde en az %70. Payda en az 1'dir; enerjide en az 5.

| Görev | Oran | Pay (kaynak) | Payda (ihtiyaç − tasarruf) |
|---|---|---|---|
| Temiz enerji | Enerji karşılama | güneş + rüzgâr üretimi | binalar, dönüşüm, gri su pompası − yalıtım, gün ışığı, en çok 2 ağaç |
| Kuraklık | Su karşılama | yağmur suyu alanı + gri su arıtma | binalar + sulanan yeşil, ağaç, bahçe |
| Yoğun yağış | Yağmur tutma | yağmur suyu alanı + yeşil, bahçe, ağaç | sert yüzeylerden akan yağmur |
| Aşırı sıcak | Serinletme | ağaç, yeşil, bahçe, su yüzeyi | güneşte ısınan yüzeyler − yalıtım |
| Aktif ulaşım | Çevreci ulaşım | bisiklet parkı + yaya yolu | 500 öğrencinin %30'u (500 × 30 ÷ 100) |
| Sağlıklı yaşam | Hareket alanı | spor salonu, açık sınıf, yeşil, bahçe, bisiklet, yaya yolu | 500 öğrencinin %40'ı |
| Karbon azaltma | Karbon azaltma (oyun birimi) | güneş, rüzgâr, dönüşüm, bisiklet, yaya yolu, ağaç, yeşil | binalar, dönüşüm, pil − yalıtım, gün ışığı |

- Bulutlu Günler olayında güneş üretimi ×0,7 olur; her depolama 3 birimi korur; rüzgâr etkilenmez.
- Oran kartları işlemi gösterir (ör. `3 × 5 + 2 = ?`), sonucu göstermez.

## Tüm görevlerde denge modeli
Her sorun bir ana hedef (kendi oranı ≥ %70), iki koruma koşulu ve ortak bütçe sınırı içerir. Koruma koşulları, ana stratejinin kötüleştirdiği başka bir dengeyi izler. Ana hedef tamamlanıp koruma koşullarından biri sağlanmazsa sonuç "Ana hedef tamam; ek koşullarda eksik var" olur. Ekranda koruma koşulu **"ek koşul"** diye yazılır (`docs/ux/05-language-guide.md`).

| Sorun | Ana hedef | Koruma koşulu 1 | Koruma koşulu 2 |
|---|---|---|---|
| Aşırı sıcak | Serinletme ≥ %70 | Su karşılama ≥ %50 (ağaç ve çim su ister) | Enerji karşılama ≥ %30 |
| Kuraklık | Su karşılama ≥ %70 | Yeşil alan ≥ %12 | Serinletme ≥ %50 |
| Yoğun yağış | Yağmur tutma ≥ %70 | Su karşılama ≥ %40 | Yeşil alan ≥ %12 |
| Temiz enerji | Enerji karşılama ≥ %70 | Yeşil alan ≥ %15 | Sağlık puanı ≥ 35 (türbin gürültüsü) |
| Aktif ulaşım | Çevreci ulaşım ≥ %70 | Yağmur tutma ≥ %50 (asfalt) | Serinletme ≥ %50 (asfalt ısınır) |
| Sağlıklı yaşam | Hareket alanı ≥ %70 | Su karşılama ≥ %50 | Enerji karşılama ≥ %30 |
| Karbon azaltma | Karbon azaltma ≥ %70 | Enerji karşılama ≥ %50 | Sağlık puanı ≥ 40 |

Tüm görevlerde bütçe kullanımı en fazla 100 puandır. Her görev için 100 bütçe içinde dengeli bir referans çözüm testlerde tutulur (`tests/resources.test.ts`). Denge ölçümleri deterministik oyun motorunda hesaplanır; AI bu sonuçları yorumlar, değiştirmez.

## Olay kartları (stres testi)
Olay iki şey yapar: kendi kaynak oranını kart metnindeki gerçek hayat etkisiyle bozar ve odak göstergede şok üretir (hazırlık bileşenleri şoku emer). Olay hiçbir oranı veya göstergeyi artıramaz. Olayın oranı görevin ölçütleri arasında değilse yeniden tasarımda "2040 koşulu: oran en az %50" eklenir; teknik puanda koruma koşulu gibi sayılır. 7 sorun × 7 olayın hepsi 100 bütçe içinde dengelenebilir (`tests/resources.test.ts`). Ayrıntılar: `06-event-cards.md`, ADR-005.

## Teknik/matematik puanı (50)
Geçerli yerleşim 5 • doğrulanmış oran 15 • denge koşulları 20 • beş gösterge toplamı 10. Denge puanı = ana hedef ilerlemesi × (12 + 8 × koruma koşulları ortalaması). Son puan olay koşulu altında hesaplanır. Hesap `src/lib/game/scoring.ts` içindedir.

## Skor alanları
- İklim dayanıklılığı %25
- Su yönetimi %20
- Enerji %20
- Sağlık & hareket %20
- Döngüsellik & doğa %15

> Bu skorlar eğitsel oyun puanıdır; gerçek mühendislik veya karbon ölçümü değildir.
