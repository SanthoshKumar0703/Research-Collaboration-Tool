"""Global search across the user's workspace (⌘K palette + API)."""
from fastapi import APIRouter, Depends, Query

from ..db import get_db
from ..security import get_current_user
from . import common

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def search(q: str = Query(min_length=1), user: dict = Depends(get_current_user)):
    db = get_db()
    ql = q.strip().lower()
    pids = await common.visible_pids(db, user)
    if not pids:
        return {"projects": [], "tasks": [], "documents": [], "experiments": [], "findings": [], "discussions": [], "people": []}
    inq = {"projectId": {"$in": pids}}

    def hit(text: str) -> bool:
        return ql in (text or "").lower()

    projects = [p for p in await db.projects.find({"_id": {"$in": pids}}).to_list(length=200) if hit(p.get("title")) or hit(p.get("desc"))][:5]
    tasks = [t for t in await db.tasks.find(inq).to_list(length=2000) if hit(t.get("title")) or hit(t.get("desc"))][:5]
    documents = [d for d in await db.documents.find(inq).to_list(length=2000) if hit(d.get("name"))][:5]
    experiments = [e for e in await db.experiments.find(inq).to_list(length=2000) if hit(e.get("title")) or hit(e.get("objective"))][:5]
    findings = [f for f in await db.findings.find(inq).to_list(length=2000) if hit(f.get("title")) or hit(f.get("desc"))][:5]
    discussions = [th for th in await db.discussions.find(inq).to_list(length=1000) if hit(th.get("title")) or hit(th.get("body"))][:5]
    users = [u for u in await db.users.find({}).to_list(length=300) if hit(u.get("name")) or hit(u.get("institution"))][:4]

    me = user["_id"]
    return {
        "projects": [{"id": p["_id"], "label": p.get("title", ""), "projectId": p["_id"]} for p in projects],
        "tasks": [{"id": t["_id"], "label": t.get("title", ""), "projectId": t.get("projectId")} for t in tasks],
        "documents": [{"id": d["_id"], "label": d.get("name", ""), "projectId": d.get("projectId")} for d in documents],
        "experiments": [{"id": e["_id"], "label": e.get("title", ""), "projectId": e.get("projectId")} for e in experiments],
        "findings": [{"id": f["_id"], "label": f.get("title", ""), "projectId": f.get("projectId")} for f in findings],
        "discussions": [{"id": th["_id"], "label": th.get("title", ""), "projectId": th.get("projectId")} for th in discussions],
        "people": [common.as_me(common.pub_user(u), me) for u in users],
    }
