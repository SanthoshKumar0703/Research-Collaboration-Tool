"""In-process WebSocket hub for real-time updates (chat, task/document events,
notifications). For multi-instance deployments, replace with Redis pub/sub."""
from fastapi import WebSocket


class Hub:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = {}

    async def join(self, room: str, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms.setdefault(room, set()).add(ws)

    def leave(self, room: str, ws: WebSocket) -> None:
        self.rooms.get(room, set()).discard(ws)

    async def publish(self, room: str, payload: dict) -> None:
        for ws in list(self.rooms.get(room, ())):
            try:
                await ws.send_json(payload)
            except Exception:
                self.leave(room, ws)


hub = Hub()


def rooms_for_user(user_id: str, project_ids: list[str]) -> list[str]:
    return [f"user:{user_id}"] + [f"project:{p}" for p in project_ids]
