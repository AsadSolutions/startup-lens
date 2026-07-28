from app.models import TeamName

COLLECTIONS = (
    "market_data",
    "competitors",
    "investments",
    "moat_cases",
    "gtm_playbooks",
)

TEAM_COLLECTIONS: dict[TeamName, str] = {
    TeamName.MARKET_RESEARCH: "market_data",
    TeamName.COMPETITOR_ANALYSIS: "competitors",
    TeamName.INVESTMENT_LANDSCAPE: "investments",
    TeamName.MOAT_SCORING: "moat_cases",
    TeamName.GTM_STRATEGY: "gtm_playbooks",
}

EMBEDDING_DIM = 1536  # text-embedding-3-small
