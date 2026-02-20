import { getAccessToken } from './client'

const BASE = '/api/v1'

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken()
  const headers: HeadersInit = {}
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  return headers
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadExpensesCsv(params?: { month?: number; year?: number }): Promise<void> {
  const sp = new URLSearchParams()
  if (params?.month != null) sp.set('month', String(params.month))
  if (params?.year != null) sp.set('year', String(params.year))
  const q = sp.toString()
  const res = await fetch(`${BASE}/export/expenses.csv${q ? `?${q}` : ''}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(res.statusText || 'Export failed')
  const blob = await res.blob()
  downloadBlob(blob, 'expenses.csv')
}

export async function downloadSummaryPdf(month: number, year: number): Promise<void> {
  const res = await fetch(`${BASE}/export/summary.pdf?month=${month}&year=${year}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(res.statusText || 'Export failed')
  const blob = await res.blob()
  downloadBlob(blob, `expense-summary-${year}-${String(month).padStart(2, '0')}.pdf`)
}
