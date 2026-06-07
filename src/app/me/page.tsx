import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/posts/PostCard'
import TimelineCard from '@/components/timeline/TimelineCard'
import { formatDate } from '@/lib/utils'
import { User as UserIcon, FileText, Hammer, PenSquare } from 'lucide-react'
import type { Post, Timeline } from '@/types'

async function getMyPosts(userId: string): Promise<Post[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('posts')
      .select('*, users!posts_user_id_fkey(id, nickname), post_images(id, url, is_cover, sort_order)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

async function getMyTimelines(userId: string): Promise<Timeline[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('timelines')
      .select('*, timeline_entries(id, stage, entry_date)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

export default async function MePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login?next=/me')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const [posts, timelines] = await Promise.all([
    getMyPosts(session.user.id),
    getMyTimelines(session.user.id),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 프로필 */}
      <div className="flex items-center gap-4 mb-10 p-5 rounded-2xl border bg-white"
        style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-center w-14 h-14 rounded-full"
          style={{ background: 'var(--bg-secondary)' }}>
          <UserIcon size={24} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {profile?.nickname ?? session.user.email}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {profile?.email ?? session.user.email}
            {profile?.created_at && ` · ${formatDate(profile.created_at)} 가입`}
          </p>
        </div>
      </div>

      {/* 내가 작성한 후기 */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FileText size={18} style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              내가 작성한 후기
            </h2>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {posts.length}개
            </span>
          </div>
          <Link href="/posts/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <PenSquare size={14} /> 후기 작성
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border"
            style={{ borderColor: 'var(--color-border)', background: 'white' }}>
            <p className="text-3xl mb-2">📝</p>
            <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              아직 작성한 후기가 없습니다
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* 내가 작성한 공사일정 */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Hammer size={18} style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              내가 작성한 공사일정
            </h2>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {timelines.length}개
            </span>
          </div>
          <Link href="/timeline/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <PenSquare size={14} /> 공사일정 시작
          </Link>
        </div>

        {timelines.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border"
            style={{ borderColor: 'var(--color-border)', background: 'white' }}>
            <p className="text-3xl mb-2">🏗️</p>
            <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              아직 작성한 공사일정이 없습니다
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {timelines.map(timeline => (
              <TimelineCard key={timeline.id} timeline={timeline} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
