from app.models import TeamName
from app.rag.collections import COLLECTIONS, TEAM_COLLECTIONS


def test_every_team_has_exactly_one_distinct_collection():
    assert set(TEAM_COLLECTIONS.keys()) == set(TeamName)
    assert set(TEAM_COLLECTIONS.values()) == set(COLLECTIONS)
    assert len(set(TEAM_COLLECTIONS.values())) == len(TeamName)
