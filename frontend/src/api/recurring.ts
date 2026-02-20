import type { RecurringRule } from '../types'
import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export function listRecurringRules(): Promise<RecurringRule[]> {
  return apiGet<RecurringRule[]>('/recurring')
}

export function createRecurringRule(body: {
  category_id: string
  amount: string
  currency?: string
  note?: string | null
  frequency: string
  start_date?: string | null
}): Promise<RecurringRule> {
  return apiPost<RecurringRule>('/recurring', body)
}

export function getRecurringRule(id: string): Promise<RecurringRule> {
  return apiGet<RecurringRule>(`/recurring/${id}`)
}

export function updateRecurringRule(id: string, body: Partial<{
  category_id: string
  amount: string
  currency: string
  note: string | null
  frequency: string
}>): Promise<RecurringRule> {
  return apiPatch<RecurringRule>(`/recurring/${id}`, body)
}

export function deleteRecurringRule(id: string): Promise<void> {
  return apiDelete(`/recurring/${id}`)
}
