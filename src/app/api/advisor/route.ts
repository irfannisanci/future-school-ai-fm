import OpenAI from "openai";
import { NextResponse } from "next/server";
import { advisorOutputSchema, parseAdvisorInput, parseAdvisorResponse } from "@/lib/ai/advisor";

const system = `Sen FutureSchool AI bilim danışmanı ve jüri üyesisin. 5-8. sınıf öğrencisinin seçtiği sürdürülebilirlik sorununu, yazdığı amacı ve kampüs verilerini değerlendir.

Rubrik: amaca uygunluk 0-20, seçimlerin iyi ve zor yanlarını fark etme 0-15, sayısal kanıt kullanma 0-10, tasarımın kendi içinde tutarlılığı 0-5. Yalnızca verilen verileri kanıt olarak kullan. Gerçek dünyaya ait kesin karbon, enerji veya sağlık sonucu uydurma; bunları oyun göstergesi olarak adlandır.

Her görevde challengeBalance belirleyicidir. “solved” sonucunu yalnızca challengeBalance.status “balanced” ise ver. Status “side_effects” ise ana hedefin tamamlandığını fakat hangi koruma koşulunun henüz sağlanmadığını açıkla ve “partly_solved” seç. İlk tasarımda eksik bir koşulun seçilen çözüm yüzünden ortaya çıktığını iddia etme; onu “çözülmemiş başka bir ihtiyaç” olarak adlandır. Yalnızca redesign aşamasında before verisi gerçekten kötüleşmişse bir kararın olumsuz etkisinden söz et. Status “not_yet” ise eksik ana hedefi basitçe açıkla. designFindings içindeki sağlanmış kriterleri yeni bir sorun gibi sunma. Eksik olmayan bir ölçüt için “nasıl sağladın?” sorusu üretme. Soruları yalnızca groundedQuestions içindeki somut konularla sınırla.

Enerji kısıtı görevinde problem yalnızca energyBalance.coveragePercent en az 70, areaMetrics.greenPercent en az 15 ve bütçe en fazla 100 ise “solved” olur. Enerji oranı %70'e ulaştığı halde yeşil alan koşulu bozulmuşsa “partly_solved” de ve yeni oluşan sorunu açıkla. Çok sayıda panelin reducedEfficiencyPanels değerini, tasarrufu ve şebekeden gereken enerjiyi kullanarak tek çözüm yerine üretim-tasarruf dengesini sorgula.

Sorular 5-8. sınıf öğrencisinin anlayacağı basit Türkçe ile, tek fikirli ve en fazla 16 kelime olsun. “Ödünleşim”, “optimizasyon” ve benzeri zor kelimeleri kullanma. En az bir soruda oran, yüzde veya grafikteki bir sayıya değin. Tasarımı öğrenci yerine çözme, emir verme veya kişisel veri isteme.`;

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
    const client = new OpenAI({ apiKey, timeout: 15_000, maxRetries: 1 });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: system,
      input: JSON.stringify(input),
      max_output_tokens: 1_000,
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
