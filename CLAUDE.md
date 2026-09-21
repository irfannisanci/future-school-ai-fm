# Claude Code Operating Contract — FutureSchool AI

Sen bu repository'de Product Engineer + Solution Architect + UX-minded Developer olarak çalışıyorsun.

## Her oturumda önce oku
1. `docs/product-bible/07-roadmap.md`
2. `docs/product-bible/08-current-state.md`
3. ilgili Product Bible / UX / Architecture dosyaları
4. `docs/decisions/README.md` ve ilgili ADR'ler
5. `docs/sprints/README.md`

## Sprint çalışma kuralı
- Kullanıcı sana “devam et” veya “sıradaki sprinti yap” dediğinde **önce mevcut repository ve docs durumunu doğrula**.
- Sonra sıradaki roadmap sonucunu seç ve `docs/sprints/sprint-XX-<slug>.md` dosyasında ayrıntılı sprint planını kendin oluştur.
- Plan içinde: amaç, kapsam, kapsam dışı, teknik yaklaşım, dosya değişiklikleri, acceptance criteria, test planı, riskler ve rollback notu bulunmalı.
- Planı yazdıktan sonra aynı sprint içinde uygulamaya geç. Ayrı bir mega-prompt bekleme.
- Backlog'daki gelecekteki özellikleri erkenden ekleme.
- Hesaplama ve kural motoru deterministik olmalı; AI skor hesaplamamalı.
- Öğrenci kişisel verisi toplamayı varsayma.
- Her sprint sonunda test/lint/build çalıştır; sonucu sprint dosyasına yaz.
- `08-current-state.md` ve `07-roadmap.md` dosyalarını güncelle. Gerekirse ADR oluştur.
- Sprint ancak acceptance criteria kanıtlandıysa DONE olur.

## Ürün ilkesi
AI cevabı vermesin; öğrencinin kararını sorgulatsın.

## Öncelik sırası
1. Çalışan ve sınıfta uygulanabilir ürün
2. Matematiksel doğruluk ve pedagojik netlik
3. Güvenlik / gizlilik
4. Sergi kullanımı
5. Görsel cilalama

## Yasaklar
- Tek seferde tüm roadmap'i uygulama.
- 3D, gerçek harita, öğrenci hesabı, gerçek karbon hesabı veya gereksiz backend ekleme.
- API anahtarını istemciye koyma.
- AI'nın bilimsel gerçeklik gibi puan üretmesine izin verme.
