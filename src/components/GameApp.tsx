"use client";

import { useEffect, useMemo, useState } from "react";
import { COMPONENT_LIST, COMPONENTS, footprintCells } from "@/lib/game/catalog";
import { CHALLENGES, getChallenge, getChallengeRatio } from "@/lib/game/challenges";
import { evaluateChallengeBalance } from "@/lib/game/balance";
import { EVENTS, getEvent } from "@/lib/game/events";
import { canPlace, createSnapshot, evaluateDesign } from "@/lib/game/engine";
import { analyzeDesign } from "@/lib/game/diagnostics";
import { clearSession, loadSession, saveSession } from "@/lib/game/storage";
import { downloadExhibitionPng } from "@/lib/export/png";
import type { AiAssessment, ChallengeId, ComponentType, DesignFinding, EventId, GradeBand, MathResult, PlacedItem, SessionState } from "@/lib/game/types";

const createFresh = (): SessionState => ({
  teamAlias: "", gradeBand: "6", step: 0, designIntent: "", items: [], mathNumerator: "", mathDenominator: "",
  advisorQuestions: [], advisorResponses: [], reflection: "",
});
const stepNames = ["Takım", "Sorun", "Görev", "Tasarla", "Analiz", "Oran laboratuvarı", "AI jüri", "2040 olayı", "Yeniden tasarla", "Karşılaştır", "Savun", "Sergile"];
const scoreLabels = { climate: "İklim", water: "Su", energy: "Enerji", health: "Sağlık", circularity: "Doğa" };
const componentIcons: Record<ComponentType, string> = { education: "▦", sports: "●", green: "✦", solar: "☀", rainwater: "≈", recycling: "↻", bike: "◇", shade: "♣", garden: "❋", outdoorClass: "⌂", insulation: "▤", daylight: "◐", battery: "▣" };

export default function GameApp() {
  const [state, setState] = useState<SessionState>(createFresh);
  const [selected, setSelected] = useState<ComponentType>("green");
  const [rotated, setRotated] = useState(false);
  const [active, setActive] = useState<string>();
  const [history, setHistory] = useState<PlacedItem[][]>([]);
  const [notice, setNotice] = useState("");
  const [advisorMode, setAdvisorMode] = useState<"loading" | "ai" | "fallback">("fallback");
  const [mathMode, setMathMode] = useState<"idle" | "loading" | "ai" | "error">("idle");
  const [finalAdvisorMode, setFinalAdvisorMode] = useState<"idle" | "loading" | "ai" | "fallback">("idle");
  const [hydrated, setHydrated] = useState(false);
  const evaluation = useMemo(() => evaluateDesign(state.items, state.step >= 8 ? state.eventId : undefined), [state.items, state.eventId, state.step]);

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
    setMathMode("loading");
    try {
      const response = await fetch("/api/math", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeBand: state.gradeBand, challengeId: state.challengeId, numeratorLabel: expected.numeratorLabel, numerator, denominator, expectedNumerator: expected.numerator, expectedDenominator: expected.denominator }),
      });
      if (!response.ok) throw new Error("math");
      const result = await response.json() as MathResult;
      patch({ mathResult: result }); setMathMode("ai");
    } catch { setMathMode("error"); }
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
    const local = analyzeDesign(state.items, evaluation, state.challengeId);
    patch({ step: 9, finalAssessment: undefined, finalFindings: local.findings });
    void requestAdvisor("redesign", evaluation, state.items, state.initialDesign.evaluation);
  };
  const drawEvent = () => { const event = EVENTS[Math.floor(Math.random() * EVENTS.length)]; patch({ eventId: event.id, step: 7 }); };
  const answer = (index: number, value: string) => patch({ advisorResponses: state.advisorResponses.map((answerValue, answerIndex) => answerIndex === index ? value : answerValue) });
  const reset = () => { clearSession(); setState(createFresh()); setHistory([]); setActive(undefined); setNotice(""); setAdvisorMode("fallback"); setMathMode("idle"); setFinalAdvisorMode("idle"); };
  if (!hydrated) return <main className="loading">Kampüs hazırlanıyor…</main>;

  const challenge = getChallenge(state.challengeId);
  const technical = technicalScore(state.initialDesign?.evaluation ?? evaluation, state.initialDesign?.placedItems ?? state.items, Boolean(state.mathResult?.matchesDesign), state.challengeId);
  const activeAssessment = state.finalAssessment ?? state.initialAssessment;

  return <div className="app">
    <header className="topbar"><div className="brand"><span className="brandmark">FS</span><div><b>FutureSchool AI</b><small>2040 Kampüs Laboratuvarı</small></div></div>{state.step > 0 && <><div className="progress" aria-label={`Adım ${state.step} / 11`}><span style={{ width: `${state.step / 11 * 100}%` }} /></div><div className="step-chip"><small>ŞİMDİ</small><b>{stepNames[state.step]}</b></div><button className="ghost" onClick={() => document.documentElement.requestFullscreen?.()}>⛶ Tam ekran</button></>}</header>
    <main className={state.step === 3 || state.step === 8 ? "workspace" : "stage"}>
      {state.step === 0 && <section className="welcome"><div className="hero-copy"><span className="eyebrow">STEM • MATEMATİK • SÜRDÜRÜLEBİLİRLİK</span><h1>2040’ın sürdürülebilir okulunu <em>tasarlıyorum!</em></h1><p>Alanı ölç, oranları hesapla, bütçeni yönet ve geleceğin okulunu tasarla.</p><div className="card form"><label>Takım rumuzu<input maxLength={30} value={state.teamAlias} onChange={(event) => patch({ teamAlias: event.target.value })} placeholder="Örn. Gelecek Mimarları" /></label><label>Sınıf düzeyi<select value={state.gradeBand} onChange={(event) => patch({ gradeBand: event.target.value as GradeBand })}>{["5", "6", "7", "8"].map((grade) => <option key={grade} value={grade}>{grade}. sınıf</option>)}</select></label><button className="primary" disabled={!state.teamAlias.trim()} onClick={() => next(1)}>Planlamaya başla <span>→</span></button></div><p className="privacy">◆ İsim, e-posta veya kişisel bilgi istemiyoruz.</p></div><div className="hero-visual" aria-hidden="true"><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><div className="campus-preview"><div className="preview-head"><span>İSTANBUL • 2040</span><b>Canlı kampüs modeli</b></div><div className="preview-map"><i className="pv pv-school">▦</i><i className="pv pv-green">✦</i><i className="pv pv-solar">☀</i><i className="pv pv-water">≈</i><i className="pv pv-sport">●</i></div><div className="preview-score"><span><b>50</b> teknik puan</span><span><b>50</b> AI jüri</span></div></div><div className="floating-card fc-ai"><b>AI</b><span>Jüri ve matematik yardımcısı</span></div><div className="floating-card fc-climate"><b>%</b><span>Oranları keşfet</span></div></div></section>}

      {state.step === 1 && <section className="challenge-stage"><Heading k="1 • SORUNUNU SEÇ" title="Okulun hangi sorunu çözsün?"/><div className="challenge-grid">{CHALLENGES.map((item) => <button key={item.id} className={`challenge-card ${state.challengeId === item.id ? "selected" : ""}`} onClick={() => patch({ challengeId: item.id })}><span>{item.emoji}</span><b>{item.title}</b><small>{item.description}</small></button>)}</div><div className="card intent-card"><label>Tasarım amacın<textarea maxLength={400} value={state.designIntent} onChange={(event) => patch({ designIntent: event.target.value })} placeholder="Örn. Yeşil alan ve gölgelik kullanarak okul bahçesini serinletmek istiyorum." /></label><small>{state.designIntent.trim().length}/10 minimum karakter</small></div><button className="primary" disabled={!state.challengeId || state.designIntent.trim().length < 10} onClick={() => next(2)}>Görevi gör →</button></section>}

      {state.step === 2 && state.challengeId && <section className="brief"><span className="eyebrow">GÖREV DOSYASI • İSTANBUL 2040</span><h1>{challenge?.emoji} {challenge?.title} için bir kampüs kur.</h1><div className="briefgrid"><Fact n="10.000" unit="m²" text="Toplam kampüs alanı"/><Fact n="100" unit="puan" text="Tasarım bütçesi"/><Fact n="10×10" unit="grid" text="Her hücre 100 m²"/></div><ChallengeMissionBrief challengeId={state.challengeId} evaluation={evaluation}/><div className="mission card"><h2>Başarı koşulları</h2><p>✓ En az 1 eğitim binası</p><p>✓ En az 1 spor salonu</p><p>✓ Çakışmayan, bütçeyi aşmayan yerleşim</p><p>✓ Seçimlerin iyi ve zor yanlarını açıklama</p><p>✓ Pay, payda, oran ve yüzde hesabı</p></div><div className="goal-strip"><b>Amacın:</b> {state.designIntent}</div><button className="primary" onClick={() => next(3)}>Tasarlamaya başla →</button></section>}

      {(state.step === 3 || state.step === 8) && <Designer redesign={state.step === 8} challengeId={state.challengeId!} state={state} evaluation={evaluation} selected={selected} rotated={rotated} active={active} notice={notice} onSelect={(type) => { setSelected(type); setActive(undefined); }} onCell={cellClick} onActive={setActive} onRotate={rotate} onRemove={remove} onUndo={undo} onNext={() => state.step === 3 ? next(4) : analyzeRedesign()} />}

      {state.step === 4 && state.challengeId && <section><Heading k="İLK TASARIM ANALİZİ" title="Kararların sayılara dönüştü."/><div className="goal-strip"><b>{challenge?.emoji} Çözmek istediğin sorun:</b> {challenge?.title}<br/><b>Amacın:</b> {state.designIntent}</div><ChallengeBalanceCard challengeId={state.challengeId} items={state.items} evaluation={evaluation}/><Metrics evaluation={evaluation}/>{evaluation.errors.length > 0 && <div className="errors">{evaluation.errors.map((error) => <p key={error}>! {error}</p>)}</div>}<div className="actions"><button className="secondary" onClick={() => next(3)}>← Tasarıma dön</button><button className="primary" disabled={!evaluation.isValid} onClick={lock}>Tasarımı kilitle →</button></div><p className="hint">Kilitledikten sonra pay ve paydayı sen bulacaksın.</p></section>}

      {state.step === 5 && state.initialDesign && state.challengeId && <MathLab grade={state.gradeBand} challengeId={state.challengeId} items={state.initialDesign.placedItems} ratio={getChallengeRatio(state.initialDesign.placedItems, state.challengeId)} numerator={state.mathNumerator} denominator={state.mathDenominator} result={state.mathResult} mode={mathMode} onNumerator={(value) => patch({ mathNumerator: value, mathResult: undefined })} onDenominator={(value) => patch({ mathDenominator: value, mathResult: undefined })} onCalculate={calculateRatio} onBack={() => next(4)} onNext={startAdvisor} />}

      {state.step === 6 && <section><Heading k="AI JÜRİ VE BİLİM DANIŞMANI" title="Tasarımın sorununu çözüyor mu?"/><div className="advisor card"><div className="advisorhead"><span className="orb">AI</span><span>{advisorMode === "loading" ? "AI jüri açıklamayı hazırlıyor…" : advisorMode === "ai" ? "AI jüri raporu hazır" : "Oyun motorunun doğruladığı sorular gösteriliyor"}</span>{advisorMode === "fallback" && <button className="secondary advisor-retry" onClick={retryAdvisor}>AI açıklamasını yeniden dene</button>}</div>{state.initialFindings && <DesignFindingsCard findings={state.initialFindings}/>} {state.initialAssessment && <AssessmentCard assessment={state.initialAssessment}/>}<div className="advisor-questions"><h3>Bu bulgulara göre düşün</h3>{state.advisorQuestions.map((question, index) => <label key={question}><b>{index + 1}. {question}</b><textarea disabled={advisorMode === "loading"} value={state.advisorResponses[index] || ""} onChange={(event) => answer(index, event.target.value)} placeholder="Takım olarak kısa cevabınızı yazın…" /></label>)}</div></div>{state.initialAssessment && <ScoreSummary technical={technical} ai={state.initialAssessment.aiScore}/>}<button className="primary" disabled={advisorMode === "loading" || state.advisorResponses.some((value) => !value.trim())} onClick={drawEvent}>2040 olay kartını çek →</button></section>}

      {state.step === 7 && <EventScreen id={state.eventId!} onNext={() => next(8)}/>}

      {state.step === 9 && state.initialDesign && state.challengeId && <section><Heading k="ÖNCE / SONRA" title="Değişikliklerin sorunu çözdü mü?"/><div className="compare"><MiniPlan title="İlk tasarım" items={state.initialDesign.placedItems} evaluation={state.initialDesign.evaluation}/><MiniPlan title="Son tasarım" items={state.items} evaluation={evaluation} previousScore={state.initialDesign.evaluation.scores.total}/></div><Delta before={state.initialDesign.evaluation.scores} after={evaluation.scores}/><ComparisonImpact before={state.initialDesign.evaluation} after={evaluation}/><ChallengeBalanceCard challengeId={state.challengeId} items={state.items} evaluation={evaluation}/><div className="advisor card compare-advisor"><div className="advisorhead"><span className="orb">AI</span><span>{finalAdvisorMode === "loading" ? "AI jüri değişiklikleri karşılaştırıyor…" : finalAdvisorMode === "ai" ? "Değişim raporu hazır" : "Oyun motorunun doğruladığı bulgular gösteriliyor"}</span>{finalAdvisorMode === "fallback" && <button className="secondary advisor-retry" onClick={analyzeRedesign}>AI açıklamasını yeniden dene</button>}</div>{state.finalFindings && <DesignFindingsCard findings={state.finalFindings}/>} {state.finalAssessment && <AssessmentCard assessment={state.finalAssessment}/>}</div>{state.finalAssessment && <ScoreSummary technical={technicalScore(evaluation, state.items, Boolean(state.mathResult?.matchesDesign), state.challengeId)} ai={state.finalAssessment.aiScore}/>}<div className="actions"><button className="secondary" onClick={() => next(8)}>← Yeniden düzenle</button><button className="primary" disabled={finalAdvisorMode === "loading"} onClick={() => next(10)}>Savunmaya geç →</button></div></section>}

      {state.step === 10 && <section><Heading k="TAKIM SAVUNMASI" title="En önemli değişikliğiniz neydi?"/><div className="card reflection"><p>“Şu alanı veya kararı değiştirdik; çünkü…”</p><textarea value={state.reflection} onChange={(event) => patch({ reflection: event.target.value })} minLength={20} placeholder="Kararınızı bir sayı ve gerekçeyle anlatın."/><small>{state.reflection.trim().length}/20 minimum karakter</small></div><button className="primary" disabled={state.reflection.trim().length < 20} onClick={() => next(11)}>Sergi çıktısını hazırla →</button></section>}

      {state.step === 11 && state.initialDesign && state.challengeId && <section className="final"><Heading k="SERGİYE HAZIR" title={`${state.teamAlias} takımının 2040 kampüsü`}/><div className="printarea"><div className="goal-strip"><b>{challenge?.emoji} {challenge?.title}</b><br/>{state.designIntent}</div><div className="compare"><MiniPlan title="İlk tasarım" items={state.initialDesign.placedItems} evaluation={state.initialDesign.evaluation}/><MiniPlan title="Son tasarım" items={state.items} evaluation={evaluation} previousScore={state.initialDesign.evaluation.scores.total}/></div><ComparisonImpact before={state.initialDesign.evaluation} after={evaluation}/><ChallengeBalanceCard challengeId={state.challengeId} items={state.items} evaluation={evaluation}/><Metrics evaluation={evaluation}/>{activeAssessment && <><AssessmentCard assessment={activeAssessment}/><ScoreSummary technical={technicalScore(evaluation, state.items, Boolean(state.mathResult?.matchesDesign), state.challengeId)} ai={activeAssessment.aiScore}/></>}<blockquote>{state.reflection}</blockquote><p>{getEvent(state.eventId)?.title}</p></div><div className="actions no-print"><button className="secondary" onClick={() => window.print()}>PDF / Yazdır</button><button className="primary" onClick={() => downloadExhibitionPng({ team: state.teamAlias, initial: state.initialDesign!.placedItems, final: state.items, evaluation, reflection: state.reflection, eventId: state.eventId })}>PNG indir</button><button className="ghost" onClick={reset}>Yeni takım</button></div></section>}
    </main>
    {state.step > 0 && <footer><span>{state.teamAlias}</span><span>{challenge?.emoji} {challenge?.title}</span><span>Adım {state.step}/11</span></footer>}
  </div>;
}

function Designer(props: { redesign: boolean; challengeId: ChallengeId; state: SessionState; evaluation: ReturnType<typeof evaluateDesign>; selected: ComponentType; rotated: boolean; active?: string; notice: string; onSelect: (type: ComponentType) => void; onCell: (x: number, y: number) => void; onActive: (id: string) => void; onRotate: () => void; onRemove: () => void; onUndo: () => void; onNext: () => void }) {
  const challenge = getChallenge(props.challengeId)!;
  const selectedDefinition = COMPONENTS[props.active ? props.state.items.find((item) => item.id === props.active)?.type ?? props.selected : props.selected];
  return <><aside className="palette"><span className="eyebrow">{props.redesign ? "2040 UYARLAMASI" : "BİLEŞENLER"}</span><h2>{props.redesign ? getEvent(props.state.eventId)?.title : `${challenge.emoji} ${challenge.title}`}</h2><p className="tiny">Bileşeni seç, sonra yerleştirmek istediğin grid karesine dokun.</p><div className="paletteitems">{COMPONENT_LIST.map((component) => <button key={component.type} className={props.selected === component.type && !props.active ? "component selected" : "component"} onClick={() => props.onSelect(component.type)}><i style={{ background: component.color }}><span>{componentIcons[component.type]}</span></i><span><b>{component.label}</b><small>{component.landUse === "upgrade" ? "Bina iyileştirmesi" : `${component.width}×${component.height}`} • {component.cost} puan</small><small className="impact-icons">{[component.required ? "Temel ihtiyaç" : "", component.helps.map((id) => getChallenge(id)?.emoji).join(" ")].filter(Boolean).join(" • ") || "Temel ihtiyaç"}</small></span></button>)}</div></aside><section className="canvas"><div className="canvashead"><div><span className="eyebrow">{props.redesign ? "OLAY SONRASI" : "İLK TASARIM"}</span><h1>10×10 kampüs alanı</h1></div><div className="tools"><button onClick={props.onUndo}>↶ Geri al</button><button onClick={props.onRotate}>↻ Döndür</button><button disabled={!props.active} onClick={props.onRemove}>Sil</button></div></div><CampusGrid items={props.state.items} active={props.active} onCell={props.onCell} onActive={props.onActive}/><p className="notice">{props.notice || (props.active ? "Yeni konuma dokun veya Sil'i seç." : "Soldan bir bileşen seç ve gridde yerleştirmek istediğin kareye dokun.")}</p></section><aside className="metricsaside"><ImpactCard definition={selectedDefinition}/><ChallengeBalanceCard challengeId={props.challengeId} items={props.state.items} evaluation={props.evaluation} compact/><Metrics evaluation={props.evaluation}/>{props.evaluation.errors.length > 0 && <div className="errors compact">{props.evaluation.errors.map((error) => <p key={error}>{error}</p>)}</div>}<button className="primary" onClick={props.onNext}>{props.redesign ? "Karşılaştır ve AI ile incele →" : "Analiz et →"}</button></aside></>;
}

function ImpactCard({ definition }: { definition: typeof COMPONENTS[ComponentType] }) {
  const landLabel = { building: "Yapı alanı", open: "Açık alan bileşeni", infrastructure: "Zemin altyapısı", upgrade: "Arazi kullanmayan bina iyileştirmesi" }[definition.landUse];
  return <div className="impact-card"><span className="eyebrow">BU SEÇİM NEYİ DEĞİŞTİRİR?</span><b>{definition.label}</b><div className="land-use-tag">{landLabel}</div>{definition.required && <div className="required-tag">Temel ihtiyaç</div>}<div className="impact-good">+ {definition.helps.length ? definition.helps.map((id) => `${getChallenge(id)?.emoji} ${getChallenge(id)?.title}`).join(", ") : "Okulun temel ihtiyacını karşılar"}</div>{definition.effects.map((effect) => <div className="impact-effect" key={effect}>↗ {effect}</div>)}{definition.risks.map((risk) => <div className="impact-risk" key={risk}>− {risk}</div>)}<small>− {definition.cost} bütçe puanı</small></div>;
}

function ChallengeMissionBrief({ challengeId, evaluation }: { challengeId: ChallengeId; evaluation: ReturnType<typeof evaluateDesign> }) {
  const balance = evaluateChallengeBalance([], evaluation, challengeId);
  return <div className="energy-mission card"><span className="eyebrow">DENGE GÖREVİ</span><h2>{balance.title}</h2><div>{balance.criteria.map((item) => <p key={item.id}><b>{item.kind === "main" ? "◆ Ana hedef" : item.kind === "budget" ? "◈ Bütçe koşulu" : "○ Koruma koşulu"}</b><span>{item.label}: {item.direction === "atLeast" ? "en az" : "en fazla"} {item.target} {item.unit}</span></p>)}</div><small>{balance.question} Tek bir doğru çözüm yok.</small></div>;
}

function ChallengeBalanceCard({ challengeId, items, evaluation, compact = false }: { challengeId: ChallengeId; items: PlacedItem[]; evaluation: ReturnType<typeof evaluateDesign>; compact?: boolean }) {
  const balance = evaluateChallengeBalance(items, evaluation, challengeId);
  const energy = evaluation.energyBalance;
  const status = { balanced: "Tüm denge koşulları sağlandı", side_effects: "Ana hedef tamam; diğer koşullar eksik", not_yet: "Ana hedef henüz tamamlanmadı" }[balance.status];
  const main = balance.criteria.find((item) => item.kind === "main")!;
  return <div className={`energy-balance challenge-balance card ${compact ? "compact" : ""}`}><div className="energy-balance-head"><div><span className="eyebrow">DENGE KONTROLÜ</span><b>{status}</b></div><strong>{main.value}<small>{main.unit === "%" ? "%" : ""}</small></strong></div>{challengeId === "energy" && <><div className="energy-equation"><span><b>{energy.renewableProduction}</b> üretilen</span><i>÷</i><span><b>{energy.netDemand}</b> net ihtiyaç</span></div><div className="energy-details"><span>İlk ihtiyaç <b>{energy.grossDemand}</b></span><span>Tasarruf <b>−{energy.savings}</b></span><span>Şebekeden gereken <b>{energy.gridEnergyNeeded}</b></span></div>{energy.reducedEfficiencyPanels > 0 && <p className="diminishing-note">! {energy.reducedEfficiencyPanels} panel daha düşük verimde çalışıyor. Başka bir yol deneyebilir misin?</p>}</>}<div className="balance-criteria">{balance.criteria.map((item) => <div className={item.met ? "met" : ""} key={item.id}><span>{item.kind === "main" ? "◆" : item.kind === "budget" ? "◈" : "○"} {item.label}</span><progress max="1" value={item.progress}/><b>{item.value}{item.unit === "%" ? "%" : ""} / {item.direction === "atLeast" ? "≥" : "≤"}{item.target}</b></div>)}</div><p className="balance-question">{balance.question}</p>{!compact && <small className="simulation-note">Bu değerler gerçek mühendislik ölçümü değil; tasarım kararlarını karşılaştırmak için kullanılan eğitsel oyun göstergeleridir.</small>}</div>;
}

function MathLab(props: { grade: GradeBand; challengeId: ChallengeId; items: PlacedItem[]; ratio: ReturnType<typeof getChallengeRatio>; numerator: string; denominator: string; result?: MathResult; mode: "idle" | "loading" | "ai" | "error"; onNumerator: (value: string) => void; onDenominator: (value: string) => void; onCalculate: () => void; onBack: () => void; onNext: () => void }) {
  const isEnergy = props.challengeId === "energy";
  return <section className="math-lab"><Heading k="ORAN LABORATUVARI" title="Tasarımındaki oranı adım adım hesapla."/><CalculationQuestion items={props.items} challengeId={props.challengeId} ratio={props.ratio}/><p className="math-intro">{isEnergy ? "Enerji kartlarındaki sayıları kullan. Üretimi ve tasarruf sonrası ihtiyacı sen hesapla." : "Alan kartlarındaki kare sayılarını kullan. Toplama işlemlerini sen yap."}</p><RatioDesignGuide items={props.items} challengeId={props.challengeId}/><div className="math-layout"><div className="card fraction-card"><h3>Cevabını kesre yaz</h3><label><span>Pay</span><input aria-label={`Pay: ${props.ratio.numeratorLabel}`} type="number" min="0" inputMode="numeric" value={props.numerator} onChange={(event) => props.onNumerator(event.target.value)} placeholder="?"/><small>{props.ratio.numeratorLabel}</small></label><div className="fraction-line"/><label><span>Payda</span><input aria-label={`Payda: ${props.ratio.denominatorLabel}`} type="number" min="1" inputMode="numeric" value={props.denominator} onChange={(event) => props.onDenominator(event.target.value)} placeholder="?"/><small>{props.ratio.denominatorLabel}</small></label><button className="primary" disabled={props.mode === "loading" || !props.numerator || !props.denominator} onClick={props.onCalculate}>{props.mode === "loading" ? "AI hesaplıyor…" : "AI ile oranı hesapla"}</button></div><div className="card math-result">{!props.result && <div className="empty-result"><span>➗</span><b>Sonucun burada görünecek.</b><p>Payı paydaya böleceğiz; kesri sadeleştirip ondalık sayı ve yüzde olarak göstereceğiz.</p></div>}{props.result && <>{props.result.matchesDesign ? <><PieChart percentage={props.result.percentage} energy={isEnergy}/><div className="calculation"><b>{props.result.simplifiedNumerator}/{props.result.simplifiedDenominator}</b><span>= {props.result.decimal}</span><strong>= %{props.result.percentage}</strong></div><p>{props.result.explanation}</p></> : <div className="math-hint"><span>🔎</span><h3>{isEnergy ? "Enerji kartlarını bir kez daha hesapla." : "Alan kartlarındaki kareleri bir kez daha topla."}</h3><p>{props.result.hint}</p><small>Girdiğin {props.numerator}/{props.denominator} oranı %{props.result.percentage} eder; ancak tasarımındaki değerlerle eşleşmiyor.</small></div>}</>}</div></div>{props.mode === "error" && <div className="errors"><p>AI matematik yardımcısına ulaşılamadı veya sayılar geçersiz. Tekrar deneyebilirsin.</p></div>}<div className="actions"><button className="secondary" onClick={props.onBack}>← Analize dön</button><button className="primary" disabled={!props.result?.matchesDesign} onClick={props.onNext}>AI jüriye geç →</button></div><p className="hint">{props.grade}. sınıf düzeyi için açıklama sadeleştiriliyor. Hesap ayrıca oyun motoru tarafından kontrol edilir.</p></section>;
}

function CalculationQuestion({ items, challengeId, ratio }: { items: PlacedItem[]; challengeId: ChallengeId; ratio: ReturnType<typeof getChallengeRatio> }) {
  const challenge = getChallenge(challengeId)!;
  const isEnergy = challengeId === "energy";
  const summaries = COMPONENT_LIST.map((definition) => {
    const matching = items.filter((item) => item.type === definition.type);
    return { definition, cells: matching.reduce((sum, item) => sum + footprintCells(item), 0) };
  }).filter((item) => item.cells > 0);
  const supportParts = summaries.filter((item) => challenge.supportTypes.includes(item.definition.type)).map((item) => `${item.definition.shortLabel}: ${item.cells} kare`);
  const allParts = summaries.map((item) => `${item.definition.shortLabel}: ${item.cells} kare`);

  return <div className="card calculation-question"><div><span className="eyebrow">HESAPLAYACAĞIN ORAN</span><h2>{challenge.emoji} {isEnergy ? "Temiz enerjinin okul ihtiyacını karşılama oranı" : `${challenge.title} sorununu destekleyen alan oranı`}</h2></div><div className="target-fraction"><span><b>PAY</b>{ratio.numeratorLabel}</span><i/><span><b>PAYDA</b>{ratio.denominatorLabel}</span></div><ol>{isEnergy ? <><li><b>Payı bul:</b> Güneş paneli kartındaki <strong>ÜRETİM</strong> değerini hesapla.</li><li><b>Paydayı bul:</b> <strong>İHTİYAÇ</strong> değerlerini topla, <strong>TASARRUF</strong> değerlerini çıkar.</li><li>Bulduğun iki tam sayıyı aşağıdaki kesre yaz.</li></> : <><li><b>Payı bul:</b> Yalnızca <strong>PAY + PAYDA</strong> yazan kartlardaki kareleri topla.</li><li><b>Paydayı bul:</b> Bütün alan kartlarındaki kareleri topla.</li><li>Bulduğun iki tam sayıyı aşağıdaki kesre yaz.</li></>}</ol>{!isEnergy && <div className="worksheet"><div><span>PAY İÇİN KULLAN</span><b>{supportParts.length ? supportParts.join(" + ") : "Destekleyen alan yok: 0 kare"} = ?</b></div><div><span>PAYDA İÇİN KULLAN</span><b>{allParts.join(" + ")} = ?</b></div></div>}</div>;
}

function RatioDesignGuide({ items, challengeId }: { items: PlacedItem[]; challengeId: ChallengeId }) {
  const challenge = getChallenge(challengeId)!;
  const isEnergy = challengeId === "energy";
  const summaries = COMPONENT_LIST.map((definition) => {
    const matching = items.filter((item) => item.type === definition.type);
    const cells = matching.reduce((total, item) => total + footprintCells(item), 0);
    return { definition, count: matching.length, cells, supports: challenge.supportTypes.includes(definition.type) };
  }).filter((summary) => summary.count > 0);

  return <div className="card ratio-design-guide"><div className="ratio-design-head"><div><span className="eyebrow">KİLİTLİ TASARIMIN</span><h2>{challenge.emoji} {challenge.title}</h2><p>{isEnergy ? "Enerji isteyen yapıları ve enerji çözümü olarak eklediklerini birlikte incele." : "Renkli çerçeveli alanlar seçtiğin sorunu destekler. Soluk alanlar paydaya girer ama paya girmez."}</p></div><div className="ratio-legend"><span><i className="supports"/>{isEnergy ? "Enerji çözümü" : "Paya ve paydaya ekle"}</span><span><i/>{isEnergy ? "Enerji isteyen / diğer" : "Yalnız paydaya ekle"}</span></div></div><div className="ratio-design-body"><div className="grid ratio-grid" role="img" aria-label="Oran hesabı için kilitli kampüs tasarımı">{Array.from({ length: 100 }, (_, index) => <i className="cell" style={{ gridColumn: index % 10 + 1, gridRow: Math.floor(index / 10) + 1 }} key={index}/>)}{items.map((item) => { const supports = challenge.supportTypes.includes(item.type); const landCells = footprintCells(item); return <span key={item.id} className={`placed ratio-piece ${supports ? "supports" : "other"}`} style={{ gridColumn: `${item.x + 1}/span ${item.width}`, gridRow: `${item.y + 1}/span ${item.height}`, background: COMPONENTS[item.type].color }} title={`${COMPONENTS[item.type].label}: ${landCells ? `${landCells} kare` : "arazi alanı kullanmaz"}`}><span>{componentIcons[item.type]}</span><b>{isEnergy ? "⚡" : landCells || "↗"}</b></span>; })}</div>{isEnergy ? <EnergyMathGuide items={items}/> : <div className="area-cards"><b>Alan kartların</b><small>1 kare = 100 m²</small>{summaries.map(({ definition, count, cells, supports }) => { const isUpgrade = definition.landUse === "upgrade"; return <div className={supports && !isUpgrade ? "supports" : ""} key={definition.type}><i style={{ background: definition.color }}>{componentIcons[definition.type]}</i><span><b>{definition.label}</b><small>{isUpgrade ? `${count} adet • bina iyileştirmesi • arazi kullanmaz` : `${count} adet • ${cells} kare • ${(cells * 100).toLocaleString("tr-TR")} m²`}</small></span><em>{isUpgrade ? "ALAN HESABINA GİRMEZ" : supports ? "PAY + PAYDA" : "PAYDA"}</em></div>; })}</div>}</div><p className="ratio-task"><b>Görevin:</b> {isEnergy ? "Pay için güneş panellerinin üretimini bul. Payda için ilk enerji ihtiyacından tasarrufu çıkar." : "Pay için renkli çerçeveli alanların karelerini; payda için bütün alan kartlarındaki kareleri topla. Bina iyileştirmelerini alan hesabına katma."}</p></div>;
}

function EnergyMathGuide({ items }: { items: PlacedItem[] }) {
  const amount = (type: ComponentType) => items.filter((item) => item.type === type).length;
  const solar = amount("solar");
  const insulation = amount("insulation");
  const daylight = amount("daylight");
  const shade = amount("shade");
  const diminishing = (count: number, values: number[]) => Array.from({ length: count }, (_, index) => values[Math.min(index, values.length - 1)]).reduce((sum, value) => sum + value, 0);
  const rows = [
    { label: "Eğitim binası", count: amount("education"), calculation: `${amount("education")} × 12`, value: amount("education") * 12, kind: "İHTİYAÇ", role: "add" },
    { label: "Spor salonu", count: amount("sports"), calculation: `${amount("sports")} × 8`, value: amount("sports") * 8, kind: "İHTİYAÇ", role: "add" },
    { label: "Geri dönüşüm", count: amount("recycling"), calculation: `${amount("recycling")} × 2`, value: amount("recycling") * 2, kind: "İHTİYAÇ", role: "add" },
    { label: "Yalıtım", count: insulation, calculation: "4, sonra 3, sonra 1", value: diminishing(insulation, [4, 3, 1]), kind: "TASARRUF", role: "subtract" },
    { label: "Doğal aydınlatma", count: daylight, calculation: "3, sonra 2, sonra 1", value: diminishing(daylight, [3, 2, 1]), kind: "TASARRUF", role: "subtract" },
    { label: "Gölgelik", count: shade, calculation: "En fazla 2", value: Math.min(2, shade), kind: "TASARRUF", role: "subtract" },
    { label: "Güneş paneli", count: solar, calculation: solar <= 3 ? `${solar} × 5` : `3 × 5 + ${solar - 3} × 2`, value: Math.min(3, solar) * 5 + Math.max(0, solar - 3) * 2, kind: "ÜRETİM", role: "numerator" },
  ].filter((row) => row.count > 0);
  const production = rows.filter((row) => row.role === "numerator");
  const demand = rows.filter((row) => row.role === "add");
  const saving = rows.filter((row) => row.role === "subtract");
  const tags = { numerator: "PAYA YAZ", add: "+ PAYDAYA EKLE", subtract: "− PAYDADAN ÇIKAR" };
  const sum = (list: typeof rows, group = false) => list.length > 1 && group ? `(${list.map((row) => row.value).join(" + ")})` : list.map((row) => row.value).join(" + ") || "0";
  const card = (row: (typeof rows)[number]) => <div className={`energy-card ${row.role}`} key={row.label}><span><b>{row.label}</b><small>{row.count} adet • {row.calculation} = {row.value} birim</small></span><em><small>{row.kind}</small>{tags[row.role as keyof typeof tags]}</em></div>;
  return <div className="energy-math-cards"><b>Enerji kartların</b><small>Her kartın sağında sayının paya mı, paydaya mı yazılacağı var. Sonucu kendin bul.</small><section className="energy-part numerator"><header><strong>PAY</strong><span>Kesrin üstü • temiz enerji üretimi</span></header>{production.length ? production.map(card) : <p>Güneş paneli yok; bu yüzden pay 0 olur.</p>}<p className="energy-formula">Pay = {sum(production)}</p></section><section className="energy-part denominator"><header><strong>PAYDA</strong><span>Kesrin altı • ihtiyaç − tasarruf</span></header>{demand.map(card)}{saving.map(card)}<p className="energy-formula">Payda = {saving.length ? `${sum(demand, true)} − ${sum(saving, true)}` : sum(demand)} = ?</p><p>Net enerji ihtiyacı en az 5 birimdir. Çıkarma sonucun 5’ten küçükse paydaya 5 yaz.</p></section>{amount("battery") > 0 && <div className="energy-card neutral"><span><b>Depolama</b><small>{amount("battery")} adet • normal koşulda üretim eklemez; enerji kısıtı olayında yardımcı olur.</small></span><em><small>DEPOLAMA</small>HESABA GİRMEZ</em></div>}</div>;
}

function PieChart({ percentage, energy = false }: { percentage: number; energy?: boolean }) {
  const safe = Math.max(0, Math.min(100, percentage));
  return <div className="pie-wrap"><div className="pie" role="img" aria-label={`${energy ? "Karşılanan enerji" : "Destekleyen alan"} yüzde ${safe}`} style={{ background: `conic-gradient(var(--teal) 0 ${safe}%, #dfe8e6 ${safe}% 100%)` }}><span>%{percentage}</span></div><div className="pie-legend"><span><i className="legend-support"/>{energy ? "Karşılanan enerji" : "Sorunu destekleyen"}</span><span><i/>{energy ? "Karşılanmayan ihtiyaç" : "Diğer kullanılan alan"}</span></div></div>;
}

function DesignFindingsCard({ findings }: { findings: DesignFinding[] }) {
  return <div className="design-findings"><h3>Tasarımda gördüklerimiz</h3>{findings.map((finding) => <div className={finding.tone} key={finding.id}><span>{finding.tone === "strength" ? "✓" : "!"}</span><p><b>{finding.title}</b><small>{finding.detail}</small></p></div>)}</div>;
}

function AssessmentCard({ assessment }: { assessment: AiAssessment }) {
  const resolution = { solved: "Çözdü", partly_solved: "Kısmen çözdü", not_yet: "Henüz çözmedi" }[assessment.problemResolution];
  const confidence = { low: "Düşük", medium: "Orta", high: "Yüksek" }[assessment.confidence];
  return <div className="assessment"><div className={`resolution ${assessment.problemResolution}`}><span>SORUN DURUMU</span><b>{resolution}</b><small>AI güveni: {confidence}</small></div><div className="assessment-copy"><p>{assessment.summary}</p><div className="evidence-list"><b>Sayısal kanıtlar</b>{assessment.evidence.map((item) => <span key={item}>◆ {item}</span>)}</div></div><div className="rubric"><Rubric label="Amaca uygunluk" value={assessment.rubric.goalFit} max={20}/><Rubric label="Seçimlerin iki yönü" value={assessment.rubric.tradeoffAwareness} max={15}/><Rubric label="Sayı kullanımı" value={assessment.rubric.evidenceUse} max={10}/><Rubric label="Tutarlılık" value={assessment.rubric.coherence} max={5}/></div><div className="assessment-notes"><div><b>✓ Güçlü yan</b>{assessment.strengths.map((item) => <p key={item}>{item}</p>)}</div><div><b>! Düşünülmesi gereken</b>{assessment.risks.map((item) => <p key={item}>{item}</p>)}</div></div></div>;
}

function Rubric({ label, value, max }: { label: string; value: number; max: number }) { return <div><span>{label}</span><progress max={max} value={value}/><b>{value}/{max}</b></div>; }
function ScoreSummary({ technical, ai }: { technical: number; ai: number }) { return <div className="score-summary"><div><span>Teknik + matematik</span><b>{technical}<small>/50</small></b></div><div><span>AI jüri</span><b>{ai}<small>/50</small></b></div><div className="grand-total"><span>Toplam</span><b>{technical + ai}<small>/100</small></b></div></div>; }
function technicalScore(evaluation: ReturnType<typeof evaluateDesign>, items: PlacedItem[], mathCorrect: boolean, challengeId?: ChallengeId) {
  if (!challengeId) return (evaluation.isValid ? 15 : 0) + Math.round(evaluation.scores.total * .15) + (mathCorrect ? 20 : 0);
  const balance = evaluateChallengeBalance(items, evaluation, challengeId);
  const balancePoints = Math.round(balance.criteria.reduce((sum, item) => sum + item.progress, 0) / balance.criteria.length * 10);
  return (evaluation.isValid ? 10 : 0) + Math.round(evaluation.scores.total * .1) + balancePoints + (mathCorrect ? 20 : 0);
}
function CampusGrid({ items, active, onCell, onActive }: { items: PlacedItem[]; active?: string; onCell: (x: number, y: number) => void; onActive: (id: string) => void }) { return <div className="grid" role="grid" aria-label="10 çarpı 10 kampüs gridi">{Array.from({ length: 100 }, (_, index) => <button key={index} className="cell" style={{ gridColumn: index % 10 + 1, gridRow: Math.floor(index / 10) + 1 }} onClick={() => onCell(index % 10, Math.floor(index / 10))} aria-label={`Hücre ${index % 10 + 1},${Math.floor(index / 10) + 1}`}/>)}{items.map((item) => { const definition = COMPONENTS[item.type]; const landCells = footprintCells(item); return <button key={item.id} className={`placed ${active === item.id ? "active" : ""}`} style={{ gridColumn: `${item.x + 1}/span ${item.width}`, gridRow: `${item.y + 1}/span ${item.height}`, background: definition.color }} onClick={() => onActive(item.id)}><span className="placedicon">{componentIcons[item.type]}</span><b>{definition.shortLabel}</b><small>{landCells ? `${landCells * 100} m²` : "Bina iyileştirmesi"}</small></button>; })}</div>; }
function Metrics({ evaluation: current }: { evaluation: ReturnType<typeof evaluateDesign> }) { return <div className="metrics"><div className="total"><span>Sürdürülebilirlik göstergesi</span><b>{current.scores.total}</b><small>/100</small></div><div className="budget"><span>Bütçe</span><b>{current.budgetUsed}/100</b><progress max="100" value={current.budgetUsed}/></div><div className="area"><span>Arazi kullanımı</span><b>{current.areas.usedM2.toLocaleString("tr-TR")} m² • %{current.areas.usedPercent}</b><small>Açık %{current.areas.openPercent} • Yapı %{current.areas.builtPercent} • Altyapı %{current.areas.infrastructurePercent}</small></div>{(Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>).map((key) => <div className="score" key={key}><span>{scoreLabels[key]}</span><progress max="100" value={current.scores[key]}/><b>{current.scores[key]}</b></div>)}</div>; }
function MiniPlan({ title, items, evaluation, previousScore }: { title: string; items: PlacedItem[]; evaluation: ReturnType<typeof evaluateDesign>; previousScore?: number }) {
  const difference = previousScore === undefined ? undefined : evaluation.scores.total - previousScore;
  return <div className="miniplan"><h3>{title}</h3><div className="grid mini">{Array.from({ length: 100 }, (_, index) => <i className="cell" style={{ gridColumn: index % 10 + 1, gridRow: Math.floor(index / 10) + 1 }} key={index}/>)}{items.map((item) => <span key={item.id} className="placed" style={{ gridColumn: `${item.x + 1}/span ${item.width}`, gridRow: `${item.y + 1}/span ${item.height}`, background: COMPONENTS[item.type].color }} title={COMPONENTS[item.type].label}/>)}</div><div className="plan-score"><span>Sürdürülebilirlik puanı</span><b>{evaluation.scores.total}<small>/100</small></b>{difference !== undefined && <em className={difference >= 0 ? "up" : "down"}>{difference >= 0 ? "+" : ""}{difference} puan</em>}</div></div>;
}
function Delta({ before, after }: { before: ReturnType<typeof evaluateDesign>["scores"]; after: ReturnType<typeof evaluateDesign>["scores"] }) { return <div className="delta-section"><h3>Gösterge puanlarının karşılaştırması</h3><div className="deltas">{(Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>).map((key) => <div key={key}><span>{scoreLabels[key]}</span><b>{before[key]} → {after[key]}</b><em className={after[key] >= before[key] ? "up" : "down"}>{after[key] - before[key] >= 0 ? "+" : ""}{after[key] - before[key]}</em></div>)}</div></div>; }

function ComparisonImpact({ before, after }: { before: ReturnType<typeof evaluateDesign>; after: ReturnType<typeof evaluateDesign> }) {
  const improved: string[] = [];
  const weakened: string[] = [];
  const compare = (label: string, previous: number, current: number, unit = "puan") => {
    const difference = current - previous;
    if (difference > 0) improved.push(`${label} +${difference} ${unit}`);
    if (difference < 0) weakened.push(`${label} ${difference} ${unit}`);
  };
  (Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>).forEach((key) => compare(scoreLabels[key], before.scores[key], after.scores[key]));
  compare("Yeşil alan", before.areas.greenPercent, after.areas.greenPercent, "yüzde puan");
  compare("Açık alan", before.areas.openPercent, after.areas.openPercent, "yüzde puan");
  compare("Enerji karşılama", before.energyBalance.coveragePercent, after.energyBalance.coveragePercent, "yüzde puan");
  const budgetDifference = after.budgetUsed - before.budgetUsed;
  if (budgetDifference < 0) improved.push(`Bütçe kullanımı ${Math.abs(budgetDifference)} puan azaldı`);
  if (budgetDifference > 0) weakened.push(`Bütçe kullanımı ${budgetDifference} puan arttı`);

  return <div className="comparison-impact"><div className="impact-improved"><h3>✓ İyi yönde değişenler</h3>{improved.length ? improved.map((item) => <p key={item}>{item}</p>) : <p>Belirgin bir artış yok.</p>}</div><div className="impact-weakened"><h3>! Zayıflayanlar veya bedeli</h3>{weakened.length ? weakened.map((item) => <p key={item}>{item}</p>) : <p>Hiçbir gösterge düşmedi.</p>}</div></div>;
}
function EventScreen({ id, onNext }: { id: EventId; onNext: () => void }) { const event = getEvent(id)!; return <section className="event"><span className="eventicon">{event.icon}</span><span className="eyebrow">2040 OLAY KARTI</span><h1>{event.title}</h1><p>{event.description}</p><div className="card prompt">İlk tasarımını bu yeni koşula göre yeniden düşün. Her şeyi değiştirmek zorunda değilsin; kararını sayıyla açıkla.</div><button className="primary" onClick={onNext}>Koşulu kabul et →</button></section>; }
function Heading({ k, title }: { k: string; title: string }) { return <div className="heading"><span className="eyebrow">{k}</span><h1>{title}</h1></div>; }
function Fact({ n, unit, text }: { n: string; unit: string; text: string }) { return <div><b>{n}</b><em>{unit}</em><span>{text}</span></div>; }
