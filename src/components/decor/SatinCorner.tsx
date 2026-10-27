import type { CSSProperties } from 'react'
import { useVisibleMotion } from '../../motion/useVisibleMotion'
import styles from './SatinCorner.module.css'

/** Hai góc đối nhau như mẫu thiệp: lụa phủ góc trên trái, lụa cuộn lên ở góc dưới phải. */
export type DrapeCorner = 'top-left' | 'bottom-right'

/** Kích thước góc theo "px thiệp" (thiệp mẫu rộng 441px); thêm ảnh 2x, 3x đã làm nét cho màn hình dày điểm. */
const ASSET: Record<DrapeCorner, { name: string; width: number; height: number; sizes: string }> = {
  'top-left': { name: 'satin-top', width: 224, height: 277, sizes: '(min-width: 595px) 302px, 51vw' },
  'bottom-right': { name: 'satin-bottom', width: 268, height: 335, sizes: '(min-width: 595px) 362px, 61vw' },
}

/**
 * Lụa satin + cành lá khuynh diệp nhũ vàng ở góc thiệp, tách từ thiệp mẫu (nền đã tách trong suốt
 * nên lụa nằm tự nhiên trên giấy loang). `index` lệch nhịp đung đưa giữa hai góc.
 */
export function SatinCorner({ corner, index = 0 }: { corner: DrapeCorner; index?: number }) {
  const { ref, active } = useVisibleMotion<HTMLDivElement>()
  const { name, width, height, sizes } = ASSET[corner]
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
          srcSet={`${src}-1x.webp ${width}w, ${src}.webp ${width * 2}w, ${src}-3x.webp ${width * 3}w`}
          sizes={sizes} alt="" loading="lazy" decoding="async" width={width} height={height} />
      </span>
    </div>
  )
}
