export type ClauseAlignment =
  | "Strong"
  | "Partial"
  | "Weak"
  | "Not Detected";

export type AppealLabel = "Weak" | "Moderate" | "Strong";

export type ConfidenceLevel = "Low" | "Medium" | "High";

export interface AppealStrength {
  percentage: number;
  label: AppealLabel;
  reasoning: string;
}

export interface AuditReport {
  case_summary: string;
  why_rejected: string;
  policy_clause_detected: string;

  clause_alignment: ClauseAlignment;
  regulatory_considerations: string;

  weak_points: string[];
  strong_points: string[];
  reapplication_steps: string[];

  // ✅ REQUIRED (backend sends this)
  reapplication_possible: boolean;

  appeal_strength: AppealStrength;

  confidence: ConfidenceLevel;
  system_notice: string;
}