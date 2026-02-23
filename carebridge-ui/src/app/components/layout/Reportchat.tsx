"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import API from "../../lib/api";

interface Message {
  role:    "user" | "assistant";
  content: string;
  sources?: string[];
  ts:      number;
}

interface ReportChatProps {
  reportData: Record<string, unknown>;
  context:    "prepurchase" | "audit";
}

const STARTER_QUESTIONS = {
  prepurchase: [
    "What are the biggest risks in this policy?",
    "What does the waiting period mean for me?",
    "How does the compliance score affect my decision?",
    "Should I buy this policy based on this analysis?",
    "Which clauses should I negotiate before buying?",
    "What does 'Not Found' mean for the missing clauses?",
  ],
  audit: [
    "How strong is my appeal case?",
    "What documents do I need for resubmission?",
    "When should I approach the Ombudsman?",
    "What are my next steps?",
    "Can the insurer's decision be overturned?",
    "What is the moratorium rule and does it apply to me?",
  ],
};

// ── Pure client-side fallback (used when API fails or returns empty) ──────────
function buildLocalAnswer(question: string, report: Record<string, unknown>, context: string): string {
  const q = question.toLowerCase();

  if (context === "prepurchase") {
    const score    = (report.score_breakdown as Record<string,unknown>)?.adjusted_score as number ?? 0;
    const rating   = (report.overall_policy_rating as string) ?? "Unknown";
    const risk     = (report.clause_risk as Record<string,string>) ?? {};
    const highKeys = Object.entries(risk).filter(([,v]) => v === "High Risk").map(([k]) => k.replace(/_/g," "));
    const modKeys  = Object.entries(risk).filter(([,v]) => v === "Moderate Risk").map(([k]) => k.replace(/_/g," "));
    const comply   = (report.irdai_compliance as Record<string,unknown>)?.compliance_rating as string ?? "Unknown";
    const broker   = (report.broker_risk_analysis as Record<string,unknown>)?.structural_risk_level as string ?? "Unknown";
    const checklist = (report.checklist_for_buyer as string[]) ?? [];

    if (q.includes("risk") || q.includes("biggest") || q.includes("danger") || q.includes("concern")) {
      if (highKeys.length === 0) return `No clauses rated High Risk were detected. Moderate risks include: ${modKeys.slice(0,3).join(", ") || "none identified"}. The overall policy score is ${Math.round(score)}/100 (${rating}).`;
      return `The highest-risk clauses are: ${highKeys.join(", ")}. These directly reduce your effective coverage. Moderate risks: ${modKeys.slice(0,2).join(", ") || "none"}. Overall policy score: ${Math.round(score)}/100.`;
    }

    if (q.includes("waiting") || q.includes("wait")) {
      const wv = risk.waiting_period ?? "Not Found";
      if (wv === "High Risk") return "This policy has a long waiting period (3+ years) rated High Risk. You cannot claim for pre-existing conditions or specified illnesses during this period. If you need coverage soon, this is a significant limitation.";
      if (wv === "Moderate Risk") return "The waiting period is Moderate Risk (1–3 years). Coverage for pre-existing conditions will only activate after this period. Confirm the exact duration in the policy schedule before signing.";
      if (wv === "Low Risk") return "The waiting period appears short (under 1 year) — a positive indicator. Still confirm the exact clause in the policy document.";
      return "The waiting period clause could not be detected from the text you provided. Ask the insurer directly: how many months until pre-existing conditions are covered?";
    }

    if (q.includes("compliance") || q.includes("irdai") || q.includes("regulatory")) {
      return `IRDAI compliance is rated ${comply}. This reflects how well the policy follows mandated consumer protections: free-look period, grievance redressal access, ombudsman reference, and claim settlement timelines. ${comply === "High Compliance" ? "This policy meets most regulatory standards — a positive signal." : comply === "Low Compliance" ? "Low compliance is a red flag — the policy may lack key consumer protections." : "Moderate compliance — verify the free-look period and grievance process before purchase."}`;
    }

    if (q.includes("should i buy") || q.includes("recommend") || q.includes("decision")) {
      const rec = score >= 80 ? "This policy scores well and appears consumer-friendly. Standard due diligence — verify highlighted clauses — and it looks suitable." : score >= 55 ? "Moderate score. The policy has some risk areas. Negotiate or get written clarification on the flagged High Risk clauses before signing." : "Low score. The policy has systemic risks. Consider comparing alternatives or requesting clause amendments before committing.";
      return `Policy Score: ${Math.round(score)}/100 (${rating}). Structural Risk: ${broker}. ${rec}`;
    }

    if (q.includes("negotiate") || q.includes("before buying") || q.includes("which clause")) {
      const ask = highKeys.slice(0,3);
      if (ask.length === 0) return "No High Risk clauses were detected. Still ask the insurer to clarify the exclusions list and confirm there are no sub-limits on your specific conditions.";
      return `Before buying, ask for written clarification on: ${ask.join(", ")}. These are your highest-risk points. Also request the insurer's claim settlement ratio and the exact waiting period duration in months.`;
    }

    if (q.includes("not found") || q.includes("missing")) {
      const missing = Object.entries(risk).filter(([,v]) => v === "Not Found").map(([k]) => k.replace(/_/g," "));
      if (missing.length === 0) return "All clauses were detected in the policy text. No missing data.";
      return `The following clauses were not detectable from the uploaded text: ${missing.join(", ")}. This could mean they are genuinely absent from the policy, or the text provided was a summary rather than the full policy. Ask the insurer directly about each of these.`;
    }

    if (q.includes("checklist") || q.includes("what to ask") || q.includes("what should i ask")) {
      if (checklist.length) return `Key questions before purchase: ${checklist.slice(0,4).join(" · ")}`;
      return "Key questions: (1) What is the exact waiting period in months? (2) Are pre-existing conditions covered and when? (3) Is there a room rent sublimit? (4) What percentage co-payment applies? (5) Can the sum insured be restored after exhaustion?";
    }

    return `Policy Score: ${Math.round(score)}/100 (${rating}). IRDAI Compliance: ${comply}. Structural Risk: ${broker}. High Risk clauses: ${highKeys.join(", ") || "none detected"}. ${checklist[0] ?? "Review the flagged clauses before purchase."}`;
  }

  // ── AUDIT context ─────────────────────────────────────────
  const appeal    = (report.appeal_strength as Record<string,unknown>) ?? {};
  const pct       = appeal.percentage as number ?? 0;
  const lbl       = appeal.label as string ?? "Unknown";
  const rsn       = appeal.reasoning as string ?? "";
  const why       = report.why_rejected as string ?? "not specified";
  const clause    = report.policy_clause_detected as string ?? "not identified";
  const alignment = report.clause_alignment as string ?? "Unknown";
  const weak      = (report.weak_points as string[]) ?? [];
  const strong    = (report.strong_points as string[]) ?? [];
  const steps     = (report.reapplication_steps as string[]) ?? [];

  if (q.includes("strong") || q.includes("how strong") || q.includes("chance") || q.includes("appeal case")) {
    const extra = pct >= 70 ? "This is a strong position — challenge the rejection formally." : pct >= 40 ? "Worth pursuing — gather the evidence gaps first." : "Difficult case — insurer's position appears well-grounded. Focus on the moratorium rule if policy is 8+ years old.";
    return `Your appeal is rated ${lbl} at ${pct}%. ${rsn} ${extra}`;
  }

  if (q.includes("overturn") || q.includes("evidence") || q.includes("what could") || q.includes("what would")) {
    const wk = weak.slice(0,2).join("; ") || "documentation gaps";
    return `To overturn: directly address ${wk}. Obtain a physician's letter confirming the exact diagnosis date, gather all records showing when the condition first manifested, and cross-reference the rejection clause against IRDAI's standardised exclusion definitions. If the policy is 8+ years old, invoke the IRDAI moratorium — pre-existing exclusions cannot apply after that point.`;
  }

  if (q.includes("moratorium") || q.includes("8 year") || q.includes("8-year")) {
    return "The IRDAI 8-year moratorium rule means that after 8 continuous years on any health policy, the insurer cannot reject a claim citing pre-existing disease — even if the condition was not disclosed. If your policy (or its portable predecessor) is 8+ years old, this is your strongest legal argument.";
  }

  if (q.includes("next step") || q.includes("what should i do") || q.includes("how do i") || q.includes("what to do")) {
    const s = steps.length ? steps.slice(0,3).map((t,i) => `${i+1}. ${t}`).join(" ") : "1. File written complaint with insurer GRO. 2. Escalate to IRDAI IGMS if no response in 15 days. 3. Approach Insurance Ombudsman within 1 year.";
    return `${s} Time limits are strict — the Ombudsman must be approached within 1 year of the insurer's final reply.`;
  }

  if (q.includes("ombudsman") || q.includes("escalat") || q.includes("complain") || q.includes("igms")) {
    return "File with IRDAI IGMS first (igms.irda.gov.in). If unresolved in 30 days, approach the Insurance Ombudsman (cioins.co.in). Eligibility: claims up to ₹50 lakhs, file within 1 year of final reply. The process is free and binding on the insurer.";
  }

  if (q.includes("document") || q.includes("what do i need") || q.includes("what to bring")) {
    return "For appeal: (1) Full policy document with schedule, (2) Original rejection letter, (3) All medical records submitted with claim, (4) Hospital discharge summary and itemised bills, (5) Doctor's certificate with exact diagnosis date, (6) Any prior correspondence with insurer, (7) Proof of premium payment history.";
  }

  if (q.includes("clause") || q.includes("what clause") || q.includes("exclusion") || q.includes("why was")) {
    return `Clause invoked: "${clause}". Rejection basis: "${why}". Clause-rejection alignment is ${alignment.toLowerCase()}. ${alignment === "Weak" || alignment === "Not Detected" ? "This is potentially challengeable — the insurer's application of this clause appears weak." : "The insurer has a stated policy basis, but you can still contest the interpretation."}`;
  }

  if (q.includes("weak") || q.includes("why is") || q.includes("why appeal") || q.includes("downside")) {
    const wk = weak.join("; ") || rsn;
    return `The appeal is ${lbl} because: ${wk}. The clause alignment is ${alignment.toLowerCase()}. ${pct < 50 ? "The insurer's position is relatively strong. You will need compelling counter-evidence." : "There is still meaningful grounds to challenge."}`;
  }

  const st = strong.slice(0,2).join("; ") || "none identified";
  const wk2 = weak.slice(0,2).join("; ") || "none identified";
  return `Rejection: "${why}". Clause: "${clause}" (${alignment.toLowerCase()} alignment). Appeal: ${lbl} (${pct}%). Strong points: ${st}. Challenges: ${wk2}.`;
}

// ─────────────────────────────────────────────────────────────
export default function ReportChat({ reportData, context }: ReportChatProps) {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const [sessErr,   setSessErr]   = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  // Use a ref so sendMessage always reads the latest session ID
  // without stale closure problems
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Create session immediately on mount (not on first click) ─
  // This eliminates the race where the user clicks a starter question
  // before setSessionId has flushed.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await API.post("/chat-session", { report_data: reportData });
        if (!cancelled) {
          const sid = res.data.session_id as string;
          setSessionId(sid);
          sessionRef.current = sid;
        }
      } catch {
        if (!cancelled) setSessErr(true);
      }
    }
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  // ── Core send — reads sessionRef (always current) not sessionId ─
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let answer = "";
      let sources: string[] = [];

      const sid = sessionRef.current;

      if (sid) {
        // Multi-turn session path
        const res = await API.post("/chat", { session_id: sid, question: trimmed });
        answer  = (res.data.answer as string)?.trim() ?? "";
        sources = (res.data.sources as string[]) ?? [];
      } else {
        // Fallback: one-shot (session not created yet or failed)
        const res = await API.post("/report-chat", { report_data: reportData, question: trimmed });
        answer  = (res.data.answer as string)?.trim() ?? "";
        sources = (res.data.sources as string[]) ?? [];
      }

      // If LLM returned nothing meaningful, use client-side fallback
      if (!answer || answer.length < 10) {
        answer = buildLocalAnswer(trimmed, reportData, context);
      }

      setMessages(prev => [...prev, {
        role: "assistant", content: answer, sources, ts: Date.now(),
      }]);
    } catch {
      // Network/API error — still give a useful answer
      const fallback = buildLocalAnswer(trimmed, reportData, context);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: fallback,
        sources: [],
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading, reportData, context]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Read directly from input value via ref to avoid stale closure
      const val = inputRef.current?.value ?? input;
      sendMessage(val);
    }
  };

  const starters = STARTER_QUESTIONS[context];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400&display=swap');

        .rc-wrap { width: 100%; }

        .rc-trigger {
          display: flex; align-items: center; gap: 12px;
          background: #0a0f0d; color: white;
          border: 1px solid #2d5a3d; border-radius: 4px;
          padding: 16px 28px; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.14em; text-transform: uppercase;
          transition: all 0.2s; width: 100%; justify-content: center;
        }
        .rc-trigger:hover { background: #1a2018; border-color: #4a7c5f; }
        .rc-trigger-icon { font-size: 15px; color: #4a9d5f; }
        .rc-trigger-pill {
          margin-left: auto;
          font-family: 'DM Mono', monospace; font-size: 8px;
          letter-spacing: 0.08em; padding: 3px 8px;
          background: rgba(74,157,95,0.15); color: #4a9d5f;
          border: 1px solid rgba(74,157,95,0.3); border-radius: 20px;
        }

        .rc-panel {
          background: #faf8f3; border: 1px solid #c8c2b4;
          border-radius: 4px; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }

        .rc-header {
          padding: 14px 20px; border-bottom: 1px solid #c8c2b4;
          display: flex; justify-content: space-between; align-items: center;
          background: #0a0f0d;
        }
        .rc-header-left { display: flex; flex-direction: column; gap: 2px; }
        .rc-header-label {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.45);
        }
        .rc-header-title {
          font-family: 'Cormorant Garamond', serif; font-size: 16px;
          font-weight: 400; color: white; letter-spacing: 0.01em;
        }
        .rc-header-right { display: flex; align-items: center; gap: 10px; }
        .rc-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4a9d5f;
          box-shadow: 0 0 6px rgba(74,157,95,0.6);
        }
        .rc-status-dot.err { background: #e07060; box-shadow: 0 0 6px rgba(224,112,96,0.5); }
        .rc-close {
          background: none; border: none; color: rgba(255,255,255,0.4);
          cursor: pointer; font-size: 20px; line-height: 1; padding: 0 4px;
          transition: color 0.2s;
        }
        .rc-close:hover { color: white; }

        .rc-starters {
          padding: 12px 16px 10px; border-bottom: 1px solid #e8e3d8;
          display: flex; gap: 6px; flex-wrap: wrap; background: white;
        }
        .rc-starters-label {
          width: 100%; font-family: 'DM Mono', monospace; font-size: 8px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #9a9690; margin-bottom: 4px;
        }
        .rc-starter {
          font-family: 'Outfit', sans-serif; font-size: 11px;
          letter-spacing: 0.01em; padding: 5px 11px;
          background: #f5f2ec; color: #3a4038;
          border: 1px solid #ddd8ce; border-radius: 20px;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
          line-height: 1.4;
        }
        .rc-starter:hover { background: #eef5f0; color: #1e5c2e; border-color: #1e5c2e; }
        .rc-starter:disabled { opacity: 0.4; cursor: not-allowed; }

        .rc-messages {
          flex: 1; overflow-y: auto; padding: 20px 18px;
          display: flex; flex-direction: column; gap: 16px;
          min-height: 300px; max-height: 420px;
          scroll-behavior: smooth;
        }
        .rc-messages::-webkit-scrollbar { width: 4px; }
        .rc-messages::-webkit-scrollbar-thumb { background: #ddd8ce; border-radius: 2px; }

        .rc-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; flex: 1; gap: 8px; padding: 40px 20px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px; font-weight: 300; font-style: italic;
          color: #8fa896; text-align: center;
        }
        .rc-empty-sub {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.1em; color: #bfbdb8; font-style: normal;
          text-transform: uppercase;
        }

        .rc-msg { display: flex; flex-direction: column; gap: 4px; max-width: 88%; }
        .rc-msg.user   { align-self: flex-end; align-items: flex-end; }
        .rc-msg.assistant { align-self: flex-start; align-items: flex-start; }

        .rc-msg-meta {
          font-family: 'DM Mono', monospace; font-size: 8px;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #b0ada8; padding: 0 4px;
        }

        .rc-bubble {
          padding: 13px 17px; border-radius: 3px;
          font-family: 'Outfit', sans-serif; font-size: 13.5px;
          line-height: 1.7; white-space: pre-wrap; word-break: break-word;
        }
        .rc-msg.user .rc-bubble {
          background: #1e5c2e; color: white;
          border-bottom-right-radius: 0;
        }
        .rc-msg.assistant .rc-bubble {
          background: white; color: #0a0f0d;
          border: 1px solid #ddd8ce;
          border-bottom-left-radius: 0;
        }

        .rc-sources {
          display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;
          padding: 0 2px;
        }
        .rc-source-chip {
          font-family: 'DM Mono', monospace; font-size: 8px;
          letter-spacing: 0.06em; padding: 3px 9px;
          background: #eef5f0; color: #2d6b3e;
          border: 1px solid #c8e0ce; border-radius: 20px;
        }

        .rc-typing {
          display: flex; gap: 5px; padding: 13px 17px;
          background: white; border: 1px solid #ddd8ce;
          border-radius: 3px; border-bottom-left-radius: 0;
          align-self: flex-start; align-items: center;
        }
        .rc-typing-label {
          font-family: 'DM Mono', monospace; font-size: 8px;
          letter-spacing: 0.08em; color: #9a9690; margin-right: 4px;
          text-transform: uppercase;
        }
        .rc-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #8fa896;
          animation: rc-bounce 1.3s infinite ease-in-out;
        }
        .rc-dot:nth-child(2) { animation-delay: 0.18s; }
        .rc-dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes rc-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }

        .rc-input-area {
          border-top: 1px solid #e8e3d8; background: white;
        }
        .rc-input-row {
          display: flex; align-items: stretch;
        }
        .rc-input {
          flex: 1; padding: 15px 18px;
          border: none; outline: none; resize: none;
          font-family: 'Outfit', sans-serif; font-size: 13.5px;
          color: #0a0f0d; background: transparent; line-height: 1.5;
          min-height: 52px; max-height: 120px; overflow-y: auto;
        }
        .rc-input::placeholder { color: #c0bfba; }
        .rc-input:disabled { color: #c0bfba; }
        .rc-send {
          padding: 0 22px; border: none; border-left: 1px solid #e8e3d8;
          background: none; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #1e5c2e; transition: all 0.15s; white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
        }
        .rc-send:hover:not(:disabled) { background: #eef5f0; }
        .rc-send:disabled { color: #c8c2b4; cursor: not-allowed; }
        .rc-send-icon { font-size: 13px; }

        .rc-hint {
          padding: 6px 18px 8px;
          font-family: 'DM Mono', monospace; font-size: 8px;
          letter-spacing: 0.06em; color: #bfbdb8;
        }

        @media (max-width: 600px) {
          .rc-starter { font-size: 10px; padding: 4px 9px; }
          .rc-bubble  { font-size: 13px; }
          .rc-messages { max-height: 320px; }
        }
      `}</style>

      <div className="rc-wrap">
        {!open ? (
          <button className="rc-trigger" onClick={handleOpen}>
            <span className="rc-trigger-icon">◈</span>
            Ask about this {context === "prepurchase" ? "policy" : "report"}
            <span className="rc-trigger-pill">AI Chat</span>
          </button>
        ) : (
          <div className="rc-panel">

            {/* ── Header ── */}
            <div className="rc-header">
              <div className="rc-header-left">
                <span className="rc-header-label">CareBridge Assistant</span>
                <span className="rc-header-title">
                  {context === "prepurchase" ? "Policy Intelligence Chat" : "Report Advisory Chat"}
                </span>
              </div>
              <div className="rc-header-right">
                <div className={`rc-status-dot${sessErr ? " err" : ""}`} title={sessErr ? "Session error — using one-shot mode" : "Connected"} />
                <button className="rc-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
              </div>
            </div>

            {/* ── Starter questions ── */}
            <div className="rc-starters">
              <span className="rc-starters-label">Suggested questions</span>
              {starters.map((q, i) => (
                <button
                  key={i}
                  className="rc-starter"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* ── Messages ── */}
            <div className="rc-messages">
              {messages.length === 0 ? (
                <div className="rc-empty">
                  Ask anything about your {context === "prepurchase" ? "policy analysis" : "audit report"}
                  <span className="rc-empty-sub">
                    {context === "prepurchase"
                      ? "clauses · scores · compliance · what to negotiate"
                      : "appeal grounds · next steps · regulations · evidence"}
                  </span>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`rc-msg ${msg.role}`}>
                    <span className="rc-msg-meta">
                      {msg.role === "user" ? "You" : "CareBridge AI"}
                    </span>
                    <div className="rc-bubble">{msg.content}</div>
                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                      <div className="rc-sources">
                        {msg.sources.map((s, j) => (
                          <span key={j} className="rc-source-chip">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              {loading && (
                <div className="rc-typing">
                  <span className="rc-typing-label">Thinking</span>
                  <div className="rc-dot" />
                  <div className="rc-dot" />
                  <div className="rc-dot" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Input ── */}
            <div className="rc-input-area">
              <div className="rc-input-row">
                <input
                  ref={inputRef}
                  className="rc-input"
                  placeholder={loading ? "Thinking..." : "Ask a question about this report..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="rc-send"
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                >
                  <span className="rc-send-icon">↑</span>
                  Send
                </button>
              </div>
              <div className="rc-hint">Enter to send · full conversation context maintained</div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}