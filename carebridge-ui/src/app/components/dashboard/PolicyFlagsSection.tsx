"use client";

interface Props {
  redFlags:      string[];
  positiveFlags: string[];
}

export default function PolicyFlagsSection({ redFlags, positiveFlags }: Props) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');
        .flags-card { background: white; border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden; }
        .flags-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; display: flex; justify-content: space-between; align-items: center; }
        .flags-header-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; }
        .flags-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .flags-col { padding: 24px; }
        .flags-col + .flags-col { border-left: 1px solid #ddd8ce; }
        .flags-col-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 16px; }
        .flag-item { display: flex; gap: 10px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid #f5f2ec; font-size: 12px; line-height: 1.6; color: #4a5550; }
        .flag-item:last-child { border-bottom: none; }
        .flag-icon { flex-shrink: 0; margin-top: 2px; font-size: 10px; }
        .flags-empty { font-size: 12px; color: #c0bfba; font-style: italic; font-family: 'DM Mono', monospace; }
        .flags-footer { padding: 12px 24px; border-top: 1px solid #ddd8ce; background: #faf8f3; display: flex; gap: 20px; }
        .flags-footer-stat { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.08em; color: #8fa896; }
        .flags-footer-stat strong { color: #0f1512; }
        @media (max-width: 600px) {
          .flags-grid { grid-template-columns: 1fr; }
          .flags-col + .flags-col { border-left: none; border-top: 1px solid #ddd8ce; }
        }
      `}</style>

      <div className="flags-card">
        <div className="flags-header">
          <span className="flags-header-label">Policy Signals</span>
          <span className="flags-header-label">
            {redFlags.length + positiveFlags.length} total
          </span>
        </div>

        <div className="flags-grid">
          {/* Risk flags */}
          <div className="flags-col">
            <div className="flags-col-label" style={{ color: "#b94030" }}>
              Risk Indicators — {redFlags.length}
            </div>
            {redFlags.length > 0 ? redFlags.map((f, i) => (
              <div key={i} className="flag-item">
                <span className="flag-icon" style={{ color: "#d95f4b" }}>▲</span>
                {f}
              </div>
            )) : (
              <div className="flags-empty">No major risks detected</div>
            )}
          </div>

          {/* Positive flags */}
          <div className="flags-col">
            <div className="flags-col-label" style={{ color: "#2d6b3e" }}>
              Strength Indicators — {positiveFlags.length}
            </div>
            {positiveFlags.length > 0 ? positiveFlags.map((f, i) => (
              <div key={i} className="flag-item">
                <span className="flag-icon" style={{ color: "#3d8a52" }}>◆</span>
                {f}
              </div>
            )) : (
              <div className="flags-empty">No notable strengths identified</div>
            )}
          </div>
        </div>

        <div className="flags-footer">
          <span className="flags-footer-stat">
            <strong>{redFlags.length}</strong> risk indicators
          </span>
          <span className="flags-footer-stat">
            <strong>{positiveFlags.length}</strong> strength indicators
          </span>
        </div>
      </div>
    </>
  );
}