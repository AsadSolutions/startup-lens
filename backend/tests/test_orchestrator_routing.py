import pytest

from app.graph.orchestrator import intake, planner
from app.models import IdeaSpec, TeamBrief, TeamName


def test_intake_rejects_blank_idea():
    with pytest.raises(ValueError):
        intake("   ")


def test_intake_normalizes_idea_text():
    idea = intake("  A marketplace for vintage synths  ")
    assert idea.idea == "A marketplace for vintage synths"


async def test_planner_produces_market_research_brief_from_faked_llm():
    fake_brief = TeamBrief(
        team=TeamName.MARKET_RESEARCH,
        focus="Size the vintage synth resale market",
        key_questions=["How big is the used gear market?"],
    )

    captured_prompt = {}

    async def fake_call_llm(schema, prompt):
        captured_prompt["schema"] = schema
        captured_prompt["prompt"] = prompt
        return fake_brief

    idea = IdeaSpec(idea="A marketplace for vintage synths")
    brief = await planner(idea, call_llm=fake_call_llm)

    assert brief == fake_brief
    assert captured_prompt["schema"] is TeamBrief
    assert "A marketplace for vintage synths" in captured_prompt["prompt"]
    # No separate industry/geography input: the prompt instructs inference
    # from the idea text itself instead of asking for those as fields.
    assert "infer" in captured_prompt["prompt"].lower()
