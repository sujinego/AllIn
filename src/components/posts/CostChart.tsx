'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCost } from '@/lib/utils'
import { COST_COLORS } from '@/lib/utils'
import { COST_CATEGORIES } from '@/types'
import type { CostItem } from '@/types'

interface Props {
  costItems: CostItem[]
  totalCost: number
}

export default function CostChart({ costItems, totalCost }: Props) {
  const data = costItems
    .filter(item => item.amount > 0)
    .map(item => {
      const cat = COST_CATEGORIES.find(c => c.key === item.category)
      return {
        name: cat?.label ?? item.category,
        value: item.amount,
        key: item.category,
        label: item.label,
        percent: Math.round((item.amount / totalCost) * 100),
      }
    })
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) return null

  return (
    <div>
      <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>비용 구성</h3>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* 파이 차트 */}
        <div className="w-full lg:w-64 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={COST_COLORS[entry.key] ?? '#D4BC9C'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCost(value), '']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 항목 목록 */}
        <div className="flex-1 w-full space-y-2">
          {data.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: COST_COLORS[item.key] ?? '#D4BC9C' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.name}
                    {item.label && (
                      <span className="ml-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        ({item.label})
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold flex-shrink-0 ml-2"
                    style={{ color: 'var(--color-text-primary)' }}>
                    {formatCost(item.value)}
                  </span>
                </div>
                {/* 진행 바 */}
                <div className="mt-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percent}%`,
                      background: COST_COLORS[item.key] ?? '#D4BC9C',
                    }}
                  />
                </div>
              </div>
              <span className="text-xs w-8 text-right flex-shrink-0"
                style={{ color: 'var(--color-text-muted)' }}>
                {item.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
