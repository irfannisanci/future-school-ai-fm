# FutureSchool AI

5–8. sınıf öğrencilerinin 2040 İstanbul'u için sürdürülebilir bir okul kampüsü tasarladığı, matematik ve iklim odaklı takım deneyimi.

## Çalışan MVP

Tasarla → Ölç → İlk tasarımı kilitle → AI ile sorgula → 2040 olayına uyum sağla → Karşılaştır → Savun → Sergile

- 10×10 grid; ekleme, taşıma, döndürme, silme ve geri alma
- alan, yüzde, bütçe ve beş deterministik oyun skoru
- zorunlu koşul, sınır ve çakışma doğrulaması
- AI bilim danışmanı; servis yoksa kural tabanlı fallback
- beş 2040 olay kartı ve olay etkili yeniden puanlama
- ilk/son tasarım snapshot ve delta karşılaştırması
- A3 yazdır/PDF, PNG, fullscreen ve hızlı takım reseti
- localStorage tabanlı, hesapsız ve kişisel veri toplamayan kullanım
- responsive tablet/masaüstü arayüzü

## Yerelde çalıştırma

Gereksinim: Node.js 22.

~~~bash
npm install
npm run dev
~~~

Tarayıcıda http://localhost:3000 adresini aç.

## Kalite komutları

~~~bash
npm run lint
npm run typecheck
npm test
npm run build
~~~

Aynı dört kontrol her main push ve pull request için GitHub Actions üzerinde çalışır.

## Opsiyonel AI yapılandırması

Uygulama AI anahtarı olmadan tamamen çalışır. OpenAI-compatible bir chat completions servisi bağlamak için .env.example dosyasını .env.local olarak kopyala ve üç değeri doldur:

~~~env
AI_API_URL=https://provider.example/v1/chat/completions
AI_API_KEY=...
AI_MODEL=...
~~~

Anahtar yalnızca server-side API route tarafından okunur. İstemciye gönderilmez. Sağlayıcı 8 saniye içinde cevap vermezse kural tabanlı sorular korunur.

## Dokümantasyon

- docs/product-bible: yaşayan ürün kararları
- docs/ux: akış, ekran ve tasarım sistemi
- docs/architecture: mimari, veri, güvenlik, test ve deployment
- docs/decisions: ADR kayıtları
- docs/sprints: uygulama ve doğrulama kanıtları
