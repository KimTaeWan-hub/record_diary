import os
from dotenv import load_dotenv

load_dotenv()

# 현재 활성 AI 모델: "claude" | "openai" | "gemini" | "ollama"
ACTIVE_MODEL = os.getenv("ACTIVE_MODEL", "claude")

# 임베딩 모델: "openai" | "ollama"
# ※ 한번 정하면 변경 금지 — 벡터 차원이 달라 기존 인덱스와 호환 안됨
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "openai")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
