-- =============================================
-- 공사일정 타임라인 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 타임라인 프로젝트 테이블
CREATE TABLE IF NOT EXISTS timelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  region_city TEXT,
  area_sqm DECIMAL(6,2),
  area_pyeong DECIMAL(6,2),
  housing_type TEXT,          -- 아파트, 빌라, 오피스텔, 단독주택 등
  is_public BOOLEAN DEFAULT true,
  start_date DATE,
  move_in_date DATE,
  status TEXT DEFAULT 'in_progress'
    CHECK (status IN ('planning', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일지 엔트리 테이블
CREATE TABLE IF NOT EXISTS timeline_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL,         -- planning, demolition, utilities, carpentry, plastering, tile, painting, flooring, furniture, lighting, silicone, cleanup
  entry_date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  images TEXT[],
  cost INTEGER,                -- 해당 공정 비용 (선택)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;

-- timelines RLS 정책
CREATE POLICY "공개 타임라인 누구나 조회" ON timelines
  FOR SELECT USING (is_public = true);

CREATE POLICY "본인 타임라인 조회" ON timelines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 타임라인 생성" ON timelines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 타임라인 수정" ON timelines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인 타임라인 삭제" ON timelines
  FOR DELETE USING (auth.uid() = user_id);

-- timeline_entries RLS 정책
CREATE POLICY "공개 타임라인 일지 조회" ON timeline_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timelines
      WHERE id = timeline_id AND is_public = true
    )
  );

CREATE POLICY "본인 일지 조회" ON timeline_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 타임라인에 일지 생성" ON timeline_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM timelines WHERE id = timeline_id AND user_id = auth.uid())
  );

CREATE POLICY "본인 일지 수정" ON timeline_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인 일지 삭제" ON timeline_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Supabase Storage: timeline-images 버킷 생성 (Storage 탭에서 직접 생성하거나 아래 실행)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('timeline-images', 'timeline-images', true);
