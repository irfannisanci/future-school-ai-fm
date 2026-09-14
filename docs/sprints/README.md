# Sprint Operating Model

Bu klasörde sprintleri Claude Code planlar ve yürütür. Roadmap burada kopyalanmaz.

## Yeni sprint açma
Claude Code:
1. repository + docs okur
2. current state ve roadmap'e göre en küçük anlamlı sonucu seçer
3. `sprint-XX-<slug>.md` oluşturur
4. planı yazar
5. aynı sprintte implement eder
6. test/lint/build çalıştırır
7. acceptance criteria kanıtlarını ekler
8. current-state ve roadmap günceller
9. sprint dosyasını DONE / BLOCKED olarak kapatır

## Sprint dosyası şablonu
```md
# Sprint XX — Name
Status: PLANNED | IN_PROGRESS | DONE | BLOCKED
Goal:
Roadmap outcome:

## Scope
## Out of scope
## Implementation plan
## Files expected to change
## Acceptance criteria
## Test plan
## Risks / rollback
## Implementation notes
## Verification results
## Docs/ADR updates
## Handoff
```

## Kural
Sprint boyutu “tek oturumda güvenle planlanıp uygulanabilir ve doğrulanabilir” olmalıdır. Gerekirse bir roadmap sonucu birkaç sprint'e bölünür.