# tests/test_scoring_calibration.py
#
# Run standalone: python tests/test_scoring_calibration.py
# Run with pytest: python -m pytest tests/test_scoring_calibration.py -v
#
# BEFORE CHANGING ANY WEIGHT in prepurchase_scoring_config.py,
# run this file. If any test fails, the weights are out of calibration.

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.prepurchase_scoring import compute_policy_score
from config.prepurchase_scoring_config import SCORING_CONFIG


class _Mock:
    """Duck-typed ClauseRiskAssessment for tests."""
    _D = {k: "Not Found" for k in [
        "waiting_period","pre_existing_disease","room_rent_sublimit",
        "disease_specific_caps","co_payment","exclusions_clarity",
        "claim_procedure_complexity","sublimits_and_caps",
        "restoration_benefit","transparency_of_terms",
    ]}
    def __init__(self, **kw):
        for k, v in {**self._D, **kw}.items():
            setattr(self, k, v)
    def model_dump(self):
        return {k: getattr(self, k) for k in self._D}


def _rate(s):
    st = float(SCORING_CONFIG.get("rating_strong_threshold",   72))
    mo = float(SCORING_CONFIG.get("rating_moderate_threshold", 48))
    return "Strong" if s >= st else "Moderate" if s >= mo else "Weak"


BENCHMARKS = [
    {
        "name": "HDFC Ergo Optima Secure (best-in-class)",
        "c": _Mock(
            room_rent_sublimit="Low Risk", co_payment="Low Risk",
            pre_existing_disease="Moderate Risk", waiting_period="Moderate Risk",
            disease_specific_caps="Low Risk", sublimits_and_caps="Low Risk",
            claim_procedure_complexity="Moderate Risk", exclusions_clarity="Low Risk",
            restoration_benefit="Low Risk", transparency_of_terms="Low Risk",
        ),
        "comp": {"compliance_score": 7},
        "min": 78, "max": 90, "rating": "Strong",
    },
    {
        "name": "Niva Bupa Reassure (good digital policy)",
        "c": _Mock(
            room_rent_sublimit="Low Risk", co_payment="Low Risk",
            pre_existing_disease="Moderate Risk", waiting_period="Moderate Risk",
            disease_specific_caps="Moderate Risk", sublimits_and_caps="Low Risk",
            claim_procedure_complexity="Low Risk", exclusions_clarity="Low Risk",
            restoration_benefit="Low Risk", transparency_of_terms="Low Risk",
        ),
        "comp": {"compliance_score": 6},
        "min": 72, "max": 88, "rating": "Strong",
    },
    {
        "name": "Star Health Comprehensive (room rent cap)",
        "c": _Mock(
            room_rent_sublimit="High Risk", co_payment="Moderate Risk",
            pre_existing_disease="Moderate Risk", waiting_period="Moderate Risk",
            disease_specific_caps="Moderate Risk", sublimits_and_caps="Moderate Risk",
            claim_procedure_complexity="Moderate Risk", exclusions_clarity="Low Risk",
            restoration_benefit="Low Risk", transparency_of_terms="Low Risk",
        ),
        "comp": {"compliance_score": 6},
        "min": 58, "max": 74, "rating": "Moderate",
    },
    {
        "name": "Care Health Advantage (all Moderate)",
        "c": _Mock(
            room_rent_sublimit="Moderate Risk", co_payment="Moderate Risk",
            pre_existing_disease="Moderate Risk", waiting_period="Moderate Risk",
            disease_specific_caps="Moderate Risk", sublimits_and_caps="Moderate Risk",
            claim_procedure_complexity="Moderate Risk", exclusions_clarity="Moderate Risk",
            restoration_benefit="Moderate Risk", transparency_of_terms="Moderate Risk",
        ),
        "comp": {"compliance_score": 5},
        "min": 48, "max": 64, "rating": "Moderate",
    },
    {
        "name": "PSU Policy (all High Risk)",
        "c": _Mock(
            room_rent_sublimit="High Risk", co_payment="High Risk",
            pre_existing_disease="High Risk", waiting_period="High Risk",
            disease_specific_caps="High Risk", sublimits_and_caps="High Risk",
            claim_procedure_complexity="High Risk", exclusions_clarity="High Risk",
            restoration_benefit="High Risk", transparency_of_terms="High Risk",
        ),
        "comp": {"compliance_score": 1},
        "min": 8, "max": 38, "rating": "Weak",
    },
    {
        "name": "All Not Found (ambiguous text)",
        "c": _Mock(),
        "comp": {"compliance_score": 3},
        "min": 38, "max": 60, "rating": "Moderate",
    },
    {
        "name": "Senior Citizen Plan (co-pay heavy)",
        "c": _Mock(
            room_rent_sublimit="Moderate Risk", co_payment="High Risk",
            pre_existing_disease="High Risk", waiting_period="High Risk",
            disease_specific_caps="High Risk", sublimits_and_caps="Moderate Risk",
            claim_procedure_complexity="Moderate Risk", exclusions_clarity="Moderate Risk",
            restoration_benefit="Moderate Risk", transparency_of_terms="Moderate Risk",
        ),
        "comp": {"compliance_score": 4},
        "min": 28, "max": 48, "rating": "Weak",
    },
]


def run_calibration():
    print("\n" + "═" * 70)
    print("  CAREBRIDGE SCORING CALIBRATION")
    print("═" * 70)
    all_pass = True
    for b in BENCHMARKS:
        r  = compute_policy_score(b["c"], b["comp"])
        s  = round(float(r["adjusted_score"]))
        rt = _rate(s)
        sp = b["min"] <= s <= b["max"]
        rp = rt == b["rating"]
        ok = sp and rp
        if not ok: all_pass = False
        icon = "✅" if ok else "❌"
        print(f"\n{icon}  {b['name']}")
        print(f"   Score : {s:3d}  (expected {b['min']}–{b['max']})  {'✓' if sp else '✗'}")
        print(f"   Rating: {rt:<10} (expected {b['rating']})  {'✓' if rp else '✗'}")
        print(f"   Debug : hr={r['high_risk_count']}/8")
    print("\n" + "═" * 70)
    print("  " + ("ALL PASSED ✅" if all_pass else "SOME FAILED ❌"))
    print("═" * 70 + "\n")
    return all_pass


# pytest-compatible individual tests
def test_hdfc():
    b = BENCHMARKS[0]; r = compute_policy_score(b["c"], b["comp"])
    s = round(float(r["adjusted_score"]))
    assert b["min"] <= s <= b["max"], f"scored {s}"

def test_niva():
    b = BENCHMARKS[1]; r = compute_policy_score(b["c"], b["comp"])
    s = round(float(r["adjusted_score"]))
    assert b["min"] <= s <= b["max"], f"scored {s}"

def test_star():
    b = BENCHMARKS[2]; r = compute_policy_score(b["c"], b["comp"])
    s = round(float(r["adjusted_score"]))
    assert b["min"] <= s <= b["max"], f"scored {s}"

def test_care():
    b = BENCHMARKS[3]; r = compute_policy_score(b["c"], b["comp"])
    s = round(float(r["adjusted_score"]))
    assert b["min"] <= s <= b["max"], f"scored {s}"

def test_psu():
    b = BENCHMARKS[4]; r = compute_policy_score(b["c"], b["comp"])
    s = round(float(r["adjusted_score"]))
    assert b["min"] <= s <= b["max"], f"scored {s}"

def test_not_found_moderate():
    b = BENCHMARKS[5]; r = compute_policy_score(b["c"], b["comp"])
    s = round(float(r["adjusted_score"]))
    assert 38 <= s <= 60, f"Not Found scored {s} — treating uncertainty as High Risk"

def test_senior():
    b = BENCHMARKS[6]; r = compute_policy_score(b["c"], b["comp"])
    s = round(float(r["adjusted_score"]))
    assert b["min"] <= s <= b["max"], f"scored {s}"


if __name__ == "__main__":
    run_calibration()