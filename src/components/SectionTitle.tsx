import type { ReactNode } from 'react'
import styles from './SectionTitle.module.css'

/** One clear, immediately readable heading for each invitation section. */
export function SectionTitle({ id, children, anim = 'title' }: { id: string; children: ReactNode; anim?: string }) {
  return <h2 id={id} className={styles.title} data-section-title data-anim={anim}>{children}</h2>
}
