"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = ["All", "IRDAI Regulations", "Claims & Appeals", "Policy Basics", "Grievance", "Ombudsman"] as const;
type Category = typeof CATEGORIES[number];

interface Resource {
  title:       string;
  description: string;
  source:      string;
  type:        "Document" | "Portal" | "Guide" | "Circular";
  category:    Exclude<Category, "All">;
  url:         string;
  tags:        string[];
}

const RESOURCES: Resource[] = [
  // IRDAI Regulations
  {
    title:       "IRDAI Protection of Policyholders' Interests Regulations 2017",
    description: "The primary regulation governing how insurers must treat policyholders — covers claim decisions, rejection requirements, timelines, and grievance rights.",
    source:      "IRDAI",
    type:        "Document",
    category:    "IRDAI Regulations",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/Uploadedfiles/Regulation/PolicyHolderRegulation2017.pdf",
    tags:        ["claims", "rejection", "30-day rule", "policyholder rights"],
  },
  {
    title:       "IRDAI Health Insurance Regulations 2016",
    description: "Governs health insurance product structure — standardised exclusions, renewability, co-payment disclosure, AYUSH coverage, and mental health parity mandates.",
    source:      "IRDAI",
    type:        "Document",
    category:    "IRDAI Regulations",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/Uploadedfiles/Regulation/HealthInsuranceRegulations2016.pdf",
    tags:        ["health insurance", "exclusions", "renewability", "AYUSH"],
  },
  {
    title:       "IRDAI Standardisation of Exclusions in Health Insurance",
    description: "Circular standardising which conditions insurers can and cannot permanently exclude — limits arbitrary exclusions across all health policies.",
    source:      "IRDAI",
    type:        "Circular",
    category:    "IRDAI Regulations",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_NoYearList.aspx?DF=C&mid=3.2",
    tags:        ["exclusions", "standardisation", "permanent exclusions"],
  },
  {
    title:       "IRDAI Consumer Portal — Policy & Regulation Hub",
    description: "Official IRDAI portal with all insurance regulations, circulars, and consumer advisories in one place. Start here for any regulatory question.",
    source:      "IRDAI",
    type:        "Portal",
    category:    "IRDAI Regulations",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo246&flag=1",
    tags:        ["regulations", "circulars", "consumer", "official"],
  },
  // Claims & Appeals
  {
    title:       "How to File a Health Insurance Claim — IRDAI Consumer Guide",
    description: "Step-by-step official guide covering cashless and reimbursement claim processes, required documents, and what to do if a claim is delayed.",
    source:      "IRDAI",
    type:        "Guide",
    category:    "Claims & Appeals",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo4152&flag=1",
    tags:        ["claim process", "cashless", "reimbursement", "documents"],
  },
  {
    title:       "Pre-existing Disease — Definition and Waiting Period Rules",
    description: "IRDAI's official definition of pre-existing disease, the 48-month rule, and the moratorium period after which insurers cannot repudiate claims for non-disclosure.",
    source:      "IRDAI",
    type:        "Guide",
    category:    "Claims & Appeals",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo4152&flag=1",
    tags:        ["pre-existing disease", "waiting period", "48 months", "moratorium"],
  },
  {
    title:       "Claim Settlement Ratios — Annual Report",
    description: "IRDAI publishes insurer-wise claim settlement ratios annually. Use this to evaluate your insurer's track record before purchasing or when appealing.",
    source:      "IRDAI Annual Report",
    type:        "Document",
    category:    "Claims & Appeals",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_NoYearList.aspx?DF=AR&mid=3.2",
    tags:        ["claim settlement ratio", "CSR", "insurer comparison"],
  },
  {
    title:       "Mental Healthcare Act 2017 — Insurance Parity",
    description: "The Mental Healthcare Act mandates that health insurance policies cover mental illness on the same basis as physical illness. Rejection of mental health claims is legally challengeable.",
    source:      "Ministry of Law & Justice",
    type:        "Document",
    category:    "Claims & Appeals",
    url:         "https://www.indiacode.nic.in/bitstream/123456789/2249/1/201710.pdf",
    tags:        ["mental health", "insurance parity", "mental healthcare act"],
  },
  // Policy Basics
  {
    title:       "Key Features Document — What Insurers Must Disclose",
    description: "IRDAI requires insurers to provide a Key Features Document (KFD) at point of sale. If a restriction wasn't in your KFD, you can challenge its enforcement.",
    source:      "IRDAI",
    type:        "Guide",
    category:    "Policy Basics",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo4152&flag=1",
    tags:        ["KFD", "disclosure", "point of sale", "sublimits"],
  },
  {
    title:       "Health Insurance Portability — Your Rights When Switching",
    description: "IRDAI portability rules entitle you to credit for waiting periods already served with a previous insurer. Understand your rights before switching policies.",
    source:      "IRDAI",
    type:        "Guide",
    category:    "Policy Basics",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo4152&flag=1",
    tags:        ["portability", "switching", "waiting period credit"],
  },
  {
    title:       "Free Look Period — 15 Day Cancellation Right",
    description: "IRDAI mandates a 15-day free look period for annual policies and 30 days for long-term policies. You can cancel and get a refund within this window.",
    source:      "IRDAI",
    type:        "Guide",
    category:    "Policy Basics",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo4152&flag=1",
    tags:        ["free look", "cancellation", "refund", "15 days"],
  },
  // Grievance
  {
    title:       "IRDAI Integrated Grievance Management System (IGMS)",
    description: "Official portal to file and track insurance complaints. If your insurer hasn't resolved your complaint in 15 days, escalate here. Creates an official paper trail.",
    source:      "IRDAI IGMS",
    type:        "Portal",
    category:    "Grievance",
    url:         "https://igms.irda.gov.in/",
    tags:        ["IGMS", "complaint", "grievance", "escalation"],
  },
  {
    title:       "IRDAI Consumer Helpline",
    description: "Toll-free helpline for insurance grievances: 155255 or 1800 4254 732. Available for guidance on filing complaints and understanding your rights.",
    source:      "IRDAI",
    type:        "Portal",
    category:    "Grievance",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo253&flag=1",
    tags:        ["helpline", "toll-free", "155255", "consumer support"],
  },
  {
    title:       "Grievance Redressal Officers — Insurer Directory",
    description: "Every insurer must have a designated GRO. IRDAI maintains a directory of GRO contact details. File your written complaint here first before escalating.",
    source:      "IRDAI",
    type:        "Portal",
    category:    "Grievance",
    url:         "https://www.irdai.gov.in/ADMINCMS/cms/frmGeneral_Layout.aspx?page=PageNo253&flag=1",
    tags:        ["GRO", "grievance officer", "first complaint", "written"],
  },
  // Ombudsman
  {
    title:       "Insurance Ombudsman Rules 2017",
    description: "The legal framework governing Insurance Ombudsman jurisdiction, eligibility, process, and binding awards. Claims up to Rs 50 lakhs are eligible.",
    source:      "Ministry of Finance",
    type:        "Document",
    category:    "Ombudsman",
    url:         "https://cioins.co.in/PDF/Rules2017.pdf",
    tags:        ["ombudsman", "Rs 50 lakhs", "binding award", "rules"],
  },
  {
    title:       "Council for Insurance Ombudsmen — File a Complaint",
    description: "Official portal to file a complaint before the Insurance Ombudsman. Must be filed within 1 year of insurer's final reply. No court fees involved.",
    source:      "Council for Insurance Ombudsmen",
    type:        "Portal",
    category:    "Ombudsman",
    url:         "https://cioins.co.in/",
    tags:        ["ombudsman complaint", "file complaint", "CIO", "free"],
  },
  {
    title:       "Ombudsman Office Locations — Jurisdiction Map",
    description: "17 Ombudsman offices across India. Jurisdiction is based on your residential address or the insurer's registered office. Find your relevant office here.",
    source:      "Council for Insurance Ombudsmen",
    type:        "Portal",
    category:    "Ombudsman",
    url:         "https://cioins.co.in/Ombudsman/1",
    tags:        ["ombudsman office", "jurisdiction", "location", "17 offices"],
  },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  "Document": { color: "#2d6b3e", bg: "#eef5f0" },
  "Portal":   { color: "#2d4a8a", bg: "#eef0f8" },
  "Guide":    { color: "#9a6c10", bg: "#fdf8ee" },
  "Circular": { color: "#b94030", bg: "#fdf2f0" },
};

export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filtered = RESOURCES.filter((r) => {
    const matchCat  = activeCategory === "All" || r.category === activeCategory;
    const matchSearch = !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400;500&display=swap');
        :root { --ink: #0f1512; --cream: #faf8f3; --sage: #2d5a3d; --mist: #8fa896; --border: #ddd8ce; }
        * { box-sizing: border-box; }
        body { background: var(--cream); color: var(--ink); font-family: 'Outfit', sans-serif; font-weight: 300; }

        .page { min-height: 100vh; padding: 100px 0 120px; }

        .page-header { max-width: 1200px; margin: 0 auto; padding: 48px 64px 40px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--border); }
        .page-eyebrow { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--mist); margin-bottom: 12px; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 4vw, 54px); font-weight: 300; line-height: 1.08; }
        .page-title em { font-style: italic; color: var(--sage); }
        .page-sub { font-size: 14px; color: #5a6560; max-width: 380px; line-height: 1.7; text-align: right; }

        .controls { max-width: 1200px; margin: 0 auto; padding: 36px 64px 0; display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }

        .cat-tabs { display: flex; gap: 2px; flex-wrap: wrap; }
        .cat-tab { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 16px; background: white; border: 1px solid var(--border); border-radius: 2px; cursor: pointer; color: var(--mist); transition: all 0.15s; }
        .cat-tab:hover { color: var(--sage); border-color: var(--sage); }
        .cat-tab.active { background: var(--sage); color: white; border-color: var(--sage); }

        .search-input { padding: 10px 16px; border: 1px solid var(--border); border-radius: 2px; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--ink); background: white; outline: none; width: 260px; transition: border-color 0.2s; }
        .search-input:focus { border-color: var(--sage); }
        .search-input::placeholder { color: #c0bfba; }

        .count-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--mist); }

        .grid { max-width: 1200px; margin: 32px auto 0; padding: 0 64px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); }
        .resource-card { background: white; padding: 28px; display: flex; flex-direction: column; gap: 12px; transition: background 0.15s; text-decoration: none; color: inherit; }
        .resource-card:hover { background: #faf8f3; }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .type-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 10px; border-radius: 2px; flex-shrink: 0; }
        .source-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.08em; color: var(--mist); }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; line-height: 1.3; color: var(--ink); }
        .card-desc { font-size: 12px; line-height: 1.7; color: #5a6560; flex: 1; }
        .card-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .card-tag { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.06em; padding: 3px 8px; background: #f5f2ec; color: #8fa896; border-radius: 2px; }
        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 12px; border-top: 1px solid #f0ede8; }
        .card-link-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sage); }
        .card-arrow { color: var(--sage); font-size: 14px; transition: transform 0.2s; }
        .resource-card:hover .card-arrow { transform: translate(2px, -2px); }

        .empty { max-width: 1200px; margin: 60px auto; padding: 0 64px; text-align: center; font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300; font-style: italic; color: var(--mist); }

        .disclaimer { max-width: 1200px; margin: 40px auto 0; padding: 0 64px 40px; display: flex; gap: 12px; align-items: flex-start; }
        .disclaimer-icon { font-size: 14px; color: var(--mist); flex-shrink: 0; margin-top: 2px; }
        .disclaimer-text { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.04em; color: var(--mist); line-height: 1.7; }

        @media (max-width: 900px) {
          .page-header, .controls, .grid, .disclaimer { padding-left: 24px; padding-right: 24px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .page-sub { text-align: left; max-width: 100%; }
          .grid { grid-template-columns: 1fr; }
          .controls { flex-direction: column; align-items: flex-start; }
          .search-input { width: 100%; }
        }
        @media (min-width: 901px) and (max-width: 1100px) {
          .grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Insurance Education</div>
            <h1 className="page-title" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Learn insurance.<br />
              <em>From official sources.</em>
            </h1>
          </div>
          <p className="page-sub">
            Curated regulations, guides, and portals from IRDAI, Ministry of Finance,
            and the Council for Insurance Ombudsmen — no blogs, no opinions.
          </p>
        </div>

        <div className="controls">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="cat-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`cat-tab ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="count-label">{filtered.length} resources</span>
          </div>

          <input
            className="search-input"
            placeholder="Search by topic, keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty">No resources match your search</div>
        ) : (
          <div className="grid">
            {filtered.map((r, i) => {
              const typeCfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG["Guide"];
              return (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card"
                >
                  <div className="card-top">
                    <span className="type-badge" style={{ background: typeCfg.bg, color: typeCfg.color }}>
                      {r.type}
                    </span>
                    <span className="source-label">{r.source}</span>
                  </div>

                  <div className="card-title">{r.title}</div>
                  <p className="card-desc">{r.description}</p>

                  <div className="card-tags">
                    {r.tags.slice(0, 3).map((tag, j) => (
                      <span key={j} className="card-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="card-footer">
                    <span className="card-link-label">View official source</span>
                    <span className="card-arrow">↗</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="disclaimer">
          <span className="disclaimer-icon">◈</span>
          <span className="disclaimer-text">
            All resources link directly to official government and regulatory sources — IRDAI, Ministry of Finance, Ministry of Law & Justice, and the Council for Insurance Ombudsmen.
            CareBridge does not host, modify, or summarise these documents. Always refer to the official source for the most current version.
          </span>
        </div>
      </div>
    </>
  );
}