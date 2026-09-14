# Sprint 01 — Foundation & Rule Engine
Status: DONE
Goal: Çalışan Next.js iskeleti ve deterministik oyun motoru.
Roadmap outcome: R0, R1 ve R2 çekirdeği.

## Scope
- Next.js, React ve TypeScript kurulumu
- component catalogue
- bounds, overlap, bütçe, alan ve skor motoru
- event modifier altyapısı
- snapshot ve localStorage
- fallback danışman
- unit testleri ve CI

## Acceptance criteria
- [x] 10×10 grid kuralları saf fonksiyonlarla hesaplanır
- [x] zorunlu yapılar ve bütçe doğrulanır
- [x] beş skor AI kullanılmadan üretilir
- [x] olay kartları deterministik etki uygular
- [x] snapshot değişmez kopyadır
- [x] AI yokken 2–3 soru üretilebilir

## Verification
GitHub Actions: lint, typecheck, test ve build.
