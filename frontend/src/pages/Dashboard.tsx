import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Download, FileText, TrendingUp, TrendingDown, FolderOpen, Activity } from 'lucide-react'
import { getMonthlyTotal, getCategoryDistribution, getSpendingTrend, getDailyBreakdown } from '../api/analytics'
import { listExpenses } from '../api/expenses'
import { listBudgets } from '../api/budgets'
import { downloadExpensesCsv, downloadSummaryPdf } from '../api/export'
import type { MonthlyTotal, CategoryDistribution, SpendingTrend, Expense, BudgetWithActual, DailyBreakdown } from '../types'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import styles from './Dashboard.module.css'

const now = new Date()
const thisMonth = now.getMonth() + 1
const thisYear = now.getFullYear()

/* Reduced palette: primary and muted for charts (danger reserved for over-budget) */
const CHART_COLORS = ['var(--primary)', 'var(--primary-muted)', 'var(--text-muted)']

function formatDate(s: string): string {
  const d = new Date(s)
  const today = new Date()
  const diffMs = today.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hrs ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString()
}

export function Dashboard() {
  const [monthly, setMonthly] = useState<MonthlyTotal | null>(null)
  const [byCategory, setByCategory] = useState<CategoryDistribution | null>(null)
  const [trend, setTrend] = useState<SpendingTrend | null>(null)
  const [daily, setDaily] = useState<DailyBreakdown | null>(null)
  const [recent, setRecent] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<BudgetWithActual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(thisMonth)
  const [calendarYear, setCalendarYear] = useState(thisYear)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      getMonthlyTotal(thisMonth, thisYear),
      getCategoryDistribution(thisMonth, thisYear),
      getSpendingTrend(6),
      listExpenses({ limit: 8 }),
      listBudgets({ month: thisMonth, year: thisYear, include_actual: true }),
      getDailyBreakdown(calendarMonth, calendarYear),
    ])
      .then(([m, c, t, r, b, d]) => {
        if (!cancelled) {
          setMonthly(m)
          setByCategory(c)
          setTrend(t)
          setRecent(r)
          setBudgets(Array.isArray(b) ? b : [])
          setDaily(d)
        }
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [calendarMonth, calendarYear])

  const refetch = () => {
    setError('')
    setLoading(true)
    Promise.all([
      getMonthlyTotal(thisMonth, thisYear),
      getCategoryDistribution(thisMonth, thisYear),
      getSpendingTrend(6),
      listExpenses({ limit: 8 }),
      listBudgets({ month: thisMonth, year: thisYear, include_actual: true }),
    ])
      .then(([m, c, t, r, b]) => {
        setMonthly(m)
        setByCategory(c)
        setTrend(t)
        setRecent(r)
        setBudgets(Array.isArray(b) ? b : [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const handlePrevMonth = () => {
    let newMonth = calendarMonth - 1
    let newYear = calendarYear
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    setCalendarMonth(newMonth)
    setCalendarYear(newYear)
  }

  const handleNextMonth = () => {
    let newMonth = calendarMonth + 1
    let newYear = calendarYear
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    setCalendarMonth(newMonth)
    setCalendarYear(newYear)
  }

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month - 1, 1).getDay()
  }

  const getDailyData = (): Record<number, { total: string; count: number }> => {
    if (!daily) return {}
    return daily.by_day.reduce((acc, item) => {
      acc[item.day] = { total: item.total, count: item.transaction_count }
      return acc
    }, {} as Record<number, { total: string; count: number }>)
  }

  if (loading) return <div className={styles.page}><LoadingState message="Loading dashboard…" /></div>
  if (error) return <div className={styles.page}><ErrorState message={error} onRetry={refetch} /></div>

  const totalNum = monthly ? Number(monthly.total) : 0
  const maxCategory = byCategory?.by_category.reduce((max, c) => Math.max(max, Number(c.total)), 0) ?? 1

  // Find budget for a category (same month/year)
  const getBudgetForCategory = (categoryId: string): BudgetWithActual | undefined =>
    budgets.find((b) => b.category_id === categoryId)

  // Get category name from byCategory data
  const getCategoryName = (categoryId: string): string => {
    return byCategory?.by_category.find((c) => c.category_id === categoryId)?.category_name ?? 'Unknown'
  }

  // Calculate quick stats
  const avgPerDay = totalNum > 0 && thisMonth ? (totalNum / new Date(thisYear, thisMonth, 0).getDate()).toFixed(2) : '0'
  const categoriesCount = byCategory?.by_category.length ?? 0
  const expensesCount = recent.length
  const lastMonthTotal = trend?.points[trend.points.length - 2] ? Number(trend.points[trend.points.length - 2].total) : 0
  const trendChange = lastMonthTotal > 0 ? (((totalNum - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1) : '0'
  const trendDirection = Number(trendChange) >= 0 ? 'up' : 'down'

  return (
    <div className={styles.page}>
      <p className={styles.sectionTitle}>Dashboard</p>

      {/* Quick stats cards */}
      <div className={styles.quickStatsGrid}>
        <div className={styles.quickStatCard}>
          <div className={styles.quickStatIcon} style={{ background: 'rgba(108, 179, 73, 0.1)', color: 'var(--primary)' }}>
            <span className={styles.phpSymbol}>₱</span>
          </div>
          <div className={styles.quickStatContent}>
            <p className={styles.quickStatLabel}>Total Expenses</p>
            <p className={styles.quickStatValue}>
              {monthly?.currency ?? 'PHP'} {monthly?.total ?? '0'}
            </p>
            <div className={styles.quickStatTrend}>
              {trendDirection === 'up' ? (
                <TrendingUp size={14} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={14} strokeWidth={2.5} />
              )}
              <span className={trendDirection === 'up' ? styles.trendUp : styles.trendDown}>
                {Math.abs(Number(trendChange))}%
              </span>
              <span className={styles.trendLabel}>vs last month</span>
            </div>
          </div>
        </div>

        <div className={styles.quickStatCard}>
          <div className={styles.quickStatIcon} style={{ background: 'rgba(244, 214, 109, 0.15)', color: 'var(--success)' }}>
            <Activity size={24} strokeWidth={2} />
          </div>
          <div className={styles.quickStatContent}>
            <p className={styles.quickStatLabel}>Avg per Day</p>
            <p className={styles.quickStatValue}>
              {monthly?.currency ?? 'PHP'} {avgPerDay}
            </p>
            <p className={styles.quickStatSubtext}>This month average</p>
          </div>
        </div>

        <div className={styles.quickStatCard}>
          <div className={styles.quickStatIcon} style={{ background: 'rgba(249, 168, 37, 0.1)', color: 'var(--pending)' }}>
            <FolderOpen size={24} strokeWidth={2} />
          </div>
          <div className={styles.quickStatContent}>
            <p className={styles.quickStatLabel}>Categories</p>
            <p className={styles.quickStatValue}>{categoriesCount}</p>
            <p className={styles.quickStatSubtext}>Active categories</p>
          </div>
        </div>

        <div className={styles.quickStatCard}>
          <div className={styles.quickStatIcon} style={{ background: 'rgba(108, 179, 73, 0.1)', color: 'var(--primary)' }}>
            <Wallet size={24} strokeWidth={2} />
          </div>
          <div className={styles.quickStatContent}>
            <p className={styles.quickStatLabel}>Transactions</p>
            <p className={styles.quickStatValue}>{expensesCount}</p>
            <p className={styles.quickStatSubtext}>Recent expenses</p>
          </div>
        </div>
      </div>

      {/* Main grid: calendar + transactions */}
      <div className={styles.mainGrid}>
        {/* Calendar — left side, larger */}
        <section className={styles.card}>
          <div className={styles.calendarContainer}>
            {daily ? (
              <>
                <div className={styles.calendarNav}>
                  <button 
                    type="button"
                    className={styles.calendarNavButton} 
                    onClick={handlePrevMonth}
                  >
                    ← Previous
                  </button>
                  <h2 className={styles.calendarMonthYear}>
                    {new Date(calendarYear, calendarMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <button 
                    type="button"
                    className={styles.calendarNavButton} 
                    onClick={handleNextMonth}
                  >
                    Next →
                  </button>
                  
                  {/* Export buttons in calendar header */}
                  <div className={styles.exportButtons}>
                    <button
                      type="button"
                      className={styles.exportBtnSecondary}
                      disabled={!!exporting}
                      onClick={() => {
                        setExporting('csv')
                        downloadExpensesCsv({ month: thisMonth, year: thisYear })
                          .catch((e) => setError(e instanceof Error ? e.message : 'Export failed'))
                          .finally(() => setExporting(null))
                      }}
                      title="Download expenses as CSV"
                    >
                      <Download size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      CSV
                    </button>
                    <button
                      type="button"
                      className={styles.exportBtnSecondary}
                      disabled={!!exporting}
                      onClick={() => {
                        setExporting('pdf')
                        downloadSummaryPdf(thisMonth, thisYear)
                          .catch((e) => setError(e instanceof Error ? e.message : 'Export failed'))
                          .finally(() => setExporting(null))
                      }}
                      title="Download summary as PDF"
                    >
                      <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      PDF
                    </button>
                  </div>
                </div>

                <div className={styles.calendarGrid}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className={styles.calendarDayHeader}>
                      {day}
                    </div>
                  ))}

                  {(() => {
                    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear)
                    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear)
                    const dailyData = getDailyData()
                    const days: (number | null)[] = []

                    // Add empty cells for days before month starts
                    for (let i = 0; i < firstDay; i++) {
                      days.push(null)
                    }

                    // Add all days of month
                    for (let d = 1; d <= daysInMonth; d++) {
                      days.push(d)
                    }

                    return days.map((day, index) => {
                      if (day === null) {
                        return (
                          <div key={`empty-${index}`} className={`${styles.calendarDay} ${styles.otherMonth}`} />
                        )
                      }

                      const data = dailyData[day]
                      const hasSpending = !!data

                      return (
                        <div
                          key={day}
                          className={`${styles.calendarDay} ${hasSpending ? styles.hasSpending : ''}`}
                          title={hasSpending ? `${data.count} transaction${data.count > 1 ? 's' : ''}` : ''}
                        >
                          <div className={styles.calendarDayNumber}>{day}</div>
                          {hasSpending && (
                            <>
                              <div className={styles.calendarDayAmount}>{daily.currency} {data.total}</div>
                              <div className={styles.calendarDayTransactionCount}>
                                {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>

                {daily.by_day.length === 0 && (
                  <div className={styles.calendarEmpty}>No spending data for this month.</div>
                )}
              </>
            ) : (
              <div className={styles.calendarEmpty}>Loading calendar...</div>
            )}
          </div>
        </section>

        {/* Recent transactions — right side, smaller */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Transactions history</h2>
            {recent.length > 5 && (
              <Link to="/expenses" className={styles.seeAll}>
                See all
              </Link>
            )}
          </div>
          <ul className={styles.transactionList}>
            {recent.length === 0 ? (
              <li className={styles.transactionEmpty}>No recent transactions.</li>
            ) : (
              recent.slice(0, 5).map((tx) => (
                <li key={tx.id} className={styles.transactionItem}>
                  <div className={styles.transactionDot} />
                  <div className={styles.transactionContent}>
                    <p className={styles.transactionCategory}>{getCategoryName(tx.category_id)}</p>
                    {tx.note && <p className={styles.transactionNote}>{tx.note}</p>}
                    <p className={styles.transactionTime}>{formatDate(tx.date)}</p>
                  </div>
                  <p className={`${styles.transactionAmount} amount`}>
                    -{tx.currency} {tx.amount}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* Spending Statistics Below */}
      {byCategory && byCategory.by_category && byCategory.by_category.length > 0 ? (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Spending statistics</h2>
            {byCategory.by_category.length > 6 && (
              <Link to="/expenses" className={styles.seeAll}>
                See all
              </Link>
            )}
          </div>
          <div className={styles.statsGrid}>
            {byCategory.by_category.slice(0, 6).map((item, i) => {
              const budget = getBudgetForCategory(item.category_id)
              const spent = Number(item.total)
              const pct = budget
                ? (spent / Number(budget.amount)) * 100
                : maxCategory > 0
                  ? (spent / maxCategory) * 100
                  : 0
              const exceeded = budget && spent >= Number(budget.amount)
              const barPct = Math.min(pct, 100)
              const barColor = exceeded ? 'var(--danger)' : CHART_COLORS[i % CHART_COLORS.length]
              return (
                <div
                  key={item.category_id}
                  className={exceeded ? `${styles.statCard} ${styles.statCardOverBudget}` : styles.statCard}
                >
                  <p className={styles.statCardLabel}>{item.category_name}</p>
                  <p className={`${styles.statCardAmount} amount-primary`}>
                    {item.currency} {item.total}
                    {budget && (
                      <span className={exceeded ? styles.statCardExceeded : styles.statCardOfBudget}>
                        {' '} / {budget.amount} budget
                      </span>
                    )}
                  </p>
                  <div className={styles.statCardBar}>
                    <div
                      className={styles.statCardBarFill}
                      style={{ width: `${barPct}%`, background: barColor }}
                    />
                  </div>
                  {exceeded && <span className={`tag tagDanger ${styles.statCardExceededTag}`}>Over budget</span>}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
