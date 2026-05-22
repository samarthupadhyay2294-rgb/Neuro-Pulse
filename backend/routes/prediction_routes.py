import os
import uuid

from flask import Blueprint, jsonify, request, send_file
from werkzeug.utils import secure_filename

from config import ALLOWED_EXTENSIONS, DISCLAIMER, UPLOAD_FOLDER, VOICE_PROMPT
from feature_extraction.voice_features import extract_voice_features
from middleware.optional_jwt import get_optional_user_id, session_storage_key
from models.chat_model import append_messages, get_or_create_session
from models.prediction_model import find_by_id as find_prediction
from models.prediction_model import list_by_user, save_prediction
from reports.pdf_generator import generate_pdf_report
from utils.cloudinary_storage import cloudinary_configured, upload_audio_file
from utils.history_store import get_entry, save_entry
from utils.prediction import (
    SYMPTOM_COLS,
    VOICE_COLS,
    build_full_answers,
    predict_risk,
)
from utils.questions import ANSWER_OPTIONS, LANGUAGES, QUESTIONS
from utils.translate import get_localized_content

prediction_bp = Blueprint("prediction", __name__)

_sessions: dict[str, dict] = {}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@prediction_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "app": "Neuro Pulse"})


@prediction_bp.route("/questions", methods=["GET"])
def questions():
    lang = request.args.get("lang", "en")
    if lang == "en":
        return jsonify(
            {
                "questions": QUESTIONS,
                "answer_options": ANSWER_OPTIONS,
                "languages": LANGUAGES,
                "voice_prompt": VOICE_PROMPT,
                "disclaimer": DISCLAIMER,
            }
        )
    content = get_localized_content(lang)
    content["languages"] = LANGUAGES
    content["voice_prompt"] = VOICE_PROMPT
    content["disclaimer"] = DISCLAIMER
    return jsonify(content)


@prediction_bp.route("/predict-symptoms", methods=["POST"])
def predict_symptoms():
    user_id = get_optional_user_id()
    data = request.get_json(force=True) or {}
    sid = data.get("session_id") or str(uuid.uuid4())
    symptoms = data.get("symptoms") or data

    key = session_storage_key(user_id, sid)
    session = _sessions.setdefault(key, {"symptoms": {}, "voice": {}})
    for col in SYMPTOM_COLS:
        if col in symptoms:
            val = int(symptoms[col])
            if val not in (0, 1, 2, 3):
                return jsonify({"error": f"Invalid value for {col}"}), 400
            session["symptoms"][col] = val

    chat_session_id = None
    if user_id:
        chat_doc = get_or_create_session(user_id, data.get("chat_session_id"))
        chat_session_id = str(chat_doc["_id"]) if chat_doc else None

    complete = all(c in session["symptoms"] for c in SYMPTOM_COLS)
    return jsonify(
        {
            "session_id": sid,
            "chat_session_id": chat_session_id,
            "symptoms": session["symptoms"],
            "complete": complete,
            "authenticated": user_id is not None,
        }
    )


@prediction_bp.route("/chat/messages", methods=["POST"])
def save_chat_messages():
    user_id = get_optional_user_id()
    if not user_id:
        return jsonify(
            {
                "message": "Chat saved locally for guests. Sign in to sync to cloud.",
                "saved": 0,
            }
        )

    data = request.get_json(force=True) or {}
    session_id = data.get("chat_session_id")
    messages = data.get("messages") or []

    if not messages:
        return jsonify({"error": "No messages provided."}), 400

    if not session_id:
        doc = get_or_create_session(user_id)
        session_id = str(doc["_id"]) if doc else None

    if session_id and messages:
        append_messages(user_id, session_id, messages)

    return jsonify({"chat_session_id": session_id, "saved": len(messages)})


@prediction_bp.route("/upload-audio", methods=["POST"])
def upload_audio():
    user_id = get_optional_user_id()
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files["audio"]
    if not file.filename or not _allowed_file(file.filename):
        return jsonify({"error": "Invalid audio format. Use WAV, MP3, or M4A."}), 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    sid = request.form.get("session_id") or str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[1].lower()
    prefix = user_id or "guest"
    filename = secure_filename(f"{prefix}_{uuid.uuid4().hex}.{ext}")
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    audio_url = None
    if user_id:
        audio_url = upload_audio_file(path, public_id=f"{user_id}/{uuid.uuid4().hex}")
    if not audio_url:
        audio_url = f"/uploads/{filename}"

    key = session_storage_key(user_id, sid)
    session = _sessions.setdefault(key, {"symptoms": {}, "voice": {}})
    session["audio_path"] = path
    session["audio_url"] = audio_url

    return jsonify(
        {
            "session_id": sid,
            "audio_url": audio_url,
            "filename": filename,
            "cloudinary": cloudinary_configured() and user_id is not None,
        }
    )


@prediction_bp.route("/extract-features", methods=["POST"])
def extract_features():
    user_id = get_optional_user_id()
    data = request.get_json(force=True) or {}
    sid = data.get("session_id")
    key = session_storage_key(user_id, sid) if sid else None

    audio_path = data.get("audio_path")
    if key and key in _sessions and _sessions[key].get("audio_path"):
        audio_path = _sessions[key]["audio_path"]

    if not audio_path or not os.path.isfile(audio_path):
        return jsonify({"error": "Audio file not found. Upload audio first."}), 400

    try:
        features = extract_voice_features(audio_path)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    if key:
        _sessions[key]["voice"] = {k: features[k] for k in VOICE_COLS}

    return jsonify({"session_id": sid, "features": features})


@prediction_bp.route("/predict", methods=["POST"])
def predict():
    user_id = get_optional_user_id()
    data = request.get_json(force=True) or {}
    sid = data.get("session_id")
    symptoms_only = bool(data.get("symptoms_only") or data.get("skip_voice"))
    key = session_storage_key(user_id, sid) if sid else None

    symptoms = {}
    voice = {}
    audio_url = data.get("audio_url", "")

    if key and key in _sessions:
        symptoms.update(_sessions[key].get("symptoms", {}))
        if _sessions[key].get("voice"):
            voice.update(_sessions[key]["voice"])
        audio_url = audio_url or _sessions[key].get("audio_url", "")

    if data.get("symptoms"):
        symptoms.update(data["symptoms"])
    if data.get("voice"):
        voice.update(data["voice"])

    missing_symptoms = [c for c in SYMPTOM_COLS if c not in symptoms]
    if missing_symptoms:
        return jsonify({"error": "Complete all 12 symptom questions first.", "missing": missing_symptoms}), 400

    has_voice = not symptoms_only and all(k in voice for k in VOICE_COLS)
    if symptoms_only:
        voice = None

    try:
        answers, voice_provided = build_full_answers(symptoms, voice, symptoms_only=not has_voice)
        result = predict_risk(answers, voice_provided=voice_provided)
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {exc}"}), 500

    payload = {
        "session_id": sid,
        "symptoms": {k: symptoms[k] for k in SYMPTOM_COLS},
        "voice": {k: answers[k] for k in VOICE_COLS} if voice_provided else None,
        "symptoms_only": not voice_provided,
        "result": result,
        "language": data.get("language", "en"),
        "audio_url": audio_url,
    }

    entry_id = None
    if user_id:
        mongo_entry = save_prediction(user_id, payload)
        entry_id = mongo_entry["id"] if mongo_entry else None

    if not entry_id:
        legacy = save_entry({**payload, "user_id": user_id})
        entry_id = legacy.get("id")

    return jsonify(
        {
            "session_id": sid,
            "id": entry_id,
            "result": result,
            "disclaimer": DISCLAIMER,
            "authenticated": user_id is not None,
        }
    )


@prediction_bp.route("/history", methods=["GET"])
def history():
    user_id = get_optional_user_id()
    if not user_id:
        return jsonify(
            {
                "history": [],
                "message": "Sign in to view cloud history, or use this device's local history.",
                "guest": True,
            }
        )

    items = list_by_user(user_id)
    if items:
        return jsonify({"history": items, "guest": False})

    from utils.history_store import load_all

    legacy = [h for h in load_all() if h.get("user_id") == user_id]
    return jsonify({"history": legacy or [], "guest": False})


@prediction_bp.route("/download-report/<entry_id>", methods=["GET"])
def download_report(entry_id):
    user_id = get_optional_user_id()
    entry = None
    if user_id:
        entry = find_prediction(entry_id, user_id)
    if not entry:
        entry = get_entry(entry_id)
    if not entry:
        return jsonify({"error": "Report not found"}), 404

    if user_id and entry.get("user_id") and entry.get("user_id") != user_id:
        return jsonify({"error": "Report not found"}), 404

    pdf_entry = {
        "id": entry.get("id", entry_id),
        "result": entry.get("result", entry.get("prediction", {})),
    }
    pdf_path = generate_pdf_report(pdf_entry)
    return send_file(
        pdf_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"neuro_pulse_report_{entry_id}.pdf",
    )
