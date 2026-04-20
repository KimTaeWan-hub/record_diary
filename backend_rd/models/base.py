from abc import ABC, abstractmethod


class AIModel(ABC):
    """모든 AI 모델이 구현해야 하는 공통 인터페이스"""

    @abstractmethod
    def classify_activity(self, content: str, categories: list[str]) -> dict:
        """
        활동 텍스트를 카테고리로 분류.

        Args:
            content: 분류할 활동 텍스트 (예: "메가박스 - 프로젝트 헤일메리")
            categories: 선택 가능한 카테고리 목록

        Returns:
            {
                "category": str,       # 선택된 카테고리
                "is_new": bool,        # 기존 카테고리에 없는 새 카테고리인지
                "confidence": float,   # 0.0 ~ 1.0
            }
        """
        ...

    @abstractmethod
    def chat(self, messages: list[dict], system: str = "") -> str:
        """
        일반 대화 (RAG 검색 등 범용 용도).

        Args:
            messages: [{"role": "user"|"assistant", "content": str}, ...]
            system: 시스템 프롬프트

        Returns:
            AI 응답 문자열
        """
        ...
