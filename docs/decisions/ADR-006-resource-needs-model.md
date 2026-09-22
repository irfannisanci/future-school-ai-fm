# ADR-006 — Resource–Needs Model for Every Challenge

**Status:** Accepted

## Context
Pilot öncesi kullanıcı geri bildirimi iki eksik gösterdi: (1) bir bileşen eklemek hiçbir durumu olumsuz etkilemiyordu; bütün katkılar sıfır veya artıydı ve tek bedel bütçeydi. (2) Oran laboratuvarı çok basitti: enerji payında yalnızca güneş paneli vardı; diğer görevlerde oran kare saymaktan ibaretti ve görevin ana hedefiyle bağı yoktu.

## Decision
- Her sorunun bir **kaynak dengesi** vardır: `oran = kaynak ÷ (ihtiyaç − tasarruf)`. Yedi denge (`src/lib/game/resources.ts`): enerji, su, yağmur tutma, serinletme, ulaşım kapasitesi, hareket alanı kapasitesi, oyun içi karbon.
- Ana hedef her görevde öğrencinin oran laboratuvarında hesapladığı oranın kendisidir (en az %70). Koruma koşulları, ana stratejinin kötüleştirdiği başka bir dengeyi izler; hiçbir zaman bozulamayan "Açık alan ≥ %65" koşulu kaldırıldı.
- Bileşenlerin gerçek hayat bedelleri motor verisidir: kaynak ihtiyacı (çim su ister, beton yağmuru emmez ve ısınır) ve negatif gösterge katkısı (türbin gürültüsü, sivrisinek, pil atığı). Etki kartındaki sayısal satırlar aynı veriden üretilir.
- Yeni bileşenler: rüzgâr türbini (ikinci enerji kaynağı, bulutlu günden etkilenmez), yaya yolu, gri su arıtma. Doğal aydınlatma enerji üretmez, ihtiyacı azaltır; paydada tasarruf olarak kalır.
- Azalan getiri her kaynakta açık dizilerle tanımlanır (ör. güneş 5, 5, 5, sonra 2). Oran kartları işlemi gösterir, sonucu göstermez.
- Enerji dengesi mevcut `energy.ts` modeliyle birebir eşittir; bu eşitlik testle korunur.

## Consequences
Her görevde çok kaynaklı, toplama–çarpma–çıkarma–bölme içeren bir oran hesabı vardır ve bu oran oyunun başarı ölçütüdür. Değerler eğitsel oyun birimidir; karbon gerçek karbon hesabı değildir. Değerler ilk tahmindir ve pilotta ayarlanır. Olaylar bu sprintte yalnızca enerji dengesini doğrudan etkiler; diğer olayların kaynak dengelerine bağlanması sonraki adaydır.
