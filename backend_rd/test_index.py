"""
실제 데이터 인덱싱 테스트 스크립트
실행: python test_index.py
"""
import asyncio
import os
os.environ.setdefault("EMBEDDING_MODEL", "bge-m3")

from services.rag import index_all_users, index_date
from config import SUPABASE_URL, SUPABASE_KEY
import httpx

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

async def main():
    print("=== 인덱싱 테스트 시작 ===\n")

    # 전체 유저 인덱싱 실행
    print("전체 유저 데이터 인덱싱 중...")
    result = await index_all_users()

    if not result:
        print("✗ 인덱싱할 유저 데이터가 없습니다.")
        print("  → Supabase에 diaries / activities / expenses 데이터가 있는지 확인하세요.")
        return

    print(f"\n✓ 인덱싱 완료")
    for user_id, summary in result.items():
        print(f"\n  유저: {user_id[:8]}...")
        print(f"    전체 날짜 : {summary.get('total', 0)}일")
        print(f"    인덱싱 성공 : {summary.get('indexed', 0)}일")
        print(f"    스킵 (데이터 없음) : {summary.get('skipped', 0)}일")
        print(f"    오류 : {summary.get('errors', 0)}일")

        # 오류가 있으면 날짜별로 상세 재실행
        if summary.get('errors', 0) > 0:
            print("\n  [오류 상세 확인 중...]")
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.get(
                    f"{SUPABASE_URL}/rest/v1/diaries",
                    params={"user_id": f"eq.{user_id}", "select": "date"},
                    headers=HEADERS,
                )
                dates = [r["date"] for r in res.json()]
            for date_str in dates:
                detail = await index_date(user_id, date_str)
                if detail["status"] == "error":
                    print(f"  ✗ {date_str} 오류: {detail.get('detail', '알 수 없음')}")

asyncio.run(main())
