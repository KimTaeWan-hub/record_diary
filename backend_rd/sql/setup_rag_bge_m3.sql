-- ================================================================
-- BGE-M3 전환 SQL — Supabase SQL Editor에서 실행
-- ※ 기존 diary_embeddings 테이블이 있으면 삭제 후 재생성
-- ================================================================

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 기존 테이블 삭제 (차원이 달라 재생성 필요)
DROP TABLE IF EXISTS diary_embeddings;

-- 3. BGE-M3용 1024차원 테이블 생성
CREATE TABLE diary_embeddings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  date        date        UNIQUE NOT NULL,
  content     text        NOT NULL,
  embedding   vector(1024),               -- BGE-M3: 1024차원
  metadata    jsonb       DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 4. HNSW 인덱스 (코사인 유사도)
CREATE INDEX diary_embeddings_hnsw
  ON diary_embeddings USING hnsw (embedding vector_cosine_ops);

-- 5. 검색 함수 (1024차원으로 재생성)
DROP FUNCTION IF EXISTS search_diary_embeddings;

CREATE OR REPLACE FUNCTION search_diary_embeddings(
  query_embedding vector(1024),
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
