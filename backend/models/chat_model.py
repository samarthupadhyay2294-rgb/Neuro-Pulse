from datetime import datetime, timezone

from bson import ObjectId
from db.mongo import get_db


def _chats():
    db = get_db()
    return db["chat_sessions"] if db is not None else None


def get_or_create_session(user_id: str, session_id: str | None = None) -> dict | None:
    col = _chats()
    if col is None:
        return None

    if session_id:
        try:
            doc = col.find_one(
                {"_id": ObjectId(session_id), "user_id": user_id}
            )
            if doc:
                return doc
        except Exception:
            pass

    doc = {
        "user_id": user_id,
        "messages": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    ins = col.insert_one(doc)
    doc["_id"] = ins.inserted_id
    return doc


def append_messages(user_id: str, session_id: str, messages: list) -> dict | None:
    col = _chats()
    if col is None:
        return None

    try:
        oid = ObjectId(session_id)
    except Exception:
        return None

    col.update_one(
        {"_id": oid, "user_id": user_id},
        {
            "$push": {"messages": {"$each": messages}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
        },
    )
    return col.find_one({"_id": oid})


def list_sessions(user_id: str, limit: int = 20) -> list:
    col = _chats()
    if col is None:
        return []

    cursor = col.find({"user_id": user_id}).sort("updated_at", -1).limit(limit)
    out = []
    for doc in cursor:
        out.append(
            {
                "id": str(doc["_id"]),
                "message_count": len(doc.get("messages", [])),
                "updated_at": doc.get("updated_at"),
                "created_at": doc.get("created_at"),
            }
        )
    return out


def get_messages(user_id: str, session_id: str) -> list:
    col = _chats()
    if col is None:
        return []
    try:
        doc = col.find_one({"_id": ObjectId(session_id), "user_id": user_id})
        return doc.get("messages", []) if doc else []
    except Exception:
        return []
