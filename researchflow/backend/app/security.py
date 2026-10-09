"""Security primitives: password hashing (PBKDF2-SHA256), JWT, OTP, RBAC deps."""
import hashlib
import hmac
import secrets
import time
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, Header, HTTPException, status

from .config import settings
from .db import get_db

PBKDF2_ITERATIONS = 600_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iters, salt, hexd = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iters))
        return hmac.compare_digest(dk.hex(), hexd)
    except Exception:
        return False


def create_token(user: dict) -> str:
    payload = {
        "sub": user["_id"],
        "role": user.get("role", "researcher"),
        "name": user.get("name", ""),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired — please sign in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session token.")


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required.")
    payload = decode_token(authorization.split(" ", 1)[1].strip())
    db = get_db()
    user = await db.users.find_one({"_id": payload["sub"]}, {"password": 0})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account no longer exists.")
    if user.get("status") != "active":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been suspended. Contact your administrator.")
    return user


def require_roles(*roles: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You don't have permission to do that.")
        return user

    return checker


def require_staff():
    """Dependency: supervisor or admin."""
    return require_roles("supervisor", "admin")


def require_admin():
    """Dependency: admin only."""
    return require_roles("admin")


# --- OTP ---

def generate_otp() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(settings.otp_length))


def hash_otp(code: str) -> str:
    return hashlib.sha256(f"{code}:{settings.jwt_secret}".encode()).hexdigest()


async def issue_otp(email: str, kind: str = "login") -> dict:
    """Create/rotate an OTP for the email. Returns the otp document (with the
    plaintext code only when settings.otp_debug is on)."""
    db = get_db()
    code = generate_otp()
    doc = {
        "_id": f"{kind}:{email.lower()}",
        "email": email.lower(),
        "kind": kind,
        "code_hash": hash_otp(code),
        "expires": time.time() + settings.otp_ttl_minutes * 60,
        "attempts": 0,
        "created": datetime.now(timezone.utc).isoformat(),
    }
    await db.otp_codes.replace_one({"_id": doc["_id"]}, doc, upsert=True)
    if settings.otp_debug:
        doc["code"] = code  # dev only — never stored
    return doc


async def verify_otp(email: str, code: str, kind: str = "login") -> bool:
    db = get_db()
    doc = await db.otp_codes.find_one({"_id": f"{kind}:{email.lower()}"})
    if not doc:
        return False
    if time.time() > doc["expires"]:
        return False
    if doc["attempts"] >= settings.otp_max_attempts:
        return False
    if not hmac.compare_digest(doc["code_hash"], hash_otp(code.strip())):
        await db.otp_codes.update_one({"_id": doc["_id"]}, {"$inc": {"attempts": 1}})
        return False
    await db.otp_codes.delete_one({"_id": doc["_id"]})
    return True
