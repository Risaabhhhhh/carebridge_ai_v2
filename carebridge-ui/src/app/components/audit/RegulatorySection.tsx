"use client";

export default function RegulatorySection({ text }: { text: string }) {
  if (!text) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');
        .reg-card { background: white; border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden; }
        .reg-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; display: flex; justify-content: space-between; align-items: center; }
        .reg-header-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; }
        .reg-header-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; background: #eef5f0; color: #2d6b3e; border-radius: 2px; }
        .reg-body { padding: 28px 24px; }
        .reg-text { font-size: 13px; line-height: 1.85; color: #4a5550; white-space: pre-line; }
        .reg-footer { margin-top: 20px; padding-top: 18px; border-top: 1px solid #f0ede8; display: flex; gap: 10px; align-items: flex-start; }
        .reg-footer-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; color: #8fa896; }
        .reg-footer-text { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.04em; color: #8fa896; line-height: 1.6; }
      `}</style>

      <div className="reg-card">
        <div className="reg-header">
          <span className="reg-header-label">IRDAI Regulatory Context</span>
          <span className="reg-header-badge">IRDAI · Ombudsman</span>
        </div>
        <div className="reg-body">
          <p className="reg-text">{text}</p>
          <div className="reg-footer">
            <span className="reg-footer-icon">◈</span>
            <span className="reg-footer-text">
              This guidance reflects regulatory protections under IRDAI regulations.
              For case-specific clarification, consult your insurer's Grievance Redressal
              Officer or the Insurance Ombudsman for your jurisdiction.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}