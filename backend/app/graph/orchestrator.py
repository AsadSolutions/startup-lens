from typing import Awaitable, Callable, TypeVar

from pydantic import BaseModel

from app.graph.llm import llm_for_role, structured_call
from app.models import IdeaSpec, TeamBrief, TeamName

SchemaT = TypeVar("SchemaT", bound=BaseModel)
CallLLM = Callable[[type[SchemaT], str], Awaitable[SchemaT]]


def reject_if_blank(raw_idea: str) -> str:
    """Single source of truth for "what makes an idea blank" — used by both
    intake() and the API layer's request validator (routers/validate.py) so
    the rule is expressed once."""
    idea_text = raw_idea.strip()
    if not idea_text:
        raise ValueError("idea must not be blank")
    return idea_text


def intake(raw_idea: str) -> IdeaSpec:
    return IdeaSpec(idea=reject_if_blank(raw_idea))


def _default_call_llm(role: str) -> CallLLM:
    llm = llm_for_role(role)
    return lambda schema, prompt: structured_call(llm, schema, prompt)


async def planner(idea: IdeaSpec, *, call_llm: CallLLM | None = None) -> TeamBrief:
    """One LLM call producing the market_research team's TeamBrief. There is no
    separate industry/geography input: the model infers industry and market
    context directly from the idea text and folds that inference into the
    brief's focus and key_questions."""
    call_llm = call_llm or _default_call_llm("planner")
    prompt = (
        f"Startup idea: {idea.idea}\n\n"
        "First, infer the industry/sector and the likely target market or "
        "geography implied by the idea text itself — the idea text is the "
        "only input, there is no separate industry or geography field.\n\n"
        f"Then produce a TeamBrief for the {TeamName.MARKET_RESEARCH.value} team: "
        "team must be 'market_research', focus is one paragraph describing "
        "what this team should research for this specific idea given the "
        "industry and market you inferred, and key_questions is 3 to 5 "
        "concrete questions."
    )
    return await call_llm(TeamBrief, prompt)
