import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { listRecurringRules, createRecurringRule, deleteRecurringRule } from '../api/recurring'
import { listCategories } from '../api/categories'
import type { RecurringRule, Category } from '../types'
import { LoadingState } from '../components/LoadingState'
import { EmptyState } from '../components/EmptyState'
import styles from './Recurring.module.css'

export function Recurring() {
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    category_id: '',
    amount: '',
    note: '',
    frequency: 'monthly' as string,
    start_date: '',
  })

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([listRecurringRules(), listCategories()])
      .then(([r, c]) => {
        setRules(r)
        setCategories(c)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm({
      category_id: '',
      amount: '',
      note: '',
      frequency: 'monthly',
      start_date: '',
    })
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category_id || !form.amount || Number(form.amount) <= 0) return
    createRecurringRule({
      category_id: form.category_id,
      amount: form.amount,
      note: form.note.trim() || undefined,
      frequency: form.frequency,
      start_date: form.start_date || undefined,
    })
      .then(() => {
        setShowForm(false)
        resetForm()
        load()
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Create failed'))
  }

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id

  const handleDelete = (id: string) => {
    if (!confirm('Remove this recurring rule?')) return
    deleteRecurringRule(id).then(load).catch((err) => setError(err instanceof Error ? err.message : 'Delete failed'))
  }

  return (
    <div className={styles.page}>
      <p className={styles.sectionTitle}>Recurring Rules</p>

      {/* Header with hint and add button */}
      <div className={styles.headerBar}>
        <p className={styles.hint}>Expenses are created automatically by a background job.</p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className={styles.addButton}
        >
          <Plus size={18} />
          Add rule
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span>{error}</span>
          <button type="button" onClick={load} className={styles.retryButton}>
            Try again
          </button>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New recurring rule</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className={styles.formInput}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className={styles.formInput}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Frequency *</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                    className={styles.formInput}
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Date <span className={styles.optional}>(optional)</span></label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Note <span className={styles.optional}>(optional)</span></label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    className={styles.formInput}
                    placeholder="e.g., Rent payment, Gym membership"
                  />
                </div>
              </div>

              <div className={styles.formFooter}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className={styles.card}>
          <LoadingState message="Loading recurring rules…" compact />
        </div>
      ) : rules.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            message="No recurring rules."
            action={
              <button type="button" onClick={handleOpenCreate} className={styles.emptyAction}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Add rule
              </button>
            }
          />
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.listHeader}>
            <span className={styles.headerCategory}>Category</span>
            <span className={styles.headerAmount}>Amount</span>
            <span className={styles.headerFrequency}>Frequency</span>
            <span className={styles.headerNextRun}>Next Run</span>
            <span className={styles.headerAction}></span>
          </div>
          <ul className={styles.list}>
            {rules.map((r) => (
              <li key={r.id} className={styles.row}>
                <span className={styles.rowCategory}>{categoryName(r.category_id)}</span>
                <span className={styles.rowAmount}>PHP {Number(r.amount).toFixed(2)}</span>
                <span className={styles.rowFrequency}>{r.frequency}</span>
                <span className={styles.rowNextRun}>{r.next_run_at.slice(0, 10)}</span>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className={styles.deleteButton}
                    title="Remove recurring rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
