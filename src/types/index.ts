export type UserRole = 'user' | 'business' | 'admin'
export type PostCategory = 'self' | 'turnkey'
export type TimelineStatus = 'planning' | 'in_progress' | 'completed'

export const TIMELINE_STAGES = [
  { key: 'planning',    label: '기획·설계',  emoji: '📐', color: '#7F8C8D' },
  { key: 'demolition',  label: '철거',       emoji: '⛏️',  color: '#E74C3C' },
  { key: 'utilities',   label: '설비',       emoji: '🔧', color: '#E67E22' },
  { key: 'carpentry',   label: '목공',       emoji: '🪚', color: '#8E44AD' },
  { key: 'plastering',  label: '미장·방수',  emoji: '🪣', color: '#2980B9' },
  { key: 'tile',        label: '타일',       emoji: '🔲', color: '#16A085' },
  { key: 'painting',    label: '도장',       emoji: '🎨', color: '#F39C12' },
  { key: 'wallpaper',   label: '도배',       emoji: '📋', color: '#EC407A' },
  { key: 'flooring',    label: '바닥',       emoji: '🪵', color: '#D35400' },
  { key: 'furniture',   label: '가구',       emoji: '🛋️',  color: '#27AE60' },
  { key: 'lighting',    label: '조명',       emoji: '💡', color: '#D4AC0D' },
  { key: 'silicone',    label: '실리콘',     emoji: '🔩', color: '#95A5A6' },
  { key: 'cleanup',     label: '입주청소',   emoji: '🏠', color: '#1ABC9C' },
] as const

export type TimelineStageKey = (typeof TIMELINE_STAGES)[number]['key']

export const MILESTONE_STAGES: TimelineStageKey[] = ['demolition', 'tile', 'flooring', 'cleanup']

export interface StagePlan {
  id?: string
  timeline_id: string
  stage: string
  planned_start: string
  planned_end: string
}

export const HOUSING_TYPES = ['아파트', '빌라', '오피스텔', '단독주택', '상가주택', '기타']
export type PostStatus = 'active' | 'blinded' | 'deleted'
export type ReportReason =
  | 'false_info'
  | 'defamation'
  | 'ad_not_disclosed'
  | 'privacy'
  | 'copyright'
  | 'spam'
  | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned'

export const COST_CATEGORIES = [
  { key: 'demolition', label: '철거' },
  { key: 'floor', label: '바닥' },
  { key: 'wallpaper', label: '도배' },
  { key: 'bathroom', label: '욕실' },
  { key: 'kitchen', label: '주방' },
  { key: 'lighting', label: '조명' },
  { key: 'furniture', label: '가구' },
  { key: 'window', label: '창호' },
  { key: 'electrical', label: '전기' },
  { key: 'other', label: '기타' },
] as const

export type CostCategoryKey = (typeof COST_CATEGORIES)[number]['key']

export const STYLE_TAGS = [
  '모던', '미니멀', '북유럽', '내추럴', '빈티지',
  '인더스트리얼', '클래식', '한국식', '아파트', '오피스텔',
]

export const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전',
  '광주', '울산', '세종', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주',
]

export interface User {
  id: string
  email: string
  nickname: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface CostItem {
  id: string
  post_id: string
  category: string
  label?: string
  amount: number
  memo?: string
}

export interface PostImage {
  id: string
  post_id: string
  url: string
  is_cover: boolean
  sort_order: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  category: PostCategory
  title: string
  content: string
  region_city: string
  region_district?: string
  area_sqm: number
  area_pyeong: number
  construction_days?: number
  completion_year?: number
  company_name?: string
  is_company_public: boolean
  total_cost: number
  cost_per_pyeong?: number
  style_tags: string[]
  is_ad: boolean
  status: PostStatus
  view_count: number
  like_count: number
  bookmark_count: number
  created_at: string
  updated_at: string
  // joined
  users?: User
  cost_items?: CostItem[]
  post_images?: PostImage[]
  is_liked?: boolean
  is_bookmarked?: boolean
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id?: string
  content: string
  status: PostStatus
  created_at: string
  users?: User
  replies?: Comment[]
}

export interface Timeline {
  id: string
  user_id: string
  title: string
  description?: string
  region_city?: string
  area_sqm?: number
  area_pyeong?: number
  housing_type?: string
  is_public: boolean
  start_date?: string
  move_in_date?: string
  status: TimelineStatus
  created_at: string
  updated_at: string
  users?: User
  timeline_entries?: TimelineEntry[]
}

export interface TimelineEntry {
  id: string
  timeline_id: string
  user_id: string
  stage: string
  entry_date: string
  title: string
  content?: string
  images?: string[]
  cost?: number
  created_at: string
  updated_at: string
}

export interface TimelineTask {
  id: string
  timeline_id: string
  phase_id: string
  title: string
  start_date: string
  end_date: string
  memo?: string | null
}

export interface Report {
  id: string
  reporter_id: string
  target_type: 'post' | 'comment'
  target_id: string
  reason: ReportReason
  detail?: string
  status: ReportStatus
  created_at: string
}

export interface PostFilters {
  category?: PostCategory
  region_city?: string
  area_min?: number
  area_max?: number
  cost_min?: number
  cost_max?: number
  style_tags?: string[]
  sort?: 'latest' | 'popular' | 'cost_asc' | 'cost_desc'
  page?: number
  limit?: number
}
