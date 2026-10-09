"""Meetings: schedule, save notes + actions."""
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..db import get_db, new_id
from ..security import get_current_user
from ..services import activity, realtime
from ..services import email as email_svc
from . import common

router = APIRouter(tags=["meetings"])


class MeetingIn(BaseModel):
    projectId: str
    title: str = Field(min_length=3, max_length=160)
    date: str = ""
    time: str = "10:00"
    participants: list[str] = ["me"]
    agenda: list[str] = []
    desc: str = ""
    link: str = ""


@router.get("/api/projects/{pid}/meetings")
async def list_meetings(pid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await common.get_project_or_404(db, pid, user)
    return common.as_me_all(await db.meetings.find({"projectId": pid}).to_list(length=200), user["_id"])


@router.post("/api/projects/{pid}/meetings", status_code=201)
async def schedule_meeting(pid: str, body: MeetingIn, user: dict = Depends(get_current_user)):
    db = get_db()
    p = await common.get_project_or_404(db, pid, user)
    participants = [common.resolve_me(x, user["_id"]) for x in (body.participants or ["me"])]
    doc = {
        "_id": new_id("mt"),
        "projectId": pid,
        "title": body.title,
        "date": body.date,
        "time": body.time,
        "participants": participants,
        "agenda": body.agenda,
        "desc": body.desc,
        "link": body.link or f"https://meet.researchflow.app/{secrets.token_hex(4)}",
        "status": "scheduled",
        "notes": "",
        "actions": [],
    }
    await db.meetings.insert_one(doc)
    await activity.log_activity(db, user["_id"], "scheduled meeting", body.title, pid)
    try:
        day = datetime.fromisoformat(body.date)
        day_str = day.strftime("%d %b")
    except Exception:
        day_str = body.date
    await activity.notify(
        db,
        [x for x in participants if x != user["_id"]],
        "meeting",
        "Meeting scheduled",
        f"{body.title} — {day_str} at {body.time} ({user['name']}).",
        skip=user["_id"],
        project_id=pid,
    )
    # Rich, per-participant email — matches the "New Meeting Scheduled" template.
    other_ids = [x for x in participants if x != user["_id"]]
    if other_ids:
        recipients = await db.users.find({"_id": {"$in": other_ids}}).to_list(length=len(other_ids))
        participant_names = [user["name"]] + [u["name"] for u in recipients]
        view_url = f"{settings.app_url.rstrip('/')}/app/meetings"
        for recipient in recipients:
            if not recipient.get("email"):
                continue
            html = email_svc.meeting_email_html(
                name=recipient["name"],
                organizer=user["name"],
                title=body.title,
                date_str=day_str,
                time_str=body.time,
                reason=body.desc,
                participant_names=participant_names,
                view_url=view_url,
            )
            await email_svc.send_email(recipient["email"], "ResearchFlow — New Meeting Scheduled", html)
    return common.as_me(doc, user["_id"])


@router.patch("/api/meetings/{mid}")
async def patch_meeting(mid: str, body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    m = await db.meetings.find_one({"_id": mid})
    if not m:
        raise HTTPException(404, "Meeting not found.")
    p = await db.projects.find_one({"_id": m["projectId"]}, {"members": 1})
    if not p or not common.can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    update = {}
    if "notes" in body and body["notes"] is not None:
        update["notes"] = str(body["notes"])
    if "actions" in body and body["actions"] is not None:
        update["actions"] = body["actions"]
    if "status" in body and body["status"] in ("scheduled", "completed"):
        update["status"] = body["status"]
    # Saving notes completes the meeting (mirrors the frontend behaviour)
    if "notes" in body and "status" not in update:
        update["status"] = "completed"
    if update:
        await db.meetings.update_one({"_id": mid}, {"$set": update})
        m = await db.meetings.find_one({"_id": mid})
        await activity.log_activity(db, user["_id"], "updated meeting", f"{m['title']} ({m['status']})", m["projectId"])
        await realtime.hub.publish(f"project:{m['projectId']}", {"type": "meeting", "data": m})
        others = [x for x in m.get("participants", []) if x != user["_id"]]
        if others:
            await activity.notify(
                db, others, "meeting",
                "Meeting updated",
                f"“{m['title']}” has been updated by {user['name']}.",
                skip=user["_id"], project_id=m["projectId"],
            )
    return common.as_me(m, user["_id"])
