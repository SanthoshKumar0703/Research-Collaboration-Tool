"""ResearchFlow API — FastAPI application entry point."""
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import close_db, init_db
from .routers import (
    activity,
    admin,
    ai,
    analytics,
    auth,
    chat,
    discussions,
    documents,
    experiments,
    findings,
    meetings,
    milestones,
    notifications,
    projects,
    search,
    tasks,
    users,
)
from .security import hash_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("rf.main")

VERSION = "1.0.0"


async def _ensure_admin() -> None:
    """Create or synchronize the platform admin from environment settings."""
    from .db import get_db, new_id

    db = get_db()
    existing = await db.users.find_one({"role": "admin"})
    if existing:
        await db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"email": settings.admin_email, "password": hash_password(settings.admin_password)}},
        )
        return
    password = settings.admin_password
    await db.users.insert_one(
        {
            "_id": new_id("u"),
            "name": "Arjun Patel",
            "email": settings.admin_email,
            "password": hash_password(password),
            "role": "admin",
            "dept": "Platform",
            "institution": "ResearchFlow",
            "interests": ["Platform Engineering"],
            "joined": datetime.now(timezone.utc).isoformat(),
            "status": "active",
            "avatar": None,
        }
    )
    log.info("Created default admin account %s", settings.admin_email)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    os.makedirs(settings.storage_dir, exist_ok=True)
    await _ensure_admin()
    log.info("ResearchFlow API ready (db=%s, storage=%s)", settings.database_url, settings.storage_dir)
    yield
    close_db()


os.makedirs(settings.storage_dir, exist_ok=True)  # needed before StaticFiles mount below

app = FastAPI(title=settings.app_name, version=VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, users.router, projects.router, tasks.router, milestones.router, documents.router,
          experiments.router, findings.router, discussions.router, meetings.router, chat.router,
          notifications.router, analytics.router, activity.router, search.router, ai.router, admin.router):
    app.include_router(r)

app.mount("/storage", StaticFiles(directory=settings.storage_dir), name="storage")


@app.get("/api/health")
async def health():
    from .services import push

    return {
        "ok": True,
        "name": settings.app_name,
        "version": VERSION,
        "time": datetime.now(timezone.utc).isoformat(),
        "ai_provider": settings.ai_provider,
        "ai_model": settings.ai_model,
        "ollama_base_url": settings.ollama_base_url if settings.ai_provider == "ollama" else None,
        "google_configured": bool(settings.google_client_id and settings.google_client_secret),
        "smtp_configured": bool(settings.smtp_host),
        "storage_backend": settings.storage_backend,
        "push_configured": push.configured(),
        "otp_debug": settings.otp_debug,
    }


@app.get("/")
async def root():
    return {"name": settings.app_name, "version": VERSION, "docs": "/docs", "health": "/api/health"}
