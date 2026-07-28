import pytest
from pydantic import ValidationError

from app.config import Settings


def test_settings_has_model_map_for_every_role(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("TAVILY_API_KEY", "test-key")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    settings = Settings(_env_file=None)
    for role in ("planner", "researcher", "analyst", "writer", "composer"):
        assert role in settings.model_map


def test_settings_requires_qdrant_url_from_env_not_a_hardcoded_default(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("TAVILY_API_KEY", "test-key")
    monkeypatch.delenv("QDRANT_URL", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_qdrant_api_key_defaults_to_none_not_a_hardcoded_secret(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("TAVILY_API_KEY", "test-key")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.delenv("QDRANT_API_KEY", raising=False)
    settings = Settings(_env_file=None)
    assert settings.qdrant_api_key is None
