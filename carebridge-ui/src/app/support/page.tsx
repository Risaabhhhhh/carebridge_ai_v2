"use client";

import { useState } from "react";

/* ── DATA ──────────────────────────────────────────────────────── */

const ECOSYSTEM = {
  official: [
    {
      name: "IRDAI IGMS",
      type: "Regulator",
      step: "Step 1",
      desc: "File an official complaint if your insurer hasn't responded within 15 days. Free. Creates a legally trackable record.",
      contact: "155255 / 1800 4254 732",
      url: "https://igms.irda.gov.in/",
      action: "igms.irda.gov.in",
      color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa",
    },
    {
      name: "Insurance Ombudsman",
      type: "Quasi-Judicial",
      step: "Step 2",
      desc: "Free, binding resolution for claims up to Rs 50 lakhs. No lawyers needed. Must file within 1 year of insurer's final reply.",
      contact: "17 offices across India",
      url: "https://cioins.co.in/",
      action: "cioins.co.in",
      color: "#2d3f8a", bg: "#d8dff5", border: "#9db0e0",
    },
    {
      name: "Consumer Forum (NCDRC)",
      type: "Legal",
      step: "Step 3",
      desc: "Insurance rejections qualify as deficiency of service under CPA 2019. District forums handle claims under Rs 50 lakhs.",
      contact: "edaakhil.nic.in",
      url: "https://edaakhil.nic.in/",
      action: "edaakhil.nic.in",
      color: "#7a4e08", bg: "#faecd0", border: "#e0b870",
    },
  ],
  legal: [
    {
      name: "NALSA Legal Aid",
      type: "Legal Aid",
      desc: "Free legal aid for income-eligible citizens. Provides lawyers for consumer forum and ombudsman proceedings.",
      contact: "15100 (toll-free)",
      url: "https://nalsa.gov.in/",
      action: "nalsa.gov.in",
      color: "#3a5c10", bg: "#daecd0", border: "#9dd0aa",
    },
    {
      name: "District Legal Services Authority",
      type: "Legal Aid",
      desc: "District-level legal services. Walk-in help for filing consumer complaints and insurance disputes.",
      contact: "Visit your district court",
      url: "https://nalsa.gov.in/DLSA",
      action: "nalsa.gov.in/DLSA",
      color: "#3a5c10", bg: "#daecd0", border: "#9dd0aa",
    },
    {
      name: "SEWA (Women's Association)",
      type: "NGO",
      desc: "Insurance literacy and grievance support for women workers — especially health and maternity rejection cases.",
      contact: "079-25506444",
      url: "https://www.sewa.org/",
      action: "sewa.org",
      color: "#7a2d6b", bg: "#f5ddf0", border: "#d0a0cc",
    },
    {
      name: "PRAJA Foundation",
      type: "NGO",
      desc: "Urban governance NGO assisting with public health insurance grievances — PM-JAY, state schemes, CGHS disputes.",
      contact: "Mumbai-based, national scope",
      url: "https://www.praja.org/",
      action: "praja.org",
      color: "#8c1f14", bg: "#f5d0cc", border: "#e08070",
    },
  ],
  financial: [
    {
      name: "Tata Trusts – Medical Grants",
      type: "Financial Aid",
      desc: "Grants for cancer and serious illness treatment costs. Apply directly with medical documents.",
      contact: "igpmed@tatatrusts.org",
      url: "https://www.tatatrusts.org/",
      action: "tatatrusts.org",
      color: "#1e5c2e", bg: "#d6eddc", border: "#9dd0aa",
    },
    {
      name: "Indian Cancer Society",
      type: "Medical Aid",
      desc: "Financial assistance and guidance for cancer patients whose insurance has been rejected or is insufficient.",
      contact: "indiancancersociety.org",
      url: "https://www.indiancancersociety.org/",
      action: "indiancancersociety.org",
      color: "#7a4e08", bg: "#faecd0", border: "#e0b870",
    },
    {
      name: "CanSupport",
      type: "Medical Aid",
      desc: "Free palliative care and financial guidance for cancer patients. Provides support during claim disputes.",
      contact: "+91-11-41653333",
      url: "https://cansupport.in/",
      action: "cansupport.in",
      color: "#7a4e08", bg: "#faecd0", border: "#e0b870",
    },
    {
      name: "Smile Foundation",
      type: "Medical Aid",
      desc: "Healthcare assistance for underprivileged families, including support with insurance claim procedures.",
      contact: "smilefoundationindia.org",
      url: "https://www.smilefoundationindia.org/",
      action: "smilefoundationindia.org",
      color: "#2d3f8a", bg: "#d8dff5", border: "#9db0e0",
    },
  ],
  commercial: [
    {
      name: "ClaimBuddy",
      type: "Commercial",
      desc: "Claim assistance platform for dispute escalation and paperwork. Fee-based service.",
      contact: "+91-93547-50454 · help@claimbuddy.in",
      url: "https://claimbuddy.in/",
      action: "claimbuddy.in",
      color: "#5a5248", bg: "#e8e3d8", border: "#c8c2b4",
    },
    {
      name: "Insurance Samadhan",
      type: "Commercial",
      desc: "Dispute resolution platform for rejected or delayed claims. Works on contingency in some cases.",
      contact: "insurancesamadhan.com",
      url: "https://www.insurancesamadhan.com/",
      action: "insurancesamadhan.com",
      color: "#5a5248", bg: "#e8e3d8", border: "#c8c2b4",
    },
    {
      name: "BimaClaim",
      type: "Commercial",
      desc: "Online claim assistance service with structured escalation support. Fee varies by case complexity.",
      contact: "bimaclaim.in",
      url: "https://bimaclaim.in/",
      action: "bimaclaim.in",
      color: "#5a5248", bg: "#e8e3d8", border: "#c8c2b4",
    },
    {
      name: "Medi Assist TPA",
      type: "TPA",
      desc: "Third-party administrator for cashless and reimbursement claims. Contact if your insurer uses Medi Assist.",
      contact: "0120-6937372 / 1800-419-9493",
      url: "https://www.mediassist.in/",
      action: "mediassist.in",
      color: "#5a5248", bg: "#e8e3d8", border: "#c8c2b4",
    },
  ],
};

const HELPLINES = [
  { name: "IRDAI Helpline",     number: "155255" },
  { name: "IRDAI Toll-free",    number: "1800 4254 732" },
  { name: "Consumer Helpline",  number: "1800-11-4000" },
  { name: "NALSA Legal Aid",    number: "15100" },
];

const NGO_LIST = [
  { name: "ClaimBuddy",           contact: "+91-93547-50454",           email: "help@claimbuddy.in" },
  { name: "Insurance Samadhan",   contact: "",                          email: "insurancesamadhan.com" },
  { name: "BimaClaim",            contact: "",                          email: "bimaclaim.in" },
  { name: "Medi Assist TPA",      contact: "0120-6937372/1800-419-9493",email: "" },
  { name: "Health India TPA",     contact: "022-40881000/1800-220102",  email: "" },
  { name: "MDIndia TPA",          contact: "020-25300126",              email: "" },
  { name: "Indian Cancer Society",contact: "",                          email: "indiancancersociety.org" },
  { name: "CanSupport",           contact: "+91-11-41653333",           email: "" },
  { name: "Cancer Aid Society",   contact: "+91-22-24139437",           email: "" },
  { name: "Smile Foundation",     contact: "",                          email: "smilefoundationindia.org" },
  { name: "Doctors For You",      contact: "",                          email: "doctorsforyou.org" },
  { name: "Helping Hand Foundation",contact:"",                         email: "helpinghandf.org" },
  { name: "Tata Trusts – Medical Grants",contact:"",                    email: "igpmed@tatatrusts.org" },
  { name: "NALSA Legal Aid",      contact: "15100",                     email: "nalsa.gov.in" },
  { name: "IRDAI IGMS",           contact: "155255 / 1800 4254 732",    email: "igms.irda.gov.in" },
  { name: "Insurance Ombudsman",  contact: "17 offices across India",   email: "cioins.co.in" },
];

const ECOSYSTEM_TABS = [
  { key: "official",   label: "Official Escalation",   icon: "⊛" },
  { key: "legal",      label: "Legal & NGO Aid",        icon: "◈" },
  { key: "financial",  label: "Financial Medical Aid",  icon: "⬡" },
  { key: "commercial", label: "Commercial Services",    icon: "◇" },
] as const;

type TabKey = typeof ECOSYSTEM_TABS[number]["key"];

/* ── DRAFT GENERATOR ──────────────────────────────────────────── */

function buildDraft(form: Record<string, string>, selectedNGO: typeof NGO_LIST[0] | undefined) {
  const details = `Policy Details:
Insurer:         ${form.insurer        || "[Insurer Name]"}
Policy No:       ${form.policy         || "[Policy Number]"}
Claim No:        ${form.claim          || "[Claim Number]"}
Claimed Amount:  ₹${form.amount       || "[Amount]"}
Rejection Date:  ${form.rejectionDate  || "[Date]"}

Stated Rejection Reason:
"${form.reason || "[Rejection Reason as stated in the rejection letter]"}"`;

  const sig = `\nYours faithfully,\n${form.name  || "[Your Full Name]"}\n${form.phone || "[Phone Number]"}\n${form.email || "[Email Address]"}`;

  switch (form.recipient) {
    case "irdai":
      return `Subject: Formal Complaint Against ${form.insurer || "[Insurer]"} – Claim Rejection

To,
The Grievance Redressal Cell,
Insurance Regulatory and Development Authority of India (IRDAI)

Sir/Madam,

I write to formally register a complaint against my health insurance provider regarding an unjustified claim rejection.

${details}

My insurer has rejected the claim citing the above reason. I believe this rejection is inconsistent with the policy terms and IRDAI's Policyholders' Protection Regulations. I have already attempted to resolve this internally with the insurer's Grievance Redressal Officer and have not received a satisfactory response.

I respectfully request IRDAI to review this matter and direct the insurer to reconsider the claim under applicable regulations.

${sig}`;

    case "ombudsman":
      return `Subject: Complaint for Adjudication – Insurance Ombudsman

To,
The Insurance Ombudsman,
[Jurisdiction Office]

Sir/Madam,

I hereby file a complaint for adjudication under the Insurance Ombudsman Rules 2017.

${details}

I have exhausted the insurer's internal grievance process and escalated to IRDAI IGMS. The insurer's response has been unsatisfactory. I request the Ombudsman to review the matter and issue a binding direction in accordance with applicable law.

I confirm that this complaint is filed within one year of the insurer's final reply dated ${form.rejectionDate || "[Date]"}.

${sig}`;

    case "nalsa":
      return `Subject: Request for Free Legal Aid – Insurance Dispute

To,
The Secretary,
[District / State] Legal Services Authority (NALSA)

Respected Sir/Madam,

I am writing to request free legal assistance in connection with a rejected health insurance claim. I am unable to afford private legal representation.

${details}

I have filed a complaint with IRDAI IGMS and am seeking assistance to approach the Insurance Ombudsman / Consumer Forum to pursue my legal rights as a policyholder.

I request the Authority to provide me with a legal aid lawyer to assist with this matter. I am willing to provide income and eligibility documentation as required.

${sig}`;

    case "ngo": {
      const orgName = form.organization || "[Organisation Name]";
      return `Subject: Request for Claim Assistance – ${orgName}

Dear ${orgName} Team,

I am writing to seek guidance and assistance regarding a rejected health insurance claim.

${details}

Despite multiple attempts to resolve this with my insurer, the rejection has not been reviewed or reversed. I am requesting your assistance in understanding my options and preparing the appropriate escalation communication.

I am available at the contact details below for any follow-up.

${sig}`;
    }

    default:
      return "";
  }
}

/* ── MAIN COMPONENT ───────────────────────────────────────────── */

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("official");
  const [form, setForm] = useState({
    recipient: "irdai",
    organization: "",
    name: "", insurer: "", policy: "", claim: "",
    amount: "", rejectionDate: "", reason: "", phone: "", email: "",
  });
  const [copied, setCopied] = useState(false);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const selectedNGO = NGO_LIST.find(n => n.name === form.organization);
  const draft = buildDraft(form, selectedNGO);

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEmail = () => {
    const to  = form.recipient === "ngo" ? (selectedNGO?.email || "") : "";
    const sub = encodeURIComponent(draft.split("\n")[0].replace("Subject: ", ""));
    const bod = encodeURIComponent(draft.split("\n").slice(2).join("\n"));
    window.location.href = `mailto:${to}?subject=${sub}&body=${bod}`;
  };

  const download = () => {
    const blob = new Blob([draft], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "Escalation_Letter.txt" });
    a.click(); URL.revokeObjectURL(url);
  };

  const resources = ECOSYSTEM[activeTab] as typeof ECOSYSTEM.official;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');
        :root {
          --ink:#0a0f0d; --ink2:#1a2018; --cream:#f0ece3; --paper:#e8e3d8;
          --sage:#1e5c2e; --sage2:#2d7a42; --sage-pale:#d6eddc;
          --gold:#9a7030; --mist:#5a7060; --border:#c8c2b4;
        }
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:var(--cream); color:var(--ink2); font-family:'Outfit',sans-serif; font-weight:400; -webkit-font-smoothing:antialiased; }
        .sp { min-height:100vh; padding:100px 0 80px; }

        /* ── HEADER ─────────────────────────────── */
        .sp-hdr { max-width:1200px; margin:0 auto; padding:52px 64px 44px; border-bottom:2px solid var(--border); display:flex; justify-content:space-between; align-items:flex-end; gap:32px; }
        .sp-eyebrow { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.18em; text-transform:uppercase; color:var(--mist); margin-bottom:14px; }
        .sp-title { font-family:'Cormorant Garamond',serif; font-size:clamp(38px,4vw,56px); font-weight:500; line-height:1.06; color:var(--ink); }
        .sp-title em { font-style:italic; color:var(--sage); }
        .sp-sub { font-size:14px; font-weight:400; color:var(--ink2); max-width:400px; line-height:1.8; text-align:right; }

        /* ── HELPLINES STRIP ─────────────────────── */
        .helplines { max-width:1200px; margin:0 auto; padding:0 64px; margin-top:36px; }
        .helplines-inner { background:var(--ink); border-radius:4px; padding:20px 32px; display:flex; align-items:center; gap:0; }
        .helplines-label { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.3); flex-shrink:0; margin-right:40px; }
        .helplines-items { display:flex; gap:0; flex:1; flex-wrap:wrap; }
        .helpline-item { display:flex; flex-direction:column; gap:2px; padding:4px 36px 4px 0; border-right:1px solid rgba(255,255,255,.1); margin-right:36px; }
        .helpline-item:last-child { border-right:none; margin-right:0; padding-right:0; }
        .helpline-name { font-family:'DM Mono',monospace; font-size:9px; font-weight:400; letter-spacing:.1em; text-transform:uppercase; color:rgba(255,255,255,.3); }
        .helpline-num { font-family:'Cormorant Garamond',serif; font-size:21px; font-weight:500; color:#d8eedd; letter-spacing:.02em; }

        /* ── ESCALATION TIMELINE ─────────────────── */
        .timeline-wrap { max-width:1200px; margin:40px auto 0; padding:0 64px; }
        .timeline-inner { background:var(--paper); border:1px solid var(--border); border-radius:4px; padding:28px 32px; display:grid; grid-template-columns:repeat(4,1fr); gap:1px; position:relative; }
        .timeline-inner::before { content:''; position:absolute; top:44px; left:calc(12.5% + 16px); right:calc(12.5% + 16px); height:1px; background:var(--border); pointer-events:none; }
        .tl-step { display:flex; flex-direction:column; gap:10px; padding:4px 16px; }
        .tl-step:first-child { padding-left:0; }
        .tl-step:last-child  { padding-right:0; }
        .tl-top { display:flex; align-items:center; gap:12px; }
        .tl-circle { width:32px; height:32px; border-radius:50%; border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:var(--mist); background:var(--cream); flex-shrink:0; }
        .tl-step.current .tl-circle { border-color:var(--sage); color:var(--sage); background:#eef8f0; }
        .tl-step-label { font-family:'DM Mono',monospace; font-size:9px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--mist); }
        .tl-step-title { font-family:'Cormorant Garamond',serif; font-size:17px; font-weight:500; color:var(--ink); line-height:1.25; }
        .tl-step-desc  { font-size:12px; font-weight:400; color:var(--mist); line-height:1.6; }

        /* ── ECOSYSTEM SECTION ───────────────────── */
        .ecosystem { max-width:1200px; margin:40px auto 0; padding:0 64px; }
        .eco-hdr { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin-bottom:20px; }
        .eco-title-wrap { }
        .eco-eyebrow { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:var(--mist); margin-bottom:10px; }
        .eco-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:500; color:var(--ink); line-height:1.15; }
        .eco-disclaimer { font-family:'DM Mono',monospace; font-size:10px; font-weight:400; letter-spacing:.04em; color:var(--mist); max-width:340px; line-height:1.6; text-align:right; }

        .eco-tabs { display:flex; border-bottom:1px solid var(--border); margin-bottom:24px; }
        .eco-tab { padding:14px 22px; font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; border:none; background:none; cursor:pointer; color:var(--mist); border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .2s; display:flex; align-items:center; gap:8px; }
        .eco-tab:hover { color:var(--ink2); }
        .eco-tab.active { color:var(--sage); border-bottom-color:var(--sage); }
        .eco-tab-icon { font-size:14px; }
        .eco-commercial-note { font-family:'DM Mono',monospace; font-size:9px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; color:#b0a898; padding:4px 10px; border:1px solid var(--border); border-radius:2px; }

        .eco-grid { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--border); border:1px solid var(--border); border-radius:4px; overflow:hidden; }
        .eco-card { background:white; padding:22px 24px; display:flex; flex-direction:column; gap:9px; transition:background .15s; }
        .eco-card:hover { background:#faf7f2; }
        .eco-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .eco-card-left { display:flex; flex-direction:column; gap:4px; }
        .eco-card-step { font-family:'DM Mono',monospace; font-size:9px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; }
        .eco-card-name { font-family:'Cormorant Garamond',serif; font-size:19px; font-weight:500; color:var(--ink); line-height:1.2; }
        .eco-card-badge { font-family:'DM Mono',monospace; font-size:9px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; padding:3px 9px; border-radius:2px; flex-shrink:0; margin-top:2px; }
        .eco-card-desc { font-size:13px; font-weight:400; line-height:1.68; color:var(--ink2); flex:1; }
        .eco-card-contact { font-family:'DM Mono',monospace; font-size:10px; font-weight:400; color:var(--mist); letter-spacing:.04em; }
        .eco-card-action { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; text-decoration:none; display:inline-flex; align-items:center; gap:5px; transition:opacity .15s; margin-top:2px; }
        .eco-card-action:hover { opacity:.7; }

        /* ── DRAFT GENERATOR ─────────────────────── */
        .draft-wrap { max-width:1200px; margin:40px auto 0; padding:0 64px; display:grid; grid-template-columns:1fr 1fr; gap:24px; align-items:start; }
        .draft-form { background:white; border:1px solid var(--border); border-radius:4px; overflow:hidden; }
        .draft-form-hdr { padding:16px 24px; border-bottom:1px solid var(--border); background:var(--ink); display:flex; align-items:center; justify-content:space-between; }
        .draft-form-title { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.13em; text-transform:uppercase; color:#d8eedd; }
        .draft-form-sub   { font-size:11px; font-weight:400; color:rgba(255,255,255,.35); margin-top:2px; }
        .draft-form-body  { padding:24px; display:flex; flex-direction:column; gap:0; }

        .form-group { border-bottom:1px solid #eee8e0; }
        .form-group:last-of-type { border-bottom:none; }
        .form-label { font-family:'DM Mono',monospace; font-size:9px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:var(--mist); padding:12px 0 6px; display:block; }
        .form-input { width:100%; border:none; outline:none; font-family:'DM Mono',monospace; font-size:12px; font-weight:400; color:var(--ink); background:transparent; padding:0 0 12px; line-height:1.5; }
        .form-input::placeholder { color:#b0a898; }
        .form-textarea { width:100%; border:none; outline:none; font-family:'DM Mono',monospace; font-size:12px; font-weight:400; color:var(--ink); background:transparent; resize:vertical; padding:0 0 12px; line-height:1.65; min-height:60px; }
        .form-textarea::placeholder { color:#b0a898; }
        .form-select { width:100%; border:none; outline:none; font-family:'DM Mono',monospace; font-size:12px; font-weight:400; color:var(--ink); background:transparent; padding:0 0 12px; cursor:pointer; appearance:none; -webkit-appearance:none; }

        .ngo-info { padding:10px 0; background:#f5f0e8; border-radius:2px; margin-bottom:4px; font-family:'DM Mono',monospace; font-size:10px; font-weight:400; color:var(--mist); line-height:1.7; padding:10px 14px; }

        /* ── DRAFT PREVIEW ───────────────────────── */
        .draft-preview { display:flex; flex-direction:column; gap:16px; }
        .draft-preview-card { background:white; border:1px solid var(--border); border-radius:4px; overflow:hidden; }
        .draft-preview-hdr { padding:14px 22px; border-bottom:1px solid var(--border); background:#f5f0e8; display:flex; justify-content:space-between; align-items:center; }
        .draft-preview-title { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.13em; text-transform:uppercase; color:#4a5248; }
        .draft-text { padding:22px; font-family:'DM Mono',monospace; font-size:11px; font-weight:400; line-height:1.85; color:var(--ink2); white-space:pre-wrap; max-height:420px; overflow-y:auto; background:var(--cream); }

        .draft-actions { display:flex; flex-direction:column; gap:8px; }
        .draft-btn { padding:14px 20px; border:none; border-radius:2px; font-family:'DM Mono',monospace; font-size:11px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; width:100%; }
        .draft-btn-primary { background:var(--sage); color:#e8f0ea; border:1px solid #3d7a52; }
        .draft-btn-primary:hover { background:var(--sage2); }
        .draft-btn-secondary { background:white; color:var(--ink2); border:1px solid var(--border); }
        .draft-btn-secondary:hover { background:var(--paper); }
        .draft-btn-gold { background:var(--ink); color:#d8c88a; border:1px solid rgba(255,255,255,.1); }
        .draft-btn-gold:hover { background:#1a2018; }

        /* ── DISCLAIMER ──────────────────────────── */
        .disclaimer { max-width:1200px; margin:32px auto 0; padding:0 64px 48px; }
        .disclaimer-inner { padding:16px 22px; background:var(--paper); border:1px solid var(--border); border-radius:3px; display:flex; gap:14px; align-items:flex-start; font-family:'DM Mono',monospace; font-size:10px; font-weight:400; color:var(--mist); line-height:1.7; letter-spacing:.03em; }
        .disclaimer-icon { flex-shrink:0; font-size:13px; color:var(--mist); margin-top:1px; }

        /* ── RESPONSIVE ──────────────────────────── */
        @media(max-width:900px) {
          .sp-hdr,.helplines,.timeline-wrap,.ecosystem,.draft-wrap,.disclaimer { padding-left:24px; padding-right:24px; }
          .sp-hdr { flex-direction:column; align-items:flex-start; gap:16px; }
          .sp-sub { text-align:left; max-width:100%; }
          .helplines-inner { flex-direction:column; align-items:flex-start; gap:16px; }
          .helplines-label { margin-right:0; }
          .helpline-item { border-right:none; margin-right:0; padding-right:0; }
          .helplines-items { gap:16px; }
          .timeline-inner { grid-template-columns:1fr; gap:16px; }
          .timeline-inner::before { display:none; }
          .eco-grid { grid-template-columns:1fr; }
          .draft-wrap { grid-template-columns:1fr; }
          .eco-tabs { overflow-x:auto; white-space:nowrap; }
          .eco-hdr { flex-direction:column; align-items:flex-start; gap:12px; }
          .eco-disclaimer { text-align:left; max-width:100%; }
        }
      `}</style>

      <div className="sp">

        {/* ── HEADER ── */}
        <div className="sp-hdr">
          <div>
            <div className="sp-eyebrow">Escalation & Assistance</div>
            <h1 className="sp-title">
              Rejected?<br/><em>You have recourse.</em>
            </h1>
          </div>
          <p className="sp-sub">
            Official escalation bodies, legal aid authorities, and financial
            assistance organisations — clearly separated, with a structured
            letter generator for every escalation path.
          </p>
        </div>

        {/* ── HELPLINES ── */}
        <div className="helplines">
          <div className="helplines-inner">
            <span className="helplines-label">Free helplines</span>
            <div className="helplines-items">
              {HELPLINES.map((h, i) => (
                <div key={i} className="helpline-item">
                  <span className="helpline-name">{h.name}</span>
                  <span className="helpline-num">{h.number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ESCALATION TIMELINE ── */}
        <div className="timeline-wrap">
          <div className="timeline-inner">
            {[
              { n:"01", label:"First",         title:"Insurer GRO",           desc:"File written complaint with Grievance Redressal Officer. Insurer must respond within 15 days." },
              { n:"02", label:"If unresolved", title:"IRDAI IGMS",            desc:"Escalate to IRDAI portal if GRO response is unsatisfactory or absent after 15 days." },
              { n:"03", label:"Within 1 year", title:"Insurance Ombudsman",   desc:"Binding, free adjudication for claims up to Rs 50 lakhs. File within 1 year of final reply." },
              { n:"04", label:"Final recourse",title:"Consumer Court",        desc:"Insurance rejection is deficiency of service under CPA 2019. No advocate needed at district level." },
            ].map((s, i) => (
              <div key={i} className="tl-step">
                <div className="tl-top">
                  <div className="tl-circle">{s.n}</div>
                  <span className="tl-step-label">{s.label}</span>
                </div>
                <div className="tl-step-title">{s.title}</div>
                <div className="tl-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ECOSYSTEM ── */}
        <div className="ecosystem">
          <div className="eco-hdr">
            <div className="eco-title-wrap">
              <div className="eco-eyebrow">Assistance Ecosystem</div>
              <div className="eco-title">Categorised by function — not mixed together</div>
            </div>
            <p className="eco-disclaimer">
              CareBridge is not affiliated with any listed organisation and receives no compensation from them.
            </p>
          </div>

          <div className="eco-tabs">
            {ECOSYSTEM_TABS.map(tab => (
              <button key={tab.key}
                className={`eco-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}>
                <span className="eco-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
            {activeTab === "commercial" && (
              <span className="eco-commercial-note" style={{marginLeft:"auto",alignSelf:"center"}}>Fee-based services</span>
            )}
          </div>

          <div className="eco-grid">
            {resources.map((r, i) => (
              <div key={i} className="eco-card">
                <div className="eco-card-top">
                  <div className="eco-card-left">
                    {"step" in r && r.step && (
                      <span className="eco-card-step" style={{color: r.color}}>{r.step}</span>
                    )}
                    <div className="eco-card-name">{r.name}</div>
                  </div>
                  <span className="eco-card-badge" style={{background: r.bg, color: r.color, border:`1px solid ${r.border}`}}>
                    {r.type}
                  </span>
                </div>
                <p className="eco-card-desc">{r.desc}</p>
                <div className="eco-card-contact">✆ {r.contact}</div>
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="eco-card-action" style={{color: r.color}}>
                  {r.action} <span>↗</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ── DRAFT GENERATOR ── */}
        <div className="draft-wrap">

          {/* Form */}
          <div className="draft-form">
            <div className="draft-form-hdr">
              <div>
                <div className="draft-form-title">Escalation Letter Generator</div>
                <div className="draft-form-sub">Generate a formal draft · copy · email · download</div>
              </div>
            </div>
            <div className="draft-form-body">

              <div className="form-group">
                <label className="form-label">Send to</label>
                <select className="form-select"
                  value={form.recipient}
                  onChange={e => set("recipient", e.target.value)}>
                  <option value="irdai">IRDAI Grievance Cell</option>
                  <option value="ombudsman">Insurance Ombudsman</option>
                  <option value="nalsa">NALSA Legal Aid</option>
                  <option value="ngo">NGO / Claim Assistance</option>
                </select>
              </div>

              {form.recipient === "ngo" && (
                <div className="form-group">
                  <label className="form-label">Select Organisation</label>
                  <select className="form-select"
                    value={form.organization}
                    onChange={e => set("organization", e.target.value)}>
                    <option value="">Choose organisation</option>
                    {NGO_LIST.map(n => (
                      <option key={n.name} value={n.name}>{n.name}</option>
                    ))}
                  </select>
                  {selectedNGO && (
                    <div className="ngo-info">
                      {selectedNGO.contact && <div>✆ {selectedNGO.contact}</div>}
                      {selectedNGO.email   && <div>✉ {selectedNGO.email}</div>}
                    </div>
                  )}
                </div>
              )}

              {[
                { key:"name",          label:"Your Full Name",          type:"text" },
                { key:"insurer",       label:"Insurer Name",            type:"text" },
                { key:"policy",        label:"Policy Number",           type:"text" },
                { key:"claim",         label:"Claim Number",            type:"text" },
                { key:"amount",        label:"Claimed Amount (₹)",      type:"text" },
                { key:"rejectionDate", label:"Rejection Date",          type:"text" },
                { key:"phone",         label:"Your Phone Number",       type:"text" },
                { key:"email",         label:"Your Email Address",      type:"email" },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input
                    className="form-input"
                    type={f.type}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    value={(form as any)[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                  />
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">Rejection Reason (as stated)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Paste or type the exact reason given in the rejection letter..."
                  value={form.reason}
                  onChange={e => set("reason", e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Preview + actions */}
          <div className="draft-preview">
            <div className="draft-preview-card">
              <div className="draft-preview-hdr">
                <span className="draft-preview-title">Draft Preview</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:".1em",textTransform:"uppercase",color:"var(--mist)"}}>
                  {form.recipient === "irdai" ? "IRDAI IGMS"
                    : form.recipient === "ombudsman" ? "Ombudsman"
                    : form.recipient === "nalsa" ? "NALSA"
                    : form.organization || "NGO"}
                </span>
              </div>
              <div className="draft-text">{draft}</div>
            </div>

            <div className="draft-actions">
              <button className="draft-btn draft-btn-primary" onClick={copyDraft}>
                {copied ? "✓ Copied" : "Copy to Clipboard"}
              </button>
              <button className="draft-btn draft-btn-secondary" onClick={openEmail}>
                Open in Email Client
              </button>
              <button className="draft-btn draft-btn-gold" onClick={download}>
                Download as .txt
              </button>
            </div>
          </div>

        </div>

        {/* ── DISCLAIMER ── */}
        <div className="disclaimer">
          <div className="disclaimer-inner">
            <span className="disclaimer-icon">◈</span>
            <span>
              CareBridge is not affiliated with any listed organisation and receives no compensation or referral fees.
              All government and regulatory resources listed are official. NGO and commercial listings are provided
              for informational purposes only and do not constitute endorsement. This tool provides structured
              communication templates — not legal advice.
            </span>
          </div>
        </div>

      </div>
    </>
  );
}