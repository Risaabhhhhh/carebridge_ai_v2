"use client";

import { BrokerRiskAnalysis } from "../../types/prepurchase";

interface Props {
  broker: BrokerRiskAnalysis;
}

export default function BrokerTransparencyPanel({ broker }: Props) {
  const {
    structural_risk_level,
    transparency_score,
    risk_density_index,
    recommendation,
  } = broker;

  const getRiskColor = () => {
    switch (structural_risk_level) {
      case "Stable":
        return "text-green-600";
      case "Elevated":
        return "text-amber-600";
      case "High":
        return "text-red-600";
      default:
        return "text-charcoal";
    }
  };

  const riskPercent = Math.round(risk_density_index * 100);

  return (
    <div className="mt-16 bg-white border border-stone/40 rounded-xl p-10 shadow-sm animate-fadeUp">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <p className="text-sm text-charcoal/60 mb-2 tracking-wide">
            Broker Transparency Analysis
          </p>
          <h2 className={`text-2xl font-serif ${getRiskColor()}`}>
            {structural_risk_level} Risk
          </h2>
        </div>

        <div>
          <p className="text-sm text-charcoal/60 mb-2 tracking-wide">
            Transparency Score
          </p>
          <p className="text-2xl font-semibold">
            {transparency_score} / 100
          </p>
        </div>
      </div>

      {/* Risk Density */}
      <div className="mb-10">
        <div className="flex justify-between text-sm text-charcoal/70 mb-2">
          <span>Risk Density Index</span>
          <span>{riskPercent}%</span>
        </div>

        <div className="w-full h-3 bg-stone/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage transition-all duration-700"
            style={{ width: `${riskPercent}%` }}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <p className="text-sm text-charcoal/60 mb-2 tracking-wide">
          Recommendation
        </p>
        <p className="text-charcoal/80 leading-relaxed">
          {recommendation}
        </p>
      </div>

    </div>
  );
}
