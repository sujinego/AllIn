'use client'

import { useState } from 'react'
import { Heart, Bookmark, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ReportModal from '@/components/common/ReportModal'
import { useRouter } from 'next/navigation'

interface Props {
  postId: string
  likeCount: number
  bookmarkCount: number
  isLiked: boolean
  isBookmarked: boolean
}

export default function PostActions({ postId, likeCount, bookmarkCount, isLiked, isBookmarked }: Props) {
  const [liked, setLiked] = useState(isLiked)
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [likes, setLikes] = useState(likeCount)
  const [bookmarks, setBookmarks] = useState(bookmarkCount)
  const [showReport, setShowReport] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const requireAuth = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return null
    }
    return session.user.id
  }

  const toggleLike = async () => {
    const userId = await requireAuth()
    if (!userId) return

    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
      await supabase.from('posts').update({ like_count: likes - 1 }).eq('id', postId)
      setLiked(false)
      setLikes(l => l - 1)
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: userId })
      await supabase.from('posts').update({ like_count: likes + 1 }).eq('id', postId)
      setLiked(true)
      setLikes(l => l + 1)
    }
  }

  const toggleBookmark = async () => {
    const userId = await requireAuth()
    if (!userId) return

    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', userId)
      await supabase.from('posts').update({ bookmark_count: bookmarks - 1 }).eq('id', postId)
      setBookmarked(false)
      setBookmarks(b => b - 1)
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: userId })
      await supabase.from('posts').update({ bookmark_count: bookmarks + 1 }).eq('id', postId)
      setBookmarked(true)
      setBookmarks(b => b + 1)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLike}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-medium transition-colors"
          style={{
            borderColor: liked ? 'var(--color-accent)' : 'var(--color-border)',
            background: liked ? 'var(--bg-secondary)' : 'white',
            color: liked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          도움돼요 {likes > 0 && <span>{likes}</span>}
        </button>

        <button
          onClick={toggleBookmark}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-medium transition-colors"
          style={{
            borderColor: bookmarked ? 'var(--color-accent)' : 'var(--color-border)',
            background: bookmarked ? 'var(--bg-secondary)' : 'white',
            color: bookmarked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}
        >
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
          저장 {bookmarks > 0 && <span>{bookmarks}</span>}
        </button>

        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border text-sm transition-colors ml-auto hover:bg-gray-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <Flag size={14} /> 신고
        </button>
      </div>

      {showReport && (
        <ReportModal
          targetType="post"
          targetId={postId}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
