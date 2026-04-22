"""
최초 1회 전체 인덱싱 스크립트.
HTTP 서버 없이 직접 실행: python run_index.py
"""
import asyncio
import httpx
from config import SUPABASE_URL, SUPABASE_KEY
from services.rag import index_all

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}


async def get_all_user_ids() -> list[str]:
    """diaries/activities/expenses 테이블에서 유저 ID 목록 조회"""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/diaries",
            params={"select": "user_id", "limit": "1000"},
            headers=HEADERS,
        )
    rows = res.json() if res.status_code == 200 else []
    ids = list({r["user_id"] for r in rows if "user_id" in r})
    return ids


async def main():
    print("유저 목록 조회 중...")
    user_ids = await get_all_user_ids()

    if not user_ids:
        print("데이터가 없습니다. 먼저 일기/지출/활동을 기록하세요.")
        return

    print(f"총 {len(user_ids)}명 유저 발견\n")

    for uid in user_ids:
        print(f"[{uid}] 인덱싱 시작...")
        result = await index_all(uid)
        print(f"  완료 → 인덱싱: {result['indexed']}개 / 스킵: {result['skipped']}개 / 오류: {result['errors']}개\n")

    print("전체 인덱싱 완료!")


if __name__ == "__main__":
    asyncio.run(main())
