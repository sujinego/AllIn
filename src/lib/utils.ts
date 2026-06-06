import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sqmToPyeong(sqm: number): number {
  return Math.round((sqm / 3.3058) * 10) / 10
}

export function formatCost(amount: number): string {
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000)
    const man = Math.floor((amount % 100000000) / 10000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000).toLocaleString()}만원`
  }
  return `${amount.toLocaleString()}원`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function calcCostPerPyeong(totalCost: number, areaSqm: number): number {
  const pyeong = sqmToPyeong(areaSqm)
  if (pyeong === 0) return 0
  return Math.round(totalCost / pyeong)
}

export const COST_COLORS: Record<string, string> = {
  demolition: '#C5A882',
  floor: '#B8956A',
  wallpaper: '#D4BC9C',
  bathroom: '#A67C52',
  kitchen: '#8B6B4A',
  lighting: '#E8D5B7',
  furniture: '#6B4F35',
  window: '#C9A87C',
  electrical: '#DEC5A0',
  other: '#F0E2CC',
}
