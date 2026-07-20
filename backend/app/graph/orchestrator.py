from app.graph.llm import llm_for_role, structured_call
from app.models import IdeaSpec, TeamBrief, TeamName


def reject_if_blank(raw_idea: str) -> str:
    """Single source of truth for "what makes an idea blank" — used by both
    intake() and the API layer's request validator (routers/validate.py) so
    the rule is expressed once."""
    idea_text = raw_idea.strip()
    if not idea_text:
        raise ValueError("idea must not be blank")
    return idea_text


def intake(raw_idea: str, industry: str | None, geography: str | None) -> IdeaSpec:
    return IdeaSpec(idea=reject_if_blank(raw_idea), industry=industry, geography=geography)


async def planner(idea: IdeaSpec) -> TeamBrief:
    prompt = (
        f"Startup idea: {idea.idea}\n"
        f"Industry: {idea.industry or 'unspecified'}\n"
        f"Geography: {idea.geography or 'unspecified'}\n\n"
        f"Produce a TeamBrief for the {TeamName.MARKET_RESEARCH.value} team: "
        "team must be 'market_research', focus is one paragraph describing "
        "what this team should research for this specific idea, and "
        "key_questions is 3 to 5 concrete questions."
    )
    return await structured_call(llm_for_role("planner"), TeamBrief, prompt)
