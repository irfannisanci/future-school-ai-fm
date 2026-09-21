# ADR-004 — Hybrid Technical Score and AI Jury

**Status:** Accepted

## Context
Oyunun hedefi yalnızca doğru yerleşimi ödüllendirmek değil; öğrencinin sürdürülebilirlik sorununu tanımasını, oran ve grafik bilgisini kullanmasını, kararlarının yararlarını ve risklerini açıklamasını sağlamaktır. Yalnızca deterministik ölçümler tasarım gerekçesini değerlendiremez; yalnızca AI puanı ise tekrar üretilebilir ve denetlenebilir değildir.

## Decision
Toplam 100 puan iki eşit bölümden oluşur:

- 50 puan teknik/matematik: yerleşim geçerliliği, sürdürülebilirlik göstergeleri ve doğrulanmış oran çalışması. Deterministik TypeScript motoru hesaplar.
- 50 puan AI jüri: hedefe uygunluk (20), yarar ve riskleri fark etme (15), kanıt kullanma (10), tasarım tutarlılığı (5). LLM yapılandırılmış bir rubrik, kısa gerekçe ve kullandığı kanıtları üretir.

LLM'nin kesir, ondalık ve yüzde hesabı deterministik motor tarafından doğrulanır. Matematiksel olarak hatalı veya şemaya uymayan çıktı öğrenciye doğru sonuç olarak gösterilmez. AI hizmeti kullanılamadığında oyun teknik ölçümler ve kural tabanlı sorularla devam eder.

## Consequences
Öğrenci hem ölçülebilir tasarım performansını hem de karar gerekçesini görür. AI değerlendirmesi açıklanabilir olur ve tek başına nihai otorite değildir. Ek API gecikmesi ve maliyeti oluşur; buna karşılık şema doğrulaması, zaman aşımı ve fallback davranışı gerekir.
