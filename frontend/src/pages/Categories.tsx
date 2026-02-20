import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { listCategories, createCategory } from '../api/categories'
import type { Category } from '../types'
import { LoadingState } from '../components/LoadingState'
import { EmptyState } from '../components/EmptyState'
import styles from './Categories.module.css'

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '' })

  const load = () => {
    setLoading(true)
    setError('')
    listCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm({ name: '' })
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    createCategory(form.name.trim())
      .then(() => {
        setShowForm(false)
        resetForm()
        load()
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Create failed'))
  }

  return (
    <div className={styles.page}>
      <p className={styles.sectionTitle}>Categories</p>

      {/* Header with action button */}
      <div className={styles.headerBar}>
        <p className={styles.hint}>Manage your expense categories</p>
        <button
          type="button"
          onClick={handleOpenCreate}
          className={styles.addButton}
        >
          <Plus size={18} />
          Add category
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
              <h2 className={styles.modalTitle}>New category</h2>
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
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Category name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ name: e.target.value })}
                    className={styles.formInput}
                    placeholder="e.g. Groceries, Transport"
                    required
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

      {/* Categories List */}
      {loading ? (
        <div className={styles.card}>
          <LoadingState message="Loading categories…" compact />
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            message="No categories yet."
            action={
              <button type="button" onClick={handleOpenCreate} className={styles.emptyAction}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Add category
              </button>
            }
          />
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.listHeader}>
            <span className={styles.headerCategory}>Name</span>
            <span className={styles.headerSlug}>Slug</span>
            <span className={styles.headerType}>Type</span>
          </div>
          <ul className={styles.list}>
            {categories.map((c) => (
              <li key={c.id} className={styles.row}>
                <span className={styles.rowCategory}>{c.name}</span>
                <span className={styles.rowSlug}>{c.slug}</span>
                <span className={styles.rowType}>
                  <span className={c.type === 'system' ? styles.typeBadge : styles.typeCustom}>
                    {c.type}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
