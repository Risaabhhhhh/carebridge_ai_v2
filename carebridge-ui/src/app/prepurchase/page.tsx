"use client";

import { useState } from "react";
import { analyzePolicy, analyzePolicyFromFile } from "../lib/api";
import { PrePurchaseReport } from "../types/prepurchase";
import ReportChat from "../components/layout/Reportchat";

/* ── risk colour tokens ──────────────────────────────────────────── */
const RISK: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  "High Risk":     { bg: "#f5d0cc", color: "#8c1f14", border: "#e08070", dot: "#c94030" },
  "Moderate Risk": { bg: "#faecd0", color: "#7a4e08", border: "#e0b870", dot: "#c9920e" },
  "Low Risk":      { bg: "#d6eddc", color: "#1e5c2e", border: "#9dd0aa", dot: "#3d8a52" },
  "Not Found":     { bg: "#eeebe4", color: "#7a7870", border: "#c8c2b4", dot: "#a8a498" },
};

const CLAUSE_META: Record<string, { label: string; desc: string }> = {
  waiting_period:             { label: "Waiting Period",         desc: "How long before claims become valid" },
  pre_existing_disease:       { label: "Pre-existing Disease",   desc: "Coverage for conditions diagnosed before policy" },
  room_rent_sublimit:         { label: "Room Rent Sublimit",      desc: "Cap on daily hospital room cost" },
  disease_specific_caps:      { label: "Disease-Specific Caps",  desc: "Per-disease limits below sum insured" },
  co_payment:                 { label: "Co-payment",             desc: "Policyholder's share of each claim" },
  exclusions_clarity:         { label: "Exclusions Clarity",     desc: "How clearly exclusions are written" },
  claim_procedure_complexity: { label: "Claim Procedure",        desc: "Steps and timelines for filing claims" },
  sublimits_and_caps:         { label: "Sublimits & Caps",       desc: "Other per-event or per-item limits" },
  restoration_benefit:        { label: "Restoration Benefit",    desc: "Whether exhausted SI is replenished" },
  transparency_of_terms:      { label: "Term Transparency",      desc: "Clarity of overall policy language" },
};

const scoreColor = (s: number) =>
  s >= 80 ? "#1e5c2e" : s >= 55 ? "#7a4e08" : "#8c1f14";

// compliance_flags values can be boolean or string[] — normalise to boolean
const flagIsTrue = (v: boolean | string[]): boolean =>
  typeof v === "boolean" ? v : Array.isArray(v) && v.length > 0;

export default function PrePurchasePage() {
  const [policyText, setPolicyText] = useState("");
  const [file,       setFile]       = useState<File | null>(null);
  const [report,     setReport]     = useState<PrePurchaseReport | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [inputMode,  setInputMode]  = useState<"text" | "file">("text");

  const handleAnalyze = async () => {
    setError(null); setReport(null);
    if (!policyText.trim() && !file) { setError("Paste policy text or upload a document to begin."); return; }
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
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');

        :root {
          --ink: #0a0f0d; --ink2: #1a2018; --cream: #f0ece3; --paper: #e8e3d8;
          --sage: #1e5c2e; --sage2: #2d7a42; --sage-pale: #d6eddc;
          --mist: #5a7060; --border: #c8c2b4;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--cream); color: var(--ink2); font-family: 'Outfit', sans-serif; font-weight: 400; -webkit-font-smoothing: antialiased; }
        .page { min-height: 100vh; padding: 100px 0 120px; }

        /* ── HEADER ──────────────────────────────────── */
        .page-hdr {
          max-width: 1200px; margin: 0 auto; padding: 52px 64px 44px;
          display: flex; justify-content: space-between; align-items: flex-end;
          border-bottom: 2px solid var(--border);
        }
        .page-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; color: var(--mist); margin-bottom: 14px; }
        .page-title   { font-family: 'Cormorant Garamond', serif; font-size: clamp(38px,4vw,56px); font-weight: 500; line-height: 1.06; color: var(--ink); }
        .page-title em { font-style: italic; color: var(--sage); }
        .page-sub { font-size: 14px; font-weight: 400; color: var(--ink2); max-width: 440px; line-height: 1.8; text-align: right; }

        /* ── INPUT SECTION ───────────────────────────── */
        .input-section {
          max-width: 1200px; margin: 0 auto; padding: 56px 64px 0;
          display: grid; grid-template-columns: 1fr 300px; gap: 32px; align-items: start;
        }
        .input-card { background: white; border: 1px solid var(--border); border-radius: 4px; }
        .input-tabs { display: flex; border-bottom: 1px solid var(--border); }
        .input-tab {
          flex: 1; padding: 17px 24px; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase; border: none; background: none; cursor: pointer;
          color: var(--mist); transition: all .2s; border-bottom: 2.5px solid transparent; margin-bottom: -1px;
        }
        .input-tab.active { color: var(--sage); border-bottom-color: var(--sage); background: #f5f0e8; }
        .input-body { padding: 32px; }

        textarea {
          width: 100%; height: 240px; padding: 20px; border: 1px solid var(--border); border-radius: 2px;
          font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 400; line-height: 1.75;
          color: var(--ink); background: var(--cream); resize: vertical; outline: none; transition: border-color .2s;
        }
        textarea:focus { border-color: var(--sage); }
        textarea::placeholder { color: #9a9890; }
        .char-count { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; color: var(--mist); margin-top: 10px; letter-spacing: .06em; }

        .file-drop {
          height: 240px; border: 1.5px dashed var(--border); border-radius: 2px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 14px; cursor: pointer; transition: all .2s; padding: 24px; text-align: center;
        }
        .file-drop:hover { border-color: var(--sage); background: #f5f0e8; }
        .file-drop.has-file { border-color: var(--sage); border-style: solid; background: #f0f8f2; }
        .file-drop-icon { font-size: 28px; color: var(--mist); }
        .file-drop-text { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; letter-spacing: .08em; text-transform: uppercase; color: var(--mist); }
        .file-drop-sub  { font-size: 12px; font-weight: 400; color: var(--mist); }
        .file-name { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; color: var(--sage); }
        input[type="file"] { display: none; }

        .analyze-btn {
          width: 100%; padding: 18px; background: var(--sage); color: #e8f0ea; border: none; border-radius: 2px;
          font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; letter-spacing: .14em;
          text-transform: uppercase; cursor: pointer; transition: background .2s;
          display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 16px;
        }
        .analyze-btn:hover:not(:disabled) { background: var(--sage2); }
        .analyze-btn:disabled { opacity: .5; cursor: not-allowed; }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg) } }
        .error-msg { margin-top: 16px; padding: 14px 18px; background: #f5d0cc; border: 1px solid #e08070; border-radius: 2px; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 400; color: #8c1f14; }

        /* ── INPUT SIDEBAR ───────────────────────────── */
        .sidebar { display: flex; flex-direction: column; gap: 16px; }
        .sidebar-card { background: white; border: 1px solid var(--border); border-radius: 4px; padding: 24px; }
        .sidebar-label { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--mist); margin-bottom: 16px; }
        .sidebar-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #eee8e0; font-size: 13px; font-weight: 400; color: var(--ink2); line-height: 1.55; }
        .sidebar-item:last-child { border-bottom: none; }
        .sidebar-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--sage); flex-shrink: 0; margin-top: 5px; }
        .privacy-card { background: var(--ink); border-radius: 4px; padding: 22px 24px; }
        .privacy-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 500; color: #d8eedd; margin-bottom: 10px; }
        .privacy-text { font-size: 13px; font-weight: 400; color: rgba(255,255,255,.5); line-height: 1.7; }
        .tips-card { background: #f0f8f2; border: 1px solid #9dd0aa; border-radius: 4px; padding: 20px 24px; }
        .tips-title { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: #1e5c2e; margin-bottom: 10px; }
        .tips-item { font-size: 13px; font-weight: 400; color: #143a1e; line-height: 1.65; padding: 5px 0; border-bottom: 1px solid rgba(30,92,46,.1); }
        .tips-item:last-child { border-bottom: none; }

        /* ── RESULTS DIVIDER ─────────────────────────── */
        .results-divider { max-width: 1200px; margin: 64px auto 0; padding: 0 64px; display: flex; align-items: center; gap: 20px; }
        .divider-label { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: .15em; text-transform: uppercase; color: var(--mist); white-space: nowrap; }
        .divider-line  { flex: 1; height: 1px; background: var(--border); }
        .conf-chip     { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; padding: 5px 13px; border-radius: 2px; white-space: nowrap; }

        /* ── RESULTS GRID ─────────────────────────────── */
        .results-layout { max-width: 1200px; margin: 40px auto 0; padding: 0 64px; display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
        .results-main   { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .results-side   { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 100px; min-width: 0; }

        /* ── REPORT CARDS ─────────────────────────────── */
        .rcard { background: white; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .rcard-hdr { padding: 15px 28px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #f5f0e8; }
        .rcard-title { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: .13em; text-transform: uppercase; color: #4a5248; }
        .rcard-body { padding: 28px; }

        /* ── SCORE CARD ───────────────────────────────── */
        .score-hero { display: grid; grid-template-columns: 110px 1fr; gap: 32px; align-items: center; }
        .score-ring { width: 110px; height: 110px; position: relative; flex-shrink: 0; }
        .score-ring svg { transform: rotate(-90deg); }
        .score-ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .score-big { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; line-height: 1; }
        .score-sub { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; letter-spacing: .1em; color: var(--mist); margin-top: 3px; }
        .score-meta { display: flex; flex-direction: column; gap: 10px; }
        .score-rating { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 500; line-height: 1; }
        .score-row { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; letter-spacing: .06em; color: var(--mist); }
        .score-summary { margin-top: 20px; font-size: 14px; font-weight: 400; line-height: 1.8; color: var(--ink2); padding-top: 20px; border-top: 1px solid #eee8e0; font-style: italic; }

        /* score indicator note — honest framing */
        .score-indicator-note {
          margin-top: 16px; padding: 9px 14px;
          background: #fdf8ec; border: 1px solid #ddd090; border-radius: 3px;
          font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: .04em;
          color: #7a5c10; line-height: 1.65;
        }

        /* ── CLAUSE HEATMAP ───────────────────────────── */
        .clause-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .clause-cell { padding: 16px 22px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border-bottom: 1px solid #eee8e0; transition: background .15s; }
        .clause-cell:hover { background: #faf7f2; }
        .clause-cell:nth-last-child(-n+2) { border-bottom: none; }
        .clause-cell:nth-child(even) { border-left: 1px solid #eee8e0; }
        .clause-name { font-size: 13px; font-weight: 400; color: var(--ink2); line-height: 1.35; }
        .clause-desc { font-size: 11px; font-weight: 400; color: var(--mist); margin-top: 3px; line-height: 1.4; }
        .clause-badge {
          font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500; letter-spacing: .08em;
          text-transform: uppercase; padding: 4px 10px; border-radius: 2px; white-space: nowrap; flex-shrink: 0;
          margin-top: 2px;
        }

        /* ── CLAUSE SUMMARY BAR ───────────────────────── */
        .clause-summary { display: flex; gap: 0; border-top: 1px solid #eee8e0; }
        .clause-summary-seg { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; border-right: 1px solid #eee8e0; }
        .clause-summary-seg:last-child { border-right: none; }
        .clause-summary-count { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; line-height: 1; }
        .clause-summary-label { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; }

        /* ── IRDAI COMPLIANCE ─────────────────────────── */
        .compliance-bar-wrap { margin-bottom: 20px; }
        .bar-label { display: flex; justify-content: space-between; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: .08em; color: var(--mist); margin-bottom: 8px; }
        .bar-track { height: 7px; background: #eee8e0; border-radius: 4px; overflow: hidden; }
        .bar-fill  { height: 100%; border-radius: 4px; transition: width .8s ease; }
        .compliance-flags { display: flex; flex-direction: column; gap: 1px; background: #eee8e0; border: 1px solid #eee8e0; margin-top: 4px; }
        .compliance-row { background: white; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .compliance-key { font-size: 13px; font-weight: 400; color: var(--ink2); }
        .compliance-val { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; }

        /* ── BROKER RISK ──────────────────────────────── */
        .broker-bars { display: flex; flex-direction: column; gap: 16px; }
        .broker-counts { display: flex; gap: 0; border: 1px solid #eee8e0; border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
        .broker-count-seg { flex: 1; padding: 12px 16px; display: flex; flex-direction: column; gap: 3px; }
        .broker-count-seg + .broker-count-seg { border-left: 1px solid #eee8e0; }
        .broker-count-num { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; line-height: 1; }
        .broker-count-lbl { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; color: var(--mist); }
        .broker-reco { margin-top: 20px; padding-top: 18px; border-top: 1px solid #eee8e0; font-size: 14px; font-weight: 400; color: var(--ink2); line-height: 1.75; font-style: italic; }
        .broker-insufficient { margin-bottom: 16px; padding: 10px 14px; background: #faecd0; border: 1px solid #e0b870; border-radius: 3px; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: .04em; color: #7a4e08; line-height: 1.6; }

        /* ── FLAGS ────────────────────────────────────── */
        .flags-list { display: flex; flex-direction: column; }
        .flag-item  { display: flex; gap: 12px; align-items: flex-start; padding: 12px 20px; border-bottom: 1px solid #eee8e0; font-size: 13px; font-weight: 400; color: var(--ink2); line-height: 1.55; }
        .flag-item:last-child { border-bottom: none; }
        .flag-icon { flex-shrink: 0; font-size: 11px; margin-top: 2px; }

        /* ── LOW CONFIDENCE ───────────────────────────── */
        .low-conf { padding: 18px 24px; background: #faecd0; border: 1px solid #e0b870; border-radius: 2px; display: flex; gap: 14px; align-items: flex-start; font-size: 14px; font-weight: 400; color: #5a3808; line-height: 1.65; }

        /* ── DARK SUMMARY ─────────────────────────────── */
        .dark-summary { background: var(--ink); border-radius: 4px; padding: 24px; }
        .dark-summary-label { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.35); margin-bottom: 16px; }
        .dark-summary-row   { padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,.08); display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .dark-summary-row:last-child { border-bottom: none; }
        .dark-summary-key { font-size: 13px; font-weight: 400; color: rgba(255,255,255,.5); }
        .dark-summary-val { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: #e8f0ea; letter-spacing: .04em; text-align: right; }

        /* ── CHECKLIST ────────────────────────────────── */
        .checklist-card { background: white; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .checklist-hdr  { padding: 14px 24px; border-bottom: 1px solid var(--border); background: #f5f0e8; }
        .checklist-hdr-label { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: .13em; text-transform: uppercase; color: #4a5248; }
        .checklist-item { display: flex; gap: 14px; align-items: flex-start; padding: 13px 22px; border-bottom: 1px solid #eee8e0; font-size: 13px; font-weight: 400; color: var(--ink2); line-height: 1.55; }
        .checklist-item:last-child { border-bottom: none; }
        .check-icon { flex-shrink: 0; color: var(--sage); font-size: 12px; font-weight: 600; margin-top: 1px; }

        /* ── FOOTNOTE ─────────────────────────────────── */
        .report-fn {
          max-width: 1200px; margin: 40px auto 0; padding: 18px 64px 40px;
          font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400;
          color: var(--mist); letter-spacing: .05em; text-align: center; line-height: 2;
          border-top: 1px solid #e8e3d8;
        }
        .report-fn strong { color: #3a4038; letter-spacing: .08em; }

        /* ── RESPONSIVE ───────────────────────────────── */
        @media(max-width: 900px) {
          .page-hdr, .input-section, .results-divider, .results-layout, .report-fn { padding-left: 24px; padding-right: 24px; }
          .page-hdr { flex-direction: column; align-items: flex-start; gap: 16px; }
          .page-sub { text-align: left; max-width: 100%; }
          .input-section, .results-layout { grid-template-columns: 1fr; }
          .clause-grid { grid-template-columns: 1fr; }
          .clause-cell:nth-child(even) { border-left: none; }
          .clause-cell:nth-last-child(-n+2) { border-bottom: 1px solid #eee8e0; }
          .clause-cell:last-child { border-bottom: none; }
          .results-side { position: static; }
          .score-hero { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page">

        {/* ── HEADER ── */}
        <div className="page-hdr">
          <div>
            <div className="page-eyebrow">Pre-Purchase Analysis</div>
            <h1 className="page-title">
              Read the fine print.<br /><em>Before you sign.</em>
            </h1>
          </div>
          <p className="page-sub">
            Paste policy wording or upload a document. CareBridge classifies
            10 risk clauses, evaluates IRDAI compliance, and scores structural
            risk — clause by clause.
          </p>
        </div>

        {/* ── INPUT ── */}
        <div className="input-section">
          <div className="input-card">
            <div className="input-tabs">
              {(["text", "file"] as const).map(mode => (
                <button key={mode}
                  className={`input-tab ${inputMode === mode ? "active" : ""}`}
                  onClick={() => setInputMode(mode)}>
                  {mode === "text" ? "Paste Text" : "Upload Document"}
                </button>
              ))}
            </div>
            <div className="input-body">
              {inputMode === "text" ? (
                <>
                  <textarea
                    placeholder="Paste policy wording here — include sections on waiting periods, exclusions, sublimits, co-payment, and claim procedures for best results..."
                    value={policyText}
                    onChange={e => { setPolicyText(e.target.value); setFile(null); }}
                  />
                  <div className="char-count">{policyText.length.toLocaleString()} characters · min 100 required</div>
                </>
              ) : (
                <>
                  <label htmlFor="fileUpload" className={`file-drop ${file ? "has-file" : ""}`}>
                    {file ? (
                      <>
                        <span className="file-drop-icon" style={{ color: "var(--sage)" }}>✓</span>
                        <span className="file-name">{file.name}</span>
                        <span className="file-drop-sub">{(file.size / 1024).toFixed(0)} KB · click to change</span>
                      </>
                    ) : (
                      <>
                        <span className="file-drop-icon">⬆</span>
                        <span className="file-drop-text">Drop file or click to upload</span>
                        <span className="file-drop-sub">PDF · PNG · JPG · TXT — max 10 MB</span>
                      </>
                    )}
                  </label>
                  <input id="fileUpload" type="file" accept=".pdf,.jpg,.jpeg,.png,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPolicyText(""); } }} />
                </>
              )}
              <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
                {loading ? <><span className="spinner" />Analysing policy...</> : "Run Policy Analysis"}
              </button>
              {error && <div className="error-msg">{error}</div>}
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-label">10 Clauses Analysed</div>
              {Object.values(CLAUSE_META).map((c, i) => (
                <div key={i} className="sidebar-item"><span className="sidebar-dot" />{c.label}</div>
              ))}
            </div>
            <div className="tips-card">
              <div className="tips-title">For best results</div>
              {[
                "Include the full policy schedule and benefit table",
                "Paste exclusions and waiting period sections",
                "Add co-payment and room rent clauses if available",
              ].map((t, i) => (
                <div key={i} className="tips-item">{t}</div>
              ))}
            </div>
            <div className="privacy-card">
              <div className="privacy-title">Privacy first</div>
              <p className="privacy-text">Your document is analysed in memory and never stored. Results are generated locally using an on-device model.</p>
            </div>
          </div>
        </div>

        {/* ── RESULTS ── */}
        {report && (
          <>
            <div className="results-divider">
              <span className="divider-label">Analysis Report</span>
              <span className="divider-line" />
              <span className="conf-chip" style={{
                background: report.confidence === "High" ? "#d6eddc" : report.confidence === "Low" ? "#f5d0cc" : "#faecd0",
                color:      report.confidence === "High" ? "#1e5c2e" : report.confidence === "Low" ? "#8c1f14" : "#7a4e08",
              }}>Confidence: {report.confidence}</span>
            </div>

            <div className="results-layout">

              {/* ── MAIN COLUMN ── */}
              <div className="results-main">

                {report.confidence === "Low" && (
                  <div className="low-conf">
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠</span>
                    <span>Low confidence — submitted text may be insufficient. Include full clause sections for a complete analysis.</span>
                  </div>
                )}

                {/* AI CHAT — no cast needed, PrePurchaseReport is fully typed */}
                <ReportChat reportData={report} context="prepurchase" />

                {/* POLICY ASSESSMENT CARD
                    Renamed from "Policy Score" — score ring kept (it's a
                    policy quality metric, not a legal prediction), but an
                    indicator note is added to frame it honestly */}
                <div className="rcard">
                  <div className="rcard-hdr">
                    <span className="rcard-title">Policy Assessment</span>
                    <span className="rcard-title">{Math.round(report.score_breakdown.adjusted_score)} / 100</span>
                  </div>
                  <div className="rcard-body">
                    <div className="score-hero">
                      <div className="score-ring">
                        <svg width="110" height="110" viewBox="0 0 110 110">
                          <circle cx="55" cy="55" r="46" fill="none" stroke="#eee8e0" strokeWidth="9" />
                          <circle cx="55" cy="55" r="46" fill="none"
                            stroke={scoreColor(report.score_breakdown.adjusted_score)}
                            strokeWidth="9" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 46}`}
                            strokeDashoffset={`${2 * Math.PI * 46 * (1 - report.score_breakdown.adjusted_score / 100)}`}
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                          />
                        </svg>
                        <div className="score-ring-label">
                          <span className="score-big" style={{ color: scoreColor(report.score_breakdown.adjusted_score) }}>
                            {Math.round(report.score_breakdown.adjusted_score)}
                          </span>
                          <span className="score-sub">/ 100</span>
                        </div>
                      </div>
                      <div className="score-meta">
                        <div className="score-rating" style={{ color: scoreColor(report.score_breakdown.adjusted_score) }}>
                          {report.overall_policy_rating}
                        </div>
                        <div className="score-row">Risk index · {typeof report.score_breakdown.risk_index === "number" ? report.score_breakdown.risk_index.toFixed(2) : report.score_breakdown.risk_index}</div>
                        <div className="score-row">Confidence · {report.confidence}</div>
                      </div>
                    </div>

                    {/* Honest framing note */}
                    <div className="score-indicator-note">
                      ⚠ Indicative assessment based on submitted text only — not an endorsement or guarantee of coverage.
                      Verify clause details directly with your insurer before purchasing.
                    </div>

                    {report.summary && <p className="score-summary">{report.summary}</p>}
                  </div>
                </div>

                {/* CLAUSE HEATMAP */}
                <div className="rcard">
                  <div className="rcard-hdr">
                    <span className="rcard-title">Clause Risk Assessment</span>
                    <span className="rcard-title">10 clauses</span>
                  </div>

                  {/* Summary counts bar */}
                  {(() => {
                    const counts = { "High Risk": 0, "Moderate Risk": 0, "Low Risk": 0, "Not Found": 0 };
                    Object.values(report.clause_risk).forEach(v => {
                      if (v in counts) counts[v as keyof typeof counts]++;
                    });
                    return (
                      <div className="clause-summary">
                        {(["High Risk", "Moderate Risk", "Low Risk", "Not Found"] as const).map(lbl => (
                          <div key={lbl} className="clause-summary-seg">
                            <span className="clause-summary-count" style={{ color: RISK[lbl].color }}>{counts[lbl]}</span>
                            <span className="clause-summary-label" style={{ color: RISK[lbl].color }}>
                              {lbl === "Not Found" ? "N/F" : lbl.replace(" Risk", "")}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="clause-grid">
                    {Object.entries(report.clause_risk).map(([key, value]) => {
                      const cfg  = RISK[value] || RISK["Not Found"];
                      const meta = CLAUSE_META[key];
                      return (
                        <div key={key} className="clause-cell">
                          <div>
                            <div className="clause-name">{meta?.label || key}</div>
                            <div className="clause-desc">{meta?.desc}</div>
                          </div>
                          <span className="clause-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* IRDAI COMPLIANCE
                    compliance_flags is Record<string, boolean | string[]>
                    — flagIsTrue() normalises both types correctly */}
                <div className="rcard">
                  <div className="rcard-hdr">
                    <span className="rcard-title">IRDAI Compliance</span>
                    <span className="rcard-title" style={{ color: "#1e5c2e" }}>{report.irdai_compliance.compliance_rating}</span>
                  </div>
                  <div className="rcard-body">
                    <div className="compliance-bar-wrap">
                      <div className="bar-label">
                        <span>Compliance Score</span>
                        <span>{report.irdai_compliance.compliance_score} / 7</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(report.irdai_compliance.compliance_score / 7) * 100}%`, background: "var(--sage)" }} />
                      </div>
                    </div>
                    <div className="compliance-flags">
                      {Object.entries(report.irdai_compliance.compliance_flags)
                        .filter(([k]) => !k.startsWith("_"))
                        .map(([k, v]) => {
                          const passed = flagIsTrue(v);
                          return (
                            <div key={k} className="compliance-row">
                              <span className="compliance-key">
                                {k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <span className="compliance-val" style={{ color: passed ? "#1e5c2e" : "#8c1f14" }}>
                                {passed ? "✓" : "✗"}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* FLAGS */}
                {(report.red_flags.length > 0 || report.positive_flags.length > 0) && (
                  <div className="rcard">
                    <div className="rcard-hdr">
                      <span className="rcard-title">Risk Signals</span>
                      <span className="rcard-title">{report.red_flags.length + report.positive_flags.length} signals</span>
                    </div>
                    <div className="flags-list">
                      {report.red_flags.map((f, i) => (
                        <div key={`r${i}`} className="flag-item">
                          <span className="flag-icon" style={{ color: "#8c1f14" }}>▲</span>{f}
                        </div>
                      ))}
                      {report.positive_flags.map((f, i) => (
                        <div key={`p${i}`} className="flag-item">
                          <span className="flag-icon" style={{ color: "#1e5c2e" }}>◆</span>{f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── SIDE COLUMN ── */}
              <div className="results-side">

                {/* SCORE SUMMARY */}
                <div className="dark-summary">
                  <div className="dark-summary-label">Score Summary</div>
                  {[
                    { label: "Overall Rating",   value: report.overall_policy_rating },
                    { label: "Adjusted Score",   value: `${Math.round(report.score_breakdown.adjusted_score)} / 100` },
                    { label: "Risk Index",       value: typeof report.score_breakdown.risk_index === "number" ? report.score_breakdown.risk_index.toFixed(2) : String(report.score_breakdown.risk_index) },
                    { label: "IRDAI Compliance", value: `${report.irdai_compliance.compliance_score} / 7` },
                    { label: "Confidence",       value: report.confidence },
                  ].map(({ label, value }) => (
                    <div key={label} className="dark-summary-row">
                      <span className="dark-summary-key">{label}</span>
                      <span className="dark-summary-val">{value}</span>
                    </div>
                  ))}
                </div>

                {/* STRUCTURAL RISK
                    Now shows:
                    - data_sufficient warning when false
                    - high_risk_count and not_found_count as a counts row
                    - existing bars and recommendation unchanged */}
                <div className="rcard">
                  <div className="rcard-hdr">
                    <span className="rcard-title">Structural Risk</span>
                    <span className="rcard-title" style={{
                      color: report.broker_risk_analysis.structural_risk_level === "High"     ? "#8c1f14"
                           : report.broker_risk_analysis.structural_risk_level === "Elevated" ? "#7a4e08"
                           : report.broker_risk_analysis.structural_risk_level === "Insufficient Data" ? "#7a7870"
                           : "#1e5c2e",
                    }}>{report.broker_risk_analysis.structural_risk_level}</span>
                  </div>
                  <div className="rcard-body">

                    {/* data_sufficient warning — only shown when false */}
                    {!report.broker_risk_analysis.data_sufficient && (
                      <div className="broker-insufficient">
                        ⚠ Insufficient data — structural risk assessment is based on partial clause coverage.
                        Add more policy sections for a complete picture.
                      </div>
                    )}

                    {/* high_risk_count / not_found_count counts */}
                    <div className="broker-counts">
                      <div className="broker-count-seg">
                        <span className="broker-count-num" style={{ color: "#8c1f14" }}>
                          {report.broker_risk_analysis.high_risk_count}
                        </span>
                        <span className="broker-count-lbl">High risk clauses</span>
                      </div>
                      <div className="broker-count-seg">
                        <span className="broker-count-num" style={{ color: "#7a7870" }}>
                          {report.broker_risk_analysis.not_found_count}
                        </span>
                        <span className="broker-count-lbl">Clauses not found</span>
                      </div>
                    </div>

                    <div className="broker-bars">
                      <div>
                        <div className="bar-label">
                          <span>Risk Density</span>
                          <span>{(report.broker_risk_analysis.risk_density_index * 100).toFixed(0)}%</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${report.broker_risk_analysis.risk_density_index * 100}%`, background: "#c94030" }} />
                        </div>
                      </div>
                      <div>
                        <div className="bar-label">
                          <span>Transparency</span>
                          <span>{report.broker_risk_analysis.transparency_score}%</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${report.broker_risk_analysis.transparency_score}%`, background: "var(--sage)" }} />
                        </div>
                      </div>
                    </div>

                    {report.broker_risk_analysis.recommendation && (
                      <p className="broker-reco">{report.broker_risk_analysis.recommendation}</p>
                    )}
                  </div>
                </div>

                {/* BUYER CHECKLIST */}
                {report.checklist_for_buyer.length > 0 && (
                  <div className="checklist-card">
                    <div className="checklist-hdr">
                      <div className="checklist-hdr-label">Before You Buy</div>
                    </div>
                    {report.checklist_for_buyer.map((q, i) => (
                      <div key={i} className="checklist-item">
                        <span className="check-icon">→</span>{q}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upgraded 3-line footer — matches audit page honest framing */}
            <p className="report-fn">
              <strong>CareBridge provides interpretative analysis only.</strong><br />
              Not legal advice · Not an insurance endorsement · Scores are indicative, not guarantees of coverage.<br />
              Verify all findings with your insurer or a qualified advisor before purchasing a policy.
            </p>
          </>
        )}
      </div>
    </>
  );
}