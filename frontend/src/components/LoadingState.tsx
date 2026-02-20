import styles from './LoadingState.module.css'

type LoadingStateProps = {
  message?: string
  compact?: boolean
}

export function LoadingState({ message = 'Loading…', compact }: LoadingStateProps) {
  return (
    <div className={compact ? styles.wrapperCompact : styles.wrapper} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden />
      <p className={styles.message}>{message}</p>
    </div>
  )
}
