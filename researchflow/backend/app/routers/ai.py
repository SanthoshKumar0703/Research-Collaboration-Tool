"""Research AI endpoint — RAG-grounded, provider-abstracted, never crashes
the app (graceful {ok:false, fallback} responses)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_db
from ..security import get_current_user
from ..services import ai as ai_svc
from . import common

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AskIn(BaseModel):
    projectId: str
    message: str = Field(min_length=1, max_length=4000)
    history: list[dict] = []


@router.post("/ask")
async def ask(body: AskIn, user: dict = Depends(get_current_user)):
    db = get_db()
    project = await db.projects.find_one({"_id": body.projectId})
    if not project:
        raise HTTPException(404, "Project not found.")
    if not common.can_access(user, project):
        raise HTTPException(403, "You are not a member of this project.")
    return await ai_svc.ask(db, project, body.message, body.history)


@router.get("/status")
async def ai_status(user: dict = Depends(get_current_user)):
    from ..config import settings

    return {
        "provider": settings.ai_provider,
        "model": settings.ai_model,
        "base_url": settings.ollama_base_url if settings.ai_provider == "ollama" else None,
    }
