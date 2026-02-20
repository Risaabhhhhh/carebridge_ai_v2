"use client";

import { useState } from "react";
import { analyzePolicy, analyzePolicyFromFile } from "../lib/api";
import { PrePurchaseReport } from "../types/prepurchase";

import OverallRatingCard from "../components/dashboard/OverallRatingCard";
import ClauseHeatmap from "../components/dashboard/ClauseHeatmap";
import IRDAICompliancePanel from "../components/dashboard/IRDAICompliancePanel";
import BrokerTransparencyPanel from "../components/dashboard/BrokerTransparencyPanel";
import PolicyFlagsSection from "../components/dashboard/PolicyFlagsSection";

export default function PrePurchasePage() {
  const [policyText, setPolicyText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<PrePurchaseReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    setReport(null);

    if (!policyText.trim() && !file) {
      setError("Please paste policy text or upload a file.");
      return;
    }

    setLoading(true);

    try {
      let data;

      if (file) {
        data = await analyzePolicyFromFile(file);
      } else {
        if (policyText.trim().length < 100) {
          setError("Policy text must be at least 100 characters.");
          setLoading(false);
          return;
        }
        data = await analyzePolicy(policyText);
      }

      setReport(data);

      setTimeout(() => {
        window.scrollTo({
          top: 600,
          behavior: "smooth",
        });
      }, 100);

    } catch (err) {
      setError("Policy could not be processed. Try clearer text or a higher quality document.");
    } finally {
      setLoading(false);
    }
  };

  const detectedClauses = report
    ? Object.entries(report.clause_risk)
        .filter(([_, value]) => value !== "Not Found")
        .map(([key]) => key.replace(/_/g, " "))
    : [];

  return (
    <div className="pt-32 px-6 max-w-5xl mx-auto">

      <h1 className="text-3xl font-serif mb-10">
        Pre-Purchase Policy Analysis
      </h1>

      {/* TEXT INPUT */}
      <textarea
        value={policyText}
        onChange={(e) => {
          setPolicyText(e.target.value);
          setFile(null);
        }}
        className="w-full h-56 p-5 border border-stone/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage bg-white"
        placeholder="Paste full policy document text here..."
      />

      {/* FILE UPLOAD */}
      <div className="mt-8">
        <label
          htmlFor="fileUpload"
          className="flex items-center justify-between px-6 py-5 border border-stone/50 rounded-lg cursor-pointer bg-white hover:border-sage transition"
        >
          <span className="text-sm text-charcoal/70">
            {file ? file.name : "Upload PDF or Image (OCR handled by backend)"}
          </span>

          <span className="text-xs px-4 py-2 border border-sage text-sage rounded-md">
            Choose File
          </span>
        </label>

        <input
          id="fileUpload"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
              setPolicyText("");
            }
          }}
        />
      </div>

      {/* BUTTON */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="mt-8 px-8 py-3 bg-sage text-white rounded-md hover:opacity-90 disabled:opacity-50 transition"
      >
        {loading ? "Analyzing..." : "Analyze Policy"}
      </button>

      {/* ERROR */}
      {error && (
        <div className="mt-6 text-red-600">
          {error}
        </div>
      )}

      {/* RESULTS */}
      {report && (
        <div className="mt-24 space-y-16">

          <OverallRatingCard report={report} />

          {/* WHAT THIS MEANS */}
          <div className="bg-white border border-stone/40 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">What This Means</h3>
            <p className="text-sm text-charcoal/80 leading-relaxed">
              The Structural Exposure Index reflects financial and clause-based
              conditions that may affect out-of-pocket expenses during hospitalization.
              This is interpretative guidance designed to improve policy understanding,
              not a guarantee of claim outcomes.
            </p>
          </div>

          {/* DETECTED CLAUSES */}
          {detectedClauses.length > 0 && (
            <div className="bg-white border border-stone/40 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3">Clauses Detected</h3>
              <div className="flex flex-wrap gap-2">
                {detectedClauses.map((clause) => (
                  <span
                    key={clause}
                    className="px-3 py-1 text-xs bg-stone-100 rounded-full"
                  >
                    {clause}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ClauseHeatmap clauseRisk={report.clause_risk} />

          {/* FINANCIAL EXPOSURE INDICATORS */}
          <div className="bg-white border border-stone/40 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3">
              Financial Exposure Indicators
            </h3>
            <ul className="text-sm text-charcoal/80 space-y-1">
              <li>• Co-payment or cost sharing may apply.</li>
              <li>• Room rent limits can affect reimbursement.</li>
              <li>• Waiting periods may delay coverage eligibility.</li>
            </ul>
          </div>

          <IRDAICompliancePanel compliance={report.irdai_compliance} />

          {/* TRANSPARENCY NOTICE */}
          {report.irdai_compliance?.compliance_score <= 3 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 text-sm text-yellow-800">
              Some regulatory transparency indicators were not clearly found in the
              document. Consider verifying details in the official policy booklet.
            </div>
          )}

          <BrokerTransparencyPanel broker={report.broker_risk_analysis} />

          <PolicyFlagsSection
            redFlags={report.red_flags}
            positiveFlags={report.positive_flags}
          />

          {/* CONFIDENCE NOTE */}
          <div className="text-xs text-charcoal/60">
            Confidence indicates how clearly policy wording supported clause detection.
            Lower confidence suggests reviewing the original document for clarity.
          </div>

        </div>
      )}

    </div>
  );
}