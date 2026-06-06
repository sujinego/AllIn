"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft } from "lucide-react";
import GanttView from "@/components/timeline/GanttView";

interface Props {
  params: Promise<{ id: string }>;
}

export default function PlanPage({ params }: Props) {
  const { id: timelineId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [timeline, setTimeline] = useState<{
    title: string;
    start_date: string | null;
    move_in_date: string | null;
  } | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{ done: number; total: number } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { data: tl } = await supabase
        .from("timelines")
        .select("user_id, title, start_date, move_in_date")
        .eq("id", timelineId)
        .single();

      if (!tl || tl.user_id !== session.user.id) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
      setTimeline({
        title: tl.title,
        start_date: tl.start_date,
        move_in_date: tl.move_in_date,
      });
    })();
  }, [timelineId]);

  const handleStatsChange = useCallback((done: number, total: number) => {
    setStats({ done, total });
  }, []);

  if (authorized === null || !timeline) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: "var(--color-accent)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p
          className="font-semibold"
          style={{ color: "var(--color-text-secondary)" }}
        >
          접근 권한이 없습니다
        </p>
        <Link
          href="/timeline"
          className="text-sm hover:underline"
          style={{ color: "var(--color-accent)" }}
        >
          공사일지 목록으로
        </Link>
      </div>
    );
  }

  const startDate = timeline.start_date ?? "";
  const endDate = timeline.move_in_date ?? "";

  const totalDays =
    startDate && endDate
      ? Math.round(
          (new Date(endDate + "T00:00:00").getTime() -
            new Date(startDate + "T00:00:00").getTime()) /
            86400000
        )
      : null;

  const fmt = (d: string) => d.replace(/-/g, ".");

  return (
    <div className="flex flex-col px-4 pt-5 pb-0" style={{ height: "100vh" }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <Link
          href={`/timeline/${timelineId}`}
          className="inline-flex items-center gap-1 text-sm hover:underline flex-shrink-0"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronLeft size={16} /> {timeline.title}
        </Link>

        <div className="text-center flex">
          <h1
            className="text-base font-bold leading-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            📐 공사 일정표
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {startDate && endDate ? (
              <>
                {fmt(startDate)} ~ {fmt(endDate)}
                {totalDays !== null && (
                  <span className="ml-1">· {totalDays}일</span>
                )}
              </>
            ) : (
              "기간 미설정"
            )}
            {stats !== null && stats.total > 0 && (
              <span className="ml-2">
                · 할일{" "}
                <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                  {stats.done}/{stats.total}
                </span>{" "}
                완료
              </span>
            )}
          </p>
        </div>

        <div style={{ width: 80 }} />
      </div>

      {/* 간트 영역 (남은 높이 전체) */}
      <div className="flex-1 overflow-hidden">
        <GanttView
          timelineId={timelineId}
          startDate={startDate}
          endDate={endDate}
          onStatsChange={handleStatsChange}
        />
      </div>
    </div>
  );
}
