from langchain_openai import ChatOpenAI

from app.config import settings


def llm_for_role(role: str) -> ChatOpenAI:
    """Every ChatOpenAI construction goes through here so the model map in
    config.py (CLAUDE.md rule 9) is the only place model choice lives."""
    return ChatOpenAI(model=settings.model_map[role], api_key=settings.openai_api_key)


async def structured_call(llm: ChatOpenAI, schema, prompt: str):
    """Structured output with one retry on parse failure (CLAUDE.md rule 7).
    Raises on a second failure so it fails loudly (rule 11) instead of being
    silently dropped; Phase 1 has no containment wrapper for this yet."""
    structured_llm = llm.with_structured_output(schema)
    try:
        return await structured_llm.ainvoke(prompt)
    except Exception as exc:
        retry_prompt = (
            f"{prompt}\n\nYour previous response failed validation with error: "
            f"{exc}. Try again, strictly matching the required schema."
        )
        return await structured_llm.ainvoke(retry_prompt)
