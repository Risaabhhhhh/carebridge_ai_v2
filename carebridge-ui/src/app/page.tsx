"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        :root {
          --ink:#0a0f0d; --ink2:#1a2018; --cream:#f0ece3; --paper:#e8e3d8;
          --sage:#1e5c2e; --sage2:#2d7a42; --sage-pale:#d6eddc;
          --gold:#9a7030; --mist:#5a7060; --border:#c8c2b4; --border2:#ddd8ce;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--cream);color:var(--ink2);font-family:'Outfit',sans-serif;font-weight:400;overflow-x:hidden;-webkit-font-smoothing:antialiased;}

        /* NAV */
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:0 52px;height:70px;background:rgba(10,15,13,0.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(45,122,66,0.3);}
        .nav-logo{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;letter-spacing:.03em;color:#d8eedd;text-decoration:none;}
        .nav-logo span{color:#5aad74;}
        .nav-links{display:flex;gap:36px;align-items:center;list-style:none;}
        .nav-links a{font-family:'DM Mono',monospace;font-size:11px;font-weight:400;letter-spacing:.13em;text-transform:uppercase;color:#7aab8a;text-decoration:none;transition:color .2s;}
        .nav-links a:hover{color:#d8eedd;}
        .nav-cta{background:var(--sage)!important;color:#e8f0ea!important;padding:10px 22px;border-radius:2px;border:1px solid #3d7a52!important;transition:background .2s!important;}
        .nav-cta:hover{background:var(--sage2)!important;}

        /* HERO */
        .hero{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;position:relative;overflow:hidden;}
        .hero-left{padding:160px 72px 80px 64px;display:flex;flex-direction:column;justify-content:center;background:var(--cream);}
        .hero-eyebrow{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--sage);margin-bottom:32px;display:flex;align-items:center;gap:14px;}
        .hero-eyebrow::before{content:'';display:block;width:36px;height:1.5px;background:var(--sage);}
        .hero-h1{font-family:'Cormorant Garamond',serif;font-size:clamp(52px,5.5vw,82px);font-weight:500;line-height:1.06;letter-spacing:-.01em;color:var(--ink);}
        .hero-h1 em{font-style:italic;color:var(--sage);}
        .hero-sub{margin-top:28px;font-size:16px;font-weight:400;line-height:1.8;color:var(--ink2);max-width:460px;}
        .hero-actions{margin-top:52px;display:flex;gap:14px;flex-wrap:wrap;}
        .btn-primary{background:var(--sage);color:#e8f0ea;padding:16px 36px;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;border-radius:2px;border:1px solid #3d7a52;transition:background .2s,transform .15s;display:inline-block;}
        .btn-primary:hover{background:var(--sage2);transform:translateY(-1px);}
        .btn-secondary{border:1.5px solid var(--ink);color:var(--ink);padding:16px 36px;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;border-radius:2px;transition:all .2s;display:inline-block;}
        .btn-secondary:hover{background:var(--ink);color:var(--cream);}
        .hero-trust{margin-top:56px;display:flex;flex-direction:column;gap:11px;}
        .trust-item{display:flex;align-items:center;gap:11px;font-size:13px;font-weight:400;color:var(--mist);}
        .trust-dot{width:5px;height:5px;border-radius:50%;background:var(--sage);flex-shrink:0;}

        /* HERO RIGHT */
        .hero-right{background:var(--ink);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;}
        .hero-right::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 25% 75%,rgba(30,92,46,.3) 0%,transparent 55%),radial-gradient(ellipse at 80% 20%,rgba(154,112,48,.12) 0%,transparent 50%);}
        .hero-right-inner{padding:80px 56px;position:relative;z-index:2;width:100%;}
        .hero-panel-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:400;font-style:italic;color:rgba(255,255,255,.5);margin-bottom:28px;}
        .stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;}
        .stat-cell{background:rgba(255,255,255,.05);padding:34px 28px;border:1px solid rgba(255,255,255,.08);transition:background .2s;}
        .stat-cell:hover{background:rgba(255,255,255,.09);}
        .stat-number{font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:500;color:#e8f0ea;line-height:1;}
        .stat-label{font-family:'DM Mono',monospace;font-size:10px;font-weight:400;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-top:10px;}

        /* MARQUEE */
        .marquee-wrap{background:var(--ink2);padding:15px 0;overflow:hidden;white-space:nowrap;border-top:1px solid rgba(255,255,255,.06);}
        .marquee-track{display:inline-block;animation:marquee 32s linear infinite;}
        .marquee-item{display:inline-block;font-family:'DM Mono',monospace;font-size:11px;font-weight:400;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.28);padding:0 52px;}
        .marquee-item span{color:#9a7030;margin-right:52px;}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

        /* FEATURES */
        .features{padding:128px 64px;max-width:1280px;margin:0 auto;}
        .section-label{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--mist);margin-bottom:20px;}
        .section-title{font-family:'Cormorant Garamond',serif;font-size:clamp(38px,4vw,58px);font-weight:500;line-height:1.08;color:var(--ink);}
        .features-grid{margin-top:72px;display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border);}
        .feature-card{background:var(--cream);padding:48px 40px;transition:background .2s;position:relative;cursor:default;}
        .feature-card:hover{background:#deeee2;}
        .feature-num{font-family:'DM Mono',monospace;font-size:11px;font-weight:400;color:var(--mist);letter-spacing:.1em;margin-bottom:28px;}
        .feature-icon{width:44px;height:44px;border:1.5px solid var(--sage);border-radius:2px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;color:var(--sage);font-size:20px;}
        .feature-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;margin-bottom:14px;line-height:1.2;color:var(--ink);}
        .feature-desc{font-size:14px;font-weight:400;line-height:1.78;color:var(--ink2);}
        .feature-arrow{position:absolute;bottom:32px;right:32px;font-size:20px;color:var(--sage);opacity:0;transition:opacity .2s,transform .2s;}
        .feature-card:hover .feature-arrow{opacity:1;transform:translate(3px,-3px);}

        /* WORKFLOW */
        .workflow{background:var(--ink);padding:128px 64px;}
        .workflow-inner{max-width:1280px;margin:0 auto;}
        .workflow .section-label{color:rgba(255,255,255,.28);}
        .workflow .section-title{color:#e8f0ea;}
        .workflow-steps{margin-top:72px;display:grid;grid-template-columns:repeat(3,1fr);gap:56px;position:relative;}
        .workflow-steps::before{content:'';position:absolute;top:28px;left:80px;right:80px;height:1px;background:rgba(255,255,255,.1);}
        .step-num-wrap{display:flex;align-items:center;gap:18px;margin-bottom:28px;}
        .step-circle{width:56px;height:56px;border-radius:50%;border:1px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:#9a7030;flex-shrink:0;background:rgba(255,255,255,.04);}
        .step-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:#e8f0ea;line-height:1.2;}
        .step-desc{font-size:14px;font-weight:400;line-height:1.78;color:rgba(255,255,255,.42);padding-left:74px;}

        /* HELP */
        .help-strip{background:var(--paper);border-top:1px solid var(--border);padding:96px 64px;}
        .help-strip-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:300px 1fr;gap:72px;align-items:start;}
        .help-eyebrow{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--mist);margin-bottom:18px;}
        .help-title{font-family:'Cormorant Garamond',serif;font-size:clamp(30px,3vw,44px);font-weight:500;line-height:1.1;margin-bottom:18px;color:var(--ink);}
        .help-title em{font-style:italic;color:var(--sage);}
        .help-sub{font-size:14px;font-weight:400;color:var(--ink2);line-height:1.8;margin-bottom:28px;}
        .help-cta{display:inline-flex;align-items:center;gap:8px;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;color:var(--sage);text-decoration:none;border-bottom:1.5px solid rgba(30,92,46,.4);padding-bottom:2px;transition:border-color .2s;}
        .help-cta:hover{border-color:var(--sage);}
        .help-orgs{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:4px;overflow:hidden;}
        .help-org{background:white;padding:22px 24px;display:flex;flex-direction:column;gap:7px;text-decoration:none;color:inherit;transition:background .15s;}
        .help-org:hover{background:var(--cream);}
        .help-org-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;}
        .help-org-name{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--ink);}
        .help-org-type{font-family:'DM Mono',monospace;font-size:9px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;flex-shrink:0;}
        .help-org-desc{font-size:12px;font-weight:400;line-height:1.68;color:var(--ink2);}
        .help-org-action{font-family:'DM Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--sage);display:flex;align-items:center;gap:4px;margin-top:4px;}

        /* CTA */
        .cta-band{background:var(--cream);border-top:1px solid var(--border);padding:112px 64px;text-align:center;position:relative;overflow:hidden;}
        .cta-band::before{content:'CareBridge';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Cormorant Garamond',serif;font-size:clamp(80px,16vw,210px);font-weight:500;color:rgba(30,92,46,.05);white-space:nowrap;pointer-events:none;}
        .cta-title{font-family:'Cormorant Garamond',serif;font-size:clamp(38px,4.5vw,62px);font-weight:500;line-height:1.08;margin-bottom:20px;position:relative;color:var(--ink);}
        .cta-title em{font-style:italic;color:var(--sage);}
        .cta-sub{font-size:16px;font-weight:400;color:var(--ink2);margin-bottom:52px;position:relative;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.75;}

        /* FOOTER */
        .footer{background:var(--ink);padding:56px 64px;display:flex;justify-content:space-between;align-items:center;}
        .footer-logo{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:rgba(255,255,255,.45);}
        .footer-disclaimer{font-size:12px;font-weight:400;color:rgba(255,255,255,.2);max-width:480px;line-height:1.68;text-align:center;}
        .footer-links{display:flex;gap:28px;}
        .footer-links a{font-family:'DM Mono',monospace;font-size:10px;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.3);text-decoration:none;transition:color .2s;}
        .footer-links a:hover{color:rgba(255,255,255,.7);}

        @media(max-width:900px){
          .hero{grid-template-columns:1fr;} .hero-right{min-height:360px;}
          .hero-left{padding:120px 32px 60px;}
          .features,.workflow{padding:80px 32px;}
          .features-grid,.workflow-steps{grid-template-columns:1fr;}
          .workflow-steps::before{display:none;} .step-desc{padding-left:0;}
          .nav{padding:0 24px;}
          .footer{flex-direction:column;gap:28px;text-align:center;}
          .footer-links{justify-content:center;}
          .cta-band,.help-strip{padding:80px 28px;}
          .help-strip-inner{grid-template-columns:1fr;gap:40px;}
          .help-orgs{grid-template-columns:1fr;}
        }
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">Care<span>Bridge</span></a>
        <ul className="nav-links">
          <li><a href="/prepurchase">Analyze Policy</a></li>
          <li><a href="/audit">Claim Audit</a></li>
          <li><a href="/compare">Compare</a></li>
          <li><a href="/learn">Learn</a></li>
          <li><a href="/prepurchase" className="nav-cta">Get Started</a></li>
        </ul>
      </nav>

      <section className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">IRDAI-Aligned Intelligence</div>
          <h1 className="hero-h1">Insurance clarity<br /><em>before the claim</em></h1>
          <p className="hero-sub">
            CareBridge decodes policy wording, identifies structural risks, and
            audits claim rejections — with regulatory precision, not guesswork.
          </p>
          <div className="hero-actions">
            <Link href="/prepurchase" className="btn-primary">Analyze a Policy</Link>
            <Link href="/audit" className="btn-secondary">Audit a Rejection</Link>
          </div>
          <div className="hero-trust">
            {["Clause-level detection across 10 risk categories","IRDAI compliance evaluation with 7 regulatory markers","Hybrid rule engine + constrained LLM interpretation","Privacy-first — no document storage"].map((t,i)=>(
              <div key={i} className="trust-item"><span className="trust-dot"/>{t}</div>
            ))}
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-right-inner">
            <p className="hero-panel-title">Live analysis metrics</p>
            <div className="stat-grid">
              {[{n:"10",l:"Clause categories"},{n:"7",l:"IRDAI markers"},{n:"48h",l:"Max PED wait detected"},{n:"4B",l:"Parameter model"}].map((s,i)=>(
                <div key={i} className="stat-cell">
                  <div className="stat-number">{s.n}</div>
                  <div className="stat-label">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-track">
          {Array(2).fill(["Pre-existing Disease","Waiting Period","Room Rent Sublimit","Co-payment Clause","Exclusion Clarity","Restoration Benefit","IRDAI Compliance","Ombudsman Rights","Claim Settlement","Disease-Specific Caps"]).flat().map((item,i)=>(
            <span key={i} className="marquee-item"><span>·</span>{item}</span>
          ))}
        </div>
      </div>

      <section className="features">
        <div className="section-label">Intelligence Modules</div>
        <h2 className="section-title">Every risk surface,<br/>systematically mapped</h2>
        <div className="features-grid">
          {[
            {num:"01",icon:"⬡",title:"Clause-Level Risk Detection",desc:"Identifies and classifies 10 critical policy clauses — waiting periods, exclusions, sublimits, co-payments, disease caps — against IRDAI risk thresholds."},
            {num:"02",icon:"⊛",title:"IRDAI Compliance Audit",desc:"Evaluates 7 weighted regulatory markers including grievance mechanisms, free-look disclosure, portability clauses, and claims settlement timelines."},
            {num:"03",icon:"◈",title:"Rejection Clause Audit",desc:"Matches rejection letters against policy wording, detects contradictions in pre-existing disease and waiting period claims, and scores appeal strength."},
          ].map((f,i)=>(
            <div key={i} className="feature-card">
              <div className="feature-num">{f.num}</div>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-arrow">↗</span>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow">
        <div className="workflow-inner">
          <div className="section-label">How it works</div>
          <h2 className="section-title">Three steps from<br/>document to decision</h2>
          <div className="workflow-steps">
            {[
              {n:"01",title:"Submit your document",desc:"Paste policy wording, rejection letters, or medical records. No account required. Nothing is stored."},
              {n:"02",title:"Hybrid analysis runs",desc:"Rule engines classify clauses deterministically. The LLM interprets context, ambiguity, and regulatory alignment."},
              {n:"03",title:"Receive structured intelligence",desc:"Clause risk scores, IRDAI compliance flags, red flags, appeal strength, and step-by-step reapplication guidance."},
            ].map((s,i)=>(
              <div key={i}>
                <div className="step-num-wrap">
                  <div className="step-circle">{s.n}</div>
                  <h4 className="step-title">{s.title}</h4>
                </div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="help-strip">
        <div className="help-strip-inner">
          <div>
            <div className="help-eyebrow">Support & Resources</div>
            <h2 className="help-title">Rejected?<br/><em>Help exists.</em></h2>
            <p className="help-sub">Free regulators, legal aid, and NGOs can assist with insurance disputes — no lawyer required for most escalations.</p>
            <a href="/audit" className="help-cta">Audit your rejection ↗</a>
          </div>
          <div className="help-orgs">
            {[
              {name:"IRDAI IGMS",type:"Regulator",desc:"File official complaints if insurer hasn't responded in 15 days.",action:"igms.irda.gov.in",url:"https://igms.irda.gov.in/",color:"#1e5c2e",bg:"#d6eddc"},
              {name:"Insurance Ombudsman",type:"Quasi-Judicial",desc:"Free, binding resolution for claims up to Rs 50 lakhs.",action:"cioins.co.in",url:"https://cioins.co.in/",color:"#2d3f7a",bg:"#d8dff5"},
              {name:"NALSA Legal Aid",type:"Legal Aid",desc:"Free lawyers for eligible citizens. Covers consumer forum cases.",action:"nalsa.gov.in",url:"https://nalsa.gov.in/",color:"#3a5c10",bg:"#daecd0"},
              {name:"Consumer Forum",type:"Legal",desc:"Insurance rejections qualify as deficiency of service under CPA 2019.",action:"edaakhil.nic.in",url:"https://edaakhil.nic.in/",color:"#6a3a10",bg:"#f0deca"},
            ].map((org,i)=>(
              <a key={i} href={org.url} target="_blank" rel="noopener noreferrer" className="help-org">
                <div className="help-org-top">
                  <span className="help-org-name">{org.name}</span>
                  <span className="help-org-type" style={{background:org.bg,color:org.color}}>{org.type}</span>
                </div>
                <p className="help-org-desc">{org.desc}</p>
                <span className="help-org-action">{org.action} ↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <h2 className="cta-title">Make informed decisions.<br/><em>Before you commit.</em></h2>
        <p className="cta-sub">Replace brochure-driven choices with structured insurance intelligence.</p>
        <Link href="/prepurchase" className="btn-primary">Begin Analysis</Link>
      </section>

      <footer className="footer">
        <div className="footer-logo">CareBridge</div>
        <p className="footer-disclaimer">CareBridge provides interpretative support based on submitted text. It does not constitute legal advice, claim approval, or regulatory assessment. Verify all findings with your insurer or a qualified advisor.</p>
        <div className="footer-links">
          <a href="/prepurchase">Policy Analysis</a>
          <a href="/audit">Claim Audit</a>
          <a href="/compare">Compare</a>
          <a href="/learn">Learn</a>
        </div>
      </footer>
    </>
  );
}