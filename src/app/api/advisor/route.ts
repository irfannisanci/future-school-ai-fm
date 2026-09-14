import { NextResponse } from "next/server";

const system = `Sen FutureSchool AI bilim danışmanısın. 5-8. sınıf öğrencilerine yaşa uygun Türkçe ile yalnızca 2 veya 3 kısa Sokratik soru sor. En az bir sayısal metriğe ve bir ödünleşime değin. Tasarımı sen yapma, emir verme, skor üretme, bilimsel kesinlik iddia etme ve kişisel veri isteme. Yalnızca {"questions":["..."]} JSON döndür.`;

export async function POST(request: Request) {
  const url=process.env.AI_API_URL, key=process.env.AI_API_KEY, model=process.env.AI_MODEL;
  if(!url||!key||!model) return NextResponse.json({error:"AI yapılandırılmadı"},{status:503});
  try{
    const body=await request.json();
    const allowed={gradeBand:body.gradeBand,areaMetrics:body.evaluation?.areas,budgetUsed:body.evaluation?.budgetUsed,budgetLimit:100,fiveScores:body.evaluation?.scores,eventCard:body.eventId??null};
    if(JSON.stringify(allowed).length>12000) return NextResponse.json({error:"Geçersiz istek"},{status:400});
    const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},body:JSON.stringify({model,temperature:0.3,messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(allowed)}]}),signal:AbortSignal.timeout(8000)});
    if(!response.ok) throw new Error("provider");
    const data=await response.json();
    const content=data?.choices?.[0]?.message?.content;
    const parsed=typeof content==="string"?JSON.parse(content):content;
    const questions=Array.isArray(parsed?.questions)?parsed.questions.filter((q:unknown)=>typeof q==="string").slice(0,3):[];
    if(questions.length<2) throw new Error("format");
    return NextResponse.json({questions});
  }catch{
    return NextResponse.json({error:"Danışman şu anda çevrimdışı"},{status:503});
  }
}
