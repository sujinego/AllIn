'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { COST_CATEGORIES } from '@/types'
import type { CostCategoryKey } from '@/types'

export interface CostItemInput {
  category: string
  label: string
  amount: string
  memo: string
}

interface Props {
  items: CostItemInput[]
  onChange: (items: CostItemInput[]) => void
}

export default function CostItemsForm({ items, onChange }: Props) {
  const add = () => {
    onChange([...items, { category: 'other', label: '', amount: '', memo: '' }])
  }

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const update = (idx: number, field: keyof CostItemInput, value: string) => {
    const next = [...items]
    next[idx] = { ...next[idx], [field]: value }
    onChange(next)
  }

  const totalInput = items.reduce((sum, it) => {
    const n = parseInt(it.amount.replace(/,/g, ''), 10)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          항목별 비용 <span className="font-normal text-xs" style={{ color: 'var(--color-text-muted)' }}>(선택)</span>
        </h3>
        {totalInput > 0 && (
          <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
            합계: {(totalInput / 10000).toLocaleString()}만원
          </span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <select
              value={item.category}
              onChange={(e) => update(idx, 'category', e.target.value)}
              className="w-28 px-2 py-2 rounded-xl border text-sm flex-shrink-0"
              style={{ borderColor: 'var(--color-border)', background: 'var(--bg-primary)' }}
            >
              {COST_CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="세부 내용 (예: 이케아 팍스)"
              value={item.label}
              onChange={(e) => update(idx, 'label', e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--bg-primary)' }}
            />

            <div className="relative flex-shrink-0 w-28">
              <input
                type="text"
                inputMode="numeric"
                placeholder="금액"
                value={item.amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  update(idx, 'amount', raw ? parseInt(raw).toLocaleString() : '')
                }}
                className="w-full pl-3 pr-7 py-2 rounded-xl border text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--bg-primary)' }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: 'var(--color-text-muted)' }}>원</span>
            </div>

            <button
              type="button"
              onClick={() => remove(idx)}
              className="p-2 rounded-xl hover:bg-red-50 text-red-400 flex-shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-3 flex items-center gap-1.5 text-sm py-2 px-4 rounded-xl border border-dashed w-full justify-center transition-colors hover:bg-gray-50"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
      >
        <Plus size={15} /> 항목 추가
      </button>
    </div>
  )
}
