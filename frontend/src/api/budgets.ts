import type { BudgetWithActual } from '../types'
import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export function listBudgets(params?: { month?: number; year?: number; include_actual?: boolean }): Promise<BudgetWithActual[]> {
  const sp = new URLSearchParams()
  if (params?.month != null) sp.set('month', String(params.month))
  if (params?.year != null) sp.set('year', String(params.year))
  if (params?.include_actual !== undefined) sp.set('include_actual', String(params.include_actual))
  const q = sp.toString()
  return apiGet<BudgetWithActual[]>(`/budgets${q ? `?${q}` : ''}`)
}

export function createBudget(body: {
  month: number
  year: number
  amount: string
  currency?: string
  category_id?: string | null
}): Promise<BudgetWithActual> {
  return apiPost<BudgetWithActual>('/budgets', body)
}

export function getBudget(id: string): Promise<BudgetWithActual> {
  return apiGet<BudgetWithActual>(`/budgets/${id}`)
}

export function updateBudget(id: string, body: Partial<{ month: number; year: number; amount: string; currency: string; category_id: string | null }>): Promise<BudgetWithActual> {
  return apiPatch<BudgetWithActual>(`/budgets/${id}`, body)
}

export function deleteBudget(id: string): Promise<void> {
  return apiDelete(`/budgets/${id}`)
}
