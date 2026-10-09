import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from ..db import get_db
from ..security import get_current_user, require_admin
from ..services import activity, storage

router = APIRouter(prefix="/api/users", tags=["users"])

MAX_AVATAR = 2 * 1024 * 1024


class ProfileIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    dept: str | None = None
    institution: str | None = None
    interests: list[str] | None = None
    bio: str | None = None


@router.get("/me/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    db = get_db()
    u = await db.users.find_one({"_id": user["_id"]}, {"password": 0})
    return u


@router.put("/me/profile")
async def update_profile(body: ProfileIn, user: dict = Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if "name" in update and not update["name"].strip():
        raise HTTPException(400, "Name cannot be empty.")
    if update:
        await db.users.update_one({"_id": user["_id"]}, {"$set": update})
        u = await db.users.find_one({"_id": user["_id"]}, {"password": 0})
        return u
    return {"ok": True}


@router.post("/me/avatar", status_code=201)
async def upload_avatar(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not (file.filename or "").lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")) and not (file.content_type or "").startswith("image/"):
        raise HTTPException(400, "Profile photos must be images (PNG, JPG, WebP, GIF).")
    data = await file.read()
    if len(data) > MAX_AVATAR:
        raise HTTPException(400, "Image is too large — keep it under 2 MB.")
    saved = storage.save_file(data, file.filename or "avatar.png", subdir="avatars")
    db = get_db()
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"avatar": saved["url"]}})
    return {"avatar": saved["url"]}


@router.delete("/me/avatar")
async def delete_avatar(user: dict = Depends(get_current_user)):
    db = get_db()
    u = await db.users.find_one({"_id": user["_id"]})
    if u.get("avatar"):
        storage.delete_file(u["avatar"])
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"avatar": None}})
    return {"ok": True}


@router.get("/directory")
async def directory(user: dict = Depends(get_current_user)):
    """Everyone the user collaborates with (scoped); staff see all users."""
    from . import common

    db = get_db()
    if user.get("role") in ("supervisor", "admin"):
        users = await db.users.find({}).to_list(length=300)
    else:
        pids = await common.visible_pids(db, user)
        member_ids: set[str] = set()
        for p in await db.projects.find({"_id": {"$in": pids}}, {"members": 1}).to_list(length=200):
            member_ids.update(p.get("members", []))
        users = await db.users.find({"_id": {"$in": list(member_ids)}}).to_list(length=200)
    return [common.pub_user(u) for u in users]
