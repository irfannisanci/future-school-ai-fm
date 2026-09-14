# ADR-003 — AI Does Not Score

**Status:** Accepted

## Context
AI çıktıları değişken olabilir; matematiksel sonuçların yeniden üretilebilir olması gerekir.

## Decision
Skor ve oyun kuralları deterministik TypeScript motorunda hesaplanır. AI yalnızca yapılandırılmış sonuç özetini yorumlayıp soru sorar.

## Consequences
Test edilebilirlik artar, pedagojik kontrol güçlenir, AI maliyeti/arıza riski core oyunu etkilemez.