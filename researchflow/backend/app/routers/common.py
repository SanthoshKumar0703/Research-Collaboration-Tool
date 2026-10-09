"""Shared router helpers.

* ``norm``   — converts Mongo docs to the frontend shape (``_id`` → ``id``).
* ``as_me``  — maps the *current* user's id to the literal ``"me"`` in the
  fields the frontend compares against ``'me'`` (members, assignee, by,
  uploader, participants, reply authors…). This lets the exact same React
  components run in demo mode (mock data) and API mode without changes.
* ``visible_pids`` / ``can_access`` — project scoping (researchers only see
  their own projects; supervisors/admins see everything).
* ``resolve_me`` — mutation endpoints accept ``"me"`` as a user reference and
  resolve it to the authenticated user's real id.
"""
from ..db import get_db

STAFF = ("supervisor", "admin")


def norm(doc: dict) -> dict:
    out = dict(doc)
    if "_id" in out:
        out["id"] = out.pop("_id")
    return out


def _pub_user(u: dict) -> dict:
    return {k: u.get(k) for k in ("_id", "name", "email", "role", "dept", "institution", "interests", "joined", "status", "avatar")} | {
        "id": u["_id"]
    }


def pub_user(u: dict) -> dict:
    out = _pub_user(u)
    out.pop("_id", None)
    return out


def _replies_for_user(replies: list, me_id: str) -> list:
    out = []
    for r in replies or []:
        rr = dict(r)
        rr["by"] = "me" if rr.get("by") == me_id else rr.get("by")
        reactors = rr.pop("reactors", None) or {}
        rr["reactions"] = {e: len(ids) for e, ids in reactors.items() if ids}
        rr["mine"] = {e: me_id in ids for e, ids in reactors.items() if ids}
        out.append(rr)
    return out


def as_me(doc: dict, me_id: str) -> dict:
    """Norm a doc and map the current user's id → 'me' where the UI expects it."""
    d = norm(doc)
    if me_id == "me":
        return d
    for k in ("userId", "assignee", "by", "uploader"):
        if d.get(k) == me_id:
            d[k] = "me"
    for k in ("members", "participants"):
        if isinstance(d.get(k), list):
            d[k] = ["me" if x == me_id else x for x in d[k]]
    if isinstance(d.get("replies"), list):
        d["replies"] = _replies_for_user(d["replies"], me_id)
    return d


def as_me_all(docs: list, me_id: str) -> list:
    return [as_me(d, me_id) for d in docs]


async def visible_pids(db, user: dict) -> list[str]:
    q = {} if user.get("role") in STAFF else {"members": user["_id"]}
    return [p["_id"] async for p in db.projects.find(q, {"_id": 1})][:500]


def can_access(user: dict, project: dict) -> bool:
    return user.get("role") in STAFF or user["_id"] in project.get("members", [])


async def get_project_or_404(db, pid: str, user: dict) -> dict:
    from fastapi import HTTPException

    p = await db.projects.find_one({"_id": pid})
    if not p:
        raise HTTPException(404, "Project not found.")
    if not can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    return p


def resolve_me(value, me_id: str):
    if isinstance(value, list):
        return [me_id if v == "me" else v for v in value]
    return me_id if value == "me" else value
