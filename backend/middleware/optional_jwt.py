from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request


def get_optional_user_id() -> str | None:
    """Return user id if valid JWT present, else None (guest mode)."""
    verify_jwt_in_request(optional=True)
    return get_jwt_identity()


def session_storage_key(user_id: str | None, session_id: str) -> str:
    owner = user_id if user_id else "guest"
    return f"{owner}:{session_id}"
