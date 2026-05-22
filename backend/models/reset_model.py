import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from db.mongo import get_db


def _resets():
    db = get_db()
    return db["password_resets"] if db is not None else None


def create_reset_token(email: str) -> str | None:
    col = _resets()
    if col is None:
        return None

    email = email.lower().strip()
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)

    col.delete_many({"email": email})
    col.insert_one(
        {
            "email": email,
            "token": token,
            "expires_at": expires.isoformat(),
            "used": False,
        }
    )
    return token


def consume_reset_token(token: str) -> str | None:
    """Returns email if valid, else None."""
    col = _resets()
    if col is None:
        return None

    doc = col.find_one({"token": token, "used": False})
    if not doc:
        return None

    expires = datetime.fromisoformat(doc["expires_at"].replace("Z", "+00:00"))
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires:
        return None

    col.update_one({"_id": doc["_id"]}, {"$set": {"used": True}})
    return doc["email"]
