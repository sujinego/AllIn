import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TimelineDetail from '@/components/timeline/TimelineDetail'
import type { Timeline, TimelineEntry } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

async function getTimelineData(id: string) {
  const supabase = await createClient()

  const [timelineRes, entriesRes, sessionRes] = await Promise.all([
    supabase
      .from('timelines')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('timeline_entries')
      .select('*')
      .eq('timeline_id', id)
      .order('entry_date', { ascending: true }),
    supabase.auth.getSession(),
  ])

  if (!timelineRes.data) return { timeline: null, entries: [], userId: null }

  // 작성자 정보는 별도 조회 (PostgREST 자동 조인 캐시 문제 방지)
  const { data: userData } = await supabase
    .from('users')
    .select('id, nickname')
    .eq('id', timelineRes.data.user_id)
    .maybeSingle()

  return {
    timeline: { ...timelineRes.data, users: userData } as Timeline,
    entries: (entriesRes.data ?? []) as TimelineEntry[],
    userId: sessionRes.data.session?.user.id ?? null,
  }
}

export default async function TimelineDetailPage({ params }: Props) {
  const { id } = await params
  const { timeline, entries, userId } = await getTimelineData(id)

  if (!timeline) notFound()

  const isOwner = userId === timeline.user_id

  return (
    <TimelineDetail
      timeline={timeline}
      entries={entries}
      isOwner={isOwner}
    />
  )
}
