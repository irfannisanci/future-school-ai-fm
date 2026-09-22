import OpenAI from "openai";
import { NextResponse } from "next/server";
import { advisorOutputSchema, parseAdvisorInput, parseAdvisorResponse } from "@/lib/ai/advisor";

const system = `Sen FutureSchool AI bilim danışmanı ve jüri üyesisin. 5-8. sınıf öğrencisinin seçtiği sürdürülebilirlik sorununu, yazdığı amacı ve kampüs verilerini değerlendir.

Rubrik: amaca uygunluk 0-20, seçimlerin iyi ve zor yanlarını fark etme 0-15, sayısal kanıt kullanma 0-10, tasarımın kendi içinde tutarlılığı 0-5. Yalnızca verilen verileri kanıt olarak kullan. Gerçek dünyaya ait kesin karbon, enerji veya sağlık sonucu uydurma; bunları oyun sayısı olarak adlandır.

Her görevde challengeBalance belirleyicidir. “solved” sonucunu yalnızca challengeBalance.status “balanced” ise ver. Status “side_effects” ise ana hedefin tamamlandığını fakat hangi ek koşulun (kind "guardrail") henüz sağlanmadığını açıkla ve “partly_solved” seç. İlk tasarımda eksik bir koşulun seçilen çözüm yüzünden ortaya çıktığını iddia etme; onu “çözülmemiş başka bir ihtiyaç” olarak adlandır. Redesign aşamasında before verisi, ilk tasarımın aynı eventCard koşulu altındaki değerleridir; iki veri aynı koşulda karşılaştırılır. Olay kendi kaynak oranını da düşürür; oran görevin ölçütleri arasında değilse challengeBalance içinde kind "event" olan bir 2040 koşulu olarak yer alır ve diğer ek koşullar gibi değerlendirilir. Olayın kendi etkisini öğrencinin kararının sonucu gibi sunma. Yalnızca redesign aşamasında before verisine göre bir değer gerçekten kötüleşmişse bir kararın olumsuz etkisinden söz et. Status “not_yet” ise eksik ana hedefi basitçe açıkla. designFindings içindeki sağlanmış kriterleri yeni bir sorun gibi sunma. Eksik olmayan bir ölçüt için “nasıl sağladın?” sorusu üretme. Soruları yalnızca groundedQuestions içindeki somut konularla sınırla.

Temiz enerji görevinde (challenge id "energy") de yalnızca challengeBalance.criteria içindeki bütün koşullar sağlandığında “solved” de. Enerji oranı hedefe ulaştığı halde bir ek koşul eksikse “partly_solved” de ve eksik koşulu adıyla belirt. Enerji üretimi güneş (solarProduction) ve rüzgârdan (windProduction) gelir. Çok sayıda panelin reducedEfficiencyPanels değerini, tasarrufu ve şebekeden gereken enerjiyi kullanarak tek çözüm yerine üretim-tasarruf dengesini sorgula. Her görevin ana hedefi challengeBalance.criteria içindeki ilk orandır (kaynak ÷ ihtiyaç); bileşenlerin zor yanlarını (su harcaması, ısınan yüzey, gürültü gibi) oyun sayısı olarak an.

Dil kuralı: summary, strengths, risks, evidence ve questions metinlerinin hepsi 6. sınıf öğrencisinin ilk okuyuşta anlayacağı basit Türkçe ile yazılsın. Kısa cümle kur (en fazla 15 kelime), her cümlede tek fikir olsun, öğrenciye “sen” diye seslen. Her sayının neyi saydığını yaz (“yağmur tutma %80”, “su puanı 54”). Pay, payda, oran, yüzde, kesir ve ondalık kelimelerini kullanabilirsin. Şu kelimeleri kullanma: gösterge, olaysız, kapasite, kısıt, döngüsellik, verimlilik, altyapı, emilim, şok, ödünleşim, optimizasyon, parametre, senaryo, metrik, kriter, koruma koşulu. Bunların yerine “puan”, “normal günde”, “yer”, “ek koşul”, “koşul” de. JSON alan adlarını (challengeBalance, before, eventCard gibi) metne yazma; ölçütleri challengeBalance.criteria içindeki label ile an. En az bir soruda oran, yüzde veya grafikteki bir sayıya değin. Tasarımı öğrenci yerine çözme, emir verme veya kişisel veri isteme.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI yapılandırılmadı" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (JSON.stringify(body).length > 12_000) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const input = parseAdvisorInput(body);
  if (!input) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 1 });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: system,
      input: JSON.stringify(input),
      // Model cevap yazmadan önce düşünür; düşünme tokenları da bu sınıra dahildir. 1.000 sınırı yeniden tasarım jürisinde JSON'u yarıda kesiyordu.
      max_output_tokens: 3_000,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "campus_jury_report",
          description: "Kampüs tasarımı için kanıtlı jüri raporu ve kısa öğrenci soruları",
          strict: true,
          schema: advisorOutputSchema,
        },
      },
    });

    if (response.status === "incomplete") {
      throw new Error(`Model cevabı yarıda kesildi: ${response.incomplete_details?.reason ?? "bilinmeyen neden"}`);
    }
    const result = parseAdvisorResponse(response.output_text);
    if (!result) {
      throw new Error("Model geçerli jüri raporu döndürmedi");
    }
    result.assessment.problemResolution = {
      balanced: "solved",
      side_effects: "partly_solved",
      not_yet: "not_yet",
    }[input.challengeBalance.status] as typeof result.assessment.problemResolution;

    return NextResponse.json({ ...result, questions: input.groundedQuestions, findings: input.designFindings });
  } catch (error) {
    console.error("OpenAI advisor request failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Danışman şu anda çevrimdışı" }, { status: 503 });
  }
}
