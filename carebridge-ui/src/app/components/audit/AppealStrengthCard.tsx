"use client";

import { AppealStrength } from "../../types/audit";

const APPEAL_CONFIG = {
  Strong:   { color: "#2d6b3e", bg: "#eef5f0", track: "#c8e0cc" },
  Moderate: { color: "#9a6c10", bg: "#fdf8ee", track: "#e8d5a0" },
  Weak:     { color: "#b94030", bg: "#fdf2f0", track: "#f0c4be" },
};

export default function AppealStrengthCard({ appeal }: { appeal: AppealStrength }) {
  const cfg = APPEAL_CONFIG[appeal.label] ?? APPEAL_CONFIG.Moderate;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');
        .appeal-card {
          background: white;
          border: 1px solid #ddd8ce;
          border-radius: 4px;
          overflow: hidden;
        }
        .appeal-card-header {
          padding: 16px 24px;
          border-bottom: 1px solid #ddd8ce;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .appeal-card-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8fa896;
        }
        .appeal-card-body { padding: 28px 24px; }
        .appeal-row {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .appeal-pct {
          font-family: 'Cormorant Garamond', serif;
          font-size: 64px;
          font-weight: 300;
          line-height: 1;
          flex-shrink: 0;
        }
        .appeal-pct sup {
          font-size: 24px;
          opacity: 0.5;
          vertical-align: super;
        }
        .appeal-meta { flex: 1; }
        .appeal-verdict {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 300;
          margin-bottom: 10px;
        }
        .appeal-bar-track {
          height: 4px;
          border-radius: 2px;
          margin-bottom: 14px;
          overflow: hidden;
        }
        .appeal-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.9s ease;
        }
        .appeal-reasoning {
          font-size: 12px;
          line-height: 1.7;
          color: #5a6560;
          font-style: italic;
        }
      `}</style>

      <div className="appeal-card">
        <div className="appeal-card-header">
          <span className="appeal-card-label">Appeal Strength Index</span>
          <span className="appeal-card-label">{appeal.percentage}%</span>
        </div>
        <div className="appeal-card-body">
          <div className="appeal-row">
            <div className="appeal-pct" style={{ color: cfg.color }}>
              {appeal.percentage}<sup>%</sup>
            </div>
            <div className="appeal-meta">
              <div className="appeal-verdict" style={{ color: cfg.color }}>
                {appeal.label}
              </div>
              <div className="appeal-bar-track" style={{ background: cfg.track }}>
                <div
                  className="appeal-bar-fill"
                  style={{ width: `${appeal.percentage}%`, background: cfg.color }}
                />
              </div>
              <p className="appeal-reasoning">{appeal.reasoning}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}