from fastapi import APIRouter
from pydantic import BaseModel
from models import get_model
from services.query_router import route_query
from services.rag import search_similar, fetch_expenses_summary, fetch_activities_by_category

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    history: list[dict] = []  # [{"role": "user"|"assistant", "content": str}]


class SearchResponse(BaseModel):
    answer: str
    route: str          # 어떤 방식으로 처리됐는지 (디버깅용)
    sources: list[dict] # 참조한 원본 데이터


@router.post("", response_model=SearchResponse)
async def search(req: SearchRequest):
    """
    사용자 질문을 받아 적절한 방식으로 처리 후 AI 답변 반환.

    처리 흐름:
        1. 쿼리 분류 (expense_sql | activity_sql | semantic)
        2-a. expense_sql  → Supabase expenses 조회 → AI 요약
        2-b. activity_sql → Supabase activities 조회 → AI 요약
        2-c. semantic     → 벡터 검색 → 유사 청크 → AI 답변 생성
    """
    route_info = await route_query(req.query)
    route_type = route_info["type"]
    year  = route_info.get("year")
    month = route_info.get("month")
    model = get_model()

    # ── expense_sql ───────────────────────────────────────────────
    if route_type == "expense_sql":
        expenses = await fetch_expenses_summary(year, month)
        if not expenses:
            return SearchResponse(
                answer="해당 기간의 지출 데이터가 없습니다.",
                route=route_type,
                sources=[],
            )

        total = sum(e["amount"] for e in expenses)
        by_category: dict[str, int] = {}
        for e in expenses:
            by_category[e["category"]] = by_category.get(e["category"], 0) + e["amount"]
        cat_summary = "\n".join(
            f"  - {cat}: {amt:,}원" for cat, amt in sorted(by_category.items(), key=lambda x: -x[1])
        )

        context = f"""지출 데이터:
총합: {total:,}원
카테고리별:
{cat_summary}

상세 내역 (최근 순):
""" + "\n".join(
            f"  {e['date']} | {e['category']} | {e.get('place','')} {e.get('item','')} | {e['amount']:,}원"
            for e in expenses[:20]
        )

        system = "너는 사용자의 지출 기록을 분석해주는 AI 비서야. 주어진 데이터를 바탕으로 정확하게 답해줘."
        messages = req.history + [{"role": "user", "content": f"데이터:\n{context}\n\n질문: {req.query}"}]
        answer = model.chat(messages, system=system)

        return SearchResponse(answer=answer, route=route_type, sources=expenses[:10])

    # ── activity_sql ──────────────────────────────────────────────
    elif route_type == "activity_sql":
        category = route_info.get("category")
        activities = await fetch_activities_by_category(category, year, month)
        if not activities:
            return SearchResponse(
                answer="해당 조건의 활동 데이터가 없습니다.",
                route=route_type,
                sources=[],
            )

        context = "활동 기록:\n" + "\n".join(
            f"  {a['date']} | {a['category']} | {a['content']}" for a in activities
        )
        system = "너는 사용자의 활동 기록을 정리해주는 AI 비서야. 주어진 데이터를 바탕으로 깔끔하게 정리해줘."
        messages = req.history + [{"role": "user", "content": f"데이터:\n{context}\n\n질문: {req.query}"}]
        answer = model.chat(messages, system=system)

        return SearchResponse(answer=answer, route=route_type, sources=activities)

    # ── semantic (일기 벡터 검색) ─────────────────────────────────
    else:
        chunks = await search_similar(req.query, top_k=5, year=year, month=month)
        if not chunks:
            return SearchResponse(
                answer="관련된 일기 기록을 찾지 못했습니다.",
                route=route_type,
                sources=[],
            )

        context = "\n\n---\n\n".join(
            f"[{c['date']}] (유사도: {c['similarity']:.2f})\n{c['content']}"
            for c in chunks
        )
        system = """너는 사용자의 일기와 기록을 바탕으로 답해주는 AI 비서야.
주어진 기록만을 근거로 답하고, 기록에 없는 내용은 추측하지 마.
날짜와 구체적인 내용을 언급하며 답해줘."""

        messages = req.history + [
            {"role": "user", "content": f"관련 기록:\n{context}\n\n질문: {req.query}"}
        ]
        answer = model.chat(messages, system=system)

        sources = [{"date": c["date"], "similarity": round(c["similarity"], 3)} for c in chunks]
        return SearchResponse(answer=answer, route=route_type, sources=sources)
