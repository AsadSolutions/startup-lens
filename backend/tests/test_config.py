from app.config import Settings


def test_settings_has_model_map_for_every_role(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("TAVILY_API_KEY", "test-key")
    settings = Settings(_env_file=None)
    for role in ("planner", "researcher", "analyst", "writer"):
        assert role in settings.model_map
