import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import (
    FRONTEND_URL,
    SMTP_FROM,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
)


def smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def send_reset_email(to_email: str, reset_token: str) -> bool:
    if not smtp_configured():
        return False

    link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    body = f"""Hello,

You requested a password reset for Neuro Pulse.

Click the link below to reset your password (valid for 1 hour):
{link}

If you did not request this, ignore this email.

— Neuro Pulse Team
"""
    msg = MIMEMultipart()
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = "Reset your Neuro Pulse password"
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        return True
    except Exception:
        return False
