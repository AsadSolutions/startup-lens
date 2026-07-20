import pytest

from app.graph.orchestrator import intake


def test_intake_rejects_blank_idea():
    with pytest.raises(ValueError):
        intake("   ", None, None)


def test_intake_normalizes_idea_and_defaults():
    idea = intake("  A marketplace for vintage synths  ", None, None)
    assert idea.idea == "A marketplace for vintage synths"
    assert idea.industry is None
    assert idea.geography is None


def test_intake_keeps_industry_and_geography():
    idea = intake("A marketplace for vintage synths", "music gear", "US")
    assert idea.industry == "music gear"
    assert idea.geography == "US"
