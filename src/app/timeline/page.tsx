import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TimelineCard from '@/components/timeline/TimelineCard'
import { PenSquare } from 'lucide-react'
import type { Timeline } from '@/types'

async function getTimelines(): Promise<Timeline[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('timelines')
      .select('*, timeline_entries(id, stage, entry_date)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user ?? null
  } catch {
    return null
  }
}

export default async function TimelinePage() {
  const [timelines, user] = await Promise.all([getTimelines(), getCurrentUser()])

  const stats = {
    total: timelines.length,
    inProgress: timelines.filter(t => t.status === 'in_progress').length,
    completed: timelines.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            🏗️ 공사일지
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            착공부터 입주까지, 셀프 인테리어 공사 과정을 일기처럼 기록하세요
          </p>
        </div>
        {user && (
          <Link
            href="/timeline/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: 'var(--color-accent)' }}
          >
            <PenSquare size={15} /> 새 프로젝트 시작
          </Link>
        )}
      </div>

      {/* 통계 */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: '전체 프로젝트', value: stats.total },
            { label: '진행중', value: stats.inProgress },
            { label: '완료', value: stats.completed },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border p-4 text-center"
              style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {s.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 공사 단계 안내 */}
      <div className="bg-white rounded-2xl border p-5 mb-8"
        style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          공사 단계별 기록
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {(['🔨 착공', '⛏️ 철거', '🪵 바닥', '🚿 욕실', '🍳 주방', '🖼️ 도배', '🎨 도장', '💡 조명', '🛋️ 가구', '🏠 입주']).map(s => (
            <span key={s} className="px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'var(--bg-secondary)', color: 'var(--color-text-secondary)' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* 목록 */}
      {timelines.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border"
          style={{ borderColor: 'var(--color-border)', background: 'white' }}>
          <p className="text-5xl mb-4">🏗️</p>
          <p className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            아직 공사일지가 없습니다
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            첫 번째 인테리어 공사일지를 작성해보세요!
          </p>
          {user ? (
            <Link href="/timeline/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-medium"
              style={{ background: 'var(--color-accent)' }}>
              <PenSquare size={16} /> 프로젝트 시작하기
            </Link>
          ) : (
            <Link href="/auth/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-medium"
              style={{ background: 'var(--color-accent)' }}>
              로그인하고 시작하기
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {timelines.map(timeline => (
            <TimelineCard key={timeline.id} timeline={timeline} />
          ))}
        </div>
      )}
    </div>
  )
}
