"""Notifications: list/read/read-all + Web Push subscription management."""
from fastapi import APIRouter, Depends, HTTPException

from ..db import get_db
from ..security import get_current_user
from ..services import push
from . import common

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(user: dict = Depends(get_current_user)):
    db = get_db()
    return [common.norm(n) for n in await db.notifications.find({"userId": user["_id"]}).sort("time", -1).to_list(length=100)]


@router.post("/{nid}/read")
async def mark_read(nid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.notifications.update_one({"_id": nid, "userId": user["_id"]}, {"$set": {"read": True}})
    if not res.matched_count:
        raise HTTPException(404, "Notification not found.")
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_many({"userId": user["_id"]}, {"$set": {"read": True}})
    return {"ok": True}


@router.post("/push-subscription", status_code=201)
async def subscribe(body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    sub = body.get("subscription") or {}
    endpoint = sub.get("endpoint")
    if not endpoint:
        raise HTTPException(400, "Missing subscription endpoint.")
    existing = await db.push_subscriptions.find_one({"endpoint": endpoint})
    if existing:
        await db.push_subscriptions.update_one({"endpoint": endpoint}, {"$set": {"userId": user["_id"], "subscription": sub}})
    else:
        await db.push_subscriptions.insert_one({"_id": endpoint, "userId": user["_id"], "subscription": sub})
    return {"ok": True, "vapidConfigured": push.configured()}


@router.delete("/push-subscription")
async def unsubscribe(body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.push_subscriptions.delete_many({"endpoint": body.get("endpoint")})
    return {"ok": True}


@router.get("/vapid-public-key")
async def vapid_key():
    return {"key": push.public_key(), "configured": push.configured()}
