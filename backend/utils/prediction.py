import joblib
import numpy as np
import pandas as pd

from config import FEATURE_COLS_PATHS, MODEL_PATHS, SCALER_PATHS
from utils.paths import first_existing
from utils.voice_defaults import get_default_voice_features

SYMPTOM_COLS = [
    "resting_tremor",
    "bradykinesia",
    "muscle_stiffness",
    "balance_problem",
    "walking_difficulty",
    "handwriting_change",
    "voice_change",
    "facial_expression_change",
    "daily_activity_difficulty",
    "sleep_disorder",
    "smell_loss",
    "rigidity_issue",
]

VOICE_COLS = ["jitter", "shimmer", "fo", "nhr", "hnr"]

_model = None
_scaler = None
_feature_cols = None


def _load_artifacts():
    global _model, _scaler, _feature_cols
    if _model is None:
        _model = joblib.load(first_existing(MODEL_PATHS))
        _scaler = joblib.load(first_existing(SCALER_PATHS))
        _feature_cols = joblib.load(first_existing(FEATURE_COLS_PATHS))


def build_full_answers(
    symptoms: dict, voice: dict | None = None, symptoms_only: bool = False
) -> tuple[dict, bool]:
    """Merge symptoms with voice features. Returns (answers, voice_was_provided)."""
    answers = {c: int(symptoms[c]) for c in SYMPTOM_COLS}
    voice_provided = (
        not symptoms_only
        and voice is not None
        and all(k in voice for k in VOICE_COLS)
    )

    if voice_provided:
        for k in VOICE_COLS:
            answers[k] = float(voice[k])
    else:
        answers.update(get_default_voice_features())

    return answers, voice_provided


def predict_risk(answers: dict, voice_provided: bool = True) -> dict:
    _load_artifacts()

    vec = pd.DataFrame([[answers[c] for c in _feature_cols]], columns=_feature_cols)
    vec_sc = _scaler.transform(vec)

    pred = int(_model.predict(vec_sc)[0])
    confidence = float(_model.predict_proba(vec_sc)[0][1])
    symptom_score = int(sum(int(answers[c]) for c in SYMPTOM_COLS))

    if confidence < 0.40 and symptom_score <= 10:
        risk = "Low Risk"
        msg = (
            "Your results suggest LOW risk of Parkinson disease. "
            "Continue routine check-ups and monitor any symptom changes."
        )
    elif confidence < 0.65 or symptom_score <= 22:
        risk = "Medium Risk"
        msg = (
            "Your results suggest MEDIUM risk. "
            "We recommend consulting a neurologist for clinical evaluation. "
            "Early detection significantly improves outcomes."
        )
    else:
        risk = "High Risk"
        msg = (
            "Your results suggest HIGH risk of Parkinson disease. "
            "Please consult a neurologist or movement disorder specialist promptly. "
            "This is a screening tool only — clinical diagnosis is essential."
        )

    return {
        "ml_prediction": pred,
        "ml_confidence": round(confidence, 4),
        "confidence_percent": round(confidence * 100, 1),
        "symptom_score": symptom_score,
        "risk_level": risk,
        "recommendation": msg,
        "symptom_summary": _symptom_summary(answers),
        "voice_summary": _voice_summary(answers, voice_provided),
        "voice_included": voice_provided,
        "assessment_type": "symptoms_and_voice" if voice_provided else "symptoms_only",
    }


def _symptom_summary(answers: dict) -> str:
    elevated = [
        c.replace("_", " ").title()
        for c in SYMPTOM_COLS
        if int(answers.get(c, 0)) >= 2
    ]
    if not elevated:
        return "No severely reported symptoms in the questionnaire."
    return "Notable symptoms: " + ", ".join(elevated[:6]) + (
        f" (+{len(elevated) - 6} more)" if len(elevated) > 6 else ""
    )


def _voice_summary(answers: dict, voice_provided: bool = True) -> str:
    if not voice_provided:
        return (
            "Voice analysis was not provided. Risk estimate is based on your "
            "12 symptom questionnaire responses only."
        )
    parts = []
    for key in VOICE_COLS:
        val = answers.get(key)
        if val is not None:
            parts.append(f"{key}={round(float(val), 4)}")
    return "Voice biomarkers: " + ", ".join(parts) if parts else "Voice analysis pending."
