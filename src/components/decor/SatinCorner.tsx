import type { CSSProperties } from 'react'
import { useVisibleMotion } from '../../motion/useVisibleMotion'
import styles from './SatinCorner.module.css'

import { SATIN_ASSETS, type DrapeCorner } from './satin.ts'
export type { DrapeCorner } from './satin.ts'

/**
 * Lụa satin + cành lá khuynh diệp nhũ vàng ở góc thiệp, tách từ thiệp mẫu (nền đã tách trong suốt
 * nên lụa nằm tự nhiên trên giấy loang). `index` lệch nhịp đung đưa giữa hai góc.
 */
export function SatinCorner({ corner, index = 0 }: { corner: DrapeCorner; index?: number }) {
  const { ref, active } = useVisibleMotion<HTMLDivElement>()
  const { name, width, height, sizes } = SATIN_ASSETS[corner]
  const src = `${import.meta.env.BASE_URL}images/decor/${name}`
  return (
    <div
      ref={ref}
      className={styles.drape}
      aria-hidden="true"
      data-corner={corner}
      data-anim="drape"
      data-ambient-active={active}
      style={{ '--drape-cycle': `${9 + index * 2}s`, '--drape-delay': `${-index * 3}s` } as CSSProperties}
    >
      <span className={styles.sway}>
        <img className={styles.photo} src={`${src}.webp`}
          srcSet={`${src}-1x.webp ${width}w, ${src}.webp ${width * 2}w, ${src}-3x.webp ${width * 3}w, ${src}-6x.webp ${width * 6}w`}
          sizes={sizes} alt="" loading="lazy" decoding="async" width={width} height={height} />
      </span>
    </div>
  )
}
