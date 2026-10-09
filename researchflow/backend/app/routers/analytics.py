"""Analytics computed from real collections (activity log, tasks, documents).

Shapes mirror the frontend mock exactly:
  weekly_activity  [{week, events, tasks, docs, experiments}]   12 weeks
  task_trend       [{week, completed, open}]                    10 weeks
  monthly_docs     [{month, docs}]                              6 months
  contributions    [{name, hours}]                              (hours = activity events, last 90 days)
  heatmap          [[0..10] x 7] x 12                           12 weeks x 7 days
  global           {user_growth, storage, logs, role_dist, counts}
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from ..db import get_db
from ..security import get_current_user, require_staff
from . import common

router = APIRouter(tags=["analytics"])

now = lambda: datetime.now(timezone.utc)


def _parse(t: str) -> datetime:
    try:
        x = datetime.fromisoformat(str(t).replace("Z", "+00:00"))
        if x.tzinfo is None:
            x = x.replace(tzinfo=timezone.utc)
        return x
    except Exception:
        return now()


def _monday(d: datetime) -> datetime:
    return (d - timedelta(days=d.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)


def _week_windows(n: int):
    """Yield (label, start, end) oldest → newest for the last n weeks."""
    cur = _monday(now())
    for i in range(n - 1, -1, -1):
        end = cur - timedelta(days=7 * i)
        start = end - timedelta(days=7)
        yield ("Now" if i == 0 else f"W-{i}"), start, end


def _short_name(full: str) -> str:
    parts = (full or "?").replace("Dr. ", "").replace("Dr ", "").split()
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]} {parts[-1][0]}."


async def project_analytics(db, pid: str) -> dict:
    activities = await db.activity.find({"projectId": pid}).to_list(length=5000)
    tasks = await db.tasks.find({"projectId": pid}).to_list(length=2000)
    docs = await db.documents.find({"projectId": pid}).to_list(length=2000)
    members = await db.projects.find_one({"_id": pid}) or {}
    member_ids = members.get("members", [])
    users = {u["_id"]: u for u in await db.users.find({"_id": {"$in": member_ids}}).to_list(length=100)}

    # --- weekly activity (12 weeks) ---
    weekly = []
    for label, start, end in _week_windows(12):
        in_w = [a for a in activities if start <= _parse(a.get("time", "")) < end]
        weekly.append(
            {
                "week": label,
                "events": len(in_w),
                "tasks": sum(1 for a in in_w if a.get("verb") == "created task"),
                "docs": sum(1 for a in in_w if a.get("verb") in ("uploaded",)),
                "experiments": sum(1 for a in in_w if a.get("verb") in ("recorded experiment",)),
            }
        )

    # --- task trend (10 weeks): completed events + open backlog at week end ---
    trend = []
    for label, start, end in _week_windows(10):
        completed = sum(1 for a in activities if a.get("verb") == "completed" and start <= _parse(a.get("time", "")) < end)
        open_count = sum(1 for t in tasks if t.get("status") != "completed" and _parse(t.get("createdAt", "")) < end)
        trend.append({"week": label, "completed": completed, "open": open_count})

    # --- monthly documents (6 months) ---
    months = []
    base = now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for i in range(5, -1, -1):
        m_start = (base - timedelta(days=30 * i)).replace(day=1)
        # normalise to actual month start
        m_start = m_start.replace(hour=0, minute=0, second=0, microsecond=0)
        m_end = m_start + timedelta(days=32)
        m_end = m_end.replace(day=1)
        months.append({"month": m_start.strftime("%b"), "docs": sum(1 for d in docs if m_start <= _parse(d.get("date", "")) < m_end)})

    # --- contributions: activity events per member, last 90 days ---
    cutoff = now() - timedelta(days=90)
    counts = {m: 0 for m in member_ids}
    for a in activities:
        if _parse(a.get("time", "")) >= cutoff and a.get("userId") in counts:
            counts[a["userId"]] += 1
    contributions = [{"name": _short_name(users.get(m, {}).get("name", "Member")), "hours": c} for m, c in counts.items() if c > 0]
    contributions.sort(key=lambda x: -x["hours"])
    if not contributions:
        contributions = [{"name": _short_name(users.get(member_ids[0], {}).get("name", "You")) if member_ids else "You", "hours": 0}]

    # --- heatmap: 12 weeks x 7 days (Mon..Sun), capped at 10 ---
    heat_start = _monday(now()) - timedelta(days=7 * 11)
    per_day: dict = {}
    for a in activities:
        dt = _parse(a.get("time", ""))
        key = (dt - heat_start) // timedelta(days=1)
        if 0 <= key < 12 * 7:
            per_day[key] = per_day.get(key, 0) + 1
    heatmap = [[min(10, per_day.get(w * 7 + d, 0)) for d in range(7)] for w in range(12)]

    return {
        "weekly": weekly,
        "trend": trend,
        "monthly": months,
        "contributions": contributions,
        "contributionLabel": "events",
        "heatmap": heatmap,
    }


async def global_analytics(db) -> dict:
    users = await db.users.find({}).to_list(length=2000)
    projects = await db.projects.find({}).to_list(length=2000)
    docs = await db.documents.find({}).to_list(length=5000)

    # user growth: cumulative joiners per month (6 months)
    base = now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    growth = []
    for i in range(5, -1, -1):
        m_start = (base - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        m_end = (m_start + timedelta(days=32)).replace(day=1)
        growth.append({"month": m_start.strftime("%b"), "users": sum(1 for u in users if _parse(u.get("joined", "")) < m_end)})

    # real storage usage
    import os

    from ..config import settings

    used = 0
    root = settings.storage_dir
    if os.path.isdir(root):
        for dp, _, fns in os.walk(root):
            for fn in fns:
                try:
                    used += os.path.getsize(os.path.join(dp, fn))
                except OSError:
                    pass
    used_gb = round(used / 1024 / 1024 / 1024, 1)

    logs = [common.norm(l) for l in await db.admin_logs.find({}).sort("time", -1).to_list(length=100)]

    role_dist = {"researcher": 0, "supervisor": 0, "admin": 0}
    for u in users:
        role_dist[u.get("role", "researcher")] = role_dist.get(u.get("role", "researcher"), 0) + 1

    return {
        "userGrowth": growth,
        "storage": {"usedGB": used_gb, "totalGB": settings.storage_total_gb},
        "logs": logs,
        "roleDist": role_dist,
        "counts": {
            "projects": len(projects),
            "documents": len(docs),
            "experiments": await db.experiments.count_documents({}),
            "findings": await db.findings.count_documents({}),
        },
    }


@router.get("/api/projects/{pid}/analytics")
async def get_project_analytics(pid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    from fastapi import HTTPException

    p = await db.projects.find_one({"_id": pid})
    if not p:
        raise HTTPException(404, "Project not found.")
    if not common.can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    return await project_analytics(db, pid)


@router.get("/api/analytics")
async def get_global_analytics(user: dict = Depends(require_staff())):
    return await global_analytics(get_db())
