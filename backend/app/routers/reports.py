from fastapi import APIRouter

router = APIRouter()


@router.get("/api/reports/examples")
async def list_example_reports():
    """Precomputed example reports. Implemented in Roadmap Phase 5."""
    raise NotImplementedError("example reports land in Roadmap Phase 5")
