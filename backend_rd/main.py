import asyncio
import logging
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import ACTIVE_MODEL
from routers import classify, search, index
from services.rag import index_all_users

logger = logging.getLogger(__name__)


async def _nightly_index():
    logger.info("[cron] 자정 전체 인덱싱 시작")
    try:
        result = await index_all_users()
        logger.info(f"[cron] 완료: {result}")
    except Exception as e:
        logger.error(f"[cron] 오류: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        _nightly_index,
        CronTrigger(hour=0, minute=5),  # 매일 00:05 KST 기준
    )
    scheduler.start()
    logger.info("[scheduler] 자정 인덱싱 스케줄러 시작됨")
    yield
    scheduler.shutdown()


app = FastAPI(title="현대판 일상 실록 AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(index.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "active_model": ACTIVE_MODEL}


@app.get("/health")
def health():
    return {"status": "ok", "active_model": ACTIVE_MODEL}
