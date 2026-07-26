from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str
    tavily_api_key: str

    model_map: dict[str, str] = {
        "planner": "gpt-4o-mini",
        "researcher": "gpt-4o-mini",
        "analyst": "gpt-4o",
        "writer": "gpt-4o-mini",
        "composer": "gpt-4o",
    }
    team_token_budget: int = 20_000
    team_timeout_seconds: int = 90


settings = Settings()
