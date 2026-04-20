import json
import anthropic
from config import ANTHROPIC_API_KEY
from models.base import AIModel


class ClaudeModel(AIModel):
    MODEL_ID = "claude-sonnet-4-6"

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    def classify_activity(self, content: str, categories: list[str]) -> dict:
        categories_str = ", ".join(categories)
        prompt = f"""다음 활동 텍스트를 카테고리로 분류해줘.

활동: {content}
기존 카테고리: {categories_str}

규칙:
1. 기존 카테고리 중 가장 적합한 것을 선택해.
2. 어떤 카테고리도 맞지 않으면 새 카테고리명을 제안해 (한국어, 2~5글자).
3. 반드시 JSON만 반환해. 다른 텍스트 없이.

응답 형식:
{{"category": "카테고리명", "is_new": false, "confidence": 0.95}}"""

        response = self.client.messages.create(
            model=self.MODEL_ID,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()
        return json.loads(raw)

    def chat(self, messages: list[dict], system: str = "") -> str:
        kwargs = {
            "model": self.MODEL_ID,
            "max_tokens": 2048,
            "messages": messages,
        }
        if system:
            kwargs["system"] = system

        response = self.client.messages.create(**kwargs)
        return response.content[0].text
