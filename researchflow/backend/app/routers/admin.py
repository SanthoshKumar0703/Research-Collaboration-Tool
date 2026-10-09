"""Admin: user management, audit log, settings KV, overview."""
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, EmailStr

from ..config import settings
from ..db import get_db, new_id
from ..security import get_current_user, hash_password, require_admin
from ..services import activity, email
from . import common

router = APIRouter(prefix="/api/admin", tags=["admin"])

VALID_ROLES = {"researcher", "supervisor", "admin"}


class InviteIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    role: str = "researcher"


class RoleIn(BaseModel):
    role: str


class SettingsIn(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    value: str = ""


@router.get("/users")
async def list_users(search: str = "", role: str = "", status: str = "", user: dict = Depends(require_admin())):
    db = get_db()
    q: dict = {}
    if role in VALID_ROLES:
        q["role"] = role
    if status in ("active", "suspended"):
        q["status"] = status
    users = await db.users.find(q).to_list(length=500)
    if search:
        s = search.lower()
        users = [u for u in users if s in (u.get("name", "") + u.get("email", "") + u.get("institution", "")).lower()]
    pids_by_user: dict[str, int] = {}
    for p in await db.projects.find({}, {"members": 1}).to_list(length=500):
        for m in p.get("members", []):
            pids_by_user[m] = pids_by_user.get(m, 0) + 1
    out = []
    for u in users:
        d = common.pub_user(u)
        d["projects"] = pids_by_user.get(u["_id"], 0)
        out.append(d)
    return out


@router.post("/users/invite", status_code=201)
async def invite_user(body: InviteIn, user: dict = Depends(require_admin())):
    if body.role not in VALID_ROLES:
        raise HTTPException(400, f"role must be one of {sorted(VALID_ROLES)}.")
    db = get_db()
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(409, "An account with this email already exists.")
    temp_password = secrets.token_urlsafe(9)
    doc = {
        "_id": new_id("u"),
        "name": body.name.strip(),
        "email": body.email.lower(),
        "password": hash_password(temp_password),
        "role": body.role,
        "dept": "",
        "institution": "",
        "interests": [],
        "joined": datetime.now(timezone.utc).isoformat(),
        "status": "active",
        "avatar": None,
    }
    await db.users.insert_one(doc)
    await activity.admin_log(db, user["_id"], "user_invited", f"{doc['name']} ({body.role})")
    await email.send_email(
        doc["email"],
        "You've been invited to ResearchFlow",
        f"<p>Hi {doc['name']},</p><p>{user['name']} invited you to join ResearchFlow as a <strong>{body.role}</strong>.</p>"
        f"<p>Use this temporary password to sign in, then change it after your first login:</p>"
        f"<div style='font-family:monospace;font-size:18px;letter-spacing:3px;background:#FAF7F1;padding:12px;border-radius:8px;text-align:center;margin:16px 0'>{temp_password}</div>"
        f"<p>Your email: {doc['email']}</p>",
    )
    out = common.pub_user(doc)
    if settings.otp_debug:
        out["temp_password"] = temp_password
    return out


@router.patch("/users/{uid}/role")
async def change_role(uid: str, body: RoleIn, user: dict = Depends(require_admin())):
    if body.role not in VALID_ROLES:
        raise HTTPException(400, f"role must be one of {sorted(VALID_ROLES)}.")
    db = get_db()
    target = await db.users.find_one({"_id": uid})
    if not target:
        raise HTTPException(404, "User not found.")
    if uid == user["_id"]:
        raise HTTPException(400, "You cannot change your own role.")
    await db.users.update_one({"_id": uid}, {"$set": {"role": body.role}})
    await activity.admin_log(db, user["_id"], "role_changed", f"{target['name']} → {body.role.title()}")
    await activity.notify(db, [uid], "system", "Role updated", f"Your role is now {body.role.title()} (changed by {user['name']}).")
    return {"ok": True}


@router.post("/users/{uid}/suspend")
async def suspend_user(uid: str, user: dict = Depends(require_admin())):
    db = get_db()
    target = await db.users.find_one({"_id": uid})
    if not target:
        raise HTTPException(404, "User not found.")
    if uid == user["_id"]:
        raise HTTPException(400, "You cannot suspend yourself.")
    await db.users.update_one({"_id": uid}, {"$set": {"status": "suspended"}})
    await activity.admin_log(db, user["_id"], "user_suspended", target["name"])
    await activity.notify(db, [uid], "system", "Account suspended", "Your ResearchFlow account has been suspended. Contact an administrator.")
    return {"ok": True}


@router.post("/users/{uid}/activate")
async def activate_user(uid: str, user: dict = Depends(require_admin())):
    db = get_db()
    target = await db.users.find_one({"_id": uid})
    if not target:
        raise HTTPException(404, "User not found.")
    await db.users.update_one({"_id": uid}, {"$set": {"status": "active"}})
    await activity.admin_log(db, user["_id"], "user_activated", target["name"])
    await activity.notify(db, [uid], "system", "Account reactivated", "Your ResearchFlow account is active again.")
    return {"ok": True}


@router.get("/logs")
async def logs(limit: int = Query(default=100, le=500), user: dict = Depends(require_admin())):
    db = get_db()
    docs = await db.admin_logs.find({}).sort("time", -1).to_list(length=limit)
    return [common.norm(d) for d in docs]


@router.get("/settings")
async def get_settings(user: dict = Depends(require_admin())):
    db = get_db()
    return [common.norm(s) for s in await db.settings.find({}).to_list(length=200)]


@router.put("/settings")
async def put_settings(body: SettingsIn, user: dict = Depends(require_admin())):
    db = get_db()
    key = body.key.strip()
    await db.settings.update_one({"key": key}, {"$set": {"key": key, "value": body.value, "updatedBy": user["_id"], "updated": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    await activity.admin_log(db, user["_id"], "settings_updated", f"{key} → {body.value[:40]}")
    return {"ok": True}


@router.get("/overview")
async def overview(user: dict = Depends(require_admin())):
    from .analytics import global_analytics

    g = await global_analytics(get_db())
    return {"users": await get_db().users.count_documents({}), **g["counts"], "storage": g["storage"], "roleDist": g["roleDist"]}
