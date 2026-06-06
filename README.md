# 인테리어 비용공개 — MVP

반셀프/턴키 인테리어 실제 시공 비용과 후기를 공유하는 커뮤니티 플랫폼.

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel + Supabase (모두 무료 티어)

## 시작하기

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 에서 무료 계정 생성
2. New Project 생성
3. `supabase/schema.sql` 파일 내용을 **SQL Editor**에 전체 복사 후 실행
4. **Storage** → **New bucket** → 이름: `post-images`, Public: **ON** 으로 버킷 생성
5. **Settings → API** 에서 URL과 anon key 복사

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열어 Supabase 값 입력:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인

## 주요 기능

| 기능 | 설명 |
|---|---|
| 후기 작성 | 반셀프/턴키 선택, 사진 최대 20장, 비용 항목별 입력 |
| 비용 차트 | 항목별 파이 차트 + 평당 단가 자동 계산 |
| 필터/검색 | 카테고리, 지역, 평수, 비용 범위, 스타일 태그 |
| 좋아요/북마크 | 마음에 드는 후기 저장 |
| 댓글 | 대댓글 포함 |
| 신고 시스템 | 7가지 신고 유형, 3건 이상 자동 블라인드 |
| 광고 표시 | 표시광고법 대응 협찬 여부 체크박스 |

## 파일 구조

```
src/
├── app/
│   ├── page.tsx              # 홈 (히어로 + 최신 후기)
│   ├── posts/
│   │   ├── page.tsx          # 후기 목록 + 필터
│   │   ├── new/page.tsx      # 후기 작성
│   │   └── [id]/page.tsx     # 후기 상세
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── me/bookmarks/page.tsx
├── components/
│   ├── layout/               # Header, Footer
│   ├── posts/                # PostCard, PostFilter, CostChart 등
│   └── comments/             # CommentSection
└── lib/
    ├── supabase/             # 클라이언트 설정
    └── utils.ts              # 유틸리티 함수
```

## Vercel 배포

```bash
# Vercel CLI
npm i -g vercel
vercel

# 환경 변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 법적 고려사항

- 게시글 신고 3건 이상 시 자동 블라인드 (DB 트리거)
- 광고/협찬 후기 필수 표시 체크박스 (표시광고법)
- 업체명 입력 시 허위사실 경고 문구
- 이미지 업로드 시 개인정보 포함 주의 안내
- 작성 전 법적 책임 동의 체크박스 2개 필수
