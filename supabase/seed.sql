-- ============================================================
-- 샘플 데이터 seed.sql
-- 실행 순서:
-- 1. 먼저 회원가입 페이지에서 계정 2개 만들기
--    - demo1@test.com / password123  (닉네임: 마포집주인)
--    - demo2@test.com / password123  (닉네임: 분당셀프러)
-- 2. Supabase Dashboard > Authentication > Users 에서
--    두 유저의 UUID를 복사
-- 3. 아래 UID1, UID2 자리에 실제 UUID 붙여넣기
-- 4. SQL Editor에서 실행
-- ============================================================

-- ↓ 여기에 실제 유저 UUID 입력 (Authentication > Users 탭에서 복사)
DO $$
DECLARE
  uid1 UUID := '11111111-1111-1111-1111-111111111111';   -- demo1@test.com 의 UUID
  uid2 UUID := '22222222-2222-2222-2222-222222222222';   -- demo2@test.com 의 UUID
  pid1 UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  pid2 UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  pid3 UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  pid4 UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  pid5 UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
BEGIN

  -- 게시글 5건
  INSERT INTO public.posts (
    id, user_id, category, title, content,
    region_city, region_district, area_sqm, area_pyeong,
    construction_days, completion_year,
    company_name, is_company_public,
    total_cost, cost_per_pyeong,
    style_tags, is_ad, status,
    view_count, like_count, bookmark_count
  ) VALUES

  (pid1, uid1, 'turnkey',
    '마포 아파트 34평 모던 인테리어 — 견적 대비 실제 비용 공개',
    E'작년 이사하면서 오래된 아파트를 전체 리모델링했습니다.\n\n처음 받은 견적은 4,200만원이었는데 최종 결제는 4,650만원이 나왔어요. 추가금이 발생한 이유는 욕실 방수 재작업(80만원)과 베란다 확장 시 발견된 결로 처리(150만원), 그리고 제가 중간에 주방 싱크대를 업그레이드 요청해서(+220만원)입니다.\n\n업체는 전반적으로 만족스러웠어요. 시공 퀄리티는 괜찮았고 일정도 약속대로 지켜줬습니다. 다만 추가금 협의 과정이 좀 불투명해서 아쉬웠어요.',
    '서울', '마포구', 112.0, 33.9, 35, 2024,
    '스타일공간', true, 46500000, 1371593,
    ARRAY['모던', '아파트', '미니멀'], false, 'active', 142, 18, 7),

  (pid2, uid2, 'self',
    '분당 오피스텔 25평 반셀프 북유럽 인테리어 — 총 1,800만원',
    E'1인 가구라 큰 공사는 필요 없었고, 도배/바닥/조명 위주로 직접 셀프로 진행했어요.\n\n바닥은 이케아 라미네이트 마루를 직접 시공했는데 유튜브 보면서 하니까 생각보다 어렵지 않았어요. 하루 8시간 투자해서 이틀 만에 완료했습니다.\n\n전체적으로 업체에 맡겼으면 3,500만원 이상 나왔을 것 같은데 반셀프로 하니 1,800만원으로 해결했어요.',
    '경기', '성남시 분당구', 82.6, 25.0, 14, 2024,
    NULL, false, 18000000, 720000,
    ARRAY['북유럽', '미니멀', '오피스텔'], false, 'active', 289, 42, 21),

  (pid3, uid1, 'turnkey',
    '해운대 아파트 42평 올수리 후기 — 업체 3곳 견적 비교',
    E'해운대 신축 아파트 42평 풀옵션 인테리어입니다. 업체 3곳에서 견적을 받았어요.\n\nA업체: 6,800만원\nB업체: 5,400만원\nC업체: 5,800만원\n\n최종적으로 B업체로 계약했는데 최종 5,950만원이 나왔습니다. 업체 선택할 때는 포트폴리오보다 시공 현장을 직접 방문해보는 게 중요했어요.',
    '부산', '해운대구', 138.8, 42.0, 45, 2023,
    '해운대인테리어', true, 59500000, 1416667,
    ARRAY['클래식', '아파트', '모던'], false, 'active', 521, 67, 34),

  (pid4, uid2, 'self',
    '강남 20평 원룸 인더스트리얼 셀프 인테리어 — 500만원 완성',
    E'월세 원룸인데 원상복구 가능한 방법으로만 진행했어요.\n\n핵심은 복구 가능한 범위에서만 작업하는 것입니다.\n- 벽지 위에 포인트 시트지 부착\n- 이케아 가구로 구성\n- 펜던트 조명 추가\n\n가장 효과 좋았던 건 펜던트 조명이에요. 2만원짜리 조명 하나만 바꿔도 분위기가 완전히 달라집니다.',
    '서울', '강남구', 49.6, 15.0, 7, 2024,
    NULL, false, 5000000, 333333,
    ARRAY['인더스트리얼', '빈티지', '오피스텔'], false, 'active', 634, 89, 55),

  (pid5, uid1, 'turnkey',
    '인천 송도 33평 내추럴 인테리어 — 신혼집 전 과정 공개',
    E'결혼하면서 신혼집 인테리어를 처음 진행해봤어요.\n\n가장 중요한 게 컨셉 정하기인 것 같아요. 저희는 우드+화이트 내추럴 컨셉으로 잡고 모든 선택을 이 기준으로 했어요.\n\n총 3,200만원에 계약해서 최종 3,380만원 나왔어요. 추가금은 주방 상부장 추가(100만원)와 타일 변경(80만원)이었습니다.',
    '인천', '연수구', 109.1, 33.0, 30, 2024,
    '송도홈디자인', true, 33800000, 1024242,
    ARRAY['내추럴', '북유럽', '아파트'], false, 'active', 198, 31, 19);

  -- 비용 항목
  INSERT INTO public.cost_items (post_id, category, label, amount) VALUES
  (pid1, 'demolition', '전체 철거', 2500000),
  (pid1, 'floor', '강마루 시공', 5800000),
  (pid1, 'wallpaper', '전체 도배', 3200000),
  (pid1, 'bathroom', '욕실 2개', 8500000),
  (pid1, 'kitchen', '싱크대+아일랜드', 12000000),
  (pid1, 'lighting', '전체 조명', 2800000),
  (pid1, 'furniture', '드레스룸 제작', 6500000),
  (pid1, 'electrical', '전기 콘센트', 1200000),
  (pid1, 'other', '기타', 4000000),

  (pid2, 'floor', '이케아 마루 직접시공', 2700000),
  (pid2, 'wallpaper', '도배 (인건비 포함)', 1500000),
  (pid2, 'lighting', '전체 조명 교체', 400000),
  (pid2, 'furniture', '이케아 가구', 7800000),
  (pid2, 'kitchen', '싱크대 교체', 4000000),
  (pid2, 'other', '소품/커튼', 1600000),

  (pid3, 'demolition', '전체 철거', 3200000),
  (pid3, 'floor', '강마루 전체', 7500000),
  (pid3, 'wallpaper', '실크 도배', 4800000),
  (pid3, 'bathroom', '욕실 2개 풀리모델링', 12000000),
  (pid3, 'kitchen', '빌트인 주방', 15000000),
  (pid3, 'lighting', '간접+펜던트', 4500000),
  (pid3, 'furniture', '붙박이장 3개', 9000000),
  (pid3, 'window', '이중창 교체', 3500000),

  (pid4, 'furniture', '이케아 가구 전체', 2800000),
  (pid4, 'lighting', '펜던트+레일조명', 350000),
  (pid4, 'wallpaper', '포인트 시트지', 120000),
  (pid4, 'other', '소품/선반', 730000),
  (pid4, 'floor', '러그/매트류', 250000),
  (pid4, 'other', '커튼/블라인드', 750000),

  (pid5, 'demolition', '부분 철거', 1800000),
  (pid5, 'floor', '강마루 전체', 5200000),
  (pid5, 'wallpaper', '합지 도배', 2400000),
  (pid5, 'bathroom', '욕실 1개 리모델링', 4500000),
  (pid5, 'kitchen', '싱크대 교체', 6800000),
  (pid5, 'lighting', '전체 조명', 2200000),
  (pid5, 'furniture', '붙박이장 2개', 6500000),
  (pid5, 'other', '도어+기타', 4400000);

  -- 이미지
  INSERT INTO public.post_images (post_id, url, is_cover, sort_order) VALUES
  (pid1, 'https://picsum.photos/seed/int1/800/600', true, 0),
  (pid1, 'https://picsum.photos/seed/int2/800/600', false, 1),
  (pid1, 'https://picsum.photos/seed/int3/800/600', false, 2),
  (pid2, 'https://picsum.photos/seed/int4/800/600', true, 0),
  (pid2, 'https://picsum.photos/seed/int5/800/600', false, 1),
  (pid3, 'https://picsum.photos/seed/int6/800/600', true, 0),
  (pid3, 'https://picsum.photos/seed/int7/800/600', false, 1),
  (pid3, 'https://picsum.photos/seed/int8/800/600', false, 2),
  (pid4, 'https://picsum.photos/seed/int9/800/600', true, 0),
  (pid4, 'https://picsum.photos/seed/int10/800/600', false, 1),
  (pid5, 'https://picsum.photos/seed/int11/800/600', true, 0),
  (pid5, 'https://picsum.photos/seed/int12/800/600', false, 1);

  -- 댓글
  INSERT INTO public.comments (post_id, user_id, content) VALUES
  (pid1, uid2, '저도 비슷한 평수인데 추가금 협의 부분이 너무 공감됩니다!'),
  (pid2, uid1, '이케아 마루 직접 시공 유튜브 링크 공유해주실 수 있나요?'),
  (pid3, uid2, '부산에서 이 가격이면 합리적인 편인가요?'),
  (pid5, uid2, '신혼집 준비 중인데 계약서 팁이 너무 도움됐어요!');

END $$;
