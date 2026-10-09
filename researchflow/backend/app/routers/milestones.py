"""Milestones: list per project, create (staff), update."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db, new_id
from ..security import get_current_user, require_staff
from ..services import activity, realtime
from . import common

router = APIRouter(tags=["milestones"])

VALID_STATUS = {"Completed", "In Progress", "Not Started"}


class MilestoneIn(BaseModel):
    name: str = Field(min_length=3, max_length=160)
    desc: str = ""
    start: str = ""
    due: str = ""
    status: str = "Not Started"
    progress: int = Field(default=0, ge=0, le=100)


@router.get("/api/projects/{pid}/milestones")
async def list_milestones(pid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await common.get_project_or_404(db, pid, user)
    return common.as_me_all(await db.milestones.find({"projectId": pid}).sort("start", 1).to_list(length=200), user["_id"])


@router.post("/api/projects/{pid}/milestones", status_code=201)
async def create_milestone(pid: str, body: MilestoneIn, user: dict = Depends(require_staff())):
    if body.status not in VALID_STATUS:
        raise HTTPException(400, f"status must be one of {sorted(VALID_STATUS)}.")
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    doc = {
        "_id": new_id("m"),
        "projectId": pid,
        "name": body.name,
        "desc": body.desc,
        "start": body.start,
        "due": body.due,
        "status": body.status,
        "progress": body.progress,
    }
    await db.milestones.insert_one(doc)
    await activity.log_activity(db, user["_id"], "added milestone", body.name, pid)
    await realtime.hub.publish(f"project:{pid}", {"type": "milestone", "data": doc})
    return common.as_me(doc, user["_id"])


@router.patch("/api/milestones/{mid}")
async def patch_milestone(mid: str, body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    m = await db.milestones.find_one({"_id": mid})
    if not m:
        raise HTTPException(404, "Milestone not found.")
    p = await db.projects.find_one({"_id": m["projectId"]})
    if not p or not common.can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    update = {}
    for k in ("name", "desc", "start", "due", "status"):
        if k in body and body[k] is not None:
            if k == "status" and body[k] not in VALID_STATUS:
                raise HTTPException(400, f"status must be one of {sorted(VALID_STATUS)}.")
            update[k] = body[k]
    if "progress" in body and body["progress"] is not None:
        update["progress"] = max(0, min(100, int(body["progress"])))
    if update:
        await db.milestones.update_one({"_id": mid}, {"$set": update})
        m = await db.milestones.find_one({"_id": mid})
        await realtime.hub.publish(f"project:{m['projectId']}", {"type": "milestone", "data": m})
    return common.as_me(m, user["_id"])
