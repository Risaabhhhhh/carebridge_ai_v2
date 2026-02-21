"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400;500&display=swap');

        :root {
          --ink: #0f1512;
          --paper: #f5f2ec;
          --sage: #2d5a3d;
          --sage-light: #4a7c5f;
          --sage-pale: #e8f0ea;
          --rust: #c4622d;
          --gold: #b8934a;
          --mist: #8fa896;
          --cream: #faf8f3;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--cream);
          color: var(--ink);
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          overflow-x: hidden;
        }

        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .mono  { font-family: 'DM Mono', monospace; }

        /* NAV */
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 48px;
          backdrop-filter: blur(12px);
          background: rgba(250, 248, 243, 0.85);
          border-bottom: 1px solid rgba(45, 90, 61, 0.1);
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--sage);
          text-decoration: none;
        }
        .nav-links {
          display: flex;
          gap: 36px;
          align-items: center;
          list-style: none;
        }
        .nav-links a {
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink);
          text-decoration: none;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .nav-links a:hover { opacity: 1; }
        .nav-cta {
          font-size: 12px !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          opacity: 1 !important;
          background: var(--sage) !important;
          color: white !important;
          padding: 10px 24px;
          border-radius: 2px;
        }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
        }
        .hero-left {
          padding: 160px 64px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 2;
        }
        .hero-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--sage);
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hero-eyebrow::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: var(--sage);
        }
        .hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(52px, 5.5vw, 80px);
          font-weight: 300;
          line-height: 1.08;
          letter-spacing: -0.01em;
          color: var(--ink);
        }
        .hero-h1 em {
          font-style: italic;
          color: var(--sage);
        }
        .hero-sub {
          margin-top: 28px;
          font-size: 16px;
          line-height: 1.7;
          color: #4a5550;
          max-width: 440px;
          font-weight: 300;
        }
        .hero-actions {
          margin-top: 52px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .btn-primary {
          background: var(--sage);
          color: white;
          padding: 16px 36px;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: background 0.2s, transform 0.2s;
          display: inline-block;
        }
        .btn-primary:hover {
          background: var(--sage-light);
          transform: translateY(-1px);
        }
        .btn-secondary {
          border: 1px solid var(--ink);
          color: var(--ink);
          padding: 16px 36px;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: all 0.2s;
          display: inline-block;
          opacity: 0.7;
        }
        .btn-secondary:hover {
          opacity: 1;
          background: var(--ink);
          color: white;
        }
        .hero-trust {
          margin-top: 56px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          letter-spacing: 0.04em;
          color: var(--mist);
        }
        .trust-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--sage);
          flex-shrink: 0;
        }

        /* HERO RIGHT — Visual Panel */
        .hero-right {
          background: var(--sage);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-right-inner {
          padding: 80px 56px;
          position: relative;
          z-index: 2;
          width: 100%;
        }
        .hero-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 70%, rgba(184, 147, 74, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
        }
        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
        }
        .stat-cell {
          background: rgba(255,255,255,0.06);
          padding: 32px 28px;
          border: 1px solid rgba(255,255,255,0.1);
          transition: background 0.2s;
        }
        .stat-cell:hover { background: rgba(255,255,255,0.1); }
        .stat-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          color: white;
          line-height: 1;
        }
        .stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-top: 8px;
        }
        .hero-panel-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: rgba(255,255,255,0.7);
          margin-bottom: 24px;
          font-style: italic;
        }

        /* MARQUEE */
        .marquee-wrap {
          background: var(--ink);
          padding: 14px 0;
          overflow: hidden;
          white-space: nowrap;
        }
        .marquee-track {
          display: inline-block;
          animation: marquee 28s linear infinite;
        }
        .marquee-item {
          display: inline-block;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          padding: 0 48px;
        }
        .marquee-item span {
          color: var(--gold);
          margin-right: 48px;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* FEATURES */
        .features {
          padding: 120px 64px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--mist);
          margin-bottom: 20px;
        }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 300;
          line-height: 1.1;
          max-width: 560px;
        }
        .features-grid {
          margin-top: 72px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #ddd8ce;
          border: 1px solid #ddd8ce;
        }
        .feature-card {
          background: var(--cream);
          padding: 48px 40px;
          transition: background 0.25s;
          position: relative;
        }
        .feature-card:hover { background: var(--sage-pale); }
        .feature-num {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--mist);
          letter-spacing: 0.08em;
          margin-bottom: 28px;
        }
        .feature-icon {
          width: 40px;
          height: 40px;
          border: 1px solid var(--sage);
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: var(--sage);
          font-size: 18px;
        }
        .feature-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 500;
          margin-bottom: 14px;
          line-height: 1.2;
        }
        .feature-desc {
          font-size: 14px;
          line-height: 1.7;
          color: #5a6560;
        }
        .feature-arrow {
          position: absolute;
          bottom: 32px;
          right: 32px;
          font-size: 20px;
          color: var(--sage);
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        .feature-card:hover .feature-arrow {
          opacity: 1;
          transform: translate(3px, -3px);
        }

        /* WORKFLOW */
        .workflow {
          background: var(--ink);
          padding: 120px 64px;
        }
        .workflow-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .workflow .section-label { color: rgba(255,255,255,0.35); }
        .workflow .section-title { color: white; }
        .workflow-steps {
          margin-top: 72px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 48px;
          position: relative;
        }
        .workflow-steps::before {
          content: '';
          position: absolute;
          top: 28px;
          left: 80px;
          right: 80px;
          height: 1px;
          background: rgba(255,255,255,0.12);
        }
        .workflow-step { position: relative; }
        .step-num-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
        }
        .step-circle {
          width: 56px;
          height: 56px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: var(--gold);
          flex-shrink: 0;
          background: rgba(255,255,255,0.04);
        }
        .step-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 400;
          color: white;
          line-height: 1.2;
        }
        .step-desc {
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255,255,255,0.45);
          padding-left: 72px;
        }

        /* CTA BAND */
        .cta-band {
          background: var(--paper);
          border-top: 1px solid #ddd8ce;
          border-bottom: 1px solid #ddd8ce;
          padding: 100px 64px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-band::before {
          content: 'CareBridge';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(80px, 15vw, 200px);
          font-weight: 300;
          color: rgba(45, 90, 61, 0.04);
          white-space: nowrap;
          pointer-events: none;
          letter-spacing: -0.02em;
        }
        .cta-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 4.5vw, 60px);
          font-weight: 300;
          line-height: 1.1;
          margin-bottom: 20px;
          position: relative;
        }
        .cta-sub {
          font-size: 15px;
          color: #5a6560;
          margin-bottom: 48px;
          position: relative;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }

        /* FOOTER */
        .footer {
          background: var(--ink);
          padding: 56px 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          color: rgba(255,255,255,0.6);
        }
        .footer-disclaimer {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          max-width: 480px;
          line-height: 1.6;
          text-align: center;
        }
        .footer-links {
          display: flex;
          gap: 28px;
        }
        .footer-links a {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: rgba(255,255,255,0.7); }

        /* ANIMATIONS */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-eyebrow { animation: fadeUp 0.6s ease both; }
        .hero-h1      { animation: fadeUp 0.6s 0.1s ease both; }
        .hero-sub     { animation: fadeUp 0.6s 0.2s ease both; }
        .hero-actions { animation: fadeUp 0.6s 0.3s ease both; }
        .hero-trust   { animation: fadeUp 0.6s 0.4s ease both; }
        .hero-right   { animation: fadeUp 0.5s 0.15s ease both; }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; }
          .hero-right { min-height: 360px; }
          .hero-left  { padding: 120px 32px 60px; }
          .features, .workflow { padding: 80px 32px; }
          .features-grid, .workflow-steps { grid-template-columns: 1fr; }
          .workflow-steps::before { display: none; }
          .step-desc { padding-left: 0; }
          .nav { padding: 20px 24px; }
          .footer { flex-direction: column; gap: 24px; text-align: center; }
          .footer-links { justify-content: center; }
          .cta-band { padding: 80px 32px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a href="/" className="nav-logo">CareBridge</a>
        <ul className="nav-links">
          <li><a href="/prepurchase">Analyze Policy</a></li>
          <li><a href="/audit">Claim Audit</a></li>
          <li><a href="/compare">Compare</a></li>
          <li><a href="/prepurchase" className="nav-cta">Get Started</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">IRDAI-Aligned Intelligence</div>

          <h1 className="hero-h1">
            Insurance clarity<br />
            <em>before the claim</em>
          </h1>

          <p className="hero-sub">
            CareBridge decodes policy wording, identifies structural risks, and
            audits claim rejections — with regulatory precision, not guesswork.
          </p>

          <div className="hero-actions">
            <Link href="/prepurchase" className="btn-primary">
              Analyze a Policy
            </Link>
            <Link href="/audit" className="btn-secondary">
              Audit a Rejection
            </Link>
          </div>

          <div className="hero-trust">
            {[
              "Clause-level detection across 10 risk categories",
              "IRDAI compliance evaluation with 7 regulatory markers",
              "Hybrid rule engine + constrained LLM interpretation",
              "Privacy-first — no document storage",
            ].map((t, i) => (
              <div key={i} className="trust-item">
                <span className="trust-dot" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-right-inner">
            <p className="hero-panel-title">Live analysis metrics</p>
            <div className="stat-grid">
              {[
                { n: "10", l: "Clause categories" },
                { n: "7",  l: "IRDAI markers" },
                { n: "48h", l: "Max PED wait detected" },
                { n: "4B",  l: "Parameter model" },
              ].map((s, i) => (
                <div key={i} className="stat-cell">
                  <div className="stat-number">{s.n}</div>
                  <div className="stat-label">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {Array(2).fill([
            "Pre-existing Disease", "Waiting Period", "Room Rent Sublimit",
            "Co-payment Clause", "Exclusion Clarity", "Restoration Benefit",
            "IRDAI Compliance", "Ombudsman Rights", "Claim Settlement",
            "Disease-Specific Caps",
          ]).flat().map((item, i) => (
            <span key={i} className="marquee-item">
              <span>·</span>{item}
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="features">
        <div className="section-label">Intelligence Modules</div>
        <h2 className="section-title serif">
          Every risk surface,<br />
          systematically mapped
        </h2>

        <div className="features-grid">
          {[
            {
              num: "01",
              icon: "⬡",
              title: "Clause-Level Risk Detection",
              desc: "Identifies and classifies 10 critical policy clauses — waiting periods, exclusions, sublimits, co-payments, disease caps — against IRDAI risk thresholds.",
              href: "/prepurchase",
            },
            {
              num: "02",
              icon: "⊛",
              title: "IRDAI Compliance Audit",
              desc: "Evaluates 7 weighted regulatory markers including grievance mechanisms, free-look disclosure, portability clauses, and claims settlement timelines.",
              href: "/prepurchase",
            },
            {
              num: "03",
              icon: "◈",
              title: "Rejection Clause Audit",
              desc: "Matches rejection letters against policy wording, detects contradictions in pre-existing disease and waiting period claims, and scores appeal strength.",
              href: "/audit",
            },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-num">{f.num}</div>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title serif">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-arrow">↗</span>
            </div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="workflow">
        <div className="workflow-inner">
          <div className="section-label">How it works</div>
          <h2 className="section-title serif">
            Three steps from<br />
            document to decision
          </h2>

          <div className="workflow-steps">
            {[
              {
                n: "01",
                title: "Submit your document",
                desc: "Paste policy wording, rejection letters, or medical records. No account required. Nothing is stored.",
              },
              {
                n: "02",
                title: "Hybrid analysis runs",
                desc: "Rule engines classify clauses deterministically. The LLM interprets context, ambiguity, and regulatory alignment.",
              },
              {
                n: "03",
                title: "Receive structured intelligence",
                desc: "Clause risk scores, IRDAI compliance flags, red flags, appeal strength, and step-by-step reapplication guidance.",
              },
            ].map((s, i) => (
              <div key={i} className="workflow-step">
                <div className="step-num-wrap">
                  <div className="step-circle">{s.n}</div>
                  <h4 className="step-title serif">{s.title}</h4>
                </div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="cta-band">
        <h2 className="cta-title serif">
          Make informed decisions.<br />
          <em>Before you commit.</em>
        </h2>
        <p className="cta-sub">
          Replace brochure-driven choices with structured insurance intelligence.
        </p>
        <Link href="/prepurchase" className="btn-primary">
          Begin Analysis
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">CareBridge</div>
        <p className="footer-disclaimer">
          CareBridge provides interpretative support based on submitted text.
          It does not constitute legal advice, claim approval, or regulatory assessment.
          Verify all findings with your insurer or a qualified advisor.
        </p>
        <div className="footer-links">
          <a href="/prepurchase">Policy Analysis</a>
          <a href="/audit">Claim Audit</a>
          <a href="/compare">Compare</a>
        </div>
      </footer>
    </>
  );
}