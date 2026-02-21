"use client";

import { IRDAICompliance } from "../../types/prepurchase";

const RATING_CONFIG: Record<string, { color: string; bg: string }> = {
  "High Compliance":     { color: "#2d6b3e", bg: "#eef5f0" },
  "Moderate Compliance": { color: "#9a6c10", bg: "#fdf8ee" },
  "Low Compliance":      { color: "#b94030", bg: "#fdf2f0" },
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

  // Separate boolean flags from internal keys like _violations_detected
  const flagEntries = Object.entries(compliance_flags).filter(
    ([key]) => !key.startsWith("_") && key in FLAG_LABELS
  );

  const violations = compliance_flags._violations_detected;
  const violationList: string[] = Array.isArray(violations) ? violations : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400&family=DM+Mono:wght@300;400&display=swap');
        .irdai-card { background: white; border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden; }
        .irdai-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; display: flex; justify-content: space-between; align-items: center; }
        .irdai-header-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; }
        .irdai-rating-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 2px; }
        .irdai-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .irdai-score-row { display: flex; align-items: center; gap: 20px; }
        .irdai-score-num { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; line-height: 1; flex-shrink: 0; }
        .irdai-score-meta { flex: 1; }
        .irdai-score-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #8fa896; margin-bottom: 8px; }
        .irdai-bar-track { height: 4px; background: #ddd8ce; border-radius: 2px; overflow: hidden; }
        .irdai-bar-fill  { height: 100%; border-radius: 2px; transition: width 0.8s ease; }
        .irdai-divider   { height: 1px; background: #f0ede8; }
        .irdai-flags     { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #ddd8ce; border: 1px solid #ddd8ce; }
        .irdai-flag-cell { background: white; padding: 13px 18px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .irdai-flag-cell:hover { background: #faf8f3; }
        .flag-name  { font-size: 12px; color: #4a5550; }
        .flag-check { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; }
        .violations-block { background: #fdf2f0; border: 1px solid #f5c6c0; border-radius: 2px; padding: 16px 20px; }
        .violations-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #b94030; margin-bottom: 10px; }
        .violation-item { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: #8a2e24; line-height: 1.5; padding: 4px 0; }
        .violation-icon { flex-shrink: 0; margin-top: 2px; }
        @media (max-width: 600px) { .irdai-flags { grid-template-columns: 1fr; } }
      `}</style>

      <div className="irdai-card">
        <div className="irdai-header">
          <span className="irdai-header-label">IRDAI Compliance Overview</span>
          <span
            className="irdai-rating-badge"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {compliance_rating}
          </span>
        </div>

        <div className="irdai-body">
          {/* Score */}
          <div className="irdai-score-row">
            <div className="irdai-score-num" style={{ color: cfg.color }}>
              {compliance_score}
              <span style={{ fontSize: 20, opacity: 0.4 }}>/7</span>
            </div>
            <div className="irdai-score-meta">
              <div className="irdai-score-label">Compliance Score</div>
              <div className="irdai-bar-track">
                <div
                  className="irdai-bar-fill"
                  style={{ width: `${scorePct}%`, background: cfg.color }}
                />
              </div>
            </div>
          </div>

          <div className="irdai-divider" />

          {/* Flags checklist */}
          <div className="irdai-flags">
            {flagEntries.map(([key, value]) => (
              <div key={key} className="irdai-flag-cell">
                <span className="flag-name">{FLAG_LABELS[key] ?? key}</span>
                <span
                  className="flag-check"
                  style={{ color: value ? "#2d6b3e" : "#b94030" }}
                >
                  {value ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>

          {/* Violations */}
          {violationList.length > 0 && (
            <div className="violations-block">
              <div className="violations-label">
                Violations Detected — {violationList.length}
              </div>
              {violationList.map((v, i) => (
                <div key={i} className="violation-item">
                  <span className="violation-icon" style={{ color: "#b94030" }}>▲</span>
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