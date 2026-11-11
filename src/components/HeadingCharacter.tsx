import type { ReactNode } from 'react'
import styles from './HeadingCharacter.module.css'

/** Shared corner placement and character scale for section headings. */
export function HeadingCharacter({ children }: { children: ReactNode }) {
  return <span className={styles.character} data-heading-character aria-hidden="true">{children}</span>
}
