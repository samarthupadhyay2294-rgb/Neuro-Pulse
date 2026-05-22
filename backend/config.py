import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
REPORTS_FOLDER = os.path.join(BASE_DIR, "reports", "output")
HISTORY_FILE = os.path.join(BASE_DIR, "data", "history.json")

MODEL_PATHS = [
    os.path.join(ROOT_DIR, "parkinsons_model.pkl"),
    os.path.join(BASE_DIR, "models", "parkinsons_model.pkl"),
]
SCALER_PATHS = [
    os.path.join(ROOT_DIR, "parkinsons_scaler.pkl"),
    os.path.join(BASE_DIR, "models", "parkinsons_scaler.pkl"),
]
FEATURE_COLS_PATHS = [
    os.path.join(ROOT_DIR, "feature_cols.pkl"),
    os.path.join(BASE_DIR, "models", "feature_cols.pkl"),
]

ALLOWED_EXTENSIONS = {"wav", "mp3", "m4a", "webm", "ogg"}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024

# Auth & database
SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-in-production")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
JWT_TOKEN_LOCATION = ["headers"]
JWT_HEADER_NAME = "Authorization"
JWT_HEADER_TYPE = "Bearer"

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB = os.getenv("MONGODB_DB", "neuro_pulse")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "Neuro Pulse <noreply@neuropulse.app>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

DISCLAIMER = (
    "This AI-based system is intended only for early screening and educational "
    "purposes and should not be considered a professional medical diagnosis. "
    "Users should consult certified healthcare professionals for proper medical "
    "evaluation and treatment."
)

VOICE_PROMPT = (
    "Today is a beautiful day and I feel healthy and energetic."
)
