# Current State

**Durum:** MVP IMPLEMENTED / PILOT READY — Sprint 09 (olay kaybı çubukta kırmızı) DONE

## Tamamlanan

- Next.js + React + TypeScript uygulama temeli
- responsive takım girişi, 7 sürdürülebilirlik sorunu ve görev akışı
- 10×10 click-to-place kampüs tasarımcısı; taşıma, döndürme, silme ve undo
- deterministik alan, bütçe, kural, beşli skor ve enerji dengesi motoru
- her sorun için denge modeli: ana hedef + iki koruma koşulu + bütçe
- oran laboratuvarı (pay/payda, kesir, ondalık, yüzde) ve AI'sız deterministik yedek hesap
- hibrit puan: 50 teknik/matematik (deterministik) + 50 AI jüri (rubrikli)
- 2040 olay kartları **stres testi** olarak: şok–emilim modeli, üç noktalı karşılaştırma (normal → olay altında → yeniden tasarım), toparlanma yüzdesi (ADR-005)
- 6. sınıf düzeyinde kural tabanlı yorum soruları
- her görevde çok kaynaklı "kaynak ÷ ihtiyaç" oranı; ana hedef öğrencinin hesapladığı oran (ADR-006)
- 16 bileşen, her birinin gerçek hayat bedeli; rüzgâr türbini, yaya yolu ve gri su arıtma yeni
- olay zinciri: olay kendi oranını ve odak göstergeyi düşürür; her ekranda ilk tasarım → 2040 olayında → yeniden tasarım; gerekiyorsa "2040 koşulu"
- olay kaybı çubukta: puan ve görev çubuklarında olayın düşürdüğü kısım düşüş kadar kırmızı (her aralık 10 birim, koyu çizgi hedef); altında "olay: 60 → 54 (6 puan azaldı)" ve "Neden?" satırı
- 6. sınıf öğrenci dili: olay notu "ne oldu → oran → puan neden düştü/düşmedi → etiketin anlamı" sırasıyla; kısa cümleler, "sen" hitabı, karbon ilk geçtiği yerde açıklanır; yasak kelimeler testle korunur; AI istemleri aynı kuralları içerir (`docs/ux/05-language-guide.md`)
- önce/sonra karşılaştırma ve zorunlu takım gerekçesi
- A3 yazdır/PDF ve PNG sergi çıktısı
- her adımda "Ana sayfa" bağlantısı ve kaldığın yerden devam
- fullscreen, localStorage (v5) ve hızlı reset
- GitHub Actions: lint, typecheck, test, production build

## Doğrulama (yerel, Sprint 09)

- ESLint: passed
- TypeScript: passed
- Vitest: 13 dosya / 65 test passed
- Next.js production build: passed (ayrı kopyada)
- Tarayıcı (AI kapalı, headless Chrome): kuraklık + Arabasız Okul Haftası (puan düşüşü, 2040 koşulu), yoğun yağış + Aşırı Yağış (hedefi aşan oranın düşüşü), karbon + Yeni Karbon Kuralı; kırmızı parçalar ve "Neden?" satırları — passed

- Düzeltme (Sprint 09 sonrası): yeniden tasarım AI jürisi 503 dönüyordu. Model cevap yazmadan önce düşünüyor ve düşünme tokenları `max_output_tokens` sınırına dahil; 1.000 sınırında JSON yarıda kesiliyordu (`status: incomplete, reason: max_output_tokens`). Sınırlar yükseltildi (jüri 3.000, matematik 1.500) ve kesilme nedeni konsola yazılıyor. Gerçek API ile 3 × (ilk jüri, yeniden tasarım jürisi, matematik) = 9/9 başarılı, en uzun 9,6 sn. Zaman aşımı 15 sn → 30 sn yapıldı (bir yeniden deneme olduğu için en kötü durumda yaklaşık 1 dk bekleme, sonra yedek mod).

Sprint 05–09 değişiklikleri henüz commit'lenmedi.

## Sonraki eylem

1. Değişiklikleri gözden geçirip commit'le.
2. Pilot: olay oran etkilerinin ve 2040 koşulu eşiğinin sınıf gözlemiyle ayarlanması; öğrencilerin takıldığı kelimelerin dil kılavuzuna eklenmesi.
3. R6 Pilot Hardening: öğretmen değerlendirmesi, 6–10 öğrenci mini testi, sınıf testi, spor salonu ve yazıcı provası; oran değerlerinin ve şokların pilot bulgularıyla ayarlanması.
