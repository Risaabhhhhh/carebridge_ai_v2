"use client";

import { AuditReport } from "../../types/audit";

const ALIGNMENT_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  "Strong":       { color: "#8c1f14", bg: "#f5d0cc", border: "#e08070" },
  "Partial":      { color: "#7a4e08", bg: "#faecd0", border: "#e0b870" },
  "Weak":         { color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa" },
  "Not Detected": { color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa" },
};

export default function AuditSummaryCard({ report }: { report: AuditReport }) {
  const cfg = ALIGNMENT_CONFIG[report.clause_alignment] ?? ALIGNMENT_CONFIG["Partial"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400;1,500&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .as { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .as-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; background: #f5f0e8; }
        .as-body { padding: 28px 24px; display: flex; flex-direction: column; gap: 20px; }
        .as-rej-lbl { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #3d4840; margin-bottom: 7px; }
        .as-rej-text { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; line-height: 1.4; color: #0f1512; font-style: italic; }
        .as-div { height: 1px; background: #e0dbd2; }
        .as-case-text { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.8; color: #1a2018; }
        .as-chips { display: flex; gap: 16px; flex-wrap: wrap; }
        .as-chip { display: flex; flex-direction: column; gap: 6px; }
        .as-chip-lbl { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #3d4840; }
        .as-chip-val { font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 400; padding: 8px 14px; border-radius: 2px; line-height: 1.4; max-width: 340px; }
        .as-chip-mono { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; }
      `}</style>

      <div className="as">
        <div className="as-hdr">Case Overview</div>
        <div className="as-body">
          <div>
            <div className="as-rej-lbl">Rejection Basis</div>
            <div className="as-rej-text">{report.why_rejected}</div>
          </div>
          <div className="as-div" />
          <p className="as-case-text">{report.case_summary}</p>
          <div className="as-chips">
            <div className="as-chip">
              <span className="as-chip-lbl">Clause Detected</span>
              <span className="as-chip-val" style={{ background: "#e8e4dc", color: "#1a2018" }}>
                {report.policy_clause_detected}
              </span>
            </div>
            <div className="as-chip">
              <span className="as-chip-lbl">Clause Alignment</span>
              <span className="as-chip-val as-chip-mono" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {report.clause_alignment}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}