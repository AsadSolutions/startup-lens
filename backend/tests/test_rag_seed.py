from qdrant_client import AsyncQdrantClient

from app.rag.collections import COLLECTIONS, EMBEDDING_DIM
from app.rag.seed import seed


async def _fake_embed(texts: list[str]) -> list[list[float]]:
    return [[float(len(t) % 7)] * EMBEDDING_DIM for t in texts]


async def test_seed_is_idempotent_by_content_hash():
    client = AsyncQdrantClient(location=":memory:")

    first_counts = await seed(client=client, embed=_fake_embed)
    second_counts = await seed(client=client, embed=_fake_embed)

    assert first_counts == second_counts
    for collection in COLLECTIONS:
        info = await client.count(collection_name=collection, exact=True)
        assert info.count == first_counts[collection]


async def test_seed_stores_source_and_date_metadata_on_every_chunk():
    client = AsyncQdrantClient(location=":memory:")
    await seed(client=client, embed=_fake_embed)

    points, _ = await client.scroll(collection_name="market_data", limit=100)
    assert points
    for point in points:
        assert point.payload["source"]["title"]
        assert point.payload["source"]["published"]
        assert point.payload["content_hash"]
