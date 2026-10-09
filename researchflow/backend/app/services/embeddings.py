"""Lightweight local embeddings for RAG: hashed bag-of-words vectors (256 dim)
with L2 normalisation + cosine similarity. Runs with zero paid APIs and no
model downloads. Swap `embed` for sentence-transformers in
`EMBEDDING_PROVIDER=st` when a GPU is available — the rest of the pipeline is
unchanged."""
import math
import re

DIM = 256
_TOKEN = re.compile(r"[a-z0-9]{2,}")


def tokenize(text: str) -> list[str]:
    return _TOKEN.findall((text or "").lower())


def embed(text: str) -> list[float]:
    vec = [0.0] * DIM
    toks = tokenize(text)
    for i, tok in enumerate(toks):
        # position-mixed double hashing reduces collision bias
        h1 = hash((tok, 0)) % DIM
        h2 = hash((tok, i)) % DIM
        vec[h1] += 1.0
        vec[h2] += 0.5
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


async def upsert_chunks(db, project_id: str, doc_id: str, doc_name: str, text: str) -> int:
    """Chunk text (~1200 chars, 150 overlap) and store embeddings."""
    if not text or len(text.strip()) < 40:
        return 0
    step, size, overlap = 1050, 1200, 150
    chunks = []
    for i in range(0, len(text), step):
        piece = text[i : i + size]
        if not piece.strip():
            continue
        chunks.append(piece)
    await db.chunks.delete_many({"docId": doc_id})
    n = 0
    for idx, piece in enumerate(chunks):
        await db.chunks.insert_one(
            {
                "_id": f"{doc_id}:c{idx}",
                "projectId": project_id,
                "docId": doc_id,
                "docName": doc_name,
                "text": piece,
                "vector": embed(piece),
            }
        )
        n += 1
    return n


async def retrieve(db, project_id: str, query: str, k: int = 5) -> list[dict]:
    qv = embed(query)
    cursor = db.chunks.find({"projectId": project_id})
    scored = []
    async for c in cursor:
        s = cosine(qv, c.get("vector", []))
        scored.append((s, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for s, c in scored[:k] if s > 0.02]
