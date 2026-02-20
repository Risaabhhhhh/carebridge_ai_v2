export interface ClauseRisk {
  waiting_period: string;
  pre_existing_disease: string;
  room_rent_sublimit: string;
  disease_specific_caps: string;
  co_payment: string;
  exclusions_clarity: string;
  claim_procedure_complexity: string;
  sublimits_and_caps: string;
  restoration_benefit: string;
  transparency_of_terms: string;
}

export interface PolicyScoreBreakdown {
  base_score: number;
  adjusted_score: number;
  rating: string;
}

export interface IRDAICompliance {
  compliance_score: number;
  compliance_rating: string;
}

export interface PrePurchaseResponse {
  clause_risk: ClauseRisk;
  score_breakdown: PolicyScoreBreakdown;
  overall_policy_rating: string;
  checklist_for_buyer: string[];
  confidence: string;
  irdai_compliance: IRDAICompliance;
}
