"use client";

import { ClauseRisk, RiskLevel } from "../../types/prepurchase";

interface Props {
  clauseRisk: ClauseRisk;
}

export default function ClauseHeatmap({ clauseRisk }: Props) {
  const getRiskStyles = (risk: RiskLevel) => {
    switch (risk) {
      case "Low Risk":
        return "bg-green-50 border-green-200 text-green-700";
      case "Moderate Risk":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "High Risk":
        return "bg-red-50 border-red-200 text-red-700";
      case "Not Found":
      default:
        return "bg-gray-50 border-gray-200 text-gray-500";
    }
  };

  const formattedClauses = [
    { key: "waiting_period", label: "Waiting Period" },
    { key: "pre_existing_disease", label: "Pre-Existing Disease" },
    { key: "room_rent_sublimit", label: "Room Rent Sublimit" },
    { key: "disease_specific_caps", label: "Disease Caps" },
    { key: "co_payment", label: "Co-Payment" },
    { key: "exclusions_clarity", label: "Exclusions Clarity" },
    { key: "claim_procedure_complexity", label: "Claim Complexity" },
    { key: "sublimits_and_caps", label: "Sublimits & Caps" },
    { key: "restoration_benefit", label: "Restoration Benefit" },
    { key: "transparency_of_terms", label: "Transparency" },
  ] as const;

  return (
    <div className="mt-16 animate-fadeUp">

      <h2 className="text-2xl font-serif mb-8">
        Clause Risk Classification
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">

        {formattedClauses.map((clause) => {
          const risk = clauseRisk[clause.key];

          return (
            <div
              key={clause.key}
              className={`p-6 rounded-lg border ${getRiskStyles(risk)} transition`}
            >
              <p className="text-sm font-medium mb-3">
                {clause.label}
              </p>

              <p className="text-lg font-semibold">
                {risk}
              </p>
            </div>
          );
        })}

      </div>
    </div>
  );
}
