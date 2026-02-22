"use client";

import { BrokerRiskAnalysis } from "../../types/prepurchase";

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; track: string }> = {
  "High":              { color: "#8c1f14", bg: "#f5d0cc", border: "#e08070", track: "#e8a8a0" },
  "Elevated":          { color: "#7a4e08", bg: "#faecd0", border: "#e0b870", track: "#e8c890" },
  "Moderate":          { color: "#5c3a08", bg: "#faecd0", border: "#e0b870", track: "#e8c890" },
  "Balanced":          { color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa", track: "#9dd0aa" },
  "Insufficient Data": { color: "#4a5248", bg: "#e8e4dc", border: "#c8c2b8", track: "#c8c2b8" },
};

export default function BrokerTransparencyPanel({ broker }: { broker: BrokerRiskAnalysis }) {
  const cfg = RISK_CONFIG[broker.structural_risk_level] ?? RISK_CONFIG["Moderate"];
  const riskPct = Math.round(broker.risk_density_index * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .bp { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .bp-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; display: flex; justify-content: space-between; align-items: center; background: #f5f0e8; }
        .bp-hdr-lbl { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; }
        .bp-hdr-badge { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 2px; }
        .bp-body { padding: 28px 24px; display: flex; flex-direction: column; gap: 22px; }
        .bp-top { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .bp-stat-lbl { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #3d4840; margin-bottom: 8px; }
        .bp-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 600; line-height: 1; }
        .bp-stat-sub { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; color: #4a5248; margin-top: 5px; }
        .bp-bar-row { display: flex; justify-content: space-between; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; color: #3d4840; margin-bottom: 8px; letter-spacing: 0.06em; }
        .bp-bar-track { height: 6px; border-radius: 3px; overflow: hidden; }
        .bp-bar-fill  { height: 100%; border-radius: 3px; transition: width 0.8s ease; }
        .bp-rec { background: #f0ece4; border: 1px solid #d8d2c8; border-radius: 2px; padding: 18px 20px; }
        .bp-rec-lbl { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #3d4840; margin-bottom: 8px; }
        .bp-rec-text { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.7; color: #1a2018; font-style: italic; }
        .bp-div { height: 1px; background: #e0dbd2; }
      `}</style>

      <div className="bp">
        <div className="bp-hdr">
          <span className="bp-hdr-lbl">Structural Risk Analysis</span>
          <span className="bp-hdr-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {broker.structural_risk_level}
          </span>
        </div>
        <div className="bp-body">
          <div className="bp-top">
            <div>
              <div className="bp-stat-lbl">Structural Risk Level</div>
              <div className="bp-stat-val" style={{ color: cfg.color }}>{broker.structural_risk_level}</div>
              <div className="bp-stat-sub">
                {broker.high_risk_count} high-risk · {broker.not_found_count} undetected
              </div>
            </div>
            <div>
              <div className="bp-stat-lbl">Transparency Score</div>
              <div className="bp-stat-val" style={{ color: "#1e5c2e" }}>
                {broker.transparency_score}<span style={{ fontSize: 20, opacity: 0.45 }}>/100</span>
              </div>
              <div className="bp-stat-sub">
                {broker.data_sufficient ? "Data sufficient" : "Insufficient data"}
              </div>
            </div>
          </div>

          <div className="bp-div" />

          <div>
            <div className="bp-bar-row"><span>Risk Density Index</span><span>{riskPct}%</span></div>
            <div className="bp-bar-track" style={{ background: cfg.track }}>
              <div className="bp-bar-fill" style={{ width: `${riskPct}%`, background: cfg.color }} />
            </div>
          </div>

          <div>
            <div className="bp-bar-row"><span>Transparency</span><span>{broker.transparency_score}%</span></div>
            <div className="bp-bar-track" style={{ background: "#9dd0aa" }}>
              <div className="bp-bar-fill" style={{ width: `${broker.transparency_score}%`, background: "#1e5c2e" }} />
            </div>
          </div>

          <div className="bp-rec">
            <div className="bp-rec-lbl">Recommendation</div>
            <p className="bp-rec-text">{broker.recommendation}</p>
          </div>
        </div>
      </div>
    </>
  );
}