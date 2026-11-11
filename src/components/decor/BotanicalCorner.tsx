import type { CSSProperties } from 'react'
import { useVisibleMotion } from '../../motion/useVisibleMotion'
import styles from './BotanicalCorner.module.css'

export type BotanicalCornerName = 'top-left' | 'bottom-right'
export type BotanicalVariant = 'cover' | 'section' | 'compact' | 'photo'

/** A transparent watercolor branch; artwork never participates in content layout. */
export function BotanicalCorner({ corner, variant = 'section', index = 0 }: {
  corner: BotanicalCornerName; variant?: BotanicalVariant; index?: number
}) {
  const { ref, active } = useVisibleMotion<HTMLSpanElement>()
  const base = `${import.meta.env.BASE_URL}images/decor/botanical-corner`
  return <span ref={ref} className={styles.corner} data-corner={corner} data-variant={variant}
    data-anim="drape" data-ambient-active={active} aria-hidden="true"
    style={{ '--botanical-delay': `${-index * 3}s` } as CSSProperties}>
    <span className={styles.sway}>
      <img src={`${base}.webp`} srcSet={`${base}-320.webp 320w, ${base}.webp 640w, ${base}-960.webp 960w`}
        sizes={variant === 'cover' ? '(min-width: 1024px) 240px, 34vw' : variant === 'photo' ? '72px' : '120px'}
        width="640" height="747" alt="" loading="lazy" decoding="async" />
    </span>
  </span>
}
