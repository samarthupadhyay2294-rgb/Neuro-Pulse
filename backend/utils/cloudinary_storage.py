import os

from config import (
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
)


def cloudinary_configured() -> bool:
    return bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)


def upload_audio_file(local_path: str, public_id: str | None = None) -> str | None:
    if not cloudinary_configured():
        return None

    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True,
        )
        result = cloudinary.uploader.upload(
            local_path,
            resource_type="video",
            folder="neuro_pulse/audio",
            public_id=public_id,
        )
        return result.get("secure_url")
    except Exception:
        return None
