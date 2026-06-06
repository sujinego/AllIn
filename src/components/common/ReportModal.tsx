'use client'

import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ReportReason } from '@/types'

const REPORT_REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'false_info', label: '허위 사실', desc: '사실과 다른 내용이 포함되어 있습니다' },
  { value: 'defamation', label: '명예훼손', desc: '특정 업체나 개인을 비방하는 내용입니다' },
  { value: 'ad_not_disclosed', label: '광고/협찬 미표시', desc: '광고·협찬 후기임에도 표시하지 않았습니다' },
  { value: 'privacy', label: '개인정보 노출', desc: '얼굴, 주소, 연락처 등 개인정보가 포함되어 있습니다' },
  { value: 'copyright', label: '저작권 침해', desc: '타인의 사진이나 콘텐츠를 무단으로 사용했습니다' },
  { value: 'spam', label: '스팸/광고', desc: '광고성 게시물이거나 도배입니다' },
  { value: 'other', label: '기타', desc: '위 항목에 해당하지 않는 신고 사유입니다' },
]

interface Props {
  targetType: 'post' | 'comment'
  targetId: string
  onClose: () => void
}

export default function ReportModal({ targetType, targetId, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert('로그인이 필요합니다.')
      setSubmitting(false)
      return
    }
    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      detail: detail || null,
    })
    if (!error) setDone(true)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Flag size={18} style={{ color: 'var(--color-accent)' }} />
            <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>신고하기</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>신고가 접수되었습니다</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              운영팀이 72시간 내에 검토 후 처리합니다.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-6 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--color-accent)' }}
            >
              닫기
            </button>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              신고 사유를 선택해주세요. 허위 신고 시 이용이 제한될 수 있습니다.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  style={{
                    borderColor: reason === r.value ? 'var(--color-accent)' : 'var(--color-border)',
                    background: reason === r.value ? 'var(--bg-secondary)' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{r.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="구체적인 사유를 입력해주세요 (선택)"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--bg-primary)' }}
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--color-accent)' }}
              >
                {submitting ? '신고 중...' : '신고 접수'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
