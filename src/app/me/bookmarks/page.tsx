import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/posts/PostCard'
import { Bookmark } from 'lucide-react'

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  const { data } = await supabase
    .from('bookmarks')
    .select('post_id, posts(*, users!posts_user_id_fkey(id, nickname), post_images(*))')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const posts = (data ?? []).map((b: { posts: unknown }) => b.posts).filter(Boolean)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark size={22} style={{ color: 'var(--color-accent)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          저장한 후기
        </h1>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {posts.length}개
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border"
          style={{ borderColor: 'var(--color-border)', background: 'white' }}>
          <Bookmark size={40} className="mx-auto mb-3" style={{ color: 'var(--color-accent-light)' }} />
          <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            저장한 후기가 없습니다
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            마음에 드는 후기를 저장해보세요
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {posts.map((post: unknown) => (
            <PostCard key={(post as { id: string }).id} post={post as Parameters<typeof PostCard>[0]['post']} />
          ))}
        </div>
      )}
    </div>
  )
}
