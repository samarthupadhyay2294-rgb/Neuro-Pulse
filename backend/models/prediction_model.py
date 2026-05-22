from datetime import datetime, timezone

from bson import ObjectId
from db.mongo import get_db


def _predictions():
    db = get_db()
    return db["predictions"] if db is not None else None


def save_prediction(user_id: str, payload: dict) -> dict | None:
    col = _predictions()
    if col is None:
        return None

    result = payload.get("result", {})
    doc = {
        "user_id": user_id,
        "symptoms": payload.get("symptoms", {}),
        "voice_features": payload.get("voice") or payload.get("voice_features"),
        "symptoms_only": payload.get("symptoms_only", False),
        "prediction": {
            "risk": result.get("risk_level", ""),
            "confidence": result.get("confidence_percent", 0),
            "ml_prediction": result.get("ml_prediction"),
            "recommendation": result.get("recommendation", ""),
            "symptom_summary": result.get("symptom_summary", ""),
            "voice_summary": result.get("voice_summary", ""),
            "assessment_type": result.get("assessment_type", ""),
        },
        "result": result,
        "audio_url": payload.get("audio_url", ""),
        "language": payload.get("language", "en"),
        "session_id": payload.get("session_id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    ins = col.insert_one(doc)
    doc["_id"] = ins.inserted_id
    doc["id"] = str(ins.inserted_id)
    return doc


def list_by_user(user_id: str, limit: int = 50) -> list:
    col = _predictions()
    if col is None:
        return []

    cursor = col.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    items = []
    for doc in cursor:
        items.append(_serialize(doc))
    return items


def find_by_id(prediction_id: str, user_id: str | None = None) -> dict | None:
    col = _predictions()
    if col is None:
        return None
    try:
        query = {"_id": ObjectId(prediction_id)}
        if user_id:
            query["user_id"] = user_id
        doc = col.find_one(query)
        return _serialize(doc) if doc else None
    except Exception:
        return None


def _serialize(doc: dict) -> dict:
    result = doc.get("result", doc.get("prediction", {}))
    if isinstance(result, dict) and "risk" in result and "risk_level" not in result:
        result = {**doc.get("result", {}), "risk_level": result.get("risk")}

    return {
        "id": str(doc["_id"]),
        "user_id": doc.get("user_id"),
        "symptoms": doc.get("symptoms", {}),
        "voice": doc.get("voice_features"),
        "voice_features": doc.get("voice_features"),
        "symptoms_only": doc.get("symptoms_only", False),
        "result": doc.get("result") or result,
        "prediction": doc.get("prediction", {}),
        "audio_url": doc.get("audio_url", ""),
        "created_at": doc.get("created_at"),
        "session_id": doc.get("session_id"),
    }
