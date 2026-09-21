# ADR-003 — AI Does Not Score

**Status:** Superseded by ADR-004

## Context
AI çıktıları değişken olabilir; matematiksel sonuçların yeniden üretilebilir olması gerekir.

## Decision
Skor ve oyun kuralları deterministik TypeScript motorunda hesaplanır. AI yalnızca yapılandırılmış sonuç özetini yorumlayıp soru sorar.

## Consequences
Test edilebilirlik artar, pedagojik kontrol güçlenir, AI maliyeti/arıza riski core oyunu etkilemez.

## Supersession
Kullanıcıyla birlikte alınan yeni ürün kararı, teknik/matematik puanını deterministik tutarken açıklanabilir bir AI jüri puanı ekler. Güncel karar için ADR-004'e bakın.
