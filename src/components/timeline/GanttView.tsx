"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  X,
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";

const PHASE_COL_W = 112;
const COL_W = 34;
const BAR_H = 20;
const BAR_TOP = 8;
const BAR_GAP = 2;

const GANTT_PHASES = [
  { key: "planning", label: "기획·설계", color: "#D3D1C7" },
  { key: "demolition", label: "철거", color: "#F7C1C1" },
  { key: "utilities", label: "설비·배선", color: "#FAC775" },
  { key: "carpentry", label: "목공", color: "#C0DD97" },
  { key: "plastering", label: "미장·방수", color: "#B5D4F4" },
  { key: "tile", label: "타일", color: "#9FE1CB" },
  { key: "painting", label: "도장·도배", color: "#CCC9F0" },
  { key: "flooring", label: "바닥", color: "#F5C4B3" },
  { key: "furniture", label: "가구·설비", color: "#F4C0D1" },
  { key: "lighting", label: "조명", color: "#D3D1C7" },
  { key: "silicone", label: "실리콘", color: "#FAC775" },
  { key: "cleanup", label: "입주청소", color: "#9FE1CB" },
] as const;

type PhaseKey = (typeof GANTT_PHASES)[number]["key"];

interface Task {
  id: string;
  timeline_id: string;
  phase_id: string;
  title: string;
  start_date: string;
  end_date: string;
  memo: string | null;
  done: boolean;
  checklist_items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  task_id: string;
  text: string;
  done: boolean;
}

type PanelState =
  | { type: "none" }
  | { type: "phase"; phaseKey: PhaseKey }
  | { type: "task"; taskId: string }
  | { type: "date"; date: string }
  | { type: "add"; phaseKey: PhaseKey; date: string }
  | { type: "edit"; task: Task };

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function generateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(localDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function dayOffset(projectStart: string, date: string): number {
  return Math.round(
    (new Date(date + "T00:00:00").getTime() -
      new Date(projectStart + "T00:00:00").getTime()) /
      86400000
  );
}

function buildMonthGroups(dates: string[]) {
  const groups: { label: string; span: number }[] = [];
  for (const d of dates) {
    const dt = new Date(d + "T00:00:00");
    const label = `${dt.getMonth() + 1}월`;
    const last = groups[groups.length - 1];
    if (last?.label === label) last.span++;
    else groups.push({ label, span: 1 });
  }
  return groups;
}

function rowHeight(n: number) {
  return Math.max(40, n * (BAR_H + BAR_GAP) + BAR_TOP * 2);
}

// ─── TaskForm ─────────────────────────────────────────────────
interface TaskFormProps {
  phaseKey: string;
  initialDate?: string;
  projectStart: string;
  projectEnd: string;
  initial?: Partial<Task>;
  onSave: (data: {
    title: string;
    start_date: string;
    end_date: string;
    memo: string;
  }) => void;
  onCancel: () => void;
}

function TaskForm({
  phaseKey,
  initialDate,
  projectStart,
  projectEnd,
  initial,
  onSave,
  onCancel,
}: TaskFormProps) {
  const phase = GANTT_PHASES.find((p) => p.key === phaseKey);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startDate, setStartDate] = useState(
    initial?.start_date ?? initialDate ?? projectStart
  );
  const [endDate, setEndDate] = useState(
    initial?.end_date ?? initialDate ?? projectStart
  );
  const [memo, setMemo] = useState(initial?.memo ?? "");

  const inp = "w-full px-3 py-2 rounded-xl border text-sm focus:outline-none";
  const inpStyle = { borderColor: "var(--color-border)", background: "white" };

  return (
    <div className="space-y-3">
      {phase && (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full border"
            style={{ background: phase.color, borderColor: "rgba(0,0,0,0.1)" }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {initial ? "할일 수정" : `${phase.label} 할일 추가`}
          </span>
        </div>
      )}
      <input
        type="text"
        placeholder="할일 제목 *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inp}
        style={inpStyle}
        autoFocus
      />
      <div className="space-y-2">
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            시작일
          </p>
          <input
            type="date"
            value={startDate}
            min={projectStart}
            max={endDate || projectEnd}
            onChange={(e) => setStartDate(e.target.value)}
            className={inp}
            style={{ ...inpStyle, minWidth: 0 }}
          />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            마감일
          </p>
          <input
            type="date"
            value={endDate}
            min={startDate || projectStart}
            max={projectEnd}
            onChange={(e) => setEndDate(e.target.value)}
            className={inp}
            style={{ ...inpStyle, minWidth: 0 }}
          />
        </div>
      </div>
      <textarea
        placeholder="메모 (선택)"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={2}
        className={inp}
        style={inpStyle}
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm border font-medium"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
            background: "white",
          }}
        >
          취소
        </button>
        <button
          onClick={() => {
            if (title.trim())
              onSave({
                title: title.trim(),
                start_date: startDate,
                end_date: endDate,
                memo,
              });
          }}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--color-accent)" }}
        >
          저장
        </button>
      </div>
    </div>
  );
}

// ─── TaskItem ─────────────────────────────────────────────────
interface TaskItemProps {
  task: Task;
  phaseColor: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChecklist: (text: string) => void;
  onToggleChecklist: (id: string) => void;
  onDeleteChecklist: (id: string) => void;
}

function TaskItem({
  task,
  phaseColor,
  onToggle,
  onEdit,
  onDelete,
  onAddChecklist,
  onToggleChecklist,
  onDeleteChecklist,
}: TaskItemProps) {
  const [checkText, setCheckText] = useState("");
  const [showList, setShowList] = useState(false);

  const addCheck = () => {
    if (!checkText.trim()) return;
    onAddChecklist(checkText.trim());
    setCheckText("");
    setShowList(true);
  };

  return (
    <div
      className="rounded-xl border p-3 mb-2"
      style={{ borderColor: "var(--color-border)", background: "white" }}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          className="w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors"
          style={{
            background: task.done ? "var(--color-accent)" : "white",
            borderColor: task.done
              ? "var(--color-accent)"
              : "var(--color-border)",
          }}
        >
          {task.done && <Check size={11} className="text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug"
            style={{
              color: "var(--color-text-primary)",
              textDecoration: task.done ? "line-through" : "none",
              opacity: task.done ? 0.5 : 1,
            }}
          >
            {task.title}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {task.start_date.replace(/-/g, ".")} ~{" "}
            {task.end_date.replace(/-/g, ".")}
          </p>
          {task.memo && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {task.memo}
            </p>
          )}
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <button onClick={onEdit} className="p-1 rounded-lg hover:bg-gray-50">
            <Edit2 size={12} style={{ color: "var(--color-text-muted)" }} />
          </button>
          <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-50">
            <Trash2 size={12} className="text-red-400" />
          </button>
        </div>
      </div>

      {task.checklist_items.length > 0 && (
        <div
          className="mt-2 border-t pt-2"
          style={{ borderColor: "var(--color-border-light)" }}
        >
          <button
            onClick={() => setShowList((v) => !v)}
            className="flex items-center gap-1 text-xs mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ChevronDown
              size={12}
              style={{
                transform: showList ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}
            />
            체크리스트 ({task.checklist_items.filter((c) => c.done).length}/
            {task.checklist_items.length})
          </button>
          {showList &&
            task.checklist_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 pl-2 py-0.5 group"
              >
                <button
                  onClick={() => onToggleChecklist(item.id)}
                  className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: item.done ? "var(--color-accent)" : "white",
                    borderColor: item.done
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                  }}
                >
                  {item.done && <Check size={9} className="text-white" />}
                </button>
                <span
                  className="flex-1 text-xs"
                  style={{
                    color: "var(--color-text-secondary)",
                    textDecoration: item.done ? "line-through" : "none",
                  }}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => onDeleteChecklist(item.id)}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <X size={11} style={{ color: "var(--color-text-muted)" }} />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── TaskDetail ──────────────────────────────────────────────
interface TaskDetailProps {
  task: Task;
  phase: (typeof GANTT_PHASES)[number];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onAddChecklist: (text: string) => void;
  onToggleChecklist: (id: string) => void;
  onDeleteChecklist: (id: string) => void;
}

function TaskDetail({
  task, phase, onToggle, onEdit, onDelete, onBack,
  onAddChecklist, onToggleChecklist, onDeleteChecklist,
}: TaskDetailProps) {
  const [checkText, setCheckText] = useState("");
  const doneCount = task.checklist_items.filter((c) => c.done).length;
  const duration = Math.round(
    (new Date(task.end_date + "T00:00:00").getTime() -
      new Date(task.start_date + "T00:00:00").getTime()) /
      86400000
  ) + 1;

  const addCheck = () => {
    if (!checkText.trim()) return;
    onAddChecklist(checkText.trim());
    setCheckText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)", background: phase.color + "40" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "rgba(0,0,0,0.55)" }}
        >
          <ChevronLeft size={13} />
          {phase.label}
        </button>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border"
            style={{ borderColor: "rgba(0,0,0,0.12)", background: "white", color: "var(--color-text-secondary)" }}
          >
            <Edit2 size={11} /> 수정
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border"
            style={{ borderColor: "rgba(239,68,68,0.3)", background: "#FFF5F5", color: "#EF4444" }}
          >
            <Trash2 size={11} /> 삭제
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 제목 + 완료 체크 */}
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className="w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors"
            style={{
              background: task.done ? "var(--color-accent)" : "white",
              borderColor: task.done ? "var(--color-accent)" : "var(--color-border)",
            }}
          >
            {task.done && <Check size={12} className="text-white" />}
          </button>
          <div>
            <p
              className="text-base font-bold leading-snug"
              style={{
                color: "var(--color-text-primary)",
                textDecoration: task.done ? "line-through" : "none",
                opacity: task.done ? 0.5 : 1,
              }}
            >
              {task.title}
            </p>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium"
              style={{
                background: task.done ? "#D1FAE5" : phase.color,
                color: task.done ? "#065F46" : "rgba(0,0,0,0.6)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {task.done ? "✓ 완료" : "진행중"}
            </span>
          </div>
        </div>

        {/* 기간 카드 */}
        <div
          className="rounded-2xl p-3"
          style={{ background: phase.color + "35", border: `1px solid ${phase.color}` }}
        >
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <p className="text-xs mb-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>시작일</p>
              <p className="font-bold text-sm" style={{ color: "rgba(0,0,0,0.7)" }}>
                {task.start_date.replace(/-/g, ".")}
              </p>
            </div>
            <div className="text-base" style={{ color: "rgba(0,0,0,0.3)" }}>→</div>
            <div className="text-center">
              <p className="text-xs mb-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>마감일</p>
              <p className="font-bold text-sm" style={{ color: "rgba(0,0,0,0.7)" }}>
                {task.end_date.replace(/-/g, ".")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs mb-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>기간</p>
              <p className="font-bold text-sm" style={{ color: "rgba(0,0,0,0.7)" }}>{duration}일</p>
            </div>
          </div>
        </div>

        {/* 메모 */}
        {task.memo && (
          <div className="rounded-xl p-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--color-border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>메모</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
              {task.memo}
            </p>
          </div>
        )}

        {/* 체크리스트 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              체크리스트
            </p>
            {task.checklist_items.length > 0 && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {doneCount}/{task.checklist_items.length}
              </span>
            )}
          </div>

          {task.checklist_items.length > 0 && (
            <div
              className="rounded-xl overflow-hidden mb-2"
              style={{ border: "1px solid var(--color-border)" }}
            >
              {task.checklist_items.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 group"
                  style={{
                    background: item.done ? "#F0FDF4" : "white",
                    borderTop: i > 0 ? "1px solid var(--color-border-light)" : "none",
                  }}
                >
                  <button
                    onClick={() => onToggleChecklist(item.id)}
                    className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: item.done ? "var(--color-accent)" : "white",
                      borderColor: item.done ? "var(--color-accent)" : "var(--color-border)",
                    }}
                  >
                    {item.done && <Check size={9} className="text-white" />}
                  </button>
                  <span
                    className="flex-1 text-sm"
                    style={{
                      color: item.done ? "var(--color-text-muted)" : "var(--color-text-primary)",
                      textDecoration: item.done ? "line-through" : "none",
                    }}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => onDeleteChecklist(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} style={{ color: "var(--color-text-muted)" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="항목 추가"
              value={checkText}
              onChange={(e) => setCheckText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCheck(); }}
              className="flex-1 px-3 py-2 text-sm rounded-xl border focus:outline-none"
              style={{ borderColor: "var(--color-border)", background: "white" }}
            />
            <button
              onClick={addCheck}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: phase.color, border: "1px solid rgba(0,0,0,0.1)" }}
            >
              <Plus size={15} style={{ color: "rgba(0,0,0,0.55)" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SidePanel ────────────────────────────────────────────────
interface SidePanelProps {
  panel: PanelState;
  tasks: Task[];
  projectStart: string;
  projectEnd: string;
  onClose: () => void;
  onTaskSelect: (taskId: string) => void;
  onSaveTask: (
    phaseKey: string,
    data: { title: string; start_date: string; end_date: string; memo: string },
    taskId?: string
  ) => Promise<void>;
  onDeleteTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onAddChecklist: (task: Task, text: string) => void;
  onToggleChecklist: (task: Task, itemId: string) => void;
  onDeleteChecklist: (task: Task, itemId: string) => void;
}

function SidePanel({
  panel,
  tasks,
  projectStart,
  projectEnd,
  onClose,
  onTaskSelect,
  onSaveTask,
  onDeleteTask,
  onToggleTask,
  onEditTask,
  onAddChecklist,
  onToggleChecklist,
  onDeleteChecklist,
}: SidePanelProps) {
  const [addingInline, setAddingInline] = useState(false);

  useEffect(() => {
    setAddingInline(false);
  }, [panel]);

  if (panel.type === "none") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-5">
        <p className="text-3xl mb-3">📋</p>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          공정 이름 클릭
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          할일 목록 보기
        </p>
        <p
          className="text-sm font-medium mt-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          날짜 셀 클릭
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          할일 추가
        </p>
      </div>
    );
  }

  if (panel.type === "date") {
    const date = panel.date;
    const dt = new Date(date + "T00:00:00");
    const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
    const dateLabel = `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${DAY_KO[dt.getDay()]})`;
    const tasksOnDate = tasks.filter((t) => t.start_date <= date && t.end_date >= date);
    const grouped = GANTT_PHASES.map((phase) => ({
      phase,
      tasks: tasksOnDate.filter((t) => t.phase_id === phase.key),
    })).filter((g) => g.tasks.length > 0);

    return (
      <div className="flex flex-col h-full">
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--color-border)", background: "white" }}
        >
          <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            📅 {dateLabel}
          </span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-50">
            <X size={15} style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {grouped.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                이 날 등록된 할일이 없습니다
              </p>
            </div>
          ) : (
            grouped.map(({ phase, tasks: pTasks }) => (
              <div key={phase.key} className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: phase.color, border: "1px solid rgba(0,0,0,0.1)" }}
                  />
                  <span className="text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>
                    {phase.label}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: phase.color + "60", color: "rgba(0,0,0,0.6)" }}
                  >
                    {pTasks.length}건
                  </span>
                </div>
                {pTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskSelect(task.id)}
                    className="rounded-xl border p-3 mb-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "var(--color-border)", background: "white" }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center"
                        style={{
                          background: task.done ? "var(--color-accent)" : "white",
                          borderColor: task.done ? "var(--color-accent)" : "var(--color-border)",
                        }}
                      >
                        {task.done && <Check size={9} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{
                            color: "var(--color-text-primary)",
                            textDecoration: task.done ? "line-through" : "none",
                            opacity: task.done ? 0.5 : 1,
                          }}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {task.start_date.replace(/-/g, ".")} ~ {task.end_date.replace(/-/g, ".")}
                          {task.checklist_items.length > 0 && (
                            <span className="ml-1.5">
                              · 체크 {task.checklist_items.filter((c) => c.done).length}/{task.checklist_items.length}
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronLeft size={13} className="flex-shrink-0 mt-0.5 rotate-180" style={{ color: "var(--color-text-muted)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (panel.type === "task") {
    const task = tasks.find((t) => t.id === panel.taskId);
    if (!task) return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>할일을 찾을 수 없습니다</p>
      </div>
    );
    const phase = GANTT_PHASES.find((p) => p.key === task.phase_id)!;
    return (
      <TaskDetail
        task={task}
        phase={phase}
        onToggle={() => onToggleTask(task)}
        onEdit={() => onEditTask(task)}
        onDelete={() => onDeleteTask(task)}
        onBack={() => onClose()}
        onAddChecklist={(text) => onAddChecklist(task, text)}
        onToggleChecklist={(id) => onToggleChecklist(task, id)}
        onDeleteChecklist={(id) => onDeleteChecklist(task, id)}
      />
    );
  }

  if (panel.type === "add" || panel.type === "edit") {
    const phaseKey =
      panel.type === "add" ? panel.phaseKey : panel.task.phase_id;
    return (
      <div className="p-4 overflow-y-auto h-full">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs mb-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronLeft size={13} /> 돌아가기
        </button>
        <TaskForm
          phaseKey={phaseKey}
          initialDate={panel.type === "add" ? panel.date : undefined}
          projectStart={projectStart}
          projectEnd={projectEnd}
          initial={panel.type === "edit" ? panel.task : undefined}
          onSave={async (data) => {
            await onSaveTask(
              phaseKey,
              data,
              panel.type === "edit" ? panel.task.id : undefined
            );
          }}
          onCancel={onClose}
        />
      </div>
    );
  }

  const phase = GANTT_PHASES.find((p) => p.key === panel.phaseKey)!;
  const phaseTasks = tasks.filter((t) => t.phase_id === panel.phaseKey);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{
          borderColor: "var(--color-border)",
          background: phase.color + "50",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full border"
            style={{ background: phase.color, borderColor: "rgba(0,0,0,0.15)" }}
          />
          <span
            className="text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {phase.label}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: phase.color,
              color: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            {phaseTasks.length}건
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5">
          <X size={15} style={{ color: "var(--color-text-muted)" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {phaseTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            phaseColor={phase.color}
            onToggle={() => onToggleTask(task)}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task)}
            onAddChecklist={(text) => onAddChecklist(task, text)}
            onToggleChecklist={(id) => onToggleChecklist(task, id)}
            onDeleteChecklist={(id) => onDeleteChecklist(task, id)}
          />
        ))}

        {addingInline ? (
          <div className="mt-1">
            <TaskForm
              phaseKey={panel.phaseKey}
              projectStart={projectStart}
              projectEnd={projectEnd}
              onSave={async (data) => {
                await onSaveTask(panel.phaseKey, data);
                setAddingInline(false);
              }}
              onCancel={() => setAddingInline(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingInline(true)}
            className="w-full py-2.5 rounded-xl border-dashed border text-sm flex items-center justify-center gap-1 mt-1"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            <Plus size={14} /> 할일 추가
          </button>
        )}
      </div>
    </div>
  );
}

// ─── GanttChart ───────────────────────────────────────────────
interface GanttChartProps {
  dates: string[];
  tasks: Task[];
  projectStart: string;
  selectedDate?: string;
  onCellClick: (phaseKey: PhaseKey, date: string) => void;
  onPhaseClick: (phaseKey: PhaseKey) => void;
  onTaskClick: (task: Task) => void;
  onDateHeaderClick: (date: string) => void;
}

function GanttChart({
  dates,
  tasks,
  projectStart,
  selectedDate,
  onCellClick,
  onPhaseClick,
  onTaskClick,
  onDateHeaderClick,
}: GanttChartProps) {
  const today = localDateStr(new Date());
  const todayOff = dates.indexOf(today);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // ── Custom scrollbar ──────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollInfo, setScrollInfo] = useState({ left: 0, clientW: 0, scrollW: 0 });
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const updateScrollInfo = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollInfo({ left: el.scrollLeft, clientW: el.clientWidth, scrollW: el.scrollWidth });
  }, []);

  useEffect(() => {
    updateScrollInfo();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollInfo);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollInfo, dates.length]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !scrollRef.current) return;
      const dx = e.clientX - dragStartX.current;
      const { clientW, scrollW } = scrollInfo;
      const maxScroll = scrollW - clientW;
      const thumbW = Math.max(32, clientW * (clientW / scrollW));
      const trackLen = clientW - thumbW;
      if (trackLen <= 0) return;
      scrollRef.current.scrollLeft = Math.max(
        0,
        Math.min(maxScroll, dragStartScrollLeft.current + dx * (maxScroll / trackLen))
      );
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [scrollInfo]);

  const { left: sLeft, clientW: sClientW, scrollW: sScrollW } = scrollInfo;
  const hasScroll = sScrollW > sClientW + 2;
  const sThumbW = hasScroll ? Math.max(32, sClientW * (sClientW / sScrollW)) : 0;
  const sMaxScroll = sScrollW - sClientW;
  const sThumbLeft = sMaxScroll > 0 ? (sLeft / sMaxScroll) * (sClientW - sThumbW) : 0;

  const onThumbMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    e.preventDefault();
  };
  // ─────────────────────────────────────────────────────────────

  const monthGroups = buildMonthGroups(dates);
  const totalW = PHASE_COL_W + dates.length * COL_W;

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="gantt-scroll flex-1 overflow-auto"
        style={{ WebkitOverflowScrolling: "touch" as const }}
        onScroll={updateScrollInfo}
      >
      <div style={{ minWidth: totalW, width: totalW }}>
        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-20" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
          {/* Month row */}
          <div className="flex" style={{ background: "#F0EDE8" }}>
            <div
              className="sticky left-0 z-30 flex-shrink-0"
              style={{
                width: PHASE_COL_W,
                height: 22,
                background: "#F0EDE8",
                borderRight: "2px solid var(--color-border)",
              }}
            />
            {monthGroups.map((g, i) => (
              <div
                key={i}
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: g.span * COL_W,
                  height: 22,
                  borderRight: "1px solid var(--color-border)",
                  background: i % 2 === 0 ? "#F0EDE8" : "#E8E3DC",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {g.label}
                </span>
              </div>
            ))}
          </div>

          {/* Day row */}
          <div
            className="flex"
            style={{
              borderBottom: "2px solid var(--color-border)",
              background: "white",
            }}
          >
            <div
              className="sticky left-0 z-30 flex-shrink-0 bg-white flex items-center justify-center"
              style={{
                width: PHASE_COL_W,
                height: 30,
                borderRight: "2px solid var(--color-border)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "var(--color-text-muted)",
                }}
              >
                공정
              </span>
            </div>
            {dates.map((d) => {
              const dow = new Date(d + "T00:00:00").getDay();
              const isSat = dow === 6;
              const isSun = dow === 0;
              const isToday = d === today;
              const isSelected = d === selectedDate;
              const isHovered = d === hoveredDate;
              const cellBg = isSelected
                ? "rgba(0,0,0,0.07)"
                : isHovered
                ? isSat ? "#DBEAFE" : isSun ? "#FFE4E6" : "#F3F4F6"
                : isSat ? "#EFF6FF" : isSun ? "#FFF1F2" : "white";
              return (
                <div
                  key={d}
                  onClick={() => onDateHeaderClick(d)}
                  onMouseEnter={() => setHoveredDate(d)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: COL_W,
                    height: 30,
                    cursor: "pointer",
                    background: cellBg,
                    borderRight: "1px solid var(--color-border-light)",
                    outline: isSelected ? "2px solid rgba(0,0,0,0.18)" : "none",
                    outlineOffset: -1,
                    transition: "background 0.1s",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: isToday ? "var(--color-accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: isToday || isSelected ? 700 : 400,
                        color: isToday
                          ? "white"
                          : isSelected
                          ? "rgba(0,0,0,0.7)"
                          : isSat
                          ? "#3B82F6"
                          : isSun
                          ? "#EF4444"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {new Date(d + "T00:00:00").getDate()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Phase rows ── */}
        {GANTT_PHASES.map((phase) => {
          const phaseTasks = tasks.filter((t) => t.phase_id === phase.key);
          const rh = rowHeight(phaseTasks.length);

          return (
            <div
              key={phase.key}
              className="flex"
              style={{
                height: rh,
                borderBottom: "1px solid var(--color-border-light)",
              }}
            >
              {/* Phase name (sticky left) */}
              <div
                onClick={() => onPhaseClick(phase.key)}
                className="sticky left-0 z-10 flex items-center px-2 cursor-pointer flex-shrink-0"
                style={{
                  width: PHASE_COL_W,
                  height: rh,
                  background: phase.color,
                  borderRight: "2px solid rgba(0,0,0,0.08)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(0,0,0,0.6)",
                  userSelect: "none",
                }}
              >
                {phase.label}
              </div>

              {/* Date grid */}
              <div
                className="relative flex-shrink-0"
                style={{ width: dates.length * COL_W, height: rh }}
              >
                {/* Weekend backgrounds + click zones */}
                {dates.map((d, i) => {
                  const dow = new Date(d + "T00:00:00").getDay();
                  const bg =
                    dow === 6
                      ? "#EFF6FF44"
                      : dow === 0
                      ? "#FFF1F244"
                      : "transparent";
                  return (
                    <div
                      key={d}
                      onClick={() => onCellClick(phase.key, d)}
                      style={{
                        position: "absolute",
                        left: i * COL_W,
                        top: 0,
                        width: COL_W,
                        height: rh,
                        background: bg,
                        borderRight: "1px solid var(--color-border-light)",
                        cursor: "pointer",
                        zIndex: 1,
                      }}
                    />
                  );
                })}

                {/* Today line */}
                {todayOff >= 0 && todayOff < dates.length && (
                  <div
                    style={{
                      position: "absolute",
                      left: todayOff * COL_W + COL_W / 2 - 1,
                      top: 0,
                      width: 2,
                      height: rh,
                      background: "var(--color-accent)",
                      opacity: 0.35,
                      zIndex: 3,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Task bars */}
                {phaseTasks.map((task, ti) => {
                  const startOff = dayOffset(projectStart, task.start_date);
                  const endOff = dayOffset(projectStart, task.end_date);
                  const left = startOff * COL_W + 1;
                  const width = Math.max(
                    COL_W - 2,
                    (endOff - startOff + 1) * COL_W - 2
                  );
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      style={{
                        position: "absolute",
                        left,
                        top: BAR_TOP + ti * (BAR_H + BAR_GAP),
                        height: BAR_H,
                        width,
                        background: phase.color,
                        border: "1px solid rgba(0,0,0,0.14)",
                        borderRadius: 4,
                        cursor: "pointer",
                        zIndex: 2,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 5,
                        opacity: task.done ? 0.45 : 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "rgba(0,0,0,0.65)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {task.done ? "✓ " : ""}
                        {task.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* ── Custom horizontal scrollbar ── */}
      {hasScroll && (
        <div
          style={{
            height: 12,
            background: "#ECEEF0",
            flexShrink: 0,
            position: "relative",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div
            onMouseDown={onThumbMouseDown}
            style={{
              position: "absolute",
              left: sThumbLeft,
              width: sThumbW,
              top: 3,
              height: 6,
              borderRadius: 3,
              background: "rgba(0,0,0,0.28)",
              cursor: "grab",
              userSelect: "none" as const,
              transition: "background 0.1s",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── GanttView (main export) ──────────────────────────────────
interface GanttViewProps {
  timelineId: string;
  startDate: string;
  endDate: string;
  onStatsChange?: (done: number, total: number) => void;
}

export default function GanttView({
  timelineId,
  startDate,
  endDate,
  onStatsChange,
}: GanttViewProps) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [panel, setPanel] = useState<PanelState>({ type: "none" });
  const [loading, setLoading] = useState(true);

  const dates = generateDates(startDate, endDate);
  const totalDays = dates.length;

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("timeline_tasks")
      .select("*, timeline_checklist_items(*)")
      .eq("timeline_id", timelineId)
      .order("start_date")
      .order("created_at");
    if (data) {
      setTasks(
        data.map((t) => ({
          ...t,
          checklist_items: t.timeline_checklist_items ?? [],
        }))
      );
    }
    setLoading(false);
  }, [timelineId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCellClick = (phaseKey: PhaseKey, date: string) => {
    setPanel({ type: "add", phaseKey, date });
  };

  const handlePhaseClick = (phaseKey: PhaseKey) => {
    setPanel((prev) =>
      prev.type === "phase" && prev.phaseKey === phaseKey
        ? { type: "none" }
        : { type: "phase", phaseKey }
    );
  };

  const handleTaskClick = (task: Task) => {
    setPanel({ type: "task", taskId: task.id });
  };

  const handleSaveTask = async (
    phaseKey: string,
    data: { title: string; start_date: string; end_date: string; memo: string },
    taskId?: string
  ) => {
    if (taskId) {
      await supabase.from("timeline_tasks").update(data).eq("id", taskId);
      await loadTasks();
      setPanel({ type: "task", taskId });
    } else {
      await supabase.from("timeline_tasks").insert({
        timeline_id: timelineId,
        phase_id: phaseKey,
        ...data,
        done: false,
      });
      await loadTasks();
      setPanel({ type: "phase", phaseKey: phaseKey as PhaseKey });
    }
  };

  const handleDeleteTask = async (task: Task) => {
    await supabase.from("timeline_tasks").delete().eq("id", task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setPanel({ type: "phase", phaseKey: task.phase_id as PhaseKey });
  };

  const handleToggleTask = async (task: Task) => {
    const done = !task.done;
    await supabase.from("timeline_tasks").update({ done }).eq("id", task.id);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done } : t))
    );
  };

  const handleEditTask = (task: Task) => {
    setPanel({ type: "edit", task });
  };

  const handleDateHeaderClick = (date: string) => {
    setPanel((prev) =>
      prev.type === "date" && prev.date === date
        ? { type: "none" }
        : { type: "date", date }
    );
  };

  const handleTaskSelect = (taskId: string) => {
    setPanel({ type: "task", taskId });
  };

  const handleAddChecklist = async (task: Task, text: string) => {
    const { data } = await supabase
      .from("timeline_checklist_items")
      .insert({ task_id: task.id, text, done: false })
      .select()
      .single();
    if (data) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, checklist_items: [...t.checklist_items, data] }
            : t
        )
      );
    }
  };

  const handleToggleChecklist = async (task: Task, itemId: string) => {
    const item = task.checklist_items.find((c) => c.id === itemId);
    if (!item) return;
    await supabase
      .from("timeline_checklist_items")
      .update({ done: !item.done })
      .eq("id", itemId);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              checklist_items: t.checklist_items.map((c) =>
                c.id === itemId ? { ...c, done: !c.done } : c
              ),
            }
          : t
      )
    );
  };

  const handleDeleteChecklist = async (task: Task, itemId: string) => {
    await supabase.from("timeline_checklist_items").delete().eq("id", itemId);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              checklist_items: t.checklist_items.filter((c) => c.id !== itemId),
            }
          : t
      )
    );
  };

  const doneTasks = tasks.filter((t) => t.done).length;

  useEffect(() => {
    onStatsChange?.(doneTasks, tasks.length);
  }, [doneTasks, tasks.length]);

  if (!startDate || !endDate) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          프로젝트 기간(착공일, 입주예정일)을 먼저 설정해주세요
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chart + Panel */}
      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: "var(--color-accent)",
                borderTopColor: "transparent",
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              <GanttChart
                dates={dates}
                tasks={tasks}
                projectStart={startDate}
                selectedDate={panel.type === "date" ? panel.date : undefined}
                onCellClick={handleCellClick}
                onPhaseClick={handlePhaseClick}
                onTaskClick={handleTaskClick}
                onDateHeaderClick={handleDateHeaderClick}
              />
            </div>
            <div
              className="border-l flex-shrink-0 overflow-hidden flex flex-col"
              style={{
                width: 260,
                borderColor: "var(--color-border)",
                background: "var(--bg-secondary)",
              }}
            >
              <SidePanel
                panel={panel}
                tasks={tasks}
                projectStart={startDate}
                projectEnd={endDate}
                onClose={() => setPanel({ type: "none" })}
                onTaskSelect={handleTaskSelect}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
                onToggleTask={handleToggleTask}
                onEditTask={handleEditTask}
                onAddChecklist={handleAddChecklist}
                onToggleChecklist={handleToggleChecklist}
                onDeleteChecklist={handleDeleteChecklist}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
