import { ReactNode, useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  FolderOpen,
  RefreshCw,
  LogOut,
  Plus,
  Zap,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logout } from '../api/auth'
import { FloatingAdvisor } from './FloatingAdvisor'
import logo from '../assets/logo.png'
import styles from './Layout.module.css'

type LayoutProps = {
  children?: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme')
    return (stored as 'light' | 'dark') || 'light'
  })
  
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'User'
  const initial = (displayName[0] || 'U').toUpperCase()

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const htmlElement = document.documentElement
    if (theme === 'dark') {
      htmlElement.setAttribute('data-theme', 'dark')
    } else {
      htmlElement.removeAttribute('data-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setShowProfileMenu(false)
    navigate('/login')
  }

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.logo}>
            <img src={logo} alt="Expense Tracker" className={styles.logoImg} />
            <span className={styles.logoText}>Expense Tracker</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <div className={styles.sectionLabel}>MAIN MENU</div>
          <NavLink to="/" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <LayoutDashboard size={20} strokeWidth={2} />
            Dashboard
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <Wallet size={20} strokeWidth={2} />
            Expenses
          </NavLink>
          <NavLink to="/budgets" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <PiggyBank size={20} strokeWidth={2} />
            Budgets
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <FolderOpen size={20} strokeWidth={2} />
            Categories
          </NavLink>
          <NavLink to="/recurring" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <RefreshCw size={20} strokeWidth={2} />
            Recurring
          </NavLink>

          <div className={styles.sectionLabel}>OTHER</div>
          <NavLink to="/analysis" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <Zap size={20} strokeWidth={2} />
            Analysis
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sectionLabel}>ACCOUNT</div>
          <button
            type="button"
            className={styles.userProfileBtn}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userEmail} title={user?.email ?? ''}>{user?.email}</p>
            </div>
          </button>
          {showProfileMenu && (
            <div className={styles.profileMenu}>
              <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
                <LogOut size={16} strokeWidth={2} />
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.headerLeft}>
            <p className={styles.pageTitle}>Dashboard</p>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon size={20} strokeWidth={2} />
              ) : (
                <Sun size={20} strokeWidth={2} />
              )}
            </button>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => navigate('/expenses')}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Expense
            </button>
          </div>
        </header>

        <main className={styles.content}>
          {children || <Outlet />}
        </main>
      </div>

      <FloatingAdvisor />
    </div>
  )
}