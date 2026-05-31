import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import settings


def _build_fernet() -> Fernet:
    seed = hashlib.sha256(settings.encryption_key.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(seed)
    return Fernet(key)


def encrypt_value(raw_value: str) -> str:
    return _build_fernet().encrypt(raw_value.encode("utf-8")).decode("utf-8")


def decrypt_value(encrypted_value: str) -> str:
    return _build_fernet().decrypt(encrypted_value.encode("utf-8")).decode("utf-8")
