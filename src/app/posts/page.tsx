import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/posts/PostCard'
import PostFilter from '@/components/posts/PostFilter'
import type { Post, PostFilters } from '@/types'
import { sqmToPyeong } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

async function getPosts(filters: PostFilters): Promise<{ posts: Post[]; total: number }> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('posts')
      .select('*, users(id, nickname), post_images(id, url, is_cover, sort_order)', { count: 'exact' })
      .eq('status', 'active')

    if (filters.category) query = query.eq('category', filters.category)
    if (filters.region_city) query = query.eq('region_city', filters.region_city)
    if (filters.area_min) query = query.gte('area_pyeong', filters.area_min)
    if (filters.area_max) query = query.lte('area_pyeong', filters.area_max)
    if (filters.cost_min) query = query.gte('total_cost', filters.cost_min * 10000)
    if (filters.cost_max) query = query.lte('total_cost', filters.cost_max * 10000)
    if (filters.style_tags && filters.style_tags.length > 0) {
      query = query.overlaps('style_tags', filters.style_tags)
    }

    const sort = filters.sort ?? 'latest'
    if (sort === 'popular') query = query.order('like_count', { ascending: false })
    else if (sort === 'cost_asc') query = query.order('total_cost', { ascending: true })
    else if (sort === 'cost_desc') query = query.order('total_cost', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const page = filters.page ?? 1
    const limit = filters.limit ?? 12
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { posts: data ?? [], total: count ?? 0 }
  } catch {
    return { posts: [], total: 0 }
  }
}

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v[0] : v
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v)
  if (!s) return undefined
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}
function arr(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v : [v]
}

export default async function PostsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const filters: PostFilters = {
    category: str(sp.category) as PostFilters['category'],
    region_city: str(sp.region_city),
    area_min: num(sp.area_min),
    area_max: num(sp.area_max),
    cost_min: num(sp.cost_min),
    cost_max: num(sp.cost_max),
    style_tags: arr(sp.style_tags),
    sort: (str(sp.sort) as PostFilters['sort']) ?? 'latest',
    page: num(sp.page) ?? 1,
    limit: 12,
  }

  const { posts, total } = await getPosts(filters)
  const totalPages = Math.ceil(total / 12)
  const currentPage = filters.page ?? 1

  const categoryLabel = filters.category === 'self' ? '반셀프' : filters.category === 'turnkey' ? '턴키업체' : '전체'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {categoryLabel} 인테리어 후기
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          총 {total.toLocaleString()}개의 후기
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 사이드바 필터 */}
        <aside className="lg:w-60 flex-shrink-0">
          <Suspense fallback={null}>
            <PostFilter />
          </Suspense>
        </aside>

        {/* 게시글 그리드 */}
        <div className="flex-1 min-w-0">
          {posts.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border"
              style={{ borderColor: 'var(--color-border)', background: 'white' }}>
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                조건에 맞는 후기가 없습니다
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                필터를 변경하거나 첫 번째 후기를 작성해보세요
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && arr[idx - 1] !== p - 1
                      return (
                        <span key={p} className="flex items-center gap-2">
                          {showEllipsis && (
                            <span className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>…</span>
                          )}
                          <a
                            href={`/posts?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => !Array.isArray(v))), page: String(p) })}`}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors"
                            style={{
                              background: p === currentPage ? 'var(--color-accent)' : 'white',
                              color: p === currentPage ? 'white' : 'var(--color-text-secondary)',
                              border: `1px solid ${p === currentPage ? 'transparent' : 'var(--color-border)'}`,
                            }}
                          >
                            {p}
                          </a>
                        </span>
                      )
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
