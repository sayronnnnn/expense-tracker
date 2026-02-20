import type { Category } from '../types'
import { apiGet, apiPost } from './client'

export function listCategories(): Promise<Category[]> {
  return apiGet<Category[]>('/categories')
}

export function createCategory(name: string, slug?: string): Promise<Category> {
  return apiPost<Category>('/categories', { name, slug })
}
