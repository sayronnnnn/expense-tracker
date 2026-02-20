import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { getBehaviorAnalysis, type BehaviorAnalysis } from '@/api/analytics'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import styles from './Analysis.module.css'

export default function Analysis() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [analysis, setAnalysis] = useState<BehaviorAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalysis()
  }, [month, year])

  async function loadAnalysis() {
    try {
      setLoading(true)
      setError('')
      const data = await getBehaviorAnalysis(month, year)
      setAnalysis(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load analysis'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const getTopCategory = () => {
    if (analysis?.lifestyle_profile?.top_categories?.length) {
      return analysis.lifestyle_profile.top_categories[0]
    }
    return null
  }

  const getTotalSpending = () => {
    if (analysis?.lifestyle_profile?.top_categories?.length) {
      return analysis.lifestyle_profile.top_categories.reduce((sum: number, cat: any) => sum + cat.amount, 0)
    }
    return 0
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!analysis) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.emptyMessage}>
            No expense data available for this period. Add some expenses to see analysis!
          </p>
        </div>
      </div>
    )
  }

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })
  const dateRange = `${monthName} ${year}`
  const totalSpending = getTotalSpending()
  const topCategory = getTopCategory()

  return (
      <div className={styles.container}>
        {/* Header with Title and Controls */}
        <div className={styles.pageHeader}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Spending Behavior Analysis</h1>
            <p className={styles.pageSubtitle}>AI-powered insights into your financial patterns</p>
          </div>
          
          {/* Controls */}
          <div className={styles.controls}>
            <button onClick={handlePrevMonth} className={styles.controlBtn}>← Prev</button>
            <span className={styles.monthLabel}>{dateRange}</span>
            <button onClick={handleNextMonth} className={styles.controlBtn}>Next →</button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Spending</div>
            <div className={styles.metricValue}>₱{totalSpending.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            {topCategory && <div className={styles.metricSubtext}>{topCategory.category_name}</div>}
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Categories</div>
            <div className={styles.metricValue}>{analysis.lifestyle_profile.top_categories.length}</div>
            <div className={styles.metricSubtext}>Tracked</div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Spending Spikes</div>
            <div className={styles.metricValue}>{analysis.spending_spikes.length}</div>
            <div className={styles.metricSubtext}>Detected</div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Trends</div>
            <div className={styles.metricValue}>{analysis.trends.length}</div>
            <div className={styles.metricSubtext}>Active</div>
          </div>
        </div>

        {/* Summary Section */}
        <div className={styles.summarySection}>
          <div className={styles.summaryContent}>
            <h2>Financial Summary</h2>
            <p className={styles.summaryText}>{analysis.summary}</p>
          </div>
        </div>

        {/* Lifestyle Profile Section */}
        <div className={styles.sectionGrid}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <BarChart3 className={styles.sectionIcon} />
              <h2>Lifestyle Profile</h2>
            </div>
            
            <div className={styles.profileTypeContainer}>
              <div className={styles.profileBadge}>
                {analysis.lifestyle_profile.profile_type.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            
            <p className={styles.profileInsight}>{analysis.lifestyle_profile.insights}</p>

            <div className={styles.categoryBreakdown}>
              <h3>Top Spending Categories</h3>
              <div className={styles.categoryItems}>
                {analysis.lifestyle_profile.top_categories.map((cat: any, idx: number) => (
                  <div key={idx} className={styles.categoryItem}>
                    <div className={styles.categoryBar}>
                      <div className={styles.categoryBarLabel}>
                        <span className={styles.categoryName}>{cat.category_name}</span>
                        <span className={styles.categoryPercent}>{cat.percentage.toFixed(0)}%</span>
                      </div>
                      <div className={styles.barBackground}>
                        <div 
                          className={styles.barFill}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <span className={styles.categoryAmount}>₱{cat.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Spending Spikes and Trends Grid */}
        <div className={styles.sectionGrid}>
          {/* Spending Spikes */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <AlertTriangle className={styles.sectionIcon} />
              <h2>Spending Spikes</h2>
            </div>
            
            {analysis.spending_spikes.length > 0 ? (
              <div className={styles.spikesContainer}>
                {analysis.spending_spikes.map((spike: any, idx: number) => (
                  <div key={idx} className={styles.spikeItem}>
                    <div className={styles.spikeHeader}>
                      <div>
                        <h4>{spike.category_name}</h4>
                        <span className={styles.spikeDate}>{new Date(spike.date).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.spikeAmount}>₱{spike.amount.toFixed(2)}</div>
                    </div>
                    <div className={styles.spikeStats}>
                      <span className={styles.statItem}>Avg: ₱{spike.average_amount.toFixed(2)}</span>
                      <span className={styles.statItem + ' ' + styles.increase}>+{spike.percentage_increase.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>No unusual spending spikes detected. Your spending is within normal patterns! 🎉</p>
            )}
          </div>

          {/* Trends */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <TrendingUp className={styles.sectionIcon} />
              <h2>Spending Trends</h2>
            </div>
            
            {analysis.trends.length > 0 ? (
              <div className={styles.trendsContainer}>
                {analysis.trends.map((trend: any, idx: number) => (
                  <div key={idx} className={styles.trendItem}>
                    <div className={styles.trendInfo}>
                      <h4>{trend.category_name}</h4>
                      <p className={styles.trendInsight}>{trend.insight}</p>
                    </div>
                    <div className={styles.trendDirection}>
                      {trend.direction === 'increasing' ? (
                        <div className={styles.directionBadge + ' ' + styles.increasing}>
                          <TrendingUp size={16} />
                          {trend.trend_percentage.toFixed(0)}%
                        </div>
                      ) : (
                        <div className={styles.directionBadge + ' ' + styles.decreasing}>
                          <TrendingDown size={16} />
                          {Math.abs(trend.trend_percentage).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>Your spending patterns are stable across categories.</p>
            )}
          </div>
        </div>
      </div>
  )
}