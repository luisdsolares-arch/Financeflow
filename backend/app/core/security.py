import hashlib
import hmac
import os
from base64 import b64decode, b64encode
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        _, iterations_str, salt_b64, digest_b64 = hashed_password.split("$")
        iterations = int(iterations_str)
        salt = b64decode(salt_b64.encode("utf-8"))
        expected_digest = b64decode(digest_b64.encode("utf-8"))
    except (ValueError, TypeError):
        return False

    computed = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(computed, expected_digest)


def get_password_hash(password: str) -> str:
    iterations = 600_000
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${b64encode(salt).decode('utf-8')}${b64encode(digest).decode('utf-8')}"


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
