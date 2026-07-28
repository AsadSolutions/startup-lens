import asyncio
import hashlib
import uuid
from datetime import date

from qdrant_client.models import Distance, PointStruct, VectorParams

from app.rag.client import get_qdrant_client
from app.rag.collections import COLLECTIONS, EMBEDDING_DIM
from app.rag.curated_sources import CURATED_SOURCES
from app.rag.embeddings import Embed, default_embed


def _content_hash(collection: str, text: str) -> str:
    return hashlib.sha256(f"{collection}:{text}".encode()).hexdigest()


def _point_id(content_hash: str) -> str:
    """Deterministic UUID derived from the content hash: re-seeding unchanged
    content resolves to the same point id, so upsert overwrites it in place
    instead of creating a duplicate — the idempotency guarantee."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, content_hash))


async def _ensure_collection(client, collection: str) -> None:
    if not await client.collection_exists(collection):
        await client.create_collection(
            collection_name=collection,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )


async def seed(*, client=None, embed: Embed | None = None) -> dict[str, int]:
    """Seeds all 5 Qdrant collections from CURATED_SOURCES. Safe to run
    repeatedly: point ids are derived from a hash of (collection, text), so
    re-running with unchanged content upserts the same points instead of
    duplicating them. Run via `python -m app.rag.seed`."""
    client = client or get_qdrant_client()
    embed = embed or default_embed
    counts: dict[str, int] = {}
    for collection in COLLECTIONS:
        chunks = CURATED_SOURCES[collection]
        await _ensure_collection(client, collection)
        vectors = await embed([chunk["text"] for chunk in chunks])
        points = []
        for chunk, vector in zip(chunks, vectors):
            content_hash = _content_hash(collection, chunk["text"])
            source = dict(chunk["source"])
            if isinstance(source.get("published"), date):
                source["published"] = source["published"].isoformat()
            points.append(
                PointStruct(
                    id=_point_id(content_hash),
                    vector=vector,
                    payload={"text": chunk["text"], "source": source, "content_hash": content_hash},
                )
            )
        await client.upsert(collection_name=collection, points=points)
        counts[collection] = len(points)
    return counts


async def _run() -> None:
    counts = await seed()
    for collection, count in counts.items():
        print(f"{collection}: {count} points")


if __name__ == "__main__":
    asyncio.run(_run())
