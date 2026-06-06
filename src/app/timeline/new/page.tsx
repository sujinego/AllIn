'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { REGIONS, HOUSING_TYPES } from '@/types'
import { sqmToPyeong } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

export default function NewTimelinePage() {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [regionCity, setRegionCity] = useState('')
  const [areaSqm, setAreaSqm] = useState('')
  const [housingType, setHousingType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [status, setStatus] = useState<'planning' | 'in_progress' | 'completed'>('in_progress')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('프로젝트 제목을 입력해주세요.'); return }

    setSubmitting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const sqm = parseFloat(areaSqm)
      const pyeong = isNaN(sqm) ? null : sqmToPyeong(sqm)

      const { data: timeline, error: insertError } = await supabase
        .from('timelines')
        .insert({
          user_id: session.user.id,
          title: title.trim(),
          description: description.trim() || null,
          region_city: regionCity || null,
          area_sqm: isNaN(sqm) ? null : sqm,
          area_pyeong: pyeong,
          housing_type: housingType || null,
          start_date: startDate || null,
          move_in_date: moveInDate || null,
          is_public: isPublic,
          status,
        })
        .select()
        .single()

      if (insertError) throw insertError
      router.push(`/timeline/${timeline.id}/plan`)
    } catch (e: unknown) {
      const msg = e instanceof Error
        ? e.message
        : (e as { message?: string })?.message ?? '오류가 발생했습니다.'
      setError(msg)
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-2xl border text-sm"
  const inputStyle = { borderColor: 'var(--color-border)', background: 'white' }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href="/timeline"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:underline"
        style={{ color: 'var(--color-text-muted)' }}>
        <ChevronLeft size={16} /> 공사일지 목록
      </Link>

      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        새 공사 프로젝트 시작
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        착공부터 입주까지 공사 과정을 기록해보세요
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 프로젝트명 */}
        <div>
          <label className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}>
            프로젝트 제목 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="예: 30평 아파트 셀프 인테리어 도전기"
            className={inputClass}
            style={inputStyle}
            maxLength={100}
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}>
            프로젝트 소개
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="어떤 인테리어를 계획하고 있는지 간단히 소개해주세요"
            rows={3}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 지역 */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}>
              지역
            </label>
            <select value={regionCity} onChange={e => setRegionCity(e.target.value)}
              className={inputClass} style={inputStyle}>
              <option value="">선택</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* 주택유형 */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}>
              주택 유형
            </label>
            <select value={housingType} onChange={e => setHousingType(e.target.value)}
              className={inputClass} style={inputStyle}>
              <option value="">선택</option>
              {HOUSING_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        {/* 면적 */}
        <div>
          <label className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}>
            면적 (㎡)
          </label>
          <div className="relative">
            <input
              type="number"
              value={areaSqm}
              onChange={e => setAreaSqm(e.target.value)}
              placeholder="예: 84"
              className={inputClass}
              style={inputStyle}
              min={0}
            />
            {areaSqm && !isNaN(parseFloat(areaSqm)) && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: 'var(--color-text-muted)' }}>
                ≈ {sqmToPyeong(parseFloat(areaSqm)).toFixed(1)}평
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 착공일 */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}>
              착공일
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className={inputClass} style={inputStyle} />
          </div>

          {/* 입주 예정일 */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}>
              입주 예정일
            </label>
            <input type="date" value={moveInDate} onChange={e => setMoveInDate(e.target.value)}
              className={inputClass} style={inputStyle} />
          </div>
        </div>

        {/* 진행 상태 */}
        <div>
          <label className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}>
            진행 상태
          </label>
          <div className="flex gap-2">
            {([
              { value: 'planning', label: '계획중' },
              { value: 'in_progress', label: '진행중' },
              { value: 'completed', label: '완료' },
            ] as const).map(s => (
              <button type="button" key={s.value} onClick={() => setStatus(s.value)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-colors"
                style={{
                  background: status === s.value ? 'var(--color-accent)' : 'white',
                  color: status === s.value ? 'white' : 'var(--color-text-secondary)',
                  borderColor: status === s.value ? 'var(--color-accent)' : 'var(--color-border)',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 공개 여부 */}
        <div className="flex items-center justify-between p-4 rounded-2xl border"
          style={{ borderColor: 'var(--color-border)', background: 'white' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              공개 설정
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {isPublic ? '모든 사람이 볼 수 있습니다' : '나만 볼 수 있습니다'}
            </p>
          </div>
          <button type="button" onClick={() => setIsPublic(v => !v)}
            className="w-12 h-6 rounded-full transition-colors relative"
            style={{ background: isPublic ? 'var(--color-accent)' : '#D1D5DB' }}>
            <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: isPublic ? '1.5rem' : '0.25rem' }} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button type="submit" disabled={submitting}
          className="w-full py-4 rounded-2xl text-white font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-accent)' }}>
          {submitting ? '생성 중...' : '🏗️ 프로젝트 시작하기'}
        </button>
      </form>
    </div>
  )
}
