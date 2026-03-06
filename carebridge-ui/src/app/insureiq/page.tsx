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
  content: string[]; videoId: string; videoTitle: string;
  videoChannel: string;
  quiz: QuizQuestion[]; tag?: string;
}
interface Module {
  id: string; code: string; title: string; subtitle: string;
  description: string; lessons: Lesson[]; icon: string;
}
type View = "home" | "module" | "lesson" | "quiz" | "quiz-result";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS — warm saffron editorial, Indian heritage
══════════════════════════════════════════════════════════════ */
const T = {
  paper:    "#FAF7F2",
  paperDim: "#F2EDE4",
  paperBdr: "#E0D9CE",
  dark:     "#1A1108",
  darkMid:  "#2E2010",
  ink:      "#3D2E18",
  muted:    "#8C7B65",
  saffron:  "#E8760A",
  saffronL: "#F59332",
  saffronD: "#B85C06",
  forest:   "#1E4D2B",
  forestL:  "#2E7042",
  forestDim:"#122B18",
  crimson:  "#8B1A1A",
  crimsonL: "#C23232",
  serif:    "'Playfair Display', Georgia, serif",
  sans:     "'DM Sans', system-ui, sans-serif",
  mono:     "'JetBrains Mono', 'Courier New', monospace",
} as const;

/* ══════════════════════════════════════════════════════════════
   LANGUAGES
══════════════════════════════════════════════════════════════ */
interface Lang { label: string; code: string; voiceLang: string; placeholder: string; }
const LANGS: Lang[] = [
  { label:"English", code:"en", voiceLang:"en-IN", placeholder:"Ask me anything…" },
  { label:"हिन्दी",  code:"hi", voiceLang:"hi-IN", placeholder:"कुछ भी पूछें…" },
  { label:"मराठी",  code:"mr", voiceLang:"mr-IN", placeholder:"काहीही विचारा…" },
  { label:"தமிழ்",  code:"ta", voiceLang:"ta-IN", placeholder:"எதையும் கேளுங்கள்…" },
];

/* ══════════════════════════════════════════════════════════════
   CURRICULUM DATA
   Video IDs: real Indian finance / insurance education channels.
   Channels: Labour Law Advisor, Asset Yogi, CA Rachana Ranade,
   Pranjal Kamra, Shankar Nath. If any video is removed, search
   the channel for the same topic and replace the ID.
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
          "Key insight: insurance is **not a savings product**. Unused premium is not returned. Its value is pure risk protection — covering costs that would otherwise devastate your finances. Think of it as paying a small known cost to avoid a potentially catastrophic unknown one.",
        ],
        videoId:"oBFEzEMvIRM",
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
          "In India, premiums are driven by: **age** (the dominant factor — a 25-year-old pays roughly 3× less than a 55-year-old for identical cover), **sum insured**, **zone/city** (Zone A cities like Delhi/Mumbai cost 30–40% more than smaller cities), **pre-existing diseases**, and **add-ons** like maternity or critical illness riders.",
          "**No-Claim Bonus (NCB):** If you make no claims in a year, most insurers add 10–50% more sum insured at the same premium. Example: ₹5L policy → claim-free year → ₹5.5L next year at no extra cost. NCB compounds year over year. Even a ₹500 pharmacy claim can cost you ₹50,000 in lost NCB over time.",
          "**IRDAI 2024 update:** Insurers can no longer impose entry age limits. Senior citizens above 65 can now buy fresh health insurance. The maximum waiting period for pre-existing diseases has also been reduced from 48 months to 36 months — a major consumer win.",
          "Practical example: In Bengaluru, a 35-year-old buying ₹10L individual cover pays approximately ₹8,000–₹12,000/year. Adding a 62-year-old parent to a family floater can push this to ₹35,000–₹55,000. Always compare on IRDAI-regulated comparison portals before buying.",
        ],
        videoId:"wkqxMoKFHsk",
        videoTitle:"Health Insurance Premium Calculation — Explained Simply",
        videoChannel:"CA Rachana Ranade",
        quiz:[
          { question:"Which factor has the BIGGEST impact on your health insurance premium?", options:["Your city or zone","Your age","Your hospital preference","Your employer's HR"], correct:1, explanation:"Age dominates premium calculation in India. After 45, premiums jump sharply with each renewal band. The earlier you buy and stay continuously covered, the lower your lifetime cost." },
          { question:"What is No-Claim Bonus (NCB)?", options:["A cash refund if you make no claims","An increase in sum insured for claim-free years at no extra premium","A discount on next year's premium","A reward from the TPA"], correct:1, explanation:"NCB grows your sum insured free of charge for each claim-free year. It compounds — worth protecting by not claiming small amounts that you can afford out of pocket." },
          { question:"IRDAI allows insurers to revise your premium:", options:["Any time during the policy year","Only at renewal, based on age band and claims experience","Never, once the policy is issued","Only if you file a claim"], correct:1, explanation:"Mid-year premium changes are prohibited by IRDAI. Renewals may see age-band revisions. Always read the renewal notice carefully — you have 15 days from the renewal date to decide." },
        ],
      },
      {
        id:"copay", tag:"⚠️ HIDDEN TRAPS",
        title:"Co-payment, Deductibles & Sub-limits",
        duration:"7 min",
        summary:"These clauses quietly reduce your payout at claim time. Most policyholders discover them only inside the hospital. Learn them before buying.",
        content:[
          "**Co-payment** means you agree to pay a fixed percentage of every claim yourself. Example: 20% co-pay on a ₹1,00,000 claim = you pay ₹20,000, insurer pays ₹80,000. Co-pay is common in senior citizen policies and in plans covering pre-existing diseases from day one.",
          "**Deductible** is a fixed rupee amount you absorb before insurance activates. Example: ₹25,000 deductible = any bill below ₹25,000 is entirely yours; above that, insurer pays the excess. Deductibles reduce premiums by 20–35% — useful if you have emergency savings as a buffer.",
          "**Room rent sublimit** is the most misunderstood trap. If your policy caps room rent at 1% of sum insured (₹5,000/day on a ₹5L policy) and you stay in a ₹10,000/day room, the insurer applies **proportionate deduction** to your ENTIRE bill — not just the room. A ₹60,000 surgery bill becomes ₹30,000 payout. Always choose 'no room rent cap' or 'any room' plans.",
          "**Disease-specific sublimits** cap payout for certain surgeries regardless of actual cost. Cataract: ₹30,000–₹50,000 cap. Hernia: ₹40,000–₹60,000 cap. Private hospital costs may be 2–3× higher. Always check the Schedule of Benefits table before buying.",
          "**IRDAI 2024 update:** AYUSH sublimits have been removed. Ayurveda, Yoga, Unani, Siddha, and Homeopathy treatments are now covered up to the full sum insured — same as allopathic. If your policy still has a separate lower AYUSH sublimit, it is non-compliant with 2024 guidelines and challengeable.",
        ],
        videoId:"qRGqFZbEqG4",
        videoTitle:"Health Insurance Sub-limits, Co-pay & Deductibles Explained",
        videoChannel:"Asset Yogi",
        quiz:[
          { question:"You have 20% co-pay. Your hospital bill is ₹2,00,000. How much do YOU pay?", options:["₹20,000","₹40,000","₹80,000","Nothing — insurer pays all"], correct:1, explanation:"20% of ₹2,00,000 = ₹40,000 out of your pocket. Insurer pays ₹1,60,000. Co-pay plans have lower premiums but higher out-of-pocket costs when you actually claim." },
          { question:"Room rent proportionate deduction means:", options:["Only the room rent excess is deducted","Your ENTIRE bill is reduced proportionally if you exceed the room rent cap","You pay a fixed ₹500/day penalty","The insurer pays 50% of all costs"], correct:1, explanation:"This is the brutal reality. Exceeding the room rent cap triggers deduction on the whole bill — doctor fees, surgery, ICU, everything. Not just the room. It can cut your payout in half." },
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
          "**Cashless claims** work only at network hospitals — hospitals with a pre-agreed arrangement with your insurer or TPA. You present your health card, the hospital submits a pre-authorisation request to the TPA, and if approved, the insurer settles the bill directly. You pay only non-covered items.",
          "**Reimbursement claims** allow you to use any hospital. You pay the full bill, collect all original documents, and submit within 30–45 days from discharge. The insurer reviews and pays back the eligible amount minus any deductibles or co-pay.",
          "**IRDAI 2024 cashless mandate:** Insurers must decide on pre-authorisation within **1 hour** for both emergency and planned admissions. Final discharge authorisation must be given within **3 hours** of the hospital's request. Delays beyond this: the insurer bears extra hospital charges caused by the wait. This is a hard regulatory requirement.",
          "**Critical documents for any claim:** Original discharge summary · Itemised hospital bills · Doctor's prescription and case papers · Investigation reports (blood tests, scans, ECG) · Pharmacy bills · Pre-auth approval letter (cashless) · Signed claim form · PAN card copy if claim exceeds ₹1 lakh.",
          "**Pro tip:** Always file a reimbursement claim even if your cashless pre-auth was partially denied. Submit the full itemised bill — the insurer may cover more on formal review. Photograph all documents before submitting originals. Even ₹50 pharmacy slips add up.",
        ],
        videoId:"A3hBbMj5Eus",
        videoTitle:"Cashless vs Reimbursement Health Insurance Claim",
        videoChannel:"Labour Law Advisor",
        quiz:[
          { question:"Cashless claims are available at:", options:["Any hospital in India","Only network hospitals empanelled with your insurer/TPA","Any NABH-accredited hospital","Only government hospitals"], correct:1, explanation:"Cashless requires a network hospital with a TPA agreement. Always verify your insurer's hospital network before admission — especially for planned procedures. The list is on their website." },
          { question:"Under IRDAI 2024, reimbursement claims must be settled within:", options:["7 days","15 days","30 days of receiving complete documents","60 days"], correct:2, explanation:"IRDAI mandates 30-day settlement after all documents. Delays entitle you to interest at 2% above the bank rate. Insist on this in writing if your insurer is slow." },
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
          "**Non-disclosure:** If you didn't mention a pre-existing condition at policy purchase, the insurer can reject related claims during the waiting period. However, after **60 months** (5 years) of continuous coverage — the moratorium under IRDAI 2024 — insurers cannot reject on non-disclosure grounds. Previously 8 years, now reduced to 5.",
          "**4-step appeal process:** Step 1: Get the rejection in writing with the exact policy clause cited. Step 2: Verify whether that clause actually applies to your case — many insurers cite broad clauses hoping you won't check. Step 3: File a formal complaint with the insurer's GRO (Grievance Redressal Officer) — they must respond within 15 days by IRDAI mandate.",
          "Step 4: If GRO response is unsatisfactory or you get no reply in 15 days, file on IRDAI IGMS at igms.irda.gov.in. Free, online, creates a formal regulatory trail. Insurer must respond within 15 days. Step 5: If still unresolved after 30 days total, approach the **Insurance Ombudsman** — free, binding for claims up to ₹50 lakhs, average resolution in 90 days.",
          "**Success data:** IRDAI annual reports show over 60% of complaints filed with the Ombudsman result in partial or full settlement for the policyholder. The system works — but only if you use it. Don't accept a rejection without at least filing a GRO complaint. It costs nothing.",
        ],
        videoId:"Ev_Vc9cLjdo",
        videoTitle:"Claim Reject Ho Gaya? Yeh Karo — Complete Guide",
        videoChannel:"Pranjal Kamra / Finology",
        quiz:[
          { question:"Under IRDAI 2024, after how many months of continuous coverage can an insurer NOT reject on non-disclosure grounds?", options:["24 months","36 months","48 months","60 months"], correct:3, explanation:"IRDAI 2024 reduced the moratorium from 8 years to 5 years (60 months). After 5 continuous years, non-disclosure cannot be cited for rejection — even if the condition was genuinely undisclosed." },
          { question:"The Insurance Ombudsman handles claims up to:", options:["₹5 lakhs","₹10 lakhs","₹25 lakhs","₹50 lakhs"], correct:3, explanation:"The Insurance Ombudsman adjudicates disputes up to ₹50 lakhs. The service is completely free. Awards are binding on the insurer. Average resolution: 60–90 days." },
          { question:"When your cashless is denied at the hospital, what should you do FIRST?", options:["Pay and forget about it","Demand the denial in writing with the specific clause cited","Hire a lawyer immediately","Switch to a different hospital"], correct:1, explanation:"Always get denials in writing with the exact clause cited. That written rejection is your evidence for the appeal. Without it, the insurer can later claim a 'process issue' rather than a substantive denial." },
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
          "**Pre-Existing Disease (PED)** as defined by IRDAI 2024: any condition, ailment, or injury that was diagnosed by a physician, or for which symptoms clearly existed, within **36 months** prior to the date of first policy issuance. Previously 48 months — a major consumer-friendly change.",
          "This definition matters enormously in practice. If your hypertension was diagnosed 4 years ago and you just bought a policy, it is NOT technically PED under the 2024 definition. If it was diagnosed 2 years ago, it falls within the window and the waiting period applies.",
          "**Waiting periods under 2024 rules:** Most policies now impose 1–3 years for PED (reduced from up to 4 years). During this period, claims directly arising from the PED condition will be rejected. After the waiting period, PED is covered fully and permanently.",
          "**The 60-month moratorium:** After 5 years of continuous coverage, no insurer can reject a claim on grounds of non-disclosure or misrepresentation of a pre-existing condition. Previously 8 years — reduced to 5 years by IRDAI 2024. This is a hard statutory protection.",
          "**Portability and PED credit:** If you port your policy to a new insurer, your served waiting period transfers in full. A policyholder who has served 2 years of a 3-year PED waiting period with Insurer A only needs 1 more year with Insurer B. The new insurer cannot restart your clock — this is an IRDAI portability guarantee.",
        ],
        videoId:"M1JLFRwH63Y",
        videoTitle:"Pre-Existing Disease in Health Insurance — All Rules Explained",
        videoChannel:"Asset Yogi",
        quiz:[
          { question:"Under IRDAI 2024, PED covers conditions diagnosed within how many months before buying the policy?", options:["12 months","24 months","36 months","48 months"], correct:2, explanation:"IRDAI 2024 reduced the PED lookback from 48 months to 36 months. Conditions beyond 3 years old are no longer automatically classified as PED — better for consumers with older health histories." },
          { question:"When you port your policy, your PED waiting period credit:", options:["Resets to zero at the new insurer","Is transferred at 50% credit","Is fully transferred to the new insurer","Depends entirely on the new insurer's discretion"], correct:2, explanation:"IRDAI portability rules mandate full waiting period credit transfer. The new insurer must honour all the time you've already served. Non-negotiable — insist on it in writing during the porting process." },
          { question:"After the 60-month moratorium, an insurer CAN still reject a claim if:", options:["The condition was clearly pre-existing","You didn't disclose it when buying","The claim involves proven fraud","The hospital is non-network"], correct:2, explanation:"The moratorium only blocks non-disclosure rejections. Proven fraud — deliberate false statements to obtain insurance — can still void the policy at any time, even after the moratorium." },
        ],
      },
      {
        id:"exclusions", tag:"KNOW YOUR RIGHTS",
        title:"Exclusions, Waiting Periods & IRDAI Mandates",
        duration:"6 min",
        summary:"Not everything is covered. But IRDAI regulates which exclusions are legal — and some insurers still try to enforce illegal ones.",
        content:[
          "**Types of waiting periods:** Initial waiting period: 30 days for any illness (accidents always covered). PED waiting period: 1–3 years under 2024 rules. Specific illness waiting period: 1–2 years for listed surgeries — hernia, cataract, joint replacement, varicose veins. Maternity: 2–4 years. Each runs separately and concurrently.",
          "**Standard exclusions IRDAI permits:** Cosmetic or aesthetic treatment, self-inflicted injuries, substance abuse and rehabilitation, war or nuclear events, experimental or unproven treatments. These are legally permissible across all plans.",
          "**What IRDAI 2024 now prohibits:** Arbitrary fine-print exclusions not disclosed at point of sale · AYUSH sublimits lower than the sum insured (removed in 2024) · Mental illness exclusions (Mental Healthcare Act 2017 mandates parity) · Refusing policies to people with severe pre-existing conditions like cancer, renal failure, or AIDS.",
          "**Mental health parity under law:** The Mental Healthcare Act 2017, Section 21(4) mandates that mental illness must be covered on par with physical illness. Psychiatry hospitalisation, approved therapy, and medications are covered. If your insurer rejects a mental health claim citing exclusion, cite this section verbatim in your GRO complaint — it is binding legislation, not a guideline.",
          "**Pre-purchase checklist:** ✅ Room rent cap — prefer 'no limit' ✅ Co-pay percentage ✅ Disease-specific sublimits in Schedule of Benefits ✅ AYUSH coverage (must equal sum insured post-2024) ✅ Maternity waiting period if planning ✅ Network hospitals in your city ✅ Claim settlement ratio of the insurer (target >90%).",
        ],
        videoId:"JNAkUZZqgqs",
        videoTitle:"Health Insurance Exclusions — Kya Nahi Cover Hoga?",
        videoChannel:"Labour Law Advisor",
        quiz:[
          { question:"The initial waiting period in most Indian health insurance policies is:", options:["7 days","15 days","30 days","90 days"], correct:2, explanation:"Standard initial waiting period is 30 days. Only accidental hospitalisations are covered during this time. Plan renewal timing carefully — lapses reset this clock to day zero." },
          { question:"Under IRDAI 2024, AYUSH treatment must be covered:", options:["At 50% of allopathic coverage","Only for inpatient AYUSH care","Up to the full sum insured — same as allopathic","Only if the treating doctor is AYUSH-registered"], correct:2, explanation:"IRDAI 2024 removed all AYUSH sublimits. Any separate lower AYUSH limit in your current policy is now non-compliant with the 2024 Master Circular — you can challenge it." },
          { question:"Mental health hospitalisation claims can be challenged under:", options:["Consumer Protection Act 1986 only","Mental Healthcare Act 2017 Section 21(4)","IRDAI Act 1999","Companies Act 2013"], correct:1, explanation:"Section 21(4) of the Mental Healthcare Act 2017 is binding legislation mandating insurance parity for mental illness. It overrides policy exclusion clauses. Use this citation verbatim in your appeal." },
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
          "**IRDAI** (Insurance Regulatory and Development Authority of India) is the statutory regulator established under the IRDAI Act 1999. It licenses all insurers, sets product regulations, mandates disclosures, and has the power to impose fines, suspend licences, and mandate claim payments. The 2024 reforms represent the most comprehensive pro-consumer overhaul in IRDAI's history.",
          "IRDAI's primary mandate for policyholders: ensuring insurers pay valid claims on time · mandating standardised exclusions and waiting periods · protecting against unfair practices · maintaining the IGMS grievance system · publishing insurer-wise claim settlement ratio data publicly every year.",
          "**Key 2024 regulations:** Health Insurance Master Circular (29 May 2024) — covers: no age limits for buying insurance, PED lookback reduced to 36 months, 1-hour cashless authorisation, no AYUSH sublimits, 5-year moratorium. Download from irdai.gov.in.",
          "IRDAI publishes annual **claim settlement ratio** data for every insurer at irdai.gov.in. Ratio below 85%: caution flag. Below 75%: serious concern. Industry average for standalone health insurers (Star Health, Niva Bupa, Care Health): 90–95%. Always check this before buying.",
          "**What IRDAI cannot do:** It cannot directly order your specific claim to be paid — that is the Ombudsman's jurisdiction. However, filing on IGMS creates a regulatory record that most insurers respond to quickly. Many disputes resolve at the IGMS stage without needing the Ombudsman.",
        ],
        videoId:"5ZsTsABCYcM",
        videoTitle:"IRDAI — Your Rights as a Policyholder | Complete Guide",
        videoChannel:"Shankar Nath",
        quiz:[
          { question:"IRDAI was established under which Act?", options:["Insurance Act 1938","IRDAI Act 1999","Consumer Protection Act 2019","Companies Act 2013"], correct:1, explanation:"IRDAI is a statutory body under the Insurance Regulatory and Development Authority Act, 1999. It has full regulatory authority over all general and health insurers operating in India." },
          { question:"A claim settlement ratio below which percentage is a serious red flag?", options:["95%","90%","85%","75%"], correct:3, explanation:"Industry consensus: below 75% is a red flag. Look for insurers consistently above 90% in health insurance. IRDAI publishes this data annually — free to access at irdai.gov.in." },
          { question:"For your individual claim dispute, the correct escalation body is:", options:["Supreme Court of India","Insurance Ombudsman","National Consumer Commission","SEBI"], correct:1, explanation:"The Insurance Ombudsman is the designated quasi-judicial forum for individual claim disputes. Free, binding up to ₹50L, average 90-day resolution. IRDAI regulates the industry; Ombudsman resolves your specific dispute." },
        ],
      },
      {
        id:"igms", tag:"YOUR ARSENAL",
        title:"Using IGMS & the Ombudsman System",
        duration:"7 min",
        summary:"IGMS is the free online grievance portal. The Ombudsman is the final escalation — binding, fast, and free. These two tools resolve 60%+ of contested claims.",
        content:[
          "**IGMS (Integrated Grievance Management System):** The official IRDAI portal at igms.irda.gov.in. File here if your insurer hasn't resolved your complaint within 15 days, or if you're dissatisfied with their response. Creates a formal paper trail visible to IRDAI's compliance division. Most insurers escalate internally the moment an IGMS number is generated.",
          "**How to file on IGMS (step by step):** Go to igms.irda.gov.in → Register with mobile number → 'Register Complaint' → Select your insurer → Choose complaint category → Fill complaint details → Upload supporting documents (PDF/JPG) → Submit. You receive a unique complaint ID via SMS. Track status online. Insurer must respond within 15 days.",
          "**IRDAI Consumer Helpline:** 155255 (toll-free, 8am–8pm Monday–Saturday) or 1800-4254-732. Available in Hindi and regional languages. Can file complaints by phone, get rights guidance, and track existing complaints. Very responsive — use it.",
          "**Insurance Ombudsman:** 17 offices across India — jurisdiction based on your residential address. Handles disputes for claims below ₹50 lakhs. Completely free. Average resolution: 60–90 days. The Ombudsman's award is **binding on the insurer** (but you retain the right to go to Consumer Court if you're unhappy with the award amount).",
          "**Ombudsman eligibility:** ✅ You have already complained to the insurer in writing. ✅ You received an unsatisfactory reply OR no reply within 30 days. ✅ Dispute involves a claim below ₹50 lakhs. ✅ Filing within 1 year of insurer's final rejection letter. Find your nearest office by PIN code at **cioins.co.in**.",
        ],
        videoId:"Y9QBFNj0bMM",
        videoTitle:"IRDAI IGMS Complaint Kaise File Karein? Step by Step",
        videoChannel:"Labour Law Advisor",
        quiz:[
          { question:"How long does an insurer have to respond to an IGMS complaint?", options:["7 days","15 days","30 days","45 days"], correct:1, explanation:"IRDAI's Protection of Policyholders' Interests Regulations mandate 15-day response to IGMS complaints. No response in 15 days? Escalate directly to the Ombudsman — it strengthens your case." },
          { question:"The Insurance Ombudsman award is:", options:["Advisory only — insurer can ignore it","Binding on the insurer — policyholder can still go to court if unsatisfied","Binding on both parties — neither can appeal further","Subject to High Court confirmation before taking effect"], correct:1, explanation:"Binding on the insurer. The policyholder retains the right to go to Consumer Court or civil court if not satisfied with the award amount — it's a one-way ratchet in your favour." },
          { question:"You can approach the Ombudsman if your insurer hasn't resolved your complaint within:", options:["7 days","15 days","30 days","60 days"], correct:2, explanation:"After 30 days without resolution — or an unsatisfactory response at any point — you can approach the Ombudsman. Don't delay beyond the 1-year deadline from the final rejection letter." },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════
   CHAT SYSTEM PROMPT
══════════════════════════════════════════════════════════════ */
function buildSystemPrompt(lessonTitle: string, lessonContent: string[]): string {
  return `You are InsureIQ, a warm and knowledgeable insurance education assistant on CareBridge AI — a platform helping Indian policyholders understand health insurance.

You are helping a learner studying: "${lessonTitle}"

Key content from this lesson (use as primary reference):
${lessonContent.map((p, i) => `${i+1}. ${p.replace(/\*\*/g,"")}`).join("\n")}

Guidelines:
- Answer questions about this lesson and general Indian health insurance
- Reference IRDAI 2024 regulations where relevant (key changes: 36-month PED lookback, 1-hour cashless authorisation, no AYUSH sublimits, 5-year moratorium, no age limits)
- Use Indian examples with ₹ amounts and real context (cities, IRDAI, TPA names like Medi Assist)
- Be concise (under 180 words), warm, jargon-free
- If asked about something outside this topic, briefly answer then redirect
- Never give legal advice — recommend IRDAI IGMS (155255) or Insurance Ombudsman (cioins.co.in) for disputes
- Do not use markdown headers in your response`;
}

/* ══════════════════════════════════════════════════════════════
   MARKDOWN RENDERER
══════════════════════════════════════════════════════════════ */
function Md({ text, dark }: { text: string; dark?: boolean }): React.ReactElement {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: "0 0 10px 0", lineHeight: 1.85, lastChild: { marginBottom: 0 } } as React.CSSProperties}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j} style={{ color: dark ? T.saffronL : T.saffron, fontWeight: 700 }}>{p.slice(2,-2)}</strong>
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
  const isWarn = tag.includes("⚠️") || tag.includes("🔥") || tag === "CRITICAL";
  return (
    <span style={{
      fontFamily: T.mono, fontSize: 9, letterSpacing: "0.12em",
      padding: "3px 9px", borderRadius: 2,
      background: isWarn ? `${T.crimson}18` : `${T.forest}15`,
      color: isWarn ? T.crimsonL : T.forestL,
      border: `1px solid ${isWarn ? T.crimsonL : T.forestL}44`,
      flexShrink: 0, whiteSpace: "nowrap" as const,
    }}>
      {tag}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   VIDEO PLAYER WITH FALLBACK
══════════════════════════════════════════════════════════════ */
function VideoPlayer({ lesson, onError, hasError }: {
  lesson: Lesson;
  onError: (id: string) => void;
  hasError: boolean;
}) {
  return (
    <div style={{ border: `1px solid ${T.paperBdr}`, borderRadius: 4, overflow: "hidden" }}>
      <div style={{
        padding: "10px 18px", background: T.paperDim,
        borderBottom: `1px solid ${T.paperBdr}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 15 }}>🎬</span>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: "0.12em", color: T.muted }}>
            VIDEO · {lesson.videoChannel}
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, fontWeight: 500, marginTop: 1 }}>
            {lesson.videoTitle}
          </div>
        </div>
      </div>
      {hasError ? (
        <div style={{
          height: 280, background: T.dark,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 14, padding: 28, textAlign: "center",
        }}>
          <div style={{ fontSize: 36 }}>📺</div>
          <div style={{ fontFamily: T.sans, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
            Video not available in embedded mode.
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${lesson.videoId}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              fontFamily: T.mono, fontSize: 11, letterSpacing: "0.1em",
              color: "#fff", background: T.saffron,
              padding: "9px 20px", borderRadius: 3,
              textDecoration: "none", display: "inline-block",
            }}
          >
            WATCH ON YOUTUBE →
          </a>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: "#555", maxWidth: 300 }}>
            Search: &ldquo;{lesson.videoTitle}&rdquo; on YouTube
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
          <iframe
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            src={`https://www.youtube.com/embed/${lesson.videoId}?rel=0&modestbranding=1`}
            title={lesson.videoTitle}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => onError(lesson.videoId)}
          />
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
  const [quizSubmitted, setQuizSub]  = useState<boolean>(false);
  const [messages, setMessages]      = useState<Message[]>([]);
  const [chatInput, setChatInput]    = useState<string>("");
  const [chatLoading, setChatLoad]   = useState<boolean>(false);
  const [lang, setLang]              = useState<Lang>(LANGS[0]);
  const [listening, setListening]    = useState<boolean>(false);
  const [speaking, setSpeaking]      = useState<boolean>(false);
  const [voiceOn, setVoiceOn]        = useState<boolean>(false);
  const [transcript, setTx]          = useState<string>("");
  const [mounted, setMounted]        = useState<boolean>(false);
  const [videoErrors, setVideoErrors]= useState<Record<string,boolean>>({});

  void quizSubmitted;

  const endRef   = useRef<HTMLDivElement>(null);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      const c = localStorage.getItem("cb_learn_v2_completed");
      const q = localStorage.getItem("cb_learn_v2_scores");
      if (c) setCompleted(new Set(JSON.parse(c) as string[]));
      if (q) setQuizScores(JSON.parse(q) as Record<string,number>);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (document.getElementById("cb-learn-gf2")) return;
    const l = document.createElement("link");
    l.id = "cb-learn-gf2"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap";
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
      if (final) setChatInput(final);
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
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [voiceOn, lang]);

  const stopSpeak = (): void => { window.speechSynthesis?.cancel(); setSpeaking(false); };
  const toggleListen = (): void => {
    if (!recogRef.current) return;
    if (listening) { recogRef.current.stop(); setListening(false); }
    else { setTx(""); recogRef.current.start(); setListening(true); }
  };

  const goHome = (): void => {
    setView("home"); setActiveMod(null); setActiveLes(null);
    setQuizAns([]); setQuizSub(false); setMessages([]);
  };
  const openModule = (mod: Module): void => { setActiveMod(mod); setView("module"); };
  const openLesson = (les: Lesson): void => {
    setActiveLes(les); setView("lesson");
    setQuizAns([]); setQuizSub(false);
    setMessages([{ role:"assistant", content:`Hi! I'm InsureIQ. You're studying **${les.title}**. Ask me anything about this topic — in ${lang.label}.` }]);
  };
  const startQuiz = (): void => {
    if (!activeLesson) return;
    setQuizAns(new Array(activeLesson.quiz.length).fill(null) as null[]);
    setQuizSub(false); setView("quiz");
  };

  const markComplete = (id: string): void => {
    const next = new Set(completed); next.add(id); setCompleted(next);
    localStorage.setItem("cb_learn_v2_completed", JSON.stringify([...next]));
  };

  const submitQuiz = (): void => {
    if (!activeLesson || quizAnswers.some(a => a===null)) return;
    setQuizSub(true);
    const score = quizAnswers.reduce<number>((acc,ans,i) =>
      ans===activeLesson.quiz[i].correct ? acc+1 : acc, 0);
    const updated = { ...quizScores, [activeLesson.id]: score };
    setQuizScores(updated);
    localStorage.setItem("cb_learn_v2_scores", JSON.stringify(updated));
    if (score >= 2) markComplete(activeLesson.id);
    setView("quiz-result");
  };

  const sendChat = useCallback(async (q: string): Promise<void> => {
    if (!q.trim() || chatLoading || !activeLesson) return;
    const userMsg: Message = { role:"user", content:q };
    const history: Message[] = [...messages, userMsg];
    setMessages(history); setChatInput(""); setTx(""); setChatLoad(true);
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
    } finally { setChatLoad(false); }
  }, [chatLoading, messages, activeLesson, speak]);

  const totalLessons   = MODULES.reduce((a,m) => a+m.lessons.length, 0);
  const completedCount = MODULES.reduce((a,m) => a+m.lessons.filter(l=>completed.has(l.id)).length, 0);
  const overallPct     = Math.round((completedCount/totalLessons)*100);

  const handleVideoError = (id: string) => setVideoErrors(prev => ({...prev,[id]:true}));

  if (!mounted) return <div style={{ background:T.paper, minHeight:"100vh" }} />;

  /* ── BREADCRUMB ── */
  const Breadcrumb = ({ items }: { items: Array<{ label:string; onClick?:()=>void }> }) => (
    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:36, fontFamily:T.mono, fontSize:10, letterSpacing:"0.08em" }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color:T.muted }}>/</span>}
          {item.onClick
            ? <button onClick={item.onClick} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontFamily:T.mono, fontSize:10, letterSpacing:"0.08em", padding:0 }}>{item.label}</button>
            : <span style={{ color:T.dark }}>{item.label}</span>
          }
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes blink{0%,80%,100%{opacity:.15;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
        @keyframes pulseRing{0%,100%{box-shadow:0 0 0 0 rgba(232,118,10,.45)}60%{box-shadow:0 0 0 10px rgba(232,118,10,0)}}
        @keyframes slideChat{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes barGrow{from{width:0}to{width:var(--target)}}

        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}

        .cb-anim{animation:fadeUp .42s cubic-bezier(.22,1,.36,1) both;}
        .cb-fade{animation:fadeIn .3s ease both;}

        .mod-card{cursor:pointer; transition:transform .2s ease, box-shadow .2s ease, background .15s;}
        .mod-card:hover{transform:translateY(-4px)!important; box-shadow:0 16px 48px rgba(26,17,8,.14)!important; background:${T.paperDim}!important;}
        .mod-card:active{transform:translateY(-1px)!important;}

        .les-row{cursor:pointer; transition:background .12s, padding-left .18s cubic-bezier(.22,1,.36,1);}
        .les-row:hover{background:${T.paperDim}!important; padding-left:32px!important;}

        .qopt{cursor:pointer; transition:border-color .12s, background .12s;}
        .qopt:hover:not(:disabled){border-color:${T.saffron}!important; background:${T.saffron}08!important;}

        .cb-btn{cursor:pointer; transition:transform .15s, filter .15s;}
        .cb-btn:hover:not(:disabled){transform:translateY(-1px); filter:brightness(1.1);}
        .cb-btn:disabled{opacity:.32; cursor:not-allowed;}

        .chat-in:focus{outline:none; border-color:${T.saffron}!important;}
        .nav-lnk{cursor:pointer; transition:color .12s;}
        .nav-lnk:hover{color:${T.paper}!important;}

        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:${T.paperDim};}
        ::-webkit-scrollbar-thumb{background:${T.paperBdr}; border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:${T.muted};}

        select{-webkit-appearance:none; appearance:none; cursor:pointer;}
        button{font-family:inherit;}
        iframe{display:block;}
      `}</style>

      <div style={{ fontFamily:T.sans, background:T.paper, minHeight:"100vh", color:T.dark, display:"flex", flexDirection:"column" }}>

        {/* ── NAV ── */}
        <nav style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 40px", height:58,
          background:T.dark, borderBottom:`1px solid ${T.darkMid}`,
          position:"sticky", top:0, zIndex:100,
          boxShadow:"0 2px 24px rgba(0,0,0,.45)",
        }}>
          <button onClick={goHome} style={{ fontFamily:T.serif, fontSize:18, fontWeight:500, color:T.paper, background:"none", border:"none", cursor:"pointer" }}>
            CareBridge
          </button>
          <div style={{ display:"flex", gap:24, alignItems:"center" }}>
            {["ANALYZE","AUDIT","COMPARE","GET HELP"].map(l => (
              <span key={l} className="nav-lnk" style={{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.1em", color:"#5A4A35" }}>{l}</span>
            ))}
            <span style={{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.1em", color:T.saffron, borderBottom:`1px solid ${T.saffron}`, paddingBottom:2 }}>LEARN</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ position:"relative" }}>
              <select
                value={lang.code}
                onChange={e => setLang(LANGS.find(l=>l.code===e.target.value)??LANGS[0])}
                style={{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.06em", background:T.darkMid, border:`1px solid #3A2E1E`, color:T.paper, padding:"5px 28px 5px 10px", borderRadius:3 }}
              >
                {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:T.muted, fontSize:9, pointerEvents:"none" }}>▼</span>
            </div>
            <button
              onClick={() => { setVoiceOn(v=>!v); if(speaking) stopSpeak(); }}
              style={{ background:"transparent", border:`1px solid ${voiceOn?T.saffron:"#3A2E1E"}`, borderRadius:3, padding:"5px 9px", color:voiceOn?T.saffron:T.muted, fontSize:14, cursor:"pointer", transition:"all .15s" }}
            >{voiceOn?"🔊":"🔇"}</button>
          </div>
        </nav>

        {/* ══ HOME ══ */}
        {view==="home" && (
          <div className="cb-anim" style={{ maxWidth:1120, width:"100%", margin:"0 auto", padding:"52px 40px 100px" }}>
            {/* Hero */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:48, paddingBottom:52, marginBottom:52, borderBottom:`1px solid ${T.paperBdr}` }}>
              <div>
                <div style={{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.2em", color:T.saffron, marginBottom:18 }}>— INSURANCE EDUCATION · INDIA · IRDAI 2024</div>
                <h1 style={{ fontFamily:T.serif, fontSize:54, fontWeight:400, lineHeight:1.08, marginBottom:20 }}>
                  Understand insurance.<br />
                  <em style={{ color:T.saffron, fontStyle:"italic" }}>Before it&apos;s too late.</em>
                </h1>
                <p style={{ fontFamily:T.sans, fontSize:16, color:"#6B5A45", lineHeight:1.8, maxWidth:500, marginBottom:28 }}>
                  4 modules · {totalLessons} lessons · all updated for IRDAI 2024 reforms.
                  Real Indian examples. Voice in Hindi, Marathi & Tamil.
                </p>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[{i:"🏥",t:"IRDAI 2024"},{i:"🎤",t:"4 Languages"},{i:"✅",t:"Free · No Login"},{i:"🇮🇳",t:"Indian Context"}].map(b=>(
                    <div key={b.t} style={{ display:"flex", alignItems:"center", gap:7, background:T.paperDim, border:`1px solid ${T.paperBdr}`, padding:"7px 14px", borderRadius:3, fontFamily:T.sans, fontSize:12, color:T.muted }}>
                      <span>{b.i}</span><span>{b.t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress card */}
              <div style={{ background:T.dark, border:`1px solid ${T.darkMid}`, padding:28, borderRadius:4, boxShadow:"0 8px 48px rgba(26,17,8,.25)" }}>
                <div style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.18em", color:T.muted, marginBottom:14 }}>YOUR PROGRESS</div>
                <div style={{ fontFamily:T.serif, fontSize:60, fontWeight:400, color:T.paper, lineHeight:1, marginBottom:14 }}>
                  {overallPct}<span style={{ fontSize:26, color:T.muted }}>%</span>
                </div>
                <div style={{ height:3, background:T.darkMid, borderRadius:2, marginBottom:10, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:2, background:`linear-gradient(90deg,${T.saffronD},${T.saffron})`, width:`${overallPct}%`, transition:"width 1.2s cubic-bezier(.22,1,.36,1)", boxShadow:`0 0 10px ${T.saffron}70` }} />
                </div>
                <div style={{ fontFamily:T.mono, fontSize:10, color:T.muted, marginBottom:22 }}>{completedCount} of {totalLessons} complete</div>
                <div style={{ borderTop:`1px solid ${T.darkMid}`, paddingTop:16, display:"flex", flexDirection:"column", gap:9 }}>
                  {MODULES.map(m=>{
                    const c=m.lessons.filter(l=>completed.has(l.id)).length;
                    const pct=Math.round((c/m.lessons.length)*100);
                    return (
                      <div key={m.id}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                            <span style={{ fontSize:12 }}>{m.icon}</span>
                            <span style={{ fontFamily:T.sans, fontSize:12, color:"#C4B4A0" }}>{m.title}</span>
                          </div>
                          <span style={{ fontFamily:T.mono, fontSize:9, color:c===m.lessons.length?T.saffron:T.muted }}>{c}/{m.lessons.length}</span>
                        </div>
                        <div style={{ height:2, background:T.darkMid, borderRadius:1, overflow:"hidden" }}>
                          <div style={{ height:"100%", background:c===m.lessons.length?T.saffron:T.forestL, width:`${pct}%`, transition:"width .8s ease", borderRadius:1 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Module grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:2, background:T.paperBdr, border:`1px solid ${T.paperBdr}` }}>
              {MODULES.map((mod,mi)=>{
                const c=mod.lessons.filter(l=>completed.has(l.id)).length;
                const pct=Math.round((c/mod.lessons.length)*100);
                return (
                  <div
                    key={mod.id}
                    className="mod-card"
                    onClick={()=>openModule(mod)}
                    style={{ background:T.paper, padding:"32px 28px", display:"flex", flexDirection:"column", gap:12, animation:`fadeUp .4s ${mi*0.09}s both cubic-bezier(.22,1,.36,1)` }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ fontSize:30 }}>{mod.icon}</div>
                      <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted }}>{mod.code}</div>
                    </div>
                    <div style={{ fontFamily:T.serif, fontSize:23, fontWeight:500, lineHeight:1.2 }}>{mod.title}</div>
                    <div style={{ fontFamily:T.sans, fontSize:13, fontStyle:"italic", color:T.muted }}>{mod.subtitle}</div>
                    <p style={{ fontFamily:T.sans, fontSize:14, color:"#6B5A45", lineHeight:1.78, flex:1 }}>{mod.description}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:8 }}>
                      <div style={{ flex:1, height:2, background:T.paperBdr, borderRadius:1, overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:1, background:pct===100?T.saffron:T.forest, width:`${pct}%`, transition:"width .9s cubic-bezier(.22,1,.36,1)" }} />
                      </div>
                      <span style={{ fontFamily:T.mono, fontSize:9, color:T.muted }}>{c}/{mod.lessons.length}</span>
                      <span style={{ fontFamily:T.serif, fontSize:20, color:T.saffron }}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* India context banner */}
            <div style={{ marginTop:40, background:`linear-gradient(135deg,${T.forestDim},${T.dark})`, border:`1px solid ${T.forest}44`, borderRadius:4, padding:"22px 28px", display:"flex", gap:20, alignItems:"center" }}>
              <div style={{ fontSize:36, flexShrink:0 }}>🇮🇳</div>
              <div>
                <div style={{ fontFamily:T.serif, fontSize:18, color:T.paper, marginBottom:6 }}>Built for Indian policyholders</div>
                <div style={{ fontFamily:T.sans, fontSize:13, color:"#7A8A78", lineHeight:1.72 }}>
                  All content updated for IRDAI 2024 reforms · ₹ examples from real Indian hospitals · IGMS, Ombudsman, NALSA, PM-JAY — the actual systems that protect you.
                  Helpline: <strong style={{ color:T.saffron }}>155255</strong> (toll-free) · igms.irda.gov.in
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODULE ══ */}
        {view==="module" && activeModule && (
          <div className="cb-anim" style={{ maxWidth:1120, width:"100%", margin:"0 auto", padding:"40px 40px 100px" }}>
            <Breadcrumb items={[{label:"Learn",onClick:goHome},{label:activeModule.title}]} />
            <header style={{ marginBottom:40, paddingBottom:32, borderBottom:`1px solid ${T.paperBdr}` }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:32 }}>{activeModule.icon}</span>
                <div style={{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.16em", color:T.saffron }}>{activeModule.code} — MODULE</div>
              </div>
              <h1 style={{ fontFamily:T.serif, fontSize:40, fontWeight:400, marginBottom:12 }}>{activeModule.title}</h1>
              <p style={{ fontFamily:T.sans, fontSize:15, color:"#6B5A45", lineHeight:1.8, maxWidth:600 }}>{activeModule.description}</p>
            </header>
            <div style={{ display:"flex", flexDirection:"column", gap:2, border:`1px solid ${T.paperBdr}`, background:T.paperBdr }}>
              {activeModule.lessons.map((les,idx)=>{
                const isDone=completed.has(les.id);
                const score=quizScores[les.id];
                return (
                  <div key={les.id} className="les-row" style={{ display:"flex", gap:20, alignItems:"flex-start", padding:"24px", background:T.paper }} onClick={()=>openLesson(les)}>
                    <div style={{ fontFamily:T.mono, fontSize:14, width:32, flexShrink:0, paddingTop:2, color:isDone?T.saffron:T.muted }}>
                      {isDone?"✓":String(idx+1).padStart(2,"0")}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                        <div style={{ fontFamily:T.serif, fontSize:20, fontWeight:500 }}>{les.title}</div>
                        <TagChip tag={les.tag} />
                      </div>
                      <div style={{ fontFamily:T.sans, fontSize:14, color:"#6B5A45", lineHeight:1.65, fontStyle:"italic", marginBottom:10 }}>{les.summary}</div>
                      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                        {[`📖 ${les.duration}`,`🎬 ${les.videoChannel}`,`✏️ ${les.quiz.length} questions`].map(m=>(
                          <span key={m} style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.06em", color:T.muted }}>{m}</span>
                        ))}
                        {score!==undefined && (
                          <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.06em", color:score>=2?T.saffron:T.crimsonL }}>Score: {score}/{les.quiz.length}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.12em", border:`1px solid ${isDone?T.saffron:T.paperBdr}`, color:isDone?T.saffron:T.muted, padding:"4px 12px" }}>
                        {isDone?"DONE":"START"}
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
          <div className="cb-anim" style={{ maxWidth:1120, width:"100%", margin:"0 auto", padding:"40px 40px 100px" }}>
            <Breadcrumb items={[{label:"Learn",onClick:goHome},{label:activeModule.title,onClick:()=>setView("module")},{label:activeLesson.title}]} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 330px", gap:28, alignItems:"start" }}>
              {/* Main */}
              <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                <div style={{ paddingBottom:20, borderBottom:`1px solid ${T.paperBdr}` }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
                    <div style={{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.14em", color:T.saffron }}>{activeModule.code} — {activeModule.title.toUpperCase()}</div>
                    <TagChip tag={activeLesson.tag} />
                    {completed.has(activeLesson.id) && (
                      <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.1em", color:T.saffron, border:`1px solid ${T.saffron}`, padding:"2px 10px" }}>✓ COMPLETED</span>
                    )}
                  </div>
                  <h1 style={{ fontFamily:T.serif, fontSize:36, fontWeight:400, marginBottom:10 }}>{activeLesson.title}</h1>
                  <p style={{ fontFamily:T.sans, fontSize:15, color:"#6B5A45", fontStyle:"italic", lineHeight:1.7 }}>{activeLesson.summary}</p>
                </div>

                {/* Reading */}
                <div style={{ background:T.paperDim, border:`1px solid ${T.paperBdr}`, padding:"32px 36px", borderRadius:3 }}>
                  <div style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.16em", color:T.muted, marginBottom:20, paddingBottom:12, borderBottom:`1px solid ${T.paperBdr}` }}>
                    READING · {activeLesson.duration}
                  </div>
                  {activeLesson.content.map((para,i)=>(
                    <div key={i} style={{ fontFamily:T.sans, fontSize:15.5, color:T.ink, lineHeight:1.87, marginBottom:16 }}>
                      <Md text={para} />
                    </div>
                  ))}
                </div>

                {/* Video */}
                <VideoPlayer lesson={activeLesson} hasError={!!videoErrors[activeLesson.videoId]} onError={handleVideoError} />

                {/* Quiz CTA */}
                <div style={{ background:T.dark, border:`1px solid ${T.darkMid}`, padding:"22px 28px", borderRadius:3, display:"flex", justifyContent:"space-between", alignItems:"center", gap:20 }}>
                  <div>
                    <div style={{ fontFamily:T.serif, fontSize:20, color:T.paper, marginBottom:5 }}>Test your understanding</div>
                    <div style={{ fontFamily:T.sans, fontSize:12, color:T.muted }}>{activeLesson.quiz.length} questions · Score 2+ to mark lesson complete</div>
                  </div>
                  <button className="cb-btn" onClick={startQuiz} style={{ fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:`linear-gradient(135deg,${T.saffronD},${T.saffron})`, color:"#fff", border:"none", padding:"11px 26px", borderRadius:3, flexShrink:0, boxShadow:`0 4px 18px ${T.saffron}44` }}>
                    TAKE QUIZ →
                  </button>
                </div>
              </div>

              {/* Chat sidebar */}
              <div style={{ background:T.dark, border:`1px solid ${T.darkMid}`, display:"flex", flexDirection:"column", position:"sticky", top:78, maxHeight:"calc(100vh - 98px)", borderRadius:4, overflow:"hidden", boxShadow:"0 10px 48px rgba(26,17,8,.3)" }}>
                {/* Header */}
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.darkMid}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:`linear-gradient(135deg,${T.darkMid},${T.dark})` }}>
                  <div>
                    <div style={{ fontFamily:T.mono, fontSize:8, letterSpacing:"0.14em", color:T.muted, marginBottom:3 }}>LESSON ASSISTANT</div>
                    <div style={{ fontFamily:T.serif, fontSize:16, color:T.paper }}>InsureIQ</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button
                      onClick={toggleListen}
                      title={listening?`Stop`:`Speak in ${lang.label}`}
                      style={{ width:32, height:32, borderRadius:3, background:"transparent", border:`1px solid ${listening?T.saffron:T.darkMid}`, color:listening?T.saffron:T.muted, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", animation:listening?"pulseRing 1.5s infinite":"none", transition:"all .15s" }}
                    >{listening?"◼":"◎"}</button>
                    {speaking && (
                      <button onClick={stopSpeak} style={{ width:32, height:32, borderRadius:3, background:"transparent", border:`1px solid ${T.darkMid}`, color:T.muted, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>⏸</button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex:1, overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:10, minHeight:180 }}>
                  {messages.map((m,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection:m.role==="user"?"row-reverse":"row", animation:`slideChat .22s ${i*0.03}s both` }}>
                      {m.role==="assistant" && (
                        <div style={{ width:26, height:26, flexShrink:0, background:T.darkMid, border:`1px solid ${T.saffron}44`, color:T.saffron, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.mono, fontSize:7, borderRadius:2 }}>IQ</div>
                      )}
                      <div style={{ background:m.role==="user"?`${T.forest}55`:T.darkMid, border:`1px solid ${m.role==="user"?T.forestL+"44":T.darkMid}`, padding:"9px 12px", borderRadius:3, fontFamily:T.sans, fontSize:13, color:T.paper, lineHeight:1.65, maxWidth:"86%" }}>
                        <Md text={m.content} dark />
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <div style={{ width:26, height:26, flexShrink:0, background:T.darkMid, border:`1px solid ${T.saffron}44`, color:T.saffron, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.mono, fontSize:7, borderRadius:2 }}>IQ</div>
                      <div style={{ background:T.darkMid, padding:"12px 14px", borderRadius:3, display:"flex", gap:5, alignItems:"center" }}>
                        {[0,0.22,0.44].map((d,i)=>(
                          <span key={i} style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.muted, animation:`blink 1.2s ${d}s infinite ease-in-out` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {listening && transcript && (
                  <div style={{ fontFamily:T.sans, fontSize:12, fontStyle:"italic", color:T.saffronL, padding:"8px 16px", borderTop:`1px solid ${T.darkMid}` }}>{transcript}</div>
                )}

                <div style={{ display:"flex", borderTop:`1px solid ${T.darkMid}` }}>
                  <input
                    className="chat-in"
                    value={chatInput}
                    onChange={e=>setChatInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){void sendChat(chatInput);}}}
                    placeholder={lang.placeholder}
                    style={{ flex:1, background:"transparent", border:"none", borderRight:`1px solid ${T.darkMid}`, padding:"11px 14px", fontFamily:T.sans, fontSize:13, color:T.paper }}
                  />
                  <button
                    onClick={()=>{void sendChat(chatInput);}}
                    disabled={chatLoading||!chatInput.trim()}
                    style={{ width:44, background:chatLoading||!chatInput.trim()?"#2A1F14":T.saffron, border:"none", color:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}
                  >→</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ QUIZ ══ */}
        {view==="quiz" && activeLesson && (
          <div className="cb-anim" style={{ maxWidth:740, width:"100%", margin:"0 auto", padding:"40px 40px 100px" }}>
            <button onClick={()=>setView("lesson")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:10, color:T.muted, letterSpacing:"0.08em", marginBottom:32 }}>← BACK TO LESSON</button>
            <div style={{ marginBottom:36, paddingBottom:24, borderBottom:`1px solid ${T.paperBdr}` }}>
              <div style={{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.14em", color:T.saffron, marginBottom:8 }}>QUIZ — {activeLesson.title.toUpperCase()}</div>
              <h2 style={{ fontFamily:T.serif, fontSize:34, fontWeight:400, marginBottom:8 }}>Test your understanding</h2>
              <p style={{ fontFamily:T.sans, fontSize:15, color:T.muted, fontStyle:"italic" }}>Score 2+ to complete the lesson.</p>
            </div>
            {activeLesson.quiz.map((q,qi)=>(
              <div key={qi} style={{ background:T.paperDim, border:`1px solid ${T.paperBdr}`, padding:"24px", marginBottom:16, borderRadius:3 }}>
                <div style={{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.12em", color:T.muted, marginBottom:8 }}>Q{qi+1}</div>
                <div style={{ fontFamily:T.serif, fontSize:18, lineHeight:1.5, marginBottom:18 }}>{q.question}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {q.options.map((opt,oi)=>{
                    const sel=quizAnswers[qi]===oi;
                    return (
                      <button key={oi} className="qopt" onClick={()=>{const n=[...quizAnswers];n[qi]=oi;setQuizAns(n);}}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", textAlign:"left", fontFamily:T.sans, fontSize:15, color:T.dark, background:sel?`${T.saffron}10`:T.paper, border:`1px solid ${sel?T.saffron:T.paperBdr}`, borderRadius:3, width:"100%" }}>
                        <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.1em", width:24, height:24, border:`1px solid ${sel?T.saffron:T.paperBdr}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, borderRadius:2, color:sel?T.saffron:T.muted, background:sel?`${T.saffron}15`:"transparent" }}>
                          {String.fromCharCode(65+oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button className="cb-btn" onClick={submitQuiz} disabled={quizAnswers.some(a=>a===null)}
              style={{ fontFamily:T.mono, fontSize:11, letterSpacing:"0.12em", background:`linear-gradient(135deg,${T.saffronD},${T.saffron})`, color:"#fff", border:"none", padding:"14px 38px", borderRadius:3, marginTop:8, boxShadow:`0 4px 20px ${T.saffron}44` }}>
              SUBMIT ANSWERS
            </button>
          </div>
        )}

        {/* ══ QUIZ RESULT ══ */}
        {view==="quiz-result" && activeLesson && (() => {
          const score=quizScores[activeLesson.id]??0;
          const pass=score>=2;
          return (
            <div className="cb-anim" style={{ maxWidth:740, width:"100%", margin:"0 auto", padding:"40px 40px 100px" }}>
              <div style={{ padding:"36px", background:pass?`linear-gradient(135deg,${T.forestDim},${T.dark})`:`linear-gradient(135deg,#3D1A1A,${T.dark})`, border:`1px solid ${pass?T.forest+"66":T.crimson+"55"}`, borderRadius:4, marginBottom:24, textAlign:"center", boxShadow:pass?`0 8px 48px ${T.forest}44`:`0 8px 48px ${T.crimson}33` }}>
                <div style={{ fontFamily:T.serif, fontSize:64, fontWeight:400, color:T.paper, lineHeight:1, marginBottom:10 }}>
                  {score}<span style={{ fontSize:28, color:T.muted }}>/{activeLesson.quiz.length}</span>
                </div>
                <div style={{ fontFamily:T.mono, fontSize:11, letterSpacing:"0.16em", color:pass?T.saffron:T.crimsonL, marginBottom:12 }}>
                  {pass?"✓ LESSON COMPLETE":"REVIEW & RETRY"}
                </div>
                <div style={{ fontFamily:T.sans, fontSize:15, fontStyle:"italic", color:"#8A9E88", lineHeight:1.6 }}>
                  {pass?"Well done. You've demonstrated solid understanding of this topic.":"Review the lesson material and try again — no pressure, this is self-paced."}
                </div>
              </div>
              {activeLesson.quiz.map((q,qi)=>{
                const chosen=quizAnswers[qi]; const correct=q.correct; const isRight=chosen===correct;
                return (
                  <div key={qi} style={{ background:T.paperDim, border:`1px solid ${T.paperBdr}`, padding:"20px 24px", marginBottom:12, borderRadius:3 }}>
                    <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
                      <span style={{ width:28, height:28, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:isRight?`${T.forest}44`:`${T.crimson}33`, color:isRight?T.saffron:T.crimsonL, fontFamily:T.mono, fontSize:11, borderRadius:2 }}>
                        {isRight?"✓":"✗"}
                      </span>
                      <div style={{ fontFamily:T.serif, fontSize:17, lineHeight:1.5 }}>{q.question}</div>
                    </div>
                    {!isRight && (
                      <div style={{ fontFamily:T.mono, fontSize:11, color:T.saffron, marginBottom:8, letterSpacing:"0.04em" }}>
                        Correct: <strong>{q.options[correct]}</strong>
                      </div>
                    )}
                    <div style={{ fontFamily:T.sans, fontSize:14, color:"#6B5A45", lineHeight:1.78, fontStyle:"italic" }}>{q.explanation}</div>
                  </div>
                );
              })}
              <div style={{ display:"flex", gap:12, marginTop:24, flexWrap:"wrap" }}>
                {!pass&&<button className="cb-btn" onClick={startQuiz} style={{ fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:"transparent", border:`1px solid ${T.paperBdr}`, color:T.dark, padding:"11px 22px", borderRadius:3 }}>RETRY QUIZ</button>}
                <button className="cb-btn" onClick={()=>setView("lesson")} style={{ fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:"transparent", border:`1px solid ${T.paperBdr}`, color:T.dark, padding:"11px 22px", borderRadius:3 }}>
                  {pass?"BACK TO LESSON":"REVIEW LESSON"}
                </button>
                <button className="cb-btn" onClick={()=>setView("module")} style={{ fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:`linear-gradient(135deg,${T.saffronD},${T.saffron})`, color:"#fff", border:"none", padding:"11px 22px", borderRadius:3, boxShadow:`0 4px 16px ${T.saffron}44` }}>
                  ALL LESSONS →
                </button>
              </div>
            </div>
          );
        })()}

        <footer style={{ padding:"18px 40px", borderTop:`1px solid ${T.paperBdr}`, fontFamily:T.mono, fontSize:9, letterSpacing:"0.06em", color:T.muted, display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto" }}>
          <span>CareBridge AI · Insurance Education · Not legal advice</span>
          <span>IRDAI Helpline: 155255 · igms.irda.gov.in · cioins.co.in</span>
        </footer>
      </div>
    </>
  );
}