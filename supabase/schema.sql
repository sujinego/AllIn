-- ============================================================
-- 인테리어 비용공개 플랫폼 — Supabase 스키마
-- Supabase SQL Editor에 전체 복사 후 실행
-- ============================================================

-- uuid 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  nickname    TEXT UNIQUE NOT NULL CHECK (length(nickname) BETWEEN 2 AND 20),
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'business', 'admin')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category            TEXT NOT NULL CHECK (category IN ('self', 'turnkey')),
  title               TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 200),
  content             TEXT NOT NULL,
  region_city         TEXT NOT NULL,
  region_district     TEXT,
  area_sqm            NUMERIC(8,2) NOT NULL CHECK (area_sqm > 0),
  area_pyeong         NUMERIC(8,2),
  construction_days   INTEGER CHECK (construction_days > 0),
  completion_year     SMALLINT CHECK (completion_year BETWEEN 2000 AND 2035),
  company_name        TEXT CHECK (length(company_name) <= 100),
  is_company_public   BOOLEAN NOT NULL DEFAULT true,
  total_cost          BIGINT NOT NULL CHECK (total_cost > 0),
  cost_per_pyeong     BIGINT,
  style_tags          TEXT[] NOT NULL DEFAULT '{}',
  is_ad               BOOLEAN NOT NULL DEFAULT false,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blinded', 'deleted')),
  view_count          INTEGER NOT NULL DEFAULT 0,
  like_count          INTEGER NOT NULL DEFAULT 0,
  bookmark_count      INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_region_city ON public.posts(region_city);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_style_tags ON public.posts USING GIN(style_tags);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_active" ON public.posts FOR SELECT USING (status = 'active');
CREATE POLICY "posts_insert_auth" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- COST_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cost_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  label       TEXT,
  amount      BIGINT NOT NULL CHECK (amount >= 0),
  memo        TEXT
);

CREATE INDEX idx_cost_items_post_id ON public.cost_items(post_id);

ALTER TABLE public.cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_items_select_all" ON public.cost_items FOR SELECT USING (true);
CREATE POLICY "cost_items_insert_auth" ON public.cost_items FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.posts WHERE id = post_id));
CREATE POLICY "cost_items_delete_own" ON public.cost_items FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.posts WHERE id = post_id));

-- ============================================================
-- POST_IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  is_cover    BOOLEAN NOT NULL DEFAULT false,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_images_post_id ON public.post_images(post_id);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_images_select_all" ON public.post_images FOR SELECT USING (true);
CREATE POLICY "post_images_insert_auth" ON public.post_images FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.posts WHERE id = post_id));
CREATE POLICY "post_images_delete_own" ON public.post_images FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.posts WHERE id = post_id));

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blinded', 'deleted')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_active" ON public.comments FOR SELECT USING (status = 'active');
CREATE POLICY "comments_insert_auth" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select_own" ON public.likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- REPORTS (신고)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type   TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id     UUID NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN (
    'false_info', 'defamation', 'ad_not_disclosed',
    'privacy', 'copyright', 'spam', 'other'
  )),
  detail        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  admin_note    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_auth" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- ============================================================
-- TIMELINE_STAGE_PLANS (공정별 예정 기간)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timeline_stage_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id   UUID NOT NULL REFERENCES public.timelines(id) ON DELETE CASCADE,
  stage         TEXT NOT NULL,
  planned_start DATE NOT NULL,
  planned_end   DATE NOT NULL CHECK (planned_end >= planned_start),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(timeline_id, stage)
);

CREATE INDEX idx_stage_plans_timeline ON public.timeline_stage_plans(timeline_id);

ALTER TABLE public.timeline_stage_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stage_plans_select" ON public.timeline_stage_plans FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.timelines
    WHERE id = timeline_id AND (is_public = true OR user_id = auth.uid())
  )
);
CREATE POLICY "stage_plans_insert_own" ON public.timeline_stage_plans FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.timelines WHERE id = timeline_id));
CREATE POLICY "stage_plans_update_own" ON public.timeline_stage_plans FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.timelines WHERE id = timeline_id));
CREATE POLICY "stage_plans_delete_own" ON public.timeline_stage_plans FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.timelines WHERE id = timeline_id));

-- ============================================================
-- TIMELINE_TASKS (간트차트 할일)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timeline_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id  UUID NOT NULL REFERENCES public.timelines(id) ON DELETE CASCADE,
  phase_id     TEXT NOT NULL,
  title        TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL CHECK (end_date >= start_date),
  memo         TEXT,
  done         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_tasks_timeline ON public.timeline_tasks(timeline_id);
CREATE INDEX idx_timeline_tasks_phase ON public.timeline_tasks(timeline_id, phase_id);

ALTER TABLE public.timeline_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_tasks_select" ON public.timeline_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.timelines WHERE id = timeline_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "timeline_tasks_insert_own" ON public.timeline_tasks FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.timelines WHERE id = timeline_id));
CREATE POLICY "timeline_tasks_update_own" ON public.timeline_tasks FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.timelines WHERE id = timeline_id));
CREATE POLICY "timeline_tasks_delete_own" ON public.timeline_tasks FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.timelines WHERE id = timeline_id));

CREATE TRIGGER timeline_tasks_updated_at
  BEFORE UPDATE ON public.timeline_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TIMELINE_CHECKLIST_ITEMS (할일 하위 체크리스트)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timeline_checklist_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id   UUID NOT NULL REFERENCES public.timeline_tasks(id) ON DELETE CASCADE,
  text      TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 200),
  done      BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_task ON public.timeline_checklist_items(task_id);

ALTER TABLE public.timeline_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_select" ON public.timeline_checklist_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.timeline_tasks t
    JOIN public.timelines tl ON tl.id = t.timeline_id
    WHERE t.id = task_id AND (tl.is_public = true OR tl.user_id = auth.uid())
  )
);
CREATE POLICY "checklist_insert_own" ON public.timeline_checklist_items FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT tl.user_id FROM public.timeline_tasks t JOIN public.timelines tl ON tl.id = t.timeline_id WHERE t.id = task_id)
  );
CREATE POLICY "checklist_update_own" ON public.timeline_checklist_items FOR UPDATE
  USING (
    auth.uid() = (SELECT tl.user_id FROM public.timeline_tasks t JOIN public.timelines tl ON tl.id = t.timeline_id WHERE t.id = task_id)
  );
CREATE POLICY "checklist_delete_own" ON public.timeline_checklist_items FOR DELETE
  USING (
    auth.uid() = (SELECT tl.user_id FROM public.timeline_tasks t JOIN public.timelines tl ON tl.id = t.timeline_id WHERE t.id = task_id)
  );

-- ============================================================
-- STORAGE (이미지 버킷 설정)
-- Supabase Dashboard > Storage > New bucket 에서 설정
-- Bucket name: post-images, Public: true
-- ============================================================

-- ============================================================
-- 자동 신고 카운트로 블라인드 처리 (3건 이상 시)
-- ============================================================
CREATE OR REPLACE FUNCTION auto_blind_on_reports()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT COUNT(*) INTO report_count
    FROM public.reports
    WHERE target_type = 'post' AND target_id = NEW.target_id AND status = 'pending';

    IF report_count >= 3 THEN
      UPDATE public.posts SET status = 'blinded' WHERE id = NEW.target_id AND status = 'active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reports_auto_blind
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION auto_blind_on_reports();
