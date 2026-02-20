import type { User, TokenResponse } from '../types'
import { apiGet, apiPost, setTokens, clearTokens } from './client'

export async function googleLogin(googleToken: string): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/auth/google', { token: googleToken })
  setTokens(data.access_token, data.refresh_token)
  return data
}

export async function logout(): Promise<void> {
  clearTokens()
}

export async function getMe(): Promise<User> {
  return apiGet<User>('/auth/me')
}
