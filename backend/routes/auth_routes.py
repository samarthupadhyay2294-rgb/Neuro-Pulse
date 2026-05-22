import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from models.reset_model import consume_reset_token, create_reset_token
from models.user_model import (
    create_user,
    find_by_email,
    find_by_id,
    require_mongo,
    update_password,
    upsert_google_user,
    user_to_public,
)
from utils.email_utils import send_reset_email, smtp_configured
from utils.google_auth import verify_google_id_token
from utils.password_utils import (
    check_password,
    hash_password,
    validate_password_strength,
)

auth_bp = Blueprint("auth", __name__)


def _email_valid(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or ""))


def _token_response(user_doc: dict):
    user_id = str(user_doc["_id"])
    token = create_access_token(identity=user_id)
    return jsonify(
        {
            "access_token": token,
            "token": token,
            "user": user_to_public(user_doc),
        }
    )


@auth_bp.route("/signup", methods=["POST"])
def signup():
    try:
        require_mongo()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm = data.get("confirm_password") or data.get("confirmPassword") or ""

    if not name or len(name) < 2:
        return jsonify({"error": "Please enter your full name."}), 400
    if not _email_valid(email):
        return jsonify({"error": "Invalid email address."}), 400
    if password != confirm:
        return jsonify({"error": "Passwords do not match."}), 400

    ok, msg = validate_password_strength(password)
    if not ok:
        return jsonify({"error": msg}), 400

    if find_by_email(email):
        return jsonify({"error": "An account with this email already exists."}), 409

    user = create_user(name, email, hash_password(password), provider="email")
    if not user:
        return jsonify({"error": "Could not create account."}), 500

    return _token_response(user), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        require_mongo()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = find_by_email(email)
    if not user:
        return jsonify({"error": "Invalid email or password."}), 401

    if user.get("provider") == "google" and not user.get("password"):
        return jsonify(
            {"error": "This account uses Google sign-in. Please continue with Google."}
        ), 401

    if not user.get("password") or not check_password(password, user["password"]):
        return jsonify({"error": "Invalid email or password."}), 401

    return _token_response(user)


@auth_bp.route("/google", methods=["POST"])
def google_login():
    try:
        require_mongo()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

    data = request.get_json(force=True) or {}
    id_token = data.get("id_token") or data.get("credential") or ""

    claims = verify_google_id_token(id_token)
    if not claims:
        return jsonify({"error": "Invalid Google token. Check GOOGLE_CLIENT_ID config."}), 401

    email = (claims.get("email") or "").lower()
    name = claims.get("name") or email.split("@")[0]
    picture = claims.get("picture", "")
    google_id = claims.get("sub", "")

    if not email:
        return jsonify({"error": "Google account has no email."}), 400

    user = upsert_google_user(email, name, picture, google_id)
    if not user:
        return jsonify({"error": "Could not create Google account."}), 500

    return _token_response(user)


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully."})


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = find_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user_to_public(user)})


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        require_mongo()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not _email_valid(email):
        return jsonify({"error": "Invalid email address."}), 400

    user = find_by_email(email)
    response = {
        "message": "If that email is registered, you will receive reset instructions shortly."
    }

    if user and user.get("password"):
        token = create_reset_token(email)
        if token:
            sent = send_reset_email(email, token)
            if not sent:
                response["dev_reset_token"] = token
                response["dev_note"] = (
                    "SMTP not configured. Use this token at /reset-password?token=..."
                )

    return jsonify(response)


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        require_mongo()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

    data = request.get_json(force=True) or {}
    token = data.get("token") or ""
    password = data.get("password") or ""
    confirm = data.get("confirm_password") or data.get("confirmPassword") or ""

    if password != confirm:
        return jsonify({"error": "Passwords do not match."}), 400

    ok, msg = validate_password_strength(password)
    if not ok:
        return jsonify({"error": msg}), 400

    email = consume_reset_token(token)
    if not email:
        return jsonify({"error": "Invalid or expired reset token."}), 400

    user = find_by_email(email)
    if not user:
        return jsonify({"error": "User not found."}), 404

    update_password(str(user["_id"]), hash_password(password))
    return jsonify({"message": "Password updated successfully. You can log in now."})
