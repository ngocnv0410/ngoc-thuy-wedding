import styles from './BabysBreath.module.css'
import type { Corner, Tone, Variant } from './bouquet'

export type { Corner, Variant }

interface BabysBreathProps {
  corner: Corner
  variant?: Variant
  seed?: number
  tone?: Tone
  className?: string
}

/** Photographic dried baby's breath, positioned as corner cutouts behind the invitation. */
export function BabysBreath({ corner, variant = 'spray', tone = 'light', className }: BabysBreathProps) {
  const src = `${import.meta.env.BASE_URL}images/decor/baby-${variant}`
  return (
    <picture
      className={[styles.bouquet, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      data-corner={corner}
      data-variant={variant}
      data-tone={tone}
      data-anim="bouquet"
    >
      <img className={styles.photo} src={`${src}.webp`}
        srcSet={`${src}-384.webp 384w, ${src}.webp 768w`}
        sizes={variant === 'sprig' ? '(min-width: 1024px) 180px, 23vw' : '(min-width: 1024px) 380px, 44vw'}
        alt="" loading="lazy" decoding="async" width={768} height={variant === 'sprig' ? 1536 : 1024} />
    </picture>
  )
}
