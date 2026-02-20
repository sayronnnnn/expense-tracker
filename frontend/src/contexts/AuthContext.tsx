import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { User } from '../types'
import { getAccessToken, getRefreshToken } from '../api/client'
import { getMe } from '../api/auth'

interface AuthState {
  user: User | null
  loading: boolean
  checked: boolean
}

const AuthContext = createContext<{
  user: User | null
  loading: boolean
  checked: boolean
  setUser: (u: User | null) => void
  refreshUser: () => Promise<void>
} | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, checked: false })

  const refreshUser = useCallback(async () => {
    const access = getAccessToken()
    const refresh = getRefreshToken()
    if (!access && !refresh) {
      setState({ user: null, loading: false, checked: true })
      return
    }
    try {
      const user = await getMe()
      setState({ user, loading: false, checked: true })
    } catch {
      setState({ user: null, loading: false, checked: true })
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const setUser = useCallback((user: User | null) => {
    setState((s) => ({ ...s, user }))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        checked: state.checked,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
