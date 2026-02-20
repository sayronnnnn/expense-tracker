import type { MonthlyTotal, CategoryDistribution, SpendingTrend, DailyBreakdown } from '../types'
import { apiGet } from './client'

export interface SpendingSpike {
  category_id: string
  category_name: string
  amount: number
  average_amount: number
  percentage_increase: number
  date: string
  description: string
}

export interface CategoryProfile {
  category_id: string
  category_name: string
  amount: number
  percentage: number
}

export interface LifestyleProfile {
  profile_type: string
  top_categories: CategoryProfile[]
  insights: string
}

export interface SpendingTrendData {
  category_id: string
  category_name: string
  direction: string
  trend_percentage: number
  months_analyzed: number
  insight: string
}

export interface BehaviorAnalysis {
  period: string
  analysis_date: string
  month: number
  year: number
  spending_spikes: SpendingSpike[]
  lifestyle_profile: LifestyleProfile
  trends: SpendingTrendData[]
  summary: string
}

export function getMonthlyTotal(month: number, year: number): Promise<MonthlyTotal> {
  return apiGet<MonthlyTotal>(`/analytics/monthly-total?month=${month}&year=${year}`)
}

export function getCategoryDistribution(month: number, year: number): Promise<CategoryDistribution> {
  return apiGet<CategoryDistribution>(`/analytics/by-category?month=${month}&year=${year}`)
}

export function getSpendingTrend(months?: number): Promise<SpendingTrend> {
  const q = months != null ? `?months=${months}` : ''
  return apiGet<SpendingTrend>(`/analytics/trends${q}`)
}

export function getDailyBreakdown(month: number, year: number): Promise<DailyBreakdown> {
  return apiGet<DailyBreakdown>(`/analytics/daily-breakdown?month=${month}&year=${year}`)
}

export function getBehaviorAnalysis(month: number, year: number): Promise<BehaviorAnalysis> {
  return apiGet<BehaviorAnalysis>(`/analytics/behavior?month=${month}&year=${year}`)
}
