import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/posts/PostCard'
import { ArrowRight, TrendingUp, MapPin, Layers } from 'lucide-react'
import type { Post } from '@/types'

async function getRecentPosts(): Promise<Post[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('posts')
      .select('*, users!posts_user_id_fkey(id, nickname), post_images(id, url, is_cover, sort_order)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8)
    return data ?? []
  } catch {
    return []
  }
}

async function getStats() {
  try {
    const supabase = await createClient()
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { data: costData } = await supabase
      .from('posts')
      .select('total_cost, area_pyeong')
      .eq('status', 'active')

    let avgCostPerPyeong = 0
    if (costData && costData.length > 0) {
      const validData = costData.filter(d => d.area_pyeong > 0)
      avgCostPerPyeong = validData.reduce((sum, d) => sum + d.total_cost / d.area_pyeong, 0) / (validData.length || 1)
    }

    return { totalPosts: totalPosts ?? 0, avgCostPerPyeong: Math.round(avgCostPerPyeong) }
  } catch {
    return { totalPosts: 0, avgCostPerPyeong: 0 }
  }
}

export default async function HomePage() {
  const [posts, stats] = await Promise.all([getRecentPosts(), getStats()])

  return (
    <div>
      {/* 히어로 */}
      <section className="py-16 md:py-24 px-4" style={{ background: 'linear-gradient(160deg, #FAF8F4 0%, #F4EFE6 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            style={{ background: 'var(--bg-secondary)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}>
            <TrendingUp size={14} />
            인테리어 비용 투명화 프로젝트
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            같은 평수,<br />
            <span style={{ color: 'var(--color-accent)' }}>왜 가격이 다를까요?</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            반셀프 · 턴키 인테리어 실제 시공 비용과 후기를 공유하세요.<br />
            숨겨진 추가 비용 없이, 투명한 정보로 현명한 선택을.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/posts"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-semibold text-base shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: 'var(--color-accent)' }}
            >
              후기 둘러보기 <ArrowRight size={18} />
            </Link>
            <Link
              href="/posts/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-base border hover:bg-white transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              내 후기 작성하기
            </Link>
          </div>
        </div>
      </section>

      {/* 통계 */}
      {stats.totalPosts > 0 && (
        <section className="py-6 border-y" style={{ borderColor: 'var(--color-border)', background: 'white' }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {stats.totalPosts.toLocaleString()}건
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>누적 후기</p>
              </div>
              {stats.avgCostPerPyeong > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                    {Math.round(stats.avgCostPerPyeong / 10000).toLocaleString()}만원
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>평균 평당 단가</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 카테고리 카드 */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/posts?category=self"
            className="group p-6 rounded-2xl border hover:shadow-md transition-shadow bg-white"
            style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl mb-3">🔨</div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  반셀프 인테리어
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  직접 자재를 구매하고 일부 시공을 진행한 후기를 확인하세요.
                  DIY 인테리어의 실제 비용과 노하우를 공유합니다.
                </p>
              </div>
              <ArrowRight size={20} className="mt-1 group-hover:translate-x-1 transition-transform"
                style={{ color: 'var(--color-accent-light)' }} />
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              {['직접 시공', '자재 비용', 'DIY 꿀팁'].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--color-text-secondary)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>

          <Link href="/posts?category=turnkey"
            className="group p-6 rounded-2xl border hover:shadow-md transition-shadow bg-white"
            style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl mb-3">🏢</div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  턴키 업체 인테리어
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  업체에 전부 맡긴 시공 경험을 나눠요. 실제 견적과 결제 금액 차이,
                  업체 선택 기준을 투명하게 공유합니다.
                </p>
              </div>
              <ArrowRight size={20} className="mt-1 group-hover:translate-x-1 transition-transform"
                style={{ color: 'var(--color-accent-light)' }} />
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              {['업체 후기', '견적 비교', '추가 금액'].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--color-text-secondary)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>

          <Link href="/timeline"
            className="group p-6 rounded-2xl border hover:shadow-md transition-shadow bg-white"
            style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl mb-3">🏗️</div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  공사일정 타임라인
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  착공부터 입주까지 공사 과정을 일기처럼 기록하세요.
                  단계별 일지와 캘린더로 진행상황을 한눈에 확인.
                </p>
              </div>
              <ArrowRight size={20} className="mt-1 group-hover:translate-x-1 transition-transform"
                style={{ color: 'var(--color-accent-light)' }} />
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              {['착공→철거→도배→입주', '날짜별 캘린더', '공정별 비용'].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--color-text-secondary)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        </div>
      </section>

      {/* 최근 후기 */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            최근 후기
          </h2>
          <Link href="/posts" className="flex items-center gap-1 text-sm font-medium hover:underline"
            style={{ color: 'var(--color-accent)' }}>
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border"
            style={{ borderColor: 'var(--color-border)', background: 'white' }}>
            <p className="text-4xl mb-3">🏠</p>
            <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              아직 후기가 없습니다
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              첫 번째 인테리어 후기를 작성해보세요!
            </p>
            <Link href="/posts/new"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'var(--color-accent)' }}>
              후기 작성하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="mx-4 mb-16 p-8 md:p-12 rounded-3xl text-center"
        style={{ background: 'var(--color-accent-dark)', color: 'white' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">
            인테리어 비용, 직접 공유해주세요
          </h2>
          <p className="mt-3 text-sm md:text-base opacity-80 leading-relaxed">
            여러분의 실제 경험이 다음 사람의 현명한 선택을 돕습니다.<br />
            업체명 공개 여부는 자유롭게 선택할 수 있어요.
          </p>
          <Link href="/posts/new"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'white', color: 'var(--color-accent-dark)' }}>
            지금 바로 작성하기 <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
