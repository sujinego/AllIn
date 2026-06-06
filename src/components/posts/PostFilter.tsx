'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { REGIONS, STYLE_TAGS } from '@/types'

const AREA_RANGES = [
  { label: '전체', min: undefined, max: undefined },
  { label: '~10평', min: undefined, max: 10 },
  { label: '10~20평', min: 10, max: 20 },
  { label: '20~30평', min: 20, max: 30 },
  { label: '30~40평', min: 30, max: 40 },
  { label: '40평~', min: 40, max: undefined },
]

const COST_RANGES = [
  { label: '전체', min: undefined, max: undefined },
  { label: '~1000만', min: undefined, max: 1000 },
  { label: '1000~3000만', min: 1000, max: 3000 },
  { label: '3000~5000만', min: 3000, max: 5000 },
  { label: '5000만~1억', min: 5000, max: 10000 },
  { label: '1억~', min: 10000, max: undefined },
]

export default function PostFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/posts?${params.toString()}`)
  }, [router, searchParams])

  const currentCategory = searchParams.get('category') || ''
  const currentRegion = searchParams.get('region_city') || ''
  const currentAreaMin = searchParams.get('area_min') || ''
  const currentAreaMax = searchParams.get('area_max') || ''
  const currentCostMin = searchParams.get('cost_min') || ''
  const currentCostMax = searchParams.get('cost_max') || ''
  const currentSort = searchParams.get('sort') || 'latest'
  const currentTags = searchParams.getAll('style_tags')

  const toggleTag = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const tags = params.getAll('style_tags')
    if (tags.includes(tag)) {
      params.delete('style_tags')
      tags.filter(t => t !== tag).forEach(t => params.append('style_tags', t))
    } else {
      params.append('style_tags', tag)
    }
    params.delete('page')
    router.push(`/posts?${params.toString()}`)
  }

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
      active
        ? 'text-white border-transparent'
        : 'border-transparent hover:opacity-80'
    }`

  return (
    <div className="bg-white rounded-2xl border p-5 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={16} style={{ color: 'var(--color-accent)' }} />
        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>필터</h3>
      </div>

      {/* 정렬 */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>정렬</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'latest', label: '최신순' },
            { value: 'popular', label: '인기순' },
            { value: 'cost_asc', label: '비용 낮은 순' },
            { value: 'cost_desc', label: '비용 높은 순' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => update('sort', s.value)}
              className={chipClass(currentSort === s.value)}
              style={{
                background: currentSort === s.value ? 'var(--color-accent)' : 'var(--bg-secondary)',
                color: currentSort === s.value ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>종류</p>
        <div className="flex gap-1.5">
          {[
            { value: '', label: '전체' },
            { value: 'self', label: '반셀프' },
            { value: 'turnkey', label: '턴키업체' },
          ].map(c => (
            <button
              key={c.value}
              onClick={() => update('category', c.value || undefined)}
              className={chipClass(currentCategory === c.value)}
              style={{
                background: currentCategory === c.value ? 'var(--color-accent)' : 'var(--bg-secondary)',
                color: currentCategory === c.value ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 지역 */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>지역</p>
        <select
          value={currentRegion}
          onChange={(e) => update('region_city', e.target.value || undefined)}
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--bg-primary)', color: 'var(--color-text-primary)' }}
        >
          <option value="">전체 지역</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* 평수 */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>평수</p>
        <div className="flex flex-wrap gap-1.5">
          {AREA_RANGES.map(r => {
            const active = (r.min?.toString() || '') === currentAreaMin && (r.max?.toString() || '') === currentAreaMax
            return (
              <button
                key={r.label}
                onClick={() => {
                  update('area_min', r.min?.toString())
                  update('area_max', r.max?.toString())
                }}
                className={chipClass(active)}
                style={{
                  background: active ? 'var(--color-accent)' : 'var(--bg-secondary)',
                  color: active ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 비용 */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>총 비용</p>
        <div className="flex flex-wrap gap-1.5">
          {COST_RANGES.map(r => {
            const active = (r.min?.toString() || '') === currentCostMin && (r.max?.toString() || '') === currentCostMax
            return (
              <button
                key={r.label}
                onClick={() => {
                  update('cost_min', r.min?.toString())
                  update('cost_max', r.max?.toString())
                }}
                className={chipClass(active)}
                style={{
                  background: active ? 'var(--color-accent)' : 'var(--bg-secondary)',
                  color: active ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 스타일 태그 */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>스타일</p>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_TAGS.map(tag => {
            const active = currentTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={chipClass(active)}
                style={{
                  background: active ? 'var(--color-accent)' : 'var(--bg-secondary)',
                  color: active ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
