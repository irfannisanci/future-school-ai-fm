"use client";

import { useEffect, useMemo, useState } from "react";
import { COMPONENT_LIST, COMPONENTS, footprintCells } from "@/lib/game/catalog";
import { CHALLENGES, getChallenge, getChallengeRatio } from "@/lib/game/challenges";
import { criteriaBeforeEvent, evaluateChallengeBalance, eventCondition } from "@/lib/game/balance";
import { EVENTS, getEvent, getEventImpact } from "@/lib/game/events";
import { canPlace, createSnapshot, evaluateDesign } from "@/lib/game/engine";
import { analyzeDesign } from "@/lib/game/diagnostics";
import { focusImpactText, getResilienceReport, ratioDropReason, resilienceSummary, scoreDropReason, type ResilienceReport } from "@/lib/game/resilience";
import { technicalScore, type TechnicalScore } from "@/lib/game/scoring";
import { CHALLENGE_RESOURCE, EVENT_RESOURCE, RESOURCES, challengeResource, componentEffects, getResourceBalance, helpedChallenges, supportTypes } from "@/lib/game/resources";
import { clearSession, loadSession, saveSession } from "@/lib/game/storage";
import { downloadExhibitionPng } from "@/lib/export/png";
import { fallbackMathResult } from "@/lib/ai/math";
import type { AiAssessment, ChallengeId, ComponentType, DesignFinding, EventId, GradeBand, MathResult, PlacedItem, ResourceId, ResourceRow, SessionState } from "@/lib/game/types";

const createFresh = (): SessionState => ({
  teamAlias: "", gradeBand: "6", step: 0, designIntent: "", items: [], mathNumerator: "", mathDenominator: "",
  advisorQuestions: [], advisorResponses: [], reflection: "",
});
const stepNames = ["Takım", "Sorun", "Görev", "Tasarla", "Analiz", "Oran laboratuvarı", "AI jüri", "2040 olayı", "Yeniden tasarla", "Karşılaştır", "Savun", "Sergile"];
const scoreLabels = { climate: "İklim", water: "Su", energy: "Enerji", health: "Sağlık", circularity: "Doğa" };
const OVER_HUNDRED = "%100’den fazla, çünkü pay paydadan büyük: gerekenden fazlası var.";
const componentIcons: Record<ComponentType, string> = { education: "▦", sports: "●", green: "✦", solar: "☀", rainwater: "≈", recycling: "↻", bike: "◇", shade: "♣", garden: "❋", outdoorClass: "⌂", insulation: "▤", daylight: "◐", battery: "▣", wind: "✢", path: "┅", greywater: "♻" };

export default function GameApp() {
  const [state, setState] = useState<SessionState>(createFresh);
  const [selected, setSelected] = useState<ComponentType>("green");
  const [rotated, setRotated] = useState(false);
  const [active, setActive] = useState<string>();
  const [history, setHistory] = useState<PlacedItem[][]>([]);
  const [notice, setNotice] = useState("");
  const [advisorMode, setAdvisorMode] = useState<"loading" | "ai" | "fallback">("fallback");
  const [mathMode, setMathMode] = useState<"idle" | "loading" | "ai" | "fallback" | "error">("idle");
  const [finalAdvisorMode, setFinalAdvisorMode] = useState<"idle" | "loading" | "ai" | "fallback">("idle");
  const [hydrated, setHydrated] = useState(false);
  const evaluation = useMemo(() => evaluateDesign(state.items, state.step >= 8 ? state.eventId : undefined), [state.items, state.eventId, state.step]);
  const resilience = useMemo(() => state.initialDesign && state.eventId ? getResilienceReport(state.initialDesign.placedItems, state.items, state.eventId) : undefined, [state.initialDesign, state.items, state.eventId]);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = loadSession();
      if (saved) {
        setState({ ...createFresh(), ...saved });
        if (saved.initialAssessment) setAdvisorMode("ai");
        if (saved.mathResult) setMathMode("ai");
        if (saved.finalAssessment) setFinalAdvisorMode("ai");
      }
      setHydrated(true);
    });
  }, []);
  useEffect(() => { if (hydrated) saveSession(state); }, [state, hydrated]);

  const patch = (value: Partial<SessionState>) => setState((current) => ({ ...current, ...value }));
  const next = (step: number) => patch({ step });
  const pushHistory = () => setHistory((current) => [...current.slice(-19), state.items.map((item) => ({ ...item }))]);
  const placeNewItem = (x: number, y: number) => {
    const definition = COMPONENTS[selected];
    const width = rotated ? definition.height : definition.width;
    const height = rotated ? definition.width : definition.height;
    const candidate: PlacedItem = { id: crypto.randomUUID(), type: selected, x, y, width, height, rotated };
    if (!canPlace(state.items, candidate)) { setNotice("Burada yeterli boş alan yok. Başka bir kare seç."); return; }
    if (evaluateDesign([...state.items, candidate]).budgetUsed > 100) { setNotice("Bu bileşen bütçeyi aşar."); return; }
    pushHistory(); patch({ items: [...state.items, candidate] });
    setNotice(`${definition.label} eklendi. Etkilerini sağdaki bilgi kartından inceleyebilirsin.`);
  };
  const cellClick = (x: number, y: number) => {
    if (active) {
      const old = state.items.find((item) => item.id === active);
      if (!old) return;
      const moved = { ...old, x, y };
      if (!canPlace(state.items, moved, active)) { setNotice("Bu alana taşınamaz."); return; }
      pushHistory(); patch({ items: state.items.map((item) => item.id === active ? moved : item) }); setActive(undefined); setNotice("Bileşen taşındı."); return;
    }
    placeNewItem(x, y);
  };
  const remove = () => { if (!active) return; pushHistory(); patch({ items: state.items.filter((item) => item.id !== active) }); setActive(undefined); };
  const rotate = () => {
    if (!active) { setRotated((value) => !value); return; }
    const old = state.items.find((item) => item.id === active); if (!old) return;
    const changed = { ...old, width: old.height, height: old.width, rotated: !old.rotated };
    if (canPlace(state.items, changed, active)) { pushHistory(); patch({ items: state.items.map((item) => item.id === active ? changed : item) }); }
    else setNotice("Bu konumda döndürülemez.");
  };
  const undo = () => { const previous = history.at(-1); if (!previous) return; patch({ items: previous }); setHistory((current) => current.slice(0, -1)); setActive(undefined); };

  const lock = () => {
    if (!evaluation.isValid || !state.challengeId) { setNotice("Önce görev koşullarını tamamla."); return; }
    const snapshot = createSnapshot(state.items);
    patch({ initialDesign: snapshot, mathNumerator: "", mathDenominator: "", mathResult: undefined, initialAssessment: undefined, initialFindings: undefined, finalAssessment: undefined, finalFindings: undefined, step: 5 });
    setMathMode("idle");
  };

  const calculateRatio = async () => {
    if (!state.initialDesign || !state.challengeId) return;
    const numerator = Number(state.mathNumerator);
    const denominator = Number(state.mathDenominator);
    if (!Number.isInteger(numerator) || numerator < 0 || !Number.isInteger(denominator) || denominator < 1) { setMathMode("error"); return; }
    const expected = getChallengeRatio(state.initialDesign.placedItems, state.challengeId);
    const input = { gradeBand: state.gradeBand, challengeId: state.challengeId, numeratorLabel: expected.numeratorLabel, numerator, denominator, expectedNumerator: expected.numerator, expectedDenominator: expected.denominator };
    setMathMode("loading");
    try {
      const response = await fetch("/api/math", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) throw new Error("math");
      const result = await response.json() as MathResult;
      patch({ mathResult: result }); setMathMode("ai");
    } catch { patch({ mathResult: fallbackMathResult(input) }); setMathMode("fallback"); }
  };

  const advisorBody = (phase: "initial" | "redesign", designEvaluation: ReturnType<typeof evaluateDesign>, items: PlacedItem[], beforeEvaluation?: ReturnType<typeof evaluateDesign>) => ({
    phase, gradeBand: state.gradeBand, challengeId: state.challengeId, designIntent: state.designIntent,
    evaluation: designEvaluation, items, eventId: phase === "redesign" ? state.eventId : undefined, beforeEvaluation,
    mathResult: state.mathResult ? { numerator: Number(state.mathNumerator), denominator: Number(state.mathDenominator), percentage: state.mathResult.percentage } : null,
  });

  const requestAdvisor = async (phase: "initial" | "redesign", designEvaluation: ReturnType<typeof evaluateDesign>, items: PlacedItem[], beforeEvaluation?: ReturnType<typeof evaluateDesign>) => {
    if (phase === "initial") setAdvisorMode("loading"); else setFinalAdvisorMode("loading");
    try {
      const response = await fetch("/api/advisor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(advisorBody(phase, designEvaluation, items, beforeEvaluation)) });
      if (!response.ok) throw new Error("advisor");
      const data = await response.json() as { questions: string[]; assessment: AiAssessment; findings: DesignFinding[] };
      if (phase === "initial") {
        patch({ advisorQuestions: data.questions, advisorResponses: data.questions.map(() => ""), initialAssessment: data.assessment, initialFindings: data.findings });
        setAdvisorMode("ai");
      } else {
        patch({ finalAssessment: data.assessment, finalFindings: data.findings }); setFinalAdvisorMode("ai");
      }
    } catch {
      if (phase === "initial") setAdvisorMode("fallback"); else setFinalAdvisorMode("fallback");
    }
  };

  const startAdvisor = () => {
    if (!state.initialDesign || !state.mathResult?.matchesDesign || !state.challengeId) return;
    const local = analyzeDesign(state.initialDesign.placedItems, state.initialDesign.evaluation, state.challengeId);
    patch({ advisorQuestions: local.questions, advisorResponses: local.questions.map(() => ""), initialFindings: local.findings, step: 6 });
    void requestAdvisor("initial", state.initialDesign.evaluation, state.initialDesign.placedItems);
  };
  const retryAdvisor = () => { if (state.initialDesign) void requestAdvisor("initial", state.initialDesign.evaluation, state.initialDesign.placedItems); };
  const analyzeRedesign = () => {
    if (!state.initialDesign || !state.challengeId) return;
    const local = analyzeDesign(state.items, evaluation, state.challengeId, state.eventId);
    patch({ step: 9, finalAssessment: undefined, finalFindings: local.findings });
    void requestAdvisor("redesign", evaluation, state.items, resilience?.shocked ?? state.initialDesign.evaluation);
  };
  const drawEvent = () => { const event = EVENTS[Math.floor(Math.random() * EVENTS.length)]; patch({ eventId: event.id, step: 7 }); };
  const answer = (index: number, value: string) => patch({ advisorResponses: state.advisorResponses.map((answerValue, answerIndex) => answerIndex === index ? value : answerValue) });
  const goHome = () => patch({ step: 0, resumeStep: state.step });
  const resume = () => patch({ step: state.resumeStep ?? 1, resumeStep: undefined });
  const restart = () => { if (window.confirm("Devam eden tasarım silinecek. Yeni takım başlatılsın mı?")) reset(); };
  const reset = () => { clearSession(); setState(createFresh()); setHistory([]); setActive(undefined); setNotice(""); setAdvisorMode("fallback"); setMathMode("idle"); setFinalAdvisorMode("idle"); };
  if (!hydrated) return <main className="loading">Kampüs hazırlanıyor…</main>;

  const challenge = getChallenge(state.challengeId);
  const technical = technicalScore(state.initialDesign?.evaluation ?? evaluation, state.initialDesign?.placedItems ?? state.items, Boolean(state.mathResult?.matchesDesign), state.challengeId);
  const activeAssessment = state.finalAssessment ?? state.initialAssessment;
  const baseline = resilience?.shocked ?? state.initialDesign?.evaluation;

  return <div className="app">
    <header className="topbar"><div className="brand"><span className="brandmark">FS</span><div><b>FutureSchool AI</b><small>2040 Kampüs Laboratuvarı</small></div></div>{state.step > 0 && <><button className="home-link" onClick={goHome} aria-label="Ana sayfaya dön"><span aria-hidden="true">⌂</span><b>Ana sayfa</b></button><div className="progress" aria-label={`Adım ${state.step} / 11`}><span style={{ width: `${state.step / 11 * 100}%` }} /></div><div className="step-chip"><small>ŞİMDİ</small><b>{stepNames[state.step]}</b></div><button className="ghost" onClick={() => document.documentElement.requestFullscreen?.()}>⛶ Tam ekran</button></>}</header>
    <main className={state.step === 3 || state.step === 8 ? "workspace" : "stage"}>
      {state.step === 0 && <section className="welcome"><div className="hero-copy"><span className="eyebrow">STEM • MATEMATİK • SÜRDÜRÜLEBİLİRLİK</span><h1>2040’ın sürdürülebilir okulunu <em>tasarlıyorum!</em></h1><p>Alanı ölç, oranları hesapla, bütçeni yönet ve geleceğin okulunu tasarla.</p><div className="card form"><label>Takım rumuzu<input maxLength={30} value={state.teamAlias} onChange={(event) => patch({ teamAlias: event.target.value })} placeholder="Örn. Gelecek Mimarları" /></label><label>Sınıf düzeyi<select value={state.gradeBand} onChange={(event) => patch({ gradeBand: event.target.value as GradeBand })}>{["5", "6", "7", "8"].map((grade) => <option key={grade} value={grade}>{grade}. sınıf</option>)}</select></label>{state.resumeStep ? <button className="primary" disabled={!state.teamAlias.trim()} onClick={resume}>Kaldığın yerden devam et <span>→</span></button> : <button className="primary" disabled={!state.teamAlias.trim()} onClick={() => next(1)}>Planlamaya başla <span>→</span></button>}</div>{state.resumeStep && <p className="resume-note">Tasarımın kayıtlı: <b>{stepNames[state.resumeStep]}</b> adımında kaldın. <button onClick={restart}>Yeni takım başlat</button></p>}<p className="privacy">◆ İsim, e-posta veya kişisel bilgi istemiyoruz.</p></div><div className="hero-visual" aria-hidden="true"><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><div className="campus-preview"><div className="preview-head"><span>İSTANBUL • 2040</span><b>Canlı kampüs modeli</b></div><div className="preview-map"><i className="pv pv-school">▦</i><i className="pv pv-green">✦</i><i className="pv pv-solar">☀</i><i className="pv pv-water">≈</i><i className="pv pv-sport">●</i></div><div className="preview-score"><span><b>50</b> teknik puan</span><span><b>50</b> AI jüri</span></div></div><div className="floating-card fc-ai"><b>AI</b><span>Jüri ve matematik yardımcısı</span></div><div className="floating-card fc-climate"><b>%</b><span>Oranları keşfet</span></div></div></section>}

      {state.step === 1 && <section className="challenge-stage"><Heading k="1 • SORUNUNU SEÇ" title="Okulun hangi sorunu çözsün?"/><div className="challenge-grid">{CHALLENGES.map((item) => <button key={item.id} className={`challenge-card ${state.challengeId === item.id ? "selected" : ""}`} onClick={() => patch({ challengeId: item.id })}><span>{item.emoji}</span><b>{item.title}</b><small>{item.description}</small></button>)}</div><div className="card intent-card"><label>Tasarım amacın<textarea maxLength={400} value={state.designIntent} onChange={(event) => patch({ designIntent: event.target.value })} placeholder="Örn. Yeşil alan ve gölgelik kullanarak okul bahçesini serinletmek istiyorum." /></label><small>En az 10 harf: {state.designIntent.trim().length}/10</small></div><button className="primary" disabled={!state.challengeId || state.designIntent.trim().length < 10} onClick={() => next(2)}>Görevi gör →</button></section>}

      {state.step === 2 && state.challengeId && <section className="brief"><span className="eyebrow">GÖREV DOSYASI • İSTANBUL 2040</span><h1>{challenge?.emoji} {challenge?.title} için bir kampüs kur.</h1><div className="briefgrid"><Fact n="10.000" unit="m²" text="Toplam kampüs alanı"/><Fact n="100" unit="puan" text="Tasarım bütçesi"/><Fact n="10×10" unit="kare" text="Her kare 100 m²"/></div><ChallengeMissionBrief challengeId={state.challengeId} evaluation={evaluation}/><div className="mission card"><h2>Başarı koşulları</h2><p>✓ En az 1 eğitim binası</p><p>✓ En az 1 spor salonu</p><p>✓ Bileşenler üst üste gelmesin, bütçe aşılmasın</p><p>✓ Seçimlerin iyi ve zor yanlarını açıklama</p><p>✓ Pay, payda, oran ve yüzde hesabı</p></div><div className="goal-strip"><b>Amacın:</b> {state.designIntent}</div><button className="primary" onClick={() => next(3)}>Tasarlamaya başla →</button></section>}

      {(state.step === 3 || state.step === 8) && <Designer redesign={state.step === 8} challengeId={state.challengeId!} state={state} evaluation={evaluation} selected={selected} rotated={rotated} active={active} notice={notice} onSelect={(type) => { setSelected(type); setActive(undefined); }} onCell={cellClick} onActive={setActive} onRotate={rotate} onRemove={remove} onUndo={undo} onNext={() => state.step === 3 ? next(4) : analyzeRedesign()} />}

      {state.step === 4 && state.challengeId && <section><Heading k="İLK TASARIM ANALİZİ" title="Kararların sayılara dönüştü."/><div className="goal-strip"><b>{challenge?.emoji} Çözmek istediğin sorun:</b> {challenge?.title}<br/><b>Amacın:</b> {state.designIntent}</div><ChallengeBalanceCard challengeId={state.challengeId} items={state.items} evaluation={evaluation} eventId={state.step >= 8 ? state.eventId : undefined}/><Metrics evaluation={evaluation}/>{evaluation.errors.length > 0 && <div className="errors">{evaluation.errors.map((error) => <p key={error}>! {error}</p>)}</div>}<div className="actions"><button className="secondary" onClick={() => next(3)}>← Tasarıma dön</button><button className="primary" disabled={!evaluation.isValid} onClick={lock}>Tasarımı kilitle →</button></div><p className="hint">Kilitledikten sonra pay ve paydayı sen bulacaksın.</p></section>}

      {state.step === 5 && state.initialDesign && state.challengeId && <MathLab grade={state.gradeBand} challengeId={state.challengeId} items={state.initialDesign.placedItems} ratio={getChallengeRatio(state.initialDesign.placedItems, state.challengeId)} numerator={state.mathNumerator} denominator={state.mathDenominator} result={state.mathResult} mode={mathMode} onNumerator={(value) => patch({ mathNumerator: value, mathResult: undefined })} onDenominator={(value) => patch({ mathDenominator: value, mathResult: undefined })} onCalculate={calculateRatio} onBack={() => next(4)} onNext={startAdvisor} />}

      {state.step === 6 && <section><Heading k="AI JÜRİ VE BİLİM DANIŞMANI" title="Tasarımın sorununu çözüyor mu?"/><div className="advisor card"><div className="advisorhead"><span className="orb">AI</span><span>{advisorMode === "loading" ? "AI jüri açıklamayı hazırlıyor…" : advisorMode === "ai" ? "AI jüri raporu hazır" : "Oyunun hazırladığı sorular gösteriliyor"}</span>{advisorMode === "fallback" && <button className="secondary advisor-retry" onClick={retryAdvisor}>AI açıklamasını yeniden dene</button>}</div>{state.initialFindings && <DesignFindingsCard findings={state.initialFindings}/>} {state.initialAssessment && <AssessmentCard assessment={state.initialAssessment}/>}<div className="advisor-questions"><h3>Takımca konuşun, kısaca yazın</h3><p className="tiny">Doğru ya da yanlış cevap yok; düşüncenizi birkaç cümleyle anlatın.</p>{state.advisorQuestions.map((question, index) => <label key={question}><b>{index + 1}. {question}</b><textarea disabled={advisorMode === "loading"} value={state.advisorResponses[index] || ""} onChange={(event) => answer(index, event.target.value)} placeholder="Birkaç cümle yeter…" /></label>)}</div></div>{state.initialAssessment && <ScoreSummary technical={technical} ai={state.initialAssessment.aiScore}/>}<button className="primary" disabled={advisorMode === "loading" || state.advisorResponses.some((value) => !value.trim())} onClick={drawEvent}>2040 olay kartını çek →</button></section>}

      {state.step === 7 && <EventScreen id={state.eventId!} report={resilience} challengeId={state.challengeId} onNext={() => next(8)}/>}

      {state.step === 9 && state.initialDesign && state.challengeId && baseline && <section><Heading k="ÖNCE / SONRA" title="Değişikliklerin sorunu çözdü mü?"/>{resilience && <ResilienceStrip report={resilience}/>}<div className="compare"><MiniPlan title="İlk tasarım" items={state.initialDesign.placedItems} evaluation={state.initialDesign.evaluation} eventScore={resilience ? baseline.scores.total : undefined}/><MiniPlan title="Son tasarım • 2040 olayında" items={state.items} evaluation={evaluation} previousScore={baseline.scores.total}/></div><Delta normal={resilience ? state.initialDesign.evaluation.scores : undefined} before={baseline.scores} after={evaluation.scores}/>{resilience && <EventLosses report={resilience}/>}<ComparisonImpact before={baseline} after={evaluation}/><ChallengeBalanceCard challengeId={state.challengeId} items={state.items} evaluation={evaluation} eventId={state.step >= 8 ? state.eventId : undefined}/><div className="advisor card compare-advisor"><div className="advisorhead"><span className="orb">AI</span><span>{finalAdvisorMode === "loading" ? "AI jüri değişiklikleri karşılaştırıyor…" : finalAdvisorMode === "ai" ? "Değişim raporu hazır" : "Oyunun bulduğu sonuçlar gösteriliyor"}</span>{finalAdvisorMode === "fallback" && <button className="secondary advisor-retry" onClick={analyzeRedesign}>AI açıklamasını yeniden dene</button>}</div>{state.finalFindings && <DesignFindingsCard findings={state.finalFindings}/>} {state.finalAssessment && <AssessmentCard assessment={state.finalAssessment}/>}</div>{state.finalAssessment && <ScoreSummary technical={technicalScore(evaluation, state.items, Boolean(state.mathResult?.matchesDesign), state.challengeId, state.eventId)} ai={state.finalAssessment.aiScore}/>}<div className="actions"><button className="secondary" onClick={() => next(8)}>← Yeniden düzenle</button><button className="primary" disabled={finalAdvisorMode === "loading"} onClick={() => next(10)}>Savunmaya geç →</button></div></section>}

      {state.step === 10 && <section><Heading k="TAKIM SAVUNMASI" title="En önemli değişikliğiniz neydi?"/><div className="card reflection"><p>“Şu alanı veya kararı değiştirdik; çünkü…”</p><textarea value={state.reflection} onChange={(event) => patch({ reflection: event.target.value })} minLength={20} placeholder="Kararınızı bir sayı ve gerekçeyle anlatın."/><small>En az 20 harf: {state.reflection.trim().length}/20</small></div><button className="primary" disabled={state.reflection.trim().length < 20} onClick={() => next(11)}>Sergi çıktısını hazırla →</button></section>}

      {state.step === 11 && state.initialDesign && state.challengeId && baseline && <section className="final"><Heading k="SERGİYE HAZIR" title={`${state.teamAlias} takımının 2040 kampüsü`}/><div className="printarea"><div className="goal-strip"><b>{challenge?.emoji} {challenge?.title}</b><br/>{state.designIntent}</div>{resilience && <ResilienceStrip report={resilience}/>}<div className="compare"><MiniPlan title="İlk tasarım" items={state.initialDesign.placedItems} evaluation={state.initialDesign.evaluation} eventScore={resilience ? baseline.scores.total : undefined}/><MiniPlan title="Son tasarım • 2040 olayında" items={state.items} evaluation={evaluation} previousScore={baseline.scores.total}/></div><Delta normal={resilience ? state.initialDesign.evaluation.scores : undefined} before={baseline.scores} after={evaluation.scores}/>{resilience && <EventLosses report={resilience}/>}<ComparisonImpact before={baseline} after={evaluation}/><ChallengeBalanceCard challengeId={state.challengeId} items={state.items} evaluation={evaluation} eventId={state.step >= 8 ? state.eventId : undefined}/><Metrics evaluation={evaluation}/>{activeAssessment && <><AssessmentCard assessment={activeAssessment}/><ScoreSummary technical={technicalScore(evaluation, state.items, Boolean(state.mathResult?.matchesDesign), state.challengeId, state.eventId)} ai={activeAssessment.aiScore}/></>}<blockquote>{state.reflection}</blockquote></div><div className="actions no-print"><button className="secondary" onClick={() => window.print()}>PDF / Yazdır</button><button className="primary" onClick={() => downloadExhibitionPng({ team: state.teamAlias, initial: state.initialDesign!.placedItems, final: state.items, evaluation, reflection: state.reflection, eventId: state.eventId })}>PNG indir</button><button className="ghost" onClick={reset}>Yeni takım</button></div></section>}
    </main>
    {state.step > 0 && <footer><span>{state.teamAlias}</span><span>{challenge?.emoji} {challenge?.title}</span><span>Adım {state.step}/11</span></footer>}
  </div>;
}

function Designer(props: { redesign: boolean; challengeId: ChallengeId; state: SessionState; evaluation: ReturnType<typeof evaluateDesign>; selected: ComponentType; rotated: boolean; active?: string; notice: string; onSelect: (type: ComponentType) => void; onCell: (x: number, y: number) => void; onActive: (id: string) => void; onRotate: () => void; onRemove: () => void; onUndo: () => void; onNext: () => void }) {
  const challenge = getChallenge(props.challengeId)!;
  const selectedDefinition = COMPONENTS[props.active ? props.state.items.find((item) => item.id === props.active)?.type ?? props.selected : props.selected];
  return <><aside className="palette"><span className="eyebrow">{props.redesign ? "2040 OLAYINA GÖRE DEĞİŞTİR" : "BİLEŞENLER"}</span><h2>{props.redesign ? getEvent(props.state.eventId)?.title : `${challenge.emoji} ${challenge.title}`}</h2><p className="tiny">Bir bileşen seç, sonra kampüste bir kareye dokun.</p><div className="paletteitems">{COMPONENT_LIST.map((component) => <button key={component.type} className={props.selected === component.type && !props.active ? "component selected" : "component"} onClick={() => props.onSelect(component.type)}><i style={{ background: component.color }}><span>{componentIcons[component.type]}</span></i><span><b>{component.label}</b><small>{component.landUse === "upgrade" ? "Binaya eklenir" : `${component.width}×${component.height}`} • {component.cost} puan</small><small className="impact-icons">{[component.required ? "Temel ihtiyaç" : "", helpedChallenges(component.type).map((id) => getChallenge(id)?.emoji).join(" ")].filter(Boolean).join(" • ") || "Temel ihtiyaç"}</small></span></button>)}</div></aside><section className="canvas"><div className="canvashead"><div><span className="eyebrow">{props.redesign ? "OLAY SONRASI" : "İLK TASARIM"}</span><h1>10×10 kampüs alanı</h1></div><div className="tools"><button onClick={props.onUndo}>↶ Geri al</button><button onClick={props.onRotate}>↻ Döndür</button><button disabled={!props.active} onClick={props.onRemove}>Sil</button></div></div><CampusGrid items={props.state.items} active={props.active} onCell={props.onCell} onActive={props.onActive}/><p className="notice">{props.notice || (props.active ? "Yeni konuma dokun veya Sil'i seç." : "Soldan bir bileşen seç, sonra kampüste bir kareye dokun.")}</p></section><aside className="metricsaside"><ImpactCard definition={selectedDefinition}/>{props.redesign && props.state.eventId && <EventEffectNote items={props.state.items} eventId={props.state.eventId}/>}<ChallengeBalanceCard challengeId={props.challengeId} items={props.state.items} evaluation={props.evaluation} eventId={props.redesign ? props.state.eventId : undefined} compact/><Metrics evaluation={props.evaluation} drops={props.redesign && props.state.eventId ? scoreDropsFor(props.state.items, props.state.eventId) : undefined}/>{props.evaluation.errors.length > 0 && <div className="errors compact">{props.evaluation.errors.map((error) => <p key={error}>{error}</p>)}</div>}<button className="primary" onClick={props.onNext}>{props.redesign ? "Karşılaştır ve AI ile incele →" : "Analiz et →"}</button></aside></>;
}

type EventDrop = { before: number; reason?: string };

// Olayın düşürdüğü puanlar: normal gündeki değer ve düşüşün nedeni. Çubuktaki kırmızı parça buradan gelir.
function scoreDropsFor(items: PlacedItem[], eventId: EventId): Partial<Record<keyof typeof scoreLabels, EventDrop>> {
  const normal = evaluateDesign(items).scores;
  const shocked = evaluateDesign(items, eventId).scores;
  const drops: Partial<Record<keyof typeof scoreLabels, EventDrop>> = {};
  for (const key of Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>) if (normal[key] > shocked[key]) drops[key] = { before: normal[key], reason: scoreDropReason(items, eventId, key) };
  return drops;
}

const BAR_STEP = 10;

// Ölçekli çubuk: her aralık 10 birim. Dolu kısım şimdiki değer; kırmızı parça olayın düşürdüğü kadar (olaydan önceki değere kadar). Çubuk hedeften uzunsa hedef koyu bir çizgiyle gösterilir.
function LossBar({ value, before, max, target, label, unit = "" }: { value: number; before?: number; max: number; target?: number; label: string; unit?: string }) {
  const scale = Math.max(BAR_STEP, Math.ceil(max / BAR_STEP) * BAR_STEP);
  const position = (amount: number) => Math.max(0, Math.min(100, amount / scale * 100));
  const now = position(value);
  const lost = before !== undefined && before > value ? position(before) - now : 0;
  const describe = (amount: number) => `${unit}${amount}`;
  return <div className="loss-bar" role="img" aria-label={lost > 0 ? `${label}: olaydan önce ${describe(before!)}, şimdi ${describe(value)}` : `${label}: ${describe(value)}`}><span className="loss-fill" style={{ width: `${now}%` }}/>{lost > 0 && <span className="loss-drop" style={{ left: `${now}%`, width: `${lost}%` }}/>}{scale <= 400 && <span className="loss-ticks" style={{ backgroundSize: `${BAR_STEP / scale * 100}% 100%` }}/>}{target !== undefined && target < scale && <i className="loss-target" style={{ left: `${position(target)}%` }} title={`hedef ${describe(target)}`}/>}</div>;
}

// Kırmızı yazı (kaç iken kaç oldu, ne kadar azaldı) ve "Neden?" açıklaması.
function DropNote({ before, now, unit, reason }: { before: number; now: number; unit: "%" | "puan"; reason?: string }) {
  const amount = before - now;
  return <div className="loss-note"><b>{unit === "%" ? `olay: %${before} → %${now} (${amount} azaldı)` : `olay: ${before} → ${now} (${amount} puan azaldı)`}</b>{reason && <small><strong>Neden?</strong> {reason}</small>}</div>;
}

function EventEffectNote({ items, eventId }: { items: PlacedItem[]; eventId: EventId }) {
  const event = getEvent(eventId)!;
  const resourceId = EVENT_RESOURCE[eventId];
  const normalRatio = getResourceBalance(items, resourceId).coveragePercent;
  const shocked = getResourceBalance(items, resourceId, eventId);
  const impact = getEventImpact(items, eventId);
  // Sıra: ne oldu → takip ettiğin oran nasıl değişti → puanın neden düştü veya düşmedi → "olay −N" ne demek.
  return <div className="event-effect-note"><b>{event.icon} 2040 olayı: {event.title}</b>{shocked.eventNote && <span>{shocked.eventNote}</span>}<span>{RESOURCES[resourceId].title} oranın: normal günde %{normalRatio} → bu olayda <strong>%{shocked.coveragePercent}</strong>{normalRatio === shocked.coveragePercent ? " (değişmedi)" : ""}</span>{event.shock > 0 && <span>{focusImpactText(scoreLabels[event.focus], impact, evaluateDesign(items).scores[event.focus] - evaluateDesign(items, eventId).scores[event.focus])}</span>}{impact.absorbers.length > 0 && <small>Koruyan bileşenler: {impact.absorbers.map((absorber) => `${absorber.count} × ${COMPONENTS[absorber.type].label} (${absorber.points} puan)`).join(", ")}</small>}<small className="event-effect-hint">Aşağıdaki çubuklarda her aralık 10 birimdir; koyu çizgi hedeftir. Kırmızı parça, bu olayın düşürdüğü kadardır; altında nedeni yazar.</small></div>;
}

function ImpactCard({ definition }: { definition: typeof COMPONENTS[ComponentType] }) {
  const landLabel = { building: "Bina", open: "Açık alan", infrastructure: "Enerji alanı", upgrade: "Binaya eklenir; yer kaplamaz" }[definition.landUse];
  const helped = helpedChallenges(definition.type);
  const effects = componentEffects(definition.type);
  return <div className="impact-card"><span className="eyebrow">BU SEÇİM NEYİ DEĞİŞTİRİR?</span><b>{definition.label}</b><div className="land-use-tag">{landLabel}</div>{definition.required && <div className="required-tag">Temel ihtiyaç</div>}{helped.length > 0 && <div className="impact-good">Yardım ettiği sorunlar: {helped.map((id) => `${getChallenge(id)?.emoji} ${getChallenge(id)?.title}`).join(", ")}</div>}{definition.effects.map((effect) => <div className="impact-effect" key={effect}>↗ {effect}</div>)}<div className="impact-numbers">{effects.filter((effect) => effect.tone === "good").map((effect) => <div className="impact-plus" key={effect.text}>+ {effect.text}</div>)}{effects.filter((effect) => effect.tone === "cost").map((effect) => <div className="impact-minus" key={effect.text}>− {effect.text}</div>)}</div>{definition.risks.length > 0 && <div className="impact-why"><b>Zor yanları</b>{definition.risks.map((risk) => <span key={risk}>{risk}</span>)}</div>}<small>− {definition.cost} bütçe puanı</small></div>;
}

function ChallengeMissionBrief({ challengeId, evaluation }: { challengeId: ChallengeId; evaluation: ReturnType<typeof evaluateDesign> }) {
  const balance = evaluateChallengeBalance([], evaluation, challengeId);
  return <div className="energy-mission card"><span className="eyebrow">GÖREVİN</span><h2>{balance.title}</h2><div>{balance.criteria.map((item) => <p key={item.id}><b>{item.kind === "main" ? "◆ Ana hedef" : item.kind === "budget" ? "◈ Bütçe" : "○ Ek koşul"}</b><span>{item.label}: {item.direction === "atLeast" ? "en az" : "en fazla"} {item.unit === "%" ? `%${item.target}` : `${item.target} puan`}</span></p>)}</div><small>{balance.question} Tek bir doğru çözüm yok.</small></div>;
}

function ChallengeBalanceCard({ challengeId, items, evaluation, eventId, compact = false }: { challengeId: ChallengeId; items: PlacedItem[]; evaluation: ReturnType<typeof evaluateDesign>; eventId?: EventId; compact?: boolean }) {
  const balance = evaluateChallengeBalance(items, evaluation, challengeId, eventId);
  const beforeEvent = eventId ? criteriaBeforeEvent(items, challengeId, eventId, evaluateDesign(items), evaluation) : {};
  const resource = challengeResource(challengeId);
  const resourceBalance = getResourceBalance(items, CHALLENGE_RESOURCE[challengeId], eventId);
  const hasSaving = resourceBalance.rows.some((row) => row.role === "saving") || resource.saving.length > 0;
  const status = { balanced: "Bütün koşullar sağlandı", side_effects: "Ana hedef tamam; ek koşullarda eksik var", not_yet: "Ana hedef henüz tamamlanmadı" }[balance.status];
  const main = balance.criteria.find((item) => item.kind === "main")!;
  return <div className={`energy-balance challenge-balance card ${compact ? "compact" : ""}`}><div className="energy-balance-head"><div><span className="eyebrow">GÖREV KONTROLÜ</span><b>{status}</b></div><strong>{main.unit === "%" ? "%" : ""}{main.value}<small>{main.unit === "%" ? "" : " puan"}</small><em>{main.label}</em></strong></div><div className="energy-equation"><span><small>{resource.supplyLabel}</small><b>{resourceBalance.supply}</b><small>{resource.unit}</small></span><i>÷</i><span><small>{resource.demandLabel}</small><b>{resourceBalance.netDemand}</b><small>{resource.unit}</small></span><i>=</i><span><small>{resource.title}</small><b>%{resourceBalance.coveragePercent}</b></span></div>{resourceBalance.coveragePercent > 100 && <p className="energy-explain">{OVER_HUNDRED}</p>}{resourceBalance.eventNote && !compact && <p className="event-effect-inline">⚡ {resourceBalance.eventNote}</p>}{hasSaving ? <p className="energy-explain">Payda = toplam − tasarruf ({resourceBalance.grossDemand} − {resourceBalance.savings} = {resourceBalance.netDemand}).</p> : resource.fixedDemand ? <p className="energy-explain">{resource.fixedDemand.reason} ({resource.fixedDemand.students} × {resource.fixedDemand.percent} ÷ 100 = {resourceBalance.netDemand})</p> : <p className="energy-explain">Oranı artırmak için paya kaynak ekle ya da paydayı büyüten bileşenleri azalt.</p>}{challengeId === "energy" && evaluation.energyBalance.reducedEfficiencyPanels > 0 && <p className="diminishing-note">! En güneşli yerler ilk 3 panelle doldu; sonraki {evaluation.energyBalance.reducedEfficiencyPanels} panel daha az güneş aldığı için 2’şer birim üretiyor. Rüzgâr ya da tasarruf daha mı iyi olur?</p>}<div className="balance-criteria">{balance.criteria.map((item) => <div className={`${item.met ? "met" : ""} ${item.kind === "event" ? "event-criterion" : ""}`} key={item.id}><span>{item.kind === "main" ? "◆" : item.kind === "budget" ? "◈" : item.kind === "event" ? "⚡ 2040 koşulu:" : "○"} {item.label}</span><b>{item.met ? "✓ sağlandı" : "eksik"}</b><LossBar value={item.value} before={beforeEvent[item.id]} max={item.direction === "atMost" ? item.target : Math.max(item.target, item.value, beforeEvent[item.id] ?? 0)} target={item.direction === "atMost" ? undefined : item.target} label={item.label} unit={item.unit === "%" ? "%" : ""}/>{eventId && beforeEvent[item.id] !== undefined && <DropNote before={beforeEvent[item.id]} now={item.value} unit={item.unit} reason={item.id === "health" ? scoreDropReason(items, eventId, "health") : ratioDropReason(items, eventId, item.id as ResourceId)}/>}<small>Şu an <b>{item.unit === "%" ? `%${item.value}` : `${item.value} puan`}</b> • hedef {item.direction === "atLeast" ? "en az" : "en fazla"} {item.unit === "%" ? `%${item.target}` : `${item.target} puan`}</small></div>)}</div><p className="balance-question">{balance.question}</p>{!compact && <small className="bar-legend">Çubuklarda her aralık 10 birimdir; koyu çizgi hedeftir.{eventId ? " Kırmızı parça, 2040 olayının düşürdüğü kadardır." : ""}</small>}{!compact && <small className="simulation-note">Bu sayılar gerçek ölçüm değil. Tasarımları karşılaştırmak için kullanılan oyun sayılarıdır.</small>}</div>;
}

function MathLab(props: { grade: GradeBand; challengeId: ChallengeId; items: PlacedItem[]; ratio: ReturnType<typeof getChallengeRatio>; numerator: string; denominator: string; result?: MathResult; mode: "idle" | "loading" | "ai" | "fallback" | "error"; onNumerator: (value: string) => void; onDenominator: (value: string) => void; onCalculate: () => void; onBack: () => void; onNext: () => void }) {
  return <section className="math-lab"><Heading k="ORAN LABORATUVARI" title="Tasarımındaki oranı adım adım hesapla."/><CalculationQuestion challengeId={props.challengeId} ratio={props.ratio}/><p className="math-intro">Önce her kartın işlemini yap, sonra payı ve paydayı hesapla.</p><RatioDesignGuide items={props.items} challengeId={props.challengeId}/><div className="math-layout"><div className="card fraction-card"><h3>Cevabını kesre yaz</h3><label><span>Pay</span><input aria-label={`Pay: ${props.ratio.numeratorLabel}`} type="number" min="0" inputMode="numeric" value={props.numerator} onChange={(event) => props.onNumerator(event.target.value)} placeholder="?"/><small>{props.ratio.numeratorLabel}</small></label><div className="fraction-line"/><label><span>Payda</span><input aria-label={`Payda: ${props.ratio.denominatorLabel}`} type="number" min="1" inputMode="numeric" value={props.denominator} onChange={(event) => props.onDenominator(event.target.value)} placeholder="?"/><small>{props.ratio.denominatorLabel}</small></label><button className="primary" disabled={props.mode === "loading" || !props.numerator || !props.denominator} onClick={props.onCalculate}>{props.mode === "loading" ? "AI hesaplıyor…" : "AI ile oranı hesapla"}</button></div><div className="card math-result">{!props.result && <div className="empty-result"><span>➗</span><b>Sonucun burada görünecek.</b><p>Payı paydaya böleceğiz; kesri sadeleştirip ondalık sayı ve yüzde olarak göstereceğiz.</p></div>}{props.result && <>{props.result.matchesDesign ? <><PieChart percentage={props.result.percentage}/><div className="calculation"><b>{props.result.simplifiedNumerator}/{props.result.simplifiedDenominator}</b><span>= {props.result.decimal}</span><strong>= %{props.result.percentage}</strong></div><p>{props.result.explanation}</p></> : <div className="math-hint"><span>🔎</span><h3>Kartlardaki işlemleri bir kez daha yap.</h3><p>{props.result.hint}</p><small>Girdiğin {props.numerator}/{props.denominator} oranı %{props.result.percentage} eder, ama tasarımındaki sayılarla aynı değil.</small></div>}</>}</div></div>{props.mode === "error" && <div className="errors"><p>Pay 0 veya daha büyük, payda 1 veya daha büyük bir tam sayı olmalı.</p></div>}{props.mode === "fallback" && <p className="hint">AI yardımcısına ulaşılamadı; hesabı oyun kendisi yaptı.</p>}<div className="actions"><button className="secondary" onClick={props.onBack}>← Analize dön</button><button className="primary" disabled={!props.result?.matchesDesign} onClick={props.onNext}>AI jüriye geç →</button></div><p className="hint">Açıklama {props.grade}. sınıf düzeyinde yazılır. Oyun, hesabı ayrıca kontrol eder.</p></section>;
}

function CalculationQuestion({ challengeId, ratio }: { challengeId: ChallengeId; ratio: ReturnType<typeof getChallengeRatio> }) {
  const challenge = getChallenge(challengeId)!;
  const resource = challengeResource(challengeId);
  return <div className="card calculation-question"><div><span className="eyebrow">HESAPLAYACAĞIN ORAN • {resource.title.toLocaleUpperCase("tr-TR")}</span><h2>{challenge.emoji} {resource.question}</h2></div><div className="target-fraction"><span><b>PAY</b>{ratio.numeratorLabel}</span><i/><span><b>PAYDA</b>{ratio.denominatorLabel}</span></div><ol><li><b>Payı bul:</b> <strong>PAYA YAZ</strong> kartlarının işlemlerini yap ve sonuçları topla.</li>{resource.fixedDemand ? <li><b>Paydayı bul:</b> Hedef kartındaki yüzde hesabını yap.</li> : <li><b>Paydayı bul:</b> <strong>+ PAYDAYA EKLE</strong> kartlarını topla{resource.saving.length > 0 && <>, <strong>− PAYDADAN ÇIKAR</strong> kartlarını çıkar</>}.</li>}<li>Bulduğun iki tam sayıyı aşağıdaki kesre yaz.</li></ol></div>;
}

function RatioDesignGuide({ items, challengeId }: { items: PlacedItem[]; challengeId: ChallengeId }) {
  const challenge = getChallenge(challengeId)!;
  const supplies = supportTypes(challengeId);
  return <div className="card ratio-design-guide"><div className="ratio-design-head"><div><span className="eyebrow">KİLİTLİ TASARIMIN</span><h2>{challenge.emoji} {challenge.title}</h2><p>Çerçeveli bileşenler paya kaynak ekler. Diğer bileşenlerin bazıları paydayı büyütür, bazıları tasarrufla küçültür; kartlara bak.</p></div><div className="ratio-legend"><span><i className="supports"/>Paya kaynak ekler</span><span><i/>Paydada veya hesap dışında</span></div></div><div className="ratio-design-body"><div className="grid ratio-grid" role="img" aria-label="Oran hesabı için kilitli kampüs tasarımı">{Array.from({ length: 100 }, (_, index) => <i className="cell" style={{ gridColumn: index % 10 + 1, gridRow: Math.floor(index / 10) + 1 }} key={index}/>)}{items.map((item) => { const supports = supplies.includes(item.type); return <span key={item.id} className={`placed ratio-piece ${supports ? "supports" : "other"}`} style={{ gridColumn: `${item.x + 1}/span ${item.width}`, gridRow: `${item.y + 1}/span ${item.height}`, background: COMPONENTS[item.type].color }} title={COMPONENTS[item.type].label}><span>{componentIcons[item.type]}</span></span>; })}</div><ResourceMathGuide items={items} challengeId={challengeId}/></div><p className="ratio-task"><b>Görevin:</b> Her kartın işlemini yap. Pay kutusundaki sonuçları topla; payda kutusunda eklenecekleri topla, çıkarılacakları çıkar.</p></div>;
}

function ResourceMathGuide({ items, challengeId }: { items: PlacedItem[]; challengeId: ChallengeId }) {
  const resource = challengeResource(challengeId);
  const balance = getResourceBalance(items, CHALLENGE_RESOURCE[challengeId]);
  const supply = balance.rows.filter((row) => row.role === "supply");
  const demand = balance.rows.filter((row) => row.role === "demand");
  const saving = balance.rows.filter((row) => row.role === "saving");
  const tags = { supply: "PAYA YAZ", demand: "+ PAYDAYA EKLE", saving: "− PAYDADAN ÇIKAR" };
  const kinds = { supply: "KAYNAK", demand: "İHTİYAÇ", saving: "TASARRUF" };
  const group = (rows: ResourceRow[], wrap: boolean) => { const terms = rows.map((row) => rows.length > 1 && row.calculation.includes(" ") ? `(${row.calculation})` : row.calculation); const joined = terms.join(" + ") || "0"; return wrap && rows.length > 1 ? `(${joined})` : joined; };
  const card = (row: ResourceRow) => <div className={`energy-card ${row.role}`} key={row.key}><span><b>{row.label}</b><small>{row.detail} = ?</small><small className="row-reason">{row.reason}</small></span><em><small>{kinds[row.role]}</small>{tags[row.role]}</em></div>;
  const batteries = items.filter((item) => item.type === "battery").length;
  return <div className="energy-math-cards"><b>{resource.title} kartların</b><small>Her kartın işlemini sen yap; birim: {resource.unit}.</small><section className="energy-part numerator"><header><strong>PAY</strong><span>Kesrin üstü • {resource.supplyLabel}</span></header>{supply.length ? supply.map(card) : <p>Bu oran için kaynak bileşenin yok; bu yüzden pay 0 olur.</p>}<p className="energy-formula">Pay = {group(supply, false)} = ?</p></section><section className="energy-part denominator"><header><strong>PAYDA</strong><span>Kesrin altı • {resource.demandLabel}</span></header>{demand.map(card)}{saving.map(card)}<p className="energy-formula">Payda = {saving.length ? `${group(demand, true)} − ${group(saving, true)}` : group(demand, false)} = ?</p>{resource.minNet > 1 && <p>{resource.title} hesabında payda en az {resource.minNet} birimdir. Çıkarma sonucun {resource.minNet}’ten küçükse paydaya {resource.minNet} yaz.</p>}</section>{challengeId === "energy" && batteries > 0 && <div className="energy-card neutral"><span><b>Enerji depolama</b><small>{batteries} adet • normal günde üretim eklemez; bulutlu günde güneş üretimini korur.</small></span><em><small>DEPOLAMA</small>HESABA GİRMEZ</em></div>}</div>;
}

function PieChart({ percentage }: { percentage: number }) {
  const safe = Math.max(0, Math.min(100, percentage));
  return <div className="pie-wrap"><div className="pie" role="img" aria-label={`Karşılanan kısım yüzde ${safe}`} style={{ background: `conic-gradient(var(--teal) 0 ${safe}%, #dfe8e6 ${safe}% 100%)` }}><span>%{percentage}</span></div><div className="pie-legend"><span><i className="legend-support"/>Karşılanan kısım</span><span><i/>Karşılanmayan kısım</span></div></div>;
}

function DesignFindingsCard({ findings }: { findings: DesignFinding[] }) {
  return <div className="design-findings"><h3>Tasarımda gördüklerimiz</h3>{findings.map((finding) => <div className={finding.tone} key={finding.id}><span>{finding.tone === "strength" ? "✓" : "!"}</span><p><b>{finding.title}</b><small>{finding.detail}</small></p></div>)}</div>;
}

function AssessmentCard({ assessment }: { assessment: AiAssessment }) {
  const resolution = { solved: "Çözdü", partly_solved: "Kısmen çözdü", not_yet: "Henüz çözmedi" }[assessment.problemResolution];
  const confidence = { low: "Düşük", medium: "Orta", high: "Yüksek" }[assessment.confidence];
  return <div className="assessment"><div className={`resolution ${assessment.problemResolution}`}><span>SORUN DURUMU</span><b>{resolution}</b><small>AI ne kadar emin: {confidence}</small></div><div className="assessment-copy"><p>{assessment.summary}</p><div className="evidence-list"><b>Sayılarla kanıtlar</b>{assessment.evidence.map((item) => <span key={item}>◆ {item}</span>)}</div></div><div className="rubric"><Rubric label="Amacına uyuyor mu?" value={assessment.rubric.goalFit} max={20}/><Rubric label="İyi ve zor yanları görmek" value={assessment.rubric.tradeoffAwareness} max={15}/><Rubric label="Sayılarla açıklamak" value={assessment.rubric.evidenceUse} max={10}/><Rubric label="Seçimler birbirine uyuyor mu?" value={assessment.rubric.coherence} max={5}/></div><div className="assessment-notes"><div><b>✓ Güçlü yan</b>{assessment.strengths.map((item) => <p key={item}>{item}</p>)}</div><div><b>! Düşünülmesi gereken</b>{assessment.risks.map((item) => <p key={item}>{item}</p>)}</div></div></div>;
}

function Rubric({ label, value, max }: { label: string; value: number; max: number }) { return <div><span>{label}</span><progress max={max} value={value}/><b>{value}/{max}</b></div>; }
function ScoreSummary({ technical, ai }: { technical: TechnicalScore; ai: number }) { return <div className="score-summary"><div><span>Teknik + matematik</span><b>{technical.total}<small>/50</small></b></div><div><span>AI jüri</span><b>{ai}<small>/50</small></b></div><div className="grand-total"><span>Toplam</span><b>{technical.total + ai}<small>/100</small></b></div><p className="score-breakdown">Teknik puan nereden geldi? Kurallara uygun yerleşim {technical.validity}/5 • oran hesabı {technical.math}/15 • görev koşulları {technical.balance}/20 • okul puanları {technical.indicators}/10</p></div>; }
function CampusGrid({ items, active, onCell, onActive }: { items: PlacedItem[]; active?: string; onCell: (x: number, y: number) => void; onActive: (id: string) => void }) { return <div className="grid" role="grid" aria-label="10 çarpı 10 kampüs alanı">{Array.from({ length: 100 }, (_, index) => <button key={index} className="cell" style={{ gridColumn: index % 10 + 1, gridRow: Math.floor(index / 10) + 1 }} onClick={() => onCell(index % 10, Math.floor(index / 10))} aria-label={`Kare ${index % 10 + 1},${Math.floor(index / 10) + 1}`}/>)}{items.map((item) => { const definition = COMPONENTS[item.type]; const landCells = footprintCells(item); return <button key={item.id} className={`placed ${active === item.id ? "active" : ""}`} style={{ gridColumn: `${item.x + 1}/span ${item.width}`, gridRow: `${item.y + 1}/span ${item.height}`, background: definition.color }} onClick={() => onActive(item.id)}><span className="placedicon">{componentIcons[item.type]}</span><b>{definition.shortLabel}</b><small>{landCells ? `${landCells * 100} m²` : "Binaya eklendi"}</small></button>; })}</div>; }
function Metrics({ evaluation: current, drops }: { evaluation: ReturnType<typeof evaluateDesign>; drops?: Partial<Record<keyof typeof scoreLabels, EventDrop>> }) { return <div className="metrics"><div className="total"><span>Sürdürülebilirlik puanı</span><b>{current.scores.total}</b><small>/100</small></div><div className="budget"><span>Bütçe</span><b>{current.budgetUsed}/100</b><progress max="100" value={current.budgetUsed}/></div><div className="area"><span>Kullanılan alan</span><b>{current.areas.usedM2.toLocaleString("tr-TR")} m² • %{current.areas.usedPercent}</b><small>Açık alan %{current.areas.openPercent} • Bina %{current.areas.builtPercent} • Enerji alanı %{current.areas.infrastructurePercent}</small></div>{(Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>).map((key) => <div className="score" key={key}><span>{scoreLabels[key]}</span><LossBar value={current.scores[key]} before={drops?.[key]?.before} max={100} label={`${scoreLabels[key]} puanı`}/><b>{current.scores[key]}</b>{drops?.[key] && <DropNote before={drops[key].before} now={current.scores[key]} unit="puan" reason={drops[key].reason}/>}</div>)}</div>; }
function MiniPlan({ title, items, evaluation, previousScore, eventScore }: { title: string; items: PlacedItem[]; evaluation: ReturnType<typeof evaluateDesign>; previousScore?: number; eventScore?: number }) {
  const difference = previousScore === undefined ? undefined : evaluation.scores.total - previousScore;
  return <div className="miniplan"><h3>{title}</h3><div className="grid mini">{Array.from({ length: 100 }, (_, index) => <i className="cell" style={{ gridColumn: index % 10 + 1, gridRow: Math.floor(index / 10) + 1 }} key={index}/>)}{items.map((item) => <span key={item.id} className="placed" style={{ gridColumn: `${item.x + 1}/span ${item.width}`, gridRow: `${item.y + 1}/span ${item.height}`, background: COMPONENTS[item.type].color }} title={COMPONENTS[item.type].label}/>)}</div><div className="plan-score"><span>Sürdürülebilirlik puanı</span><b>{evaluation.scores.total}<small>/100</small></b>{difference !== undefined && <em className={difference >= 0 ? "up" : "down"}>{difference >= 0 ? "+" : ""}{difference} puan (ilk tasarımın olaydaki puanına göre)</em>}{eventScore !== undefined && <em className="event-score">2040 olayında: {eventScore}/100</em>}</div></div>;
}
function Delta({ normal, before, after }: { normal?: ReturnType<typeof evaluateDesign>["scores"]; before: ReturnType<typeof evaluateDesign>["scores"]; after: ReturnType<typeof evaluateDesign>["scores"] }) {
  const signed = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${-value}` : "0";
  return <div className="delta-section"><h3>{normal ? "Puanların: ilk tasarım → 2040 olayında → yeniden tasarım" : "Puanlarının karşılaştırması"}</h3><div className="deltas">{(Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>).map((key) => { const eventChange = normal ? before[key] - normal[key] : 0; const teamChange = after[key] - before[key]; return <div key={key}><span>{scoreLabels[key]}</span><b>{normal ? `${normal[key]} → ${before[key]} → ${after[key]}` : `${before[key]} → ${after[key]}`}</b>{normal && <em className={eventChange < 0 ? "down" : "neutral"}>olay {signed(eventChange)}</em>}<em className={teamChange >= 0 ? "up" : "down"}>{normal ? "sen " : ""}{signed(teamChange)}</em></div>; })}</div>{normal && <small className="delta-legend">“olay” = 2040 olayının değiştirdiği puan • “sen” = senin değişikliklerinin etkisi</small>}</div>;
}

function EventLosses({ report }: { report: ResilienceReport }) {
  const lines: string[] = [];
  const { normal, shocked, ratio } = report;
  if (ratio.normal !== ratio.shocked) lines.push(`${ratio.title} oranı: %${ratio.normal} → %${ratio.shocked}`);
  for (const key of Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>) if (shocked.scores[key] < normal.scores[key]) lines.push(`${scoreLabels[key]} puanı: ${normal.scores[key]} → ${shocked.scores[key]} (${normal.scores[key] - shocked.scores[key]} puan düştü)`);
  return <div className="event-losses"><h3>⚡ 2040 olayı ilk tasarımında neleri düşürdü?</h3>{lines.length ? lines.map((line) => <p key={line}>{line}</p>) : <p>Bu olay ilk tasarımında hiçbir sayıyı düşürmedi.</p>}{ratio.note && <small>{ratio.note}</small>}</div>;
}

function ComparisonImpact({ before, after }: { before: ReturnType<typeof evaluateDesign>; after: ReturnType<typeof evaluateDesign> }) {
  const improved: string[] = [];
  const weakened: string[] = [];
  // Puanlar "önce → sonra (fark)", yüzdeler "%önce → %sonra" biçiminde yazılır.
  const compare = (label: string, previous: number, current: number, percent = false) => {
    const difference = current - previous;
    const text = percent ? `${label}: %${previous} → %${current}` : `${label} puanı: ${previous} → ${current} (${difference > 0 ? "+" : "−"}${Math.abs(difference)})`;
    if (difference > 0) improved.push(text);
    if (difference < 0) weakened.push(text);
  };
  (Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>).forEach((key) => compare(scoreLabels[key], before.scores[key], after.scores[key]));
  compare("Yeşil alan", before.areas.greenPercent, after.areas.greenPercent, true);
  compare("Açık alan", before.areas.openPercent, after.areas.openPercent, true);
  compare("Enerji karşılama", before.energyBalance.coveragePercent, after.energyBalance.coveragePercent, true);
  const budgetDifference = after.budgetUsed - before.budgetUsed;
  if (budgetDifference < 0) improved.push(`Harcanan bütçe ${Math.abs(budgetDifference)} puan azaldı`);
  if (budgetDifference > 0) weakened.push(`Harcanan bütçe ${budgetDifference} puan arttı`);

  return <div className="comparison-impact"><div className="impact-improved"><h3>✓ İyileşenler</h3>{improved.length ? improved.map((item) => <p key={item}>{item}</p>) : <p>İyileşen bir sayı yok.</p>}</div><div className="impact-weakened"><h3>! Kötüleşenler</h3>{weakened.length ? weakened.map((item) => <p key={item}>{item}</p>) : <p>Hiçbir sayı kötüleşmedi.</p>}</div></div>;
}
function EventScreen({ id, report, challengeId, onNext }: { id: EventId; report?: ResilienceReport; challengeId?: ChallengeId; onNext: () => void }) { const event = getEvent(id)!; return <section className="event"><span className="eventicon">{event.icon}</span><span className="eyebrow">2040 OLAY KARTI</span><h1>{event.title}</h1><p>{event.description}</p>{report && <EventImpactCard report={report} challengeId={challengeId}/>}<div className="card prompt">İlk tasarımını bu yeni koşula göre yeniden düşün. Her şeyi değiştirmek zorunda değilsin; kararını sayıyla açıkla.</div><button className="primary" onClick={onNext}>Koşulu kabul et →</button></section>; }
function EventImpactCard({ report, challengeId }: { report: ResilienceReport; challengeId?: ChallengeId }) {
  const { focus, focusLabel, impact, normal, shocked, absorbers, ratio } = report;
  const isEnergy = report.eventId === "energyLimit";
  const newCondition = challengeId ? eventCondition(challengeId, report.eventId) : undefined;
  return <div className="card event-impact"><span className="eyebrow">BU OLAY İLK TASARIMINI NASIL ETKİLEDİ?</span><div className="resilience-points"><div><span>{ratio.title} • normal günde</span><b>%{ratio.normal}</b></div><i>→</i><div className="shocked"><span>{ratio.title} • bu olayda</span><b>%{ratio.shocked}</b></div></div>{Math.max(ratio.normal, ratio.shocked) > 100 && <small>{OVER_HUNDRED}</small>}{ratio.note && <p>{ratio.note}</p>}{!isEnergy && <><div className="resilience-points small"><div><span>{focusLabel} puanı • normal günde</span><b>{normal.scores[focus]}</b></div><i>→</i><div className="shocked"><span>{focusLabel} puanı • bu olayda</span><b>{shocked.scores[focus]}</b></div></div><p>{focusImpactText(focusLabel, impact, normal.scores[focus] - shocked.scores[focus])}</p>{absorbers.length > 0 && <ul>{absorbers.map((absorber) => <li key={absorber.type}><b>{absorber.count} × {absorber.label}</b>: {absorber.points} {absorber.unit} korudu</li>)}</ul>}</>}{newCondition && <p className="event-condition">Bu olay yeni bir koşul getirdi: <b>{newCondition.label} en az %{newCondition.target}</b> olmalı. Yeniden tasarımda bunu “2040 koşulu” satırında göreceksin.</p>}<small>Yeniden tasarımda bu düşüşlerin ne kadarını geri kazanabilirsin?</small></div>;
}
function ResilienceStrip({ report }: { report: ResilienceReport }) {
  const { focus, focusLabel, normal, shocked, redesigned, ratio } = report;
  const isEnergy = report.eventId === "energyLimit";
  return <div className="card resilience-strip"><span className="eyebrow">DAYANIKLILIK TESTİ • {getEvent(report.eventId)?.title}</span><div className="resilience-points"><div><span>{ratio.title} • ilk tasarım</span><b>%{ratio.normal}</b></div><i>→</i><div className="shocked"><span>{ratio.title} • 2040 olayında</span><b>%{ratio.shocked}</b></div><i>→</i><div className="redesigned"><span>{ratio.title} • yeniden tasarım</span><b>%{ratio.redesigned}</b></div></div>{!isEnergy && <div className="resilience-points small"><div><span>{focusLabel} puanı • ilk tasarım</span><b>{normal.scores[focus]}</b></div><i>→</i><div className="shocked"><span>{focusLabel} puanı • 2040 olayında</span><b>{shocked.scores[focus]}</b></div><i>→</i><div className="redesigned"><span>{focusLabel} puanı • yeniden tasarım</span><b>{redesigned.scores[focus]}</b></div></div>}<p>{resilienceSummary(report)}</p><small>Sürdürülebilirlik puanı: {normal.scores.total} → {shocked.scores.total} → {redesigned.scores.total}. “Sen” yazan farklar, ilk tasarımının olaydaki puanıyla karşılaştırılır. Böylece yalnızca senin değişikliklerini gösterir.</small></div>;
}
function Heading({ k, title }: { k: string; title: string }) { return <div className="heading"><span className="eyebrow">{k}</span><h1>{title}</h1></div>; }
function Fact({ n, unit, text }: { n: string; unit: string; text: string }) { return <div><b>{n}</b><em>{unit}</em><span>{text}</span></div>; }
