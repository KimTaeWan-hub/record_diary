"""
벡터 검색 테스트 스크립트
실행: python test_search.py
"""
import asyncio
import os
os.environ.setdefault("EMBEDDING_MODEL", "bge-m3")

from config import SUPABASE_URL, SUPABASE_KEY
from services.rag import search_similar
import httpx

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


async def get_any_user_id() -> str | None:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/diary_embeddings",
            params={"select": "user_id", "limit": "1"},
            headers=HEADERS,
        )
        data = res.json()
        return data[0]["user_id"] if data else None


async def main():
    print("=== 벡터 검색 테스트 ===\n")

    user_id = await get_any_user_id()
    if not user_id:
        print("✗ diary_embeddings에 데이터가 없습니다. 먼저 test_index.py를 실행하세요.")
        return

    # Supabase에 저장된 청크 원문 확인
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/diary_embeddings",
            params={"select": "date,content", "user_id": f"eq.{user_id}"},
            headers=HEADERS,
        )
        rows = res.json()

    print("저장된 청크 목록:")
    for row in rows:
        print(f"\n  [{row['date']}]")
        print("  " + "\n  ".join(row["content"].splitlines()))

    # 검색 테스트
    queries = [
        "최근에 뭐 먹었어?",
        "지출이 많았던 날은?",
        "기분이 좋았던 날",
    ]

    print("\n" + "="*40)
    print("검색 테스트")
    print("="*40)

    from services.embeddings import get_embedding

    for query in queries:
        print(f"\n질문: {query}")
        embedding = get_embedding(query)
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/search_diary_embeddings",
                headers=HEADERS,
                json={
                    "query_embedding": embedding,
                    "match_count": 2,
                    "filter_user_id": user_id,
                },
            )
        print(f"  HTTP 상태: {res.status_code}")
        print(f"  응답: {res.text[:300]}")


asyncio.run(main())
