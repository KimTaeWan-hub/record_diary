from datetime import datetime
import httpx
from config import SUPABASE_URL, SUPABASE_KEY
from services.embeddings import get_embedding

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


# ── 청크 빌더 ─────────────────────────────────────────────────────

def build_chunk(
    date_str: str,
    diary: str | None,
    activities: list[dict],
    expenses: list[dict],
) -> str:
    """하루 데이터를 하나의 텍스트 청크로 변환"""
    parts = [f"날짜: {date_str}"]

    if diary and diary.strip():
        parts.append(f"일기:\n{diary.strip()}")

    if activities:
        lines = [f"  - {a['category']}: {a['content']}" for a in activities]
        parts.append("활동:\n" + "\n".join(lines))

    if expenses:
        lines = [
            f"  - {e['category']} | {e.get('place', '')} {e.get('item', '')} | {e['amount']}원"
            for e in expenses
        ]
        parts.append("지출:\n" + "\n".join(lines))

    return "\n\n".join(parts)


# ── Supabase 데이터 조회 헬퍼 ────────────────────────────────────

async def _fetch_date_data(client: httpx.AsyncClient, date_str: str) -> tuple:
    diary_res, act_res, exp_res = await asyncio.gather(
        client.get(
            f"{SUPABASE_URL}/rest/v1/diaries",
            params={"date": f"eq.{date_str}", "select": "content"},
            headers=HEADERS,
        ),
        client.get(
            f"{SUPABASE_URL}/rest/v1/activities",
            params={"date": f"eq.{date_str}", "type": "eq.bullet",
                    "select": "category,content"},
            headers=HEADERS,
        ),
        client.get(
            f"{SUPABASE_URL}/rest/v1/expenses",
            params={"date": f"eq.{date_str}", "amount": "gt.0",
                    "select": "category,place,item,amount"},
            headers=HEADERS,
        ),
    )
    diaries   = diary_res.json()
    activities = act_res.json()
    expenses   = exp_res.json()
    diary_text = diaries[0]["content"] if diaries else None
    return diary_text, activities, expenses


import asyncio


# ── 날짜 단위 인덱싱 ──────────────────────────────────────────────

async def index_date(date_str: str) -> dict:
    """특정 날짜 데이터를 임베딩하여 diary_embeddings에 upsert"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        diary_text, activities, expenses = await _fetch_date_data(client, date_str)

        if not diary_text and not activities and not expenses:
            return {"status": "skipped", "reason": "데이터 없음"}

        chunk = build_chunk(date_str, diary_text, activities, expenses)
        embedding = get_embedding(chunk)

        dt = datetime.strptime(date_str, "%Y-%m-%d")
        metadata = {
            "year": dt.year,
            "month": dt.month,
            "day": dt.day,
            "has_diary": bool(diary_text and diary_text.strip()),
            "activity_categories": list({a["category"] for a in activities}),
            "expense_total": sum(e["amount"] for e in expenses),
        }

        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/diary_embeddings",
            headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
            json={
                "date": date_str,
                "content": chunk,
                "embedding": embedding,
                "metadata": metadata,
                "updated_at": datetime.utcnow().isoformat(),
            },
        )

        if res.status_code not in (200, 201):
            return {"status": "error", "detail": res.text}
        return {"status": "ok", "date": date_str}


async def index_all() -> dict:
    """저장된 모든 날짜를 순서대로 인덱싱"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 날짜 목록 수집 (diaries + activities + expenses 통합)
        results = await asyncio.gather(
            client.get(f"{SUPABASE_URL}/rest/v1/diaries",
                       params={"select": "date"}, headers=HEADERS),
            client.get(f"{SUPABASE_URL}/rest/v1/activities",
                       params={"select": "date"}, headers=HEADERS),
            client.get(f"{SUPABASE_URL}/rest/v1/expenses",
                       params={"select": "date", "amount": "gt.0"}, headers=HEADERS),
        )
        all_dates = sorted({
            row["date"]
            for res in results
            for row in (res.json() if isinstance(res.json(), list) else [])
        })

    indexed, skipped, errors = 0, 0, 0
    for date_str in all_dates:
        result = await index_date(date_str)
        if result["status"] == "ok":
            indexed += 1
        elif result["status"] == "skipped":
            skipped += 1
        else:
            errors += 1

    return {"total": len(all_dates), "indexed": indexed, "skipped": skipped, "errors": errors}


# ── 벡터 검색 ────────────────────────────────────────────────────

async def search_similar(
    query: str,
    top_k: int = 5,
    year: int | None = None,
    month: int | None = None,
) -> list[dict]:
    """쿼리와 의미적으로 유사한 날짜 청크 반환"""
    embedding = get_embedding(query)

    payload: dict = {"query_embedding": embedding, "match_count": top_k}
    if year:
        payload["filter_year"] = year
    if month:
        payload["filter_month"] = month

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/search_diary_embeddings",
            headers=HEADERS,
            json=payload,
        )

    if res.status_code != 200:
        return []
    return res.json()


# ── SQL 기반 데이터 조회 ─────────────────────────────────────────

async def fetch_expenses_summary(year: int | None, month: int | None) -> list[dict]:
    params = {"select": "date,category,place,item,amount", "amount": "gt.0",
              "order": "date.desc"}
    if year:
        params["date"] = f"gte.{year}-01-01"
    if month and year:
        import calendar
        last_day = calendar.monthrange(year, month)[1]
        params["date"] = f"gte.{year}-{month:02d}-01"
        params["date.lte"] = f"{year}-{month:02d}-{last_day}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/expenses",
            params=params, headers=HEADERS,
        )
    return res.json() if res.status_code == 200 else []


async def fetch_activities_by_category(
    category: str | None,
    year: int | None,
    month: int | None,
) -> list[dict]:
    params = {"select": "date,category,content", "type": "eq.bullet", "order": "date.desc"}
    if category:
        params["category"] = f"eq.{category}"
    if year:
        params["date"] = f"gte.{year}-01-01"

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/activities",
            params=params, headers=HEADERS,
        )
    data = res.json() if res.status_code == 200 else []
    if month:
        data = [a for a in data if int(a["date"].split("-")[1]) == month]
    return data
