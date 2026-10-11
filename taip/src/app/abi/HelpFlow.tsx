"use client";

import { useState, useTransition } from "react";
import type { Locale } from "@config/taip.config";
import { HEALTH_SPECIAL_NEEDS } from "@config/taip.config";
import type { AgentTurn, StructuredNeed } from "@/agent/agent";
import { formatEur, t } from "@/i18n/messages";
import { agentStep, chooseMatch, confirmNeed } from "../actions";

type Match = Awaited<ReturnType<typeof confirmNeed>>["matches"][number];

type Phase =
  | { kind: "chat" }
  | { kind: "summary"; need: StructuredNeed }
  | { kind: "emergency" }
  | { kind: "matches"; needId: string; matches: Match[] }
  | { kind: "done"; via: string };

export default function HelpFlow({ locale, crisisActive, maxQuestions }: { locale: Locale; crisisActive: boolean; maxQuestions: number }) {
  const m = t(locale);
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "chat" });
  const [consent, setConsent] = useState(false);
  const [healthNotes, setHealthNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const step = turns.filter((x) => x.role === "user").length;

  function send() {
    const text = input.trim();
    if (!text) return;
    const next: AgentTurn[] = [...turns, { role: "user", text }];
    setTurns(next);
    setInput("");
    setError(null);
    start(async () => {
      try {
        const r = await agentStep(next, locale);
        if (r.kind === "emergency") setPhase({ kind: "emergency" });
        else if (r.kind === "question") setTurns([...next, { role: "assistant", text: r.text, questionKind: r.questionKind }]);
        else setPhase({ kind: "summary", need: r.need });
      } catch {
        setError("Ühendus katkes. Proovi uuesti.");
      }
    });
  }

  function confirm(need: StructuredNeed) {
    start(async () => {
      try {
        const r = await confirmNeed({ ...need, healthConsent: consent, healthNotes: consent ? healthNotes : undefined });
        if (r.status === "emergency") setPhase({ kind: "emergency" });
        else setPhase({ kind: "matches", needId: r.needId, matches: r.matches });
      } catch {
        setError("Salvestamine ebaõnnestus. Proovi uuesti.");
      }
    });
  }

  function choose(needId: string, offerId: string) {
    start(async () => {
      const r = await chooseMatch(needId, offerId);
      if (r.ok) setPhase({ kind: "done", via: r.via });
      else setError(r.error);
    });
  }

  if (phase.kind === "emergency") {
    return (
      <div className="emergency" role="alert" aria-live="assertive">
        <h1>{m.emergencyTitle}</h1>
        <p>{m.emergencyText}</p>
        <a className="btn" href="tel:112">📞 112</a>
      </div>
    );
  }

  return (
    <>
      {crisisActive && <div className="banner crisis">⚠ {m.crisisBanner}</div>}
      <h1>{m.needHelp}</h1>
      {error && <p className="error" role="alert">{error}</p>}

      {phase.kind === "chat" && (
        <>
          <p className="muted">{m.stepOf(Math.min(step + 1, maxQuestions + 1), maxQuestions + 1)}</p>
          <div aria-live="polite">
            {turns.map((x, i) => (
              <div key={i} className={`bubble ${x.role === "user" ? "me" : ""}`}>{x.text}</div>
            ))}
            {pending && <div className="bubble">{m.thinking}</div>}
          </div>
          <label htmlFor="say">{turns.length === 0 ? m.describe : " "}</label>
          <textarea
            id="say" value={input} onChange={(e) => setInput(e.target.value)} placeholder={turns.length === 0 ? m.describePlaceholder : ""}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={pending} autoFocus
          />
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn big help" onClick={send} disabled={pending || !input.trim()}>{m.send}</button>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            {m.call112}: <a href="tel:112">112</a>
          </p>
        </>
      )}

      {phase.kind === "summary" && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{m.summaryTitle}</h2>
          <p style={{ fontSize: "1.15rem" }}>{phase.need.summary}</p>
          <p>
            {phase.need.categories.map((c) => <span key={c} className="chip">{m.categories[c]}</span>)}
            <span className={`chip ${phase.need.urgency}`}>{m.urgency[phase.need.urgency]}</span>
            <span className="chip">{phase.need.householdSize} {m.people}</span>
            {phase.need.specialNeeds.map((s) => <span key={s} className="chip">{m.specialNeeds[s]}</span>)}
          </p>
          {phase.need.specialNeeds.some((s) => HEALTH_SPECIAL_NEEDS.includes(s)) || phase.need.categories.includes("medical") ? (
            <div className="card" style={{ background: "var(--surface-2)" }}>
              <label className="check">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>{m.healthConsentLabel}</span>
              </label>
              {consent && (
                <>
                  <label htmlFor="hn">{m.healthNotesLabel}</label>
                  <input id="hn" value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} maxLength={500} />
                </>
              )}
            </div>
          ) : null}
          <div className="row">
            <button className="btn big" onClick={() => confirm(phase.need)} disabled={pending}>✓ {m.confirm}</button>
            <button className="btn secondary" onClick={() => { setPhase({ kind: "chat" }); setTurns([]); }} disabled={pending}>{m.startOver}</button>
          </div>
        </div>
      )}

      {phase.kind === "matches" && (
        <>
          <h2>{m.matchesTitle}</h2>
          {phase.matches.length === 0 && <p>Sobivat vastet ei leitud – päring on salvestatud ja Punane Rist näeb seda.</p>}
          {phase.matches.map((x) => (
            <div key={x.offerId} className="card">
              <div className="spread">
                <h3>{x.rank}. {x.title}</h3>
                <strong>{x.totalCents === 0 ? m.free : formatEur(x.totalCents, locale)}</strong>
              </div>
              <p className="muted">{x.partner} · {m.categories[x.category]}</p>
              <p>{x.description}</p>
              {x.totalCents > 0 && (
                <p>
                  {m.paidBy}: {x.payment.map((p) => `${m.sources[p.source]} ${formatEur(p.amountCents, locale)}`).join(" + ")}
                </p>
              )}
              <button className="btn" onClick={() => choose(phase.needId, x.offerId)} disabled={pending}>{m.choose}</button>
            </div>
          ))}
        </>
      )}

      {phase.kind === "done" && (
        <div className="card">
          <p className="ok" style={{ fontSize: "1.2rem" }}>✓ {m.done}</p>
          <p className="muted">{phase.via}</p>
          <a className="btn secondary" href="/">←</a>
        </div>
      )}
    </>
  );
}
