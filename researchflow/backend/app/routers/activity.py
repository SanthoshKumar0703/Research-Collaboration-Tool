"""Activity feed (project-scoped or everything the user can see)."""
from fastapi import APIRouter, Depends

from ..db import get_db
from ..security import get_current_user
from . import common

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("")
async def feed(projectId: str = "", user: dict = Depends(get_current_user)):
    db = get_db()
    if projectId:
        p = await db.projects.find_one({"_id": projectId})
        if not p:
            return []
        if not common.can_access(user, p):
            return []
        q = {"projectId": projectId}
    else:
        pids = await common.visible_pids(db, user)
        if not pids:
            return []
        q = {"projectId": {"$in": pids}}
    docs = await db.activity.find(q).sort("time", -1).to_list(length=300)
    return common.as_me_all(docs, user["_id"])
