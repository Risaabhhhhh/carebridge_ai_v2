"use client";

import { IRDAICompliance } from "../../types/prepurchase";

interface Props {
  compliance: IRDAICompliance;
}

export default function IRDAICompliancePanel({ compliance }: Props) {
  const {
    compliance_flags,
    compliance_score,
    compliance_rating,
  } = compliance;

  const getRatingColor = () => {
    switch (compliance_rating) {
      case "High Compliance":
        return "text-green-600";
      case "Moderate Compliance":
        return "text-amber-600";
      case "Low Compliance":
        return "text-red-600";
      default:
        return "text-charcoal";
    }
  };

  const flags = [
    {
      label: "Grievance Redressal Mentioned",
      value: compliance_flags.grievance_redressal_mentioned,
    },
    {
      label: "Ombudsman Mentioned",
      value: compliance_flags.ombudsman_mentioned,
    },
    {
      label: "IRDAI Reference",
      value: compliance_flags.irdai_reference,
    },
    {
      label: "Free Look Period",
      value: compliance_flags.free_look_period,
    },
    {
      label: "Portability Clause",
      value: compliance_flags.portability_clause,
    },
    {
      label: "Claim Settlement Timeline",
      value: compliance_flags.claim_settlement_timeline,
    },
    {
      label: "Exclusion Transparency",
      value: compliance_flags.exclusion_transparency,
    },
  ];

  return (
    <div className="mt-16 bg-white border border-stone/40 rounded-xl p-10 shadow-sm animate-fadeUp">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <p className="text-sm text-charcoal/60 mb-2 tracking-wide">
            IRDAI Compliance
          </p>
          <h2 className={`text-2xl font-serif ${getRatingColor()}`}>
            {compliance_rating}
          </h2>
        </div>

        <div>
          <p className="text-sm text-charcoal/60 mb-2 tracking-wide">
            Compliance Score
          </p>
          <p className="text-2xl font-semibold">
            {compliance_score}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {flags.map((flag) => (
          <div
            key={flag.label}
            className="flex items-center justify-between p-4 border border-stone/30 rounded-md"
          >
            <span className="text-sm text-charcoal/80">
              {flag.label}
            </span>

            <span
              className={`text-sm font-medium ${
                flag.value ? "text-green-600" : "text-red-600"
              }`}
            >
              {flag.value ? "Present" : "Missing"}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
