import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { listBudgets, createBudget, updateBudget, deleteBudget } from '../api/budgets'
import { listCategories } from '../api/categories'
import type { BudgetWithActual, Category } from '../types'
import { LoadingState } from '../components/LoadingState'
import { EmptyState } from '../components/EmptyState'
import styles from './Budgets.module.css'

const now = new Date()
const defaultMonth = now.getMonth() + 1
const defaultYear = now.getFullYear()

export function Budgets() {
  const [budgets, setBudgets] = useState<BudgetWithActual[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    month: defaultMonth,
    year: defaultYear,
    amount: '',
    category_id: '' as string | null,
  })

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([listBudgets({ include_actual: true, month, year }), listCategories()])
      .then(([b, c]) => {
        setBudgets(b)
        setCategories(c)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [month, year])

  const resetForm = () => {
    setForm({
      month: defaultMonth,
      year: defaultYear,
      amount: '',
      category_id: '',
    })
  }

  const handleOpenCreate = () => {
    resetForm()
    setEditingId(null)
    setShowForm(true)
  }

  const handleOpenEdit = (budget: BudgetWithActual) => {
    setForm({
      month: budget.month,
      year: budget.year,
      amount: String(budget.amount),
      category_id: budget.category_id || null,
    })
    setEditingId(budget.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return
    
    if (editingId) {
      updateBudget(editingId, {
        month: form.month,
        year: form.year,
        amount: form.amount,
        category_id: form.category_id || null,
      })
        .then(() => {
          setShowForm(false)
          setEditingId(null)
          resetForm()
          load()
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Update failed'))
    } else {
      createBudget({
        month: form.month,
        year: form.year,
        amount: form.amount,
        category_id: form.category_id || null,
      })
        .then(() => {
          setShowForm(false)
          resetForm()
          load()
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Create failed'))
    }
  }

  const categoryName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name ?? 'Category' : 'Total'

  const handleDelete = (id: string) => {
    if (!confirm('Remove this budget?')) return
    deleteBudget(id).then(load).catch((err) => setError(err instanceof Error ? err.message : 'Delete failed'))
  }

  return (
    <div className={styles.page}>
      <p className={styles.sectionTitle}>Budgets</p>

      {/* Header with filters and add button */}
      <div className={styles.headerBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={styles.filterSelect}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                const monthName = new Date(year, m - 1).toLocaleDateString('en-US', { month: 'long' })
                return <option key={m} value={m}>{monthName}</option>
              })}
            </select>
          </div>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={2100}
              className={styles.filterInput}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className={styles.addButton}
        >
          <Plus size={18} />
          Add budget
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
              <h2 className={styles.modalTitle}>{editingId ? 'Edit budget' : 'New budget'}</h2>
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
                  <label className={styles.formLabel}>Month *</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                    className={styles.formInput}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                      const monthName = new Date(year, m - 1).toLocaleDateString('en-US', { month: 'long' })
                      return <option key={m} value={m}>{monthName}</option>
                    })}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Year *</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    className={styles.formInput}
                    min={2000}
                    max={2100}
                  />
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

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Category <span className={styles.optional}>(optional)</span></label>
                  <select
                    value={form.category_id ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value || null }))}
                    className={styles.formInput}
                  >
                    <option value="">Total (no category)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budgets List */}
      {loading ? (
        <div className={styles.card}>
          <LoadingState message="Loading budgets…" compact />
        </div>
      ) : budgets.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            message="No budgets set."
            action={
              <button type="button" onClick={handleOpenCreate} className={styles.emptyAction}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Add budget
              </button>
            }
          />
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.listHeader}>
            <span className={styles.headerCategory}>Category</span>
            <span className={styles.headerAmount}>Budget</span>
            <span className={styles.headerStatus}>Status</span>
            <span className={styles.headerAction}></span>
          </div>
          <ul className={styles.list}>
            {budgets.map((b) => {
              const percentage = (Number(b.actual_spent) / Number(b.amount)) * 100
              const isExceeded = b.exceeded
              return (
                <li key={b.id} className={styles.row}>
                  <span className={styles.rowCategory}>{categoryName(b.category_id)}</span>
                  <span className={styles.rowAmount}>{b.currency} {Number(b.amount).toFixed(2)}</span>
                  <span className={`${styles.rowStatus} ${isExceeded ? styles.statusExceeded : styles.statusOk}`}>
                    {isExceeded ? 'Over' : 'OK'} ({Math.min(percentage, 100).toFixed(0)}%)
                  </span>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className={styles.editButton}
                      title="Edit budget"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className={styles.deleteButton}
                      title="Remove budget"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
