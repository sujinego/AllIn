'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { TIMELINE_STAGES } from '@/types'
import { ChevronLeft, Upload, X } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default function NewEntryPage({ params }: Props) {
  const { id: timelineId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [stage, setStage] = useState('planning')
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [entryTitle, setEntryTitle] = useState('')
  const [content, setContent] = useState('')
  const [cost, setCost] = useState('')
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: timeline } = await supabase
        .from('timelines')
        .select('user_id')
        .eq('id', timelineId)
        .single()

      setAuthorized(timeline?.user_id === session.user.id)
    })()
  }, [timelineId])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const next = [...previews]
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') || next.length >= 5) return
      next.push({ file, url: URL.createObjectURL(file) })
    })
    setPreviews(next)
  }

  const removeImg = (idx: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryTitle.trim()) { setError('제목을 입력해주세요.'); return }

    setSubmitting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      // 이미지 업로드
      const imageUrls: string[] = []
      for (const { file } of previews) {
        const ext = file.name.split('.').pop()
        const path = `${session.user.id}/${timelineId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('timeline-images')
          .upload(path, file)
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage.from('timeline-images').getPublicUrl(path)
        imageUrls.push(publicUrl)
      }

      const costVal = cost.replace(/,/g, '')
      const { error: insertErr } = await supabase
        .from('timeline_entries')
        .insert({
          timeline_id: timelineId,
          user_id: session.user.id,
          stage,
          entry_date: entryDate,
          title: entryTitle.trim(),
          content: content.trim() || null,
          images: imageUrls.length > 0 ? imageUrls : null,
          cost: costVal ? parseInt(costVal, 10) : null,
        })

      if (insertErr) throw insertErr
      router.push(`/timeline/${timelineId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  if (authorized === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (authorized === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          접근 권한이 없습니다
        </p>
        <Link href="/timeline" className="text-sm hover:underline"
          style={{ color: 'var(--color-accent)' }}>
          공사일지 목록으로
        </Link>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 rounded-2xl border text-sm"
  const inputStyle = { borderColor: 'var(--color-border)', background: 'white' }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href={`/timeline/${timelineId}`}
        className="inline-flex items-center gap-1 text-sm mb-6 hover:underline"
        style={{ color: 'var(--color-text-muted)' }}>
        <ChevronLeft size={16} /> 공사일지로 돌아가기
      </Link>

      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        일지 작성
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        오늘의 공사 진행 상황을 기록하세요
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 날짜 */}
        <div>
          <label className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}>
            날짜 <span className="text-red-400">*</span>
          </label>
          <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)}
            className={inputClass} style={inputStyle} required />
        </div>

        {/* 공사 단계 */}
        <div>
          <label className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}>
            공사 단계 <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TIMELINE_STAGES.map(s => (
              <button type="button" key={s.key} onClick={() => setStage(s.key)}
                className="py-2 px-2 rounded-xl text-xs font-medium border transition-all"
                style={{
                  background: stage === s.key ? s.color : 'white',
                  color: stage === s.key ? 'white' : 'var(--color-text-secondary)',
                  borderColor: stage === s.key ? s.color : 'var(--color-border)',
                }}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}>
            제목 <span className="text-red-400">*</span>
          </label>
          <input type="text" value={entryTitle} onChange={e => setEntryTitle(e.target.value)}
            placeholder="예: 오늘 철거 완료! 생각보다 빨리 끝났다"
            className={inputClass} style={inputStyle} maxLength={200} required />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}>
            내용
          </label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="오늘의 공사 과정, 느낀 점, 팁 등을 자유롭게 기록하세요"
            rows={5} className={inputClass} style={inputStyle} />
        </div>

        {/* 비용 */}
        <div>
          <label className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}>
            오늘 지출 비용 (선택)
          </label>
          <div className="relative">
            <input type="text"
              value={cost}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9]/g, '')
                setCost(v ? parseInt(v, 10).toLocaleString() : '')
              }}
              placeholder="0"
              className={inputClass}
              style={{ ...inputStyle, paddingRight: '2.5rem' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--color-text-muted)' }}>원</span>
          </div>
        </div>

        {/* 사진 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}>
              사진 (선택, 최대 5장)
            </label>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {previews.length}/5
            </span>
          </div>
          {previews.length < 5 && (
            <label className="block border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'var(--color-border)' }}>
              <Upload size={20} className="mx-auto mb-2" style={{ color: 'var(--color-accent-light)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                클릭하여 사진 추가
              </span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleFiles(e.target.files)} />
            </label>
          )}
          {previews.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <Image src={p.url} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => removeImg(i)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-white/90 hover:bg-white">
                    <X size={12} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full py-4 rounded-2xl text-white font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-accent)' }}>
          {submitting ? '저장 중...' : '📝 일지 저장'}
        </button>
      </form>
    </div>
  )
}
