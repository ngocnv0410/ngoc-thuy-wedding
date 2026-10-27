import type { CSSProperties } from 'react'
import { useVisibleMotion } from '../../motion/useVisibleMotion'
import styles from './SatinCorner.module.css'

/** Hai góc đối nhau như mẫu thiệp: lụa phủ góc trên trái, lụa cuộn lên ở góc dưới phải. */
export type DrapeCorner = 'top-left' | 'bottom-right'

const ASSET: Record<DrapeCorner, { name: string; width: number; height: number }> = {
  'top-left': { name: 'satin-top', width: 768, height: 1364 },
  'bottom-right': { name: 'satin-bottom', width: 768, height: 959 },
}

/**
 * Lụa satin champagne + cành lá khuynh diệp nhũ vàng ở góc thiệp (ảnh chụp, nền đã tách trong
 * suốt nên lụa nằm tự nhiên trên giấy loang). `index` lệch nhịp đung đưa giữa hai góc.
 */
export function SatinCorner({ corner, index = 0 }: { corner: DrapeCorner; index?: number }) {
  const { ref, active } = useVisibleMotion<HTMLDivElement>()
  const { name, width, height } = ASSET[corner]
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
          srcSet={`${src}-384.webp 384w, ${src}.webp 768w`}
          sizes="(min-width: 1024px) 340px, 40vw"
          alt="" loading="lazy" decoding="async" width={width} height={height} />
      </span>
    </div>
  )
}
