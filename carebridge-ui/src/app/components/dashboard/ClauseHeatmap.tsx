"use client";

import { ClauseRisk, RiskLevel } from "../../types/prepurchase";

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string }> = {
  "High Risk":     { color: "#b94030", bg: "#fdf2f0" },
  "Moderate Risk": { color: "#9a6c10", bg: "#fdf8ee" },
  "Low Risk":      { color: "#2d6b3e", bg: "#eef5f0" },
  "Not Found":     { color: "#8fa896", bg: "#f5f2ec" },
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

export default function ClauseHeatmap({ clauseRisk }: { clauseRisk: ClauseRisk }) {
  const entries = Object.entries(clauseRisk) as [string, RiskLevel][];

  const counts = {
    "High Risk":     entries.filter(([, v]) => v === "High Risk").length,
    "Moderate Risk": entries.filter(([, v]) => v === "Moderate Risk").length,
    "Low Risk":      entries.filter(([, v]) => v === "Low Risk").length,
    "Not Found":     entries.filter(([, v]) => v === "Not Found").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');
        .heatmap-card { background: white; border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden; }
        .heatmap-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .heatmap-title { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; }
        .heatmap-legend { display: flex; gap: 16px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; }
        .legend-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .heatmap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #ddd8ce; border-top: 1px solid #ddd8ce; }
        .clause-cell { background: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; transition: background 0.15s; cursor: default; }
        .clause-cell:hover { background: #faf8f3; }
        .clause-name { font-size: 12px; color: #4a5550; line-height: 1.3; }
        .clause-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 2px; white-space: nowrap; flex-shrink: 0; }
        .heatmap-footer { padding: 14px 24px; border-top: 1px solid #ddd8ce; display: flex; gap: 24px; background: #faf8f3; }
        .footer-stat { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.08em; color: #8fa896; }
        .footer-stat strong { color: #0f1512; }
        @media (max-width: 600px) { .heatmap-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="heatmap-card">
        <div className="heatmap-header">
          <span className="heatmap-title">Clause Risk Classification — {entries.length} clauses</span>
          <div className="heatmap-legend">
            {(["High Risk", "Moderate Risk", "Low Risk", "Not Found"] as RiskLevel[]).map((level) => (
              <div key={level} className="legend-item" style={{ color: RISK_CONFIG[level].color }}>
                <span className="legend-dot" style={{ background: RISK_CONFIG[level].color }} />
                {level}
              </div>
            ))}
          </div>
        </div>

        <div className="heatmap-grid">
          {entries.map(([key, value]) => {
            const cfg = RISK_CONFIG[value] ?? RISK_CONFIG["Not Found"];
            return (
              <div key={key} className="clause-cell">
                <span className="clause-name">{CLAUSE_LABELS[key] ?? key}</span>
                <span className="clause-badge" style={{ background: cfg.bg, color: cfg.color }}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        <div className="heatmap-footer">
          {Object.entries(counts).map(([level, count]) => (
            <span key={level} className="footer-stat">
              <strong>{count}</strong> {level}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}