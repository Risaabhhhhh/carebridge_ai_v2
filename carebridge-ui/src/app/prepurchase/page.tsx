"use client";

import { useState } from "react";
import { analyzePolicy, analyzePolicyFromFile } from "../lib/api";
import { PrePurchaseReport } from "../types/prepurchase";

import OverallRatingCard from "../components/dashboard/OverallRatingCard";
import ClauseHeatmap from "../components/dashboard/ClauseHeatmap";
import IRDAICompliancePanel from "../components/dashboard/IRDAICompliancePanel";
import BrokerTransparencyPanel from "../components/dashboard/BrokerTransparencyPanel";
import PolicyFlagsSection from "../components/dashboard/PolicyFlagsSection";
import ReportChat from "../components/layout/Reportchat";

const RISK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "High Risk":     { bg: "#fdf2f0", text: "#b94030", dot: "#d95f4b" },
  "Moderate Risk": { bg: "#fdf8ee", text: "#9a6c10", dot: "#c9920e" },
  "Low Risk":      { bg: "#eef5f0", text: "#2d6b3e", dot: "#3d8a52" },
  "Not Found":     { bg: "#f5f5f3", text: "#8a8a85", dot: "#c0bfba" },
};

const CLAUSE_LABELS: Record<string, string> = {
  waiting_period:             "Waiting Period",
  pre_existing_disease:       "Pre-existing Disease",
  room_rent_sublimit:         "Room Rent Sublimit",
  disease_specific_caps:      "Disease-Specific Caps",
  co_payment:                 "Co-payment",
  exclusions_clarity:         "Exclusions Clarity",
  claim_procedure_complexity: "Claim Procedure",
  sublimits_and_caps:         "Sublimits & Caps",
  restoration_benefit:        "Restoration Benefit",
  transparency_of_terms:      "Term Transparency",
};

export default function PrePurchasePage() {
  const [policyText, setPolicyText]   = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [report, setReport]           = useState<PrePurchaseReport | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [inputMode, setInputMode]     = useState<"text" | "file">("text");

  const handleAnalyze = async () => {
    setError(null);
    setReport(null);

    if (!policyText.trim() && !file) {
      setError("Paste policy text or upload a document to begin.");
      return;
    }

    setLoading(true);
    try {
      const data = file
        ? await analyzePolicyFromFile(file)
        : policyText.trim().length < 100
          ? (() => { setError("Policy text must be at least 100 characters."); setLoading(false); return null; })()
          : await analyzePolicy(policyText);

      if (data) {
        setReport(data);
        setTimeout(() => window.scrollTo({ top: 680, behavior: "smooth" }), 120);
      }
    } catch {
      setError("Analysis failed. Try pasting cleaner policy text or a higher-quality document.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "#2d6b3e" : score >= 55 ? "#9a6c10" : "#b94030";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400;500&display=swap');

        :root {
          --ink: #0f1512;
          --cream: #faf8f3;
          --paper: #f5f2ec;
          --sage: #2d5a3d;
          --sage-light: #4a7c5f;
          --sage-pale: #e8f0ea;
          --gold: #b8934a;
          --mist: #8fa896;
          --border: #ddd8ce;
        }

        * { box-sizing: border-box; }
        body { background: var(--cream); color: var(--ink); font-family: 'Outfit', sans-serif; font-weight: 300; }
        .serif { font-family: 'Cormorant Garamond', serif; }
        .mono  { font-family: 'DM Mono', monospace; }

        /* PAGE */
        .page { min-height: 100vh; padding: 100px 0 120px; }

        /* HEADER */
        .page-header {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 64px 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 1px solid var(--border);
          padding-bottom: 40px;
        }
        .page-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--mist);
          margin-bottom: 12px;
        }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 4vw, 54px);
          font-weight: 300;
          line-height: 1.08;
          color: var(--ink);
        }
        .page-title em { font-style: italic; color: var(--sage); }
        .page-sub {
          font-size: 14px;
          color: #5a6560;
          max-width: 440px;
          line-height: 1.7;
          text-align: right;
        }

        /* INPUT PANEL */
        .input-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 64px 0;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 32px;
          align-items: start;
        }

        .input-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 4px;
        }
        .input-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
        }
        .input-tab {
          flex: 1;
          padding: 16px 24px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--mist);
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .input-tab.active {
          color: var(--sage);
          border-bottom-color: var(--sage);
          background: var(--sage-pale);
        }
        .input-body { padding: 32px; }

        textarea {
          width: 100%;
          height: 240px;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: 2px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          line-height: 1.7;
          color: var(--ink);
          background: var(--cream);
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
        }
        textarea:focus { border-color: var(--sage); }
        textarea::placeholder { color: var(--mist); }

        .file-drop {
          height: 240px;
          border: 1px dashed var(--border);
          border-radius: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--cream);
        }
        .file-drop:hover { border-color: var(--sage); background: var(--sage-pale); }
        .file-drop-icon { font-size: 28px; opacity: 0.4; }
        .file-drop-label { font-size: 13px; color: var(--mist); }
        .file-drop-sub   { font-size: 11px; color: #c0bfba; font-family: 'DM Mono', monospace; }
        .file-name {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--sage);
          margin-top: 8px;
        }

        .analyze-btn {
          margin-top: 24px;
          width: 100%;
          padding: 18px;
          background: var(--sage);
          color: white;
          border: none;
          border-radius: 2px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .analyze-btn:hover:not(:disabled) { background: var(--sage-light); }
        .analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-msg {
          margin-top: 16px;
          padding: 14px 18px;
          background: #fdf2f0;
          border: 1px solid #f5c6c0;
          border-radius: 2px;
          font-size: 13px;
          color: #b94030;
          font-family: 'DM Mono', monospace;
        }

        /* SIDEBAR */
        .sidebar { display: flex; flex-direction: column; gap: 16px; }
        .sidebar-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 24px;
        }
        .sidebar-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--mist);
          margin-bottom: 16px;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #f0ede8;
          font-size: 12px;
          color: #5a6560;
        }
        .sidebar-item:last-child { border-bottom: none; }
        .sidebar-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--sage);
          flex-shrink: 0;
        }
        .sidebar-notice {
          background: var(--sage);
          border-radius: 4px;
          padding: 24px;
          color: rgba(255,255,255,0.75);
          font-size: 12px;
          line-height: 1.7;
        }
        .sidebar-notice strong {
          display: block;
          color: white;
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 400;
          margin-bottom: 8px;
        }

        /* DIVIDER */
        .results-divider {
          max-width: 1200px;
          margin: 64px auto 0;
          padding: 0 64px;
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .divider-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--mist);
          white-space: nowrap;
        }
        .divider-line { flex: 1; height: 1px; background: var(--border); }

        /* RESULTS GRID */
        .results-section {
          max-width: 1200px;
          margin: 40px auto 0;
          padding: 0 64px;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        .results-main { display: flex; flex-direction: column; gap: 20px; }
        .results-side { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 100px; }

        /* REPORT CARDS */
        .report-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .card-header {
          padding: 20px 28px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-title {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--mist);
        }
        .card-body { padding: 28px; }

        /* SCORE DISPLAY */
        .score-hero {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 32px;
          align-items: center;
        }
        .score-ring {
          width: 100px; height: 100px;
          position: relative;
          flex-shrink: 0;
        }
        .score-ring svg { transform: rotate(-90deg); }
        .score-ring-num {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .score-num-big {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 400;
          line-height: 1;
        }
        .score-num-sub {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--mist);
          margin-top: 2px;
        }
        .score-meta { display: flex; flex-direction: column; gap: 8px; }
        .score-rating {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 300;
          line-height: 1;
        }
        .score-confidence {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--mist);
        }
        .score-summary {
          margin-top: 20px;
          font-size: 13px;
          line-height: 1.7;
          color: #5a6560;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        /* CLAUSE GRID */
        .clause-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          background: var(--border);
          border: 1px solid var(--border);
        }
        .clause-cell {
          background: white;
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          transition: background 0.15s;
        }
        .clause-cell:hover { background: var(--cream); }
        .clause-name {
          font-size: 12px;
          color: #4a5550;
          line-height: 1.3;
        }
        .clause-badge {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 2px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* COMPLIANCE */
        .compliance-list { display: flex; flex-direction: column; gap: 2px; background: var(--border); border: 1px solid var(--border); }
        .compliance-item {
          background: white;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .compliance-label { font-size: 12px; color: #4a5550; }
        .compliance-check { font-size: 14px; }

        /* FLAGS */
        .flags-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: var(--border); border: 1px solid var(--border); }
        .flag-item { background: white; padding: 14px 18px; display: flex; gap: 10px; align-items: flex-start; font-size: 12px; line-height: 1.5; color: #4a5550; }
        .flag-icon { flex-shrink: 0; margin-top: 1px; }

        /* RISK INDEX */
        .risk-bar-wrap { margin-top: 4px; }
        .risk-bar-track { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .risk-bar-fill  { height: 100%; border-radius: 2px; transition: width 0.8s ease; }
        .risk-label { display: flex; justify-content: space-between; margin-bottom: 8px; font-family: 'DM Mono', monospace; font-size: 10px; color: var(--mist); letter-spacing: 0.08em; }

        /* CHECKLIST */
        .checklist { display: flex; flex-direction: column; gap: 2px; }
        .checklist-item { padding: 14px 0; border-bottom: 1px solid var(--border); display: flex; gap: 14px; align-items: flex-start; font-size: 13px; color: #4a5550; line-height: 1.5; }
        .checklist-item:last-child { border-bottom: none; }
        .check-num { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--mist); flex-shrink: 0; margin-top: 2px; }

        /* FOOTER NOTE */
        .report-footnote {
          max-width: 1200px;
          margin: 40px auto 0;
          padding: 0 64px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: var(--mist);
          letter-spacing: 0.06em;
          text-align: center;
          padding-bottom: 40px;
        }

        @media (max-width: 900px) {
          .page-header, .input-section, .results-divider, .results-section, .report-footnote { padding-left: 24px; padding-right: 24px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .page-sub { text-align: left; max-width: 100%; }
          .input-section, .results-section { grid-template-columns: 1fr; }
          .clause-grid, .flags-grid { grid-template-columns: 1fr; }
          .results-side { position: static; }
        }
      `}</style>

      <div className="page">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Pre-Purchase Analysis</div>
            <h1 className="page-title serif">
              Understand the policy<br />
              <em>before you commit</em>
            </h1>
          </div>
          <p className="page-sub">
            Paste policy wording or upload a document. CareBridge identifies structural risks,
            IRDAI compliance gaps, and financial exposure — clause by clause.
          </p>
        </div>

        {/* INPUT */}
        <div className="input-section">
          <div className="input-card">
            <div className="input-tabs">
              {(["text", "file"] as const).map((mode) => (
                <button
                  key={mode}
                  className={`input-tab ${inputMode === mode ? "active" : ""}`}
                  onClick={() => setInputMode(mode)}
                >
                  {mode === "text" ? "Paste Text" : "Upload Document"}
                </button>
              ))}
            </div>

            <div className="input-body">
              {inputMode === "text" ? (
                <textarea
                  value={policyText}
                  onChange={(e) => { setPolicyText(e.target.value); setFile(null); }}
                  placeholder="Paste the full policy wording here. The more complete the text, the more accurate the analysis..."
                />
              ) : (
                <>
                  <label htmlFor="fileUpload" className="file-drop">
                    <span className="file-drop-icon">⬆</span>
                    <span className="file-drop-label">
                      {file ? file.name : "Drop PDF or image here"}
                    </span>
                    <span className="file-drop-sub">PDF · JPG · PNG · OCR supported</span>
                  </label>
                  <input
                    id="fileUpload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFile(e.target.files[0]);
                        setPolicyText("");
                      }
                    }}
                  />
                  {file && <p className="file-name">Selected: {file.name}</p>}
                </>
              )}

              <button
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner" /> Analyzing policy...</>
                ) : (
                  "Run Analysis"
                )}
              </button>

              {error && <div className="error-msg">{error}</div>}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-label">What gets analysed</div>
              {[
                "10 clause risk categories",
                "7 IRDAI compliance markers",
                "Financial exposure indicators",
                "Structural & transparency risk",
                "Red flags & positive signals",
              ].map((t, i) => (
                <div key={i} className="sidebar-item">
                  <span className="sidebar-dot" />
                  {t}
                </div>
              ))}
            </div>
            <div className="sidebar-notice">
              <strong>Privacy first</strong>
              Your document is analysed in memory and never stored.
              Results are generated locally using an on-device model.
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {report && (
          <>
            <div className="results-divider">
              <span className="divider-label">Analysis Report</span>
              <span className="divider-line" />
              <span className="divider-label" style={{ color: "#3d8a52" }}>
                Confidence: {report.confidence}
              </span>
            </div>

            <div className="results-section">
              {/* MAIN COLUMN */}
              <div className="results-main">
        
                {/* ✅ AI REPORT CHAT */}
                <ReportChat reportData={report as any} context="prepurchase" />

                {/* SCORE CARD */}
                <div className="report-card">
                  <div className="card-header">
                    <span className="card-title">Policy Score</span>
                    <span className="card-title">{report.score_breakdown.adjusted_score}/100</span>
                  </div>
                  <div className="card-body">
                    <div className="score-hero">
                      <div className="score-ring">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#ede9e0" strokeWidth="8" />
                          <circle
                            cx="50" cy="50" r="42" fill="none"
                            stroke={scoreColor(report.score_breakdown.adjusted_score)}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            strokeDashoffset={`${2 * Math.PI * 42 * (1 - report.score_breakdown.adjusted_score / 100)}`}
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                          />
                        </svg>
                        <div className="score-ring-num">
                          <span className="score-num-big serif" style={{ color: scoreColor(report.score_breakdown.adjusted_score) }}>
                            {Math.round(report.score_breakdown.adjusted_score)}
                          </span>
                          <span className="score-num-sub">/ 100</span>
                        </div>
                      </div>
                      <div className="score-meta">
                        <div className="score-rating serif" style={{ color: scoreColor(report.score_breakdown.adjusted_score) }}>
                          {report.overall_policy_rating}
                        </div>
                        <div className="score-confidence">
                          Risk index · {report.score_breakdown.risk_index}
                        </div>
                        <div className="score-confidence">
                          Confidence · {report.confidence}
                        </div>
                      </div>
                    </div>
                    <p className="score-summary">{report.summary}</p>
                  </div>
                </div>

                {/* CLAUSE HEATMAP */}
                <div className="report-card">
                  <div className="card-header">
                    <span className="card-title">Clause Risk Assessment</span>
                    <span className="card-title">10 clauses</span>
                  </div>
                  <div className="clause-grid">
                    {Object.entries(report.clause_risk).map(([key, value]) => {
                      const colors = RISK_COLORS[value] || RISK_COLORS["Not Found"];
                      return (
                        <div key={key} className="clause-cell">
                          <span className="clause-name">{CLAUSE_LABELS[key] || key}</span>
                          <span
                            className="clause-badge"
                            style={{ background: colors.bg, color: colors.text }}
                            
                          >
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* IRDAI COMPLIANCE */}
                <div className="report-card">
                  <div className="card-header">
                    <span className="card-title">IRDAI Compliance</span>
                    <span className="card-title" style={{ color: "#2d6b3e" }}>
                      {report.irdai_compliance.compliance_rating}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="risk-bar-wrap">
                      <div className="risk-label">
                        <span>Compliance Score</span>
                        <span>{report.irdai_compliance.compliance_score} / 7</span>
                      </div>
                      <div className="risk-bar-track">
                        <div
                          className="risk-bar-fill"
                          style={{
                            width: `${(report.irdai_compliance.compliance_score / 7) * 100}%`,
                            background: "#2d5a3d",
                          }}
                        />
                      </div>
                    </div>

                    <div className="compliance-list" style={{ marginTop: 24 }}>
                      {Object.entries(report.irdai_compliance.compliance_flags)
                        .filter(([key]) => !key.startsWith("_"))
                        .map(([key, value]) => (
                          <div key={key} className="compliance-item">
                            <span className="compliance-label">
                              {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="compliance-check">
                              {value ? "✓" : "✗"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* SIDE COLUMN */}
              <div className="results-side">

                {/* BROKER RISK */}
                <div className="report-card">
                  <div className="card-header">
                    <span className="card-title">Structural Risk</span>
                    <span className="card-title">{report.broker_risk_analysis.structural_risk_level}</span>
                  </div>
                  <div className="card-body">
                    <div className="risk-bar-wrap" style={{ marginBottom: 20 }}>
                      <div className="risk-label">
                        <span>Risk Density</span>
                        <span>{report.broker_risk_analysis.risk_density_index}</span>
                      </div>
                      <div className="risk-bar-track">
                        <div
                          className="risk-bar-fill"
                          style={{
                            width: `${report.broker_risk_analysis.risk_density_index * 100}%`,
                            background: "#d95f4b",
                          }}
                        />
                      </div>
                    </div>
                    <div className="risk-bar-wrap">
                      <div className="risk-label">
                        <span>Transparency Score</span>
                        <span>{report.broker_risk_analysis.transparency_score}%</span>
                      </div>
                      <div className="risk-bar-track">
                        <div
                          className="risk-bar-fill"
                          style={{
                            width: `${report.broker_risk_analysis.transparency_score}%`,
                            background: "#2d5a3d",
                          }}
                        />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "#5a6560", lineHeight: 1.6, marginTop: 20, fontStyle: "italic" }}>
                      {report.broker_risk_analysis.recommendation}
                    </p>
                  </div>
                </div>

                {/* FLAGS */}
                {(report.red_flags.length > 0 || report.positive_flags.length > 0) && (
                  <div className="report-card">
                    <div className="card-header">
                      <span className="card-title">Signals</span>
                    </div>
                    <div style={{ padding: "0 0 8px" }}>
                      {report.red_flags.map((f, i) => (
                        <div key={i} className="flag-item" style={{ borderBottom: "1px solid #f0ede8" }}>
                          <span className="flag-icon" style={{ color: "#d95f4b" }}>▲</span>
                          {f}
                        </div>
                      ))}
                      {report.positive_flags.map((f, i) => (
                        <div key={i} className="flag-item" style={{ borderBottom: "1px solid #f0ede8" }}>
                          <span className="flag-icon" style={{ color: "#3d8a52" }}>◆</span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BUYER CHECKLIST */}
                <div className="report-card">
                  <div className="card-header">
                    <span className="card-title">Before You Buy</span>
                  </div>
                  <div className="card-body">
                    <div className="checklist">
                      {report.checklist_for_buyer.map((item, i) => (
                        <div key={i} className="checklist-item">
                          <span className="check-num">{String(i + 1).padStart(2, "0")}</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <p className="report-footnote">
              CareBridge provides interpretative analysis only · Results do not constitute legal or financial advice · Verify all findings with your insurer
            </p>
          </>
        )}
      </div>
    </>
  );
}