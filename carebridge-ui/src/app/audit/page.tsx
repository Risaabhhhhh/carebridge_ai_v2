"use client";

import { useState } from "react";
import { analyzeRejection } from "../lib/api";
import { AuditReport } from "../types/audit";
import ReportChat from "../components/layout/Reportchat";

const ALIGNMENT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  "Strong":       { color: "#b94030", bg: "#fdf2f0", label: "Strongly aligned — insurer's position is well-grounded" },
  "Partial":      { color: "#9a6c10", bg: "#fdf8ee", label: "Partially aligned — some grounds for appeal exist" },
  "Weak":         { color: "#2d6b3e", bg: "#eef5f0", label: "Weakly aligned — potential misapplication detected" },
  "Not Detected": { color: "#2d6b3e", bg: "#eef5f0", label: "No clause identified — insurer's position may lack basis" },
};

const APPEAL_CONFIG: Record<string, { color: string; bg: string }> = {
  "Strong":   { color: "#2d6b3e", bg: "#eef5f0" },
  "Moderate": { color: "#9a6c10", bg: "#fdf8ee" },
  "Weak":     { color: "#b94030", bg: "#fdf2f0" },
};

export default function AuditPage() {
  const [policyText,      setPolicyText]      = useState("");
  const [rejectionText,   setRejectionText]   = useState("");
  const [medicalText,     setMedicalText]     = useState("");
  const [userExplanation, setUserExplanation] = useState("");
  const [activeField,     setActiveField]     = useState<string | null>(null);

  const [report,  setReport]  = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!policyText.trim() || !rejectionText.trim()) {
      setError("Policy wording and rejection letter are required.");
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const data = await analyzeRejection({
        policy_text:            policyText,
        rejection_text:         rejectionText,
        medical_documents_text: medicalText,
        user_explanation:       userExplanation,
      });
      setReport(data);
      setTimeout(() => window.scrollTo({ top: 700, behavior: "smooth" }), 120);
    } catch {
      setError("Audit could not be processed. Ensure policy and rejection text are clear and complete.");
    } finally {
      setLoading(false);
    }
  };

  const appealCfg = report ? (APPEAL_CONFIG[report.appeal_strength.label] || APPEAL_CONFIG["Moderate"]) : null;
  const alignCfg  = report ? (ALIGNMENT_CONFIG[report.clause_alignment]   || ALIGNMENT_CONFIG["Partial"]) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400;500&display=swap');

        :root {
          --ink: #0f1512; --cream: #faf8f3; --paper: #f5f2ec;
          --sage: #2d5a3d; --sage-light: #4a7c5f; --sage-pale: #e8f0ea;
          --gold: #b8934a; --mist: #8fa896; --border: #ddd8ce;
        }
        * { box-sizing: border-box; }
        body { background: var(--cream); color: var(--ink); font-family: 'Outfit', sans-serif; font-weight: 300; }
        .serif { font-family: 'Cormorant Garamond', serif; }
        .mono  { font-family: 'DM Mono', monospace; }

        .page { min-height: 100vh; padding: 100px 0 120px; }

        /* HEADER */
        .page-header {
          max-width: 1200px; margin: 0 auto; padding: 48px 64px 40px;
          display: flex; justify-content: space-between; align-items: flex-end;
          border-bottom: 1px solid var(--border);
        }
        .page-eyebrow { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--mist); margin-bottom: 12px; }
        .page-title   { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 4vw, 54px); font-weight: 300; line-height: 1.08; }
        .page-title em { font-style: italic; color: var(--sage); }
        .page-sub { font-size: 14px; color: #5a6560; max-width: 400px; line-height: 1.7; text-align: right; }

        /* FORM */
        .form-section {
          max-width: 1200px; margin: 0 auto; padding: 56px 64px 0;
          display: grid; grid-template-columns: 1fr 300px; gap: 32px; align-items: start;
        }
        .form-card { background: white; border: 1px solid var(--border); border-radius: 4px; }

        /* FIELD ROWS */
        .field-row {
          border-bottom: 1px solid var(--border);
          transition: background 0.15s;
        }
        .field-row:last-of-type { border-bottom: none; }
        .field-row.active { background: #fafaf8; }

        .field-header {
          padding: 16px 28px;
          display: flex; justify-content: space-between; align-items: center;
          cursor: pointer;
        }
        .field-label-wrap { display: flex; align-items: center; gap: 14px; }
        .field-num {
          font-family: 'DM Mono', monospace; font-size: 10px;
          color: var(--mist); letter-spacing: 0.08em;
        }
        .field-label { font-size: 13px; color: var(--ink); font-weight: 400; }
        .field-required {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #c4622d; background: #fdf2f0;
          padding: 3px 8px; border-radius: 2px;
        }
        .field-optional {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--mist); background: var(--paper);
          padding: 3px 8px; border-radius: 2px;
        }
        .field-status { font-size: 11px; color: var(--sage); }

        .field-body { padding: 0 28px 20px; }

        textarea {
          width: 100%; padding: 16px; resize: vertical;
          border: 1px solid var(--border); border-radius: 2px;
          font-family: 'DM Mono', monospace; font-size: 12px; line-height: 1.7;
          color: var(--ink); background: var(--cream); outline: none;
          transition: border-color 0.2s;
        }
        textarea:focus { border-color: var(--sage); }
        textarea::placeholder { color: #c0bfba; }

        .form-footer { padding: 24px 28px; border-top: 1px solid var(--border); }

        .run-btn {
          width: 100%; padding: 18px;
          background: var(--sage); color: white;
          border: none; border-radius: 2px;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer; transition: background 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .run-btn:hover:not(:disabled) { background: var(--sage-light); }
        .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-msg {
          margin-top: 16px; padding: 14px 18px;
          background: #fdf2f0; border: 1px solid #f5c6c0; border-radius: 2px;
          font-family: 'DM Mono', monospace; font-size: 12px; color: #b94030;
        }

        /* SIDEBAR */
        .sidebar { display: flex; flex-direction: column; gap: 16px; }
        .sidebar-card { background: white; border: 1px solid var(--border); border-radius: 4px; padding: 24px; }
        .sidebar-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--mist); margin-bottom: 16px; }
        .sidebar-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f0ede8; font-size: 12px; color: #5a6560; line-height: 1.5; }
        .sidebar-item:last-child { border-bottom: none; }
        .sidebar-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--sage); flex-shrink: 0; margin-top: 5px; }
        .warning-card { background: #fdf8ee; border: 1px solid #e8d5a0; border-radius: 4px; padding: 20px 24px; }
        .warning-title { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #9a6c10; margin-bottom: 10px; }
        .warning-text  { font-size: 12px; color: #7a5810; line-height: 1.6; }

        /* DIVIDER */
        .results-divider { max-width: 1200px; margin: 64px auto 0; padding: 0 64px; display: flex; align-items: center; gap: 24px; }
        .divider-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mist); white-space: nowrap; }
        .divider-line { flex: 1; height: 1px; background: var(--border); }

        /* RESULTS */
        .results-section { max-width: 1200px; margin: 40px auto 0; padding: 0 64px; display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
        .results-main { display: flex; flex-direction: column; gap: 20px; }
        .results-side { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 100px; }

        .report-card { background: white; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .card-header { padding: 18px 28px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .card-title  { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mist); }
        .card-body   { padding: 28px; }

        /* APPEAL METER */
        .appeal-hero { display: flex; align-items: center; gap: 32px; }
        .appeal-pct {
          font-family: 'Cormorant Garamond', serif;
          font-size: 72px; font-weight: 300; line-height: 1;
          flex-shrink: 0;
        }
        .appeal-meta { flex: 1; }
        .appeal-label { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; margin-bottom: 12px; }
        .appeal-bar-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
        .appeal-bar-fill  { height: 100%; border-radius: 3px; transition: width 1s ease; }
        .appeal-reasoning { font-size: 13px; color: #5a6560; line-height: 1.6; font-style: italic; }

        /* CLAUSE BLOCK */
        .clause-block { display: flex; flex-direction: column; gap: 2px; }
        .clause-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 16px 20px; background: white; border: 1px solid var(--border); margin-bottom: -1px; }
        .clause-key   { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mist); margin-bottom: 4px; }
        .clause-value { font-size: 13px; color: var(--ink); line-height: 1.4; }
        .alignment-badge { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 2px; white-space: nowrap; flex-shrink: 0; }

        /* POINTS */
        .points-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); }
        .points-col { background: white; padding: 20px; }
        .points-col-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mist); margin-bottom: 16px; }
        .point-item { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f5f2ec; font-size: 12px; line-height: 1.5; color: #4a5550; }
        .point-item:last-child { border-bottom: none; }
        .point-icon { flex-shrink: 0; margin-top: 1px; }

        /* STEPS */
        .steps-list { display: flex; flex-direction: column; gap: 2px; }
        .step-item { display: flex; gap: 16px; align-items: flex-start; padding: 16px 20px; background: white; border: 1px solid var(--border); margin-bottom: -1px; }
        .step-num { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--mist); flex-shrink: 0; margin-top: 2px; letter-spacing: 0.06em; }
        .step-text { font-size: 13px; color: #4a5550; line-height: 1.5; }

        /* REGULATORY */
        .regulatory-body { padding: 24px 28px; font-size: 13px; line-height: 1.8; color: #4a5550; white-space: pre-line; }

        /* LOW CONFIDENCE BANNER */
        .low-conf-banner {
          padding: 18px 24px; background: #fdf8ee;
          border: 1px solid #e8d5a0; border-radius: 2px;
          display: flex; gap: 14px; align-items: flex-start;
          font-size: 13px; color: #7a5810; line-height: 1.5;
        }
        .low-conf-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

        /* CONFIDENCE CHIP */
        .conf-chip {
          font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 4px 12px; border-radius: 2px;
        }

        .report-footnote { max-width: 1200px; margin: 40px auto 0; padding: 0 64px 40px; font-family: 'DM Mono', monospace; font-size: 10px; color: var(--mist); letter-spacing: 0.06em; text-align: center; }

        @media (max-width: 900px) {
          .page-header, .form-section, .results-divider, .results-section, .report-footnote { padding-left: 24px; padding-right: 24px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .page-sub { text-align: left; max-width: 100%; }
          .form-section, .results-section { grid-template-columns: 1fr; }
          .points-grid { grid-template-columns: 1fr; }
          .results-side { position: static; }
          .appeal-hero { flex-direction: column; gap: 16px; }
        }
      `}</style>

      <div className="page">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Post-Rejection Audit</div>
            <h1 className="page-title serif">
              Understand the rejection.<br />
              <em>Build your appeal.</em>
            </h1>
          </div>
          <p className="page-sub">
            Paste the policy wording, rejection letter, and any medical records.
            CareBridge identifies the clause applied, documentation gaps, and your
            appeal strength — with IRDAI regulatory context.
          </p>
        </div>

        {/* FORM */}
        <div className="form-section">
          <div className="form-card">

            {/* FIELD 1 — POLICY */}
            <div className={`field-row ${activeField === "policy" ? "active" : ""}`}>
              <div className="field-header" onClick={() => setActiveField(activeField === "policy" ? null : "policy")}>
                <div className="field-label-wrap">
                  <span className="field-num">01</span>
                  <span className="field-label">Policy Wording</span>
                  <span className="field-required">Required</span>
                </div>
                {policyText.trim() && <span className="field-status">✓ {policyText.trim().length} chars</span>}
              </div>
              {(activeField === "policy" || !policyText) && (
                <div className="field-body">
                  <textarea
                    rows={7}
                    placeholder="Paste the relevant sections of your policy document..."
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    onFocus={() => setActiveField("policy")}
                  />
                </div>
              )}
            </div>

            {/* FIELD 2 — REJECTION */}
            <div className={`field-row ${activeField === "rejection" ? "active" : ""}`}>
              <div className="field-header" onClick={() => setActiveField(activeField === "rejection" ? null : "rejection")}>
                <div className="field-label-wrap">
                  <span className="field-num">02</span>
                  <span className="field-label">Rejection Letter</span>
                  <span className="field-required">Required</span>
                </div>
                {rejectionText.trim() && <span className="field-status">✓ {rejectionText.trim().length} chars</span>}
              </div>
              {(activeField === "rejection" || !rejectionText) && (
                <div className="field-body">
                  <textarea
                    rows={6}
                    placeholder="Paste the insurer's rejection letter or claim repudiation notice..."
                    value={rejectionText}
                    onChange={(e) => setRejectionText(e.target.value)}
                    onFocus={() => setActiveField("rejection")}
                  />
                </div>
              )}
            </div>

            {/* FIELD 3 — MEDICAL */}
            <div className={`field-row ${activeField === "medical" ? "active" : ""}`}>
              <div className="field-header" onClick={() => setActiveField(activeField === "medical" ? null : "medical")}>
                <div className="field-label-wrap">
                  <span className="field-num">03</span>
                  <span className="field-label">Medical Records Summary</span>
                  <span className="field-optional">Optional</span>
                </div>
                {medicalText.trim() && <span className="field-status">✓ Added</span>}
              </div>
              {activeField === "medical" && (
                <div className="field-body">
                  <textarea
                    rows={5}
                    placeholder="Paste discharge summary, diagnosis, treatment dates, doctor notes..."
                    value={medicalText}
                    onChange={(e) => setMedicalText(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* FIELD 4 — CONTEXT */}
            <div className={`field-row ${activeField === "context" ? "active" : ""}`}>
              <div className="field-header" onClick={() => setActiveField(activeField === "context" ? null : "context")}>
                <div className="field-label-wrap">
                  <span className="field-num">04</span>
                  <span className="field-label">Your Explanation</span>
                  <span className="field-optional">Optional</span>
                </div>
                {userExplanation.trim() && <span className="field-status">✓ Added</span>}
              </div>
              {activeField === "context" && (
                <div className="field-body">
                  <textarea
                    rows={4}
                    placeholder="Add context — when you were diagnosed, when you purchased the policy, any prior communications..."
                    value={userExplanation}
                    onChange={(e) => setUserExplanation(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="form-footer">
              <button className="run-btn" onClick={handleAnalyze} disabled={loading}>
                {loading
                  ? <><span className="spinner" /> Running audit...</>
                  : "Run Claim Audit"}
              </button>
              {error && <div className="error-msg">{error}</div>}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-label">What this audit covers</div>
              {[
                "Clause identification from policy text",
                "Pre-existing disease contradiction check",
                "Waiting period evidence analysis",
                "Documentation gap severity",
                "Appeal strength scoring",
                "IRDAI regulatory references",
                "Step-by-step reapplication guide",
              ].map((t, i) => (
                <div key={i} className="sidebar-item">
                  <span className="sidebar-dot" />
                  {t}
                </div>
              ))}
            </div>
            <div className="warning-card">
              <div className="warning-title">Important</div>
              <p className="warning-text">
                This audit interprets submitted text only. Results improve significantly
                with complete policy wording and the full rejection letter — not summaries.
              </p>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {report && (
          <>
            <div className="results-divider">
              <span className="divider-label">Audit Report</span>
              <span className="divider-line" />
              <span
                className="conf-chip"
                style={{
                  background: report.confidence === "High" ? "#eef5f0" : report.confidence === "Low" ? "#fdf2f0" : "#fdf8ee",
                  color:      report.confidence === "High" ? "#2d6b3e" : report.confidence === "Low" ? "#b94030" : "#9a6c10",
                }}
              >
                Confidence: {report.confidence}
              </span>
            </div>

            <div className="results-section">
              {/* MAIN */}
              <div className="results-main">

                <ReportChat reportData={report as any} context="prepurchase" />

                {/* LOW CONFIDENCE BANNER */}
                {report.confidence === "Low" && (
                  <div className="low-conf-banner">
                    <span className="low-conf-icon">⚠</span>
                    <span>
                      Automated interpretation has low confidence for this case.
                      The provided documents may be incomplete or unclear.
                      Request written clarification from your insurer before proceeding.
                      {report.system_notice && ` ${report.system_notice}`}
                    </span>
                  </div>
                )}

                {/* APPEAL STRENGTH */}
                <div className="report-card">
                  <div className="card-header">
                    <span className="card-title">Appeal Strength Index</span>
                    <span className="card-title">{report.appeal_strength.percentage}%</span>
                  </div>
                  <div className="card-body">
                    <div className="appeal-hero">
                      <div
                        className="appeal-pct serif"
                        style={{ color: appealCfg?.color }}
                      >
                        {report.appeal_strength.percentage}
                        <span style={{ fontSize: 28, opacity: 0.4 }}>%</span>
                      </div>
                      <div className="appeal-meta">
                        <div className="appeal-label serif" style={{ color: appealCfg?.color }}>
                          {report.appeal_strength.label}
                        </div>
                        <div className="appeal-bar-track">
                          <div
                            className="appeal-bar-fill"
                            style={{
                              width: `${report.appeal_strength.percentage}%`,
                              background: appealCfg?.color,
                            }}
                          />
                        </div>
                        <p className="appeal-reasoning">{report.appeal_strength.reasoning}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CLAUSE ANALYSIS */}
                <div className="report-card">
                  <div className="card-header">
                    <span className="card-title">Clause Analysis</span>
                    <span
                      className="alignment-badge"
                      style={{ background: alignCfg?.bg, color: alignCfg?.color }}
                    >
                      {report.clause_alignment}
                    </span>
                  </div>
                  <div className="clause-block" style={{ padding: "0" }}>
                    {[
                      { key: "Rejection Basis",   value: report.why_rejected },
                      { key: "Clause Detected",   value: report.policy_clause_detected },
                      { key: "Alignment",         value: alignCfg?.label || report.clause_alignment },
                      { key: "Case Summary",      value: report.case_summary },
                    ].map(({ key, value }) => (
                      <div key={key} className="clause-row">
                        <div>
                          <div className="clause-key">{key}</div>
                          <div className="clause-value">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STRONG / WEAK POINTS */}
                <div className="report-card">
                  <div className="card-header">
                    <span className="card-title">Case Assessment</span>
                  </div>
                  <div className="points-grid">
                    <div className="points-col">
                      <div className="points-col-label" style={{ color: "#2d6b3e" }}>Points in your favour</div>
                      {report.strong_points.length > 0
                        ? report.strong_points.map((p, i) => (
                            <div key={i} className="point-item">
                              <span className="point-icon" style={{ color: "#3d8a52" }}>◆</span>
                              {p}
                            </div>
                          ))
                        : <div className="point-item" style={{ color: "#c0bfba" }}>None identified</div>
                      }
                    </div>
                    <div className="points-col" style={{ borderLeft: "1px solid var(--border)" }}>
                      <div className="points-col-label" style={{ color: "#b94030" }}>Challenges to address</div>
                      {report.weak_points.map((p, i) => (
                        <div key={i} className="point-item">
                          <span className="point-icon" style={{ color: "#d95f4b" }}>▲</span>
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* REAPPLICATION STEPS */}
                {report.reapplication_possible && report.reapplication_steps.length > 0 && (
                  <div className="report-card">
                    <div className="card-header">
                      <span className="card-title">Reapplication Steps</span>
                      <span className="card-title" style={{ color: "#2d6b3e" }}>
                        {report.reapplication_steps.length} actions
                      </span>
                    </div>
                    <div className="steps-list">
                      {report.reapplication_steps.map((step, i) => (
                        <div key={i} className="step-item">
                          <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                          <span className="step-text">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REGULATORY */}
                {report.regulatory_considerations && (
                  <div className="report-card">
                    <div className="card-header">
                      <span className="card-title">IRDAI Regulatory Context</span>
                    </div>
                    <div className="regulatory-body">
                      {report.regulatory_considerations}
                    </div>
                  </div>
                )}
              </div>

              {/* SIDE */}
              <div className="results-side">

                {/* QUICK SUMMARY */}
                <div className="report-card" style={{ background: "var(--sage)", border: "none" }}>
                  <div className="card-body">
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>
                      Quick Summary
                    </div>
                    {[
                      { label: "Appeal Strength", value: `${report.appeal_strength.label} (${report.appeal_strength.percentage}%)` },
                      { label: "Clause Alignment", value: report.clause_alignment },
                      { label: "Can Reapply",     value: report.reapplication_possible ? "Yes" : "Unlikely" },
                      { label: "Confidence",      value: report.confidence },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{label}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "white", letterSpacing: "0.04em" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NEXT STEPS GUIDE */}
                <div className="sidebar-card">
                  <div className="sidebar-label">Escalation path</div>
                  {[
                    "File written complaint with insurer's GRO",
                    "Escalate to IRDAI IGMS if unresolved in 15 days",
                    "File before Insurance Ombudsman within 1 year",
                    "Approach Consumer Forum if needed",
                  ].map((t, i) => (
                    <div key={i} className="sidebar-item">
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--mist)", flexShrink: 0 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {t}
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
                  ].map((t, i) => (
                    <div key={i} className="sidebar-item">
                      <span className="sidebar-dot" />
                      {t}
                    </div>
                  ))}
                </div>

              </div>
            </div>

            <p className="report-footnote">
              CareBridge provides interpretative analysis only · Not legal advice or claim prediction · Verify all findings with your insurer or a qualified advisor
            </p>
          </>
        )}
      </div>
    </>
  );
}