import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CostChart from '@/components/posts/CostChart'
import CommentSection from '@/components/comments/CommentSection'
import PostActions from './PostActions'
import { formatCost, formatDate, sqmToPyeong } from '@/lib/utils'
import { MapPin, Maximize2, Calendar, Clock, Building2, AlertTriangle, Pencil } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*, users!posts_user_id_fkey(id, nickname, avatar_url), cost_items(*), post_images(*)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!post) notFound()

  // 조회수 증가
  await supabase.from('posts').update({ view_count: post.view_count + 1 }).eq('id', id)

  const { data: { session } } = await supabase.auth.getSession()
  let isLiked = false
  let isBookmarked = false
  if (session) {
    const [likeRes, bookmarkRes] = await Promise.all([
      supabase.from('likes').select('post_id').eq('post_id', id).eq('user_id', session.user.id).maybeSingle(),
      supabase.from('bookmarks').select('post_id').eq('post_id', id).eq('user_id', session.user.id).maybeSingle(),
    ])
    isLiked = !!likeRes.data
    isBookmarked = !!bookmarkRes.data
  }

  const images = post.post_images?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) ?? []
  const coverImage = images.find((i: { is_cover: boolean }) => i.is_cover) ?? images[0]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* 카테고리 + 광고 배지 */}
      <div className="flex gap-2 mb-4">
        <span className="px-3 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ background: post.category === 'self' ? 'var(--color-accent)' : 'var(--color-accent-dark)' }}>
          {post.category === 'self' ? '반셀프 인테리어' : '턴키 업체 인테리어'}
        </span>
        {post.is_ad && (
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: '#FEF3C7', color: '#92400E' }}>
            광고/협찬
          </span>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
        {post.title}
      </h1>

      {/* 메타 정보 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}>
        <span className="font-medium">{post.users?.nickname ?? '익명'}</span>
        <span>{formatDate(post.created_at)}</span>
        <span>조회 {post.view_count.toLocaleString()}</span>
        {session?.user.id === post.user_id && (
          <Link
            href={`/posts/${post.id}/edit`}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <Pencil size={13} /> 수정
          </Link>
        )}
      </div>

      {/* 핵심 정보 카드 */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <MapPin size={14} />, label: '지역', value: `${post.region_city}${post.region_district ? ' ' + post.region_district : ''}` },
          { icon: <Maximize2 size={14} />, label: '평수', value: `${post.area_pyeong}평 (${post.area_sqm}㎡)` },
          { icon: null, label: '총 비용', value: formatCost(post.total_cost), highlight: true },
          { icon: null, label: '평당 단가', value: post.cost_per_pyeong ? formatCost(post.cost_per_pyeong) : '-' },
        ].map((item, i) => (
          <div key={i} className="p-3 rounded-2xl border text-center"
            style={{ borderColor: 'var(--color-border)', background: item.highlight ? 'var(--bg-secondary)' : 'white' }}>
            <p className="text-xs mb-1 flex items-center justify-center gap-1"
              style={{ color: 'var(--color-text-muted)' }}>
              {item.icon}{item.label}
            </p>
            <p className="font-bold text-sm" style={{ color: item.highlight ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* 추가 정보 */}
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {post.construction_days && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'white', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <Clock size={13} /> 공사 {post.construction_days}일
          </span>
        )}
        {post.completion_year && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'white', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <Calendar size={13} /> {post.completion_year}년 완공
          </span>
        )}
        {post.category === 'turnkey' && post.company_name && post.is_company_public && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'white', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <Building2 size={13} /> {post.company_name}
          </span>
        )}
      </div>

      {/* 스타일 태그 */}
      {post.style_tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.style_tags.map((tag: string) => (
            <Link key={tag} href={`/posts?style_tags=${tag}`}
              className="px-2.5 py-1 rounded-full text-xs hover:opacity-80"
              style={{ background: 'var(--bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* 액션 버튼 (좋아요/북마크/신고) */}
      <div className="mt-6">
        <PostActions
          postId={post.id}
          likeCount={post.like_count}
          bookmarkCount={post.bookmark_count}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
        />
      </div>

      {/* 이미지 갤러리 */}
      {images.length > 0 && (
        <div className="mt-8">
          {coverImage && (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-3">
              <Image
                src={coverImage.url}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          {images.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.filter((img: { id: string }) => img.id !== coverImage?.id).map((img: { id: string; url: string }) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden">
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 비용 차트 */}
      {post.cost_items?.length > 0 && (
        <div className="mt-8 p-6 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'white' }}>
          <CostChart costItems={post.cost_items} totalCost={post.total_cost} />
        </div>
      )}

      {/* 본문 */}
      <div className="mt-8 p-6 rounded-2xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <div className="prose prose-sm max-w-none text-sm leading-8 whitespace-pre-wrap"
          style={{ color: 'var(--color-text-secondary)' }}>
          {post.content}
        </div>
      </div>

      {/* 광고 안내 */}
      {post.is_ad && (
        <div className="mt-4 p-3 rounded-xl flex items-start gap-2 text-xs"
          style={{ background: '#FEF3C7', color: '#92400E' }}>
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          이 게시글은 업체로부터 경제적 대가를 받고 작성된 광고/협찬 후기입니다.
        </div>
      )}

      {/* 댓글 */}
      <div className="mt-10 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <CommentSection postId={post.id} />
      </div>
    </div>
  )
}
