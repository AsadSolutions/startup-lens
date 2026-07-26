import pytest

from app.graph.orchestrator import intake, planner
from app.models import IdeaSpec, TeamBrief, TeamBriefSet, TeamName


def test_intake_rejects_blank_idea():
    with pytest.raises(ValueError):
        intake("   ")


def test_intake_normalizes_idea_text():
    idea = intake("  A marketplace for vintage synths  ")
    assert idea.idea == "A marketplace for vintage synths"


async def test_planner_produces_a_brief_for_every_team_from_faked_llm():
    fake_brief_set = TeamBriefSet(
        briefs=[
            TeamBrief(
                team=t,
                focus=f"Focus for {t.value}",
                key_questions=[f"Key question for {t.value}?"],
            )
            for t in TeamName
        ]
    )

    captured_prompt = {}

    async def fake_call_llm(schema, prompt):
        captured_prompt["schema"] = schema
        captured_prompt["prompt"] = prompt
        return fake_brief_set

    idea = IdeaSpec(idea="A marketplace for vintage synths")
    briefs = await planner(idea, call_llm=fake_call_llm)

    assert set(briefs.keys()) == set(TeamName)
    assert briefs[TeamName.MOAT_SCORING].focus == "Focus for moat_scoring"
    assert captured_prompt["schema"] is TeamBriefSet
    assert "A marketplace for vintage synths" in captured_prompt["prompt"]
    # No separate industry/geography input: the prompt instructs inference
    # from the idea text itself instead of asking for those as fields.
    assert "infer" in captured_prompt["prompt"].lower()
