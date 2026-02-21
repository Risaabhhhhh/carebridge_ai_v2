# services/irdai_compliance_engine.py

import re
from schemas.pre_purchase import IRDAICompliance


# ------------------------------------------------------------------
# WEIGHTED compliance signals — each entry is (patterns, weight)
# patterns are checked as regex on lowercased text
# ------------------------------------------------------------------
_COMPLIANCE_SIGNALS = {

    "grievance_redressal_mentioned": (
        [r"grievance redressal", r"grievance officer", r"complaint.*officer",
         r"customer grievance", r"raise.*complaint", r"grievance.*portal"],
        1.5   # weighted higher — active redressal mechanism is critical
    ),

    "ombudsman_mentioned": (
        [r"insurance ombudsman", r"ombudsman.*appeal", r"refer.*ombudsman",
         r"irdai.*ombudsman", r"complaint.*ombudsman"],
        1.5
    ),

    "irdai_reference": (
        [r"as per irdai", r"irdai.*guideline", r"irdai.*regulation",
         r"irdai.*circular", r"irdai.*mandate", r"in accordance.*irdai"],
        1.0   # generic IRDAI mentions worth less
    ),

    "free_look_period": (
        [r"free.?look period", r"free.?look.*15 day", r"free.?look.*30 day",
         r"15.*day.*free", r"30.*day.*free", r"cancel.*policy.*within",
         r"return.*policy.*within \d+ day"],
        2.0   # IRDAI mandated — high weight
    ),

    "portability_clause": (
        [r"portab", r"port.*policy", r"transfer.*insurer",
         r"switch.*insurer", r"migrate.*policy"],
        1.0
    ),

    "claim_settlement_timeline": (
        [r"claim.*settled.*within \d+", r"settle.*claim.*\d+ day",
         r"processed within \d+", r"discharge.*within \d+ day",
         r"claim.*\d+ working day", r"30.day.*claim", r"15.day.*claim"],
        1.5   # specific timeline = meaningful commitment
    ),

    "exclusion_transparency": (
        [r"list of exclusion", r"permanent exclusion", r"specific exclusion",
         r"exclusion.*clearly stated", r"excluded condition",
         r"schedule.*exclusion", r"annexure.*exclusion"],
        1.0   # must be specific, not just the word "exclusion"
    ),
}

# ------------------------------------------------------------------
# RED FLAG phrases that indicate compliance VIOLATIONS
# Each match deducts from the compliance score
# ------------------------------------------------------------------
_COMPLIANCE_PENALTIES = [
    (r"company.{0,20}decision.*final", -1.5,
     "Company decision marked as final — limits consumer recourse"),
    (r"arbitration.*only", -1.0,
     "Arbitration-only clause — restricts ombudsman access"),
    (r"no refund.*premium", -0.5,
     "No refund of premium — may violate free-look rights"),
    (r"right.*amend.*terms.*without notice", -1.0,
     "Unilateral term amendment without notice"),
    (r"waive.*right.*sue", -1.5,
     "Waiver of right to sue — consumer rights violation"),
    (r"subject to change without", -0.5,
     "Terms subject to change without notice"),
]

# Maximum raw weighted score (sum of all weights)
_MAX_WEIGHTED_SCORE = sum(w for _, w in _COMPLIANCE_SIGNALS.values())


def _check_signals(text: str) -> tuple[dict, float]:
    """Check compliance signals with phrase-level regex matching."""
    flags = {}
    weighted_score = 0.0

    for flag_name, (patterns, weight) in _COMPLIANCE_SIGNALS.items():
        matched = any(re.search(p, text) for p in patterns)
        flags[flag_name] = matched
        if matched:
            weighted_score += weight

    return flags, weighted_score


def _check_penalties(text: str) -> tuple[list, float]:
    """Check for compliance violation phrases."""
    violations = []
    total_penalty = 0.0

    for pattern, penalty, description in _COMPLIANCE_PENALTIES:
        if re.search(pattern, text):
            violations.append(description)
            total_penalty += penalty

    return violations, total_penalty


def evaluate_irdai_compliance(policy_text: str) -> IRDAICompliance:
    """
    Evaluates IRDAI regulatory compliance using weighted phrase detection.
    Returns structured IRDAICompliance with score 0-7 for compatibility
    with the scoring engine's compliance_scale config.
    """

    text = policy_text.lower()

    # Positive compliance signals
    compliance_flags, weighted_score = _check_signals(text)

    # Penalty for red-flag clauses
    violations, penalty = _check_penalties(text)

    # Net weighted score
    net_score = max(0.0, weighted_score + penalty)   # penalty values are negative

    # Normalise to 0-7 scale for scoring engine compatibility
    normalised_score = round((net_score / _MAX_WEIGHTED_SCORE) * 7, 2)
    normalised_score = max(0.0, min(7.0, normalised_score))

    # Rating
    if normalised_score >= 5.5:
        rating = "High Compliance"
    elif normalised_score >= 3.0:
        rating = "Moderate Compliance"
    else:
        rating = "Low Compliance"

    # Add violations to flags for transparency
    if violations:
        compliance_flags["_violations_detected"] = violations

    return IRDAICompliance(
        compliance_flags=compliance_flags,
        compliance_score=normalised_score,
        compliance_rating=rating,
    )