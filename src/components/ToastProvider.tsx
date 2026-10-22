import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'
import { ToastContext } from './toast-context'

const VISIBLE_MS = 2600

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const notify = useCallback((next: string) => {
    window.clearTimeout(timer.current)
    setMessage(next)
    setVisible(true)
    timer.current = window.setTimeout(() => setVisible(false), VISIBLE_MS)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className={styles.toast} data-visible={visible} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  )
}
