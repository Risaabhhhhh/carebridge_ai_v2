"use client";

import { BrokerRiskAnalysis } from "../../types/prepurchase";

const RISK_CONFIG: Record<
  string,
  { color: string; bg: string; track: string }
> = {
  High: { color: "#b94030", bg: "#fdf2f0", track: "#f0c4be" },
  Elevated: { color: "#9a6c10", bg: "#fdf8ee", track: "#e8d5a0" },
  Moderate: { color: "#7a6010", bg: "#fdf8ee", track: "#e8d5a0" },
  Balanced: { color: "#2d6b3e", bg: "#eef5f0", track: "#c8e0cc" },
  "Insufficient Data": { color: "#8fa896", bg: "#f5f2ec", track: "#ddd8ce" },
};

export default function BrokerTransparencyPanel({
  broker,
}: {
  broker: BrokerRiskAnalysis;
}) {
  // fallback safety
  const cfg =
    RISK_CONFIG[broker.structural_risk_level] ??
    RISK_CONFIG["Moderate"];

  const riskPct = Math.round((broker.risk_density_index || 0) * 100);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #ddd8ce",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #ddd8ce",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: 1, color: "#8fa896" }}>
          STRUCTURAL RISK ANALYSIS
        </span>

        <span
          style={{
            color: cfg.color,
            background: cfg.bg,
            padding: "4px 10px",
            borderRadius: 2,
            fontSize: 11,
          }}
        >
          {broker.structural_risk_level}
        </span>
      </div>

      {/* BODY */}
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 22 }}>
        
        {/* TOP STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "#8fa896" }}>
              Structural Risk Level
            </div>

            <div style={{ fontSize: 34, color: cfg.color }}>
              {broker.structural_risk_level}
            </div>

            <div style={{ fontSize: 11, color: "#8fa896" }}>
              {broker.high_risk_count} high-risk •{" "}
              {broker.not_found_count} undetected
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#8fa896" }}>
              Transparency Score
            </div>

            <div style={{ fontSize: 34, color: "#2d5a3d" }}>
              {broker.transparency_score}
              <span style={{ fontSize: 16, opacity: 0.4 }}>/100</span>
            </div>

            <div style={{ fontSize: 11, color: "#8fa896" }}>
              {broker.data_sufficient
                ? "Data sufficient"
                : "Insufficient data"}
            </div>
          </div>
        </div>

        {/* RISK DENSITY BAR */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#8fa896",
              marginBottom: 6,
            }}
          >
            <span>Risk Density Index</span>
            <span>{riskPct}%</span>
          </div>

          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: cfg.track,
            }}
          >
            <div
              style={{
                width: `${riskPct}%`,
                height: "100%",
                background: cfg.color,
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </div>

        {/* TRANSPARENCY BAR */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "#8fa896",
              marginBottom: 6,
            }}
          >
            <span>Transparency</span>
            <span>{broker.transparency_score}%</span>
          </div>

          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "#c8e0cc",
            }}
          >
            <div
              style={{
                width: `${broker.transparency_score}%`,
                height: "100%",
                background: "#2d5a3d",
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </div>

        {/* RECOMMENDATION */}
        <div
          style={{
            background: "#faf8f3",
            border: "1px solid #f0ede8",
            padding: 16,
            fontSize: 13,
            lineHeight: 1.6,
            fontStyle: "italic",
            color: "#5a6560",
          }}
        >
          {broker.recommendation}
        </div>
      </div>
    </div>
  );
}