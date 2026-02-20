import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../contexts/AuthContext'
import { googleLogin, getMe } from '../api/auth'
import logo from '../assets/logo.png'
import styles from './Auth.module.css'

export function Login() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('')
    setLoading(true)
    try {
      await googleLogin(credentialResponse.credential)
      const user = await getMe()
      setUser(user)
      navigate(from, { replace: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed'
      console.error('Google login error:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error('Google login button error - try again')
    setError('Google sign-in is initializing. Please try again in a moment.')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={logo} alt="Expense Tracker" className={styles.logo} />
          <h1>Welcome Back</h1>
          <p className={styles.subtitle}>Track your expenses smarter</p>
        </div>
        
        {error && <p className={styles.error}>{error}</p>}
        
        <div className={styles.googleContainer}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>
      </div>
    </div>
  )
}
