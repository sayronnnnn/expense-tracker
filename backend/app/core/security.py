from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import settings

# bcrypt only uses the first 72 bytes of the password
_BCRYPT_MAX_BYTES = 72
_BCRYPT_ROUNDS = 12


def _password_bytes(plain: str) -> bytes:
    b = plain.encode("utf-8")
    if len(b) > _BCRYPT_MAX_BYTES:
        b = b[:_BCRYPT_MAX_BYTES]
    return b


def hash_password(plain: str) -> str:
    pw = _password_bytes(plain)
    hashed = bcrypt.hashpw(pw, bcrypt.gensalt(rounds=_BCRYPT_ROUNDS))
    return hashed.decode("ascii")


def verify_password(plain: str, hashed: str | None) -> bool:
    # Return False if hash is None or empty (e.g., OAuth users without passwords)
    if not hashed:
        return False
    pw = _password_bytes(plain)
    try:
        return bcrypt.checkpw(pw, hashed.encode("ascii"))
    except (ValueError, TypeError):
        # Invalid salt or corrupted hash
        return False


def create_access_token(sub: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
    payload = {"sub": str(sub), "email": email, "type": "access", "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(sub: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    payload = {"sub": str(sub), "email": email, "type": "refresh", "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
