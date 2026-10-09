"""Findings: evidence-backed results attached to experiments."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db, new_id
from ..security import get_current_user
from ..services import activity, realtime
from . import common

router = APIRouter(tags=["findings"])


class FindingIn(BaseModel):
    projectId: str
    experiment: str = ""
    title: str = Field(min_length=3, max_length=200)
    desc: str = ""
    evidence: str = ""
    result: str = ""
    interpretation: str = ""
    conclusion: str = ""
    files: list[str] = []


@router.get("/api/projects/{pid}/findings")
async def list_findings(pid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await common.get_project_or_404(db, pid, user)
    return common.as_me_all(await db.findings.find({"projectId": pid}).to_list(length=500), user["_id"])


@router.post("/api/projects/{pid}/findings", status_code=201)
async def create_finding(pid: str, body: FindingIn, user: dict = Depends(get_current_user)):
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    doc = {
        "_id": new_id("f"),
        "projectId": pid,
        "experiment": body.experiment,
        "title": body.title,
        "desc": body.desc,
        "evidence": body.evidence,
        "result": body.result,
        "interpretation": body.interpretation,
        "conclusion": body.conclusion,
        "files": body.files,
        "by": user["_id"],
        "date": datetime.now(timezone.utc).isoformat(),
    }
    await db.findings.insert_one(doc)
    await activity.log_activity(db, user["_id"], "added finding", doc["title"], pid)
    await activity.admin_log(db, user["_id"], "finding_added", doc["title"])
    members = [m for m in p.get("members", []) if m != user["_id"]]
    await activity.notify(db, members, "finding", "New finding added", doc["title"], project_id=pid)
    await realtime.hub.publish(f"project:{pid}", {"type": "finding", "data": doc})
    return common.as_me(doc, user["_id"])
