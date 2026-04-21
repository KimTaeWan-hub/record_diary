from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from models import get_model
from auth import get_current_user

router = APIRouter(prefix="/classify", tags=["classify"])

DEFAULT_CATEGORIES = ["식당", "영화", "드라마", "전시", "만남", "여행", "공연"]


class ClassifyRequest(BaseModel):
    content: str
    categories: list[str] = DEFAULT_CATEGORIES


class ClassifyResponse(BaseModel):
    category: str
    is_new: bool
    confidence: float


@router.post("", response_model=ClassifyResponse)
async def classify_activity(
    req: ClassifyRequest,
    user_id: str = Depends(get_current_user),
):
    """활동 텍스트를 카테고리로 자동 분류"""
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="content가 비어 있습니다.")

    model = get_model()
    result = model.classify_activity(req.content, req.categories)

    return ClassifyResponse(
        category=result.get("category", "기타"),
        is_new=result.get("is_new", False),
        confidence=result.get("confidence", 0.0),
    )
