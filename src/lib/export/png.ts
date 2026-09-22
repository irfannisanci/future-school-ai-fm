import { COMPONENTS } from "@/lib/game/catalog";
import type { DesignEvaluation, EventId, PlacedItem } from "@/lib/game/types";
import { getEvent } from "@/lib/game/events";
import { evaluateDesign } from "@/lib/game/engine";
import { getResilienceReport, resilienceSummary } from "@/lib/game/resilience";

type ExportInput={team:string;initial:PlacedItem[];final:PlacedItem[];evaluation:DesignEvaluation;reflection:string;eventId?:EventId};

export function downloadExhibitionPng(input:ExportInput){
  const report=input.eventId?getResilienceReport(input.initial,input.final,input.eventId):undefined;
  const initialEvaluation=report?.shocked??evaluateDesign(input.initial);
  const canvas=document.createElement("canvas"); canvas.width=1600; canvas.height=1200;
  const ctx=canvas.getContext("2d"); if(!ctx)return;
  ctx.fillStyle="#f6f8f7";ctx.fillRect(0,0,1600,1200);
  ctx.fillStyle="#17324d";ctx.font="bold 52px Arial";ctx.fillText("FutureSchool AI",70,80);
  ctx.font="28px Arial";ctx.fillText(input.team+" • 2040 Sürdürülebilir Kampüs",70,125);
  drawPlan(ctx,input.initial,70,190,report?"İlk tasarım • 2040 olayında":"İlk tasarım",initialEvaluation.scores.total); drawPlan(ctx,input.final,850,190,report?"Son tasarım • 2040 olayında":"Son tasarım",input.evaluation.scores.total,input.evaluation.scores.total-initialEvaluation.scores.total);
  const s=input.evaluation.scores;ctx.font="bold 28px Arial";ctx.fillText("Sonuçlar",70,790);
  ctx.font="24px Arial";ctx.fillText("Sürdürülebilirlik puanı: "+s.total+"/100",70,835);
  ctx.fillText("İklim "+s.climate+"  •  Su "+s.water+"  •  Enerji "+s.energy+"  •  Sağlık "+s.health+"  •  Doğa "+s.circularity,70,875);
  ctx.fillText("Kullanılan alan: %"+input.evaluation.areas.usedPercent+"  •  Bütçe: "+input.evaluation.budgetUsed+"/100",70,915);
  ctx.font="bold 25px Arial";ctx.fillText(getEvent(input.eventId)?.title??"2040 görevi",70,965);
  let summary="";
  if(report){const f=report.focus;summary=report.ratio.title+": %"+report.ratio.normal+" (ilk tasarım) → %"+report.ratio.shocked+" (2040 olayında) → %"+report.ratio.redesigned+" (yeniden tasarım). "+report.focusLabel+" puanı: "+report.normal.scores[f]+" → "+report.shocked.scores[f]+" → "+report.redesigned.scores[f]+". "+resilienceSummary(report);}
  let y=965;
  if(summary){ctx.font="22px Arial";y=wrap(ctx,summary,70,1000,1450,29);}
  ctx.font="23px Arial";wrap(ctx,input.reflection||"Takım gerekçesi",70,y+45,1450,31);
  canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="future-school-"+slug(input.team)+".png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},"image/png");
}
function drawPlan(ctx:CanvasRenderingContext2D,items:PlacedItem[],x:number,y:number,title:string,score:number,difference?:number){
  const size=52;ctx.fillStyle="#17324d";ctx.font="bold 27px Arial";ctx.fillText(title,x,y-20);
  ctx.fillStyle="#fff";ctx.fillRect(x,y,size*10,size*10);
  for(let i=0;i<=10;i++){ctx.strokeStyle="#b7c6c4";ctx.beginPath();ctx.moveTo(x+i*size,y);ctx.lineTo(x+i*size,y+size*10);ctx.stroke();}
  for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(x,y+i*size);ctx.lineTo(x+size*10,y+i*size);ctx.stroke();}
  items.forEach(it=>{ctx.fillStyle=COMPONENTS[it.type].color;ctx.fillRect(x+it.x*size+2,y+it.y*size+2,it.width*size-4,it.height*size-4);ctx.fillStyle="#fff";ctx.font="bold 15px Arial";ctx.fillText(COMPONENTS[it.type].shortLabel,x+it.x*size+7,y+it.y*size+24);});
  ctx.fillStyle="#17324d";ctx.font="bold 24px Arial";ctx.fillText(`Sürdürülebilirlik: ${score}/100`,x,y+555);
  if(difference!==undefined){ctx.fillStyle=difference>=0?"#3f7b50":"#b64d3e";ctx.font="bold 20px Arial";ctx.fillText(`${difference>=0?"+":""}${difference} puan`,x+360,y+555);}
}
function wrap(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,max:number,line:number){let row="";for(const word of text.split(" ")){const test=row+word+" ";if(ctx.measureText(test).width>max){ctx.fillText(row,x,y);row=word+" ";y+=line;}else row=test;}ctx.fillText(row,x,y);return y;}
function slug(v:string){return v.toLocaleLowerCase("tr").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"takim";}
