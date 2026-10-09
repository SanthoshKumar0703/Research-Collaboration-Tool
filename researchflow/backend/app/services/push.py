"""Browser push notifications (Web Push / VAPID). Degrades gracefully when
VAPID keys are not configured."""
import logging

from ..config import settings

log = logging.getLogger("rf.push")


def configured() -> bool:
    return bool(settings.vapid_public_key and settings.vapid_private_key)


def public_key() -> str:
    return settings.vapid_public_key


async def push_notification(user_id: str, title: str, body: str) -> None:
    if not configured():
        return
    from ..db import get_db
    from pywebpush import webpush, WebPushException

    db = get_db()
    subs = await db.push_subscriptions.find({"userId": user_id}).to_list(length=20)
    for sub in subs:
        try:
            webpush(
                subscription_info=sub["endpoint"] if isinstance(sub, dict) and "endpoint" in sub else sub["subscription"],
                data=f'{{"title":"ResearchFlow","body":"{body[:140]}"}}',
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_claims_email},
            )
        except WebPushException as e:
            code = getattr(getattr(e, "response", None), "status_code", None)
            if code in (404, 410):
                await db.push_subscriptions.delete_one({"_id": sub["_id"]})
            else:
                log.warning("Push failed: %s", e)
