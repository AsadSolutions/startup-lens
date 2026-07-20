from fastapi import APIRouter

router = APIRouter()


@router.get("/api/runs/{run_id}/trace")
async def get_run_trace(run_id: str):
    """Orchestration trace: timings, token spend, failures.
    Implemented in Roadmap Phase 2 (checkpointing) / Phase 4 (trace page)."""
    raise NotImplementedError("run trace lands in Roadmap Phase 2/4")
