import logging
import secrets
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field

from ..config import settings
from ..db import get_db
from ..security import create_token, get_current_user, hash_password, issue_otp, verify_password, verify_otp
from ..services import activity, email

log = logging.getLogger("rf.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = "researcher"  # researcher | supervisor (admin is provisioned by admins)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class OtpIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)


class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=20)
    password: str = Field(min_length=8)


@router.post("/register", status_code=201)
async def register(body: RegisterIn):
    db = get_db()
    if body.role not in ("researcher", "supervisor"):
        raise HTTPException(400, "Public registration is for researchers and supervisors. Admin accounts are provisioned by platform administrators.")
    exists = await db.users.find_one({"email": body.email.lower()})
    if exists:
        raise HTTPException(409, "An account with this email already exists. Try signing in.")
    from ..db import new_id

    user = {
        "_id": new_id("u"),
        "name": body.name.strip(),
        "email": body.email.lower(),
        "password": hash_password(body.password),
        "role": body.role,
        "dept": "",
        "institution": "",
        "interests": [],
        "joined": datetime.now(timezone.utc).isoformat(),
        "status": "active",
        "avatar": None,
    }
    await db.users.insert_one(user)
    await activity.admin_log(db, user["_id"], "user_registered", user["name"])
    otp = await issue_otp(body.email, "login")
    await email.send_email(body.email, "Verify your ResearchFlow account", email.otp_email_html(body.email, otp.get("code", "••••••")))
    out = {"message": "Account created. Verification code sent by email.", "email": body.email}
    if settings.otp_debug:
        out["debug_code"] = otp.get("code")
    return out


@router.post("/login")
async def login(body: LoginIn):
    db = get_db()
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user.get("password", "")):
        # constant-time-ish: still hash when missing to avoid timing oracle
        if not user:
            verify_password(body.password, hash_password("invalid"))
        raise HTTPException(401, "Invalid email or password.")
    if user.get("status") != "active":
        raise HTTPException(403, "This account has been suspended. Contact your administrator.")
    otp = await issue_otp(body.email, "login")
    await email.send_email(body.email, "Sign in to ResearchFlow", email.otp_email_html(body.email, otp.get("code", "••••••")))
    out = {"message": "Verification code sent by email.", "email": body.email, "ttl": settings.otp_ttl_minutes * 60}
    if settings.otp_debug:
        out["debug_code"] = otp.get("code")
    return out


@router.post("/otp/verify")
async def otp_verify(body: OtpIn):
    if not await verify_otp(body.email, body.code, "login"):
        raise HTTPException(400, "The code is invalid, expired, or has too many attempts. Request a new code below.")
    db = get_db()
    user = await db.users.find_one({"email": body.email.lower()}, {"password": 0})
    token = create_token(user)
    return {"access_token": token, "token_type": "bearer", "user": _pub(user)}


@router.post("/otp/resend")
async def otp_resend(body: OtpIn):
    db = get_db()
    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        raise HTTPException(404, "No account found for this email.")
    otp = await issue_otp(body.email, "login")
    await email.send_email(body.email, "Sign in to ResearchFlow", email.otp_email_html(body.email, otp.get("code", "••••••")))
    out = {"message": "A new code has been sent."}
    if settings.otp_debug:
        out["debug_code"] = otp.get("code")
    return out


@router.post("/forgot-password")
async def forgot(body: ForgotPasswordIn):
    db = get_db()
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        token = secrets.token_urlsafe(24)
        await db.reset_tokens.replace_one(
            {"_id": user["_id"]},
            {
                "_id": user["_id"],
                "token": hash_password(token),
                "expires": datetime.now(timezone.utc).timestamp() + 30 * 60,
            },
            upsert=True,
        )
        base = settings.app_url.rstrip("/")
        await email.send_email(body.email, "Reset your ResearchFlow password", f"<p>Open this link within 30 minutes to reset your password: {base}/forgot-password?t={token}</p>")
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordIn):
    db = get_db()
    reset = None
    for candidate in await db.reset_tokens.find({}).to_list(length=None):
        if verify_password(body.token, candidate.get("token", "")):
            reset = candidate
            break
    if not reset or datetime.now(timezone.utc).timestamp() > reset.get("expires", 0):
        raise HTTPException(400, "This reset link is invalid or expired. Request a new one.")
    await db.users.update_one({"_id": reset["_id"]}, {"$set": {"password": hash_password(body.password)}})
    await db.reset_tokens.delete_one({"_id": reset["_id"]})
    return {"message": "Password updated successfully."}


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return _pub(user)


# --- Google OAuth (authorization-code flow) ---

@router.get("/google")
async def google_start():
    if not settings.google_client_id:
        raise HTTPException(503, "Google sign-in is not configured on this deployment (set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    from urllib.parse import urlencode

    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(code: str = "", error: str = ""):
    if error:
        raise HTTPException(400, f"Google sign-in failed: {error}")
    if not code or not settings.google_client_id:
        raise HTTPException(400, "Missing authorization code.")
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect,
                "grant_type": "authorization_code",
            },
        )
        r.raise_for_status()
        access = r.json()["access_token"]
        info = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {access}"})
        info.raise_for_status()
        prof = info.json()
    db = get_db()
    email = prof.get("email", "").lower()
    user = await db.users.find_one({"email": email})
    if not user:
        from ..db import new_id

        user = {
            "_id": new_id("u"),
            "name": prof.get("name", email.split("@")[0]),
            "email": email,
            "password": None,  # SSO-only account
            "role": "researcher",
            "dept": "",
            "institution": "",
            "interests": [],
            "joined": datetime.now(timezone.utc).isoformat(),
            "status": "active",
            "avatar": prof.get("picture"),
        }
        await db.users.insert_one(user)
        await activity.admin_log(db, user["_id"], "user_registered_google", user["name"])
    token = create_token(user)
    return RedirectResponse(f"{settings.cors_origins.split(',')[0].strip()}/login?google_token={token}", 302)


def _pub(u: dict) -> dict:
    return {k: u.get(k) for k in ("_id", "name", "email", "role", "dept", "institution", "interests", "joined", "status", "avatar")}
