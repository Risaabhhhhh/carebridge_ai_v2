"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
type Role = "user" | "assistant";
interface Message { role: Role; content: string; }
interface QuizQuestion { question: string; options: string[]; correct: number; explanation: string; }
interface Lesson {
  id: string; title: string; duration: string;
  summary: string;
  content: string[];          // paragraphs
  videoId: string;            // YouTube video ID
  videoTitle: string;
  quiz: QuizQuestion[];
}
interface Module {
  id: string; code: string; title: string; subtitle: string;
  description: string; lessons: Lesson[];
}
type View = "home" | "module" | "lesson" | "quiz" | "quiz-result";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS  (CareBridge palette)
══════════════════════════════════════════════════════════════ */
const T = {
  cream:"#F5F0E8", creamDim:"#EDE8DC", creamBdr:"#D9D3C5",
  dark:"#0F1A0F", darkCard:"#152015", darkBdr:"#243524",
  green:"#2D5A27", greenAcc:"#4A8F42", greenDim:"#1E3D1A",
  amber:"#C8A96E", red:"#7A2020", redLight:"#F8ECEC", redBdr:"#C47070",
  muted:"#8A9E88", ink:"#1A2A1A",
  serif:"'EB Garamond', Georgia, serif",
  mono:"'Space Mono','Courier New',monospace",
} as const;

/* ══════════════════════════════════════════════════════════════
   LANGUAGES
══════════════════════════════════════════════════════════════ */
interface Lang { label: string; code: string; voiceLang: string; }
const LANGS: Lang[] = [
  { label:"English",  code:"en", voiceLang:"en-IN"  },
  { label:"हिन्दी",   code:"hi", voiceLang:"hi-IN"  },
  { label:"मराठी",   code:"mr", voiceLang:"mr-IN"  },
  { label:"தமிழ்",   code:"ta", voiceLang:"ta-IN"  },
];

/* ══════════════════════════════════════════════════════════════
   CURRICULUM DATA
══════════════════════════════════════════════════════════════ */
const MODULES: Module[] = [
  {
    id:"basics", code:"01",
    title:"Health Insurance Basics",
    subtitle:"Start here — understand the fundamentals",
    description:"Everything a first-time buyer needs to know before signing anything. Premium, sum insured, deductibles, and how the money actually flows.",
    lessons:[
      {
        id:"what-is",
        title:"What is Health Insurance?",
        duration:"5 min",
        summary:"Health insurance is a contract between you and an insurer — you pay a regular premium, they pay your hospital bills up to a limit.",
        content:[
          "Health insurance is a financial product that protects you against large, unexpected medical expenses. You pay a fixed amount — called the **premium** — every year. In return, the insurer agrees to pay for hospitalisation costs up to a maximum limit called the **sum insured**.",
          "In India, the health insurance market covers over 520 million people, but most policyholders don't fully understand what they've bought until they need to make a claim. That's where problems begin.",
          "There are two main types: **individual plans** (cover one person) and **family floater plans** (cover the entire family under one shared sum insured). A family floater is usually cheaper but means all members share the same limit.",
          "The insurer is the company that sells you the policy. The **TPA** (Third Party Administrator) is the intermediary that processes your claims. Your hospital may interact with the TPA, not the insurer directly — which is why you should always know your TPA's contact number.",
          "Key insight: insurance is not a savings product. Unused premium is not returned. Its value is in risk protection — covering costs you could not afford out of pocket.",
        ],
        videoId:"K7OQ8dkMDe8",
        videoTitle:"Health Insurance Explained — IRDAI Consumer Guide",
        quiz:[
          { question:"What does 'sum insured' mean in health insurance?", options:["The total premium you pay","The maximum amount the insurer will pay per year","The hospital's bill amount","The TPA's fee"], correct:1, explanation:"Sum insured is the maximum amount your insurer will pay for claims in a policy year. Once exhausted, you pay out of pocket." },
          { question:"What is a TPA in Indian health insurance?", options:["Tax Payment Authority","Third Party Administrator — processes claims","Total Premium Amount","Treatment Protocol Agency"], correct:1, explanation:"A TPA (Third Party Administrator) is a company licensed by IRDAI to handle cashless claims and reimbursements on behalf of insurers." },
          { question:"In a family floater plan, the sum insured is:", options:["Separate for each member","Shared across all family members","Doubled for each member","Fixed at ₹5 lakhs by IRDAI"], correct:1, explanation:"In a family floater, all members share one sum insured. If one member uses ₹3L of a ₹5L cover, only ₹2L remains for others that year." },
        ],
      },
      {
        id:"premium",
        title:"How Premiums Are Calculated",
        duration:"6 min",
        summary:"Your premium depends on age, sum insured, number of members, pre-existing conditions, and the add-ons you choose.",
        content:[
          "The **premium** is the annual amount you pay to keep your policy active. Miss a payment, and your coverage lapses — meaning claims made after the due date won't be paid.",
          "In India, health insurance premiums are primarily driven by: **age** (the biggest factor — a 25-year-old pays roughly 3× less than a 55-year-old for the same cover), **sum insured**, **city/zone** (metro cities cost more), **pre-existing diseases**, and **add-ons** like maternity or critical illness riders.",
          "IRDAI mandates that insurers cannot arbitrarily increase your premium mid-policy. However, they can revise premiums at renewal based on age bands and claims experience. Always read the renewal terms carefully.",
          "A practical example: For a 35-year-old individual in Mumbai, a ₹10 lakh cover from a major insurer might cost ₹8,000–₹14,000 per year. Adding a parent aged 60 to a family floater could push this to ₹35,000+.",
          "**No-claim bonus (NCB):** If you don't make any claims in a year, many insurers give you a 10–50% increase in sum insured at no extra cost. This is called NCB. It's valuable — protect it.",
        ],
        videoId:"jkLkZLRY82c",
        videoTitle:"Health Insurance Premium Calculation — India",
        quiz:[
          { question:"Which factor has the BIGGEST impact on your health insurance premium?", options:["Your city","Your age","Your hospital preference","Your employer"], correct:1, explanation:"Age is the dominant driver of premium in Indian health insurance. Premiums increase sharply after 45 and again after 60." },
          { question:"What is a No-Claim Bonus (NCB)?", options:["A cash refund if you don't claim","An increase in sum insured for claim-free years","A discount on next year's premium","A reward from the hospital"], correct:1, explanation:"NCB increases your sum insured by 10–50% if you don't make a claim, at no extra premium. It's essentially free coverage growth." },
          { question:"IRDAI allows insurers to change your premium:", options:["Any time during the policy year","Only at renewal, based on age band and claims","Never, once the policy is issued","Only if you make a claim"], correct:1, explanation:"Insurers can revise premiums at renewal. They cannot change your premium mid-policy year — that would violate IRDAI regulations." },
        ],
      },
      {
        id:"copay",
        title:"Co-payment, Deductibles & Sub-limits",
        duration:"7 min",
        summary:"These are the hidden clauses that reduce your payout at claim time. Understanding them before buying saves thousands.",
        content:[
          "**Co-payment** means you agree to pay a fixed percentage of every claim yourself. Example: a 20% co-pay on a ₹1,00,000 claim means you pay ₹20,000 and the insurer pays ₹80,000. Co-pay is common in senior citizen plans and in policies covering pre-existing diseases.",
          "**Deductible** is a fixed amount you pay before insurance kicks in. Example: a ₹25,000 deductible means any claim below ₹25,000 is fully yours. Above ₹25,000, the insurer pays the excess. Deductibles lower your premium significantly.",
          "**Room rent sublimit** is one of the most misunderstood clauses. If your policy caps room rent at ₹5,000/day and you stay in a ₹10,000/day room, the insurer doesn't just deduct the difference — they apply **proportionate deduction** across your entire bill. A ₹60,000 surgery bill could become a ₹30,000 payout.",
          "**Disease-specific sublimits** cap payout for certain conditions — cataract surgery might be capped at ₹30,000 regardless of actual cost. Always check the schedule of benefits for sublimits before buying.",
          "**How to protect yourself:** Buy plans with 'no room rent sublimit' or 'any room' cover. If you take a co-pay plan to lower premium, calculate the maximum you'd pay out of pocket in a worst-case scenario. Make sure that number is within your emergency fund capacity.",
        ],
        videoId:"9XfhZFk8Omc",
        videoTitle:"Co-pay, Deductibles and Sub-limits Explained",
        quiz:[
          { question:"You have a 20% co-pay. Your hospital bill is ₹2,00,000. How much do YOU pay?", options:["₹20,000","₹40,000","₹80,000","Nothing"], correct:1, explanation:"20% of ₹2,00,000 = ₹40,000. You pay ₹40,000 and the insurer pays ₹1,60,000." },
          { question:"Proportionate deduction in room rent sublimit means:", options:["Only the room rent excess is deducted","The entire bill is reduced proportionally based on room rent chosen","You pay a fixed penalty","The insurer pays 50% of all costs"], correct:1, explanation:"If you took a room at 2× the sublimit, most insurers apply proportionate deduction — reducing ALL related charges (doctor fees, surgery, ICU) by the same ratio." },
          { question:"A deductible of ₹25,000 means:", options:["You pay 25% of every claim","The first ₹25,000 of any claim is paid by you","The insurer pays ₹25,000 maximum","Your premium is reduced by ₹25,000"], correct:1, explanation:"A deductible is a fixed threshold. You absorb the first ₹25,000 of any claim. Above that amount, the insurer pays the balance." },
        ],
      },
    ],
  },
  {
    id:"claims", code:"02",
    title:"Filing & Winning Claims",
    subtitle:"Know the exact process before you're in a hospital",
    description:"Step-by-step claim filing for cashless and reimbursement. What documents you need. Why claims get rejected. How to fight back.",
    lessons:[
      {
        id:"cashless",
        title:"Cashless vs Reimbursement Claims",
        duration:"6 min",
        summary:"Cashless means the insurer pays the hospital directly. Reimbursement means you pay first and claim back. Both have strict timelines.",
        content:[
          "**Cashless claims** work only at network hospitals — hospitals that have a pre-agreed arrangement with your insurer or TPA. You present your health card, the hospital submits a pre-authorisation request to the TPA, and if approved, the insurer settles the bill directly. You pay only non-covered items.",
          "**Reimbursement claims** allow you to use any hospital. You pay the bill, collect all original documents, and submit a claim within the specified timeline (usually 30–45 days from discharge). The insurer reviews and pays back the eligible amount.",
          "**Critical documents for any claim:** Original discharge summary, all hospital bills and receipts, doctor's prescription, investigation reports, pharmacy bills, pre-authorisation letter (cashless), claim form signed by treating doctor.",
          "**Timelines matter under IRDAI regulations:** For cashless, the insurer must respond to pre-authorisation within 1 hour (emergency) or 4 hours (planned). For reimbursement, claims must be settled within 30 days of receiving all documents. Delays beyond this entitle you to interest at 2% above bank rate.",
          "**Pro tip:** Always file reimbursement even if your cashless was partially denied. You may recover additional amounts. Keep every single receipt — even ₹50 pharmacy slips add up.",
        ],
        videoId:"4mQP3JqCNsw",
        videoTitle:"Cashless vs Reimbursement — Which is Better?",
        quiz:[
          { question:"Cashless claims are only possible at:", options:["Any government hospital","Network hospitals empanelled with your insurer/TPA","Hospitals with NABH accreditation","Private hospitals above 100 beds"], correct:1, explanation:"Cashless facility is available only at hospitals in your insurer's network. Always check the network list before admission — ideally before choosing your plan." },
          { question:"Under IRDAI regulations, reimbursement claims must be settled within:", options:["7 days","15 days","30 days of receiving complete documents","60 days"], correct:2, explanation:"IRDAI mandates settlement within 30 days of receiving all required documents. Delays entitle you to interest at 2% above the prevailing bank rate." },
          { question:"For a planned cashless admission, the TPA must respond to pre-authorisation within:", options:["30 minutes","4 hours","24 hours","3 working days"], correct:1, explanation:"IRDAI mandates a 4-hour response window for planned admissions and 1 hour for emergencies. Demand written reasons if denied." },
        ],
      },
      {
        id:"rejection",
        title:"Why Claims Get Rejected — and How to Fight Back",
        duration:"8 min",
        summary:"Most rejections are challengeable. Knowing the common reasons and your appeal rights changes the outcome.",
        content:[
          "The top 5 rejection reasons in India: **non-disclosure of pre-existing disease** (most common), **waiting period not completed**, **policy lapsed at time of admission**, **treatment classified as excluded**, **inadequate documentation**.",
          "**Non-disclosure:** If you didn't mention a pre-existing condition at the time of purchase, the insurer can reject claims related to that condition during the waiting period. However, after 48 months of continuous coverage (the moratorium period), insurers cannot repudiate claims on grounds of non-disclosure — this is guaranteed by IRDAI's 2016 Health Insurance Regulations.",
          "**What to do when rejected:** Step 1 — Get the rejection in writing with the specific clause cited. Step 2 — Check if the cited clause actually applies to your case. Step 3 — File an internal grievance with the insurer's GRO (Grievance Redressal Officer). They must respond within 15 days.",
          "Step 4 — If unsatisfied, file with IRDAI's IGMS portal (igms.irda.gov.in). The insurer must respond within 15 days. Step 5 — Escalate to the Insurance Ombudsman (free, binding for claims up to ₹50 lakhs). Must be filed within 1 year of the insurer's final reply.",
          "**Success statistics:** IRDAI's annual report shows that over 60% of complaints filed with the Ombudsman result in partial or full settlement for the policyholder. Don't accept a rejection without challenging it.",
        ],
        videoId:"w1LLnJLODgE",
        videoTitle:"How to Fight a Claim Rejection — IRDAI Process",
        quiz:[
          { question:"After how many months of continuous coverage can an insurer NOT reject on non-disclosure grounds?", options:["12 months","24 months","36 months","48 months"], correct:3, explanation:"IRDAI's 48-month moratorium rule: after 4 years of continuous coverage, insurers cannot repudiate claims citing non-disclosure of pre-existing conditions." },
          { question:"The Insurance Ombudsman handles claims up to:", options:["₹5 lakhs","₹10 lakhs","₹25 lakhs","₹50 lakhs"], correct:3, explanation:"The Insurance Ombudsman can adjudicate disputes for claims up to ₹50 lakhs under the Insurance Ombudsman Rules 2017. The service is free." },
          { question:"If your cashless is denied at the hospital, what should you do FIRST?", options:["Pay and go home","Demand the denial in writing with the specific clause cited","Call a lawyer","Switch to a different hospital"], correct:1, explanation:"Always get denials in writing. The written clause citation is your evidence for the appeal. Without it, you cannot challenge the decision formally." },
        ],
      },
    ],
  },
  {
    id:"policy", code:"03",
    title:"Reading Your Policy",
    subtitle:"Decode the fine print before it's too late",
    description:"The clauses that cost people money at claim time. PED rules. Waiting periods. Exclusions. What IRDAI requires insurers to disclose.",
    lessons:[
      {
        id:"ped",
        title:"Pre-Existing Disease (PED) Rules",
        duration:"7 min",
        summary:"PED is the most litigated area in Indian health insurance. Know exactly how IRDAI defines it and your rights after the waiting period.",
        content:[
          "**Pre-Existing Disease (PED)** as defined by IRDAI: any condition, ailment, injury or disease that was diagnosed, or for which symptoms existed, within 48 months prior to the date of the first policy issued by the insurer.",
          "This definition matters enormously. If your diabetes was diagnosed 5 years ago and you just bought a policy, it is technically PED. If it was diagnosed 3 years ago, it still falls within the 48-month window.",
          "**Standard PED waiting periods in India:** Most policies impose a 2–4 year waiting period for PED. During this period, claims arising from or linked to the PED condition will be rejected. After the waiting period, PED is covered fully.",
          "**The 48-month moratorium:** After 4 years of continuous coverage (even if you switched insurers using portability), no insurer can reject a claim on the grounds of non-disclosure or misrepresentation of a pre-existing condition. This is a hard regulatory protection under IRDAI Health Insurance Regulations 2016.",
          "**Portability and PED:** If you port your policy to a new insurer, your waiting period credit transfers. A policyholder who has served 3 years of a 4-year PED waiting period with Insurer A only needs 1 more year with Insurer B after porting.",
        ],
        videoId:"YOlVwkdqKUM",
        videoTitle:"Pre-Existing Disease Rules — IRDAI Explained",
        quiz:[
          { question:"IRDAI's definition of Pre-Existing Disease covers conditions diagnosed within how many months before buying the policy?", options:["12 months","24 months","36 months","48 months"], correct:3, explanation:"IRDAI defines PED as any condition diagnosed or with symptoms within 48 months (4 years) prior to the date of first policy issuance." },
          { question:"When you port your policy to a new insurer, your PED waiting period credit:", options:["Resets to zero","Is partially transferred (50%)","Is fully transferred to the new insurer","Depends on the new insurer's terms"], correct:2, explanation:"Under IRDAI portability guidelines, your served waiting period credit transfers fully. You don't restart the clock when switching insurers." },
          { question:"After the 48-month moratorium, an insurer can still reject a claim if:", options:["The condition was a PED","You didn't disclose it when buying","The claim is fraudulent","The hospital is not in-network"], correct:2, explanation:"The moratorium protects against non-disclosure rejections only. Fraud — deliberate misrepresentation — can still be cited as grounds for rejection at any time." },
        ],
      },
      {
        id:"exclusions",
        title:"Exclusions, Waiting Periods & What IRDAI Mandates",
        duration:"6 min",
        summary:"Not everything is covered. But IRDAI regulates which exclusions are permissible — and some insurers still try to enforce illegal ones.",
        content:[
          "**Types of waiting periods:** Initial waiting period (30 days for any claim except accidents), PED waiting period (2–4 years), specific illness waiting period (1–2 years for certain surgeries like hernia, cataract, joint replacement), maternity waiting period (2–4 years).",
          "**Standard exclusions permitted by IRDAI:** Cosmetic or aesthetic treatment, self-inflicted injuries, substance abuse, war or nuclear events, experimental treatments. These are universally standard.",
          "**What IRDAI's Standardisation Circular prohibits:** Insurers cannot permanently exclude specific diseases or conditions that are not on the IRDAI-approved exclusion list. They cannot add arbitrary exclusions in fine print. The Key Features Document must disclose all major exclusions at point of sale.",
          "**AYUSH coverage:** Since 2013, IRDAI mandates that all health insurance policies must cover AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy) treatments to the same extent as allopathic treatment. Many insurers still try to limit or exclude AYUSH — this is challengeable.",
          "**Mental health parity:** The Mental Healthcare Act 2017 mandates that mental illness must be covered on par with physical illness. If your insurer rejects a mental health claim citing exclusion, cite Section 21(4) of the Mental Healthcare Act 2017 in your appeal.",
        ],
        videoId:"Sg3I5LSMV6A",
        videoTitle:"Health Insurance Exclusions — What's Not Covered",
        quiz:[
          { question:"The initial waiting period in most Indian health insurance policies is:", options:["7 days","15 days","30 days","90 days"], correct:2, explanation:"The standard initial waiting period is 30 days from policy start date. During this time, no claims (except accidental hospitalisation) are payable." },
          { question:"IRDAI mandates that AYUSH treatment must be covered:", options:["At 50% of allopathic coverage","Only for inpatient treatment","To the same extent as allopathic treatment","Only if the doctor is AYUSH-registered"], correct:2, explanation:"IRDAI has mandated since 2013 that AYUSH treatments must be covered equivalently to allopathic ones. Separate AYUSH sublimits that are lower than the sum insured are non-compliant." },
          { question:"Mental health claim rejections can be challenged under:", options:["Consumer Protection Act 1986","Mental Healthcare Act 2017 Section 21(4)","Indian Penal Code","IRDAI Act 1999"], correct:1, explanation:"Section 21(4) of the Mental Healthcare Act 2017 mandates insurance parity for mental illness. This is a legislative mandate, not just a guideline." },
        ],
      },
    ],
  },
  {
    id:"irdai", code:"04",
    title:"IRDAI & Your Rights",
    subtitle:"The regulatory system that protects you",
    description:"Who IRDAI is, what powers it has, how to use IGMS, and when to escalate to the Ombudsman. Your complete rights as an Indian policyholder.",
    lessons:[
      {
        id:"what-irdai",
        title:"What is IRDAI and What Can It Do For You?",
        duration:"5 min",
        summary:"IRDAI is the Insurance Regulatory and Development Authority of India — the statutory body with power to penalise insurers and protect policyholders.",
        content:[
          "**IRDAI** (Insurance Regulatory and Development Authority of India) is the statutory regulator established under the IRDAI Act 1999. It licenses insurers, sets product regulations, mandates disclosures, and has the power to impose fines and revoke licences.",
          "IRDAI's primary mandate relevant to policyholders: ensuring insurers pay valid claims on time, mandating standardised exclusions, protecting policyholders from unfair practices, and maintaining the grievance redressal system.",
          "**Key regulations you should know:** The Health Insurance Regulations 2016 govern product structure. The Protection of Policyholders' Interests Regulations 2017 govern claim timelines and grievance rights. The Insurance Ombudsman Rules 2017 govern dispute resolution.",
          "IRDAI publishes annual claim settlement ratio data for all insurers. This is publicly available and crucial for choosing your insurer. An insurer with a claim settlement ratio below 85% is a yellow flag; below 75% is a red flag.",
          "**What IRDAI cannot do:** It cannot order an insurer to pay your specific claim. That is the Ombudsman's job. IRDAI's role is systemic regulation, not individual dispute resolution — though IGMS escalations do get insurer attention quickly.",
        ],
        videoId:"MJRTjYuR9F4",
        videoTitle:"IRDAI Explained — India's Insurance Regulator",
        quiz:[
          { question:"IRDAI was established under which Act?", options:["Insurance Act 1938","IRDAI Act 1999","Consumer Protection Act 1986","Companies Act 2013"], correct:1, explanation:"IRDAI was established as a statutory body under the Insurance Regulatory and Development Authority Act, 1999." },
          { question:"IRDAI publishes annual claim settlement ratio data. A ratio below which percentage is a serious red flag?", options:["95%","90%","85%","75%"], correct:3, explanation:"Industry consensus treats below 75% as a red flag. Anything below 85% warrants careful scrutiny of the insurer's rejection patterns." },
          { question:"For your individual claim dispute, the correct escalation body (not IRDAI) is:", options:["Supreme Court of India","Insurance Ombudsman","National Consumer Forum","SEBI"], correct:1, explanation:"The Insurance Ombudsman is the designated quasi-judicial body for individual claim disputes. It's free, fast (90-day resolution target), and binding up to ₹50L." },
        ],
      },
      {
        id:"igms",
        title:"Using IGMS & the Ombudsman System",
        duration:"7 min",
        summary:"IGMS is the online portal to file complaints against insurers. The Ombudsman is the final escalation — free, fast, and binding.",
        content:[
          "**IGMS (Integrated Grievance Management System):** The official IRDAI portal at igms.irda.gov.in. File here if your insurer hasn't resolved your complaint within 15 days, or if you're unsatisfied with the resolution. Creates a formal paper trail visible to IRDAI.",
          "**How to file on IGMS:** Register at igms.irda.gov.in → 'Register Complaint' → Select your insurer → Fill complaint details → Upload supporting documents → Submit. You'll receive a unique complaint number. The insurer must respond within 15 days.",
          "**IRDAI Consumer Helpline:** 155255 or 1800 4254 732 (toll-free). Available for guidance on filing complaints and understanding your rights. The helpline can also escalate on your behalf.",
          "**Insurance Ombudsman:** 17 offices across India, jurisdiction based on your residential address. Handles complaints where the claim amount is below ₹50 lakhs. The service is completely free. Average resolution: 3 months. Award is binding on the insurer.",
          "**Ombudsman eligibility:** You must first complain to the insurer and either receive an unsatisfactory response or receive no response within 30 days. The complaint must be filed within 1 year of the insurer's final reply. Find your nearest Ombudsman at cioins.co.in.",
        ],
        videoId:"N9e-nP23dIQ",
        videoTitle:"IGMS & Ombudsman — How to File a Complaint",
        quiz:[
          { question:"How long does an insurer have to respond to an IGMS complaint?", options:["7 days","15 days","30 days","45 days"], correct:1, explanation:"Under IRDAI's Policyholders' Interests Regulations 2017, insurers must acknowledge and resolve IGMS complaints within 15 days." },
          { question:"The Insurance Ombudsman award is:", options:["Advisory only","Binding on the insurer, not the policyholder","Binding on both parties","Subject to court confirmation"], correct:1, explanation:"The Ombudsman's award is binding on the insurer. The policyholder can choose to accept or reject it (and proceed to court if not satisfied)." },
          { question:"You can approach the Ombudsman if your insurer hasn't resolved your complaint within:", options:["7 days","15 days","30 days","60 days"], correct:2, explanation:"If your insurer doesn't resolve your complaint within 30 days, or gives an unsatisfactory response, you're eligible to approach the Ombudsman." },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════
   CHATBOT SYSTEM PROMPT
══════════════════════════════════════════════════════════════ */
function buildSystemPrompt(lessonTitle: string, lessonContent: string[]): string {
  return `You are InsureIQ, a friendly insurance education assistant on CareBridge AI — a platform helping Indian policyholders understand health insurance.

You are currently helping a learner who is studying the lesson: "${lessonTitle}"

Key content from this lesson:
${lessonContent.map((p, i) => `${i + 1}. ${p.replace(/\*\*/g, "")}`).join("\n")}

Rules:
- Answer ONLY questions related to this lesson topic and general Indian health insurance
- Be concise (under 200 words) and warm
- Use ₹ examples when helpful
- Reference IRDAI regulations when relevant
- If asked something outside this topic, politely redirect to the lesson material
- Never give legal advice — route to IRDAI IGMS or Ombudsman for disputes
- Do not use markdown headers`;
}

/* ══════════════════════════════════════════════════════════════
   HELPER: MARKDOWN RENDER
══════════════════════════════════════════════════════════════ */
function Md({ text }: { text: string }): JSX.Element {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: "5px 0", lineHeight: 1.8 }}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j}>{p.slice(2, -2)}</strong>
                : <span key={j}>{p}</span>
            )}
          </p>
        );
      })}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function LearnPage(): JSX.Element {
  // Navigation state
  const [view, setView]             = useState<View>("home");
  const [activeModule, setActiveMod] = useState<Module | null>(null);
  const [activeLesson, setActiveLes] = useState<Lesson | null>(null);

  // Progress (persisted)
  const [completed, setCompleted]   = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSub]   = useState<boolean>(false);

  // Chat state
  const [messages, setMessages]     = useState<Message[]>([]);
  const [chatInput, setChatInput]   = useState<string>("");
  const [chatLoading, setChatLoad]  = useState<boolean>(false);
  const [chatOpen, setChatOpen]     = useState<boolean>(false);

  // Voice
  const [lang, setLang]             = useState<Lang>(LANGS[0]);
  const [listening, setListening]   = useState<boolean>(false);
  const [speaking, setSpeaking]     = useState<boolean>(false);
  const [voiceOn, setVoiceOn]       = useState<boolean>(false);
  const [transcript, setTx]         = useState<string>("");

  const endRef   = useRef<HTMLDivElement>(null);
  const recogRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const c = localStorage.getItem("cb_completed");
      const q = localStorage.getItem("cb_quiz_scores");
      if (c) setCompleted(new Set(JSON.parse(c) as string[]));
      if (q) setQuizScores(JSON.parse(q) as Record<string, number>);
    } catch { /* ignore */ }
  }, []);

  // Inject fonts
  useEffect(() => {
    if (document.getElementById("cb-learn-fonts")) return;
    const l = document.createElement("link");
    l.id = "cb-learn-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(l);
  }, []);

  // Scroll chat
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);

  // Speech recognition — rebuild when lang changes
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = true;
    r.lang = lang.voiceLang;
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

  // Speak
  const speak = useCallback((text: string): void => {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      text.replace(/\*\*/g, "").replace(/\n+/g, ". ")
    );
    u.lang = lang.voiceLang; u.rate = 0.9; u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.startsWith(lang.code));
    if (pref) u.voice = pref;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [voiceOn, lang]);

  const stopSpeak = (): void => { window.speechSynthesis?.cancel(); setSpeaking(false); };
  const toggleListen = (): void => {
    if (!recogRef.current) return;
    if (listening) { recogRef.current.stop(); setListening(false); }
    else { setTx(""); recogRef.current.start(); setListening(true); }
  };

  // Navigation helpers
  const goHome = (): void => { setView("home"); setActiveMod(null); setActiveLes(null); resetQuiz(); setMessages([]); setChatOpen(false); };
  const openModule = (mod: Module): void => { setActiveMod(mod); setView("module"); };
  const openLesson = (les: Lesson): void => {
    setActiveLes(les); setView("lesson"); resetQuiz(); setMessages([]);
    setChatOpen(false);
    // Welcome chat message scoped to lesson
    setMessages([{
      role: "assistant",
      content: `Hi! I'm your InsureIQ assistant for this lesson on **${les.title}**. Ask me anything about what you just read or watched — in ${lang.label}.`,
    }]);
  };
  const startQuiz = (): void => {
    if (!activeLesson) return;
    setQuizAnswers(new Array(activeLesson.quiz.length).fill(null) as null[]);
    setQuizSub(false);
    setView("quiz");
  };
  const resetQuiz = (): void => { setQuizAnswers([]); setQuizSub(false); };

  // Mark lesson complete
  const markComplete = (lessonId: string): void => {
    const next = new Set(completed);
    next.add(lessonId);
    setCompleted(next);
    localStorage.setItem("cb_completed", JSON.stringify([...next]));
  };

  // Submit quiz
  const submitQuiz = (): void => {
    if (!activeLesson) return;
    if (quizAnswers.some(a => a === null)) return;
    setQuizSub(true);
    const score = quizAnswers.reduce<number>((acc, ans, i) =>
      ans === activeLesson.quiz[i].correct ? acc + 1 : acc, 0
    );
    const key = activeLesson.id;
    const updated = { ...quizScores, [key]: score };
    setQuizScores(updated);
    localStorage.setItem("cb_quiz_scores", JSON.stringify(updated));
    if (score >= 2) markComplete(activeLesson.id);
    setView("quiz-result");
  };

  // Chat send
  const sendChat = useCallback(async (q: string): Promise<void> => {
    if (!q.trim() || chatLoading || !activeLesson) return;
    const userMsg: Message = { role: "user", content: q };
    const history: Message[] = [...messages, userMsg];
    setMessages(history);
    setChatInput(""); setTx(""); setChatLoad(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 600,
          system: buildSystemPrompt(activeLesson.title, activeLesson.content),
          messages: history,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const reply: string = data.content?.[0]?.text ?? "Sorry, I couldn't respond.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue — please try again." }]);
    } finally {
      setChatLoad(false);
    }
  }, [chatLoading, messages, activeLesson, speak]);

  // Progress calculations
  const totalLessons    = MODULES.reduce((a, m) => a + m.lessons.length, 0);
  const completedCount  = MODULES.reduce((a, m) =>
    a + m.lessons.filter(l => completed.has(l.id)).length, 0);
  const overallProgress = Math.round((completedCount / totalLessons) * 100);

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @keyframes cb-blink{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        @keyframes cb-pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,143,66,.4)}50%{box-shadow:0 0 0 8px rgba(74,143,66,0)}}
        @keyframes cb-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .cb-root *{box-sizing:border-box;}
        .cb-root button:hover{filter:brightness(1.07);}
        .cb-nav-link:hover{color:${T.cream}!important;}
        .cb-mod-card:hover{background:${T.creamDim}!important;cursor:pointer;}
        .cb-les-row:hover{background:${T.creamDim}!important;}
        .cb-chip:hover{background:${T.creamDim}!important;border-color:${T.green}!important;color:${T.dark}!important;}
        .cb-option:hover{border-color:${T.green}!important;}
        .cb-chat-input:focus{outline:none;border-color:${T.green}!important;}
        textarea:focus,input:focus{outline:none;}
        .cb-anim{animation:cb-fadein .3s ease both;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:${T.creamDim};}
        ::-webkit-scrollbar-thumb{background:${T.creamBdr};border-radius:2px;}
      `}</style>

      <div className="cb-root" style={S.root}>

        {/* ── NAV ── */}
        <nav style={S.nav}>
          <button style={S.brand} onClick={goHome}>CareBridge</button>
          <div style={S.navLinks}>
            {(["ANALYZE POLICY","CLAIM AUDIT","COMPARE","GET HELP"] as const).map(l => (
              <span key={l} className="cb-nav-link" style={S.navLink}>{l}</span>
            ))}
            <span style={{ ...S.navLink, color: T.cream, borderBottom: `1px solid ${T.greenAcc}`, paddingBottom: 2 }}>LEARN</span>
          </div>
          {/* Language + voice controls */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <select
              value={lang.code}
              onChange={e => setLang(LANGS.find(l => l.code === e.target.value) ?? LANGS[0])}
              style={S.langSelect}
            >
              {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button
              style={{ ...S.voiceToggle, ...(voiceOn ? S.voiceToggleOn : {}) }}
              onClick={() => { setVoiceOn(v => !v); if (speaking) stopSpeak(); }}
              title="Toggle voice readback"
            >
              {voiceOn ? "🔊" : "🔇"}
            </button>
          </div>
        </nav>

        {/* ══════════════════════ HOME VIEW ══════════════════════ */}
        {view === "home" && (
          <div className="cb-anim" style={S.page}>

            {/* Hero */}
            <header style={S.hero}>
              <div>
                <div style={S.eyebrow}>— INSURANCE EDUCATION</div>
                <h1 style={S.heroTitle}>
                  Learn insurance.<br />
                  <em style={{ color: T.green }}>At your own pace.</em>
                </h1>
                <p style={S.heroSub}>
                  4 modules · {totalLessons} lessons · quizzes · curated videos<br />
                  No prior knowledge needed. Start anywhere.
                </p>
              </div>
              {/* Progress card */}
              <div style={S.progressCard}>
                <div style={S.progressCardLabel}>YOUR PROGRESS</div>
                <div style={S.progressBig}>{overallProgress}%</div>
                <div style={S.progressTrack}>
                  <div style={{ ...S.progressFill, width: `${overallProgress}%` }} />
                </div>
                <div style={S.progressSub}>{completedCount} of {totalLessons} lessons complete</div>
                <div style={S.progressModList}>
                  {MODULES.map(m => {
                    const c = m.lessons.filter(l => completed.has(l.id)).length;
                    return (
                      <div key={m.id} style={S.progressModRow}>
                        <span style={S.progressModName}>{m.title}</span>
                        <span style={S.progressModCount}>{c}/{m.lessons.length}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </header>

            {/* Modules grid */}
            <div style={S.modGrid}>
              {MODULES.map((mod) => {
                const c = mod.lessons.filter(l => completed.has(l.id)).length;
                const pct = Math.round((c / mod.lessons.length) * 100);
                return (
                  <div
                    key={mod.id}
                    className="cb-mod-card"
                    style={S.modCard}
                    onClick={() => openModule(mod)}
                  >
                    <div style={S.modCode}>{mod.code}</div>
                    <div style={S.modTitle}>{mod.title}</div>
                    <div style={S.modSub}>{mod.subtitle}</div>
                    <p style={S.modDesc}>{mod.description}</p>
                    <div style={S.modFooter}>
                      <div style={S.modBarWrap}>
                        <div style={S.modBar}>
                          <div style={{ ...S.modBarFill, width: `${pct}%` }} />
                        </div>
                        <span style={S.modBarLabel}>{c}/{mod.lessons.length} lessons</span>
                      </div>
                      <span style={S.modArrow}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════ MODULE VIEW ══════════════════════ */}
        {view === "module" && activeModule && (
          <div className="cb-anim" style={S.page}>
            <div style={S.breadcrumb}>
              <button style={S.breadBtn} onClick={goHome}>Learn</button>
              <span style={S.breadSep}>/</span>
              <span style={S.breadCurrent}>{activeModule.title}</span>
            </div>

            <header style={S.modPageHead}>
              <div>
                <div style={S.eyebrow}>{activeModule.code} — MODULE</div>
                <h1 style={S.modPageTitle}>{activeModule.title}</h1>
                <p style={S.modPageSub}>{activeModule.description}</p>
              </div>
            </header>

            <div style={S.lessonsList}>
              {activeModule.lessons.map((les, idx) => {
                const isDone  = completed.has(les.id);
                const score   = quizScores[les.id];
                return (
                  <div
                    key={les.id}
                    className="cb-les-row"
                    style={S.lesRow}
                    onClick={() => openLesson(les)}
                  >
                    <div style={{ ...S.lesNum, ...(isDone ? S.lesNumDone : {}) }}>
                      {isDone ? "✓" : String(idx + 1).padStart(2, "0")}
                    </div>
                    <div style={S.lesInfo}>
                      <div style={S.lesTitle}>{les.title}</div>
                      <div style={S.lesSummary}>{les.summary}</div>
                      <div style={S.lesMeta}>
                        <span style={S.lesMetaItem}>📖 {les.duration}</span>
                        <span style={S.lesMetaItem}>🎬 Video</span>
                        <span style={S.lesMetaItem}>✏️ Quiz ({les.quiz.length} questions)</span>
                        {score !== undefined && (
                          <span style={{ ...S.lesMetaItem, color: score >= 2 ? T.greenAcc : T.amber }}>
                            Last score: {score}/{les.quiz.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={S.lesAction}>
                      <span style={{ ...S.lesTag, ...(isDone ? S.lesTagDone : {}) }}>
                        {isDone ? "DONE" : "START"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════ LESSON VIEW ══════════════════════ */}
        {view === "lesson" && activeLesson && activeModule && (
          <div className="cb-anim" style={S.page}>
            <div style={S.breadcrumb}>
              <button style={S.breadBtn} onClick={goHome}>Learn</button>
              <span style={S.breadSep}>/</span>
              <button style={S.breadBtn} onClick={() => setView("module")}>{activeModule.title}</button>
              <span style={S.breadSep}>/</span>
              <span style={S.breadCurrent}>{activeLesson.title}</span>
            </div>

            <div style={S.lessonLayout}>
              {/* Main content */}
              <div style={S.lessonMain}>
                <div style={S.lessonHead}>
                  <div style={S.eyebrow}>{activeModule.code} — {activeModule.title}</div>
                  <h1 style={S.lessonTitle}>{activeLesson.title}</h1>
                  <div style={S.lessonMeta}>
                    <span style={S.lesMetaItem}>📖 {activeLesson.duration} read</span>
                    {completed.has(activeLesson.id) && (
                      <span style={{ ...S.lesMetaItem, color: T.greenAcc, border: `1px solid ${T.greenAcc}`, padding: "2px 10px" }}>
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                {/* Reading content */}
                <div style={S.readingCard}>
                  <div style={S.readingLabel}>READING</div>
                  {activeLesson.content.map((para, i) => (
                    <div key={i} style={S.para}>
                      <Md text={para} />
                    </div>
                  ))}
                </div>

                {/* Video */}
                <div style={S.videoCard}>
                  <div style={S.readingLabel}>VIDEO — {activeLesson.videoTitle}</div>
                  <div style={S.videoWrap}>
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${activeLesson.videoId}`}
                      title={activeLesson.videoTitle}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ borderRadius: 2 }}
                    />
                  </div>
                </div>

                {/* Quiz CTA */}
                <div style={S.quizCta}>
                  <div>
                    <div style={S.quizCtaTitle}>Test your understanding</div>
                    <div style={S.quizCtaSub}>{activeLesson.quiz.length} questions · Complete to mark lesson done</div>
                  </div>
                  <button style={S.quizCtaBtn} onClick={startQuiz}>
                    TAKE QUIZ →
                  </button>
                </div>
              </div>

              {/* Chat sidebar */}
              <div style={S.chatSidebar}>
                <div style={S.chatHeader}>
                  <div>
                    <div style={S.chatHeaderLabel}>LESSON ASSISTANT</div>
                    <div style={S.chatHeaderTitle}>InsureIQ</div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <button
                      style={{ ...S.chatVoiceBtn, ...(listening ? S.chatVoiceBtnOn : {}) }}
                      onClick={toggleListen}
                      title={listening ? "Stop" : "Speak in " + lang.label}
                    >
                      {listening ? "◼" : "◎"}
                    </button>
                    {speaking && (
                      <button style={S.chatStopBtn} onClick={stopSpeak}>⏸</button>
                    )}
                  </div>
                </div>

                <div style={S.chatMsgs}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ ...S.chatBubble, ...(m.role === "user" ? S.chatBubUser : S.chatBubBot) }}>
                      {m.role === "assistant" && <div style={S.chatAvatar}>IQ</div>}
                      <div style={{ ...S.chatBubBody, ...(m.role === "user" ? S.chatBubBodyUser : {}) }}>
                        <Md text={m.content} />
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ ...S.chatBubble, ...S.chatBubBot }}>
                      <div style={S.chatAvatar}>IQ</div>
                      <div style={{ ...S.chatBubBody, display:"flex", gap:5, alignItems:"center", padding:"12px 14px" }}>
                        {[0, 0.18, 0.36].map((d, i) => (
                          <span key={i} style={{ ...S.dot, animationDelay:`${d}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {listening && transcript && (
                  <div style={S.txPreview}>{transcript}</div>
                )}

                <div style={S.chatInputRow}>
                  <input
                    className="cb-chat-input"
                    style={S.chatInput}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && void sendChat(chatInput)}
                    placeholder={`Ask in ${lang.label}…`}
                  />
                  <button
                    style={{ ...S.chatSendBtn, opacity: chatLoading || !chatInput.trim() ? 0.35 : 1 }}
                    disabled={chatLoading || !chatInput.trim()}
                    onClick={() => void sendChat(chatInput)}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════ QUIZ VIEW ══════════════════════ */}
        {view === "quiz" && activeLesson && (
          <div className="cb-anim" style={S.page}>
            <div style={S.breadcrumb}>
              <button style={S.breadBtn} onClick={() => setView("lesson")}>← Back to lesson</button>
            </div>

            <div style={S.quizWrap}>
              <div style={S.quizHead}>
                <div style={S.eyebrow}>QUIZ — {activeLesson.title}</div>
                <h2 style={S.quizTitle}>Test your understanding</h2>
                <p style={S.quizSub}>Answer all {activeLesson.quiz.length} questions. Score 2 or more to complete the lesson.</p>
              </div>

              {activeLesson.quiz.map((q, qi) => (
                <div key={qi} style={S.quizQ}>
                  <div style={S.quizQNum}>Q{qi + 1}</div>
                  <div style={S.quizQText}>{q.question}</div>
                  <div style={S.quizOptions}>
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        className="cb-option"
                        style={{
                          ...S.quizOption,
                          ...(quizAnswers[qi] === oi ? S.quizOptionSel : {}),
                        }}
                        onClick={() => {
                          const next = [...quizAnswers];
                          next[qi] = oi;
                          setQuizAnswers(next);
                        }}
                      >
                        <span style={{ ...S.quizOptLetter, ...(quizAnswers[qi] === oi ? S.quizOptLetterSel : {}) }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                style={{ ...S.quizSubmit, opacity: quizAnswers.some(a => a === null) ? 0.4 : 1 }}
                disabled={quizAnswers.some(a => a === null)}
                onClick={submitQuiz}
              >
                SUBMIT ANSWERS
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════ QUIZ RESULT ══════════════════════ */}
        {view === "quiz-result" && activeLesson && (
          <div className="cb-anim" style={S.page}>
            <div style={S.quizWrap}>
              {(() => {
                const score = quizScores[activeLesson.id] ?? 0;
                const pass  = score >= 2;
                return (
                  <>
                    <div style={{ ...S.resultHeader, background: pass ? T.greenDim : "#3D1A1A" }}>
                      <div style={S.resultScore}>{score} / {activeLesson.quiz.length}</div>
                      <div style={S.resultStatus}>{pass ? "LESSON COMPLETE" : "KEEP STUDYING"}</div>
                      <div style={S.resultMsg}>
                        {pass
                          ? "Well done. You've demonstrated a solid understanding of this topic."
                          : "Review the lesson material and try again. No pressure — this is self-paced learning."}
                      </div>
                    </div>

                    {activeLesson.quiz.map((q, qi) => {
                      const chosen  = quizAnswers[qi];
                      const correct = q.correct;
                      const isRight = chosen === correct;
                      return (
                        <div key={qi} style={S.resultQ}>
                          <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                            <span style={{ ...S.resultQIcon, background: isRight ? T.greenDim : "#3D1A1A" }}>
                              {isRight ? "✓" : "✗"}
                            </span>
                            <div style={S.quizQText}>{q.question}</div>
                          </div>
                          {!isRight && (
                            <div style={S.resultCorrect}>
                              Correct answer: <strong>{q.options[correct]}</strong>
                            </div>
                          )}
                          <div style={S.resultExplain}>{q.explanation}</div>
                        </div>
                      );
                    })}

                    <div style={S.resultActions}>
                      {!pass && (
                        <button style={S.resultRetry} onClick={startQuiz}>RETRY QUIZ</button>
                      )}
                      <button style={S.resultLesson} onClick={() => setView("lesson")}>
                        {pass ? "BACK TO LESSON" : "REVIEW LESSON"}
                      </button>
                      <button style={S.resultModule} onClick={() => setView("module")}>
                        VIEW ALL LESSONS →
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <footer style={S.footer}>
          CareBridge AI · Insurance Education · Self-paced · Not legal advice
        </footer>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════ */
type Sty = React.CSSProperties;
type StyleMap = Record<string, Sty>;

const S: StyleMap = {
  root:     { fontFamily:T.serif, background:T.cream, minHeight:"100vh", color:T.dark, display:"flex", flexDirection:"column" },

  /* nav */
  nav:          { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", height:56, background:T.dark, borderBottom:`1px solid ${T.darkBdr}`, flexShrink:0 },
  brand:        { fontFamily:T.serif, fontSize:20, fontWeight:500, color:T.cream, background:"none", border:"none", cursor:"pointer", letterSpacing:"-0.3px" },
  navLinks:     { display:"flex", gap:28 },
  navLink:      { fontFamily:T.mono, fontSize:10, letterSpacing:"0.08em", color:T.muted, cursor:"pointer" },
  langSelect:   { fontFamily:T.mono, fontSize:10, letterSpacing:"0.06em", background:T.darkCard, border:`1px solid ${T.darkBdr}`, color:T.cream, padding:"5px 10px", cursor:"pointer" },
  voiceToggle:  { background:T.darkCard, border:`1px solid ${T.darkBdr}`, borderRadius:4, padding:"5px 8px", cursor:"pointer", fontSize:14, color:T.muted },
  voiceToggleOn:{ borderColor:T.greenAcc, color:T.greenAcc },

  /* page shell */
  page:   { maxWidth:1100, width:"100%", margin:"0 auto", padding:"40px 40px 80px", flex:1 },
  eyebrow:{ fontFamily:T.mono, fontSize:10, letterSpacing:"0.14em", color:T.green, marginBottom:12 },

  /* breadcrumb */
  breadcrumb:  { display:"flex", alignItems:"center", gap:8, marginBottom:32, fontFamily:T.mono, fontSize:10, letterSpacing:"0.08em" },
  breadBtn:    { background:"none", border:"none", cursor:"pointer", color:T.muted, fontFamily:T.mono, fontSize:10, letterSpacing:"0.08em", padding:0 },
  breadSep:    { color:T.muted },
  breadCurrent:{ color:T.dark },

  /* home hero */
  hero:        { display:"grid", gridTemplateColumns:"1fr 280px", gap:40, paddingBottom:40, marginBottom:40, borderBottom:`1px solid ${T.creamBdr}` },
  heroTitle:   { fontFamily:T.serif, fontSize:48, fontWeight:400, lineHeight:1.1, margin:"0 0 16px" },
  heroSub:     { fontFamily:T.serif, fontSize:16, color:"#5A6A58", lineHeight:1.7, margin:0 },

  progressCard:      { background:T.dark, padding:"24px", border:`1px solid ${T.darkBdr}` },
  progressCardLabel: { fontFamily:T.mono, fontSize:9, letterSpacing:"0.14em", color:T.muted, marginBottom:10 },
  progressBig:       { fontFamily:T.serif, fontSize:52, fontWeight:400, color:T.cream, lineHeight:1, marginBottom:10 },
  progressTrack:     { height:2, background:T.darkBdr, marginBottom:8 },
  progressFill:      { height:"100%", background:T.greenAcc, transition:"width .5s ease" },
  progressSub:       { fontFamily:T.mono, fontSize:10, color:T.muted, marginBottom:16 },
  progressModList:   { display:"flex", flexDirection:"column", gap:6, borderTop:`1px solid ${T.darkBdr}`, paddingTop:14 },
  progressModRow:    { display:"flex", justifyContent:"space-between" },
  progressModName:   { fontFamily:T.serif, fontSize:13, color:T.cream },
  progressModCount:  { fontFamily:T.mono, fontSize:10, color:T.green },

  /* module cards grid */
  modGrid:    { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:1, border:`1px solid ${T.creamBdr}`, background:T.creamBdr },
  modCard:    { background:T.cream, padding:"28px", display:"flex", flexDirection:"column", gap:10, transition:"background .15s" },
  modCode:    { fontFamily:T.mono, fontSize:10, letterSpacing:"0.16em", color:T.muted },
  modTitle:   { fontFamily:T.serif, fontSize:24, fontWeight:400, lineHeight:1.15 },
  modSub:     { fontFamily:T.serif, fontSize:14, fontStyle:"italic", color:"#6A7A68" },
  modDesc:    { fontFamily:T.serif, fontSize:14, color:"#5A6A58", lineHeight:1.7, flex:1, margin:0 },
  modFooter:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 },
  modBarWrap: { display:"flex", alignItems:"center", gap:10, flex:1 },
  modBar:     { flex:1, height:2, background:T.creamBdr },
  modBarFill: { height:"100%", background:T.green, transition:"width .5s ease" },
  modBarLabel:{ fontFamily:T.mono, fontSize:9, color:T.muted },
  modArrow:   { fontFamily:T.mono, fontSize:16, color:T.green },

  /* module page */
  modPageHead:  { paddingBottom:32, marginBottom:8, borderBottom:`1px solid ${T.creamBdr}` },
  modPageTitle: { fontFamily:T.serif, fontSize:38, fontWeight:400, margin:"0 0 12px" },
  modPageSub:   { fontFamily:T.serif, fontSize:15, color:"#5A6A58", lineHeight:1.7, margin:0 },

  /* lessons list */
  lessonsList: { display:"flex", flexDirection:"column", gap:1, border:`1px solid ${T.creamBdr}`, background:T.creamBdr },
  lesRow:      { display:"flex", gap:20, alignItems:"flex-start", padding:"24px 24px", background:T.cream, cursor:"pointer", transition:"background .12s" },
  lesNum:      { fontFamily:T.mono, fontSize:13, color:T.muted, width:28, flexShrink:0, paddingTop:2 },
  lesNumDone:  { color:T.green },
  lesInfo:     { flex:1 },
  lesTitle:    { fontFamily:T.serif, fontSize:20, fontWeight:400, marginBottom:4 },
  lesSummary:  { fontFamily:T.serif, fontSize:14, color:"#5A6A58", lineHeight:1.65, fontStyle:"italic", marginBottom:10 },
  lesMeta:     { display:"flex", gap:16, flexWrap:"wrap" },
  lesMetaItem: { fontFamily:T.mono, fontSize:9, letterSpacing:"0.06em", color:T.muted },
  lesAction:   { flexShrink:0 },
  lesTag:      { fontFamily:T.mono, fontSize:9, letterSpacing:"0.12em", border:`1px solid ${T.creamBdr}`, padding:"4px 10px", color:T.muted },
  lesTagDone:  { borderColor:T.green, color:T.green },

  /* lesson layout */
  lessonLayout: { display:"grid", gridTemplateColumns:"1fr 320px", gap:24, alignItems:"start" },
  lessonMain:   { display:"flex", flexDirection:"column", gap:24 },
  lessonHead:   { borderBottom:`1px solid ${T.creamBdr}`, paddingBottom:20 },
  lessonTitle:  { fontFamily:T.serif, fontSize:36, fontWeight:400, margin:"0 0 12px" },
  lessonMeta:   { display:"flex", gap:16, alignItems:"center" },

  /* reading */
  readingCard:  { background:T.creamDim, border:`1px solid ${T.creamBdr}`, padding:"28px 32px" },
  readingLabel: { fontFamily:T.mono, fontSize:9, letterSpacing:"0.14em", color:T.muted, marginBottom:20, paddingBottom:10, borderBottom:`1px solid ${T.creamBdr}` },
  para:         { fontFamily:T.serif, fontSize:16, color:T.dark, lineHeight:1.8, marginBottom:14 },

  /* video */
  videoCard: { border:`1px solid ${T.creamBdr}`, overflow:"hidden" },
  videoWrap: { height:340, background:"#000" },

  /* quiz CTA */
  quizCta:     { background:T.dark, border:`1px solid ${T.darkBdr}`, padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:20 },
  quizCtaTitle:{ fontFamily:T.serif, fontSize:20, color:T.cream },
  quizCtaSub:  { fontFamily:T.mono, fontSize:10, color:T.muted, marginTop:4 },
  quizCtaBtn:  { fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:T.green, color:T.cream, border:"none", padding:"10px 24px", cursor:"pointer", flexShrink:0 },

  /* chat sidebar */
  chatSidebar:    { background:T.dark, border:`1px solid ${T.darkBdr}`, display:"flex", flexDirection:"column", position:"sticky", top:20, maxHeight:"85vh" },
  chatHeader:     { padding:"16px 18px", borderBottom:`1px solid ${T.darkBdr}`, display:"flex", justifyContent:"space-between", alignItems:"center" },
  chatHeaderLabel:{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.12em", color:T.muted, marginBottom:3 },
  chatHeaderTitle:{ fontFamily:T.serif, fontSize:16, color:T.cream },
  chatVoiceBtn:   { width:30, height:30, background:"transparent", border:`1px solid ${T.darkBdr}`, color:T.muted, cursor:"pointer", fontFamily:T.mono, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" },
  chatVoiceBtnOn: { borderColor:T.greenAcc, color:T.greenAcc, animation:"cb-pulse 1.5s infinite" },
  chatStopBtn:    { width:30, height:30, background:"transparent", border:`1px solid ${T.darkBdr}`, color:T.muted, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" },
  chatMsgs:       { flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12, minHeight:200, maxHeight:360 },
  chatBubble:     { display:"flex", gap:8, alignItems:"flex-start" },
  chatBubBot:     { alignSelf:"flex-start" },
  chatBubUser:    { alignSelf:"flex-end", flexDirection:"row-reverse" },
  chatAvatar:     { width:24, height:24, background:T.darkCard, border:`1px solid ${T.darkBdr}`, color:T.greenAcc, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.mono, fontSize:7, flexShrink:0 },
  chatBubBody:    { background:T.darkCard, border:`1px solid ${T.darkBdr}`, padding:"10px 13px", fontFamily:T.serif, fontSize:13, color:T.cream, lineHeight:1.65 },
  chatBubBodyUser:{ background:T.greenDim, borderColor:T.green, color:T.cream },
  dot:            { display:"inline-block", width:5, height:5, borderRadius:"50%", background:T.muted, animation:"cb-blink 1.2s infinite ease-in-out" },
  txPreview:      { fontFamily:T.serif, fontSize:12, fontStyle:"italic", color:T.green, padding:"8px 16px", borderTop:`1px solid ${T.darkBdr}` },
  chatInputRow:   { display:"flex", borderTop:`1px solid ${T.darkBdr}` },
  chatInput:      { flex:1, background:"transparent", border:"none", borderRight:`1px solid ${T.darkBdr}`, padding:"10px 14px", fontFamily:T.serif, fontSize:14, color:T.cream },
  chatSendBtn:    { width:44, background:T.green, border:"none", color:T.cream, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" },

  /* quiz */
  quizWrap:    { maxWidth:720, margin:"0 auto" },
  quizHead:    { marginBottom:36, paddingBottom:24, borderBottom:`1px solid ${T.creamBdr}` },
  quizTitle:   { fontFamily:T.serif, fontSize:34, fontWeight:400, margin:"0 0 8px" },
  quizSub:     { fontFamily:T.serif, fontSize:15, color:"#5A6A58", fontStyle:"italic" },
  quizQ:       { background:T.creamDim, border:`1px solid ${T.creamBdr}`, padding:"24px", marginBottom:16 },
  quizQNum:    { fontFamily:T.mono, fontSize:10, letterSpacing:"0.12em", color:T.muted, marginBottom:8 },
  quizQText:   { fontFamily:T.serif, fontSize:18, lineHeight:1.5, marginBottom:18 },
  quizOptions: { display:"flex", flexDirection:"column", gap:8 },
  quizOption:  { display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:T.cream, border:`1px solid ${T.creamBdr}`, cursor:"pointer", textAlign:"left", fontFamily:T.serif, fontSize:15, color:T.dark, transition:"border-color .12s" },
  quizOptionSel:{ borderColor:T.green, background:T.creamDim },
  quizOptLetter:   { fontFamily:T.mono, fontSize:9, letterSpacing:"0.1em", width:22, height:22, border:`1px solid ${T.creamBdr}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:T.muted },
  quizOptLetterSel:{ borderColor:T.green, color:T.green, background:T.greenDim + "44" },
  quizSubmit:  { fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:T.green, color:T.cream, border:"none", padding:"14px 36px", cursor:"pointer", marginTop:8, transition:"opacity .15s" },

  /* quiz result */
  resultHeader:{ padding:"32px", marginBottom:24, textAlign:"center" as const },
  resultScore: { fontFamily:T.serif, fontSize:56, fontWeight:400, color:T.cream, lineHeight:1, marginBottom:8 },
  resultStatus:{ fontFamily:T.mono, fontSize:11, letterSpacing:"0.14em", color:T.greenAcc, marginBottom:12 },
  resultMsg:   { fontFamily:T.serif, fontSize:16, fontStyle:"italic", color:T.muted, lineHeight:1.6 },
  resultQ:     { background:T.creamDim, border:`1px solid ${T.creamBdr}`, padding:"20px 24px", marginBottom:12 },
  resultQIcon: { width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.mono, fontSize:10, color:T.cream, flexShrink:0 },
  resultCorrect:{ fontFamily:T.mono, fontSize:11, color:T.amber, marginBottom:8, letterSpacing:"0.04em" },
  resultExplain:{ fontFamily:T.serif, fontSize:14, color:"#5A6A58", lineHeight:1.7, fontStyle:"italic" },
  resultActions:{ display:"flex", gap:12, marginTop:24, flexWrap:"wrap" as const },
  resultRetry:  { fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:"transparent", border:`1px solid ${T.creamBdr}`, color:T.dark, padding:"10px 22px", cursor:"pointer" },
  resultLesson: { fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:"transparent", border:`1px solid ${T.creamBdr}`, color:T.dark, padding:"10px 22px", cursor:"pointer" },
  resultModule: { fontFamily:T.mono, fontSize:11, letterSpacing:"0.1em", background:T.green, color:T.cream, border:"none", padding:"10px 22px", cursor:"pointer" },

  footer: { padding:"18px 40px", borderTop:`1px solid ${T.creamBdr}`, fontFamily:T.mono, fontSize:10, letterSpacing:"0.06em", color:T.muted, marginTop:"auto" },
};