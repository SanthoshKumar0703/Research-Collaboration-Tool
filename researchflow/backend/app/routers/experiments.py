"""Experiments: record runs with parameters/metrics, update status/conclusion."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db, new_id
from ..security import get_current_user
from ..services import activity, realtime
from . import common

router = APIRouter(tags=["experiments"])

VALID_STATUS = {"Planned", "Running", "Completed", "Failed", "Under Review"}


class ExperimentIn(BaseModel):
    projectId: str
    title: str = Field(min_length=3, max_length=200)
    objective: str = ""
    hypothesis: str = ""
    methodology: str = ""
    dataset: str = ""
    parameters: list = []
    status: str = "Planned"
    date: str = ""


@router.get("/api/projects/{pid}/experiments")
async def list_experiments(pid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await common.get_project_or_404(db, pid, user)
    return common.as_me_all(await db.experiments.find({"projectId": pid}).to_list(length=500), user["_id"])


@router.post("/api/projects/{pid}/experiments", status_code=201)
async def create_experiment(pid: str, body: ExperimentIn, user: dict = Depends(get_current_user)):
    if body.status not in VALID_STATUS:
        raise HTTPException(400, f"status must be one of {sorted(VALID_STATUS)}.")
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    doc = {
        "_id": new_id("e"),
        "projectId": pid,
        "title": body.title,
        "objective": body.objective,
        "hypothesis": body.hypothesis,
        "methodology": body.methodology,
        "dataset": body.dataset,
        "parameters": body.parameters,
        "status": body.status,
        "date": body.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "metrics": [],
        "conclusion": "",
    }
    await db.experiments.insert_one(doc)
    await activity.log_activity(db, user["_id"], "recorded experiment", doc["title"], pid)
    await activity.admin_log(db, user["_id"], "experiment_created", doc["title"])
    members = [m for m in p.get("members", []) if m != user["_id"]]
    await activity.notify(db, members, "experiment", "Experiment recorded", f"{user['name']} recorded “{doc['title']}” ({doc['status']}).", project_id=pid)
    await realtime.hub.publish(f"project:{pid}", {"type": "experiment", "data": doc})
    return common.as_me(doc, user["_id"])


@router.patch("/api/experiments/{eid}")
async def patch_experiment(eid: str, body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    e = await db.experiments.find_one({"_id": eid})
    if not e:
        raise HTTPException(404, "Experiment not found.")
    p = await db.projects.find_one({"_id": e["projectId"]}, {"members": 1})
    if not p or not common.can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    update = {}
    for k in ("title", "objective", "hypothesis", "methodology", "dataset", "conclusion", "date"):
        if k in body and body[k] is not None:
            update[k] = body[k]
    if "parameters" in body:
        update["parameters"] = body["parameters"]
    if "metrics" in body:
        update["metrics"] = body["metrics"]
    if "status" in body:
        if body["status"] not in VALID_STATUS:
            raise HTTPException(400, f"status must be one of {sorted(VALID_STATUS)}.")
        update["status"] = body["status"]
    if update:
        await db.experiments.update_one({"_id": eid}, {"$set": update})
        e = await db.experiments.find_one({"_id": eid})
        await activity.log_activity(db, user["_id"], "updated experiment", f"{e['title']} → {e['status']}", e["projectId"])
        if e["status"] == "Under Review":
            staff_ids = {u["_id"] for u in await db.users.find({"role": {"$in": ["supervisor", "admin"]}}).to_list(length=200)}
            targets = [m for m in p.get("members", []) if m in staff_ids and m != user["_id"]]
            if targets:
                await activity.notify(db, targets, "experiment", "Experiment under review", f"“{e['title']}” is awaiting supervisor review.", project_id=e["projectId"])
        await realtime.hub.publish(f"project:{e['projectId']}", {"type": "experiment", "data": e})
    return common.as_me(e, user["_id"])
