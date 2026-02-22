"use client";

import { PrePurchaseReport } from "../../types/prepurchase";

const RATING_CONFIG: Record<string, { color: string; bg: string; border: string; track: string }> = {
  "Strong":   { color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa", track: "#9dd0aa" },
  "Moderate": { color: "#7a4e08", bg: "#faecd0", border: "#e0b870", track: "#e0b870" },
  "Weak":     { color: "#8c1f14", bg: "#f5d0cc", border: "#e08070", track: "#e08070" },
};

const CONF_CONFIG: Record<string, { color: string; bg: string }> = {
  "High":   { color: "#1e5c2e", bg: "#d6eddc" },
  "Medium": { color: "#7a4e08", bg: "#faecd0" },
  "Low":    { color: "#8c1f14", bg: "#f5d0cc" },
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .rc { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .rc-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; display: flex; justify-content: space-between; align-items: center; background: #f5f0e8; }
        .rc-hdr-lbl { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; }
        .rc-body { padding: 28px 24px; display: flex; flex-direction: column; gap: 22px; }
        .rc-top { display: flex; gap: 28px; align-items: center; }
        .rc-ring { width: 114px; height: 114px; position: relative; flex-shrink: 0; }
        .rc-ring svg { transform: rotate(-90deg); }
        .rc-ring-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .rc-score-big { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 600; line-height: 1; }
        .rc-score-sub { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; color: #6a7068; letter-spacing: 0.08em; margin-top: 2px; }
        .rc-meta { flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .rc-verdict { font-family: 'Cormorant Garamond', serif; font-size: 44px; font-weight: 500; line-height: 1; }
        .rc-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .rc-chip { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 12px; border-radius: 2px; }
        .rc-div { height: 1px; background: #e0dbd2; }
        .rc-bar-row { display: flex; justify-content: space-between; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; color: #3d4840; margin-bottom: 8px; letter-spacing: 0.06em; }
        .rc-bar-track { height: 6px; background: #ddd8ce; border-radius: 3px; overflow: hidden; }
        .rc-bar-fill { height: 100%; border-radius: 3px; transition: width 0.9s ease; }
        .rc-summary { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.75; color: #2e3830; font-style: italic; }
      `}</style>

      <div className="rc">
        <div className="rc-hdr">
          <span className="rc-hdr-lbl">Policy Score</span>
          <span className="rc-hdr-lbl">{score} / 100</span>
        </div>
        <div className="rc-body">
          <div className="rc-top">
            <div className="rc-ring">
              <svg width="114" height="114" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#e0dbd2" strokeWidth="8" />
                <circle cx="50" cy="50" r={radius} fill="none"
                  stroke={cfg.color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="rc-ring-inner">
                <span className="rc-score-big" style={{ color: cfg.color }}>{score}</span>
                <span className="rc-score-sub">/ 100</span>
              </div>
            </div>
            <div className="rc-meta">
              <div className="rc-verdict" style={{ color: cfg.color }}>{overall_policy_rating}</div>
              <div className="rc-chips">
                <span className="rc-chip" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  {overall_policy_rating} policy
                </span>
                <span className="rc-chip" style={{ background: ccfg.bg, color: ccfg.color }}>
                  {confidence} confidence
                </span>
                <span className="rc-chip" style={{ background: "#ede8e0", color: "#3d4840" }}>
                  Risk · {riskPct}%
                </span>
              </div>
            </div>
          </div>

          <div className="rc-div" />

          <div>
            <div className="rc-bar-row"><span>Risk Density Index</span><span>{riskPct}%</span></div>
            <div className="rc-bar-track">
              <div className="rc-bar-fill" style={{ width: `${riskPct}%`, background: cfg.color }} />
            </div>
          </div>

          <div>
            <div className="rc-bar-row">
              <span>Adjusted Score</span>
              <span>{score_breakdown.adjusted_score} · base {score_breakdown.base_score}</span>
            </div>
            <div className="rc-bar-track">
              <div className="rc-bar-fill" style={{ width: `${score}%`, background: "#1e5c2e" }} />
            </div>
          </div>

          {summary && (
            <>
              <div className="rc-div" />
              <p className="rc-summary">{summary}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}