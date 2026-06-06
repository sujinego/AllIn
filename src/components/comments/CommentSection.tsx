'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Flag, Send, CornerDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import ReportModal from '@/components/common/ReportModal'
import type { Comment } from '@/types'

interface Props {
  postId: string
}

export default function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadComments()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null)
    })
  }, [postId])

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, users(id, nickname, avatar_url)')
      .eq('post_id', postId)
      .eq('status', 'active')
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    const { data: replies } = await supabase
      .from('comments')
      .select('*, users(id, nickname, avatar_url)')
      .eq('post_id', postId)
      .eq('status', 'active')
      .not('parent_id', 'is', null)
      .order('created_at', { ascending: true })

    const commentsWithReplies = (data ?? []).map(c => ({
      ...c,
      replies: (replies ?? []).filter(r => r.parent_id === c.id),
    }))
    setComments(commentsWithReplies)
  }

  const submit = async (text: string, parentId?: string) => {
    if (!text.trim()) return
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert('로그인이 필요합니다.')
      setSubmitting(false)
      return
    }
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: session.user.id,
      content: text.trim(),
      parent_id: parentId ?? null,
    })
    setNewComment('')
    setReplyText('')
    setReplyTo(null)
    await loadComments()
    setSubmitting(false)
  }

  const deleteComment = async (id: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    await supabase.from('comments').update({ status: 'deleted' }).eq('id', id)
    await loadComments()
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'pl-8' : ''}`}>
      {isReply && <CornerDownRight size={14} className="mt-2 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />}
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {comment.users?.nickname ?? '익명'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(comment.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isReply && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                답글
              </button>
            )}
            <button
              onClick={() => setReportTarget(comment.id)}
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Flag size={11} />
            </button>
            {currentUserId === comment.user_id && (
              <button
                onClick={() => deleteComment(comment.id)}
                className="text-xs text-red-400"
              >
                삭제
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {comment.content}
        </p>

        {/* 답글 입력 */}
        {replyTo === comment.id && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답글을 작성해주세요..."
              rows={2}
              className="flex-1 px-3 py-2 rounded-xl border text-sm resize-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--bg-primary)' }}
            />
            <button
              onClick={() => submit(replyText, comment.id)}
              disabled={submitting || !replyText.trim()}
              className="px-3 py-2 rounded-xl text-white text-sm disabled:opacity-50"
              style={{ background: 'var(--color-accent)' }}
            >
              <Send size={14} />
            </button>
          </div>
        )}

        {/* 대댓글 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <h3 className="flex items-center gap-2 font-semibold mb-5"
        style={{ color: 'var(--color-text-primary)' }}>
        <MessageSquare size={18} />
        댓글 {comments.length}개
      </h3>

      {/* 댓글 작성 */}
      <div className="flex gap-3 mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="질문이나 도움이 되는 정보를 댓글로 남겨주세요."
          rows={3}
          className="flex-1 px-4 py-3 rounded-2xl border text-sm resize-none"
          style={{ borderColor: 'var(--color-border)', background: 'white' }}
        />
        <button
          onClick={() => submit(newComment)}
          disabled={submitting || !newComment.trim()}
          className="px-4 py-3 rounded-2xl text-white font-medium text-sm disabled:opacity-50 self-end"
          style={{ background: 'var(--color-accent)' }}
        >
          <Send size={16} />
        </button>
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-5">
        {comments.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            첫 번째 댓글을 남겨보세요
          </p>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      {reportTarget && (
        <ReportModal
          targetType="comment"
          targetId={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  )
}
