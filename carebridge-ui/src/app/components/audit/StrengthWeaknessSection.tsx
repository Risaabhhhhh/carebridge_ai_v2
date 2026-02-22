"use client";

export default function StrengthWeaknessSection({ strong, weak, steps }: {
  strong: string[]; weak: string[]; steps: string[];
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .sw { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .sw-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; background: #f5f0e8; }
        .sw-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .sw-col { padding: 22px 24px; }
        .sw-col + .sw-col { border-left: 1px solid #c8c2b8; }
        .sw-col-lbl { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 14px; }
        .sw-item { display: flex; gap: 10px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid #eee8e0; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 400; line-height: 1.65; color: #1a2018; }
        .sw-item:last-child { border-bottom: none; }
        .sw-icon { flex-shrink: 0; margin-top: 3px; font-size: 10px; }
        .sw-empty { font-family: 'DM Mono', monospace; font-size: 12px; color: #8a8880; font-style: italic; }
        .sw-steps { border-top: 1px solid #c8c2b8; }
        .sw-steps-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; display: flex; justify-content: space-between; background: #f5f0e8; }
        .sw-step-row { display: flex; gap: 18px; align-items: flex-start; padding: 16px 24px; border-bottom: 1px solid #eee8e0; }
        .sw-step-row:last-child { border-bottom: none; }
        .sw-step-num { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: #5a8066; flex-shrink: 0; margin-top: 1px; letter-spacing: 0.06em; }
        .sw-step-text { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 400; color: #1a2018; line-height: 1.65; }
        @media (max-width: 600px) {
          .sw-grid { grid-template-columns: 1fr; }
          .sw-col + .sw-col { border-left: none; border-top: 1px solid #c8c2b8; }
        }
      `}</style>

      <div className="sw">
        <div className="sw-hdr">Case Assessment</div>
        <div className="sw-grid">
          <div className="sw-col">
            <div className="sw-col-lbl" style={{ color: "#1e5c2e" }}>Points in your favour</div>
            {strong.length > 0 ? strong.map((p, i) => (
              <div key={i} className="sw-item">
                <span className="sw-icon" style={{ color: "#1e5c2e" }}>◆</span>{p}
              </div>
            )) : <div className="sw-empty">None identified</div>}
          </div>
          <div className="sw-col">
            <div className="sw-col-lbl" style={{ color: "#8c1f14" }}>Challenges to address</div>
            {weak.length > 0 ? weak.map((p, i) => (
              <div key={i} className="sw-item">
                <span className="sw-icon" style={{ color: "#8c1f14" }}>▲</span>{p}
              </div>
            )) : <div className="sw-empty">None identified</div>}
          </div>
        </div>

        {steps.length > 0 && (
          <div className="sw-steps">
            <div className="sw-steps-hdr">
              <span>Recommended Next Steps</span>
              <span>{steps.length} actions</span>
            </div>
            {steps.map((step, i) => (
              <div key={i} className="sw-step-row">
                <span className="sw-step-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="sw-step-text">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}