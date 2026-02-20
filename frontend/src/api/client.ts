const BASE = '/api/v1'

const getAccessToken = (): string | null =>
  localStorage.getItem('access_token')

const getRefreshToken = (): string | null =>
  localStorage.getItem('refresh_token')

const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export { getAccessToken, getRefreshToken, setTokens, clearTokens }

export interface ApiError {
  detail: string | { msg?: string; loc?: unknown }[]
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!res.ok) {
    clearTokens()
    return false
  }
  const data = await res.json()
  setTokens(data.access_token, data.refresh_token)
  return true
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  let res = await fetch(url, { ...options, headers })
  if (res.status === 401 && token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const newToken = getAccessToken()
      const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
      res = await fetch(url, { ...options, headers: newHeaders })
    }
  }
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ detail: res.statusText }))
    const message = typeof err.detail === 'string' ? err.detail : err.detail?.[0]?.msg ?? res.statusText
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const apiGet = <T>(path: string) => api<T>(path, { method: 'GET' })
export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPatch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
export const apiDelete = (path: string) => api<void>(path, { method: 'DELETE' })
