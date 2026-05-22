import json
import os
import uuid
from datetime import datetime, timezone

from config import HISTORY_FILE


def _ensure_file():
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    if not os.path.isfile(HISTORY_FILE):
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def load_all() -> list:
    _ensure_file()
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_entry(entry: dict) -> dict:
    _ensure_file()
    records = load_all()
    entry.setdefault("id", str(uuid.uuid4()))
    entry.setdefault(
        "created_at", datetime.now(timezone.utc).isoformat()
    )
    records.insert(0, entry)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(records[:200], f, indent=2)
    return entry


def get_entry(entry_id: str) -> dict | None:
    for row in load_all():
        if row.get("id") == entry_id:
            return row
    return None
