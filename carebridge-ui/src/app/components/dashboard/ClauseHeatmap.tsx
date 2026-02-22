"use client";

import { ClauseRisk, RiskLevel } from "../../types/prepurchase";

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; border: string }> = {
  "High Risk":     { color: "#8c1f14", bg: "#f5d0cc", border: "#e08070" },
  "Moderate Risk": { color: "#7a4e08", bg: "#faecd0", border: "#e0b870" },
  "Low Risk":      { color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa" },
  "Not Found":     { color: "#4a5248", bg: "#e8e4dc", border: "#c8c2b8" },
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .hm { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .hm-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: #f5f0e8; }
        .hm-title { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; }
        .hm-legend { display: flex; gap: 16px; flex-wrap: wrap; }
        .hm-leg-item { display: flex; align-items: center; gap: 6px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; }
        .hm-leg-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .hm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #c8c2b8; border-top: 1px solid #c8c2b8; }
        .hm-cell { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; transition: background 0.12s; cursor: default; }
        .hm-cell:hover { background: #f5f0e8; }
        .hm-clause-name { font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #1a2018; line-height: 1.3; }
        .hm-badge { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 2px; white-space: nowrap; flex-shrink: 0; }
        .hm-footer { padding: 13px 24px; border-top: 1px solid #c8c2b8; display: flex; gap: 24px; background: #f0ece4; }
        .hm-fstat { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; letter-spacing: 0.06em; color: #3d4840; }
        .hm-fstat strong { color: #0f1512; font-weight: 500; }
        @media (max-width: 600px) { .hm-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="hm">
        <div className="hm-hdr">
          <span className="hm-title">Clause Risk Classification — {entries.length} clauses</span>
          <div className="hm-legend">
            {(["High Risk", "Moderate Risk", "Low Risk", "Not Found"] as RiskLevel[]).map((level) => (
              <div key={level} className="hm-leg-item" style={{ color: RISK_CONFIG[level].color }}>
                <span className="hm-leg-dot" style={{ background: RISK_CONFIG[level].color }} />
                {level}
              </div>
            ))}
          </div>
        </div>

        <div className="hm-grid">
          {entries.map(([key, value]) => {
            const cfg = RISK_CONFIG[value] ?? RISK_CONFIG["Not Found"];
            return (
              <div key={key} className="hm-cell">
                <span className="hm-clause-name">{CLAUSE_LABELS[key] ?? key}</span>
                <span className="hm-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        <div className="hm-footer">
          {Object.entries(counts).map(([level, count]) => (
            <span key={level} className="hm-fstat">
              <strong>{count}</strong> {level}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}