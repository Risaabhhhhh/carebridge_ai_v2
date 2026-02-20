"use client";

import { useState } from "react";
import { analyzeRejection } from "../lib/api";
import { AuditReport } from "../types/audit";

import AuditSummaryCard from ".././components/audit/AuditSummaryCard";
import AppealStrengthCard from ".././components/audit/AppealStrengthCard";
import StrengthWeaknessSection from ".././components/audit/StrengthWeaknessSection";
import RegulatorySection from ".././components/audit/RegulatorySection";

export default function AuditPage() {
  const [policyText, setPolicyText] = useState("");
  const [rejectionText, setRejectionText] = useState("");
  const [medicalText, setMedicalText] = useState("");
  const [userExplanation, setUserExplanation] = useState("");

  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!policyText || !rejectionText) {
      setError("Policy and rejection text are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await analyzeRejection({
        policy_text: policyText,
        rejection_text: rejectionText,
        medical_documents_text: medicalText,
        user_explanation: userExplanation,
      });

      setReport(data);

      setTimeout(() => {
        window.scrollTo({ top: 600, behavior: "smooth" });
      }, 100);

    } catch {
      setError("Audit could not be processed. Try clearer wording or include more details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 px-6 max-w-5xl mx-auto">

      <h1 className="text-3xl font-serif mb-10">
        Post-Rejection Claim Audit
      </h1>

      {/* INPUTS */}
      <textarea
        placeholder="Paste policy wording..."
        value={policyText}
        onChange={(e) => setPolicyText(e.target.value)}
        className="w-full h-40 p-4 border border-stone rounded-lg mb-6"
      />

      <textarea
        placeholder="Paste rejection letter..."
        value={rejectionText}
        onChange={(e) => setRejectionText(e.target.value)}
        className="w-full h-40 p-4 border border-stone rounded-lg mb-6"
      />

      <textarea
        placeholder="Medical documents summary (optional)"
        value={medicalText}
        onChange={(e) => setMedicalText(e.target.value)}
        className="w-full h-32 p-4 border border-stone rounded-lg mb-6"
      />

      <textarea
        placeholder="Your explanation (optional)"
        value={userExplanation}
        onChange={(e) => setUserExplanation(e.target.value)}
        className="w-full h-28 p-4 border border-stone rounded-lg"
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="mt-6 px-6 py-3 bg-sage text-white rounded-md"
      >
        {loading ? "Analyzing..." : "Run Audit"}
      </button>

      {error && <div className="mt-6 text-red-600">{error}</div>}

      {report && (
        <div className="mt-20 space-y-16">

          {/* LOW CONFIDENCE WARNING */}
          {report.confidence === "Low" && (
            <div className="bg-amber-50 border border-amber-300 p-6 rounded-md">
              Automated interpretation has low confidence. Manual clarification
              from the insurer may be required.
            </div>
          )}

          {/* WHAT THIS AUDIT MEANS */}
          <div className="bg-white border border-stone/40 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">What This Audit Means</h3>
            <p className="text-sm text-charcoal/80 leading-relaxed">
              This audit interprets the insurer’s rejection reasoning using the
              provided policy wording and documents. It highlights clause triggers,
              documentation gaps, and structural interpretation to improve clarity.
              This guidance does not predict claim outcomes or provide legal advice.
            </p>
          </div>

          <AuditSummaryCard report={report} />

          {/* CLAUSE INTERPRETATION NOTE */}
          <div className="bg-white border border-stone/40 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">Clause Interpretation</h3>
            <p className="text-sm text-charcoal/80">
              The identified clause reflects how the insurer may have interpreted
              policy wording. Reviewing the full policy document and clarification
              from the insurer can help confirm applicability.
            </p>
          </div>

          <AppealStrengthCard appeal={report.appeal_strength} />

          {/* APPEAL STRENGTH EXPLANATION */}
          <div className="bg-white border border-stone/40 rounded-xl p-6 text-sm text-charcoal/80">
            The Appeal Strength Index reflects interpretative factors such as clause
            clarity, documentation completeness, and alignment with policy wording.
            It is not a probability of appeal success.
          </div>

          <StrengthWeaknessSection
            strong={report.strong_points}
            weak={report.weak_points}
            steps={report.reapplication_steps}
          />

          {/* DOCUMENTATION CLARITY NOTE */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 text-sm text-yellow-800">
            Ensure all medical records, bills, prescriptions, and discharge summaries
            are complete and clearly legible before resubmission.
          </div>

          <RegulatorySection text={report.regulatory_considerations} />

          {/* CONSUMER RIGHTS NOTE */}
          <div className="text-xs text-charcoal/60">
            Policyholders have the right to request written clarification, use the
            insurer’s grievance process, and escalate unresolved complaints to the
            Insurance Ombudsman.
          </div>

        </div>
      )}
    </div>
  );
}