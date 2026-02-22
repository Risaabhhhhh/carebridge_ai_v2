"use client";

const SUPPORT_ORGS = [
  // Government / Regulatory
  {
    name:        "Insurance Ombudsman",
    type:        "Regulatory",
    description: "Free, binding dispute resolution for claim rejections up to Rs 50 lakhs. Must be approached within 1 year of insurer's final reply. No lawyers required.",
    action:      "File a complaint",
    url:         "https://cioins.co.in/",
    phone:       null,
    tags:        ["Free", "Binding award", "Rs 50L limit", "Official"],
    urgent:      true,
  },
  {
    name:        "IRDAI Consumer Helpline",
    type:        "Regulatory",
    description: "Toll-free helpline for immediate guidance on insurance grievances, complaint filing, and understanding your policyholder rights.",
    action:      "Call now",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo253&flag=1",
    phone:       "155255 / 1800 4254 732",
    tags:        ["Free", "Toll-free", "Immediate help"],
    urgent:      true,
  },
  {
    name:        "IRDAI IGMS — Complaint Portal",
    type:        "Regulatory",
    description: "File and track your insurance complaint officially. Creates a paper trail. Insurers must respond within 15 days of IGMS complaint registration.",
    action:      "File complaint",
    url:         "https://igms.irda.gov.in/",
    phone:       null,
    tags:        ["Official record", "15-day deadline", "Online"],
    urgent:      false,
  },

  // Legal Aid / Consumer Rights
  {
    name:        "National Consumer Helpline",
    type:        "Consumer Rights",
    description: "Government-run consumer grievance centre. Can assist with insurance disputes alongside IRDAI channels. Available in multiple languages.",
    action:      "Get help",
    url:         "https://consumerhelpline.gov.in/",
    phone:       "1800-11-4000 / 14404",
    tags:        ["Free", "Multilingual", "Government"],
    urgent:      false,
  },
  {
    name:        "National Legal Services Authority (NALSA)",
    type:        "Legal Aid",
    description: "Free legal aid for economically weaker sections. Can assist with insurance disputes, consumer forum cases, and appeal documentation at no cost.",
    action:      "Find legal aid",
    url:         "https://nalsa.gov.in/",
    phone:       "15100",
    tags:        ["Free legal aid", "Low income", "Court support"],
    urgent:      false,
  },
  {
    name:        "Consumer Forum (NCDRC)",
    type:        "Legal",
    description: "National Consumer Disputes Redressal Commission. For disputes above Rs 1 crore or when Ombudsman jurisdiction doesn't apply. File online.",
    action:      "File online",
    url:         "https://edaakhil.nic.in/",
    phone:       null,
    tags:        ["Consumer court", "Online filing", "Appeals"],
    urgent:      false,
  },

  // NGOs / Patient Advocacy
  {
    name:        "iCall — Psychological Helpline",
    type:        "Mental Health",
    description: "If the claims process has caused significant stress or anxiety, iCall offers free professional counselling. Run by TISS (Tata Institute of Social Sciences).",
    action:      "Talk to someone",
    url:         "https://icallhelpline.org/",
    phone:       "9152987821",
    tags:        ["Free", "Counselling", "TISS", "Mental health"],
    urgent:      false,
  },
  {
    name:        "Vandrevala Foundation Helpline",
    type:        "Mental Health",
    description: "24/7 free mental health support. Medical billing disputes and claim rejections can cause significant distress — support is available at any hour.",
    action:      "Call 24/7",
    url:         "https://www.vandrevalafoundation.com/free-counseling",
    phone:       "1860-2662-345",
    tags:        ["24/7", "Free", "Mental health"],
    urgent:      false,
  },
  {
    name:        "Indian Cancer Society",
    type:        "Patient Advocacy",
    description: "Assists cancer patients with insurance claim navigation, document support, and appeals. Many cancer-related rejections involve pre-existing disease clauses.",
    action:      "Get support",
    url:         "https://www.indiancancersociety.org/",
    phone:       "1800-22-1951",
    tags:        ["Cancer", "Claim navigation", "Patient support"],
    urgent:      false,
  },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  "Regulatory":     { color: "#2d6b3e", bg: "#eef5f0", border: "#b8d9c0" },
  "Consumer Rights":{ color: "#2d4a8a", bg: "#eef0f8", border: "#b8c4e0" },
  "Legal Aid":      { color: "#7a4a10", bg: "#fdf5ee", border: "#e8c8a0" },
  "Legal":          { color: "#9a6c10", bg: "#fdf8ee", border: "#e8d5a0" },
  "Mental Health":  { color: "#6a3d8a", bg: "#f5eef8", border: "#d4b8e8" },
  "Patient Advocacy":{ color: "#b94030", bg: "#fdf2f0", border: "#f0c4be" },
};

export default function HelpSupport() {
  const urgent   = SUPPORT_ORGS.filter((o) => o.urgent);
  const standard = SUPPORT_ORGS.filter((o) => !o.urgent);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400&display=swap');

        .help-section { display: flex; flex-direction: column; gap: 20px; }

        .help-card { background: white; border: 1px solid #ddd8ce; border-radius: 4px; overflow: hidden; }
        .help-card-header { padding: 16px 24px; border-bottom: 1px solid #ddd8ce; display: flex; justify-content: space-between; align-items: center; }
        .help-card-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8fa896; }

        /* Urgent strip */
        .urgent-strip { background: #2d5a3d; padding: 32px 32px 28px; }
        .urgent-eyebrow { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 6px; }
        .urgent-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; color: white; margin-bottom: 20px; line-height: 1.2; }
        .urgent-title em { font-style: italic; opacity: 0.7; }
        .urgent-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .urgent-org { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 3px; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
        .urgent-org-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; color: white; }
        .urgent-org-desc { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.6; }
        .urgent-org-phone { font-family: 'DM Mono', monospace; font-size: 13px; color: #b8d4c0; letter-spacing: 0.04em; }
        .urgent-org-btn { display: inline-flex; align-items: center; gap: 6px; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: white; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 2px; padding: 8px 14px; text-decoration: none; transition: background 0.15s; margin-top: 4px; width: fit-content; }
        .urgent-org-btn:hover { background: rgba(255,255,255,0.2); }

        /* Standard orgs grid */
        .orgs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #ddd8ce; }
        .org-card { background: white; padding: 24px; display: flex; flex-direction: column; gap: 12px; transition: background 0.15s; }
        .org-card:hover { background: #faf8f3; }
        .org-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .org-type-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 2px; flex-shrink: 0; }
        .org-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; color: #0f1512; line-height: 1.25; }
        .org-desc { font-size: 12px; line-height: 1.7; color: #5a6560; flex: 1; }
        .org-phone { font-family: 'DM Mono', monospace; font-size: 12px; color: #2d5a3d; letter-spacing: 0.04em; }
        .org-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .org-tag { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.06em; padding: 3px 8px; background: #f5f2ec; color: #8fa896; border-radius: 2px; }
        .org-link { display: inline-flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 12px; border-top: 1px solid #f0ede8; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #2d5a3d; text-decoration: none; }
        .org-link:hover { opacity: 0.7; }
        .org-link-arrow { transition: transform 0.2s; }
        .org-card:hover .org-link-arrow { transform: translate(2px, -2px); }

        /* Disclaimer */
        .help-disclaimer { padding: 16px 24px; background: #faf8f3; border-top: 1px solid #ddd8ce; display: flex; gap: 10px; align-items: flex-start; }
        .help-disclaimer-text { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.04em; color: #8fa896; line-height: 1.65; }

        @media (max-width: 768px) {
          .urgent-row, .orgs-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="help-section">

        {/* Urgent help — Ombudsman + IRDAI helpline */}
        <div className="help-card">
          <div className="urgent-strip">
            <div className="urgent-eyebrow">Start Here</div>
            <div className="urgent-title">
              Official channels with <em>binding authority</em>
            </div>
            <div className="urgent-row">
              {urgent.map((org, i) => (
                <div key={i} className="urgent-org">
                  <div className="urgent-org-name">{org.name}</div>
                  <p className="urgent-org-desc">{org.description}</p>
                  {org.phone && (
                    <div className="urgent-org-phone">{org.phone}</div>
                  )}
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="urgent-org-btn"
                  >
                    {org.action} ↗
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="help-card-header">
            <span className="help-card-label">Additional Support Organisations</span>
            <span className="help-card-label">{standard.length} resources</span>
          </div>

          <div className="orgs-grid">
            {standard.map((org, i) => {
              const cfg = TYPE_CONFIG[org.type] ?? TYPE_CONFIG["Legal"];
              return (
                <div key={i} className="org-card">
                  <div className="org-top">
                    <span
                      className="org-type-badge"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {org.type}
                    </span>
                  </div>
                  <div className="org-name">{org.name}</div>
                  <p className="org-desc">{org.description}</p>
                  {org.phone && (
                    <div className="org-phone">{org.phone}</div>
                  )}
                  <div className="org-tags">
                    {org.tags.map((t, j) => (
                      <span key={j} className="org-tag">{t}</span>
                    ))}
                  </div>
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="org-link"
                  >
                    {org.action}
                    <span className="org-link-arrow">↗</span>
                  </a>
                </div>
              );
            })}
          </div>

          <div className="help-disclaimer">
            <span style={{ color: "#8fa896", fontSize: 12, flexShrink: 0, marginTop: 1 }}>◈</span>
            <span className="help-disclaimer-text">
              All organisations listed are government bodies, statutory regulators, or established non-profit organisations.
              CareBridge does not endorse any specific service. If your claim rejection has caused significant distress,
              please reach out to a mental health helpline — dealing with insurers is genuinely hard, and support is available.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}