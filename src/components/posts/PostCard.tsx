import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Maximize2, Heart, Bookmark, AlertTriangle } from 'lucide-react'
import { formatCost, formatDate } from '@/lib/utils'
import type { Post } from '@/types'

interface Props {
  post: Post
}

export default function PostCard({ post }: Props) {
  const coverImage = post.post_images?.find((img) => img.is_cover) ?? post.post_images?.[0]

  return (
    <Link href={`/posts/${post.id}`} className="group block bg-white rounded-2xl overflow-hidden border hover:shadow-md transition-shadow"
      style={{ borderColor: 'var(--color-border)' }}>
      {/* 이미지 */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)' }}>
            <span className="text-4xl">🏠</span>
          </div>
        )}
        <div className="img-overlay" />

        {/* 카테고리 + 광고 배지 */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
            style={{ background: post.category === 'self' ? '#8B6B4A' : '#6B4F35' }}>
            {post.category === 'self' ? '반셀프' : '턴키'}
          </span>
          {post.is_ad && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: '#FEF3C7', color: '#92400E' }}>
              광고
            </span>
          )}
        </div>

        {/* 이미지 수 */}
        {post.post_images && post.post_images.length > 1 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-xs">
            <span>+{post.post_images.length - 1}</span>
          </div>
        )}

        {/* 하단 비용 정보 */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white text-lg font-bold drop-shadow">
            {formatCost(post.total_cost)}
          </p>
          {post.cost_per_pyeong && (
            <p className="text-white/80 text-xs drop-shadow">
              평당 {formatCost(post.cost_per_pyeong)}
            </p>
          )}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2"
          style={{ color: 'var(--color-text-primary)' }}>
          {post.title}
        </h3>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"
          style={{ color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {post.region_city}
            {post.region_district && ` ${post.region_district}`}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 size={11} /> {post.area_pyeong}평
          </span>
          {post.construction_days && (
            <span>공사 {post.construction_days}일</span>
          )}
        </div>

        {/* 스타일 태그 */}
        {post.style_tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.style_tags.slice(0, 3).map((tag) => (
              <span key={tag}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'var(--bg-secondary)', color: 'var(--color-text-secondary)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 하단 */}
        <div className="mt-3 pt-3 flex items-center justify-between border-t"
          style={{ borderColor: 'var(--color-border-light)' }}>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {post.users?.nickname ?? '익명'} · {formatDate(post.created_at)}
          </span>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-0.5">
              <Heart size={11} /> {post.like_count}
            </span>
            <span className="flex items-center gap-0.5">
              <Bookmark size={11} /> {post.bookmark_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
