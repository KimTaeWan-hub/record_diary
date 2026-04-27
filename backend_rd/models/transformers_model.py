import json
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText
from models.base import AIModel

MODEL_ID = "google/gemma-4-E2B-it"

# 싱글톤 — 서버 시작 후 최초 1회만 로딩
_processor = None
_model = None


def _load():
    global _processor, _model
    if _model is None:
        print(f"[TransformersModel] 모델 로딩 중: {MODEL_ID}")
        _processor = AutoProcessor.from_pretrained(MODEL_ID)
        _model = AutoModelForImageTextToText.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat16,
            device_map="auto",
        )
        _model.eval()
        print("[TransformersModel] 로딩 완료")
    return _processor, _model


class TransformersModel(AIModel):
    def __init__(self):
        self.processor, self.model = _load()

    def _generate(self, messages: list[dict], max_new_tokens: int = 512) -> str:
        inputs = self.processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_tensors="pt",
            return_dict=True,
        ).to(self.model.device, dtype=torch.bfloat16)

        with torch.inference_mode():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
            )

        # 입력 토큰 이후 부분만 디코딩
        generated = output_ids[0][inputs["input_ids"].shape[-1]:]
        return self.processor.decode(generated, skip_special_tokens=True).strip()

    def chat(self, messages: list[dict], system: str = "") -> str:
        hf_messages = []
        if system:
            hf_messages.append({
                "role": "system",
                "content": [{"type": "text", "text": system}],
            })
        for m in messages:
            hf_messages.append({
                "role": m["role"],
                "content": [{"type": "text", "text": m["content"]}],
            })
        return self._generate(hf_messages, max_new_tokens=1024)

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

        messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
        raw = self._generate(messages, max_new_tokens=128)

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        return json.loads(raw)
