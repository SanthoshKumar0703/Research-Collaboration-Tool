"""Activity feed, in-app notifications, admin audit log + fan-out to WebSocket
rooms and (optionally) browser push."""
import logging
from datetime import datetime, timezone

from ..db import new_id
from . import realtime, push

log = logging.getLogger("rf.activity")


async def log_activity(db, user_id: str, verb: str, noun: str, project_id: str = "") -> dict:
    doc = {
        "_id": new_id("a"),
        "projectId": project_id,
        "userId": user_id,
        "verb": verb,
        "noun": noun,
        "time": datetime.now(timezone.utc).isoformat(),
    }
    await db.activity.insert_one(doc)
    if project_id:
        await realtime.hub.publish(f"project:{project_id}", {"type": "activity", "data": doc})
    return doc


async def admin_log(db, user_id: str, action: str, target: str) -> None:
    await db.admin_logs.insert_one(
        {"_id": new_id("l"), "userId": user_id, "action": action, "target": target, "time": datetime.now(timezone.utc).isoformat()}
    )


async def notify(
    db,
    user_ids: list[str],
    ntype: str,
    title: str,
    body: str,
    *,
    skip: str | None = None,
    project_id: str = "",
    email: bool = False,
) -> None:
    from . import email as email_svc

    now = datetime.now(timezone.utc).isoformat()
    for uid in user_ids:
        if skip and uid == skip:
            continue
        doc = {"_id": new_id("n"), "userId": uid, "type": ntype, "title": title, "body": body, "time": now, "read": False}
        await db.notifications.insert_one(doc)
        await realtime.hub.publish(f"user:{uid}", {"type": "notification", "data": {**doc, "id": doc["_id"]}})
        await push.push_notification(uid, title, body)
        if email:
            user = await db.users.find_one({"_id": uid})
            if user:
                await email_svc.send_email(user["email"], title, email_svc.render_email(title, f"<p>{body}</p>"))
