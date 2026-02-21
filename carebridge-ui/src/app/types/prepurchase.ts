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
  risk_index: number;
}

export interface IRDAICompliance {
  compliance_flags: Record<string, boolean | string[]>;
  compliance_score: number;
  compliance_rating:
    | "High Compliance"
    | "Moderate Compliance"
    | "Low Compliance";
}

export interface BrokerRiskAnalysis {
  risk_density_index: number;
  transparency_score: number;

  structural_risk_level:
    | "High"
    | "Elevated"
    | "Moderate"
    | "Balanced"
    | "Insufficient Data";

  recommendation: string;

  high_risk_count: number;
  not_found_count: number;
  data_sufficient: boolean;
}

export interface PrePurchaseReport {
  clause_risk: ClauseRisk;
  score_breakdown: ScoreBreakdown;
  overall_policy_rating: PolicyRating;
  summary: string;

  // ✅ THIS FIXES YOUR ERROR
  checklist_for_buyer: string[];

  confidence: ConfidenceLevel;
  irdai_compliance: IRDAICompliance;
  broker_risk_analysis: BrokerRiskAnalysis;

  red_flags: string[];
  positive_flags: string[];
}