-- ================================================================
-- Auth 마이그레이션 — Supabase SQL Editor에서 실행
-- Google 소셜 로그인 + 멀티유저 RLS 설정
-- ================================================================

-- 1. 모든 테이블에 user_id 추가
ALTER TABLE diaries
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE incomes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE activity_categories
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE expense_categories
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE income_categories
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE diary_embeddings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. INSERT 시 user_id 자동 주입 트리거
--    (프론트에서 별도로 user_id를 보내지 않아도 됨)
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['diaries','activities','expenses','incomes',
                            'activity_categories','expense_categories','income_categories']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_user_id_%1$s ON %1$s;
      CREATE TRIGGER set_user_id_%1$s
        BEFORE INSERT ON %1$s
        FOR EACH ROW EXECUTE FUNCTION set_user_id();
    ', t);
  END LOOP;
END $$;

-- 3. RLS 활성화
ALTER TABLE diaries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_embeddings     ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 (본인 데이터만 읽기/쓰기)
CREATE POLICY "own_diaries" ON diaries
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_activities" ON activities
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_expenses" ON expenses
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_incomes" ON incomes
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_activity_categories" ON activity_categories
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_expense_categories" ON expense_categories
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_income_categories" ON income_categories
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- diary_embeddings: 백엔드(service role)만 접근 — 프론트 직접 접근 차단
CREATE POLICY "backend_only_embeddings" ON diary_embeddings
  USING (false);

-- 5. diary_embeddings 검색 함수에 user_id 필터 추가
DROP FUNCTION IF EXISTS search_diary_embeddings;

CREATE OR REPLACE FUNCTION search_diary_embeddings(
  query_embedding vector(1024),
  match_count     int     DEFAULT 5,
  filter_year     int     DEFAULT NULL,
  filter_month    int     DEFAULT NULL,
  filter_user_id  uuid    DEFAULT NULL
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
    (filter_user_id IS NULL OR de.user_id = filter_user_id)
    AND (filter_year  IS NULL OR (de.metadata->>'year')::int  = filter_year)
    AND (filter_month IS NULL OR (de.metadata->>'month')::int = filter_month)
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
