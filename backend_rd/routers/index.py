from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from services.rag import index_date, index_all

router = APIRouter(prefix="/index", tags=["index"])


class IndexDateRequest(BaseModel):
    date: str  # "YYYY-MM-DD"


@router.post("/date")
async def index_one_date(req: IndexDateRequest):
    """특정 날짜 하나를 임베딩하여 저장 (record 페이지 저장 후 호출)"""
    result = await index_date(req.date)
    return result


@router.post("/full")
async def index_all_dates(background_tasks: BackgroundTasks):
    """
    전체 날짜 일괄 인덱싱 (백그라운드 실행).
    처음 설정하거나 임베딩 모델을 변경했을 때 사용.
    """
    background_tasks.add_task(index_all)
    return {"status": "started", "message": "백그라운드에서 전체 인덱싱 중입니다."}
