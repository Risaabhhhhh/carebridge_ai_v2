"use client";

import { IRDAICompliance } from "../../types/prepurchase";

const RATING_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  "High Compliance":     { color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa" },
  "Moderate Compliance": { color: "#7a4e08", bg: "#faecd0", border: "#e0b870" },
  "Low Compliance":      { color: "#8c1f14", bg: "#f5d0cc", border: "#e08070" },
};

const FLAG_LABELS: Record<string, string> = {
  grievance_redressal_mentioned: "Grievance Redressal",
  ombudsman_mentioned:           "Ombudsman Reference",
  irdai_reference:               "IRDAI Reference",
  free_look_period:              "Free Look Period",
  portability_clause:            "Portability Clause",
  claim_settlement_timeline:     "Claim Settlement Timeline",
  exclusion_transparency:        "Exclusion Transparency",
};

export default function IRDAICompliancePanel({ compliance }: { compliance: IRDAICompliance }) {
  const { compliance_flags, compliance_score, compliance_rating } = compliance;
  const cfg = RATING_CONFIG[compliance_rating] ?? RATING_CONFIG["Moderate Compliance"];
  const scorePct = Math.round((compliance_score / 7) * 100);

  const flagEntries = Object.entries(compliance_flags).filter(
    ([key]) => !key.startsWith("_") && key in FLAG_LABELS
  );
  const violations = compliance_flags._violations_detected;
  const violationList: string[] = Array.isArray(violations) ? violations : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .ip { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .ip-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; display: flex; justify-content: space-between; align-items: center; background: #f5f0e8; }
        .ip-hdr-lbl { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; }
        .ip-rating-badge { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 2px; }
        .ip-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .ip-score-row { display: flex; align-items: center; gap: 20px; }
        .ip-score-num { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 600; line-height: 1; flex-shrink: 0; }
        .ip-score-meta { flex: 1; }
        .ip-score-lbl { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #3d4840; margin-bottom: 10px; }
        .ip-bar-track { height: 6px; background: #ddd8ce; border-radius: 3px; overflow: hidden; }
        .ip-bar-fill  { height: 100%; border-radius: 3px; transition: width 0.8s ease; }
        .ip-div { height: 1px; background: #e0dbd2; }
        .ip-flags { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #c8c2b8; border: 1px solid #c8c2b8; }
        .ip-flag-cell { background: #fff; padding: 13px 18px; display: flex; justify-content: space-between; align-items: center; gap: 8px; transition: background 0.12s; }
        .ip-flag-cell:hover { background: #f5f0e8; }
        .ip-flag-name { font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #1a2018; }
        .ip-flag-check { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; }
        .ip-viol-block { background: #f5d0cc; border: 1px solid #e08070; border-radius: 2px; padding: 16px 20px; }
        .ip-viol-lbl { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #8c1f14; margin-bottom: 10px; }
        .ip-viol-item { display: flex; gap: 8px; align-items: flex-start; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 400; color: #6b1510; line-height: 1.5; padding: 4px 0; }
        .ip-viol-icon { flex-shrink: 0; margin-top: 2px; }
        @media (max-width: 600px) { .ip-flags { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ip">
        <div className="ip-hdr">
          <span className="ip-hdr-lbl">IRDAI Compliance Overview</span>
          <span className="ip-rating-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {compliance_rating}
          </span>
        </div>
        <div className="ip-body">
          <div className="ip-score-row">
            <div className="ip-score-num" style={{ color: cfg.color }}>
              {compliance_score}<span style={{ fontSize: 22, opacity: 0.45 }}>/7</span>
            </div>
            <div className="ip-score-meta">
              <div className="ip-score-lbl">Compliance Score</div>
              <div className="ip-bar-track">
                <div className="ip-bar-fill" style={{ width: `${scorePct}%`, background: cfg.color }} />
              </div>
            </div>
          </div>

          <div className="ip-div" />

          <div className="ip-flags">
            {flagEntries.map(([key, value]) => (
              <div key={key} className="ip-flag-cell">
                <span className="ip-flag-name">{FLAG_LABELS[key] ?? key}</span>
                <span className="ip-flag-check" style={{ color: value ? "#1e5c2e" : "#8c1f14" }}>
                  {value ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>

          {violationList.length > 0 && (
            <div className="ip-viol-block">
              <div className="ip-viol-lbl">Violations Detected — {violationList.length}</div>
              {violationList.map((v, i) => (
                <div key={i} className="ip-viol-item">
                  <span className="ip-viol-icon" style={{ color: "#8c1f14" }}>▲</span>
                  {v}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}