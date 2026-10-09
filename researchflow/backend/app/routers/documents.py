"""Documents: multipart upload with versioning, review workflow, comments,
download, and RAG chunking for text-like files."""
import math
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from ..db import get_db, new_id
from ..security import get_current_user
from ..services import activity, embeddings, realtime, storage

router = APIRouter(tags=["documents"])

MAX_SIZE = 200 * 1024 * 1024  # 200 MB
REVIEW_STATES = {"Pending Review", "Under Review", "Approved", "Changes Requested"}
TEXT_EXTS = {"md", "csv", "txt", "json", "yaml", "yml", "tex", "bib"}


def _now():
    return datetime.now(timezone.utc)


def _ext(name: str) -> str:
    return (name.rsplit(".", 1)[-1] if "." in name else "file").lower()


async def _check_project(db, pid: str, user: dict) -> dict:
    p = await db.projects.find_one({"_id": pid})
    if not p:
        raise HTTPException(404, "Project not found.")
    if not common.can_access(user, p):
        raise HTTPException(403, "You are not a member of this project.")
    return p


from . import common  # noqa: E402  (local import order keeps the module tidy)


@router.post("/api/projects/{pid}/documents", status_code=201)
async def upload_document(
    pid: str,
    file: UploadFile = File(...),
    cat: str = Form("Research Papers"),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    await _check_project(db, pid, user)
    data = await file.read()
    if not data:
        raise HTTPException(400, "The file is empty.")
    if len(data) > MAX_SIZE:
        raise HTTPException(413, "File exceeds the 200 MB limit.")
    name = os.path.basename(file.filename or "untitled")
    saved = storage.save_file(data, name, subdir="docs")
    size_kb = max(1, math.ceil(len(data) / 1024))
    now = _now().isoformat()
    date_iso = _now().strftime("%Y-%m-%d")

    existing = await db.documents.find_one({"projectId": pid, "name": name})
    if existing:
        version = existing.get("version", 1) + 1
        versions = list(existing.get("versions", [])) + [{"v": version, "date": date_iso, "sizeKB": size_kb, "path": saved["url"]}]
        await db.documents.update_one(
            {"_id": existing["_id"]},
            {"$set": {"version": version, "sizeKB": size_kb, "date": now, "review": "Pending Review", "path": saved["url"], "versions": versions}},
        )
        doc = await db.documents.find_one({"_id": existing["_id"]})
        noun = f"{name} (v{version})"
    else:
        doc = {
            "_id": new_id("d"),
            "projectId": pid,
            "name": name,
            "cat": cat,
            "uploader": user["_id"],
            "version": 1,
            "sizeKB": size_kb,
            "type": _ext(name),
            "date": now,
            "review": "Pending Review",
            "path": saved["url"],
            "versions": [{"v": 1, "date": date_iso, "sizeKB": size_kb, "path": saved["url"]}],
        }
        await db.documents.insert_one(doc)
        noun = name

    # RAG: index text-like uploads so Research AI can cite them
    if _ext(name) in TEXT_EXTS:
        try:
            text = data.decode("utf-8", errors="ignore")
            n = await embeddings.upsert_chunks(db, pid, doc["_id"], name, text)
            if n:
                doc["indexed"] = n
        except Exception:
            pass

    await activity.log_activity(db, user["_id"], "uploaded", noun, pid)
    await activity.admin_log(db, user["_id"], "document_uploaded", noun)
    members = [m for m in (await db.projects.find_one({"_id": pid}, {"members": 1}))["members"] if m != user["_id"]]
    await activity.notify(db, members, "doc", "Document uploaded", f"{user['name']} added {noun} to {cat}.", skip=user["_id"], project_id=pid)
    await realtime.hub.publish(f"project:{pid}", {"type": "document", "data": doc})
    return common.as_me(doc, user["_id"])


@router.get("/api/documents/{did}")
async def get_document(did: str, user: dict = Depends(get_current_user)):
    db = get_db()
    d = await db.documents.find_one({"_id": did})
    if not d:
        raise HTTPException(404, "Document not found.")
    if not common.can_access(user, await db.projects.find_one({"_id": d["projectId"]}, {"members": 1}) or {}):
        raise HTTPException(403, "You are not a member of this project.")
    return common.as_me(d, user["_id"])


@router.get("/api/documents/{did}/comments")
async def list_comments(did: str, user: dict = Depends(get_current_user)):
    db = get_db()
    return common.as_me_all(await db.doc_comments.find({"docId": did}).sort("date", 1).to_list(length=200), user["_id"])


@router.post("/api/documents/{did}/comments", status_code=201)
async def add_comment(did: str, body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    d = await db.documents.find_one({"_id": did})
    if not d:
        raise HTTPException(404, "Document not found.")
    if not common.can_access(user, await db.projects.find_one({"_id": d["projectId"]}, {"members": 1}) or {}):
        raise HTTPException(403, "You are not a member of this project.")
    text = str(body.get("text", "")).strip()
    if not text:
        raise HTTPException(400, "Comment text is required.")
    c = {
        "_id": new_id("c"),
        "docId": did,
        "userId": user["_id"],
        "text": text,
        "date": _now().isoformat(),
    }
    await db.doc_comments.insert_one(c)
    await db.documents.update_one({"_id": did}, {"$inc": {"comments": 1}})
    await activity.log_activity(db, user["_id"], "commented on", d["name"], d["projectId"])
    if d.get("uploader") and d["uploader"] != user["_id"]:
        await activity.notify(db, [d["uploader"]], "comment", f"{user['name']} commented on {d['name']}", f"“{text[:140]}”", project_id=d["projectId"])
    return common.as_me(c, user["_id"])


@router.post("/api/documents/{did}/review")
async def review_document(did: str, body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    d = await db.documents.find_one({"_id": did})
    if not d:
        raise HTTPException(404, "Document not found.")
    p = await db.projects.find_one({"_id": d["projectId"]}, {"members": 1})
    if not p or not (user.get("role") in ("supervisor", "admin") or user["_id"] in p.get("members", [])):
        raise HTTPException(403, "Only project members (supervisors to approve) can review documents.")
    review = str(body.get("review", ""))
    if review not in REVIEW_STATES:
        raise HTTPException(400, f"review must be one of {sorted(REVIEW_STATES)}.")
    await db.documents.update_one({"_id": did}, {"$set": {"review": review}})
    feedback = str(body.get("feedback", "")).strip()
    if feedback:
        await db.doc_comments.insert_one(
            {"_id": new_id("c"), "docId": did, "userId": user["_id"], "text": feedback, "date": _now().isoformat()}
        )
        await db.documents.update_one({"_id": did}, {"$inc": {"comments": 1}})
    await activity.log_activity(db, user["_id"], f"{review.lower()} document", d["name"], d["projectId"])
    await activity.admin_log(db, user["_id"], "document_reviewed", f"{d['name']} → {review}")
    if d.get("uploader") and d["uploader"] != user["_id"]:
        await activity.notify(db, [d["uploader"]], "review", f"Document {review.lower()}", f"{d['name']} — {review} by {user['name']}.", project_id=d["projectId"])
    await realtime.hub.publish(f"project:{d['projectId']}", {"type": "document", "data": d})
    return {"ok": True, "review": review}


@router.get("/api/documents/{did}/download")
async def download_document(did: str, user: dict = Depends(get_current_user)):
    db = get_db()
    d = await db.documents.find_one({"_id": did})
    if not d:
        raise HTTPException(404, "Document not found.")
    if not common.can_access(user, await db.projects.find_one({"_id": d["projectId"]}, {"members": 1}) or {}):
        raise HTTPException(403, "You are not a member of this project.")
    path = d.get("path", "")
    root = os.path.abspath(settings_storage_dir())
    full = os.path.abspath(os.path.join(root, path.replace("/storage/", "", 1)))
    if not full.startswith(root) or not os.path.isfile(full):
        raise HTTPException(410, "The stored file is no longer available.")
    return FileResponse(full, filename=d["name"], media_type="application/octet-stream")


def settings_storage_dir() -> str:
    from ..config import settings

    return settings.storage_dir
