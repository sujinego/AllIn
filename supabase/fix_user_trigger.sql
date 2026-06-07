-- =============================================
-- auth.users → public.users 자동 동기화 트리거
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 새 auth 유저 생성 시 public.users 행을 자동으로 만들어주는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 카카오 등 이메일 동의항목(사업자등록증 필요) 없이 가입한 경우 NEW.email이 NULL일 수 있음
  -- → 고유한 더미 이메일을 채워 NOT NULL/UNIQUE 제약을 만족시킴
  INSERT INTO public.users (id, email, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'kakao_' || NEW.id::text || '@kakao.local'),
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      '사용자' || substr(NEW.id::text, 1, 8)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 등록 (이미 있으면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 이미 가입했지만 public.users에 행이 없는 유저 복구
-- (현재 문제가 있는 계정을 즉시 고칩니다)
-- =============================================
INSERT INTO public.users (id, email, nickname)
SELECT
  au.id,
  COALESCE(au.email, 'kakao_' || au.id::text || '@kakao.local'),
  COALESCE(
    au.raw_user_meta_data->>'nickname',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    '사용자' || substr(au.id::text, 1, 8)
  )
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
