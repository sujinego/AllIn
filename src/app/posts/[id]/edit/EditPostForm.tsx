'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, X, Star, AlertTriangle } from 'lucide-react'
import CostItemsForm, { type CostItemInput } from '@/components/posts/CostItemsForm'
import { createClient } from '@/lib/supabase/client'
import { sqmToPyeong, calcCostPerPyeong } from '@/lib/utils'
import { REGIONS, STYLE_TAGS } from '@/types'
import type { Post, CostItem, PostImage } from '@/types'

const schema = z.object({
  title: z.string().min(5, '제목은 5자 이상 입력해주세요').max(200),
  category: z.enum(['self', 'turnkey']),
  content: z.string().min(50, '내용은 50자 이상 입력해주세요'),
  region_city: z.string().min(1, '지역을 선택해주세요'),
  region_district: z.string().optional(),
  area_sqm: z.number({ invalid_type_error: '숫자를 입력해주세요' }).positive('0보다 커야 합니다'),
  construction_days: z.number().int().positive().optional().or(z.literal(0)),
  completion_year: z.number().int().min(2000).max(2030).optional().or(z.literal(0)),
  company_name: z.string().max(100).optional(),
  is_company_public: z.boolean(),
  total_cost: z.number({ invalid_type_error: '숫자를 입력해주세요' }).positive('총 비용을 입력해주세요'),
  is_ad: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface ImageItem {
  key: string
  url: string
  file?: File
  isCover: boolean
}

interface Props {
  post: Post & { cost_items: CostItem[]; post_images: PostImage[] }
}

export default function EditPostForm({ post }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [images, setImages] = useState<ImageItem[]>(() =>
    [...post.post_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(img => ({ key: img.id, url: img.url, isCover: img.is_cover }))
  )
  const [costItems, setCostItems] = useState<CostItemInput[]>(() =>
    post.cost_items.map(item => ({
      category: item.category,
      label: item.label ?? '',
      amount: item.amount.toLocaleString(),
      memo: item.memo ?? '',
    }))
  )
  const [selectedTags, setSelectedTags] = useState<string[]>(post.style_tags ?? [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: post.title,
      category: post.category,
      content: post.content,
      region_city: post.region_city,
      region_district: post.region_district ?? '',
      area_sqm: post.area_sqm,
      construction_days: post.construction_days ?? undefined,
      completion_year: post.completion_year ?? undefined,
      company_name: post.company_name ?? '',
      is_company_public: post.is_company_public,
      total_cost: post.total_cost,
      is_ad: post.is_ad,
    },
  })

  const category = watch('category')

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addImages = (files: FileList | null) => {
    if (!files) return
    const next: ImageItem[] = []
    Array.from(files).slice(0, 20 - images.length).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      next.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: URL.createObjectURL(file),
        file,
        isCover: images.length === 0 && next.length === 0,
      })
    })
    setImages(prev => [...prev, ...next])
  }

  const removeImage = (idx: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx)
      if (prev[idx].isCover && next.length > 0) next[0] = { ...next[0], isCover: true }
      return next
    })
  }

  const setCoverImage = (idx: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isCover: i === idx })))
  }

  const uploadImage = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('post-images').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    return data.publicUrl
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const areaPyeong = sqmToPyeong(data.area_sqm)
      const costPerPyeong = calcCostPerPyeong(data.total_cost, data.area_sqm)

      const { error: postError } = await supabase
        .from('posts')
        .update({
          category: data.category,
          title: data.title,
          content: data.content,
          region_city: data.region_city,
          region_district: data.region_district || null,
          area_sqm: data.area_sqm,
          area_pyeong: areaPyeong,
          construction_days: data.construction_days || null,
          completion_year: data.completion_year || null,
          company_name: data.category === 'turnkey' ? (data.company_name || null) : null,
          is_company_public: data.is_company_public,
          total_cost: data.total_cost,
          cost_per_pyeong: costPerPyeong,
          style_tags: selectedTags,
          is_ad: data.is_ad,
        })
        .eq('id', post.id)

      if (postError) throw postError

      // 비용 항목 갱신 (전체 삭제 후 재등록)
      await supabase.from('cost_items').delete().eq('post_id', post.id)
      const validCostItems = costItems.filter(item => item.amount)
      if (validCostItems.length > 0) {
        await supabase.from('cost_items').insert(
          validCostItems.map(item => ({
            post_id: post.id,
            category: item.category,
            label: item.label || null,
            amount: parseInt(item.amount.replace(/,/g, ''), 10),
            memo: item.memo || null,
          }))
        )
      }

      // 새 이미지 업로드 후 전체 갱신 (기존 + 신규)
      const finalImages: { url: string; is_cover: boolean }[] = []
      for (const img of images) {
        const url = img.file ? await uploadImage(img.file, session.user.id) : img.url
        finalImages.push({ url, is_cover: img.isCover })
      }

      await supabase.from('post_images').delete().eq('post_id', post.id)
      if (finalImages.length > 0) {
        await supabase.from('post_images').insert(
          finalImages.map((img, i) => ({
            post_id: post.id,
            url: img.url,
            is_cover: img.is_cover,
            sort_order: i,
          }))
        )
      }

      router.push(`/posts/${post.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        후기 수정
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        작성한 내용을 수정할 수 있습니다
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            인테리어 종류 *
          </label>
          <div className="flex gap-3">
            {[
              { value: 'self', label: '🔨 반셀프 인테리어', desc: '직접 자재 구매 + 일부 시공' },
              { value: 'turnkey', label: '🏢 턴키 업체 인테리어', desc: '업체에 전부 맡긴 시공' },
            ].map(c => (
              <label
                key={c.value}
                className="flex-1 flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors"
                style={{
                  borderColor: category === c.value ? 'var(--color-accent)' : 'var(--color-border)',
                  background: category === c.value ? 'var(--bg-secondary)' : 'white',
                }}
              >
                <input type="radio" value={c.value} {...register('category')} className="mt-1" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{c.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            제목 *
          </label>
          <input
            {...register('title')}
            placeholder="예: 30평대 아파트 모던 스타일 셀프 인테리어 후기"
            className="w-full px-4 py-3 rounded-2xl border text-sm"
            style={{ borderColor: errors.title ? '#EF4444' : 'var(--color-border)', background: 'white' }}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* 기본 정보 */}
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>기본 정보 *</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>지역</label>
              <select
                {...register('region_city')}
                className="w-full px-3 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: errors.region_city ? '#EF4444' : 'var(--color-border)', background: 'white' }}
              >
                <option value="">선택</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>구/군 (선택)</label>
              <input
                {...register('region_district')}
                placeholder="예: 마포구"
                className="w-full px-3 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'white' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>전용면적 (㎡) *</label>
              <input
                {...register('area_sqm', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="예: 84.9"
                className="w-full px-3 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: errors.area_sqm ? '#EF4444' : 'var(--color-border)', background: 'white' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>공사 기간 (일)</label>
              <input
                {...register('construction_days', { valueAsNumber: true })}
                type="number"
                placeholder="예: 30"
                className="w-full px-3 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'white' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>완공 연도</label>
              <input
                {...register('completion_year', { valueAsNumber: true })}
                type="number"
                placeholder="예: 2024"
                className="w-full px-3 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'white' }}
              />
            </div>
          </div>
        </div>

        {/* 비용 정보 */}
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>비용 정보</h3>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>총 공사 비용 (원) *</label>
            <div className="relative">
              <input
                {...register('total_cost', { valueAsNumber: true })}
                type="number"
                placeholder="예: 35000000"
                className="w-full px-4 py-3 rounded-2xl border text-sm pr-14"
                style={{ borderColor: errors.total_cost ? '#EF4444' : 'var(--color-border)', background: 'white' }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: 'var(--color-text-muted)' }}>원</span>
            </div>
            {errors.total_cost && <p className="mt-1 text-xs text-red-500">{errors.total_cost.message}</p>}
          </div>
          <div className="mt-4">
            <CostItemsForm items={costItems} onChange={setCostItems} />
          </div>
        </div>

        {/* 업체 정보 (턴키만) */}
        {category === 'turnkey' && (
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>업체 정보</h3>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                업체명 <span style={{ color: 'var(--color-text-muted)' }}>(선택 — 공개 여부를 직접 설정할 수 있습니다)</span>
              </label>
              <input
                {...register('company_name')}
                placeholder="예: OO인테리어"
                className="w-full px-4 py-3 rounded-2xl border text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'white' }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_company_public"
                {...register('is_company_public')}
                className="rounded"
              />
              <label htmlFor="is_company_public" className="text-sm cursor-pointer"
                style={{ color: 'var(--color-text-secondary)' }}>
                업체명을 다른 사용자에게 공개합니다
              </label>
            </div>
            <div className="mt-2 p-3 rounded-xl text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
              <AlertTriangle size={12} className="inline mr-1" />
              허위 업체명 작성 시 법적 책임이 발생할 수 있습니다. 사실에 근거한 내용만 작성해주세요.
            </div>
          </div>
        )}

        {/* 스타일 태그 */}
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            스타일 태그
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                style={{
                  background: selectedTags.includes(tag) ? 'var(--color-accent)' : 'white',
                  borderColor: selectedTags.includes(tag) ? 'var(--color-accent)' : 'var(--color-border)',
                  color: selectedTags.includes(tag) ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              사진
            </p>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {images.length}/20장
            </span>
          </div>

          <label
            className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-accent-light)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              클릭하거나 드래그해서 사진 업로드
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              JPG, PNG, WEBP · 최대 20장
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addImages(e.target.files)}
            />
          </label>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <div key={img.key} className="relative aspect-square rounded-xl overflow-hidden group border"
                  style={{ borderColor: img.isCover ? 'var(--color-accent)' : 'var(--color-border)' }}>
                  <Image src={img.url} alt="" fill className="object-cover" unoptimized={!!img.file} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                  {img.isCover && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                      style={{ background: 'var(--color-accent)' }}>
                      대표
                    </div>
                  )}

                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!img.isCover && (
                      <button
                        type="button"
                        onClick={() => setCoverImage(idx)}
                        className="p-1 rounded-full bg-white/90 hover:bg-white"
                        title="대표 사진으로 설정"
                      >
                        <Star size={12} style={{ color: 'var(--color-accent)' }} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 rounded-full bg-white/90 hover:bg-white"
                    >
                      <X size={12} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            후기 내용 *
          </label>
          <textarea
            {...register('content')}
            rows={10}
            placeholder="공사 과정, 업체 선택 이유, 비용 세부 내역, 만족/불만족 사항 등을 자유롭게 작성해주세요.

주의: 개인 연락처, 상세 주소, 타인의 얼굴 등 개인정보는 포함하지 마세요."
            className="w-full px-4 py-3 rounded-2xl border text-sm resize-none leading-relaxed"
            style={{
              borderColor: errors.content ? '#EF4444' : 'var(--color-border)',
              background: 'white',
            }}
          />
          {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
        </div>

        {/* 광고/협찬 여부 */}
        <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--bg-secondary)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            광고/협찬 여부 (표시광고법 준수)
          </h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_ad')}
              className="mt-0.5 rounded"
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                이 후기는 업체로부터 할인, 무료 시공, 현금, 상품권 등의 경제적 대가를 받고 작성하였습니다.
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                해당 시 반드시 체크해주세요. 미체크 적발 시 게시글이 삭제될 수 있습니다.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/posts/${post.id}`)}
            className="flex-1 py-4 rounded-2xl font-semibold text-base border transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-4 rounded-2xl text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}
          >
            {submitting ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}
