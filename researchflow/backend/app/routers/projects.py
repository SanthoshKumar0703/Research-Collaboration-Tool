"""Projects + the bootstrap endpoint.

``GET /api/projects/bootstrap`` returns everything the app shell needs in one
call, shaped exactly like the frontend mock (id keys, 'me' for the current
user) so the same React components work in demo and API modes.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db, new_id
from ..security import get_current_user, require_staff
from ..services import activity, realtime
from . import common
from .analytics import global_analytics, project_analytics

router = APIRouter(prefix="/api/projects", tags=["projects"])

STATUS_LABEL = {"todo": "To Do", "in_progress": "In Progress", "review": "Review", "completed": "Completed"}


class ProjectIn(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    desc: str = ""
    objective: str = ""
    methodology: str = ""
    start: str = ""
    end: str = ""
    status: str = "Planning"
    priority: str = "Medium"
    category: str = ""
    tags: list[str] = []


class MemberIn(BaseModel):
    userId: str


@router.get("")
async def list_projects(user: dict = Depends(get_current_user)):
    db = get_db()
    q = {} if user.get("role") in ("supervisor", "admin") else {"members": user["_id"]}
    return common.as_me_all(await db.projects.find(q).to_list(length=200), user["_id"])


@router.post("", status_code=201)
async def create_project(body: ProjectIn, user: dict = Depends(require_staff())):
    db = get_db()
    doc = {
        "_id": new_id("p"),
        "title": body.title,
        "desc": body.desc,
        "objective": body.objective,
        "methodology": body.methodology,
        "start": body.start,
        "end": body.end,
        "status": body.status,
        "priority": body.priority,
        "category": body.category,
        "tags": body.tags,
        "progress": 0,
        "members": [user["_id"]],
    }
    await db.projects.insert_one(doc)
    await activity.log_activity(db, user["_id"], "created project", doc["title"], doc["_id"])
    await activity.admin_log(db, user["_id"], "project_created", doc["title"])
    return common.as_me(doc, user["_id"])


# ---------------------------------------------------------------------------
# Bootstrap: one call returns the whole workspace, mock-shaped.
# ---------------------------------------------------------------------------

@router.get("/bootstrap")
async def bootstrap(user: dict = Depends(get_current_user)):
    db = get_db()
    me = user["_id"]
    pid_q = {} if user.get("role") in ("supervisor", "admin") else {"members": me}

    projects = await db.projects.find(pid_q).to_list(length=200)
    pids = [p["_id"] for p in projects]

    async def coll(name: str, limit: int = 500):
        if not pids:
            return []
        q = {"projectId": {"$in": pids}}
        if name == "activity":
            return await db[name].find(q).sort("time", -1).to_list(length=limit)
        if name == "messages":
            return await db[name].find(q).sort("date", 1).to_list(length=limit)
        return await db[name].find(q).to_list(length=limit)

    (
        tasks,
        milestones,
        documents,
        experiments,
        findings,
        discussions,
        meetings,
        activity_docs,
        chats,
    ) = [
        await coll("tasks"),
        await coll("milestones"),
        await coll("documents"),
        await coll("experiments"),
        await coll("findings"),
        await coll("discussions"),
        await coll("meetings"),
        await coll("activity", 300),
        await coll("messages", 300),
    ]

    doc_ids = [d["_id"] for d in documents]
    doc_comments = await db.doc_comments.find({"docId": {"$in": doc_ids}}).sort("date", 1).to_list(length=1000) if doc_ids else []
    notifications = await db.notifications.find({"userId": me}).sort("time", -1).to_list(length=100)

    users = await db.users.find({}).to_list(length=300)

    # per-project analytics (computed from real activity/task/document data)
    analytics = {}
    for p in projects:
        try:
            analytics[p["_id"]] = await project_analytics(db, p["_id"])
        except Exception:
            analytics[p["_id"]] = None

    data = {
        "projects": common.as_me_all(projects, me),
        "tasks": common.as_me_all(tasks, me),
        "milestones": common.as_me_all(milestones, me),
        "documents": common.as_me_all(documents, me),
        "docComments": common.as_me_all(doc_comments, me),
        "experiments": common.as_me_all(experiments, me),
        "findings": common.as_me_all(findings, me),
        "discussions": common.as_me_all(discussions, me),
        "meetings": common.as_me_all(meetings, me),
        "notifications": [common.norm(n) for n in notifications],
        "activity": common.as_me_all(activity_docs, me),
        "chats": common.as_me_all(chats, me),
    }
    out = {
        "me": me,
        "users": [common.pub_user(u) for u in users],
        "data": data,
        "analytics": analytics,
        "globalAnalytics": await global_analytics(db) if user.get("role") in ("supervisor", "admin") else None,
    }
    return out


@router.get("/{pid}")
async def get_project(pid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    return common.as_me(p, user["_id"])


@router.patch("/{pid}")
async def patch_project(pid: str, body: dict, user: dict = Depends(require_staff())):
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    allowed = {"title", "desc", "objective", "methodology", "start", "end", "status", "priority", "category", "tags", "progress"}
    update = {k: v for k, v in body.items() if k in allowed}
    if update:
        await db.projects.update_one({"_id": pid}, {"$set": update})
        p = await db.projects.find_one({"_id": pid})
        await realtime.hub.publish(f"project:{pid}", {"type": "project", "data": p})
    return common.as_me(p, user["_id"])


@router.post("/{pid}/members", status_code=201)
async def add_member(pid: str, body: MemberIn, user: dict = Depends(require_staff())):
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    uid = common.resolve_me(body.userId, user["_id"])
    if uid not in p.get("members", []):
        target = await db.users.find_one({"_id": uid})
        if not target:
            raise HTTPException(404, "User not found.")
        await db.projects.update_one({"_id": pid}, {"$addToSet": {"members": uid}})
        await activity.log_activity(db, user["_id"], "added member", target["name"], pid)
        await activity.notify(db, [uid], "system", "Project invite", f"You were added to “{p['title']}” by {user['name']}.", skip=user["_id"], email=True)
    return {"ok": True}


@router.post("/{pid}/members/email", status_code=201)
async def add_member_by_email(pid: str, body: dict, user: dict = Depends(require_staff())):
    """Invite an existing account by email (used by the Team page invite box)."""
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    email = str(body.get("email", "")).lower()
    target = await db.users.find_one({"email": email})
    if not target:
        raise HTTPException(404, f"No account found for {email}. They must register (or be invited by an admin) first.")
    if target["_id"] not in p.get("members", []):
        await db.projects.update_one({"_id": pid}, {"$addToSet": {"members": target["_id"]}})
        await activity.log_activity(db, user["_id"], "added member", target["name"], pid)
        await activity.notify(db, [target["_id"]], "system", "Project invite", f"You were added to “{p['title']}” by {user['name']}.", skip=user["_id"], email=True)
    return {"ok": True}


