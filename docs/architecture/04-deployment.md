# Deployment

## MVP hedefi
Okul bilgisayarlarından HTTPS linki ile açılabilen, assetleri hafif, AI kapalıyken temel fonksiyonları süren web uygulaması.

## Sergi kontrol listesi
- Wi-Fi testi
- AI servis timeout/fallback (OpenAI zaman aşımı 30 sn + 1 yeniden deneme; hosting seçilince istek süresi sınırı buna göre ayarlanmalı, ör. Next.js `maxDuration`)
- kiosk fullscreen
- yazıcı/PDF testi
- 15 sn altında yeni takım reseti
- yedek tarayıcı sekmesi/yerel demo

Hosting sağlayıcısı implementasyon sprintinde seçilir; vendor lock-in erken kararlaştırılmaz.