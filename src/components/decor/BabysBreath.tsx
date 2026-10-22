import { useId, useMemo } from 'react'
import styles from './BabysBreath.module.css'
import { type Corner, type Layer, SHAPE, type Variant, bouquet, flip } from './bouquet.ts'

export type { Corner, Variant }

interface BabysBreathProps {
  corner: Corner
  variant?: Variant
  seed?: number
  /** Trên nền tối (ánh nến) dùng tông kem sáng hơn. */
  tone?: 'light' | 'dark'
  className?: string
}

/** Hoa baby khô ở góc (hoạ tiết theo mẫu tham khảo 3). Trang trí thuần — ẩn với trình đọc màn hình. */
export function BabysBreath({ corner, variant = 'spray', seed = 7, tone = 'light', className }: BabysBreathProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const { width, height } = SHAPE[variant]
  const { transform, sx, sy } = flip(corner, width, height)
  const data = useMemo(() => bouquet(seed, variant, sx, sy), [seed, variant, sx, sy])

  const layer = (l: Layer) => (
    <>
      <path d={l.base} className={styles.base} />
      <path d={l.dried} className={styles.dried} />
      <path d={l.petals} className={styles.petals} />
      <path d={l.driedPetals} className={styles.driedPetals} />
      <path d={l.light} className={styles.light} />
      <path d={l.centers} className={styles.center} />
    </>
  )

  return (
    <svg
      className={[styles.bouquet, className].filter(Boolean).join(' ')}
      data-corner={corner}
      data-variant={variant}
      data-tone={tone}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      data-anim="bouquet"
    >
      <defs>
        <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id={`${id}-depth`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <g transform={transform}>
        {data.stems.map((d, index) => (
          <path key={index} d={d} className={styles.stem} data-anim="stem" />
        ))}
        <path d={data.twigs} className={styles.twig} data-anim="stem" />
        <g data-anim="bloom">
          <path d={data.shadow} className={styles.shadow} filter={`url(#${id}-soft)`} />
          <g filter={`url(#${id}-depth)`} className={styles.back}>
            {layer(data.back)}
          </g>
          {layer(data.front)}
        </g>
      </g>
    </svg>
  )
}
