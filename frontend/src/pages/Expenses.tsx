import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Edit2, Filter, ChevronDown } from 'lucide-react'
import { listExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses'
import { listCategories } from '../api/categories'
import type { Expense, ExpenseCreate, Category } from '../types'
import { LoadingState } from '../components/LoadingState'
import { EmptyState } from '../components/EmptyState'
import styles from './Expenses.module.css'

const now = new Date()
const defaultMonth = now.getMonth() + 1
const defaultYear = now.getFullYear()

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')
  const [filterMinAmount, setFilterMinAmount] = useState<string>('')
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>('')
  const [form, setForm] = useState<ExpenseCreate>({
    category_id: '',
    amount: '',
    currency: 'PHP',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([
      listExpenses({ month, year }),
      listCategories(),
    ])
      .then(([ex, cat]) => {
        setExpenses(ex)
        setCategories(cat)
        if (cat.length && !form.category_id) setForm((f) => ({ ...f, category_id: cat[0].id }))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [month, year])

  const resetForm = () => {
    setForm({
      category_id: categories[0]?.id || '',
      amount: '',
      currency: 'PHP',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    })
    setEditingId(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const handleOpenEdit = (expense: Expense) => {
    setForm({
      category_id: expense.category_id,
      amount: String(expense.amount),
      currency: expense.currency,
      date: expense.date,
      note: expense.note || '',
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category_id || !form.amount || !form.date) return

    const action = editingId
      ? updateExpense(editingId, form)
      : createExpense(form)

    action
      .then(() => {
        setShowForm(false)
        resetForm()
        load()
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Operation failed'))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this expense?')) return
    deleteExpense(id).then(load).catch((err) => setError(err instanceof Error ? err.message : 'Delete failed'))
  }

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Filter expenses based on criteria
  const filteredExpenses = expenses.filter((expense) => {
    // Category filter
    if (filterCategory && expense.category_id !== filterCategory) return false

    // Date range filter
    if (filterStartDate && expense.date < filterStartDate) return false
    if (filterEndDate && expense.date > filterEndDate) return false

    // Amount range filter
    const amount = Number(expense.amount)
    if (filterMinAmount && amount < Number(filterMinAmount)) return false
    if (filterMaxAmount && amount > Number(filterMaxAmount)) return false

    return true
  })

  return (
    <div className={styles.page}>
      <p className={styles.sectionTitle}>Expenses</p>

      {/* Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerTitle}>
          <button
            type="button"
            className={styles.filterToggle}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <Filter size={20} strokeWidth={2} />
            <ChevronDown size={18} style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          <div className={styles.monthYearDisplay}>
            {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className={styles.addButton}
        >
          <Plus size={18} />
          Add expense
        </button>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
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
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Category</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={styles.filterSelect}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Min Amount</label>
              <input
                type="number"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Max Amount</label>
              <input
                type="number"
                value={filterMaxAmount}
                onChange={(e) => setFilterMaxAmount(e.target.value)}
                placeholder="999999"
                min="0"
                step="0.01"
                className={styles.filterInput}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setFilterCategory('')
                setFilterStartDate('')
                setFilterEndDate('')
                setFilterMinAmount('')
                setFilterMaxAmount('')
              }}
              className={styles.clearFiltersBtn}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

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
              <h2 className={styles.modalTitle}>{editingId ? 'Edit expense' : 'New expense'}</h2>
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
                  <label className={styles.formLabel}>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount *</label>
                  <div className={styles.amountGroup}>
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
                    <select
                      value={form.currency}
                      onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                      className={styles.currencySelect}
                    >
                      <option>PHP</option>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Note <span className={styles.optional}>(optional)</span></label>
                  <input
                    type="text"
                    value={form.note ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value || undefined }))}
                    className={styles.formInput}
                    placeholder="Add a note..."
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
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {loading ? (
        <div className={styles.card}>
          <LoadingState message="Loading expenses…" compact />
        </div>
      ) : expenses.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            message="No expenses this month."
            action={
              <button type="button" onClick={handleOpenCreate} className={styles.emptyAction}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Add expense
              </button>
            }
          />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            message="No expenses match the current filters."
          />
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.listHeader}>
            <span className={styles.headerDate}>Date</span>
            <span className={styles.headerCategory}>Category</span>
            <span className={styles.headerNote}>Note</span>
            <span className={styles.headerAmount}>Amount</span>
            <span className={styles.headerAction}>Actions</span>
          </div>
          <ul className={styles.list}>
            {filteredExpenses.map((ex) => (
              <li key={ex.id} className={styles.row}>
                <span className={styles.rowDate}>{formatDate(ex.date)}</span>
                <span className={styles.rowCategory}>
                  <span className={styles.categoryBadge}>{categoryName(ex.category_id)}</span>
                </span>
                <span className={styles.rowNote}>{ex.note || '—'}</span>
                <span className={`${styles.rowAmount} amount`}>
                  {ex.currency} {Number(ex.amount).toFixed(2)}
                </span>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(ex)}
                    className={styles.editButton}
                    title="Edit expense"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ex.id)}
                    className={styles.deleteButton}
                    title="Delete expense"
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
