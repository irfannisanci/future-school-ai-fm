# Architecture

## Önerilen MVP
- Next.js + React + TypeScript
- CSS Grid + basit drag/drop veya click-to-place
- kural motoru: saf TypeScript fonksiyonları
- state: local state + localStorage
- AI: server-side API route
- DB: MVP'de yok
- export: tarayıcı tabanlı PNG/PDF

## Katmanlar
UI → Game State → Rule Engine → Score Engine
                         ↘ AI Adapter (yalnızca özet okur)

AI katmanı core game logic için zorunlu bağımlılık değildir.