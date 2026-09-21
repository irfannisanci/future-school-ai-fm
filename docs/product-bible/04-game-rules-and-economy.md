# Game Rules & Economy

## Grid
- 10×10 = 100 hücre
- 1 hücre = 100 m²
- toplam = 10.000 m²

## Başlangıç bileşenleri
| Bileşen | Boyut | Alan | Maliyet puanı | Ana katkı |
|---|---:|---:|---:|---|
| Eğitim binası | 2×3 | 600 m² | 18 | kapasite |
| Spor salonu | 2×2 | 400 m² | 12 | sağlık/hareket |
| Yeşil alan | 1×1 | 100 m² | 2 | iklim/doğa |
| Güneş paneli | 1×1 | 100 m² | 5 | enerji |
| Yağmur suyu alanı | 1×1 | 100 m² | 4 | su |
| Geri dönüşüm merkezi | 1×1 | 100 m² | 3 | döngüsellik |
| Bisiklet parkı | 1×1 | 100 m² | 2 | aktif ulaşım |
| Ağaç/gölgelik | 1×1 | 100 m² | 2 | ısı uyumu |
| Öğrenci bahçesi | 1×1 | 100 m² | 3 | doğa/öğrenme |
| Açık hava sınıfı | 1×1 | 100 m² | 3 | öğrenme/doğa |
| Yalıtım ve verimlilik | 1×1 | 100 m² | 5 | enerji tasarrufu |
| Doğal aydınlatma | 1×1 | 100 m² | 3 | enerji tasarrufu/sağlık |
| Enerji depolama | 1×1 | 100 m² | 7 | olay dayanıklılığı |

## MVP kuralları
- En az 1 eğitim binası bulunmalı.
- En az 1 spor/hareket alanı bulunmalı.
- Bileşenler üst üste gelemez ve grid dışına taşamaz.
- Örnek başlangıç bütçesi: 100 oyun puanı. Pilot sonrası dengelenir.
- Yüzde = kullanılan hücre / 100 × 100.

## Arazi kullanımı sınıfları
- **Yapı:** Eğitim binası, spor salonu ve geri dönüşüm merkezi açık alanı azaltır.
- **Açık alan bileşeni:** Yeşil alan, yağmur suyu alanı, bisiklet parkı, ağaç/gölgelik, öğrenci bahçesi ve açık hava sınıfı yerleştirildiğinde açık alan yüzdesi düşmez.
- **Zemin altyapısı:** Güneş paneli ve enerji depolama yapı yüzdesine eklenmez ancak kullanılabilir açık alanı azaltır.
- **Bina iyileştirmesi:** Yalıtım ve doğal aydınlatma ayrı arazi alanı kullanmaz ve alan oranlarının paydasına girmez. Griddeki konumu uygulamanın temsili işaretidir.
- Açık alan yüzdesi = 100 − yapı yüzdesi − zemin altyapısı yüzdesi.
- Yeşil alan yüzdesi açık alandan ayrı izlenir; her açık alan yeşil alan değildir.

## Enerji denge görevi
- Eğitim binası 12, spor salonu 8, geri dönüşüm merkezi 2 enerji birimi ihtiyaç oluşturur.
- İlk üç güneş paneli 5'er birim; sonraki paneller 2'şer birim üretir.
- Yalıtım, doğal aydınlatma ve en fazla iki gölgelik net enerji ihtiyacını azaltır.
- Net enerji ihtiyacı oyun içinde en az 5 birimdir.
- Enerji görevinin dengeli çözülmesi için karşılama oranı en az %70, yeşil alan en az %15 ve bütçe en fazla 100 olmalıdır.
- Enerji karşılama oranı = yenilenebilir enerji üretimi / net enerji ihtiyacı.
- Enerji kısıtı olayında güneş üretimi düşer; depolama kaybın bir bölümünü karşılar.

## Tüm görevlerde denge modeli
Her sorun bir ana hedef, iki koruma koşulu ve ortak bütçe sınırı içerir. Ana hedef tamamlanıp koruma koşullarından biri sağlanmazsa sonuç “ana hedef tamam; diğer koşullar eksik” olur. İlk tasarımda görülen bir eksiklik, seçilen çözümün onu oluşturduğuna dair kanıt sayılmaz. Olumsuz etki ifadesi yalnızca önce–sonra karşılaştırmasında değer gerçekten düştüğünde kullanılır.

| Sorun | Ana hedef | Koruma koşulu 1 | Koruma koşulu 2 |
|---|---|---|---|
| Aşırı sıcak | İklim ve serinlik ≥ 60 | Su yönetimi ≥ 25 | Açık alan ≥ %65 |
| Kuraklık | Su yönetimi ≥ 60 | Yeşil alan ≥ %12 | İklim dayanıklılığı ≥ 40 |
| Yoğun yağış | Yağmur yönetimi ≥ 60 | Açık alan ≥ %65 | Yeşil alan ≥ %12 |
| Enerji kısıtı | Enerji karşılama ≥ %70 | Yeşil alan ≥ %15 | Sağlık ve hareket ≥ 35 |
| Aktif ulaşım | Aktif ulaşım erişimi ≥ 60 | Sağlık ve hareket ≥ 55 | İklim dayanıklılığı ≥ 40 |
| Sağlıklı yaşam | Sağlık ve hareket ≥ 60 | Açık alan ≥ %65 | Yeşil alan ≥ %12 |
| Karbon azaltma | Karbon azaltma dengesi ≥ 60 | Temiz enerji karşılama ≥ %50 | Sağlık ve hareket ≥ 40 |

Tüm görevlerde bütçe kullanımı en fazla 100 puandır. Denge ölçümleri deterministik oyun motorunda hesaplanır; AI bu sonuçları yorumlar, değiştirmez.

## Skor alanları
- İklim dayanıklılığı %25
- Su yönetimi %20
- Enerji %20
- Sağlık & hareket %20
- Döngüsellik & doğa %15

> Bu skorlar eğitsel oyun puanıdır; gerçek mühendislik veya karbon ölçümü değildir.
