import os

from config import FIREBASE_PROJECT_ID, GOOGLE_CLIENT_ID


def verify_google_id_token(id_token: str) -> dict | None:
    """Verify Firebase/Google ID token; returns claims or None."""
    if not id_token:
        return None

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        request = google_requests.Request()
        audiences = [a for a in [GOOGLE_CLIENT_ID, FIREBASE_PROJECT_ID] if a]

        for aud in audiences:
            try:
                claims = google_id_token.verify_oauth2_token(
                    id_token, request, audience=aud
                )
                if claims.get("email"):
                    return claims
            except ValueError:
                continue

        if FIREBASE_PROJECT_ID:
            try:
                import firebase_admin
                from firebase_admin import auth as firebase_auth
                from firebase_admin import credentials

                if not firebase_admin._apps:
                    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
                    if cred_path and os.path.isfile(cred_path):
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred)
                    else:
                        firebase_admin.initialize_app(
                            options={"projectId": FIREBASE_PROJECT_ID}
                        )
                return firebase_auth.verify_id_token(id_token)
            except Exception:
                pass
    except Exception:
        pass

    return None
