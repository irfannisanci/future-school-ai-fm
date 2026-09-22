# ADR-005 — Event Cards as a Deterministic Stress Test

**Status:** Accepted

## Context
2040 olay kartları çoğu durumda göstergelere puan ekliyordu (sıcak hava dalgasında 6 gölgelik = iklim +48). Öğrenci hiçbir şey değiştirmese de puanı yükseliyor, kart metni ("su %30 azaldı") ile mekanik çelişiyordu. Ayrıca ilk tasarım olaysız, son tasarım olaylı ölçüldüğü için önce/sonra farkı öğrencinin kararını değil olayın kendisini de içeriyordu.

## Decision
- Her olay kartı odak göstergede sabit bir **şok** üretir; hazırlık bileşenleri bu şoku **emer**. Emilim şoku aşamaz: bir olay hiçbir göstergeyi artıramaz. Değerler `src/lib/game/events.ts` içinde tek tabloda tutulur.
- Kalan kayıp, 0–100 sıkıştırmasından sonra odak göstergeden düşülür; kayıp her zaman görünür ve açıklanabilir olur.
- Enerji kısıtı, üretimi düşüren mevcut enerji dengesi modelinde kalır.
- Karşılaştırma üç noktalıdır: ilk tasarım normal koşulda → ilk tasarım olay altında → yeniden tasarım olay altında. Önce/sonra farkları, AI'ya gönderilen `before` verisi ve sergi çıktısı **olay altındaki ilk tasarımı** temel alır.
- Toparlanma, odak göstergede "kaybın yüzde kaçı geri kazanıldı" olarak deterministik hesaplanır.

## Consequences
Neden–sonuç ilişkisi netleşir; hiçbir şey değiştirmeyen takımın farkı tam 0 olur. Puanlar önceki modele göre düşer; arayüz dili "kaybettin" yerine "olay şu kadar zorladı, şu kadarını geri kazandın" biçimindedir. Şok değerleri ilk tahmindir ve pilot bulgularıyla ayarlanır.

## Amendment — Sprint 07
Pilot testinde öğrenci "olay etkisi" notundaki düşüşü göremedi: düşüş yalnızca gösterge çubuğundaydı, takip ettiği denge kartı ve oranlar olaydan etkilenmiyordu; karşılaştırma tablosu iki tasarımı da olay altında gösterdiği için "54 → 54" yazıyordu. Karar:
- Olay, gösterge şokuna ek olarak kendi **kaynak oranını** kart metnindeki gerçek hayat etkisiyle bozar (ör. aşırı yağışta akan yağmur × 1,5). Olay hiçbir oranı yükseltemez.
- Olayın oranı görevin ölçütleri arasında değilse yeniden tasarımda "2040 koşulu" (en az %50) eklenir; böylece 49 sorun × olay kombinasyonunun hepsinde olayın izlenebilir bir sonucu olur. Hepsinin bütçe içinde çözülebilirliği testle korunur.
- Karşılaştırma üç noktalı gösterilir (ilk tasarım → 2040 olayında → yeniden tasarım) ve farklar "olay" ile "sen" olarak ayrılır. Sprint 05'in adil karşılaştırma ilkesi korunur: "sen" farkı olaydaki ilk tasarıma göre hesaplanır.

