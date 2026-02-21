from engines.pre_purchase_engine import PrePurchaseEngine
from schemas.policy_comparison import PolicyComparisonReport


class PolicyComparisonEngine:

    def __init__(self, model, tokenizer):
        # Share one engine instance — runs sequentially, not parallel
        self.engine = PrePurchaseEngine(model, tokenizer)

    def compare(self, policy_a_text: str, policy_b_text: str) -> PolicyComparisonReport:

        report_a = self.engine.run(policy_a_text)
        report_b = self.engine.run(policy_b_text)

        score_a = report_a.score_breakdown.adjusted_score
        score_b = report_b.score_breakdown.adjusted_score
        diff    = score_a - score_b

        # ✅ Match frontend expected values: "A", "B", "Neither"
        if diff > 3:
            recommended = "A"
        elif diff < -3:
            recommended = "B"
        else:
            recommended = "Neither"   # too close to call

        # --------------------------------------------------
        # Clause-level diff analysis
        # --------------------------------------------------
        clause_a = report_a.clause_risk
        clause_b = report_b.clause_risk

        _RISK_ORDER = {"High Risk": 0, "Moderate Risk": 1, "Low Risk": 2, "Not Found": 3}

        key_differences: list[str] = []
        a_advantages:    list[str] = []
        b_advantages:    list[str] = []
        a_risks:         list[str] = []
        b_risks:         list[str] = []

        _CLAUSE_LABELS = {
            "waiting_period":             "Waiting Period",
            "pre_existing_disease":       "Pre-existing Disease",
            "room_rent_sublimit":         "Room Rent Sublimit",
            "disease_specific_caps":      "Disease-Specific Caps",
            "co_payment":                 "Co-payment",
            "exclusions_clarity":         "Exclusions Clarity",
            "claim_procedure_complexity": "Claim Procedure",
            "sublimits_and_caps":         "Sublimits & Caps",
            "restoration_benefit":        "Restoration Benefit",
            "transparency_of_terms":      "Term Transparency",
        }

        for field, label in _CLAUSE_LABELS.items():
            val_a = getattr(clause_a, field, "Not Found")
            val_b = getattr(clause_b, field, "Not Found")

            if val_a == val_b:
                continue

            rank_a = _RISK_ORDER.get(val_a, 3)
            rank_b = _RISK_ORDER.get(val_b, 3)

            key_differences.append(
                f"{label}: Policy A is {val_a}, Policy B is {val_b}"
            )

            if rank_a > rank_b:
                # A has lower risk (higher rank = better)
                a_advantages.append(f"Lower {label.lower()} risk ({val_a} vs {val_b})")
                b_risks.append(f"Higher {label.lower()} risk ({val_b} vs {val_a})")
            elif rank_b > rank_a:
                b_advantages.append(f"Lower {label.lower()} risk ({val_b} vs {val_a})")
                a_risks.append(f"Higher {label.lower()} risk ({val_a} vs {val_b})")

        # Compliance comparison
        comp_a = report_a.irdai_compliance.compliance_score
        comp_b = report_b.irdai_compliance.compliance_score
        if comp_a > comp_b:
            a_advantages.append(f"Better IRDAI compliance ({comp_a}/7 vs {comp_b}/7)")
            b_risks.append(f"Lower IRDAI compliance score ({comp_b}/7)")
        elif comp_b > comp_a:
            b_advantages.append(f"Better IRDAI compliance ({comp_b}/7 vs {comp_a}/7)")
            a_risks.append(f"Lower IRDAI compliance score ({comp_a}/7)")

        # Transparency comparison
        trans_a = report_a.broker_risk_analysis.transparency_score
        trans_b = report_b.broker_risk_analysis.transparency_score
        if trans_a > trans_b + 5:
            a_advantages.append(f"Higher transparency score ({trans_a}% vs {trans_b}%)")
        elif trans_b > trans_a + 5:
            b_advantages.append(f"Higher transparency score ({trans_b}% vs {trans_a}%)")

        # --------------------------------------------------
        # Recommendation text
        # --------------------------------------------------
        if recommended == "A":
            rec_text = (
                f"Policy A scores {round(score_a)} vs Policy B's {round(score_b)}. "
                f"It shows lower structural risk and better clause transparency. "
                f"Review remaining differences before committing."
            )
        elif recommended == "B":
            rec_text = (
                f"Policy B scores {round(score_b)} vs Policy A's {round(score_a)}. "
                f"It shows lower structural risk and better clause transparency. "
                f"Review remaining differences before committing."
            )
        else:
            rec_text = (
                f"Both policies score similarly ({round(score_a)} vs {round(score_b)}). "
                f"Decision should be based on premium, insurer claim settlement ratio, "
                f"and specific coverage needs rather than structural score alone."
            )

        return PolicyComparisonReport(
            # ✅ Flat structure matching frontend ComparisonReport interface
            policy_a_rating=report_a.overall_policy_rating,
            policy_b_rating=report_b.overall_policy_rating,
            policy_a_score=round(score_a),
            policy_b_score=round(score_b),
            recommended_policy=recommended,
            recommendation=rec_text,
            key_differences=key_differences[:8],   # cap at 8 for readability
            a_advantages=a_advantages,
            b_advantages=b_advantages,
            a_risks=a_risks,
            b_risks=b_risks,
            summary=(
                f"Policy A: {report_a.overall_policy_rating} ({round(score_a)}/100) · "
                f"Policy B: {report_b.overall_policy_rating} ({round(score_b)}/100)"
            ),
        )