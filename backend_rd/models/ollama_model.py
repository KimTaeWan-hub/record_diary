import json
import httpx
from models.base import AIModel

OLLAMA_BASE_URL = "http://localhost:11434"


class OllamaModel(AIModel):
    # 사용할 모델명: "gemma3", "gemma4", "llama3.2" 등 ollama pull한 모델
    MODEL_ID = "gemma4"

    def classify_activity(self, content: str, categories: list[str]) -> dict:
        categories_str = ", ".join(categories)
        prompt = f"""다음 활동 텍스트를 카테고리로 분류해줘.

활동: {content}
기존 카테고리: {categories_str}

규칙:
1. 기존 카테고리 중 가장 적합한 것을 선택해.
2. 어떤 카테고리도 맞지 않으면 새 카테고리명을 제안해 (한국어, 2~5글자).
3. 반드시 JSON만 반환해. 마크다운 코드블록이나 다른 텍스트 없이.

응답 형식:
{{"category": "카테고리명", "is_new": false, "confidence": 0.95}}"""

        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": self.MODEL_ID, "prompt": prompt, "stream": False},
            timeout=60.0,
        )
        response.raise_for_status()

        raw = response.json()["response"].strip()

        # 코드블록 감싸진 경우 처리
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        return json.loads(raw)

    def chat(self, messages: list[dict], system: str = "") -> str:
        # Ollama chat API 형식으로 변환
        ollama_messages = []
        if system:
            ollama_messages.append({"role": "system", "content": system})
        for msg in messages:
            ollama_messages.append({"role": msg["role"], "content": msg["content"]})

        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": self.MODEL_ID, "messages": ollama_messages, "stream": False},
            timeout=120.0,
        )
        response.raise_for_status()

        return response.json()["message"]["content"]
