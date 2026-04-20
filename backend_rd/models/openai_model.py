import json
from openai import OpenAI
from config import OPENAI_API_KEY
from models.base import AIModel


class OpenAIModel(AIModel):
    MODEL_ID = "gpt-4o-mini"

    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)

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

        response = self.client.chat.completions.create(
            model=self.MODEL_ID,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content.strip()
        return json.loads(raw)

    def chat(self, messages: list[dict], system: str = "") -> str:
        formatted = []
        if system:
            formatted.append({"role": "system", "content": system})
        formatted.extend(messages)

        response = self.client.chat.completions.create(
            model=self.MODEL_ID,
            messages=formatted,
            max_tokens=2048,
        )
        return response.choices[0].message.content
