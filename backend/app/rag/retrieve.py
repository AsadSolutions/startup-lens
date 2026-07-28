from app.config import settings
from app.models import ResearchFinding, SourceRef, TeamName
from app.rag.client import get_qdrant_client
from app.rag.collections import TEAM_COLLECTIONS
from app.rag.embeddings import Embed, default_embed


class HopLimitExceeded(ValueError):
    pass


async def retrieve(
    collection: str,
    query: str,
    hop: int = 1,
    *,
    client=None,
    embed: Embed | None = None,
    top_k: int | None = None,
) -> list[ResearchFinding]:
    """Top-k similarity search against one Qdrant collection. `hop` is the
    caller's hop number (1 = the researcher's initial retrieval, 2/3 = the
    analyst's follow-ups) — enforced here, not just at the call site, so no
    caller can retrieve past the cap even by mistake (ENGINEERING_PRINCIPLES
    #3: RAG hop cap of 3)."""
    max_hops = settings.rag_max_hops
    if hop > max_hops:
        raise HopLimitExceeded(f"hop {hop} exceeds the max of {max_hops}")
    client = client or get_qdrant_client()
    embed = embed or default_embed
    top_k = top_k if top_k is not None else settings.rag_top_k
    [vector] = await embed([query])
    response = await client.query_points(collection_name=collection, query=vector, limit=top_k)
    hits = response.points
    return [
        ResearchFinding(
            summary=hit.payload["text"][:200],
            source=SourceRef(
                title=hit.payload["source"]["title"],
                url=hit.payload["source"].get("url"),
                published=hit.payload["source"].get("published"),
            ),
            snippet=hit.payload["text"],
        )
        for hit in hits
    ]


async def retrieve_for_team(
    team: TeamName,
    query: str,
    hop: int = 1,
    *,
    client=None,
    embed: Embed | None = None,
    top_k: int | None = None,
) -> list[ResearchFinding]:
    """Scopes retrieval to exactly the one collection `team` owns — the RAG
    side of the context firewall (ARCHITECTURE.md context discipline #1):
    a team's researcher/analyst can never read another team's collection."""
    collection = TEAM_COLLECTIONS[team]
    return await retrieve(collection, query, hop, client=client, embed=embed, top_k=top_k)
