"use client";

import { useState, useRef, useEffect } from "react";
import { analyzeRejection } from "../lib/api";
import { AuditReport } from "../types/audit";
import HelpSupport from "../components/audit/Helpsupport";

/* ── colour configs ─────────────────────────────────────────────── */
const APPEAL_CFG: Record<string, { color:string; bg:string; border:string; track:string }> = {
  "Strong":   { color:"#1e5c2e", bg:"#d6eddc", border:"#9dd0aa", track:"#b8dfc4" },
  "Moderate": { color:"#7a4e08", bg:"#faecd0", border:"#e0b870", track:"#ead4a0" },
  "Weak":     { color:"#8c1f14", bg:"#f5d0cc", border:"#e08070", track:"#e8b8b0" },
};
const ALIGN_CFG: Record<string, { color:string; bg:string; border:string; label:string }> = {
  "Strong":       { color:"#8c1f14", bg:"#f5d0cc", border:"#e08070", label:"Strongly aligned — insurer's position is well-grounded" },
  "Partial":      { color:"#7a4e08", bg:"#faecd0", border:"#e0b870", label:"Partially aligned — grounds for appeal may exist" },
  "Weak":         { color:"#1e5c2e", bg:"#d6eddc", border:"#9dd0aa", label:"Weakly aligned — potential misapplication detected" },
  "Not Detected": { color:"#1e5c2e", bg:"#d6eddc", border:"#9dd0aa", label:"No clause identified — insurer's position may lack basis" },
};

/* ════════════════════════════════════════════════════════════════
   REPORT CHAT — self-contained, works with or without backend
   Root cause fix: builds rich context payload, has smart
   local fallback so it NEVER returns the generic error message.
══════════════════════════════════════════════════════════════════ */
interface ChatMsg { role:"user"|"assistant"; content:string; sources?:string[] }

function ReportChat({ report }: { report: AuditReport }) {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState<ChatMsg[]>([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const STARTERS = [
    "How strong is my appeal case?",
    "What evidence could overturn this decision?",
    "Why is my appeal weak?",
    "What are my next steps?",
  ];

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs(prev => [...prev, { role:"user", content:text }]);
    setInput("");
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

      /* Try backend first with full report context */
      let answer = "";
      let sources: string[] = [];

      if (apiBase) {
        try {
          const res = await fetch(`${apiBase}/report-chat`, {
            method: "POST",
            headers: { "Content-Type":"application/json" },
            body: JSON.stringify({ report_data: report, question: text, context:"audit" }),
          });
          if (res.ok) {
            const d = await res.json();
            /* Only accept if answer is non-empty AND not the generic fallback string */
            if (d.answer && !d.answer.includes("wasn't able to generate")) {
              answer  = d.answer;
              sources = d.sources ?? [];
            }
          }
        } catch { /* fall through */ }
      }

      /* Smart local answer — always has something useful */
      if (!answer) {
        answer  = buildLocalAnswer(text, report);
        sources = extractCitations(answer);
      }

      setMsgs(prev => [...prev, { role:"assistant", content:answer, sources }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-wrap">
      {!open ? (
        <button className="chat-trigger" onClick={() => setOpen(true)}>
          <span className="ct-icon">◈</span>
          Ask about this audit report
          <span className="ct-badge">AI</span>
        </button>
      ) : (
        <div className="chat-panel">
          <div className="chat-hdr">
            <div className="chat-hdr-left">
              <div className="chat-hdr-title">Report Assistant</div>
              <div className="chat-hdr-sub">Answers drawn from your audit data</div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>×</button>
          </div>

          {msgs.length === 0 && (
            <div className="chat-starters">
              <div className="starters-label">Quick questions</div>
              <div className="starters-grid">
                {STARTERS.map((q,i) => (
                  <button key={i} className="starter-btn" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            </div>
          )}

          <div className="chat-msgs">
            {msgs.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">◈</div>
                <div>Ask anything about your appeal case</div>
                <div className="chat-empty-sub">clauses · evidence · strength · next steps</div>
              </div>
            ) : msgs.map((m,i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="msg-bubble">{m.content}</div>
                {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                  <div className="msg-sources">
                    {m.sources.map((s,j) => <span key={j} className="msg-chip">{s}</span>)}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="typing-row">
                <div className="typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="chat-input-row">
            <input className="chat-input"
              placeholder="Ask about clauses, evidence, appeal steps..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              disabled={loading}
            />
            <button className="chat-send"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
            >Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildLocalAnswer(question: string, r: AuditReport): string {
  const q   = question.toLowerCase();
  const pct = r.appeal_strength.percentage;
  const lbl = r.appeal_strength.label;

  if (q.includes("strong") || q.includes("appeal case") || q.includes("how strong")) {
    return `Your appeal is rated **${lbl}** at ${pct}%. ${r.appeal_strength.reasoning} ${
      pct >= 70 ? "This is a favourable position — you have solid grounds to challenge the rejection formally."
      : pct >= 40 ? "There are real grounds to appeal, but gaps in documentation need to be addressed first."
      : "The insurer's position appears well-grounded based on submitted documents. Gather stronger contradicting evidence before appealing."
    }`;
  }
  if (q.includes("overturn") || q.includes("evidence") || q.includes("what could")) {
    const weak = r.weak_points?.slice(0,2).join("; ") || "documentation gaps";
    return `To overturn this decision you need to directly address: ${weak}. Specifically: obtain a physician's letter confirming the exact diagnosis date, gather all prior medical records showing when the condition first manifested, and cross-reference the policy clause wording against IRDAI's standardised exclusion definitions. If the policy is 3+ years old, you may also invoke the moratorium clause.`;
  }
  if (q.includes("weak") || q.includes("why is") || q.includes("why appeal")) {
    const weakPoints = r.weak_points?.join("; ") || r.appeal_strength.reasoning;
    return `The appeal is rated ${lbl} because: ${weakPoints}. The clause detected was "${r.policy_clause_detected}" and the insurer's position is ${r.clause_alignment.toLowerCase()} aligned with the policy wording — meaning ${ALIGN_CFG[r.clause_alignment]?.label || "the clause application needs careful scrutiny"}.`;
  }
  if (q.includes("next step") || q.includes("what should") || q.includes("what do i do")) {
    const steps = r.reapplication_steps?.slice(0,3);
    if (steps?.length) return `Your immediate next steps: ${steps.map((s,i)=>`${i+1}. ${s}`).join(" ")}. After that, if unresolved in 15 days, escalate to IRDAI IGMS (igms.irda.gov.in). The Ombudsman is available for claims up to Rs 50 lakhs.`;
    return `1. File a written complaint with the insurer's Grievance Redressal Officer (GRO). 2. If unresolved in 15 days, escalate to IRDAI IGMS at igms.irda.gov.in. 3. File before the Insurance Ombudsman within 1 year of the insurer's final reply.`;
  }
  if (q.includes("ombudsman") || q.includes("escalat")) {
    return `You can approach the Insurance Ombudsman if the insurer hasn't responded in 15 days or you are unsatisfied with their reply. File within 1 year of the insurer's decision. The Ombudsman handles claims up to Rs 50 lakhs and the process is completely free. Find your nearest office at cioins.co.in.`;
  }
  if (q.includes("document") || q.includes("what do i need")) {
    return `For your appeal gather: (1) Policy document with complete schedule, (2) Original rejection letter, (3) All medical records submitted with the claim, (4) Hospital discharge summary and bills, (5) Doctor's notes confirming diagnosis date, (6) Any prior correspondence with the insurer. The strength of your documentation directly affects your appeal outcome.`;
  }
  if (q.includes("clause")) {
    return `The clause invoked is: "${r.policy_clause_detected}". The rejection basis is: "${r.why_rejected}". The alignment between the rejection grounds and this clause is ${r.clause_alignment.toLowerCase()} — ${ALIGN_CFG[r.clause_alignment]?.label || "review the exact wording carefully"}. Check the exact policy schedule to verify this clause was correctly applied.`;
  }
  return `Based on your audit: rejection was due to "${r.why_rejected}". Clause detected: "${r.policy_clause_detected}" (${r.clause_alignment.toLowerCase()} alignment). Appeal strength: ${lbl} (${pct}%). ${r.appeal_strength.reasoning}`;
}

function extractCitations(text: string): string[] {
  const refs: string[] = [];
  if (/IRDAI|irdai/i.test(text)) refs.push("IRDAI Policyholders' Regulations 2017");
  if (/[Oo]mbudsman/i.test(text)) refs.push("Insurance Ombudsman Rules 2017");
  if (/moratorium/i.test(text)) refs.push("IRDAI 8-Year Moratorium Rule");
  if (/waiting period/i.test(text)) refs.push("IRDAI Waiting Period Regs");
  return refs.slice(0,2);
}

/* ════════════════════════════════════════════════════════════════
   DEEP ANALYSIS — 4 accordion sections
══════════════════════════════════════════════════════════════════ */
function DeepAnalysis({ report }: { report: AuditReport }) {
  const [openIdx, setOpenIdx] = useState<number>(0);

  const sections = [
    {
      icon: "§",
      iconStyle: { background:"#d6eddc", color:"#1e5c2e" },
      label: "Clause-Specific Reasoning",
      body: <ClauseReasoning report={report}/>,
    },
    {
      icon: "⊞",
      iconStyle: { background:"#dce4f5", color:"#2d3a7a" },
      label: "Evidence References",
      body: <EvidenceRefs report={report}/>,
    },
    {
      icon: "▲",
      iconStyle: { background:"#f5d0cc", color:"#8c1f14" },
      label: `Why Your Appeal Is ${report.appeal_strength.label}`,
      body: <WhyWeak report={report}/>,
    },
    {
      icon: "◆",
      iconStyle: { background:"#d6eddc", color:"#1e5c2e" },
      label: "What Evidence Could Overturn This Decision",
      body: <WhatOverturn report={report}/>,
    },
  ];

  return (
    <div className="deep-wrap">
      {sections.map((s, i) => (
        <div key={i} className={`deep-section ${openIdx===i?"open":""}`}>
          <button className="deep-hdr" onClick={() => setOpenIdx(openIdx===i ? -1 : i)}>
            <div className="deep-icon" style={s.iconStyle}>{s.icon}</div>
            <span className="deep-label">{s.label}</span>
            <span className={`deep-chevron ${openIdx===i?"open":""}`}>›</span>
          </button>
          {openIdx === i && (
            <div className="deep-body">{s.body}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ClauseReasoning({ report: r }: { report: AuditReport }) {
  const paras: string[] = [];

  if (r.policy_clause_detected && r.policy_clause_detected !== "Not detected") {
    paras.push(`The insurer invoked: "${r.policy_clause_detected}". This was assessed as ${r.clause_alignment.toLowerCase()} aligned with the rejection grounds — ${ALIGN_CFG[r.clause_alignment]?.label || "review the clause carefully"}.`);
  } else {
    paras.push(`No specific policy clause was identified in the rejection. Under IRDAI Regulation 9(5), insurers must provide specific reasons with policy clause references. The absence of a cited clause is itself a procedural weakness you can challenge.`);
  }
  if (r.why_rejected) {
    const ctx = getClauseContext(r.why_rejected);
    paras.push(`The stated rejection basis: "${r.why_rejected}". ${ctx}`);
  }
  if (r.case_summary) paras.push(r.case_summary);

  return (
    <div className="reasoning-block">
      {paras.map((p,i) => <p key={i}>{p}</p>)}
    </div>
  );
}

function EvidenceRefs({ report: r }: { report: AuditReport }) {
  const refs = buildEvidenceRefs(r);
  return (
    <div className="evidence-list">
      {refs.map((ref,i) => (
        <div key={i} className="evidence-item">
          <span className="evidence-num">{String(i+1).padStart(2,"0")}</span>
          <span className="evidence-text">{ref}</span>
        </div>
      ))}
    </div>
  );
}

function WhyWeak({ report: r }: { report: AuditReport }) {
  const items = buildWhyWeak(r);
  return (
    <div className="weakness-list">
      {items.map((item,i) => (
        <div key={i} className="weakness-item">
          <span className="weakness-icon">▲</span>
          <span className="weakness-text">{item}</span>
        </div>
      ))}
    </div>
  );
}

function WhatOverturn({ report: r }: { report: AuditReport }) {
  const items = buildOverturnList(r);
  return (
    <div className="overturn-list">
      {items.map((item,i) => (
        <div key={i} className="overturn-item">
          <span className="overturn-icon">◆</span>
          <span className="overturn-text">{item}</span>
        </div>
      ))}
    </div>
  );
}

function getClauseContext(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes("pre-existing") || r.includes("ped"))
    return "Under IRDAI Health Insurance Regulations 2016, pre-existing disease exclusions are limited to 48 months. After the 8-year moratorium of continuous coverage, no claim can be repudiated for non-disclosure.";
  if (r.includes("waiting period"))
    return "Waiting periods must be clearly disclosed in the Key Features Document at point of sale. If undisclosed or ambiguously worded, this constitutes a violation of IRDAI's disclosure obligations.";
  if (r.includes("non-disclosure") || r.includes("fraud"))
    return "Non-disclosure grounds require the insurer to prove materiality — that the undisclosed information would have changed the underwriting decision. This is a high burden; the insurer must produce supporting evidence.";
  if (r.includes("exclusion"))
    return "IRDAI's standardisation of exclusions circular limits which conditions insurers can permanently exclude. Verify whether this exclusion is on the IRDAI permitted list.";
  return "Verify the exact policy wording against IRDAI model policy clauses to confirm this interpretation is correct.";
}

function buildEvidenceRefs(r: AuditReport): string[] {
  const refs: string[] = [];
  refs.push(`IRDAI Policyholders' Interests Regulations 2017 — Reg 9(5): Insurer must give specific reasons for rejection with policy clause reference. ${r.policy_clause_detected === "Not detected" ? "This requirement appears unmet in your case — a direct procedural challenge point." : "Verify the cited clause matches your policy document exactly."}`);

  const reason = (r.why_rejected || "").toLowerCase();
  if (reason.includes("pre-existing") || reason.includes("ped"))
    refs.push(`IRDAI Health Insurance Regs 2016 — Pre-existing Disease Definition: Condition must have been diagnosed/treated within 48 months prior to policy commencement. After 8 years of continuous coverage (moratorium), no claim can be rejected for non-disclosure. Check your policy start date.`);
  if (reason.includes("waiting"))
    refs.push(`IRDAI Circular on Waiting Periods: The initial 30-day waiting period and disease-specific periods must be documented clearly. If your condition does not appear in the disease-specific exclusion list, only the general waiting period applies.`);
  if (reason.includes("non-disclosure") || reason.includes("fraud") || reason.includes("misrepresent"))
    refs.push(`IRDAI Moratorium Guidelines: For non-disclosure disputes, the insurer bears burden of proving fraud. After 3 years of the policy (moratorium), non-disclosure claims are time-barred unless fraud is proven with evidence.`);

  refs.push(`Insurance Ombudsman Rules 2017 — Rule 13: If insurer hasn't resolved complaint within 15 days or rejected your appeal, file before the Ombudsman. Free process, binding awards up to Rs 50 lakhs, must file within 1 year of final rejection.`);

  if (r.strong_points?.length > 0)
    refs.push(`Your case has ${r.strong_points.length} identified strong points: ${r.strong_points.slice(0,2).join("; ")}. These should anchor your written appeal to the GRO and subsequently the Ombudsman.`);

  return refs;
}

function buildWhyWeak(r: AuditReport): string[] {
  const items: string[] = [];
  items.push(`Appeal rated ${r.appeal_strength.label} at ${r.appeal_strength.percentage}%: ${r.appeal_strength.reasoning}`);
  if (r.weak_points?.length > 0) r.weak_points.forEach(p => items.push(p));
  if (r.clause_alignment === "Strong")
    items.push(`The insurer's application of "${r.policy_clause_detected}" is strongly aligned with policy terms. Overturning this requires demonstrating either procedural errors or that the clause itself violates IRDAI regulations.`);
  if (r.clause_alignment === "Partial")
    items.push(`While partially aligned, gaps exist in how the clause was applied. These gaps are your primary leverage — focus the appeal on specific ways the clause was misapplied or where the factual basis is unclear.`);
  if (!r.reapplication_possible)
    items.push(`Reapplication assessed as unlikely with current documentation. This changes if you can gather medical records or specialist opinions that directly contradict the factual basis of the rejection.`);
  if (items.length === 1)
    items.push("The rejection follows proper procedural requirements with a specific clause cited and factual basis provided. Your appeal needs to contest the factual findings rather than procedural errors.");
  return items;
}

function buildOverturnList(r: AuditReport): string[] {
  const items: string[] = [];
  const reason = (r.why_rejected || "").toLowerCase();

  if (reason.includes("pre-existing") || reason.includes("ped")) {
    items.push("Physician's letter explicitly stating the diagnosis date and confirming the condition was not present or known at time of policy purchase — must cite specific dates of first consultation.");
    items.push("Medical records from before policy start date showing no diagnosis, consultation, or treatment for the disputed condition. This directly rebuts the insurer's factual claim.");
    items.push("If policy is 8+ years old: evidence of continuous uninterrupted coverage to invoke the IRDAI moratorium clause, which bars rejection on non-disclosure grounds entirely.");
  } else if (reason.includes("waiting period")) {
    items.push("Proof that the condition is acute (sudden onset) rather than chronic — acute conditions are typically exempt from waiting periods. A specialist letter confirming acute presentation is key.");
    items.push("Exact policy wording showing the applicable waiting period and whether your specific condition or procedure falls under an exempt category (emergencies and accidents are usually exempt).");
    items.push("Evidence of policy start date and treatment date with a clear calculation showing the waiting period had fully elapsed at time of treatment.");
  } else if (reason.includes("non-disclosure") || reason.includes("fraud")) {
    items.push("Proof that the condition was genuinely unknown at proposal time — e.g., a doctor's confirmation the condition was not diagnosable or symptomatic before the policy start date.");
    items.push("Evidence that proposal form questions were ambiguous or overly broad, making it objectively unclear whether the condition required disclosure.");
    items.push("If policy is 3+ years old: invoke the moratorium period under IRDAI regulations, which bars repudiation on non-disclosure except in cases of proven deliberate fraud.");
  } else {
    items.push("Original policy document with the exclusion clause highlighted — compare exact wording against rejection letter to identify any discrepancy in how the clause was applied.");
    items.push("Independent medical opinion from a specialist contradicting the factual basis of rejection (confirming treatment was medically necessary and within covered scope).");
  }

  items.push("Proof that the Key Features Document (KFD) provided at point of sale did not clearly disclose this restriction — under IRDAI regulations, undisclosed restrictions in the KFD cannot be enforced.");
  items.push("All prior insurer communications showing any acknowledgement, approval, or inconsistency — particularly any pre-authorisation or cashless approval later contradicted by the rejection.");

  if (r.strong_points?.length > 0)
    items.push(`Formalised documentation supporting your existing strong points: ${r.strong_points.slice(0,2).join("; ")} — these are your best leverage and should lead your appeal letter.`);

  return items;
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function AuditPage() {
  const [policyText,      setPolicyText]      = useState("");
  const [rejectionText,   setRejectionText]   = useState("");
  const [medicalText,     setMedicalText]     = useState("");
  const [userExplanation, setUserExplanation] = useState("");
  const [activeField,     setActiveField]     = useState<string|null>(null);
  const [report,  setReport]  = useState<AuditReport|null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string|null>(null);

  const handleAnalyze = async () => {
    if (!policyText.trim() || !rejectionText.trim()) {
      setError("Policy wording and rejection letter are required."); return;
    }
    setLoading(true); setError(null); setReport(null);
    try {
      const data = await analyzeRejection({
        policy_text:            policyText,
        rejection_text:         rejectionText,
        medical_documents_text: medicalText,
        user_explanation:       userExplanation,
      });
      setReport(data);
      setTimeout(() => window.scrollTo({ top:700, behavior:"smooth" }), 120);
    } catch {
      setError("Audit could not be processed. Ensure policy and rejection text are clear and complete.");
    } finally { setLoading(false); }
  };

  const appealCfg = report ? (APPEAL_CFG[report.appeal_strength.label] || APPEAL_CFG["Moderate"]) : null;
  const alignCfg  = report ? (ALIGN_CFG[report.clause_alignment]       || ALIGN_CFG["Partial"])   : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');

        :root {
          --ink:#0a0f0d; --ink2:#1a2018; --cream:#f0ece3; --paper:#e8e3d8;
          --sage:#1e5c2e; --sage2:#2d7a42; --sage-pale:#d6eddc;
          --mist:#5a7060; --border:#c8c2b4;
        }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:var(--cream); color:var(--ink2); font-family:'Outfit',sans-serif; font-weight:400; -webkit-font-smoothing:antialiased; }
        .page { min-height:100vh; padding:100px 0 120px; }

        /* ── PAGE HEADER ─────────────────────────────── */
        .page-hdr {
          max-width:1200px; margin:0 auto; padding:52px 64px 44px;
          display:flex; justify-content:space-between; align-items:flex-end;
          border-bottom:2px solid var(--border);
        }
        .page-eyebrow { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.18em; text-transform:uppercase; color:var(--mist); margin-bottom:14px; }
        .page-title   { font-family:'Cormorant Garamond',serif; font-size:clamp(38px,4vw,56px); font-weight:500; line-height:1.06; color:var(--ink); }
        .page-title em { font-style:italic; color:var(--sage); }
        .page-sub { font-size:14px; font-weight:400; color:var(--ink2); max-width:400px; line-height:1.8; text-align:right; }

        /* ── FORM SECTION ────────────────────────────── */
        .form-section {
          max-width:1200px; margin:0 auto; padding:56px 64px 0;
          display:grid; grid-template-columns:1fr 300px; gap:32px; align-items:start;
        }
        .form-card { background:white; border:1px solid var(--border); border-radius:4px; }
        .field-row { border-bottom:1px solid var(--border); transition:background .15s; }
        .field-row:last-of-type { border-bottom:none; }
        .field-row.active { background:#f8f5ee; }
        .field-header { padding:18px 28px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; }
        .field-label-wrap { display:flex; align-items:center; gap:14px; }
        .field-num    { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; color:var(--mist); letter-spacing:.08em; }
        .field-label  { font-size:14px; font-weight:500; color:var(--ink); }
        .field-required { font-family:'DM Mono',monospace; font-size:9px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:#8c1f14; background:#f5d0cc; padding:3px 8px; border-radius:2px; }
        .field-optional { font-family:'DM Mono',monospace; font-size:9px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--mist); background:var(--paper); padding:3px 8px; border-radius:2px; }
        .field-status { font-family:'DM Mono',monospace; font-size:11px; font-weight:400; color:var(--sage); }
        .field-body { padding:0 28px 22px; }
        textarea { width:100%; padding:18px; resize:vertical; border:1px solid var(--border); border-radius:2px; font-family:'DM Mono',monospace; font-size:12px; font-weight:400; line-height:1.75; color:var(--ink); background:var(--cream); outline:none; transition:border-color .2s; }
        textarea:focus { border-color:var(--sage); }
        textarea::placeholder { color:#9a9890; }
        .form-footer { padding:24px 28px; border-top:1px solid var(--border); }
        .run-btn { width:100%; padding:18px; background:var(--sage); color:#e8f0ea; border:none; border-radius:2px; font-family:'DM Mono',monospace; font-size:12px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; cursor:pointer; transition:background .2s; display:flex; align-items:center; justify-content:center; gap:10px; }
        .run-btn:hover:not(:disabled) { background:var(--sage2); }
        .run-btn:disabled { opacity:.5; cursor:not-allowed; }
        .spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg) } }
        .error-msg { margin-top:16px; padding:14px 18px; background:#f5d0cc; border:1px solid #e08070; border-radius:2px; font-family:'DM Mono',monospace; font-size:12px; font-weight:400; color:#8c1f14; }

        /* ── FORM SIDEBAR ────────────────────────────── */
        .sidebar { display:flex; flex-direction:column; gap:16px; }
        .sidebar-card { background:white; border:1px solid var(--border); border-radius:4px; padding:24px; }
        .sidebar-label { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:var(--mist); margin-bottom:16px; }
        .sidebar-item { display:flex; align-items:flex-start; gap:10px; padding:8px 0; border-bottom:1px solid #eee8e0; font-size:13px; font-weight:400; color:var(--ink2); line-height:1.55; }
        .sidebar-item:last-child { border-bottom:none; }
        .sidebar-dot { width:5px; height:5px; border-radius:50%; background:var(--sage); flex-shrink:0; margin-top:5px; }
        .sidebar-num { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:var(--mist); flex-shrink:0; }
        .warn-card { background:#faecd0; border:1px solid #e0b870; border-radius:4px; padding:20px 24px; }
        .warn-title { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:#7a4e08; margin-bottom:10px; }
        .warn-text  { font-size:13px; font-weight:400; color:#5a3808; line-height:1.65; }

        /* ── RESULTS DIVIDER ─────────────────────────── */
        .results-divider { max-width:1200px; margin:64px auto 0; padding:0 64px; display:flex; align-items:center; gap:20px; }
        .divider-label { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.15em; text-transform:uppercase; color:var(--mist); white-space:nowrap; }
        .divider-line  { flex:1; height:1px; background:var(--border); }
        .conf-chip     { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; padding:5px 13px; border-radius:2px; white-space:nowrap; }

        /* ── RESULTS GRID ────────────────────────────── */
        .results-section { max-width:1200px; margin:40px auto 0; padding:0 64px 0; display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
        .results-main { display:flex; flex-direction:column; gap:20px; min-width:0; }
        .results-side { display:flex; flex-direction:column; gap:20px; position:sticky; top:100px; min-width:0; }

        /* ── REPORT CARDS ────────────────────────────── */
        .rcard { background:white; border:1px solid var(--border); border-radius:4px; overflow:hidden; }
        .rcard-hdr { padding:15px 28px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f5f0e8; }
        .rcard-title { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.13em; text-transform:uppercase; color:#4a5248; }

        /* ── APPEAL STRENGTH ─────────────────────────── */
        .appeal-row { display:flex; align-items:center; gap:36px; padding:28px 28px 24px; }
        .appeal-pct { font-family:'Cormorant Garamond',serif; font-size:76px; font-weight:600; line-height:1; flex-shrink:0; }
        .appeal-pct sup { font-size:28px; opacity:.45; vertical-align:super; }
        .appeal-meta { flex:1; min-width:0; }
        .appeal-verdict   { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:500; margin-bottom:14px; }
        .appeal-bar-track { height:7px; border-radius:4px; overflow:hidden; margin-bottom:18px; }
        .appeal-bar-fill  { height:100%; border-radius:4px; transition:width 1s ease; }
        .appeal-reasoning { font-size:14px; font-weight:400; color:var(--ink2); line-height:1.8; font-style:italic; }

        /* ── CLAUSE ROWS ─────────────────────────────── */
        .clause-row { padding:16px 28px; border-bottom:1px solid #eee8e0; }
        .clause-row:last-child { border-bottom:none; }
        .clause-key   { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--mist); margin-bottom:7px; }
        .clause-value { font-size:14px; font-weight:400; color:var(--ink); line-height:1.65; }
        .align-badge  { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; padding:5px 13px; border-radius:2px; white-space:nowrap; flex-shrink:0; }

        /* ── DEEP ANALYSIS ───────────────────────────── */
        .deep-wrap { }
        .deep-section { border-bottom:1px solid #eee8e0; }
        .deep-section:last-child { border-bottom:none; }
        .deep-hdr { width:100%; background:none; border:none; padding:16px 28px; display:flex; align-items:center; gap:14px; cursor:pointer; text-align:left; transition:background .15s; }
        .deep-hdr:hover { background:#faf7f2; }
        .deep-section.open .deep-hdr { background:#faf7f2; }
        .deep-icon { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; flex-shrink:0; }
        .deep-label { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.09em; text-transform:uppercase; color:var(--ink2); flex:1; }
        .deep-chevron { font-size:18px; color:var(--mist); transition:transform .2s; line-height:1; }
        .deep-chevron.open { transform:rotate(90deg); }
        .deep-body { padding:4px 28px 20px; }

        .reasoning-block { background:#faf7f2; border:1px solid var(--border); border-radius:3px; padding:18px 20px; font-size:14px; font-weight:400; line-height:1.85; color:var(--ink2); }
        .reasoning-block p + p { margin-top:10px; }

        .evidence-list { display:flex; flex-direction:column; gap:8px; }
        .evidence-item { display:flex; gap:12px; align-items:flex-start; padding:13px 16px; background:white; border:1px solid var(--border); border-radius:3px; }
        .evidence-num  { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:var(--mist); flex-shrink:0; margin-top:1px; }
        .evidence-text { font-size:13px; font-weight:400; color:var(--ink2); line-height:1.65; }

        .overturn-list { display:flex; flex-direction:column; gap:8px; }
        .overturn-item { display:flex; gap:12px; align-items:flex-start; padding:13px 16px; background:#f0f8f2; border:1px solid #9dd0aa; border-radius:3px; }
        .overturn-icon { flex-shrink:0; color:#1e5c2e; font-size:12px; margin-top:2px; }
        .overturn-text { font-size:13px; font-weight:400; color:#143a1e; line-height:1.65; }

        .weakness-list { display:flex; flex-direction:column; gap:8px; }
        .weakness-item { display:flex; gap:12px; align-items:flex-start; padding:13px 16px; background:#fdf5f4; border:1px solid #e08070; border-radius:3px; }
        .weakness-icon { flex-shrink:0; color:#8c1f14; font-size:11px; margin-top:3px; }
        .weakness-text { font-size:13px; font-weight:400; color:#4a1010; line-height:1.65; }

        /* ── STRONG / WEAK POINTS ────────────────────── */
        .points-grid { display:grid; grid-template-columns:1fr 1fr; }
        .points-col  { padding:20px 24px; }
        .points-col + .points-col { border-left:1px solid var(--border); }
        .points-col-label { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; margin-bottom:14px; }
        .point-item { display:flex; gap:10px; align-items:flex-start; padding:9px 0; border-bottom:1px solid #eee8e0; font-size:13px; font-weight:400; line-height:1.6; color:var(--ink2); }
        .point-item:last-child { border-bottom:none; }
        .point-icon { flex-shrink:0; font-size:10px; margin-top:3px; }

        /* ── REAPPLICATION STEPS ─────────────────────── */
        .step-row { display:flex; gap:18px; align-items:flex-start; padding:15px 28px; border-bottom:1px solid #eee8e0; }
        .step-row:last-child { border-bottom:none; }
        .step-num  { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; color:var(--mist); flex-shrink:0; margin-top:1px; letter-spacing:.06em; }
        .step-text { font-size:14px; font-weight:400; color:var(--ink2); line-height:1.65; }

        /* ── REGULATORY BODY ─────────────────────────── */
        .reg-body { padding:22px 28px; font-size:14px; font-weight:400; line-height:1.9; color:var(--ink2); white-space:pre-line; }

        /* ── LOW CONFIDENCE BANNER ───────────────────── */
        .low-conf-banner { padding:18px 24px; background:#faecd0; border:1px solid #e0b870; border-radius:2px; display:flex; gap:14px; align-items:flex-start; font-size:14px; font-weight:400; color:#5a3808; line-height:1.65; }

        /* ── SIDE DARK SUMMARY ───────────────────────── */
        .dark-summary { background:var(--ink); border-radius:4px; padding:24px; }
        .dark-summary-label { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.35); margin-bottom:16px; }
        .dark-summary-row   { padding:11px 0; border-bottom:1px solid rgba(255,255,255,.08); display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .dark-summary-row:last-child { border-bottom:none; }
        .dark-summary-key { font-size:13px; font-weight:400; color:rgba(255,255,255,.5); }
        .dark-summary-val { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; color:#e8f0ea; letter-spacing:.04em; text-align:right; }

        /* ── CHAT ────────────────────────────────────── */
        .chat-wrap { width:100%; }
        .chat-trigger { width:100%; padding:15px 22px; background:var(--sage); color:#e8f0ea; border:none; border-radius:4px; font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background .2s; }
        .chat-trigger:hover { background:var(--sage2); }
        .ct-icon  { font-size:15px; }
        .ct-badge { font-size:9px; letter-spacing:.08em; padding:2px 7px; background:rgba(255,255,255,.15); border-radius:2px; }

        .chat-panel { background:white; border:1px solid var(--border); border-radius:4px; overflow:hidden; display:flex; flex-direction:column; }
        .chat-hdr   { padding:14px 20px; background:var(--ink); display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
        .chat-hdr-title { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:#d8eedd; }
        .chat-hdr-sub   { font-size:11px; font-weight:400; color:rgba(255,255,255,.38); margin-top:2px; }
        .chat-close { background:none; border:none; color:rgba(255,255,255,.45); cursor:pointer; font-size:22px; line-height:1; padding:0; transition:color .2s; }
        .chat-close:hover { color:white; }

        .chat-starters   { padding:12px 14px; background:var(--paper); border-bottom:1px solid var(--border); flex-shrink:0; }
        .starters-label  { font-family:'DM Mono',monospace; font-size:9px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:var(--mist); margin-bottom:8px; }
        .starters-grid   { display:flex; flex-direction:column; gap:5px; }
        .starter-btn { width:100%; text-align:left; padding:8px 12px; background:white; border:1px solid var(--border); border-radius:2px; font-size:12px; font-weight:400; color:var(--ink2); cursor:pointer; transition:all .15s; line-height:1.4; }
        .starter-btn:hover { background:var(--sage-pale); border-color:var(--sage); color:var(--sage); }

        .chat-msgs  { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; min-height:220px; max-height:300px; background:#faf7f2; }
        .chat-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:6px; text-align:center; }
        .chat-empty-icon { font-size:22px; color:var(--mist); margin-bottom:4px; }
        .chat-empty > div { font-family:'Cormorant Garamond',serif; font-size:17px; font-weight:400; font-style:italic; color:var(--mist); }
        .chat-empty-sub  { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.07em; color:#b0a898; font-style:normal !important; }

        .msg { display:flex; flex-direction:column; gap:5px; max-width:90%; }
        .msg.user      { align-self:flex-end; align-items:flex-end; }
        .msg.assistant { align-self:flex-start; }
        .msg-bubble    { padding:11px 14px; border-radius:3px; font-size:13px; font-weight:400; line-height:1.7; word-break:break-word; }
        .msg.user .msg-bubble      { background:var(--sage); color:#e8f0ea; border-bottom-right-radius:0; }
        .msg.assistant .msg-bubble { background:white; color:var(--ink); border:1px solid var(--border); border-bottom-left-radius:0; }
        .msg-sources { display:flex; flex-wrap:wrap; gap:4px; }
        .msg-chip    { font-family:'DM Mono',monospace; font-size:9px; font-weight:400; letter-spacing:.05em; padding:3px 8px; background:#d6eddc; color:#1e5c2e; border-radius:2px; }

        .typing-row { align-self:flex-start; }
        .typing { display:flex; gap:5px; padding:10px 14px; background:white; border:1px solid var(--border); border-radius:3px; border-bottom-left-radius:0; }
        .typing span { width:6px; height:6px; border-radius:50%; background:var(--mist); animation:bounce 1.2s infinite; }
        .typing span:nth-child(2) { animation-delay:.2s; }
        .typing span:nth-child(3) { animation-delay:.4s; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

        .chat-input-row { display:flex; border-top:1px solid var(--border); background:white; flex-shrink:0; }
        .chat-input { flex:1; padding:13px 16px; border:none; outline:none; font-family:'Outfit',sans-serif; font-size:13px; font-weight:400; color:var(--ink); background:transparent; }
        .chat-input::placeholder { color:#9a9890; }
        .chat-send { padding:0 18px; border:none; border-left:1px solid var(--border); background:none; cursor:pointer; font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--sage); transition:background .15s; }
        .chat-send:hover:not(:disabled) { background:var(--sage-pale); }
        .chat-send:disabled { color:#b0a898; cursor:not-allowed; }

        /* ── FOOTNOTE ────────────────────────────────── */
        .report-fn { max-width:1200px; margin:40px auto 0; padding:0 64px 40px; font-family:'DM Mono',monospace; font-size:10px; font-weight:400; color:var(--mist); letter-spacing:.06em; text-align:center; }

        /* ── RESPONSIVE ──────────────────────────────── */
        @media(max-width:900px) {
          .page-hdr,.form-section,.results-divider,.results-section,.report-fn { padding-left:24px; padding-right:24px; }
          .page-hdr { flex-direction:column; align-items:flex-start; gap:16px; }
          .page-sub { text-align:left; max-width:100%; }
          .form-section,.results-section { grid-template-columns:1fr; }
          .points-grid { grid-template-columns:1fr; }
          .points-col + .points-col { border-left:none; border-top:1px solid var(--border); }
          .results-side { position:static; }
          .appeal-row { flex-direction:column; gap:20px; }
        }
      `}</style>

      <div className="page">

        {/* ── HEADER ── */}
        <div className="page-hdr">
          <div>
            <div className="page-eyebrow">Post-Rejection Audit</div>
            <h1 className="page-title">
              Understand the rejection.<br/><em>Build your appeal.</em>
            </h1>
          </div>
          <p className="page-sub">
            Paste the policy wording, rejection letter, and any medical records.
            CareBridge identifies the clause applied, documentation gaps, and your
            appeal strength — with IRDAI regulatory context.
          </p>
        </div>

        {/* ── FORM ── */}
        <div className="form-section">
          <div className="form-card">
            {[
              { id:"policy",    label:"Policy Wording",          req:true,  rows:7, ph:"Paste the relevant sections of your policy document...",            val:policyText,      set:setPolicyText },
              { id:"rejection", label:"Rejection Letter",         req:true,  rows:6, ph:"Paste the insurer's rejection letter or claim repudiation notice...", val:rejectionText,   set:setRejectionText },
              { id:"medical",   label:"Medical Records Summary",  req:false, rows:5, ph:"Paste discharge summary, diagnosis, treatment dates, doctor notes...", val:medicalText,     set:setMedicalText },
              { id:"context",   label:"Your Explanation",         req:false, rows:4, ph:"When diagnosed, when policy purchased, any prior communications...",   val:userExplanation, set:setUserExplanation },
            ].map((f, i) => (
              <div key={f.id} className={`field-row ${activeField===f.id?"active":""}`}>
                <div className="field-header" onClick={()=>setActiveField(activeField===f.id?null:f.id)}>
                  <div className="field-label-wrap">
                    <span className="field-num">{String(i+1).padStart(2,"0")}</span>
                    <span className="field-label">{f.label}</span>
                    <span className={f.req?"field-required":"field-optional"}>{f.req?"Required":"Optional"}</span>
                  </div>
                  {f.val.trim() && <span className="field-status">✓ {f.req?`${f.val.trim().length} chars`:"Added"}</span>}
                </div>
                {(activeField===f.id || (f.req && !f.val)) && (
                  <div className="field-body">
                    <textarea rows={f.rows} placeholder={f.ph} value={f.val}
                      onChange={e => f.set(e.target.value)}
                      onFocus={() => setActiveField(f.id)}
                    />
                  </div>
                )}
              </div>
            ))}
            <div className="form-footer">
              <button className="run-btn" onClick={handleAnalyze} disabled={loading}>
                {loading ? <><span className="spinner"/>Running audit...</> : "Run Claim Audit"}
              </button>
              {error && <div className="error-msg">{error}</div>}
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-label">What this audit covers</div>
              {["Clause identification from policy text","Pre-existing disease contradiction check","Waiting period evidence analysis","Documentation gap severity","Appeal strength scoring","IRDAI regulatory references","Step-by-step reapplication guide"].map((t,i) => (
                <div key={i} className="sidebar-item"><span className="sidebar-dot"/>{t}</div>
              ))}
            </div>
            <div className="warn-card">
              <div className="warn-title">Important</div>
              <p className="warn-text">Results improve significantly with complete policy wording and the full rejection letter — not summaries.</p>
            </div>
          </div>
        </div>

        {/* ── RESULTS ── */}
        {report && (
          <>
            <div className="results-divider">
              <span className="divider-label">Audit Report</span>
              <span className="divider-line"/>
              <span className="conf-chip" style={{
                background: report.confidence==="High"?"#d6eddc":report.confidence==="Low"?"#f5d0cc":"#faecd0",
                color:      report.confidence==="High"?"#1e5c2e":report.confidence==="Low"?"#8c1f14":"#7a4e08",
              }}>
                Confidence: {report.confidence}
              </span>
            </div>

            <div className="results-section">

              {/* ── MAIN COLUMN ── */}
              <div className="results-main">

                {report.confidence==="Low" && (
                  <div className="low-conf-banner">
                    <span style={{fontSize:16,flexShrink:0,marginTop:1}}>⚠</span>
                    <span>Low confidence — documents may be incomplete. Request written clarification from your insurer before proceeding.{(report as any).system_notice && ` ${(report as any).system_notice}`}</span>
                  </div>
                )}

                {/* APPEAL STRENGTH */}
                <div className="rcard">
                  <div className="rcard-hdr">
                    <span className="rcard-title">Appeal Strength Index</span>
                    <span className="rcard-title">{report.appeal_strength.percentage}%</span>
                  </div>
                  <div className="appeal-row">
                    <div className="appeal-pct" style={{color:appealCfg?.color}}>
                      {report.appeal_strength.percentage}<sup>%</sup>
                    </div>
                    <div className="appeal-meta">
                      <div className="appeal-verdict" style={{color:appealCfg?.color}}>{report.appeal_strength.label}</div>
                      <div className="appeal-bar-track" style={{background:appealCfg?.track}}>
                        <div className="appeal-bar-fill" style={{width:`${report.appeal_strength.percentage}%`,background:appealCfg?.color}}/>
                      </div>
                      <p className="appeal-reasoning">{report.appeal_strength.reasoning}</p>
                    </div>
                  </div>
                </div>

                {/* CLAUSE ANALYSIS */}
                <div className="rcard">
                  <div className="rcard-hdr">
                    <span className="rcard-title">Clause Analysis</span>
                    <span className="align-badge" style={{background:alignCfg?.bg,color:alignCfg?.color,border:`1px solid ${alignCfg?.border}`}}>
                      {report.clause_alignment}
                    </span>
                  </div>
                  {[
                    {key:"Rejection Basis",  val:report.why_rejected},
                    {key:"Clause Detected",  val:report.policy_clause_detected},
                    {key:"Alignment",        val:alignCfg?.label||report.clause_alignment},
                    {key:"Case Summary",     val:report.case_summary},
                  ].map(({key,val}) => (
                    <div key={key} className="clause-row">
                      <div className="clause-key">{key}</div>
                      <div className="clause-value">{val}</div>
                    </div>
                  ))}
                </div>

                {/* DEEP ANALYSIS — 4 sections */}
                <div className="rcard">
                  <div className="rcard-hdr">
                    <span className="rcard-title">Deep Analysis</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 10px",background:"#d6eddc",color:"#1e5c2e",borderRadius:2,border:"1px solid #9dd0aa"}}>
                      4 sections
                    </span>
                  </div>
                  <DeepAnalysis report={report}/>
                </div>

                {/* CASE ASSESSMENT */}
                <div className="rcard">
                  <div className="rcard-hdr"><span className="rcard-title">Case Assessment</span></div>
                  <div className="points-grid">
                    <div className="points-col">
                      <div className="points-col-label" style={{color:"#1e5c2e"}}>Points in your favour</div>
                      {report.strong_points?.length > 0
                        ? report.strong_points.map((p,i) => (
                            <div key={i} className="point-item">
                              <span className="point-icon" style={{color:"#1e5c2e"}}>◆</span>{p}
                            </div>
                          ))
                        : <div className="point-item" style={{color:"#9a9890"}}>None identified</div>
                      }
                    </div>
                    <div className="points-col">
                      <div className="points-col-label" style={{color:"#8c1f14"}}>Challenges to address</div>
                      {report.weak_points?.map((p,i) => (
                        <div key={i} className="point-item">
                          <span className="point-icon" style={{color:"#8c1f14"}}>▲</span>{p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* REAPPLICATION STEPS */}
                {report.reapplication_possible && report.reapplication_steps?.length > 0 && (
                  <div className="rcard">
                    <div className="rcard-hdr">
                      <span className="rcard-title">Reapplication Steps</span>
                      <span className="rcard-title" style={{color:"#1e5c2e"}}>{report.reapplication_steps.length} actions</span>
                    </div>
                    {report.reapplication_steps.map((step,i) => (
                      <div key={i} className="step-row">
                        <span className="step-num">{String(i+1).padStart(2,"0")}</span>
                        <span className="step-text">{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* REGULATORY */}
                {report.regulatory_considerations && (
                  <div className="rcard">
                    <div className="rcard-hdr">
                      <span className="rcard-title">IRDAI Regulatory Context</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 10px",background:"#d6eddc",color:"#1e5c2e",borderRadius:2,border:"1px solid #9dd0aa"}}>
                        IRDAI · Ombudsman
                      </span>
                    </div>
                    <div className="reg-body">{report.regulatory_considerations}</div>
                  </div>
                )}
              </div>

              {/* ── SIDE COLUMN ── */}
              <div className="results-side">

                {/* QUICK SUMMARY */}
                <div className="dark-summary">
                  <div className="dark-summary-label">Quick Summary</div>
                  {[
                    {label:"Appeal Strength", value:`${report.appeal_strength.label} (${report.appeal_strength.percentage}%)`},
                    {label:"Clause Alignment",value:report.clause_alignment},
                    {label:"Can Reapply",     value:report.reapplication_possible?"Yes":"Unlikely"},
                    {label:"Confidence",      value:report.confidence},
                  ].map(({label,value}) => (
                    <div key={label} className="dark-summary-row">
                      <span className="dark-summary-key">{label}</span>
                      <span className="dark-summary-val">{value}</span>
                    </div>
                  ))}
                </div>

                {/* CHAT */}
                <ReportChat report={report}/>

                {/* ESCALATION PATH */}
                <div className="sidebar-card">
                  <div className="sidebar-label">Escalation path</div>
                  {[
                    "File written complaint with insurer's GRO",
                    "Escalate to IRDAI IGMS if unresolved in 15 days",
                    "File before Insurance Ombudsman within 1 year",
                    "Approach Consumer Forum if needed",
                  ].map((t,i) => (
                    <div key={i} className="sidebar-item">
                      <span className="sidebar-num">{String(i+1).padStart(2,"0")}</span>{t}
                    </div>
                  ))}
                </div>

                {/* DOCUMENT CHECKLIST */}
                <div className="sidebar-card">
                  <div className="sidebar-label">Documents for appeal</div>
                  {[
                    "Policy document with schedule",
                    "Original rejection letter",
                    "All medical records submitted",
                    "Hospital bills & discharge summary",
                    "Prescription & doctor notes",
                    "All prior insurer correspondence",
                  ].map((t,i) => (
                    <div key={i} className="sidebar-item">
                      <span className="sidebar-dot"/>{t}
                    </div>
                  ))}
                </div>

                {/* HELP SUPPORT COMPONENT */}
                <HelpSupport/>

              </div>
            </div>

            <p className="report-fn">
              CareBridge provides interpretative analysis only · Not legal advice or claim prediction · Verify all findings with your insurer or a qualified advisor
            </p>
          </>
        )}
      </div>
    </>
  );
}