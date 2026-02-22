"use client";

import { AppealStrength } from "../../types/audit";

const APPEAL_CONFIG = {
  Strong:   { color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa", track: "#9dd0aa" },
  Moderate: { color: "#7a4e08", bg: "#faecd0", border: "#e0b870", track: "#e0b870" },
  Weak:     { color: "#8c1f14", bg: "#f5d0cc", border: "#e08070", track: "#e08070" },
};

export default function AppealStrengthCard({ appeal }: { appeal: AppealStrength }) {
  const cfg = APPEAL_CONFIG[appeal.label] ?? APPEAL_CONFIG.Moderate;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .asc { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .asc-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; display: flex; justify-content: space-between; align-items: center; background: #f5f0e8; }
        .asc-hdr-lbl { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; }
        .asc-body { padding: 28px 24px; }
        .asc-row { display: flex; align-items: center; gap: 28px; }
        .asc-pct { font-family: 'Cormorant Garamond', serif; font-size: 68px; font-weight: 600; line-height: 1; flex-shrink: 0; }
        .asc-pct sup { font-size: 26px; opacity: 0.55; vertical-align: super; }
        .asc-meta { flex: 1; }
        .asc-verdict { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 500; margin-bottom: 12px; }
        .asc-bar-track { height: 6px; border-radius: 3px; margin-bottom: 14px; overflow: hidden; }
        .asc-bar-fill { height: 100%; border-radius: 3px; transition: width 0.9s ease; }
        .asc-reasoning { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.7; color: #2e3830; font-style: italic; }
      `}</style>

      <div className="asc">
        <div className="asc-hdr">
          <span className="asc-hdr-lbl">Appeal Strength Index</span>
          <span className="asc-hdr-lbl">{appeal.percentage}%</span>
        </div>
        <div className="asc-body">
          <div className="asc-row">
            <div className="asc-pct" style={{ color: cfg.color }}>
              {appeal.percentage}<sup>%</sup>
            </div>
            <div className="asc-meta">
              <div className="asc-verdict" style={{ color: cfg.color }}>{appeal.label}</div>
              <div className="asc-bar-track" style={{ background: cfg.track }}>
                <div className="asc-bar-fill" style={{ width: `${appeal.percentage}%`, background: cfg.color }} />
              </div>
              <p className="asc-reasoning">{appeal.reasoning}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}