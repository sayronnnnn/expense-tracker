import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../contexts/AuthContext'
import { login, googleLogin, getMe } from '../api/auth'
import styles from './Auth.module.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const user = await getMe()
      setUser(user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setError('')
      setLoading(true)
      try {
        await googleLogin(credentialResponse.access_token)
        const user = await getMe()
        setUser(user)
        navigate(from, { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google login failed')
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError('Google login failed')
    },
  })

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Log in</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <p style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>Or continue with</p>
          <button
            type="button"
            onClick={() => googleLoginHandler()}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'var(--primary-color)'
              ;(e.target as HTMLButtonElement).style.color = 'white'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'var(--bg-secondary)'
              ;(e.target as HTMLButtonElement).style.color = 'var(--text-primary)'
            }}
          >
            Google
          </button>
        </div>
        <p className={styles.footer}>
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
