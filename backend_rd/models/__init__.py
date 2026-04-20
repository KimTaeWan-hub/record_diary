from config import ACTIVE_MODEL
from models.base import AIModel


def get_model() -> AIModel:
    """ACTIVE_MODEL 설정에 따라 모델 인스턴스 반환"""
    if ACTIVE_MODEL == "claude":
        from models.claude import ClaudeModel
        return ClaudeModel()
    elif ACTIVE_MODEL == "openai":
        from models.openai_model import OpenAIModel
        return OpenAIModel()
    elif ACTIVE_MODEL == "gemini":
        from models.gemini import GeminiModel
        return GeminiModel()
    elif ACTIVE_MODEL == "ollama":
        from models.ollama_model import OllamaModel
        return OllamaModel()
    else:
        raise ValueError(f"지원하지 않는 모델: {ACTIVE_MODEL}. (claude | openai | gemini | ollama)")
