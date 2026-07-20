from fastapi import FastAPI

from app.routers.reports import router as reports_router
from app.routers.runs import router as runs_router
from app.routers.validate import router as validate_router

app = FastAPI(title="StartupLens AI")
app.include_router(validate_router)
app.include_router(reports_router)
app.include_router(runs_router)
