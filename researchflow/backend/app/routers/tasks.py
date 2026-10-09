"""Tasks: kanban list/create/move."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db, new_id
from ..security import get_current_user
from ..services import activity, realtime
from . import common
from .projects import STATUS_LABEL

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

VALID_STATUS = set(STATUS_LABEL)
VALID_PRIORITY = {"High", "Medium", "Low"}


class TaskIn(BaseModel):
    projectId: str
    title: str = Field(min_length=3, max_length=200)
    desc: str = ""
    assignee: str = "me"
    priority: str = "Medium"
    due: str = ""
    status: str = "todo"
    milestone: str = ""


@router.get("")
async def list_tasks(projectId: str = "", user: dict = Depends(get_current_user)):
    db = get_db()
    if projectId:
        await common.get_project_or_404(db, projectId, user)
        q = {"projectId": projectId}
    else:
        pids = await common.visible_pids(db, user)
        if not pids:
            return []
        q = {"projectId": {"$in": pids}}
    return common.as_me_all(await db.tasks.find(q).to_list(length=1000), user["_id"])


@router.post("", status_code=201)
async def create_task(body: TaskIn, user: dict = Depends(get_current_user)):
    if body.status not in VALID_STATUS:
        raise HTTPException(400, f"status must be one of {sorted(VALID_STATUS)}.")
    if body.priority not in VALID_PRIORITY:
        raise HTTPException(400, "priority must be High, Medium or Low.")
    db = get_db()
    p = await common.get_project_or_404(db, body.projectId, user)
    assignee = common.resolve_me(body.assignee, user["_id"])
    doc = {
        "_id": new_id("t"),
        "projectId": body.projectId,
        "title": body.title,
        "desc": body.desc,
        "assignee": assignee,
        "priority": body.priority,
        "due": body.due,
        "status": body.status,
        "milestone": body.milestone,
        "comments": 0,
        "attachments": 0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.tasks.insert_one(doc)
    await activity.log_activity(db, user["_id"], "created task", doc["title"], body.projectId)
    await activity.admin_log(db, user["_id"], "task_created", doc["title"])
    await activity.notify(
        db,
        [a for a in {assignee} if a != user["_id"]],
        "task",
        "Task assigned",
        f"{user['name']} assigned “{doc['title']}” to you.",
        skip=user["_id"],
        project_id=body.projectId,
        email=True,
    )
    await realtime.hub.publish(f"project:{body.projectId}", {"type": "task", "data": doc})
    return common.as_me(doc, user["_id"])


@router.patch("/{tid}")
async def patch_task(tid: str, body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    t = await db.tasks.find_one({"_id": tid})
    if not t:
        raise HTTPException(404, "Task not found.")
    if not common.can_access(user, await db.projects.find_one({"_id": t["projectId"]})):
        raise HTTPException(403, "You are not a member of this project.")

    update = {}
    for k in ("title", "desc", "due", "milestone"):
        if k in body and body[k] is not None:
            update[k] = body[k]
    if "priority" in body and body["priority"] in VALID_PRIORITY:
        update["priority"] = body["priority"]
    if "assignee" in body:
        update["assignee"] = common.resolve_me(body["assignee"], user["_id"])
    if "status" in body:
        if body["status"] not in VALID_STATUS:
            raise HTTPException(400, f"status must be one of {sorted(VALID_STATUS)}.")
        update["status"] = body["status"]

    if not update:
        return common.as_me(t, user["_id"])
    update["updatedAt"] = datetime.now(timezone.utc).isoformat()
    await db.tasks.update_one({"_id": tid}, {"$set": update})
    t = await db.tasks.find_one({"_id": tid})

    pid = t["projectId"]
    new_status = t.get("status")
    if "status" in update and new_status != body["status"]:
        if new_status == "completed":
            await activity.log_activity(db, user["_id"], "completed", t["title"], pid)
            await activity.admin_log(db, user["_id"], "task_completed", t["title"])
        else:
            await activity.log_activity(db, user["_id"], f"moved “{t['title']}” to", STATUS_LABEL[new_status], pid)
        await activity.notify(
            db,
            [u for u in {t.get("assignee")} - {user["_id"]} if u],
            "task",
            "Task updated",
            f"“{t['title']}” moved to {STATUS_LABEL[new_status]} by {user['name']}.",
            skip=user["_id"],
            project_id=pid,
        )
    await realtime.hub.publish(f"project:{pid}", {"type": "task", "data": t})
    return common.as_me(t, user["_id"])
