"use client";

import { AuditReport } from "../../types/audit";

const ALIGNMENT_CONFIG: Record<string, { color: string; bg: string }> = {
  "Strong":       { color: "#b94030", bg: "#fdf2f0" },
  "Partial":      { color: "#9a6c10", bg: "#fdf8ee" },
  "Weak":         { color: "#2d6b3e", bg: "#eef5f0" },
  "Not Detected": { color: "#2d6b3e", bg: "#eef5f0" },
};

export default function AuditSummaryCard({ report }: { report: AuditReport }) {
  const cfg = ALIGNMENT_CONFIG[report.clause_alignment] ?? ALIGNMENT_CONFIG["Partial"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');
        .summary-card { background: white; border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden; }
        .summary-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; }
        .summary-body { padding: 28px 24px; display: flex; flex-direction: column; gap: 20px; }
        .summary-text { font-size: 14px; line-height: 1.75; color: #4a5550; }
        .summary-chips { display: flex; gap: 12px; flex-wrap: wrap; }
        .summary-chip { display: flex; flex-direction: column; gap: 6px; }
        .chip-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #8fa896; }
        .chip-value { font-size: 12px; padding: 8px 14px; border-radius: 2px; line-height: 1.4; max-width: 340px; }
        .summary-divider { height: 1px; background: #f0ede8; }
        .rejection-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #8fa896; margin-bottom: 6px; }
        .rejection-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; line-height: 1.4; color: #0f1512; font-style: italic; }
      `}</style>

      <div className="summary-card">
        <div className="summary-header">Case Overview</div>
        <div className="summary-body">

          {/* Why rejected */}
          <div>
            <div className="rejection-label">Rejection Basis</div>
            <div className="rejection-text">{report.why_rejected}</div>
          </div>

          <div className="summary-divider" />

          {/* Case summary */}
          <p className="summary-text">{report.case_summary}</p>

          {/* Chips */}
          <div className="summary-chips">
            <div className="summary-chip">
              <span className="chip-label">Clause Detected</span>
              <span
                className="chip-value"
                style={{ background: "#f5f2ec", color: "#4a5550" }}
              >
                {report.policy_clause_detected}
              </span>
            </div>

            <div className="summary-chip">
              <span className="chip-label">Clause Alignment</span>
              <span
                className="chip-value"
                style={{ background: cfg.bg, color: cfg.color, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                {report.clause_alignment}
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}