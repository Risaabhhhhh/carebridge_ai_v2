"use client";

interface Props { redFlags: string[]; positiveFlags: string[]; }

export default function PolicyFlagsSection({ redFlags, positiveFlags }: Props) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .pf { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .pf-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; display: flex; justify-content: space-between; align-items: center; background: #f5f0e8; }
        .pf-hdr-lbl { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; }
        .pf-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .pf-col { padding: 22px 24px; }
        .pf-col + .pf-col { border-left: 1px solid #c8c2b8; }
        .pf-col-lbl { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 14px; }
        .pf-item { display: flex; gap: 10px; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid #eee8e0; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 400; line-height: 1.6; color: #1a2018; }
        .pf-item:last-child { border-bottom: none; }
        .pf-icon { flex-shrink: 0; margin-top: 3px; font-size: 10px; }
        .pf-empty { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 400; color: #8a8880; font-style: italic; }
        .pf-footer { padding: 12px 24px; border-top: 1px solid #c8c2b8; display: flex; gap: 20px; background: #f0ece4; }
        .pf-fstat { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; letter-spacing: 0.08em; color: #3d4840; }
        .pf-fstat strong { color: #0f1512; font-weight: 500; }
        @media (max-width: 600px) {
          .pf-grid { grid-template-columns: 1fr; }
          .pf-col + .pf-col { border-left: none; border-top: 1px solid #c8c2b8; }
        }
      `}</style>

      <div className="pf">
        <div className="pf-hdr">
          <span className="pf-hdr-lbl">Policy Signals</span>
          <span className="pf-hdr-lbl">{redFlags.length + positiveFlags.length} total</span>
        </div>
        <div className="pf-grid">
          <div className="pf-col">
            <div className="pf-col-lbl" style={{ color: "#8c1f14" }}>Risk Indicators — {redFlags.length}</div>
            {redFlags.length > 0 ? redFlags.map((f, i) => (
              <div key={i} className="pf-item">
                <span className="pf-icon" style={{ color: "#8c1f14" }}>▲</span>{f}
              </div>
            )) : <div className="pf-empty">No major risks detected</div>}
          </div>
          <div className="pf-col">
            <div className="pf-col-lbl" style={{ color: "#1e5c2e" }}>Strength Indicators — {positiveFlags.length}</div>
            {positiveFlags.length > 0 ? positiveFlags.map((f, i) => (
              <div key={i} className="pf-item">
                <span className="pf-icon" style={{ color: "#1e5c2e" }}>◆</span>{f}
              </div>
            )) : <div className="pf-empty">No notable strengths identified</div>}
          </div>
        </div>
        <div className="pf-footer">
          <span className="pf-fstat"><strong>{redFlags.length}</strong> risk indicators</span>
          <span className="pf-fstat"><strong>{positiveFlags.length}</strong> strength indicators</span>
        </div>
      </div>
    </>
  );
}