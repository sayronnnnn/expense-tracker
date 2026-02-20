import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyEmail } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/logo.png'
import styles from './Auth.module.css'

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const { setUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token')
      if (!token) {
        setStatus('error')
        setError('No verification token provided')
        return
      }

      try {
        await verifyEmail(token)
        setStatus('success')
        // Wait 2 seconds then redirect to dashboard
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    verifyToken()
  }, [searchParams, navigate])

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={logo} alt="Expense Tracker" className={styles.logo} />
          <h1>
            {status === 'loading' ? 'Verifying...' : 
             status === 'success' ? 'Email Verified!' : 
             'Verification Failed'}
          </h1>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          {status === 'loading' && (
            <div>
              <p>Please wait while we verify your email...</p>
              <div style={{ marginTop: '2rem', fontSize: '2rem' }}>⏳</div>
            </div>
          )}

          {status === 'success' && (
            <div>
              <p>Your email has been verified successfully!</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                Redirecting to dashboard...
              </p>
              <div style={{ marginTop: '2rem', fontSize: '2rem' }}>✓</div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <p style={{ color: 'var(--error)' }}>{error}</p>
              <button 
                onClick={() => navigate('/login')}
                className={styles.submitBtn}
                style={{ marginTop: '2rem' }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
