import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

type EmptyStateProps = {
  message: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ message, action, icon }: EmptyStateProps) {
  return (
    <div className={styles.wrapper} role="status">
      {icon && <div className={styles.icon}>{icon}</div>}
      <p className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
