import os
from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database

from config import MONGODB_DB, MONGODB_URI


@lru_cache(maxsize=1)
def get_client() -> MongoClient | None:
    uri = MONGODB_URI
    if not uri:
        return None
    return MongoClient(uri, serverSelectionTimeoutMS=5000)


def get_db() -> Database | None:
    client = get_client()
    if client is None:
        return None
    return client[MONGODB_DB]


def mongo_available() -> bool:
    try:
        db = get_db()
        if db is None:
            return False
        db.command("ping")
        return True
    except Exception:
        return False
