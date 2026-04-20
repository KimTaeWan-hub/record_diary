const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:8000";

// ── 활동 카테고리 분류 ──────────────────────────────────────────

export interface ClassifyResult {
  category: string;
  is_new: boolean;
  confidence: number;
}

export async function classifyActivity(
  content: string,
  categories: string[]
): Promise<ClassifyResult> {
  const res = await fetch(`${AI_API_BASE}/api/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, categories }),
  });

  if (!res.ok) {
    throw new Error(`분류 실패: ${res.status}`);
  }

  return res.json();
}

// ── AI 검색 ────────────────────────────────────────────────────

export interface SearchMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SearchResult {
  answer: string;
  route: string;
  sources: object[];
}

export async function searchDiary(
  query: string,
  history: SearchMessage[] = []
): Promise<SearchResult> {
  const res = await fetch(`${AI_API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, history }),
  });

  if (!res.ok) {
    throw new Error(`검색 실패: ${res.status}`);
  }

  return res.json();
}

// ── 인덱싱 ─────────────────────────────────────────────────────

export async function indexDate(date: string): Promise<void> {
  // record 페이지 저장 후 호출 — 해당 날짜 임베딩 갱신
  try {
    await fetch(`${AI_API_BASE}/api/index/date`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
  } catch {
    // 인덱싱 실패는 조용히 무시 (검색 기능이 핵심 기능은 아님)
  }
}
