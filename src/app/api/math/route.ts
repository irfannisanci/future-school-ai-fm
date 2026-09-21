import OpenAI from "openai";
import { NextResponse } from "next/server";
import { mathOutputSchema, parseMathInput, parseMathResponse } from "@/lib/ai/math";

const instructions = `Sen 5-8. sınıf öğrencilerine oran ve yüzde öğreten bir matematik yardımcısısın. Öğrencinin verdiği pay ve paydayı kullan. Kesri sadeleştir, bölme sonucunu ve yüzdeyi hesapla. Açıklaman en fazla üç kısa cümle olsun. expected değerleri yalnızca öğrencinin tasarımdaki alanları veya enerji değerlerini doğru hesaplayıp hesaplamadığına uygun, cevabı doğrudan vermeyen kısa bir ipucu yazmak için kullan. Basit Türkçe kullan.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI yapılandırılmadı" }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }
  const input = parseMathInput(body);
  if (!input) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });

  try {
    const client = new OpenAI({ apiKey, timeout: 15_000, maxRetries: 1 });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions,
      input: JSON.stringify(input),
      max_output_tokens: 500,
      store: false,
      text: { format: { type: "json_schema", name: "ratio_tutor", strict: true, schema: mathOutputSchema } },
    });
    const result = parseMathResponse(response.output_text, input);
    if (!result) throw new Error("Model geçerli bir oran hesabı döndürmedi");
    return NextResponse.json(result);
  } catch (error) {
    console.error("OpenAI math request failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Matematik yardımcısı şu anda çevrimdışı" }, { status: 503 });
  }
}
