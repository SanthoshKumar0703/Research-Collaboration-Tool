import secrets
from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings

_client = None
_db = None


def _db_name(url: str) -> str:
    path = url.split("/", 3)[-1].split("?")[0]
    return path or "researchflow"


def init_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.database_url, uuidRepresentation="standard", serverSelectionTimeoutMS=5000)
    _db = _client[_db_name(settings.database_url)]
    _ensure_indexes(_db)


def close_db() -> None:
    if _client is not None:
        _client.close()


def get_db():
    if _db is None:
        init_db()
    return _db


def _ensure_indexes(db) -> None:
    db.users.create_index("email", unique=True)
    db.projects.create_index([("members", 1)])
    db.tasks.create_index([("projectId", 1), ("status", 1)])
    db.milestones.create_index("projectId")
    db.documents.create_index([("projectId", 1), ("name", 1)])
    db.doc_comments.create_index("docId")
    db.experiments.create_index("projectId")
    db.findings.create_index("projectId")
    db.discussions.create_index("projectId")
    db.meetings.create_index("projectId")
    db.messages.create_index([("projectId", 1), ("date", 1)])
    db.notifications.create_index([("userId", 1), ("time", -1)])
    db.activity.create_index([("projectId", 1), ("time", -1)])
    db.chunks.create_index([("projectId", 1)])
    db.otp_codes.create_index("email")
    db.push_subscriptions.create_index("userId")
    db.admin_logs.create_index("time", expireAfterSeconds=0)


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(6)}"
