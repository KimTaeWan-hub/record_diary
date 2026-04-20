import json
from models import get_model


async def route_query(query: str) -> dict:
    """
    사용자 쿼리를 분류하여 처리 방식 결정.

    Returns:
        {
            "type": "expense_sql" | "activity_sql" | "semantic",
            "year": int | None,
            "month": int | None,
            "category": str | None,   # activity_sql일 때
        }
    """
    model = get_model()

    prompt = f"""사용자 질문을 분류해줘.

질문: "{query}"

분류 기준:
- "expense_sql" : 지출 금액·합계·카테고리별 지출 관련
  예) "이번 달 얼마 썼어?", "3월 식비 합계", "교통비 내역"
- "activity_sql": 활동 목록 관련
  예) "올해 본 영화", "지난달 간 식당 목록", "이번 달 만남 기록"
- "semantic"    : 일기 내용·감정·기억·경험·주관적 서술 관련
  예) "요즘 기분이 어때?", "봄에 뭘 했어?", "행복했던 날"

연도/월도 감지해줘. 현재 연도는 2026년이야.
"이번 달" = 2026년 4월, "지난달" = 2026년 3월.
activity_sql이면 언급된 카테고리명도 추출해줘 (없으면 null).

반드시 JSON만 반환해:
{{"type": "semantic", "year": null, "month": null, "category": null}}"""

    result = model.chat([{"role": "user", "content": prompt}])
    raw = result.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    parsed = json.loads(raw)
    return {
        "type":     parsed.get("type", "semantic"),
        "year":     parsed.get("year"),
        "month":    parsed.get("month"),
        "category": parsed.get("category"),
    }
