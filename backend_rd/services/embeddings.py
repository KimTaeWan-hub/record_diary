import httpx
from config import EMBEDDING_MODEL, OPENAI_API_KEY

OLLAMA_BASE_URL = "http://localhost:11434"

# 임베딩 모델별 벡터 차원
EMBEDDING_DIMENSIONS = {
    "openai": 1536,   # text-embedding-3-small
    "bge-m3": 1024,   # BAAI/bge-m3 (한국어 강력 추천)
    "ollama": 768,    # nomic-embed-text (기타 ollama 모델)
}


def get_embedding_dim() -> int:
    return EMBEDDING_DIMENSIONS.get(EMBEDDING_MODEL, 1024)


def get_embedding(text: str) -> list[float]:
    """텍스트를 벡터로 변환 (EMBEDDING_MODEL 설정에 따라 모델 선택)"""
    if EMBEDDING_MODEL == "openai":
        return _openai_embed(text)
    elif EMBEDDING_MODEL == "bge-m3":
        return _ollama_embed(text, model="bge-m3")
    elif EMBEDDING_MODEL == "ollama":
        return _ollama_embed(text, model="nomic-embed-text")
    else:
        raise ValueError(f"지원하지 않는 임베딩 모델: {EMBEDDING_MODEL} (openai | bge-m3 | ollama)")


def _openai_embed(text: str) -> list[float]:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def _ollama_embed(text: str, model: str) -> list[float]:
    response = httpx.post(
        f"{OLLAMA_BASE_URL}/api/embeddings",
        json={"model": model, "prompt": text},
        timeout=60.0,
    )
    response.raise_for_status()
    return response.json()["embedding"]
