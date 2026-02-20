import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './index.css'

// Apply saved theme preference before rendering
const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark')
}

const googleClientId = '615291196872-hp4m90oghjamp6ogp8624ippebnpcggj.apps.googleusercontent.com'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId} onScriptFailure={() => console.error('Failed to load Google OAuth script')}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)