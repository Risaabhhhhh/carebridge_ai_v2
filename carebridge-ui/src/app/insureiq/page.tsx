"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

/* ══════════════════════════════════════════════════════════════
   SPEECH RECOGNITION TYPES
══════════════════════════════════════════════════════════════ */
interface SpeechRecognitionResultItem { transcript: string; confidence: number; }
interface SpeechRecognitionResult {
  readonly length: number; readonly isFinal: boolean;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start(): void; stop(): void;
}
interface SpeechRecognitionConstructor { new(): SpeechRecognitionInstance; }
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor | undefined;
    webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;
  }
}

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
type Role = "user" | "assistant";
interface Message { role: Role; content: string; }
interface QuizQuestion { question: string; options: string[]; correct: number; explanation: string; }
interface Lesson {
  id: string; title: string; duration: string; summary: string;
  content: string[]; videoId: string; videoTitle: string; videoChannel: string;
  quiz: QuizQuestion[]; tag?: string;
}
interface Module {
  id: string; code: string; title: string; subtitle: string;
  description: string; lessons: Lesson[]; icon: string;
}
type View = "home" | "module" | "lesson" | "quiz" | "quiz-result";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS — matches audit page exactly
══════════════════════════════════════════════════════════════ */
const C = {
  bg:       "#f0ece3",
  white:    "#ffffff",
  paper:    "#faf8f3",
  bdr:      "#c8c2b4",
  bdrLight: "#e8e3d8",
  dark:     "#0a0f0d",
  darkMid:  "#1a2018",
  ink:      "#1a2018",
  muted:    "#5a7060",
  mutedLt:  "#9a9890",
  forest:   "#1e5c2e",
  forestL:  "#2d7a42",
  forestDim:"#eef5f0",
  green:    "#4a9d5f",
  saffron:  "#e8760a",
  saffronL: "#f59332",
  amber:    "#7a4e08",
  amberBg:  "#faecd0",
  amberBdr: "#e0b870",
  serif:    "'Cormorant Garamond', Georgia, serif",
  sans:     "'Outfit', system-ui, sans-serif",
  mono:     "'DM Mono', 'Courier New', monospace",
} as const;

/* ══════════════════════════════════════════════════════════════
   LANGUAGES
══════════════════════════════════════════════════════════════ */
interface Lang { label: string; code: string; voiceLang: string; placeholder: string; }
const LANGS: Lang[] = [
  { label:"English", code:"en", voiceLang:"en-IN", placeholder:"Ask me anything about this lesson…" },
  { label:"हिन्दी",  code:"hi", voiceLang:"hi-IN", placeholder:"कुछ भी पूछें…" },
  { label:"मराठी",  code:"mr", voiceLang:"mr-IN", placeholder:"काहीही विचारा…" },
  { label:"தமிழ்",  code:"ta", voiceLang:"ta-IN", placeholder:"எதையும் கேளுங்கள்…" },
];

/* ══════════════════════════════════════════════════════════════
   CURRICULUM DATA
══════════════════════════════════════════════════════════════ */
const MODULES: Module[] = [
  {
    id:"basics", code:"01", icon:"📋",
    title:"Health Insurance Basics",
    subtitle:"Start here — understand the fundamentals",
    description:"Everything a first-time buyer needs to know before signing anything. Premium, sum insured, TPA, deductibles, and how the money actually flows in the Indian market.",
    lessons:[
      {
        id:"what-is", tag:"FOUNDATION",
        title:"What is Health Insurance?",
        duration:"5 min",
        summary:"A contract between you and an insurer — you pay a regular premium, they pay your hospital bills up to a limit called the sum insured.",
        content:[
          "Health insurance is a financial product that protects you against large, unexpected medical expenses. You pay a fixed amount — called the **premium** — every year. In return, the insurer agrees to pay for hospitalisation costs up to a maximum limit called the **sum insured**.",
          "In India, healthcare costs have risen 15–18% annually — double general inflation. A simple appendix surgery in a Mumbai private hospital costs ₹1.5–3 lakhs. A cardiac bypass can exceed ₹5 lakhs. Without insurance, one hospitalisation can wipe out years of savings.",
          "Two main types: **individual plans** (cover one person) and **family floater plans** (cover the entire family under one shared sum insured). A family floater is usually 30–40% cheaper but all members share the same limit — risky if seniors are included.",
          "The **TPA** (Third Party Administrator) is the intermediary that processes your claims — companies like Medi Assist, Vipul Medcorp, or MDIndia. Your hospital deals with the TPA, not the insurer directly. Save your TPA's helpline number separately from your policy copy.",
          "Key insight: insurance is **not a savings product**. Unused premium is not returned. Its value is pure risk protection — covering costs that would otherwise devastate your finances.",
        ],
        videoId:"jpAY1f_1A5M",
        videoTitle:"Health Insurance Kya Hota Hai? Complete Guide",
        videoChannel:"Labour Law Advisor",
        quiz:[
          { question:"What does 'sum insured' mean in health insurance?", options:["The total premium you pay per year","The maximum the insurer will pay for claims in one policy year","The hospital's total bill amount","The TPA's processing fee"], correct:1, explanation:"Sum insured is the insurer's maximum payout in one policy year. Once exhausted, you pay out of pocket. Choose based on your city's private hospital rates." },
          { question:"What is a TPA in Indian health insurance?", options:["Tax Payment Authority","Third Party Administrator — processes claims on behalf of insurers","Total Premium Amount","Treatment Protocol Agency"], correct:1, explanation:"A TPA (Third Party Administrator) is licensed by IRDAI to handle cashless and reimbursement claims. Examples: Medi Assist, Vipul Medcorp, MDIndia. Know your TPA's number." },
          { question:"In a family floater plan, the sum insured is:", options:["Separate for each member","Shared across all family members","Doubled for married couples","Fixed at ₹5 lakhs by IRDAI"], correct:1, explanation:"Family floater means one shared pool. If your father uses ₹4L of a ₹5L floater, only ₹1L remains for everyone else. Good for young families; risky when seniors are included." },
        ],
      },
      {
        id:"premium", tag:"MUST KNOW",
        title:"How Premiums Are Calculated",
        duration:"6 min",
        summary:"Your premium depends on age, sum insured, city, pre-existing conditions, and add-ons. Age is the biggest factor by far — buy early.",
        content:[
          "The **premium** is the annual amount you pay to keep your policy active. Miss the renewal date and coverage lapses — claims made even one day after lapse won't be paid, and waiting period credits reset to zero.",
          "In India, premiums are driven by: **age** (the dominant factor — a 25-year-old pays roughly 3× less than a 55-year-old for identical cover), **sum insured**, **zone/city** (Zone A cities like Delhi/Mumbai cost 30–40% more), **pre-existing diseases**, and **add-ons** like maternity or critical illness riders.",
          "**No-Claim Bonus (NCB):** If you make no claims in a year, most insurers add 10–50% more sum insured at the same premium. NCB compounds year over year. Even a ₹500 pharmacy claim can cost you ₹50,000 in lost NCB over time.",
          "**IRDAI 2024 update:** Insurers can no longer impose entry age limits. Senior citizens above 65 can now buy fresh health insurance. The maximum waiting period for pre-existing diseases has been reduced from 48 months to 36 months.",
          "Practical example: In Bengaluru, a 35-year-old buying ₹10L individual cover pays approximately ₹8,000–₹12,000/year. Adding a 62-year-old parent to a family floater can push this to ₹35,000–₹55,000.",
        ],
        videoId:"OezEJXKYThQ",
        videoTitle:"Health Insurance Premium Calculation — Explained Simply",
        videoChannel:"CA Rachana Ranade",
        quiz:[
          { question:"Which factor has the BIGGEST impact on your health insurance premium?", options:["Your city or zone","Your age","Your hospital preference","Your employer's HR"], correct:1, explanation:"Age dominates premium calculation in India. After 45, premiums jump sharply with each renewal band. The earlier you buy and stay continuously covered, the lower your lifetime cost." },
          { question:"What is No-Claim Bonus (NCB)?", options:["A cash refund if you make no claims","An increase in sum insured for claim-free years at no extra premium","A discount on next year's premium","A reward from the TPA"], correct:1, explanation:"NCB grows your sum insured free of charge for each claim-free year. It compounds — worth protecting by not claiming small amounts that you can afford out of pocket." },
          { question:"IRDAI allows insurers to revise your premium:", options:["Any time during the policy year","Only at renewal, based on age band and claims experience","Never, once the policy is issued","Only if you file a claim"], correct:1, explanation:"Mid-year premium changes are prohibited by IRDAI. Renewals may see age-band revisions. Always read the renewal notice carefully — you have 15 days from the renewal date to decide." },
        ],
      },
      {
        id:"copay", tag:"⚠ HIDDEN TRAPS",
        title:"Co-payment, Deductibles & Sub-limits",
        duration:"7 min",
        summary:"These clauses quietly reduce your payout at claim time. Most policyholders discover them only inside the hospital. Learn them before buying.",
        content:[
          "**Co-payment** means you agree to pay a fixed percentage of every claim yourself. Example: 20% co-pay on a ₹1,00,000 claim = you pay ₹20,000, insurer pays ₹80,000. Co-pay is common in senior citizen policies and plans covering pre-existing diseases from day one.",
          "**Deductible** is a fixed rupee amount you absorb before insurance activates. Example: ₹25,000 deductible = any bill below ₹25,000 is entirely yours; above that, insurer pays the excess. Deductibles reduce premiums by 20–35%.",
          "**Room rent sublimit** is the most misunderstood trap. If your policy caps room rent at 1% of sum insured (₹5,000/day on a ₹5L policy) and you stay in a ₹10,000/day room, the insurer applies **proportionate deduction** to your ENTIRE bill — not just the room.",
          "**Disease-specific sublimits** cap payout for certain surgeries regardless of actual cost. Cataract: ₹30,000–₹50,000 cap. Hernia: ₹40,000–₹60,000 cap. Always check the Schedule of Benefits table before buying.",
          "**IRDAI 2024 update:** AYUSH sublimits have been removed. Ayurveda, Yoga, Unani, Siddha, and Homeopathy treatments are now covered up to the full sum insured — same as allopathic.",
        ],
        videoId:"DrKlx_6MnHM",
        videoTitle:"Health Insurance Sub-limits, Co-pay & Deductibles Explained",
        videoChannel:"Asset Yogi",
        quiz:[
          { question:"You have 20% co-pay. Your hospital bill is ₹2,00,000. How much do YOU pay?", options:["₹20,000","₹40,000","₹80,000","Nothing — insurer pays all"], correct:1, explanation:"20% of ₹2,00,000 = ₹40,000 out of your pocket. Insurer pays ₹1,60,000. Co-pay plans have lower premiums but higher out-of-pocket costs when you actually claim." },
          { question:"Room rent proportionate deduction means:", options:["Only the room rent excess is deducted","Your ENTIRE bill is reduced proportionally if you exceed the room rent cap","You pay a fixed ₹500/day penalty","The insurer pays 50% of all costs"], correct:1, explanation:"Exceeding the room rent cap triggers deduction on the whole bill — doctor fees, surgery, ICU, everything. Not just the room. It can cut your payout in half." },
          { question:"A deductible of ₹25,000 means:", options:["You pay 25% of every claim","You pay the first ₹25,000 of any claim; insurer pays above that","Insurer pays ₹25,000 maximum","Your premium is discounted by ₹25,000"], correct:1, explanation:"Deductible = the threshold you absorb. ₹75,000 bill with ₹25,000 deductible = insurer pays ₹50,000. Lower premium tradeoff for higher out-of-pocket on small claims." },
        ],
      },
    ],
  },
  {
    id:"claims", code:"02", icon:"📁",
    title:"Filing & Winning Claims",
    subtitle:"Know the exact process before you're in a hospital",
    description:"Step-by-step claim filing for cashless and reimbursement. Exact documents needed. Why claims get rejected. How to fight back using IRDAI rights.",
    lessons:[
      {
        id:"cashless", tag:"PROCESS",
        title:"Cashless vs Reimbursement Claims",
        duration:"6 min",
        summary:"Cashless means the insurer pays the hospital directly. Reimbursement means you pay first and claim back. Both have strict IRDAI timelines.",
        content:[
          "**Cashless claims** work only at network hospitals — hospitals with a pre-agreed arrangement with your insurer or TPA. You present your health card, the hospital submits a pre-authorisation request to the TPA, and if approved, the insurer settles the bill directly.",
          "**Reimbursement claims** allow you to use any hospital. You pay the full bill, collect all original documents, and submit within 30–45 days from discharge. The insurer reviews and pays back the eligible amount minus any deductibles or co-pay.",
          "**IRDAI 2024 cashless mandate:** Insurers must decide on pre-authorisation within **1 hour** for both emergency and planned admissions. Final discharge authorisation must be given within **3 hours** of the hospital's request.",
          "**Critical documents for any claim:** Original discharge summary · Itemised hospital bills · Doctor's prescription · Investigation reports (blood tests, scans, ECG) · Pharmacy bills · Pre-auth approval letter (cashless) · Signed claim form · PAN card copy if claim exceeds ₹1 lakh.",
          "**Pro tip:** Always file a reimbursement claim even if your cashless pre-auth was partially denied. Submit the full itemised bill — the insurer may cover more on formal review. Photograph all documents before submitting originals.",
        ],
        videoId:"DrKlx_6MnHM",
        videoTitle:"Cashless vs Reimbursement Health Insurance Claim",
        videoChannel:"Labour Law Advisor",
        quiz:[
          { question:"Cashless claims are available at:", options:["Any hospital in India","Only network hospitals empanelled with your insurer/TPA","Any NABH-accredited hospital","Only government hospitals"], correct:1, explanation:"Cashless requires a network hospital with a TPA agreement. Always verify your insurer's hospital network before admission — especially for planned procedures." },
          { question:"Under IRDAI 2024, reimbursement claims must be settled within:", options:["7 days","15 days","30 days of receiving complete documents","60 days"], correct:2, explanation:"IRDAI mandates 30-day settlement after all documents. Delays entitle you to interest at 2% above the bank rate." },
          { question:"For final discharge authorisation, IRDAI 2024 requires response within:", options:["30 minutes","3 hours of the hospital's discharge request","24 hours","Next working day"], correct:1, explanation:"IRDAI 2024 mandates 3-hour discharge authorisation. If delayed, the insurer must bear any extra hospital charges incurred by the patient waiting for clearance." },
        ],
      },
      {
        id:"rejection", tag:"🔥 HIGH IMPACT",
        title:"Why Claims Get Rejected — and How to Fight",
        duration:"8 min",
        summary:"Most rejections are challengeable. 60%+ of contested cases settle in the policyholder's favour at the Ombudsman. Know your steps.",
        content:[
          "Top 5 rejection reasons in India: **Non-disclosure of pre-existing disease** (most common) · **Waiting period not completed** · **Policy lapsed at time of admission** · **Treatment classified as excluded** · **Inadequate or missing documentation**.",
          "**Non-disclosure:** After **60 months** (5 years) of continuous coverage — the moratorium under IRDAI 2024 — insurers cannot reject on non-disclosure grounds. Previously 8 years, now reduced to 5.",
          "**4-step appeal process:** Step 1: Get rejection in writing with exact clause cited. Step 2: Verify the clause actually applies. Step 3: File with insurer's GRO — they must respond within 15 days. Step 4: File on IRDAI IGMS at igms.irda.gov.in.",
          "If still unresolved after 30 days, approach the **Insurance Ombudsman** — free, binding for claims up to ₹50 lakhs, average resolution in 90 days.",
          "**Success data:** IRDAI annual reports show over 60% of complaints filed with the Ombudsman result in partial or full settlement for the policyholder. The system works — but only if you use it.",
        ],
        videoId:"Ev_Vc9cLjdo",
        videoTitle:"Claim Reject Ho Gaya? Yeh Karo — Complete Guide",
        videoChannel:"Pranjal Kamra / Finology",
        quiz:[
          { question:"Under IRDAI 2024, after how many months of continuous coverage can an insurer NOT reject on non-disclosure grounds?", options:["24 months","36 months","48 months","60 months"], correct:3, explanation:"IRDAI 2024 reduced the moratorium from 8 years to 5 years (60 months). After 5 continuous years, non-disclosure cannot be cited for rejection." },
          { question:"The Insurance Ombudsman handles claims up to:", options:["₹5 lakhs","₹10 lakhs","₹25 lakhs","₹50 lakhs"], correct:3, explanation:"The Insurance Ombudsman adjudicates disputes up to ₹50 lakhs. Completely free. Awards are binding on the insurer. Average resolution: 60–90 days." },
          { question:"When your cashless is denied at the hospital, what should you do FIRST?", options:["Pay and forget about it","Demand the denial in writing with the specific clause cited","Hire a lawyer immediately","Switch to a different hospital"], correct:1, explanation:"Always get denials in writing with the exact clause cited. That written rejection is your evidence for the appeal." },
        ],
      },
    ],
  },
  {
    id:"policy", code:"03", icon:"🔍",
    title:"Reading Your Policy",
    subtitle:"Decode the fine print before it's too late",
    description:"The clauses that cost people money at claim time. PED rules updated for IRDAI 2024. Waiting periods. Exclusions. What IRDAI requires insurers to disclose.",
    lessons:[
      {
        id:"ped", tag:"CRITICAL",
        title:"Pre-Existing Disease (PED) Rules",
        duration:"7 min",
        summary:"PED is the most litigated area in Indian health insurance. IRDAI 2024 cut the lookback period from 48 to 36 months and the moratorium from 8 to 5 years.",
        content:[
          "**Pre-Existing Disease (PED)** as defined by IRDAI 2024: any condition diagnosed by a physician, or for which symptoms clearly existed, within **36 months** prior to the date of first policy issuance. Previously 48 months — a major consumer-friendly change.",
          "If your hypertension was diagnosed 4 years ago and you just bought a policy, it is NOT technically PED under the 2024 definition. If it was diagnosed 2 years ago, it falls within the window and the waiting period applies.",
          "**Waiting periods under 2024 rules:** Most policies now impose 1–3 years for PED (reduced from up to 4 years). During this period, claims directly arising from the PED condition will be rejected. After the waiting period, PED is covered fully and permanently.",
          "**The 60-month moratorium:** After 5 years of continuous coverage, no insurer can reject a claim on grounds of non-disclosure or misrepresentation of a pre-existing condition. This is a hard statutory protection.",
          "**Portability and PED credit:** If you port your policy to a new insurer, your served waiting period transfers in full. The new insurer cannot restart your clock — this is an IRDAI portability guarantee.",
        ],
        videoId:"M1JLFRwH63Y",
        videoTitle:"Pre-Existing Disease in Health Insurance — All Rules Explained",
        videoChannel:"Asset Yogi",
        quiz:[
          { question:"Under IRDAI 2024, PED covers conditions diagnosed within how many months before buying the policy?", options:["12 months","24 months","36 months","48 months"], correct:2, explanation:"IRDAI 2024 reduced the PED lookback from 48 months to 36 months. Conditions beyond 3 years old are no longer automatically classified as PED." },
          { question:"When you port your policy, your PED waiting period credit:", options:["Resets to zero at the new insurer","Is transferred at 50% credit","Is fully transferred to the new insurer","Depends entirely on the new insurer's discretion"], correct:2, explanation:"IRDAI portability rules mandate full waiting period credit transfer. The new insurer must honour all the time you've already served." },
          { question:"After the 60-month moratorium, an insurer CAN still reject a claim if:", options:["The condition was clearly pre-existing","You didn't disclose it when buying","The claim involves proven fraud","The hospital is non-network"], correct:2, explanation:"The moratorium only blocks non-disclosure rejections. Proven fraud can still void the policy at any time, even after the moratorium." },
        ],
      },
      {
        id:"exclusions", tag:"KNOW YOUR RIGHTS",
        title:"Exclusions, Waiting Periods & IRDAI Mandates",
        duration:"6 min",
        summary:"Not everything is covered. But IRDAI regulates which exclusions are legal — and some insurers still try to enforce illegal ones.",
        content:[
          "**Types of waiting periods:** Initial: 30 days for any illness (accidents always covered). PED: 1–3 years. Specific illness: 1–2 years for listed surgeries. Maternity: 2–4 years. Each runs separately and concurrently.",
          "**Standard exclusions IRDAI permits:** Cosmetic or aesthetic treatment, self-inflicted injuries, substance abuse and rehabilitation, war or nuclear events, experimental or unproven treatments.",
          "**What IRDAI 2024 now prohibits:** Arbitrary fine-print exclusions not disclosed at point of sale · AYUSH sublimits lower than the sum insured · Mental illness exclusions (Mental Healthcare Act 2017 mandates parity).",
          "**Mental health parity under law:** The Mental Healthcare Act 2017, Section 21(4) mandates that mental illness must be covered on par with physical illness. If your insurer rejects a mental health claim citing exclusion, cite this section verbatim in your GRO complaint.",
          "**Pre-purchase checklist:** ✅ Room rent cap — prefer 'no limit' ✅ Co-pay percentage ✅ Disease sublimits ✅ AYUSH coverage ✅ Network hospitals in your city ✅ Claim settlement ratio >90%",
        ],
        videoId:"JNAkUZZqgqs",
        videoTitle:"Health Insurance Exclusions — Kya Nahi Cover Hoga?",
        videoChannel:"Labour Law Advisor",
        quiz:[
          { question:"The initial waiting period in most Indian health insurance policies is:", options:["7 days","15 days","30 days","90 days"], correct:2, explanation:"Standard initial waiting period is 30 days. Only accidental hospitalisations are covered during this time. Lapses reset this clock to day zero." },
          { question:"Under IRDAI 2024, AYUSH treatment must be covered:", options:["At 50% of allopathic coverage","Only for inpatient AYUSH care","Up to the full sum insured — same as allopathic","Only if the treating doctor is AYUSH-registered"], correct:2, explanation:"IRDAI 2024 removed all AYUSH sublimits. Any separate lower AYUSH limit is now non-compliant and challengeable." },
          { question:"Mental health hospitalisation claims can be challenged under:", options:["Consumer Protection Act 1986 only","Mental Healthcare Act 2017 Section 21(4)","IRDAI Act 1999","Companies Act 2013"], correct:1, explanation:"Section 21(4) of the Mental Healthcare Act 2017 is binding legislation mandating insurance parity for mental illness. It overrides policy exclusion clauses." },
        ],
      },
    ],
  },
  {
    id:"irdai", code:"04", icon:"⚖️",
    title:"IRDAI & Your Rights",
    subtitle:"The regulatory system that protects you",
    description:"Who IRDAI is. What powers it has. How to use IGMS. When to go to the Ombudsman. Your complete rights as an Indian policyholder — updated for 2024.",
    lessons:[
      {
        id:"what-irdai", tag:"EMPOWERMENT",
        title:"What is IRDAI and What Can It Do For You?",
        duration:"5 min",
        summary:"IRDAI is the Insurance Regulatory and Development Authority of India — the statutory body with power to penalise insurers, mandate products, and protect your rights.",
        content:[
          "**IRDAI** (Insurance Regulatory and Development Authority of India) is the statutory regulator established under the IRDAI Act 1999. It licenses all insurers, sets product regulations, mandates disclosures, and can impose fines, suspend licences, and mandate claim payments.",
          "IRDAI's mandate for policyholders: ensuring insurers pay valid claims on time · mandating standardised exclusions and waiting periods · protecting against unfair practices · maintaining the IGMS grievance system.",
          "**Key 2024 regulations:** Health Insurance Master Circular (29 May 2024) — no age limits for buying insurance, PED lookback reduced to 36 months, 1-hour cashless authorisation, no AYUSH sublimits, 5-year moratorium.",
          "IRDAI publishes annual **claim settlement ratio** data at irdai.gov.in. Ratio below 85%: caution. Below 75%: serious concern. Industry average for standalone health insurers: 90–95%.",
          "**What IRDAI cannot do:** It cannot directly order your specific claim to be paid — that is the Ombudsman's jurisdiction. However, filing on IGMS creates a regulatory record that most insurers respond to quickly.",
        ],
        videoId:"mxM_wonh56E",
        videoTitle:"IRDAI — Your Rights as a Policyholder | Complete Guide",
        videoChannel:"Shankar Nath",
        quiz:[
          { question:"IRDAI was established under which Act?", options:["Insurance Act 1938","IRDAI Act 1999","Consumer Protection Act 2019","Companies Act 2013"], correct:1, explanation:"IRDAI is a statutory body under the Insurance Regulatory and Development Authority Act, 1999. It has full regulatory authority over all insurers operating in India." },
          { question:"A claim settlement ratio below which percentage is a serious red flag?", options:["95%","90%","85%","75%"], correct:3, explanation:"Industry consensus: below 75% is a red flag. Look for insurers consistently above 90% in health insurance. IRDAI publishes this data annually." },
          { question:"For your individual claim dispute, the correct escalation body is:", options:["Supreme Court of India","Insurance Ombudsman","National Consumer Commission","SEBI"], correct:1, explanation:"The Insurance Ombudsman is the designated quasi-judicial forum for individual claim disputes. Free, binding up to ₹50L, average 90-day resolution." },
        ],
      },
      {
        id:"igms", tag:"YOUR ARSENAL",
        title:"Using IGMS & the Ombudsman System",
        duration:"7 min",
        summary:"IGMS is the free online grievance portal. The Ombudsman is the final escalation — binding, fast, and free. These two tools resolve 60%+ of contested claims.",
        content:[
          "**IGMS (Integrated Grievance Management System):** The official IRDAI portal at igms.irda.gov.in. File here if your insurer hasn't resolved your complaint within 15 days, or if you're dissatisfied with their response.",
          "**How to file on IGMS:** Go to igms.irda.gov.in → Register with mobile number → 'Register Complaint' → Select your insurer → Choose complaint category → Fill details → Upload documents → Submit. You receive a unique complaint ID via SMS. Insurer must respond within 15 days.",
          "**IRDAI Consumer Helpline:** 155255 (toll-free, 8am–8pm Monday–Saturday) or 1800-4254-732. Available in Hindi and regional languages.",
          "**Insurance Ombudsman:** 17 offices across India — jurisdiction based on your residential address. Handles disputes for claims below ₹50 lakhs. Free. Average resolution: 60–90 days. The award is **binding on the insurer**.",
          "**Ombudsman eligibility:** ✅ Already complained to insurer in writing. ✅ Unsatisfactory reply OR no reply within 30 days. ✅ Dispute below ₹50 lakhs. ✅ Filing within 1 year of rejection. Find your office at **cioins.co.in**.",
        ],
        videoId:"5narOFNcZio",
        videoTitle:"IRDAI IGMS Complaint Kaise File Karein? Step by Step",
        videoChannel:"Labour Law Advisor",
        quiz:[
          { question:"How long does an insurer have to respond to an IGMS complaint?", options:["7 days","15 days","30 days","45 days"], correct:1, explanation:"IRDAI mandates 15-day response to IGMS complaints. No response in 15 days? Escalate directly to the Ombudsman — it strengthens your case." },
          { question:"The Insurance Ombudsman award is:", options:["Advisory only — insurer can ignore it","Binding on the insurer — policyholder can still go to court if unsatisfied","Binding on both parties — neither can appeal further","Subject to High Court confirmation before taking effect"], correct:1, explanation:"Binding on the insurer. The policyholder retains the right to go to Consumer Court if not satisfied with the award amount." },
          { question:"You can approach the Ombudsman if your insurer hasn't resolved your complaint within:", options:["7 days","15 days","30 days","60 days"], correct:2, explanation:"After 30 days without resolution you can approach the Ombudsman. Don't delay beyond the 1-year deadline from the final rejection letter." },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════
   SYSTEM PROMPT
══════════════════════════════════════════════════════════════ */
function buildSystemPrompt(lessonTitle: string, lessonContent: string[]): string {
  return `You are InsureIQ, a warm and knowledgeable insurance education assistant on CareBridge AI — a platform helping Indian policyholders understand health insurance.

You are helping a learner studying: "${lessonTitle}"

Key content from this lesson (use as primary reference):
${lessonContent.map((p, i) => `${i+1}. ${p.replace(/\*\*/g,"")}`).join("\n")}

Guidelines:
- Answer questions about this lesson and general Indian health insurance
- Reference IRDAI 2024 regulations where relevant
- Use Indian examples with ₹ amounts and real context (cities, IRDAI, TPA names like Medi Assist)
- Be concise (under 180 words), warm, jargon-free
- Never give legal advice — recommend IRDAI IGMS (155255) or Insurance Ombudsman (cioins.co.in) for disputes
- Do not use markdown headers in your response`;
}

/* ══════════════════════════════════════════════════════════════
   MARKDOWN RENDERER
══════════════════════════════════════════════════════════════ */
function Md({ text, onDark }: { text: string; onDark?: boolean }): React.ReactElement {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: "0 0 8px 0", lineHeight: 1.8 }}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j} style={{ color: onDark ? "#d8eedd" : C.forest, fontWeight: 600 }}>{p.slice(2,-2)}</strong>
                : <span key={j}>{p}</span>
            )}
          </p>
        );
      })}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAG CHIP
══════════════════════════════════════════════════════════════ */
function TagChip({ tag }: { tag?: string }) {
  if (!tag) return null;
  const isWarn = tag.includes("⚠") || tag.includes("🔥") || tag === "CRITICAL";
  return (
    <span style={{
      fontFamily: C.mono, fontSize: 9, letterSpacing: "0.12em",
      padding: "3px 9px", borderRadius: 2,
      background: isWarn ? "#f5d0cc" : "#d6eddc",
      color: isWarn ? "#8c1f14" : C.forest,
      border: `1px solid ${isWarn ? "#e08070" : "#9dd0aa"}`,
      flexShrink: 0, whiteSpace: "nowrap" as const,
    }}>
      {tag}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIDEO PLAYER — auto-detects error, shows YouTube fallback
══════════════════════════════════════════════════════════════ */
function VideoPlayer({ lesson }: { lesson: Lesson }) {
  const [errored, setErrored] = useState(false);
  // Reset error state when lesson changes
  useEffect(() => { setErrored(false); }, [lesson.videoId]);

  return (
    <div style={{ border: `1px solid ${C.bdr}`, borderRadius: 4, overflow: "hidden", background: C.white }}>
      <div style={{
        padding: "10px 18px", background: "#f5f0e8",
        borderBottom: `1px solid ${C.bdrLight}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 15 }}>🎬</span>
        <div>
          <div style={{ fontFamily: C.mono, fontSize: 8, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase" }}>
            Video · {lesson.videoChannel}
          </div>
          <div style={{ fontFamily: C.sans, fontSize: 13, color: C.ink, fontWeight: 500, marginTop: 1 }}>
            {lesson.videoTitle}
          </div>
        </div>
      </div>
      {errored ? (
        <div style={{
          minHeight: 240, background: C.dark,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 16, padding: 32, textAlign: "center",
        }}>
          <div style={{ fontSize: 32 }}>📺</div>
          <div style={{ fontFamily: C.sans, fontSize: 14, color: "#8a9e88", lineHeight: 1.7 }}>
            This video cannot be embedded.<br />Watch it directly on YouTube.
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${lesson.videoId}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              fontFamily: C.mono, fontSize: 11, letterSpacing: "0.1em",
              color: "#fff", background: C.forest,
              padding: "10px 22px", borderRadius: 3,
              textDecoration: "none", display: "inline-block",
            }}
          >
            WATCH ON YOUTUBE →
          </a>
          <div style={{ fontFamily: C.mono, fontSize: 9, color: "#555", maxWidth: 280 }}>
            Search: &ldquo;{lesson.videoTitle}&rdquo;
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
          <iframe
  key={lesson.videoId}
  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
  src={`https://www.youtube.com/embed/${lesson.videoId}?rel=0&modestbranding=1`}
  title={lesson.videoTitle}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  onError={() => setErrored(true)}
/>
          
        </div>
      )}
      {!errored && (
        <div style={{ padding: "8px 18px", background: "#f5f0e8", borderTop: `1px solid ${C.bdrLight}`, display: "flex", justifyContent: "flex-end" }}>
          <a
            href={`https://www.youtube.com/watch?v=${lesson.videoId}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: "0.1em", color: C.muted, textDecoration: "none" }}
          >
            Open on YouTube ↗
          </a>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function LearnPage(): React.ReactElement {
  const [view, setView]              = useState<View>("home");
  const [activeModule, setActiveMod] = useState<Module | null>(null);
  const [activeLesson, setActiveLes] = useState<Lesson | null>(null);
  const [completed, setCompleted]    = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores]  = useState<Record<string,number>>({});
  const [quizAnswers, setQuizAns]    = useState<(number|null)[]>([]);
  const [messages, setMessages]      = useState<Message[]>([]);
  const [chatInput, setChatInput]    = useState<string>("");
  const [chatLoading, setChatLoad]   = useState<boolean>(false);
  const [lang, setLang]              = useState<Lang>(LANGS[0]);
  const [listening, setListening]    = useState<boolean>(false);
  const [speaking, setSpeaking]      = useState<boolean>(false);
  const [voiceOn, setVoiceOn]        = useState<boolean>(false);
  const [transcript, setTx]          = useState<string>("");
  const [mounted, setMounted]        = useState<boolean>(false);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      const c = localStorage.getItem("cb_learn_v3_completed");
      const q = localStorage.getItem("cb_learn_v3_scores");
      if (c) setCompleted(new Set(JSON.parse(c) as string[]));
      if (q) setQuizScores(JSON.parse(q) as Record<string,number>);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (document.getElementById("cb-learn-fonts")) return;
    const l = document.createElement("link");
    l.id = "cb-learn-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap";
    document.head.appendChild(l);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, chatLoading]);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = lang.voiceLang;
    r.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t) : (interim += t);
      }
      setTx(final || interim);
      if (final) { setChatInput(final); if (inputRef.current) inputRef.current.value = final; }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
  }, [lang]);

  const speak = useCallback((text: string): void => {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g,"").replace(/\n+/g,". "));
    u.lang = lang.voiceLang; u.rate = 0.88; u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.startsWith(lang.voiceLang.split("-")[0]));
    if (pref) u.voice = pref;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [voiceOn, lang]);

  const stopSpeak = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  const toggleListen = () => {
    if (!recogRef.current) return;
    if (listening) { recogRef.current.stop(); setListening(false); }
    else { setTx(""); recogRef.current.start(); setListening(true); }
  };

  const goHome = () => {
    setView("home"); setActiveMod(null); setActiveLes(null);
    setQuizAns([]); setMessages([]);
  };

  const openModule = (mod: Module) => { setActiveMod(mod); setView("module"); };

  const openLesson = (les: Lesson) => {
    setActiveLes(les); setView("lesson");
    setQuizAns([]);
    setMessages([{ role:"assistant", content:`Hi! I'm InsureIQ. You're studying **${les.title}**. Ask me anything about this topic.` }]);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const startQuiz = () => {
    if (!activeLesson) return;
    setQuizAns(new Array(activeLesson.quiz.length).fill(null) as null[]);
    setView("quiz");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const markComplete = (id: string) => {
    const next = new Set(completed); next.add(id); setCompleted(next);
    localStorage.setItem("cb_learn_v3_completed", JSON.stringify([...next]));
  };

  const submitQuiz = () => {
    if (!activeLesson || quizAnswers.some(a => a===null)) return;
    const score = quizAnswers.reduce<number>((acc,ans,i) =>
      ans===activeLesson.quiz[i].correct ? acc+1 : acc, 0);
    const updated = { ...quizScores, [activeLesson.id]: score };
    setQuizScores(updated);
    localStorage.setItem("cb_learn_v3_scores", JSON.stringify(updated));
    if (score >= 2) markComplete(activeLesson.id);
    setView("quiz-result");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const sendChat = useCallback(async (q: string): Promise<void> => {
    if (!q.trim() || chatLoading || !activeLesson) return;
    const userMsg: Message = { role:"user", content:q };
    const history: Message[] = [...messages, userMsg];
    setMessages(history); setChatInput(""); setTx(""); setChatLoad(true);
    if (inputRef.current) inputRef.current.value = "";
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-5", max_tokens:600,
          system:buildSystemPrompt(activeLesson.title, activeLesson.content),
          messages:history,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json() as { content?: Array<{text?:string}> };
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't respond right now.";
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
      speak(reply);
    } catch {
      setMessages(prev => [...prev, { role:"assistant", content:"Connection issue — please try again." }]);
    } finally { setChatLoad(false); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [chatLoading, messages, activeLesson, speak]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat(inputRef.current?.value ?? chatInput);
    }
  };

  const totalLessons   = MODULES.reduce((a,m) => a+m.lessons.length, 0);
  const completedCount = MODULES.reduce((a,m) => a+m.lessons.filter(l=>completed.has(l.id)).length, 0);
  const overallPct     = Math.round((completedCount/totalLessons)*100);

  if (!mounted) return <div style={{ background: C.bg, minHeight:"100vh" }} />;

  /* ── NAV LINKS — link to actual routes in the app ── */
  const NAV_LINKS = [
    { label: "ANALYZE", href: "/prepurchase" },
    { label: "AUDIT",   href: "/audit" },
    { label: "COMPARE", href: "/compare" },
    { label: "GET HELP",href: "/help" },
  ];

  /* ── BREADCRUMB ── */
  const Breadcrumb = ({ items }: { items: Array<{ label:string; onClick?:()=>void }> }) => (
    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:28, fontFamily:C.mono, fontSize:10, letterSpacing:"0.08em" }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: C.mutedLt }}>/</span>}
          {item.onClick
            ? <button onClick={item.onClick} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontFamily:C.mono, fontSize:10, letterSpacing:"0.08em", padding:0, textTransform:"uppercase" }}>{item.label}</button>
            : <span style={{ color: C.dark, textTransform:"uppercase" }}>{item.label}</span>
          }
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.ink}; font-family: ${C.sans}; -webkit-font-smoothing: antialiased; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes bounce   { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulseRing{ 0%,100%{box-shadow:0 0 0 0 rgba(30,92,46,.4)} 60%{box-shadow:0 0 0 8px rgba(30,92,46,0)} }

        .cb-anim { animation: fadeUp .38s cubic-bezier(.22,1,.36,1) both; }

        .mod-card { cursor:pointer; transition:transform .18s, box-shadow .18s, background .12s; }
        .mod-card:hover { transform:translateY(-3px)!important; box-shadow:0 12px 40px rgba(10,15,13,.12)!important; }
        .mod-card:active { transform:translateY(-1px)!important; }

        .les-row { cursor:pointer; transition:background .12s, border-color .12s; }
        .les-row:hover { background:${C.forestDim}!important; }

        .qopt { cursor:pointer; transition:border-color .12s, background .12s; width:100%; text-align:left; }
        .qopt:hover:not([disabled]) { border-color:${C.forest}!important; background:${C.forestDim}!important; }

        .cb-btn { cursor:pointer; transition:transform .12s, filter .12s; }
        .cb-btn:hover:not([disabled]) { transform:translateY(-1px); filter:brightness(1.08); }
        .cb-btn:disabled { opacity:.35; cursor:not-allowed; }

        .nav-link { transition:color .12s, opacity .12s; }
        .nav-link:hover { opacity:1!important; color:white!important; }

        .chat-inp:focus { outline:none; border-color:${C.forest}!important; }

        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:${C.bdr}; border-radius:3px; }

        select { -webkit-appearance:none; appearance:none; cursor:pointer; }
        button { font-family: inherit; }
        iframe { display:block; }
        a { text-decoration:none; }
      `}</style>

      <div style={{ fontFamily:C.sans, background:C.bg, minHeight:"100vh", color:C.ink, display:"flex", flexDirection:"column" }}>

        {/* ══ NAV — matches audit page exactly ══ */}
        <nav style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 40px", height:58,
          background:C.dark, borderBottom:`1px solid #1a2018`,
          position:"sticky", top:0, zIndex:200,
          boxShadow:"0 2px 20px rgba(0,0,0,.4)",
        }}>
          <button onClick={goHome} style={{ fontFamily:C.serif, fontSize:20, fontWeight:500, color:"#e8f0ea", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.01em" }}>
            CareBridge
          </button>

          <div style={{ display:"flex", gap:28, alignItems:"center" }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} className="nav-link"
                style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.12em", color:"rgba(255,255,255,.35)", textDecoration:"none" }}>
                {label}
              </a>
            ))}
            <button onClick={goHome}
              style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.12em", color:C.green, background:"none", border:"none", cursor:"pointer", borderBottom:`1px solid ${C.green}`, paddingBottom:2 }}>
              LEARN
            </button>
          </div>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ position:"relative" }}>
              <select
                value={lang.code}
                onChange={e => setLang(LANGS.find(l=>l.code===e.target.value)??LANGS[0])}
                style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.06em", background:"#1a2018", border:`1px solid #2d3a2d`, color:"#e8f0ea", padding:"5px 26px 5px 10px", borderRadius:3 }}
              >
                {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.4)", fontSize:9, pointerEvents:"none" }}>▼</span>
            </div>
            <button
              onClick={() => { setVoiceOn(v=>!v); if(speaking) stopSpeak(); }}
              style={{ background:"transparent", border:`1px solid ${voiceOn ? C.green : "#2d3a2d"}`, borderRadius:3, padding:"5px 9px", color:voiceOn ? C.green : "rgba(255,255,255,.4)", fontSize:14, cursor:"pointer", transition:"all .15s" }}
            >{voiceOn ? "🔊" : "🔇"}</button>
          </div>
        </nav>

        {/* ══ HOME ══ */}
        {view==="home" && (
          <div className="cb-anim" style={{ maxWidth:1160, width:"100%", margin:"0 auto", padding:"48px 40px 100px" }}>

            {/* Page header — same layout as audit page */}
            <div style={{ paddingBottom:40, marginBottom:40, borderBottom:`1px solid ${C.bdr}`, display:"grid", gridTemplateColumns:"1fr 280px", gap:40, alignItems:"end" }}>
              <div>
                <div style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Insurance Education · India · IRDAI 2024</div>
                <h1 style={{ fontFamily:C.serif, fontSize:"clamp(34px,3.5vw,50px)", fontWeight:500, lineHeight:1.08, color:C.dark, marginBottom:14 }}>
                  Understand insurance.<br /><em style={{ fontStyle:"italic", color:C.forest }}>Before it's too late.</em>
                </h1>
                <p style={{ fontFamily:C.sans, fontSize:15, color:"#3a4038", lineHeight:1.75, maxWidth:480 }}>
                  4 modules · {totalLessons} lessons · all updated for IRDAI 2024 reforms.
                  Real Indian examples. Voice in Hindi, Marathi & Tamil.
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                {[{i:"🏥",t:"IRDAI 2024"},{i:"🎤",t:"4 Languages"},{i:"✅",t:"Free · No Login"},{i:"🇮🇳",t:"Indian Context"}].map(b=>(
                  <div key={b.t} style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.white, border:`1px solid ${C.bdr}`, padding:"5px 12px", borderRadius:2, fontFamily:C.sans, fontSize:12, color:C.muted, margin:"3px" }}>
                    <span>{b.i}</span><span>{b.t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress + module grid */}
            <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:24, alignItems:"start" }}>
              {/* Progress sidebar */}
              <div style={{ background:C.dark, borderRadius:4, padding:22, position:"sticky", top:78 }}>
                <div style={{ fontFamily:C.mono, fontSize:9, letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginBottom:14 }}>Your Progress</div>
                <div style={{ fontFamily:C.serif, fontSize:56, fontWeight:400, color:"#e8f0ea", lineHeight:1, marginBottom:10 }}>
                  {overallPct}<span style={{ fontSize:22, color:"rgba(255,255,255,.35)" }}>%</span>
                </div>
                <div style={{ height:3, background:"#1a2018", borderRadius:2, marginBottom:8, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:2, background:C.green, width:`${overallPct}%`, transition:"width 1s ease" }} />
                </div>
                <div style={{ fontFamily:C.mono, fontSize:10, color:"rgba(255,255,255,.35)", marginBottom:20 }}>{completedCount} of {totalLessons} complete</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {MODULES.map(m=>{
                    const c = m.lessons.filter(l=>completed.has(l.id)).length;
                    const pct = Math.round((c/m.lessons.length)*100);
                    return (
                      <div key={m.id}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                            <span style={{ fontSize:11 }}>{m.icon}</span>
                            <span style={{ fontFamily:C.sans, fontSize:11, color:"rgba(255,255,255,.5)" }}>{m.title}</span>
                          </div>
                          <span style={{ fontFamily:C.mono, fontSize:9, color:c===m.lessons.length?C.green:"rgba(255,255,255,.3)" }}>{c}/{m.lessons.length}</span>
                        </div>
                        <div style={{ height:2, background:"#1a2018", borderRadius:1, overflow:"hidden" }}>
                          <div style={{ height:"100%", background:c===m.lessons.length?C.green:C.forest, width:`${pct}%`, transition:"width .8s ease", borderRadius:1 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Module grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:2, background:C.bdr, border:`1px solid ${C.bdr}`, borderRadius:4, overflow:"hidden" }}>
                {MODULES.map((mod,mi)=>{
                  const c = mod.lessons.filter(l=>completed.has(l.id)).length;
                  const pct = Math.round((c/mod.lessons.length)*100);
                  return (
                    <div key={mod.id} className="mod-card"
                      onClick={()=>openModule(mod)}
                      style={{ background:C.white, padding:"28px 24px", display:"flex", flexDirection:"column", gap:10, animation:`fadeUp .38s ${mi*0.08}s both cubic-bezier(.22,1,.36,1)` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ fontSize:28 }}>{mod.icon}</div>
                        <div style={{ fontFamily:C.mono, fontSize:10, color:C.mutedLt }}>{mod.code}</div>
                      </div>
                      <div style={{ fontFamily:C.serif, fontSize:21, fontWeight:500, lineHeight:1.2, color:C.dark }}>{mod.title}</div>
                      <div style={{ fontFamily:C.sans, fontSize:13, fontStyle:"italic", color:C.muted }}>{mod.subtitle}</div>
                      <p style={{ fontFamily:C.sans, fontSize:13.5, color:"#3a4038", lineHeight:1.75, flex:1 }}>{mod.description}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:6 }}>
                        <div style={{ flex:1, height:2, background:C.bdrLight, borderRadius:1, overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:1, background:pct===100?C.green:C.forest, width:`${pct}%`, transition:"width .9s ease" }} />
                        </div>
                        <span style={{ fontFamily:C.mono, fontSize:9, color:C.mutedLt }}>{c}/{mod.lessons.length}</span>
                        <span style={{ fontFamily:C.serif, fontSize:18, color:C.forest }}>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* India banner */}
            <div style={{ marginTop:32, background:C.dark, border:`1px solid #2d3a2d`, borderRadius:4, padding:"20px 28px", display:"flex", gap:18, alignItems:"center" }}>
              <div style={{ fontSize:32, flexShrink:0 }}>🇮🇳</div>
              <div>
                <div style={{ fontFamily:C.serif, fontSize:17, color:"#e8f0ea", marginBottom:5 }}>Built for Indian policyholders</div>
                <div style={{ fontFamily:C.sans, fontSize:13, color:"#5a7060", lineHeight:1.7 }}>
                  All content updated for IRDAI 2024 reforms · ₹ examples from real Indian hospitals · IGMS, Ombudsman, NALSA, PM-JAY.
                  Helpline: <strong style={{ color:C.green }}>155255</strong> · igms.irda.gov.in
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODULE ══ */}
        {view==="module" && activeModule && (
          <div className="cb-anim" style={{ maxWidth:1160, width:"100%", margin:"0 auto", padding:"40px 40px 100px" }}>
            <Breadcrumb items={[{label:"Learn",onClick:goHome},{label:activeModule.title}]} />
            <header style={{ marginBottom:36, paddingBottom:28, borderBottom:`1px solid ${C.bdr}` }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
                <span style={{ fontSize:28 }}>{activeModule.icon}</span>
                <div style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:C.muted }}>{activeModule.code} — Module</div>
              </div>
              <h1 style={{ fontFamily:C.serif, fontSize:38, fontWeight:500, marginBottom:10, color:C.dark }}>{activeModule.title}</h1>
              <p style={{ fontFamily:C.sans, fontSize:15, color:"#3a4038", lineHeight:1.8, maxWidth:600 }}>{activeModule.description}</p>
            </header>
            <div style={{ display:"flex", flexDirection:"column", gap:2, border:`1px solid ${C.bdr}`, background:C.bdr, borderRadius:4, overflow:"hidden" }}>
              {activeModule.lessons.map((les,idx)=>{
                const isDone = completed.has(les.id);
                const score  = quizScores[les.id];
                return (
                  <div key={les.id} className="les-row"
                    style={{ display:"flex", gap:18, alignItems:"flex-start", padding:"20px 24px", background:C.white }}
                    onClick={()=>openLesson(les)}>
                    <div style={{ fontFamily:C.mono, fontSize:13, width:28, flexShrink:0, paddingTop:1, color:isDone?C.forest:C.mutedLt }}>
                      {isDone ? "✓" : String(idx+1).padStart(2,"0")}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                        <div style={{ fontFamily:C.serif, fontSize:19, fontWeight:500, color:C.dark }}>{les.title}</div>
                        <TagChip tag={les.tag} />
                      </div>
                      <div style={{ fontFamily:C.sans, fontSize:13.5, color:"#3a4038", lineHeight:1.65, fontStyle:"italic", marginBottom:8 }}>{les.summary}</div>
                      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                        {[`📖 ${les.duration}`,`🎬 ${les.videoChannel}`,`✏️ ${les.quiz.length} questions`].map(m=>(
                          <span key={m} style={{ fontFamily:C.mono, fontSize:9, letterSpacing:"0.06em", color:C.mutedLt }}>{m}</span>
                        ))}
                        {score !== undefined && (
                          <span style={{ fontFamily:C.mono, fontSize:9, color:score>=2?C.forest:"#8c1f14" }}>Score: {score}/{les.quiz.length}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ flexShrink:0, paddingTop:2 }}>
                      <span style={{ fontFamily:C.mono, fontSize:9, letterSpacing:"0.12em", border:`1px solid ${isDone?C.forest:C.bdr}`, color:isDone?C.forest:C.mutedLt, padding:"4px 12px", borderRadius:2 }}>
                        {isDone ? "DONE" : "START"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ LESSON ══ */}
        {view==="lesson" && activeLesson && activeModule && (
          <div className="cb-anim" style={{ maxWidth:1160, width:"100%", margin:"0 auto", padding:"40px 40px 100px" }}>
            <Breadcrumb items={[{label:"Learn",onClick:goHome},{label:activeModule.title,onClick:()=>setView("module")},{label:activeLesson.title}]} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24, alignItems:"start" }}>

              {/* ── Main content ── */}
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {/* Lesson header */}
                <div style={{ paddingBottom:18, borderBottom:`1px solid ${C.bdr}` }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                    <div style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:C.muted }}>{activeModule.code} — {activeModule.title}</div>
                    <TagChip tag={activeLesson.tag} />
                    {completed.has(activeLesson.id) && (
                      <span style={{ fontFamily:C.mono, fontSize:9, letterSpacing:"0.1em", color:C.forest, border:`1px solid ${C.forest}`, padding:"2px 9px", borderRadius:2 }}>✓ COMPLETED</span>
                    )}
                  </div>
                  <h1 style={{ fontFamily:C.serif, fontSize:34, fontWeight:500, marginBottom:8, color:C.dark }}>{activeLesson.title}</h1>
                  <p style={{ fontFamily:C.sans, fontSize:14.5, color:"#3a4038", fontStyle:"italic", lineHeight:1.7 }}>{activeLesson.summary}</p>
                </div>

                {/* Reading */}
                <div style={{ background:C.paper, border:`1px solid ${C.bdr}`, padding:"28px 32px", borderRadius:4 }}>
                  <div style={{ fontFamily:C.mono, fontSize:9, letterSpacing:"0.16em", textTransform:"uppercase", color:C.mutedLt, marginBottom:18, paddingBottom:10, borderBottom:`1px solid ${C.bdrLight}` }}>
                    Reading · {activeLesson.duration}
                  </div>
                  {activeLesson.content.map((para,i)=>(
                    <div key={i} style={{ fontFamily:C.sans, fontSize:15, color:C.ink, lineHeight:1.85, marginBottom:14 }}>
                      <Md text={para} />
                    </div>
                  ))}
                </div>

                {/* Video */}
                <VideoPlayer lesson={activeLesson} />

                {/* Key takeaways */}
                <div style={{ background:"#d6eddc", border:`1px solid #9dd0aa`, borderRadius:4, padding:"18px 24px" }}>
                  <div style={{ fontFamily:C.mono, fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:C.forest, marginBottom:12 }}>Key IRDAI 2024 Updates in This Lesson</div>
                  {activeLesson.content
                    .filter(p => p.includes("IRDAI 2024"))
                    .map((p, i) => (
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                        <span style={{ color:C.forest, flexShrink:0, marginTop:2 }}>◆</span>
                        <div style={{ fontFamily:C.sans, fontSize:13, color:"#143a1e", lineHeight:1.65 }}>
                          <Md text={p.replace(/\*\*/g, "")} />
                        </div>
                      </div>
                    ))
                  }
                  {activeLesson.content.filter(p => p.includes("IRDAI 2024")).length === 0 && (
                    <div style={{ fontFamily:C.sans, fontSize:13, color:"#3a7050", fontStyle:"italic" }}>This lesson covers foundational concepts applicable under current IRDAI guidelines.</div>
                  )}
                </div>

                {/* Quiz CTA */}
                <div style={{ background:C.dark, border:`1px solid #1a2018`, padding:"20px 24px", borderRadius:4, display:"flex", justifyContent:"space-between", alignItems:"center", gap:20 }}>
                  <div>
                    <div style={{ fontFamily:C.serif, fontSize:19, color:"#e8f0ea", marginBottom:4 }}>Test your understanding</div>
                    <div style={{ fontFamily:C.sans, fontSize:12, color:"rgba(255,255,255,.4)" }}>{activeLesson.quiz.length} questions · Score 2+ to mark lesson complete</div>
                  </div>
                  <button className="cb-btn" onClick={startQuiz}
                    style={{ fontFamily:C.mono, fontSize:11, letterSpacing:"0.1em", background:C.forest, color:"#e8f0ea", border:"none", padding:"11px 24px", borderRadius:3, flexShrink:0, cursor:"pointer" }}>
                    TAKE QUIZ →
                  </button>
                </div>
              </div>

              {/* ── Chat sidebar ── */}
              <div style={{ background:C.dark, border:`1px solid #1a2018`, display:"flex", flexDirection:"column", position:"sticky", top:78, maxHeight:"calc(100vh - 100px)", borderRadius:4, overflow:"hidden", boxShadow:"0 8px 40px rgba(10,15,13,.3)" }}>
                {/* Chat header */}
                <div style={{ padding:"12px 16px", borderBottom:`1px solid #1a2018`, display:"flex", justifyContent:"space-between", alignItems:"center", background:"#0a0f0d" }}>
                  <div>
                    <div style={{ fontFamily:C.mono, fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginBottom:2 }}>Lesson Assistant</div>
                    <div style={{ fontFamily:C.serif, fontSize:16, color:"#e8f0ea" }}>InsureIQ</div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}` }} />
                    <button onClick={toggleListen} title={listening ? "Stop" : `Speak in ${lang.label}`}
                      style={{ width:30, height:30, borderRadius:3, background:"transparent", border:`1px solid ${listening ? C.green : "#2d3a2d"}`, color:listening ? C.green : "rgba(255,255,255,.35)", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", animation:listening?"pulseRing 1.5s infinite":"none", transition:"all .15s" }}>
                      {listening ? "◼" : "◎"}
                    </button>
                    {speaking && (
                      <button onClick={stopSpeak} style={{ width:30, height:30, borderRadius:3, background:"transparent", border:`1px solid #2d3a2d`, color:"rgba(255,255,255,.35)", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>⏸</button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex:1, overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:10, minHeight:200, background:"#0d1510" }}>
                  {messages.map((m,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection:m.role==="user"?"row-reverse":"row" }}>
                      {m.role==="assistant" && (
                        <div style={{ width:24, height:24, flexShrink:0, background:"#1a2018", border:`1px solid ${C.green}44`, color:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:C.mono, fontSize:7, borderRadius:2 }}>IQ</div>
                      )}
                      <div style={{ background:m.role==="user"?"#1e5c2e44":"#1a2018", border:`1px solid ${m.role==="user" ? C.forest+"55" : "#2d3a2d"}`, padding:"9px 12px", borderRadius:3, fontFamily:C.sans, fontSize:12.5, color:"#d8eedd", lineHeight:1.65, maxWidth:"88%" }}>
                        <Md text={m.content} onDark />
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <div style={{ width:24, height:24, flexShrink:0, background:"#1a2018", border:`1px solid ${C.green}44`, color:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:C.mono, fontSize:7, borderRadius:2 }}>IQ</div>
                      <div style={{ background:"#1a2018", border:"1px solid #2d3a2d", padding:"10px 14px", borderRadius:3, display:"flex", gap:4, alignItems:"center" }}>
                        {[0,0.2,0.4].map((d,i)=>(
                          <span key={i} style={{ display:"inline-block", width:5, height:5, borderRadius:"50%", background:"rgba(255,255,255,.3)", animation:`bounce 1.2s ${d}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {listening && transcript && (
                  <div style={{ fontFamily:C.sans, fontSize:12, fontStyle:"italic", color:C.green, padding:"7px 14px", borderTop:"1px solid #1a2018", background:"#0a0f0d" }}>{transcript}</div>
                )}

                <div style={{ display:"flex", borderTop:"1px solid #1a2018", background:"#0a0f0d" }}>
                  <input
                    ref={inputRef}
                    className="chat-inp"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={lang.placeholder}
                    disabled={chatLoading}
                    style={{ flex:1, background:"transparent", border:"none", borderRight:"1px solid #1a2018", padding:"11px 13px", fontFamily:C.sans, fontSize:12.5, color:"#e8f0ea" }}
                  />
                  <button
                    onClick={() => sendChat(inputRef.current?.value ?? chatInput)}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{ width:42, background:chatLoading||!chatInput.trim()?"#1a2018":C.forest, border:"none", color:"#e8f0ea", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}
                  >→</button>
                </div>
                <div style={{ padding:"4px 13px 7px", fontFamily:C.mono, fontSize:8, letterSpacing:"0.05em", color:"rgba(255,255,255,.2)", background:"#0a0f0d" }}>Enter to send · not legal advice</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ QUIZ ══ */}
        {view==="quiz" && activeLesson && (
          <div className="cb-anim" style={{ maxWidth:720, width:"100%", margin:"0 auto", padding:"40px 40px 100px" }}>
            <button onClick={()=>setView("lesson")}
              style={{ background:"none", border:"none", cursor:"pointer", fontFamily:C.mono, fontSize:10, color:C.mutedLt, letterSpacing:"0.08em", marginBottom:28, display:"flex", alignItems:"center", gap:6 }}>
              ← BACK TO LESSON
            </button>
            <div style={{ marginBottom:32, paddingBottom:22, borderBottom:`1px solid ${C.bdr}` }}>
              <div style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:C.muted, marginBottom:6 }}>Quiz — {activeLesson.title}</div>
              <h2 style={{ fontFamily:C.serif, fontSize:32, fontWeight:500, marginBottom:6, color:C.dark }}>Test your understanding</h2>
              <p style={{ fontFamily:C.sans, fontSize:14, color:C.muted, fontStyle:"italic" }}>Score 2 or more to complete the lesson.</p>
            </div>

            {activeLesson.quiz.map((q,qi)=>(
              <div key={qi} style={{ background:C.white, border:`1px solid ${C.bdr}`, padding:"22px", marginBottom:14, borderRadius:4 }}>
                <div style={{ fontFamily:C.mono, fontSize:10, letterSpacing:"0.12em", color:C.mutedLt, marginBottom:6 }}>Q{qi+1} of {activeLesson.quiz.length}</div>
                <div style={{ fontFamily:C.serif, fontSize:18, lineHeight:1.5, marginBottom:16, color:C.dark }}>{q.question}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {q.options.map((opt,oi)=>{
                    const sel = quizAnswers[qi]===oi;
                    return (
                      <button key={oi} className="qopt"
                        onClick={()=>{const n=[...quizAnswers]; n[qi]=oi; setQuizAns(n);}}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", fontFamily:C.sans, fontSize:14, color:C.dark, background:sel?"#d6eddc":C.paper, border:`1px solid ${sel?C.forest:C.bdr}`, borderRadius:3 }}>
                        <span style={{ fontFamily:C.mono, fontSize:9, letterSpacing:"0.1em", width:22, height:22, border:`1px solid ${sel?C.forest:C.bdr}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, borderRadius:2, color:sel?C.forest:C.mutedLt, background:sel?"#9dd0aa44":"transparent" }}>
                          {String.fromCharCode(65+oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button className="cb-btn" onClick={submitQuiz}
              disabled={quizAnswers.some(a=>a===null)}
              style={{ fontFamily:C.mono, fontSize:11, letterSpacing:"0.12em", background:C.forest, color:"#e8f0ea", border:"none", padding:"13px 36px", borderRadius:3, marginTop:8, cursor:"pointer" }}>
              SUBMIT ANSWERS
            </button>
          </div>
        )}

        {/* ══ QUIZ RESULT ══ */}
        {view==="quiz-result" && activeLesson && (() => {
          const score = quizScores[activeLesson.id] ?? 0;
          const pass  = score >= 2;
          return (
            <div className="cb-anim" style={{ maxWidth:720, width:"100%", margin:"0 auto", padding:"40px 40px 100px" }}>
              <div style={{ padding:"32px", background:pass?C.dark:"#1a0808", border:`1px solid ${pass?"#2d3a2d":"#4a1010"}`, borderRadius:4, marginBottom:22, textAlign:"center" }}>
                <div style={{ fontFamily:C.serif, fontSize:60, fontWeight:400, color:"#e8f0ea", lineHeight:1, marginBottom:8 }}>
                  {score}<span style={{ fontSize:26, color:"rgba(255,255,255,.35)" }}>/{activeLesson.quiz.length}</span>
                </div>
                <div style={{ fontFamily:C.mono, fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:pass?C.green:"#e07060", marginBottom:10 }}>
                  {pass ? "✓ Lesson Complete" : "Review & Retry"}
                </div>
                <div style={{ fontFamily:C.sans, fontSize:14, fontStyle:"italic", color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>
                  {pass ? "Well done. You've demonstrated solid understanding of this topic." : "Review the lesson material and try again — no pressure, this is self-paced."}
                </div>
              </div>

              {activeLesson.quiz.map((q,qi)=>{
                const chosen = quizAnswers[qi];
                const correct = q.correct;
                const isRight = chosen === correct;
                return (
                  <div key={qi} style={{ background:C.white, border:`1px solid ${C.bdr}`, padding:"18px 22px", marginBottom:10, borderRadius:4 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                      <span style={{ width:26, height:26, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:isRight?"#d6eddc":"#f5d0cc", color:isRight?C.forest:"#8c1f14", fontFamily:C.mono, fontSize:11, borderRadius:2 }}>
                        {isRight ? "✓" : "✗"}
                      </span>
                      <div style={{ fontFamily:C.serif, fontSize:16, lineHeight:1.5, color:C.dark }}>{q.question}</div>
                    </div>
                    {!isRight && (
                      <div style={{ fontFamily:C.mono, fontSize:11, color:C.forest, marginBottom:7, letterSpacing:"0.04em", paddingLeft:36 }}>
                        Correct: <strong>{q.options[correct]}</strong>
                      </div>
                    )}
                    <div style={{ fontFamily:C.sans, fontSize:13, color:"#3a4038", lineHeight:1.75, fontStyle:"italic", paddingLeft:36 }}>{q.explanation}</div>
                  </div>
                );
              })}

              <div style={{ display:"flex", gap:10, marginTop:22, flexWrap:"wrap" }}>
                {!pass && (
                  <button className="cb-btn" onClick={startQuiz}
                    style={{ fontFamily:C.mono, fontSize:11, letterSpacing:"0.1em", background:"transparent", border:`1px solid ${C.bdr}`, color:C.ink, padding:"10px 20px", borderRadius:3, cursor:"pointer" }}>
                    RETRY QUIZ
                  </button>
                )}
                <button className="cb-btn" onClick={()=>setView("lesson")}
                  style={{ fontFamily:C.mono, fontSize:11, letterSpacing:"0.1em", background:"transparent", border:`1px solid ${C.bdr}`, color:C.ink, padding:"10px 20px", borderRadius:3, cursor:"pointer" }}>
                  {pass ? "BACK TO LESSON" : "REVIEW LESSON"}
                </button>
                <button className="cb-btn" onClick={()=>setView("module")}
                  style={{ fontFamily:C.mono, fontSize:11, letterSpacing:"0.1em", background:C.forest, color:"#e8f0ea", border:"none", padding:"10px 20px", borderRadius:3, cursor:"pointer" }}>
                  ALL LESSONS →
                </button>
                {pass && (
                  <button className="cb-btn" onClick={goHome}
                    style={{ fontFamily:C.mono, fontSize:11, letterSpacing:"0.1em", background:"transparent", border:`1px solid ${C.forest}`, color:C.forest, padding:"10px 20px", borderRadius:3, cursor:"pointer" }}>
                    HOME →
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══ FOOTER ══ */}
        <footer style={{ padding:"16px 40px", borderTop:`1px solid ${C.bdr}`, fontFamily:C.mono, fontSize:9, letterSpacing:"0.06em", color:C.mutedLt, display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto", background:C.paper }}>
          <span>CareBridge AI · Insurance Education · Not legal advice</span>
          <span>IRDAI Helpline: <strong style={{ color:C.forest }}>155255</strong> · igms.irda.gov.in · cioins.co.in</span>
        </footer>
      </div>
    </>
  );
}