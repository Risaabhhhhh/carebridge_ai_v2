"use client";

export default function RegulatorySection({ text }: { text: string }) {
  if (!text) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        .reg { background: #fff; border: 1px solid #c8c2b8; border-radius: 4px; overflow: hidden; }
        .reg-hdr { padding: 14px 24px; border-bottom: 1px solid #c8c2b8; display: flex; justify-content: space-between; align-items: center; background: #f5f0e8; }
        .reg-hdr-lbl { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; color: #4a5248; }
        .reg-hdr-badge { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; background: #d6eddc; color: #1e5c2e; border-radius: 2px; border: 1px solid #9dd0aa; }
        .reg-body { padding: 28px 24px; }
        .reg-text { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.9; color: #1a2018; white-space: pre-line; }
        .reg-footer { margin-top: 22px; padding-top: 18px; border-top: 1px solid #e0dbd2; display: flex; gap: 10px; align-items: flex-start; }
        .reg-footer-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; color: #5a8066; }
        .reg-footer-text { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; letter-spacing: 0.04em; color: #3d4840; line-height: 1.65; }
      `}</style>

      <div className="reg">
        <div className="reg-hdr">
          <span className="reg-hdr-lbl">IRDAI Regulatory Context</span>
          <span className="reg-hdr-badge">IRDAI · Ombudsman</span>
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