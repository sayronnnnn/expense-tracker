import type { Expense, ExpenseCreate } from '../types'
import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export interface ListExpensesParams {
  month?: number
  year?: number
  category_id?: string
  skip?: number
  limit?: number
}

export function listExpenses(params: ListExpensesParams = {}): Promise<Expense[]> {
  const sp = new URLSearchParams()
  if (params.month != null) sp.set('month', String(params.month))
  if (params.year != null) sp.set('year', String(params.year))
  if (params.category_id) sp.set('category_id', params.category_id)
  if (params.skip != null) sp.set('skip', String(params.skip))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const q = sp.toString()
  return apiGet<Expense[]>(`/expenses${q ? `?${q}` : ''}`)
}

export function createExpense(body: ExpenseCreate): Promise<Expense> {
  return apiPost<Expense>('/expenses', body)
}

export function getExpense(id: string): Promise<Expense> {
  return apiGet<Expense>(`/expenses/${id}`)
}

export function updateExpense(id: string, body: Partial<ExpenseCreate>): Promise<Expense> {
  return apiPatch<Expense>(`/expenses/${id}`, body)
}

export function deleteExpense(id: string): Promise<void> {
  return apiDelete(`/expenses/${id}`)
}
