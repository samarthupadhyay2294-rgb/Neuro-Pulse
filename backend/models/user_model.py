from datetime import datetime, timezone

from bson import ObjectId
from db.mongo import get_db, mongo_available


def _users():
    db = get_db()
    return db["users"] if db is not None else None


def _serialize(doc: dict) -> dict:
    if not doc:
        return {}
    out = {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "provider": doc.get("provider", "email"),
        "profile_image": doc.get("profile_image", ""),
        "created_at": doc.get("created_at"),
    }
    return out


def find_by_email(email: str) -> dict | None:
    col = _users()
    if col is None:
        return None
    return col.find_one({"email": email.lower().strip()})


def find_by_id(user_id: str) -> dict | None:
    col = _users()
    if col is None:
        return None
    try:
        return col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def create_user(
    name: str,
    email: str,
    password_hash: str | None = None,
    provider: str = "email",
    profile_image: str = "",
    google_id: str | None = None,
) -> dict | None:
    col = _users()
    if col is None:
        return None

    email = email.lower().strip()
    if find_by_email(email):
        return None

    doc = {
        "name": name.strip(),
        "email": email,
        "password": password_hash or "",
        "provider": provider,
        "profile_image": profile_image,
        "google_id": google_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def upsert_google_user(
    email: str,
    name: str,
    profile_image: str = "",
    google_id: str = "",
) -> dict | None:
    col = _users()
    if col is None:
        return None

    email = email.lower().strip()
    existing = find_by_email(email)
    if existing:
        col.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "name": name or existing.get("name"),
                    "profile_image": profile_image or existing.get("profile_image", ""),
                    "provider": "google",
                    "google_id": google_id or existing.get("google_id", ""),
                }
            },
        )
        return find_by_id(str(existing["_id"]))

    return create_user(
        name=name,
        email=email,
        password_hash=None,
        provider="google",
        profile_image=profile_image,
        google_id=google_id,
    )


def update_password(user_id: str, password_hash: str) -> bool:
    col = _users()
    if col is None:
        return False
    try:
        col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": password_hash}},
        )
        return True
    except Exception:
        return False


def user_to_public(doc: dict) -> dict:
    return _serialize(doc)


def require_mongo():
    if not mongo_available():
        raise RuntimeError(
            "MongoDB is not configured. Set MONGODB_URI in backend/.env"
        )
