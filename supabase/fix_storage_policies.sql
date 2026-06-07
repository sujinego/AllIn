-- =============================================
-- post-images 버킷 Storage RLS 정책
-- Supabase SQL Editor에서 실행하세요
-- (버킷 자체는 Dashboard > Storage > New bucket 에서
--  이름 "post-images", Public 옵션 켜고 미리 생성되어 있어야 합니다)
-- =============================================

-- 업로드 경로는 `${userId}/파일명` 형태이므로,
-- 폴더명(첫 경로 조각)이 본인 uid와 일치할 때만 업로드를 허용합니다.
CREATE POLICY "post_images_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public 버킷이므로 누구나 이미지를 조회할 수 있어야 합니다.
CREATE POLICY "post_images_storage_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- 본인이 올린 파일만 삭제 가능 (게시글 수정/삭제 시 정리용).
CREATE POLICY "post_images_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
