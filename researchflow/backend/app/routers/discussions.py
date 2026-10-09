"""Discussions: threads, replies, emoji reactions (per-user), pin/resolve."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db, new_id
from ..security import get_current_user
from ..services import activity, realtime
from . import common

router = APIRouter(tags=["discussions"])


class ThreadIn(BaseModel):
    projectId: str
    title: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=3)


class ReplyIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class ReactIn(BaseModel):
    emoji: str = Field(min_length=1, max_length=8)


@router.get("/api/projects/{pid}/discussions")
async def list_discussions(pid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await common.get_project_or_404(db, pid, user)
    return common.as_me_all(await db.discussions.find({"projectId": pid}).to_list(length=300), user["_id"])


@router.post("/api/projects/{pid}/discussions", status_code=201)
async def create_thread(pid: str, body: ThreadIn, user: dict = Depends(get_current_user)):
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    doc = {
        "_id": new_id("th"),
        "projectId": pid,
        "title": body.title,
        "body": body.body,
        "by": user["_id"],
        "date": datetime.now(timezone.utc).isoformat(),
        "pinned": False,
        "resolved": False,
        "replies": [],
    }
    await db.discussions.insert_one(doc)
    await activity.log_activity(db, user["_id"], "started discussion", f"“{body.title}”", pid)
    members = [m for m in p.get("members", []) if m != user["_id"]]
    await activity.notify(db, members, "discussion", "New discussion", f"{user['name']} started “{body.title}”.", project_id=pid)
    return common.as_me(doc, user["_id"])


@router.post("/api/discussions/{tid}/replies", status_code=201)
async def add_reply(tid: str, body: ReplyIn, user: dict = Depends(get_current_user)):
    db = get_db()
    th = await db.discussions.find_one({"_id": tid})
    if not th:
        raise HTTPException(404, "Discussion not found.")
    p = await db.projects.find_one({"_id": th["projectId"]}, {"members": 1})
    if not p or not common.can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    reply = {"id": new_id("r"), "by": user["_id"], "body": body.body, "date": datetime.now(timezone.utc).isoformat(), "reactors": {}}
    await db.discussions.update_one({"_id": tid}, {"$push": {"replies": reply}})
    th = await db.discussions.find_one({"_id": tid})
    await activity.log_activity(db, user["_id"], "replied in", f"“{th['title']}”", th["projectId"])
    if th.get("by") and th["by"] != user["_id"]:
        await activity.notify(db, [th["by"]], "discussion", f"New reply in “{th['title']}”", f"{user['name']}: “{body.body[:120]}”", project_id=th["projectId"])
    await realtime.hub.publish(f"project:{th['projectId']}", {"type": "discussion", "data": th})
    return common.as_me(reply, user["_id"])


@router.post("/api/discussions/{tid}/replies/{rid}/react")
async def react(tid: str, rid: str, body: ReactIn, user: dict = Depends(get_current_user)):
    db = get_db()
    th = await db.discussions.find_one({"_id": tid})
    if not th:
        raise HTTPException(404, "Discussion not found.")
    p = await db.projects.find_one({"_id": th["projectId"]}, {"members": 1})
    if not p or not common.can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    me = user["_id"]
    emoji = body.emoji[:8]
    found = [r for r in th.get("replies", []) if r.get("id") == rid]
    if not found:
        raise HTTPException(404, "Reply not found.")
    already = me in (found[0].get("reactors") or {}).get(emoji, [])
    # Toggle membership in the specific reply's reactors map
    replies = th.get("replies", [])
    count = 0
    for r in replies:
        if r.get("id") == rid:
            reactors = dict(r.get("reactors") or {})
            ids = list(reactors.get(emoji) or [])
            if me in ids:
                ids.remove(me)
            else:
                ids.append(me)
            reactors[emoji] = [i for i in ids if i]
            r["reactors"] = reactors
            count = len(ids)
    await db.discussions.update_one({"_id": tid}, {"$set": {"replies": replies}})
    return {"ok": True, "emoji": emoji, "count": count, "active": not already}


@router.patch("/api/discussions/{tid}")
async def patch_thread(tid: str, body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    th = await db.discussions.find_one({"_id": tid})
    if not th:
        raise HTTPException(404, "Discussion not found.")
    p = await db.projects.find_one({"_id": th["projectId"]}, {"members": 1})
    if not p or not common.can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    if "pinned" in body or "resolved" in body:
        allowed = user.get("role") in ("supervisor", "admin") or th.get("by") == user["_id"]
        if not allowed:
            raise HTTPException(403, "Only the thread author or a supervisor can change this flag.")
        update = {}
        if "pinned" in body:
            update["pinned"] = bool(body["pinned"])
        if "resolved" in body:
            update["resolved"] = bool(body["resolved"])
        await db.discussions.update_one({"_id": tid}, {"$set": update})
        th = await db.discussions.find_one({"_id": tid})
        await realtime.hub.publish(f"project:{th['projectId']}", {"type": "discussion", "data": th})
    return common.as_me(th, user["_id"])
