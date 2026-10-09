"""Project chat: REST history/send + WebSocket realtime (per-project rooms)."""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect, status as ws_status
from fastapi.responses import JSONResponse

from ..db import get_db, new_id
from ..security import get_current_user, decode_token
from ..services import realtime, storage
from . import common

router = APIRouter(tags=["chat"])

MAX_CHAT_FILE = 50 * 1024 * 1024


@router.get("/api/projects/{pid}/messages")
async def list_messages(pid: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await common.get_project_or_404(db, pid, user)
    return common.as_me_all(await db.messages.find({"projectId": pid}).sort("date", 1).to_list(length=500), user["_id"])


@router.post("/api/projects/{pid}/messages", status_code=201)
async def send_message(
    pid: str,
    text: str = Form(""),
    file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    await common.get_project_or_404(db, pid, user)
    text = (text or "").strip()
    if not text and not file:
        raise HTTPException(400, "Message text is required.")
    file_url = None
    if file:
        data = await file.read()
        if len(data) > MAX_CHAT_FILE:
            raise HTTPException(413, "File exceeds the 50 MB chat limit.")
        file_url = storage.save_file(data, file.filename or "attachment", subdir="chat")["url"]
    doc = {
        "_id": new_id("cs"),
        "projectId": pid,
        "userId": user["_id"],
        "text": text,
        "date": datetime.now(timezone.utc).isoformat(),
        "file": file_url,
    }
    await db.messages.insert_one(doc)
    out = common.as_me(doc, user["_id"])
    await realtime.hub.publish(f"chat:{pid}", {"type": "message", "data": out})
    return out


@router.websocket("/ws/chat/{pid}")
async def ws_chat(ws: WebSocket, pid: str):
    token = ws.query_params.get("token", "")
    try:
        payload = decode_token(token)
    except HTTPException:
        await ws.close(code=ws_status.WS_1008_POLICY_VIOLATION, reason="unauthorized")
        return
    me = payload["sub"]
    db = get_db()
    p = await db.projects.find_one({"_id": pid})
    if not p or not (payload.get("role") in ("supervisor", "admin") or me in p.get("members", [])):
        await ws.close(code=ws_status.WS_1008_POLICY_VIOLATION, reason="forbidden")
        return
    await realtime.hub.join(f"chat:{pid}", ws)
    await ws.send_json({"type": "hello", "data": {"projectId": pid, "user": me}})
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            mtype = msg.get("type")
            if mtype == "message":
                text = str(msg.get("text", "")).strip()
                if not text:
                    continue
                doc = {
                    "_id": new_id("cs"),
                    "projectId": pid,
                    "userId": me,
                    "text": text,
                    "date": datetime.now(timezone.utc).isoformat(),
                    "file": None,
                }
                await db.messages.insert_one(doc)
                await realtime.hub.publish(f"chat:{pid}", {"type": "message", "data": common.norm(doc)})
            elif mtype == "typing":
                await realtime.hub.publish(f"chat:{pid}", {"type": "typing", "data": {"user": me, "on": bool(msg.get("on", True))}})
    except WebSocketDisconnect:
        pass
    finally:
        realtime.hub.leave(f"chat:{pid}", ws)


@router.websocket("/ws/notifications")
async def ws_notifications(ws: WebSocket):
    """Personal notification stream — joins the `user:{id}` room that
    activity.notify() already publishes every in-app notification to."""
    token = ws.query_params.get("token", "")
    try:
        payload = decode_token(token)
    except HTTPException:
        await ws.close(code=ws_status.WS_1008_POLICY_VIOLATION, reason="unauthorized")
        return
    me = payload["sub"]
    room = f"user:{me}"
    await realtime.hub.join(room, ws)
    await ws.send_json({"type": "hello", "data": {"user": me}})
    try:
        while True:
            # Client doesn't need to send anything; keep the socket open and
            # drain any pings/keepalives it does send.
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        realtime.hub.leave(room, ws)
