import type { ReactNode } from 'react'
import styles from './SectionTitle.module.css'

/** Classic serif invitation heading, with a quiet botanical wedding flourish. */
export function SectionTitle({ id, children, anim = 'title' }: { id: string; children: ReactNode; anim?: string }) {
  return <h2 id={id} className={styles.title} data-section-title data-anim={anim}>
    {children}
    <svg className={styles.flourish} viewBox="0 0 112 20" fill="none" aria-hidden="true" focusable="false" data-title-ornament>
      <g stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M43 11C31 16 20 12 8 11M69 11C81 16 92 12 104 11" />
        <path d="M32 13C28 12 26 9 26 6C30 6 33 9 32 13ZM22 12C18 16 14 16 12 14C15 11 19 10 22 12ZM80 13C84 12 86 9 86 6C82 6 79 9 80 13ZM90 12C94 16 98 16 100 14C97 11 93 10 90 12Z" />
        <ellipse cx="52.5" cy="10" rx="5.5" ry="7" transform="rotate(-22 52.5 10)" />
        <ellipse cx="59.5" cy="10" rx="5.5" ry="7" transform="rotate(22 59.5 10)" />
      </g>
    </svg>
  </h2>
}
