from typing import Awaitable, Callable

from langchain_openai import OpenAIEmbeddings

from app.config import settings

Embed = Callable[[list[str]], Awaitable[list[list[float]]]]


def _embeddings_client() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(model=settings.embedding_model, api_key=settings.openai_api_key)


async def default_embed(texts: list[str]) -> list[list[float]]:
    """The only embeddings entry point RAG code uses, so the embedding model
    choice lives in config (CLAUDE.md rule 9), not scattered in code."""
    return await _embeddings_client().aembed_documents(texts)
