'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, PenSquare, CalendarDays, MapPin, Home, LayoutList } from 'lucide-react'
import { TIMELINE_STAGES, MILESTONE_STAGES, type Timeline, type TimelineEntry, type TimelineTask } from '@/types'

// ─── Stage badge ─────────────────────────────────────────────────────────────
function StageBadge({ stage }: { stage: string }) {
  const found = TIMELINE_STAGES.find(s => s.key === stage)
  const color = found?.color ?? '#95A5A6'
  const label = found?.label ?? stage
  const emoji = found?.emoji ?? '📝'
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ background: color }}>
      {emoji} {label}
    </span>
  )
}

// ─── Entry card ──────────────────────────────────────────────────────────────
function EntryCard({ entry }: { entry: TimelineEntry }) {
  const [imgIdx, setImgIdx] = useState(0)
  const images = entry.images ?? []

  return (
    <div className="bg-white rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--color-border)' }}>
      {images.length > 0 && (
        <div className="relative aspect-video bg-gray-100">
          <Image src={images[imgIdx]} alt={entry.title} fill className="object-cover" />
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ background: i === imgIdx ? 'white' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {entry.entry_date.replace(/-/g, '.')}
          </span>
          <StageBadge stage={entry.stage} />
        </div>
        <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {entry.title}
        </h4>
        {entry.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--color-text-secondary)' }}>
            {entry.content}
          </p>
        )}
        {entry.cost != null && entry.cost > 0 && (
          <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--bg-secondary)', color: 'var(--color-accent-dark)' }}>
            💰 {entry.cost.toLocaleString()}원
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Schedule (공사 일정표) card ──────────────────────────────────────────────
function phaseInfo(phaseId: string) {
  const found = TIMELINE_STAGES.find(s => s.key === phaseId)
  return {
    label: found?.label ?? phaseId,
    emoji: found?.emoji ?? '🔨',
    color: found?.color ?? '#8B6B4A',
  }
}

function TaskScheduleCard({ task }: { task: TimelineTask }) {
  const phase = phaseInfo(task.phase_id)
  return (
    <div className="bg-white rounded-2xl border overflow-hidden p-4 flex items-start gap-3"
      style={{ borderColor: 'var(--color-border)' }}>
      <span className="flex items-center justify-center w-9 h-9 rounded-xl text-base flex-shrink-0"
        style={{ background: `${phase.color}33` }}>
        {phase.emoji}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ background: phase.color }}>
            {phase.label}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {task.start_date.replace(/-/g, '.')} ~ {task.end_date.replace(/-/g, '.')}
          </span>
        </div>
        <h4 className="font-semibold mb-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
          {task.title}
        </h4>
        {task.memo && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--color-text-secondary)' }}>
            {task.memo}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function datesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  if (isNaN(cur.getTime()) || isNaN(last.getTime())) return dates
  while (cur <= last) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function Calendar({ entries, tasks }: { entries: TimelineEntry[]; tasks: TimelineTask[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const entryMap = entries.reduce((acc, e) => {
    if (!acc[e.entry_date]) acc[e.entry_date] = []
    acc[e.entry_date].push(e)
    return acc
  }, {} as Record<string, TimelineEntry[]>)

  const taskMap = tasks.reduce((acc, t) => {
    for (const ds of datesInRange(t.start_date, t.end_date)) {
      if (!acc[ds]) acc[ds] = []
      acc[ds].push(t)
    }
    return acc
  }, {} as Record<string, TimelineTask[]>)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`

  const selectedEntries = selected ? (entryMap[selected] ?? []) : []
  const selectedTasks = selected ? (taskMap[selected] ?? []) : []

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // fill to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* 월 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <ChevronLeft size={18} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
          {year}년 {month + 1}월
        </span>
        <button onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <ChevronRight size={18} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className="text-center text-xs py-1 font-medium"
            style={{ color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : 'var(--color-text-muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const ds = dateStr(day)
          const dayEntries = entryMap[ds] ?? []
          const dayTasks = taskMap[ds] ?? []
          const hasEntries = dayEntries.length > 0
          const hasTasks = dayTasks.length > 0
          const isSelected = selected === ds
          const isToday = ds === `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
          const col = idx % 7

          return (
            <button key={idx} onClick={() => setSelected(isSelected ? null : ds)}
              className="flex flex-col items-center py-1.5 rounded-xl transition-colors"
              style={{
                background: isSelected ? 'var(--color-accent)' : 'transparent',
              }}>
              <span className="text-sm font-medium leading-none"
                style={{
                  color: isSelected ? 'white'
                    : isToday ? 'var(--color-accent)'
                    : col === 0 ? '#EF4444'
                    : col === 6 ? '#3B82F6'
                    : 'var(--color-text-primary)',
                }}>
                {day}
              </span>
              {hasTasks && (
                <div className="flex gap-0.5 mt-1 w-full px-1.5">
                  {(dayTasks.slice(0, 2)).map((t, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full"
                      style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : phaseInfo(t.phase_id).color }} />
                  ))}
                </div>
              )}
              {hasEntries && (
                <div className="flex gap-0.5 mt-1">
                  {(dayEntries.slice(0, 3)).map((e, i) => {
                    const stageColor = TIMELINE_STAGES.find(s => s.key === e.stage)?.color ?? '#8B6B4A'
                    return (
                      <div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : stageColor }} />
                    )
                  })}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 선택 날짜 상세 */}
      {selected && (
        <div className="mt-6 space-y-6">
          {/* 공사 일정표 */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              {selected.replace(/-/g, '년 ').replace(/-/, '월 ')}일 예정된 공사
            </p>
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-center py-6 rounded-2xl border"
                style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                이 날 예정된 공사 일정이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {selectedTasks.map(t => <TaskScheduleCard key={t.id} task={t} />)}
              </div>
            )}
          </div>

          {/* 작성된 일지 */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              {selected.replace(/-/g, '년 ').replace(/-/, '월 ')}일 일지
            </p>
            {selectedEntries.length === 0 ? (
              <p className="text-sm text-center py-8 rounded-2xl border"
                style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                이 날의 일지가 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {selectedEntries.map(e => <EntryCard key={e.id} entry={e} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Milestone progress ───────────────────────────────────────────────────────
function MilestoneProgress({ entries }: { entries: TimelineEntry[] }) {
  const doneStages = new Set(entries.map(e => e.stage))

  return (
    <div className="flex items-center">
      {MILESTONE_STAGES.map((key, i) => {
        const stage = TIMELINE_STAGES.find(s => s.key === key)!
        const done = doneStages.has(key)
        return (
          <div key={key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 transition-colors"
                style={{
                  background: done ? 'var(--color-accent)' : 'white',
                  borderColor: done ? 'var(--color-accent)' : 'var(--color-border)',
                }}>
                {done ? '✓' : <span style={{ opacity: 0.4 }}>{stage.emoji}</span>}
              </div>
              <span className="text-xs mt-1 font-medium"
                style={{ color: done ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                {stage.label}
              </span>
            </div>
            {i < MILESTONE_STAGES.length - 1 && (
              <div className="h-0.5 w-full mt-[-14px]"
                style={{ background: done ? 'var(--color-accent-light)' : 'var(--color-border)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  timeline: Timeline
  entries: TimelineEntry[]
  tasks: TimelineTask[]
  isOwner: boolean
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  planning:    { label: '계획중',  color: '#92400E', bg: '#FEF3C7' },
  in_progress: { label: '진행중',  color: '#1D4ED8', bg: '#DBEAFE' },
  completed:   { label: '완료',    color: '#065F46', bg: '#D1FAE5' },
}

export default function TimelineDetail({ timeline, entries, tasks, isOwner }: Props) {
  const [tab, setTab] = useState<'list' | 'calendar'>('list')

  const status = STATUS_LABEL[timeline.status] ?? STATUS_LABEL.in_progress

  const totalCost = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0)

  const sortedEntries = [...entries].sort((a, b) => {
    const d = b.entry_date.localeCompare(a.entry_date)
    return d !== 0 ? d : b.created_at.localeCompare(a.created_at)
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 뒤로가기 */}
      <Link href="/timeline"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:underline"
        style={{ color: 'var(--color-text-muted)' }}>
        <ChevronLeft size={16} /> 공사일지 목록
      </Link>

      {/* 헤더 */}
      <div className="bg-white rounded-2xl border p-6 mb-6"
        style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-start justify-between mb-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
          {isOwner && (
            <div className="flex gap-2">
              <Link href={`/timeline/${timeline.id}/plan`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'white' }}>
                <LayoutList size={14} /> 일정 계획
              </Link>
              <Link href={`/timeline/${timeline.id}/entry/new`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--color-accent)' }}>
                <PenSquare size={14} /> 일지 추가
              </Link>
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {timeline.title}
        </h1>

        {/* 기본 정보 */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-4"
          style={{ color: 'var(--color-text-secondary)' }}>
          {timeline.region_city && (
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {timeline.region_city}
            </span>
          )}
          {timeline.area_pyeong && (
            <span className="flex items-center gap-1">
              <Home size={13} /> {timeline.area_pyeong.toFixed(1)}평
              {timeline.housing_type && ` · ${timeline.housing_type}`}
            </span>
          )}
          {timeline.start_date && (
            <span className="flex items-center gap-1">
              <CalendarDays size={13} />
              착공 {timeline.start_date.replace(/-/g, '.')}
            </span>
          )}
          {timeline.move_in_date && (
            <span className="flex items-center gap-1">
              <CalendarDays size={13} />
              입주 {timeline.move_in_date.replace(/-/g, '.')}
            </span>
          )}
        </div>

        {timeline.description && (
          <p className="text-sm leading-relaxed mb-4"
            style={{ color: 'var(--color-text-secondary)' }}>
            {timeline.description}
          </p>
        )}

        {/* 통계 */}
        <div className="flex gap-4 text-center py-3 border-t border-b mb-5"
          style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex-1">
            <p className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
              {entries.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>일지</p>
          </div>
          {totalCost > 0 && (
            <div className="flex-1">
              <p className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                {(totalCost / 10000).toFixed(0)}만
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>누적 비용</p>
            </div>
          )}
          <div className="flex-1">
            <p className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
              {timeline.users?.nickname ?? '-'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>작성자</p>
          </div>
        </div>

        {/* 마일스톤 진행바 */}
        <MilestoneProgress entries={entries} />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6"
        style={{ background: 'var(--bg-secondary)' }}>
        {(['list', 'calendar'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t === 'list' ? '📋 전체 일지' : '📅 캘린더'}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      {tab === 'list' ? (
        entries.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border"
            style={{ borderColor: 'var(--color-border)', background: 'white' }}>
            <p className="text-4xl mb-3">📝</p>
            <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              아직 일지가 없습니다
            </p>
            {isOwner && (
              <Link href={`/timeline/${timeline.id}/entry/new`}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ background: 'var(--color-accent)' }}>
                첫 일지 작성하기
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border p-5"
          style={{ borderColor: 'var(--color-border)' }}>
          <Calendar entries={entries} tasks={tasks} />
        </div>
      )}
    </div>
  )
}
