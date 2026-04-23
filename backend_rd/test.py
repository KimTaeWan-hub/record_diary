"""
임베딩 동작 확인 스크립트
실행: python test.py
"""
import os
os.environ.setdefault("EMBEDDING_MODEL", "bge-m3")

from services.embeddings import get_embedding

print("모델 로딩 중... (첫 실행 시 다운로드로 시간이 걸릴 수 있습니다)")

text = "오늘은 친구와 강남에서 파스타를 먹었다. 날씨가 맑아서 기분이 좋았다."
embedding = get_embedding(text)

print(f"\n✓ 임베딩 성공")
print(f"  입력 텍스트 : {text}")
print(f"  벡터 차원   : {len(embedding)}")
print(f"  첫 5개 값   : {[round(v, 6) for v in embedding[:5]]}")

# 차원 검증
assert len(embedding) == 1024, f"차원 오류: {len(embedding)} (기대값: 1024)"
print(f"\n✓ 차원 검증 통과 (1024)")

# 유사도 테스트 — 비슷한 문장은 가깝고, 다른 문장은 멀어야 함
import numpy as np

e1 = get_embedding("오늘 점심에 파스타를 먹었다")
e2 = get_embedding("오늘 친구와 이탈리안 레스토랑에 갔다")
e3 = get_embedding("주식 시장이 오늘 크게 하락했다")

def cosine_sim(a, b):
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

sim_related = cosine_sim(e1, e2)
sim_unrelated = cosine_sim(e1, e3)

print(f"\n유사도 테스트:")
print(f"  '파스타' vs '이탈리안 레스토랑' : {sim_related:.4f}  (높아야 정상)")
print(f"  '파스타' vs '주식 하락'         : {sim_unrelated:.4f}  (낮아야 정상)")

if sim_related > sim_unrelated:
    print("\n✓ 유사도 테스트 통과 — 임베딩이 정상 동작합니다")
else:
    print("\n✗ 유사도 테스트 실패 — 모델 확인 필요")
