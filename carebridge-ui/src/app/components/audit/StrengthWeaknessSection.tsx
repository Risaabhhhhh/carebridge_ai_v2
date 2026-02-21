"use client";

export default function StrengthWeaknessSection({
  strong,
  weak,
  steps,
}: {
  strong: string[];
  weak: string[];
  steps: string[];
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400&family=DM+Mono:wght@300;400&display=swap');
        .sw-card { background: white; border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden; }
        .sw-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; }
        .sw-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .sw-col { padding: 24px; }
        .sw-col + .sw-col { border-left: 1px solid #ddd8ce; }
        .sw-col-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 16px; }
        .sw-item { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f5f2ec; font-size: 12px; line-height: 1.6; color: #4a5550; }
        .sw-item:last-child { border-bottom: none; }
        .sw-icon { flex-shrink: 0; margin-top: 2px; font-size: 10px; }
        .sw-empty { font-size: 12px; color: #c0bfba; font-style: italic; font-family: 'DM Mono', monospace; }

        .steps-section { border-top: 1px solid #ddd8ce; }
        .steps-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; display: flex; justify-content: space-between; }
        .steps-list { display: flex; flex-direction: column; }
        .step-row { display: flex; gap: 16px; align-items: flex-start; padding: 16px 24px; border-bottom: 1px solid #f5f2ec; }
        .step-row:last-child { border-bottom: none; }
        .step-num { font-family: 'DM Mono', monospace; font-size: 10px; color: #8fa896; flex-shrink: 0; margin-top: 2px; letter-spacing: 0.06em; }
        .step-text { font-size: 13px; color: #4a5550; line-height: 1.6; }

        @media (max-width: 600px) {
          .sw-grid { grid-template-columns: 1fr; }
          .sw-col + .sw-col { border-left: none; border-top: 1px solid #ddd8ce; }
        }
      `}</style>

      <div className="sw-card">
        <div className="sw-header">Case Assessment</div>

        {/* Strong / Weak columns */}
        <div className="sw-grid">
          <div className="sw-col">
            <div className="sw-col-label" style={{ color: "#2d6b3e" }}>
              Points in your favour
            </div>
            {strong.length > 0 ? strong.map((p, i) => (
              <div key={i} className="sw-item">
                <span className="sw-icon" style={{ color: "#3d8a52" }}>◆</span>
                {p}
              </div>
            )) : (
              <div className="sw-empty">None identified</div>
            )}
          </div>

          <div className="sw-col">
            <div className="sw-col-label" style={{ color: "#b94030" }}>
              Challenges to address
            </div>
            {weak.length > 0 ? weak.map((p, i) => (
              <div key={i} className="sw-item">
                <span className="sw-icon" style={{ color: "#d95f4b" }}>▲</span>
                {p}
              </div>
            )) : (
              <div className="sw-empty">None identified</div>
            )}
          </div>
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div className="steps-section">
            <div className="steps-header">
              <span>Recommended Next Steps</span>
              <span>{steps.length} actions</span>
            </div>
            <div className="steps-list">
              {steps.map((step, i) => (
                <div key={i} className="step-row">
                  <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="step-text">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}