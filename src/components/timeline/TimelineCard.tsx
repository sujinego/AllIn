import Link from 'next/link'
import { MapPin, CalendarDays, BookOpen } from 'lucide-react'
import { TIMELINE_STAGES, MILESTONE_STAGES, type Timeline } from '@/types'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  planning:    { label: '계획중',  color: '#92400E', bg: '#FEF3C7' },
  in_progress: { label: '진행중',  color: '#1D4ED8', bg: '#DBEAFE' },
  completed:   { label: '완료',    color: '#065F46', bg: '#D1FAE5' },
}

interface Props {
  timeline: Timeline & { entry_count?: number }
}

export default function TimelineCard({ timeline }: Props) {
  const entries = timeline.timeline_entries ?? []
  const entryCount = (timeline as { entry_count?: number }).entry_count ?? entries.length
  const status = STATUS_LABEL[timeline.status] ?? STATUS_LABEL.in_progress

  const completedStageKeys = new Set(entries.map(e => e.stage))
  const milestoneProgress = MILESTONE_STAGES.map(key => ({
    key,
    label: TIMELINE_STAGES.find(s => s.key === key)?.label ?? key,
    done: completedStageKeys.has(key),
  }))

  const latestEntry = entries.length > 0
    ? entries.sort((a, b) => b.entry_date.localeCompare(a.entry_date))[0]
    : null

  return (
    <Link href={`/timeline/${timeline.id}`}
      className="block bg-white rounded-2xl border hover:shadow-md transition-shadow overflow-hidden"
      style={{ borderColor: 'var(--color-border)' }}>
      <div className="p-5">
        {/* 상단: 상태 + 주택유형 */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {timeline.housing_type ?? '주거공간'}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="font-bold text-base leading-snug line-clamp-2 mb-2"
          style={{ color: 'var(--color-text-primary)' }}>
          {timeline.title}
        </h3>

        {/* 지역 / 평수 */}
        <div className="flex items-center gap-3 text-xs mb-4"
          style={{ color: 'var(--color-text-muted)' }}>
          {timeline.region_city && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {timeline.region_city}
            </span>
          )}
          {timeline.area_pyeong && (
            <span>{timeline.area_pyeong.toFixed(1)}평</span>
          )}
          {timeline.start_date && (
            <span className="flex items-center gap-1">
              <CalendarDays size={11} />
              {timeline.start_date.slice(0, 7).replace('-', '년 ')}월
            </span>
          )}
        </div>

        {/* 마일스톤 진행바 (착공→철거→도배→입주) */}
        <div className="flex items-center gap-1 mb-4">
          {milestoneProgress.map((m, i) => (
            <div key={m.key} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 flex flex-col items-center`}>
                <div className="w-full h-1.5 rounded-full"
                  style={{ background: m.done ? 'var(--color-accent)' : 'var(--color-border)' }} />
                <span className="text-[10px] mt-1 font-medium"
                  style={{ color: m.done ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                  {m.label}
                </span>
              </div>
              {i < milestoneProgress.length - 1 && (
                <div className="text-[10px] mb-3" style={{ color: 'var(--color-border)' }}>›</div>
              )}
            </div>
          ))}
        </div>

        {/* 하단: 일지 수 + 작성자 */}
        <div className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'var(--color-border-light)' }}>
          <span className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-muted)' }}>
            <BookOpen size={12} /> {entryCount}개 일지
            {latestEntry && ` · 최근 ${latestEntry.entry_date.slice(5).replace('-', '/')}`}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {timeline.users?.nickname ?? '익명'}
          </span>
        </div>
      </div>
    </Link>
  )
}
