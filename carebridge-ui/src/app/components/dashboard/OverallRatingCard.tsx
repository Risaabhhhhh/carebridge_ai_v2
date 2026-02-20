"use client";

import { PrePurchaseReport } from "../../types/prepurchase";

interface Props {
  report: PrePurchaseReport;
}

export default function OverallRatingCard({ report }: Props) {
  const { score_breakdown, overall_policy_rating, confidence } = report;

  const getRatingColor = () => {
    switch (overall_policy_rating) {
      case "Strong":
        return "text-green-600";
      case "Moderate":
        return "text-amber-600";
      case "Weak":
        return "text-red-600";
      default:
        return "text-charcoal";
    }
  };

  const riskPercent = Math.round(score_breakdown.risk_index * 100);

  return (
    <div className="bg-white border border-stone/40 rounded-xl p-10 shadow-sm animate-fadeUp">

      {/* Top Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        {/* Rating */}
        <div>
          <p className="text-sm text-charcoal/60 mb-2 tracking-wide">
            Overall Policy Rating
          </p>
          <h2 className={`text-4xl font-serif ${getRatingColor()}`}>
            {overall_policy_rating}
          </h2>
        </div>

        {/* Adjusted Score */}
        <div>
          <p className="text-sm text-charcoal/60 mb-2 tracking-wide">
            Adjusted Score
          </p>
          <p className="text-3xl font-semibold">
            {score_breakdown.adjusted_score}
          </p>
        </div>

      </div>

      {/* Risk Index Bar */}
      <div className="mt-10">

        <div className="flex justify-between text-sm text-charcoal/70 mb-2">
          <span>Risk Index</span>
          <span>{riskPercent}%</span>
        </div>

        <div className="w-full h-3 bg-stone/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage transition-all duration-700"
            style={{ width: `${riskPercent}%` }}
          />
        </div>

      </div>

      {/* Confidence */}
      <div className="mt-8 text-sm text-charcoal/70">
        Confidence Level:{" "}
        <span className="font-medium text-charcoal">
          {confidence}
        </span>
      </div>

    </div>
  );
}
