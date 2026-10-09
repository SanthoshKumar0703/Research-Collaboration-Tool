"""Research AI: project-aware assistant with RAG over the document library.

Provider abstraction (env AI_PROVIDER):
  ollama   — local model, default (OLLAMA_BASE_URL + AI_MODEL, e.g. qwen3:4b)
  openai / anthropic / google / xai — optional paid providers (API key env)

AI failures NEVER crash the app: any provider error is returned as
{ok: False, error, fallback} so the UI can degrade gracefully."""
import logging

import httpx

from ..config import settings
from . import embeddings

log = logging.getLogger("rf.ai")

SYSTEM_PROMPT = (
    "You are ResearchFlow's research assistant. You answer strictly from the project "
    "context and retrieved document excerpts provided below. Cite sources by document "
    "name. If the answer is not in the context, say so explicitly — never invent "
    "results, numbers or citations. Use concise markdown (short headings, bullets, "
    "bold for key terms)."
)


def provider_name() -> str:
    return settings.ai_provider.lower()


def _system_with_context(project: dict, ctx_text: str) -> str:
    return (
        f"{SYSTEM_PROMPT}\n\nPROJECT: {project.get('title', '')}\n"
        f"Objective: {project.get('objective', '')}\n"
        f"Methodology: {project.get('methodology', '')}\n\n"
        f"RETRIEVED DOCUMENT EXCERPTS (cite these by name):\n{ctx_text or '(none retrieved)'}"
    )


async def _call_ollama(system: str, messages: list[dict]) -> str:
    url = settings.ollama_base_url.rstrip("/") + "/api/chat"
    async with httpx.AsyncClient(timeout=settings.ai_timeout) as client:
        r = await client.post(
            url,
            json={
                "model": settings.ai_model,
                "messages": [{"role": "system", "content": system}, *messages],
                "stream": False,
            },
        )
        r.raise_for_status()
        return r.json()["message"]["content"]


async def _call_chat_completions(api_key: str, base_url: str, model: str, system: str, messages: list[dict]) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient(timeout=settings.ai_timeout) as client:
        r = await client.post(
            url,
            headers=headers,
            json={"model": model, "messages": [{"role": "system", "content": system}, *messages], "temperature": 0.3},
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


async def _call_anthropic(system: str, messages: list[dict]) -> str:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
    }
    async with httpx.AsyncClient(timeout=settings.ai_timeout) as client:
        r = await client.post(url, headers=headers, json={"model": "claude-sonnet-4-20250514", "max_tokens": 2048, "system": system, "messages": messages})
        r.raise_for_status()
        return "".join(b.get("text", "") for b in r.json().get("content", []))


async def ask(db, project: dict, message: str, history: list[dict] | None = None) -> dict:
    """Return {ok, text, sources, provider, model, error?}."""
    provider = provider_name()
    history = [m for m in (history or []) if m.get("role") in ("user", "assistant")][-6:]
    messages = [{"role": "user", "content": message}]
    if history:
        messages = [{"role": "assistant" if h["role"] == "assistant" else "user", "content": h["content"]} for h in history] + messages

    # --- RAG context ---
    chunks = []
    try:
        chunks = await embeddings.retrieve(db, project["_id"], message, k=5)
    except Exception as e:
        log.warning("RAG retrieval failed: %s", e)
    ctx_text = "\n\n".join(f"[{c['docName']}]\n{c['text'][:900]}" for c in chunks)
    system = _system_with_context(project, ctx_text)

    # --- provider dispatch ---
    try:
        if provider == "ollama":
            text = await _call_ollama(system, messages)
        elif provider == "openai" and settings.openai_api_key:
            text = await _call_chat_completions(settings.openai_api_key, settings.openai_base_url, "gpt-4o-mini", system, messages)
        elif provider == "anthropic" and settings.anthropic_api_key:
            text = await _call_anthropic(system, messages)
        elif provider == "google" and settings.google_api_key:
            text = await _call_chat_completions(settings.google_api_key, "https://generativelanguage.googleapis.com/v1beta/openai/", "gemini-2.0-flash", system, messages)
        elif provider == "xai" and settings.xai_api_key:
            text = await _call_chat_completions(settings.xai_api_key, "https://api.x.ai/v1", "grok-2-latest", system, messages)
        else:
            raise RuntimeError(f"AI provider '{provider}' is not configured.")
        return {
            "ok": True,
            "text": text.strip(),
            "sources": sorted({c["docName"] for c in chunks}),
            "provider": provider,
            "model": settings.ai_model if provider == "ollama" else "provider-default",
        }
    except httpx.ConnectError:
        return {
            "ok": False,
            "provider": provider,
            "error": f"{provider} is not reachable at its configured URL.",
            "fallback": (
                f"Research AI is temporarily unavailable ({provider} isn't running). "
                + (
                    "Start it with `ollama serve` and make sure the model is pulled: "
                    f"`ollama pull {settings.ai_model}`."
                    if provider == "ollama"
                    else "Check the AI provider configuration in admin → System Settings."
                )
            ),
            "sources": [],
        }
    except Exception as e:
        log.warning("AI provider error: %s", e)
        return {
            "ok": False,
            "provider": provider,
            "error": str(e)[:200],
            "fallback": "Research AI could not complete that request. Please try again in a moment.",
            "sources": [],
        }
