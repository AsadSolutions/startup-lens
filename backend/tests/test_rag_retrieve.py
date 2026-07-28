import pytest
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.models import TeamName
from app.rag.collections import EMBEDDING_DIM, TEAM_COLLECTIONS
from app.rag.retrieve import HopLimitExceeded, retrieve, retrieve_for_team


async def _seed_two_collections(client):
    for collection, tag in [("market_data", "MARKET_ONLY"), ("competitors", "COMPETITORS_ONLY")]:
        await client.create_collection(
            collection_name=collection,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )
        await client.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=1,
                    vector=[0.1] * EMBEDDING_DIM,
                    payload={"text": tag, "source": {"title": tag, "published": "2024-01-01"}},
                )
            ],
        )


async def _fake_embed(texts):
    return [[0.1] * EMBEDDING_DIM for _ in texts]


async def test_retrieve_for_team_only_reads_its_own_teams_collection():
    client = AsyncQdrantClient(location=":memory:")
    await _seed_two_collections(client)

    market_hits = await retrieve_for_team(
        TeamName.MARKET_RESEARCH, "size", client=client, embed=_fake_embed
    )
    competitor_hits = await retrieve_for_team(
        TeamName.COMPETITOR_ANALYSIS, "rivals", client=client, embed=_fake_embed
    )

    assert market_hits and all(hit.snippet == "MARKET_ONLY" for hit in market_hits)
    assert competitor_hits and all(hit.snippet == "COMPETITORS_ONLY" for hit in competitor_hits)


async def test_every_team_maps_to_a_distinct_collection():
    assert len(set(TEAM_COLLECTIONS.values())) == len(TeamName)


async def test_retrieve_rejects_hop_past_the_cap():
    with pytest.raises(HopLimitExceeded):
        await retrieve("market_data", "q", hop=4, client=object(), embed=_fake_embed)


async def test_retrieve_allows_hop_at_the_cap():
    client = AsyncQdrantClient(location=":memory:")
    await _seed_two_collections(client)
    hits = await retrieve("market_data", "q", hop=3, client=client, embed=_fake_embed)
    assert hits
