from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, close_db
from app.api.v1 import router as api_v1_router
from app.services.category import category_service
from app.jobs.recurring_expenses import run_recurring_expenses_job


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await category_service.seed_system()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_recurring_expenses_job, "interval", hours=1)
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS: use "*" to allow all origins (credentials must be False with "*")
_cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
_allow_all = _cors_origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else _cors_origins,
    allow_credentials=not _allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
