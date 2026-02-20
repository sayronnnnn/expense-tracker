import { Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../contexts/AuthContext'
import { googleLogin, getMe } from '../api/auth'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import styles from './Auth.module.css'

export function Register() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await googleLogin(credentialResponse.credential)
      const user = await getMe()
      setUser(user)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Google login error:', err)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={logo} alt="Expense Tracker" className={styles.logo} />
          <h1>Create Account</h1>
          <p className={styles.subtitle}>Join us to start tracking expenses</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Sign up with Google to get started:
          </p>
          
          <div className={styles.googleContainer}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error('Google login failed')}
            />
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
