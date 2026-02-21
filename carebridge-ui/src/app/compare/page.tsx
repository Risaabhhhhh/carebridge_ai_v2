"use client";

import { useState } from "react";
import { comparePolicies } from "../lib/api";

interface ComparisonReport {
  policy_a_rating:    string;
  policy_b_rating:    string;
  policy_a_score:     number;
  policy_b_score:     number;
  recommendation:     string;
  recommended_policy: "A" | "B" | "Neither";
  key_differences:    string[];
  a_advantages:       string[];
  b_advantages:       string[];
  a_risks:            string[];
  b_risks:            string[];
  summary:            string;
}

const RATING_CONFIG: Record<string, { color: string; bg: string }> = {
  "Strong":   { color: "#2d6b3e", bg: "#eef5f0" },
  "Moderate": { color: "#9a6c10", bg: "#fdf8ee" },
  "Weak":     { color: "#b94030", bg: "#fdf2f0" },
};

export default function ComparePage() {
  const [policyA,  setPolicyA]  = useState("");
  const [policyB,  setPolicyB]  = useState("");
  const [nameA,    setNameA]    = useState("Policy A");
  const [nameB,    setNameB]    = useState("Policy B");
  const [report,   setReport]   = useState<ComparisonReport | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleCompare = async () => {
    if (!policyA.trim() || !policyB.trim()) {
      setError("Both policy texts are required.");
      return;
    }
    if (policyA.trim().length < 100 || policyB.trim().length < 100) {
      setError("Each policy must be at least 100 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const data = await comparePolicies(policyA, policyB);
      setReport(data);
      setTimeout(() => window.scrollTo({ top: 700, behavior: "smooth" }), 120);
    } catch {
      setError("Comparison could not be processed. Ensure both policy texts are clear and complete.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 70 ? "#2d6b3e" : s >= 45 ? "#9a6c10" : "#b94030";

  const radius = 36;
  const circ   = 2 * Math.PI * radius;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400;500&display=swap');

        :root {
          --ink: #0f1512; --cream: #faf8f3; --paper: #f5f2ec;
          --sage: #2d5a3d; --sage-light: #4a7c5f; --sage-pale: #e8f0ea;
          --mist: #8fa896; --border: #ddd8ce;
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
        .page-sub { font-size: 14px; color: #5a6560; max-width: 380px; line-height: 1.7; text-align: right; }

        /* INPUT SECTION */
        .input-section { max-width: 1200px; margin: 0 auto; padding: 56px 64px 0; }

        /* POLICY NAME ROW */
        .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; }
        .name-input {
          width: 100%; padding: 10px 16px;
          border: 1px solid var(--border); border-radius: 2px;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.08em; background: white; color: var(--ink);
          outline: none; transition: border-color 0.2s;
        }
        .name-input:focus { border-color: var(--sage); }

        /* TWO COLUMN INPUTS */
        .inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .input-card { background: white; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .input-card-header {
          padding: 14px 20px; border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .input-card-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mist); }
        .input-card-count { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--sage); }
        .input-card-body { padding: 0; }

        textarea {
          width: 100%; height: 220px; padding: 20px;
          border: none; outline: none; resize: none;
          font-family: 'DM Mono', monospace; font-size: 12px; line-height: 1.7;
          color: var(--ink); background: var(--cream);
        }
        textarea::placeholder { color: #c0bfba; }

        /* VS BADGE */
        .vs-divider {
          display: flex; align-items: center; justify-content: center;
          position: relative; gap: 16px; margin: 24px 0;
        }
        .vs-line { flex: 1; height: 1px; background: var(--border); }
        .vs-badge {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px; font-weight: 300; font-style: italic;
          color: var(--mist); flex-shrink: 0;
        }

        /* BUTTON */
        .compare-btn {
          margin-top: 24px; width: 100%; padding: 18px;
          background: var(--sage); color: white;
          border: none; border-radius: 2px;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer; transition: background 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .compare-btn:hover:not(:disabled) { background: var(--sage-light); }
        .compare-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-msg { margin-top: 16px; padding: 14px 18px; background: #fdf2f0; border: 1px solid #f5c6c0; border-radius: 2px; font-family: 'DM Mono', monospace; font-size: 12px; color: #b94030; }

        /* DIVIDER */
        .results-divider { max-width: 1200px; margin: 64px auto 0; padding: 0 64px; display: flex; align-items: center; gap: 24px; }
        .divider-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mist); white-space: nowrap; }
        .divider-line { flex: 1; height: 1px; background: var(--border); }

        /* RESULTS */
        .results-section { max-width: 1200px; margin: 40px auto 0; padding: 0 64px; display: flex; flex-direction: column; gap: 20px; }

        /* VERDICT CARD */
        .verdict-card {
          background: var(--sage); border-radius: 4px; padding: 40px 48px;
          display: flex; justify-content: space-between; align-items: center; gap: 32px;
          position: relative; overflow: hidden;
        }
        .verdict-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 50%, rgba(184,147,74,0.12) 0%, transparent 60%);
        }
        .verdict-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 10px; }
        .verdict-text  { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 3vw, 42px); font-weight: 300; color: white; line-height: 1.15; }
        .verdict-text em { font-style: italic; opacity: 0.75; }
        .verdict-summary { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.7; max-width: 440px; }

        /* SCORE COMPARISON */
        .score-card { background: white; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .score-card-header { padding: 16px 28px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; }
        .score-card-label  { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mist); }
        .score-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 36px 40px; gap: 24px; }
        .score-col { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .score-ring { width: 90px; height: 90px; position: relative; flex-shrink: 0; }
        .score-ring svg { transform: rotate(-90deg); }
        .score-ring-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .score-num  { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; line-height: 1; }
        .score-sub  { font-family: 'DM Mono', monospace; font-size: 8px; color: var(--mist); letter-spacing: 0.08em; }
        .score-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; }
        .score-rating-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 2px; }
        .vs-center { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-style: italic; color: var(--mist); }
        .winner-chip { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; background: var(--sage); color: white; border-radius: 2px; }

        /* DETAIL GRID */
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .detail-col { background: white; }
        .detail-col-header { padding: 14px 24px; border-bottom: 1px solid var(--border); font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mist); display: flex; justify-content: space-between; }
        .detail-item { display: flex; gap: 10px; align-items: flex-start; padding: 12px 24px; border-bottom: 1px solid #f5f2ec; font-size: 12px; line-height: 1.5; color: #4a5550; }
        .detail-item:last-child { border-bottom: none; }
        .detail-icon { flex-shrink: 0; margin-top: 2px; font-size: 10px; }
        .detail-empty { padding: 16px 24px; font-size: 12px; color: #c0bfba; font-style: italic; font-family: 'DM Mono', monospace; }

        /* KEY DIFFERENCES */
        .diff-card { background: white; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .diff-header { padding: 16px 28px; border-bottom: 1px solid var(--border); font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mist); display: flex; justify-content: space-between; }
        .diff-item { display: flex; gap: 16px; align-items: flex-start; padding: 16px 28px; border-bottom: 1px solid #f5f2ec; }
        .diff-item:last-child { border-bottom: none; }
        .diff-num  { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--mist); flex-shrink: 0; margin-top: 2px; }
        .diff-text { font-size: 13px; color: #4a5550; line-height: 1.5; }

        .footnote { max-width: 1200px; margin: 40px auto 0; padding: 0 64px 40px; font-family: 'DM Mono', monospace; font-size: 10px; color: var(--mist); letter-spacing: 0.06em; text-align: center; }

        @media (max-width: 900px) {
          .page-header, .input-section, .results-divider, .results-section, .footnote { padding-left: 24px; padding-right: 24px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .page-sub { text-align: left; max-width: 100%; }
          .inputs-grid, .name-row, .detail-grid { grid-template-columns: 1fr; }
          .score-grid { grid-template-columns: 1fr; gap: 16px; }
          .vs-center, .winner-chip { display: none; }
          .verdict-card { flex-direction: column; }
        }
      `}</style>

      <div className="page">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Policy Comparison</div>
            <h1 className="page-title serif">
              Compare side by side.<br />
              <em>Choose with confidence.</em>
            </h1>
          </div>
          <p className="page-sub">
            Paste two policy documents. CareBridge scores each independently
            and identifies which offers better protection for your situation.
          </p>
        </div>

        {/* INPUT */}
        <div className="input-section">

          {/* Policy names */}
          <div className="name-row">
            <input
              className="name-input"
              placeholder="Label for Policy A (e.g. HDFC Optima Secure)"
              value={nameA}
              onChange={(e) => setNameA(e.target.value || "Policy A")}
            />
            <input
              className="name-input"
              placeholder="Label for Policy B (e.g. Star Health Assure)"
              value={nameB}
              onChange={(e) => setNameB(e.target.value || "Policy B")}
            />
          </div>

          {/* Text inputs */}
          <div className="inputs-grid">
            <div className="input-card">
              <div className="input-card-header">
                <span className="input-card-label">{nameA}</span>
                {policyA && <span className="input-card-count">✓ {policyA.trim().length} chars</span>}
              </div>
              <div className="input-card-body">
                <textarea
                  placeholder="Paste the full policy wording for the first policy..."
                  value={policyA}
                  onChange={(e) => setPolicyA(e.target.value)}
                />
              </div>
            </div>

            <div className="input-card">
              <div className="input-card-header">
                <span className="input-card-label">{nameB}</span>
                {policyB && <span className="input-card-count">✓ {policyB.trim().length} chars</span>}
              </div>
              <div className="input-card-body">
                <textarea
                  placeholder="Paste the full policy wording for the second policy..."
                  value={policyB}
                  onChange={(e) => setPolicyB(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button className="compare-btn" onClick={handleCompare} disabled={loading}>
            {loading
              ? <><span className="spinner" /> Comparing policies...</>
              : "Run Comparison"}
          </button>

          {error && <div className="error-msg">{error}</div>}
        </div>

        {/* RESULTS */}
        {report && (
          <>
            <div className="results-divider">
              <span className="divider-label">Comparison Report</span>
              <span className="divider-line" />
              <span className="divider-label" style={{ color: "#3d8a52" }}>
                Recommended: {report.recommended_policy === "A" ? nameA : report.recommended_policy === "B" ? nameB : "Neither"}
              </span>
            </div>

            <div className="results-section">

              {/* VERDICT */}
              <div className="verdict-card">
                <div>
                  <div className="verdict-label">Recommendation</div>
                  <div className="verdict-text serif">
                    {report.recommended_policy === "Neither"
                      ? <>Neither policy is <em>recommended</em></>
                      : <>{report.recommended_policy === "A" ? nameA : nameB} is the <em>better choice</em></>
                    }
                  </div>
                </div>
                <p className="verdict-summary">{report.recommendation}</p>
              </div>

              {/* SCORE COMPARISON */}
              <div className="score-card">
                <div className="score-card-header">
                  <span className="score-card-label">Score Comparison</span>
                  <span className="score-card-label">Adjusted scores out of 100</span>
                </div>
                <div className="score-grid">
                  {/* Policy A */}
                  <div className="score-col">
                    <div className="score-ring">
                      <svg width="90" height="90" viewBox="0 0 84 84">
                        <circle cx="42" cy="42" r={radius} fill="none" stroke="#ede9e0" strokeWidth="7" />
                        <circle cx="42" cy="42" r={radius} fill="none"
                          stroke={scoreColor(report.policy_a_score)} strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={circ}
                          strokeDashoffset={circ * (1 - report.policy_a_score / 100)}
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <div className="score-ring-inner">
                        <span className="score-num" style={{ color: scoreColor(report.policy_a_score) }}>{report.policy_a_score}</span>
                        <span className="score-sub">/ 100</span>
                      </div>
                    </div>
                    <div className="score-name serif">{nameA}</div>
                    <span
                      className="score-rating-badge"
                      style={{ background: RATING_CONFIG[report.policy_a_rating]?.bg ?? "#f5f2ec", color: RATING_CONFIG[report.policy_a_rating]?.color ?? "#8fa896" }}
                    >
                      {report.policy_a_rating}
                    </span>
                    {report.recommended_policy === "A" && <span className="winner-chip">Recommended</span>}
                  </div>

                  <div className="vs-center serif">vs</div>

                  {/* Policy B */}
                  <div className="score-col">
                    <div className="score-ring">
                      <svg width="90" height="90" viewBox="0 0 84 84">
                        <circle cx="42" cy="42" r={radius} fill="none" stroke="#ede9e0" strokeWidth="7" />
                        <circle cx="42" cy="42" r={radius} fill="none"
                          stroke={scoreColor(report.policy_b_score)} strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={circ}
                          strokeDashoffset={circ * (1 - report.policy_b_score / 100)}
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <div className="score-ring-inner">
                        <span className="score-num" style={{ color: scoreColor(report.policy_b_score) }}>{report.policy_b_score}</span>
                        <span className="score-sub">/ 100</span>
                      </div>
                    </div>
                    <div className="score-name serif">{nameB}</div>
                    <span
                      className="score-rating-badge"
                      style={{ background: RATING_CONFIG[report.policy_b_rating]?.bg ?? "#f5f2ec", color: RATING_CONFIG[report.policy_b_rating]?.color ?? "#8fa896" }}
                    >
                      {report.policy_b_rating}
                    </span>
                    {report.recommended_policy === "B" && <span className="winner-chip">Recommended</span>}
                  </div>
                </div>
              </div>

              {/* ADVANTAGES & RISKS */}
              <div className="detail-grid">
                {/* A advantages */}
                <div className="detail-col">
                  <div className="detail-col-header">
                    <span>{nameA} — Advantages</span>
                    <span>{report.a_advantages.length}</span>
                  </div>
                  {report.a_advantages.length > 0
                    ? report.a_advantages.map((a, i) => (
                        <div key={i} className="detail-item">
                          <span className="detail-icon" style={{ color: "#3d8a52" }}>◆</span>
                          {a}
                        </div>
                      ))
                    : <div className="detail-empty">None identified</div>
                  }
                </div>
                {/* B advantages */}
                <div className="detail-col">
                  <div className="detail-col-header">
                    <span>{nameB} — Advantages</span>
                    <span>{report.b_advantages.length}</span>
                  </div>
                  {report.b_advantages.length > 0
                    ? report.b_advantages.map((a, i) => (
                        <div key={i} className="detail-item">
                          <span className="detail-icon" style={{ color: "#3d8a52" }}>◆</span>
                          {a}
                        </div>
                      ))
                    : <div className="detail-empty">None identified</div>
                  }
                </div>
                {/* A risks */}
                <div className="detail-col" style={{ borderTop: "1px solid #ddd8ce" }}>
                  <div className="detail-col-header">
                    <span>{nameA} — Risks</span>
                    <span>{report.a_risks.length}</span>
                  </div>
                  {report.a_risks.length > 0
                    ? report.a_risks.map((r, i) => (
                        <div key={i} className="detail-item">
                          <span className="detail-icon" style={{ color: "#d95f4b" }}>▲</span>
                          {r}
                        </div>
                      ))
                    : <div className="detail-empty">None identified</div>
                  }
                </div>
                {/* B risks */}
                <div className="detail-col" style={{ borderTop: "1px solid #ddd8ce" }}>
                  <div className="detail-col-header">
                    <span>{nameB} — Risks</span>
                    <span>{report.b_risks.length}</span>
                  </div>
                  {report.b_risks.length > 0
                    ? report.b_risks.map((r, i) => (
                        <div key={i} className="detail-item">
                          <span className="detail-icon" style={{ color: "#d95f4b" }}>▲</span>
                          {r}
                        </div>
                      ))
                    : <div className="detail-empty">None identified</div>
                  }
                </div>
              </div>

              {/* KEY DIFFERENCES */}
              {report.key_differences.length > 0 && (
                <div className="diff-card">
                  <div className="diff-header">
                    <span>Key Differences</span>
                    <span>{report.key_differences.length}</span>
                  </div>
                  {report.key_differences.map((d, i) => (
                    <div key={i} className="diff-item">
                      <span className="diff-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className="diff-text">{d}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>

            <p className="footnote">
              CareBridge provides interpretative analysis only · Not legal advice · Scores reflect submitted text — verify findings with your insurer
            </p>
          </>
        )}
      </div>
    </>
  );
}