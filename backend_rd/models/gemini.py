import json
import google.generativeai as genai
from config import GEMINI_API_KEY
from models.base import AIModel


class GeminiModel(AIModel):
    MODEL_ID = "gemini-1.5-flash"

    def __init__(self):
        genai.configure(api_key=GEMINI_API_KEY)
        self.client = genai.GenerativeModel(self.MODEL_ID)

    def classify_activity(self, content: str, categories: list[str]) -> dict:
        categories_str = ", ".join(categories)
        prompt = f"""다음 활동 텍스트를 카테고리로 분류해줘.

활동: {content}
기존 카테고리: {categories_str}

규칙:
1. 기존 카테고리 중 가장 적합한 것을 선택해.
2. 어떤 카테고리도 맞지 않으면 새 카테고리명을 제안해 (한국어, 2~5글자).
3. 반드시 JSON만 반환해. 다른 텍스트 없이. 마크다운 코드블록도 없이.

응답 형식:
{{"category": "카테고리명", "is_new": false, "confidence": 0.95}}"""

        response = self.client.generate_content(prompt)
        raw = response.text.strip()

        # Gemini가 ```json ... ``` 감싸서 줄 때 대비
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        return json.loads(raw)

    def chat(self, messages: list[dict], system: str = "") -> str:
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        last_message = messages[-1]["content"]
        if system:
            last_message = f"{system}\n\n{last_message}"

        chat = self.client.start_chat(history=history)
        response = chat.send_message(last_message)
        return response.text
