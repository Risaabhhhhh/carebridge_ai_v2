"use client";

import { PrePurchaseReport } from "../../types/prepurchase";

const RATING_CONFIG: Record<string, { color: string; bg: string; track: string }> = {
  "Strong":   { color: "#2d6b3e", bg: "#eef5f0", track: "#c8e0cc" },
  "Moderate": { color: "#9a6c10", bg: "#fdf8ee", track: "#e8d5a0" },
  "Weak":     { color: "#b94030", bg: "#fdf2f0", track: "#f0c4be" },
};

const CONF_CONFIG: Record<string, { color: string; bg: string }> = {
  "High":   { color: "#2d6b3e", bg: "#eef5f0" },
  "Medium": { color: "#9a6c10", bg: "#fdf8ee" },
  "Low":    { color: "#b94030", bg: "#fdf2f0" },
};

export default function OverallRatingCard({ report }: { report: PrePurchaseReport }) {
  const { score_breakdown, overall_policy_rating, confidence, summary } = report;
  const cfg  = RATING_CONFIG[overall_policy_rating] ?? RATING_CONFIG["Moderate"];
  const ccfg = CONF_CONFIG[confidence]              ?? CONF_CONFIG["Medium"];

  const score    = Math.round(score_breakdown.adjusted_score);
  const riskPct  = Math.round(score_breakdown.risk_index * 100);
  const radius   = 42;
  const circ     = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - score / 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400&family=DM+Mono:wght@300;400&display=swap');
        .rating-card { background: white; border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden; }
        .rating-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; display: flex; justify-content: space-between; align-items: center; }
        .rating-header-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; }
        .rating-body { padding: 28px 24px; display: flex; flex-direction: column; gap: 24px; }
        .rating-top { display: flex; gap: 28px; align-items: center; }
        .score-ring { width: 110px; height: 110px; position: relative; flex-shrink: 0; }
        .score-ring svg { transform: rotate(-90deg); }
        .score-ring-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .score-big { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; line-height: 1; }
        .score-sub { font-family: 'DM Mono', monospace; font-size: 9px; color: #8fa896; letter-spacing: 0.08em; margin-top: 2px; }
        .rating-meta { flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .rating-verdict { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300; line-height: 1; }
        .rating-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .rating-chip { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 12px; border-radius: 2px; }
        .rating-divider { height: 1px; background: #f0ede8; }
        .bar-row { display: flex; justify-content: space-between; font-family: 'DM Mono', monospace; font-size: 10px; color: #8fa896; margin-bottom: 8px; letter-spacing: 0.06em; }
        .bar-track { height: 4px; background: #ddd8ce; border-radius: 2px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 2px; transition: width 0.9s ease; }
        .rating-summary { font-size: 13px; line-height: 1.75; color: #5a6560; font-style: italic; }
      `}</style>

      <div className="rating-card">
        <div className="rating-header">
          <span className="rating-header-label">Policy Score</span>
          <span className="rating-header-label">{score} / 100</span>
        </div>

        <div className="rating-body">
          <div className="rating-top">
            {/* SVG Score Ring */}
            <div className="score-ring">
              <svg width="110" height="110" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#ede9e0" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r={radius} fill="none"
                  stroke={cfg.color} strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="score-ring-inner">
                <span className="score-big" style={{ color: cfg.color }}>{score}</span>
                <span className="score-sub">/ 100</span>
              </div>
            </div>

            {/* Rating + chips */}
            <div className="rating-meta">
              <div className="rating-verdict" style={{ color: cfg.color }}>
                {overall_policy_rating}
              </div>
              <div className="rating-chips">
                <span className="rating-chip" style={{ background: cfg.bg, color: cfg.color }}>
                  {overall_policy_rating} policy
                </span>
                <span className="rating-chip" style={{ background: ccfg.bg, color: ccfg.color }}>
                  {confidence} confidence
                </span>
                <span className="rating-chip" style={{ background: "#f5f2ec", color: "#8fa896" }}>
                  Risk index · {riskPct}%
                </span>
              </div>
            </div>
          </div>

          <div className="rating-divider" />

          {/* Risk index bar */}
          <div>
            <div className="bar-row">
              <span>Risk Density Index</span>
              <span>{riskPct}%</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${riskPct}%`, background: cfg.color }} />
            </div>
          </div>

          {/* Score bar */}
          <div>
            <div className="bar-row">
              <span>Adjusted Score</span>
              <span>{score_breakdown.adjusted_score} · base {score_breakdown.base_score}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${score}%`, background: "#2d5a3d" }} />
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <>
              <div className="rating-divider" />
              <p className="rating-summary">{summary}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}