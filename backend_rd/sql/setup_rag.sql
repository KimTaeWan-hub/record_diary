-- ================================================================
-- RAG 설정 SQL — Supabase SQL Editor에서 실행
-- ================================================================

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 일기 임베딩 테이블 생성
--    EMBEDDING_MODEL=openai → 1536차원 (text-embedding-3-small)
--    EMBEDDING_MODEL=ollama → 768차원  (nomic-embed-text)
CREATE TABLE IF NOT EXISTS diary_embeddings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  date        date        UNIQUE NOT NULL,
  content     text        NOT NULL,        -- 청크 전체 텍스트 (일기+활동+지출)
  embedding   vector(1536),               -- OpenAI 기준, ollama 사용 시 768로 변경
  metadata    jsonb       DEFAULT '{}',   -- year, month, categories 등
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 3. HNSW 인덱스 (코사인 유사도 기반 빠른 검색)
CREATE INDEX IF NOT EXISTS diary_embeddings_hnsw
  ON diary_embeddings USING hnsw (embedding vector_cosine_ops);

-- 4. 유사도 검색 함수
CREATE OR REPLACE FUNCTION search_diary_embeddings(
  query_embedding vector(1536),
  match_count     int     DEFAULT 5,
  filter_year     int     DEFAULT NULL,
  filter_month    int     DEFAULT NULL
)
RETURNS TABLE (
  date        date,
  content     text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.date,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM diary_embeddings de
  WHERE
    (filter_year  IS NULL OR (de.metadata->>'year')::int  = filter_year)
    AND (filter_month IS NULL OR (de.metadata->>'month')::int = filter_month)
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
