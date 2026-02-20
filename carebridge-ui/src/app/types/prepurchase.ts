export type RiskLevel =
  | "Low Risk"
  | "Moderate Risk"
  | "High Risk"
  | "Not Found";

export type PolicyRating = "Strong" | "Moderate" | "Weak";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface ClauseRisk {
  waiting_period: RiskLevel;
  pre_existing_disease: RiskLevel;
  room_rent_sublimit: RiskLevel;
  disease_specific_caps: RiskLevel;
  co_payment: RiskLevel;
  exclusions_clarity: RiskLevel;
  claim_procedure_complexity: RiskLevel;
  sublimits_and_caps: RiskLevel;
  restoration_benefit: RiskLevel;
  transparency_of_terms: RiskLevel;
}

export interface ScoreBreakdown {
  base_score: number;
  adjusted_score: number;
  rating: PolicyRating;
  risk_index: number; // 0–1
}

export interface IRDAICompliance {
  compliance_flags: {
    grievance_redressal_mentioned: boolean;
    ombudsman_mentioned: boolean;
    irdai_reference: boolean;
    free_look_period: boolean;
    portability_clause: boolean;
    claim_settlement_timeline: boolean;
    exclusion_transparency: boolean;
  };
  compliance_score: number;
  compliance_rating:
    | "High Compliance"
    | "Moderate Compliance"
    | "Low Compliance";
}

export interface BrokerRiskAnalysis {
  risk_density_index: number; // 0–1
  transparency_score: number; // 0–100
  structural_risk_level: "Stable" | "Elevated" | "High";
  recommendation: string;
}

export interface PrePurchaseReport {
  clause_risk: ClauseRisk;
  score_breakdown: ScoreBreakdown;
  overall_policy_rating: PolicyRating;
  summary: string;
  confidence: ConfidenceLevel;
  irdai_compliance: IRDAICompliance;
  broker_risk_analysis: BrokerRiskAnalysis;
  red_flags: string[];
  positive_flags: string[];
}
