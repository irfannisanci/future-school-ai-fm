# FutureSchool AI

5–8. sınıf öğrencilerinin 2040 İstanbul'u için sürdürülebilir bir okul kampüsü tasarladığı, matematik ve iklim odaklı takım deneyimi.

## Çalışan MVP

Sorun seç → Tasarla → Ölç → Oranı hesapla → AI jürisine sun → 2040 olayına uyum sağla → Yeniden tasarla → Karşılaştır → Savun → Sergile

- 10×10 grid; ekleme, taşıma, döndürme, silme ve geri alma
- yapı, açık alan, zemin altyapısı ve arazi kullanmayan bina iyileştirmelerini ayıran alan modeli
- emojili yedi sürdürülebilirlik sorunu: aşırı sıcak, kuraklık, şiddetli yağış, enerji, aktif ulaşım, sağlıklı yaşam ve karbon azaltımı
- her bileşenin çözdüğü sorunları ve oluşturabileceği riskleri gösteren karar kartları
- 6. sınıf öğrencisinin ilk okuyuşta anlayacağı ekran ve AI metinleri (`docs/ux/05-language-guide.md`)
- yedi sorunun tamamında ana hedef + iki koruma koşulu + bütçe sınırından oluşan denge modeli
- ana hedef sağlanıp koruma koşulu bozulduğunda “çözüldü ama yan etkiler var” geri bildirimi
- enerji görevinde üretim–ihtiyaç dengesi, yeşil alan/sağlık koşulları ve azalan panel verimi
- güneş üretimine alternatif yalıtım, doğal aydınlatma ve enerji depolama çözümleri
- öğrencinin pay ve paydayı girdiği, LLM'nin oranı sadeleştirip ondalık ve yüzdeye çevirdiği matematik laboratuvarı
- öğrencinin bulduğu oranı daire grafiğinde gösteren görsel geri bildirim
- bütçe, alan, yüzde ve beş deterministik sürdürülebilirlik göstergesi
- zorunlu koşul, sınır ve çakışma doğrulaması
- ortaokul düzeyinde sorular soran AI bilim danışmanı ve kanıta dayalı AI jüri raporu
- 50 puan teknik/matematik + 50 puan AI jüri olmak üzere açıklanabilir hibrit puanlama
- yedi 2040 olay kartı ve olay etkili yeniden puanlama
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

## OpenAI yapılandırması

Uygulama AI anahtarı olmadan tamamen çalışır. OpenAI danışmanını etkinleştirmek için `.env.example` dosyasını `.env.local` olarak kopyala ve sunucu taraflı API anahtarını ekle:

~~~env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-luna
~~~

En düşük kurulum komutu:

~~~bash
cp .env.example .env.local
npm run dev
~~~

Anahtar yalnızca server-side API route'ları tarafından okunur; istemciye veya `localStorage`'a gönderilmez. Matematik öğretmeni ve AI jüri, OpenAI Responses API ile Structured Outputs kullanır. AI servisi kullanılamazsa oyun kural tabanlı sorularla devam eder; teknik ölçümler ve bütçe hesabı her zaman deterministik oyun motorunda yapılır.

## Dokümantasyon

- docs/product-bible: yaşayan ürün kararları
- docs/ux: akış, ekran ve tasarım sistemi
- docs/architecture: mimari, veri, güvenlik, test ve deployment
- docs/decisions: ADR kayıtları
- docs/sprints: uygulama ve doğrulama kanıtları
