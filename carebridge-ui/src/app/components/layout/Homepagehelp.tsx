"use client";

// HomepageHelp.tsx
// Embed this section in page.tsx between the features section and the CTA section

export default function HomepageHelp() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400&display=swap');

        .hp-help {
          padding: 100px 0;
          background: #f5f2ec;
          border-top: 1px solid #ddd8ce;
          border-bottom: 1px solid #ddd8ce;
        }
        .hp-help-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 64px;
        }

        /* Header */
        .hp-help-top {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 56px; gap: 32px;
        }
        .hp-help-eyebrow {
          font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #8fa896; margin-bottom: 12px;
        }
        .hp-help-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 3.5vw, 48px); font-weight: 300; line-height: 1.1;
        }
        .hp-help-title em { font-style: italic; color: #2d5a3d; }
        .hp-help-sub {
          font-size: 14px; color: #5a6560; max-width: 340px;
          line-height: 1.75; text-align: right;
        }

        /* Quick actions row */
        .hp-help-quick {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: #ddd8ce;
          border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden;
          margin-bottom: 24px;
        }
        .hp-help-action {
          background: white; padding: 28px 24px;
          display: flex; flex-direction: column; gap: 10px;
          text-decoration: none; color: inherit; transition: background 0.15s;
        }
        .hp-help-action:hover { background: #faf8f3; }
        .hp-action-icon { font-size: 20px; margin-bottom: 4px; }
        .hp-action-label {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.14em; text-transform: uppercase;
        }
        .hp-action-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 400; line-height: 1.25;
        }
        .hp-action-desc { font-size: 12px; color: #5a6560; line-height: 1.65; flex: 1; }
        .hp-action-link {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.1em; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
          margin-top: 8px;
        }
        .hp-action-arrow { transition: transform 0.2s; }
        .hp-help-action:hover .hp-action-arrow { transform: translate(2px, -2px); }

        /* Helplines strip */
        .hp-helplines {
          background: #2d5a3d; border-radius: 4px; padding: 28px 32px;
          display: flex; gap: 0; align-items: center;
        }
        .hp-helpline-label {
          font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.45); white-space: nowrap;
          margin-right: 40px; flex-shrink: 0;
        }
        .hp-helpline-items {
          display: flex; gap: 40px; flex-wrap: wrap; align-items: center;
        }
        .hp-helpline-item { display: flex; flex-direction: column; gap: 3px; }
        .hp-helpline-name {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .hp-helpline-number {
          font-family: 'Cormorant Garamond', serif; font-size: 22px;
          font-weight: 300; color: white; letter-spacing: 0.02em;
        }
        .hp-helpline-divider {
          width: 1px; height: 36px; background: rgba(255,255,255,0.15);
          flex-shrink: 0;
        }

        @media (max-width: 900px) {
          .hp-help-inner { padding: 0 24px; }
          .hp-help-top { flex-direction: column; align-items: flex-start; }
          .hp-help-sub { text-align: left; max-width: 100%; }
          .hp-help-quick { grid-template-columns: 1fr; }
          .hp-helplines { flex-direction: column; align-items: flex-start; gap: 20px; }
          .hp-helpline-label { margin-right: 0; }
          .hp-helpline-items { gap: 20px; }
          .hp-helpline-divider { display: none; }
        }
      `}</style>

      <section className="hp-help">
        <div className="hp-help-inner">

          <div className="hp-help-top">
            <div>
              <div className="hp-help-eyebrow">Need Help?</div>
              <h2 className="hp-help-title">
                Claim rejected?<br />
                <em>You have rights.</em>
              </h2>
            </div>
            <p className="hp-help-sub">
              India's insurance regulatory framework gives policyholders significant
              legal recourse. Free official channels exist at every escalation level.
            </p>
          </div>

          {/* 3 quick action cards */}
          <div className="hp-help-quick">
            <a
              href="https://igms.irda.gov.in/"
              target="_blank" rel="noopener noreferrer"
              className="hp-help-action"
            >
              <div className="hp-action-icon">⊛</div>
              <span className="hp-action-label" style={{ color: "#2d6b3e" }}>Step 1</span>
              <div className="hp-action-title">File with IRDAI IGMS</div>
              <p className="hp-action-desc">
                Official complaint portal. Insurers must respond within 15 days.
                Creates a legal paper trail for escalation.
              </p>
              <div className="hp-action-link" style={{ color: "#2d5a3d" }}>
                igms.irda.gov.in <span className="hp-action-arrow">↗</span>
              </div>
            </a>

            <a
              href="https://cioins.co.in/"
              target="_blank" rel="noopener noreferrer"
              className="hp-help-action"
            >
              <div className="hp-action-icon">◈</div>
              <span className="hp-action-label" style={{ color: "#9a6c10" }}>Step 2</span>
              <div className="hp-action-title">Insurance Ombudsman</div>
              <p className="hp-action-desc">
                Free, binding dispute resolution for claims up to Rs 50 lakhs.
                File within 1 year of your insurer's final reply.
              </p>
              <div className="hp-action-link" style={{ color: "#2d5a3d" }}>
                cioins.co.in <span className="hp-action-arrow">↗</span>
              </div>
            </a>

            <a
              href="https://edaakhil.nic.in/"
              target="_blank" rel="noopener noreferrer"
              className="hp-help-action"
            >
              <div className="hp-action-icon">⬡</div>
              <span className="hp-action-label" style={{ color: "#b94030" }}>Step 3</span>
              <div className="hp-action-title">Consumer Court (NCDRC)</div>
              <p className="hp-action-desc">
                When Ombudsman jurisdiction doesn't apply or award is insufficient.
                Online filing available. No advocate required up to district level.
              </p>
              <div className="hp-action-link" style={{ color: "#2d5a3d" }}>
                edaakhil.nic.in <span className="hp-action-arrow">↗</span>
              </div>
            </a>
          </div>

          {/* Helplines strip */}
          <div className="hp-helplines">
            <span className="hp-helpline-label">Free helplines</span>
            <div className="hp-helpline-items">
              <div className="hp-helpline-item">
                <span className="hp-helpline-name">IRDAI Helpline</span>
                <span className="hp-helpline-number">155255</span>
              </div>
              <div className="hp-helpline-divider" />
              <div className="hp-helpline-item">
                <span className="hp-helpline-name">IRDAI Toll-free</span>
                <span className="hp-helpline-number">1800 4254 732</span>
              </div>
              <div className="hp-helpline-divider" />
              <div className="hp-helpline-item">
                <span className="hp-helpline-name">Consumer Helpline</span>
                <span className="hp-helpline-number">1800-11-4000</span>
              </div>
              <div className="hp-helpline-divider" />
              <div className="hp-helpline-item">
                <span className="hp-helpline-name">Legal Aid (NALSA)</span>
                <span className="hp-helpline-number">15100</span>
              </div>
              <div className="hp-helpline-divider" />
              <div className="hp-helpline-item">
                <span className="hp-helpline-name">Mental Health Support</span>
                <span className="hp-helpline-number">9152987821</span>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}